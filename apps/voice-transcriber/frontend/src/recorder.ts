/**
 * Live in-app recorder.
 *
 * Read this before relying on it: **iOS cannot record in the background.** The
 * moment Safari is backgrounded or the screen locks, iOS ends the microphone
 * track and suspends the AudioContext. That is a deliberate platform privacy
 * restriction with no web-facing workaround, and it applies to installed PWAs
 * too. This recorder is for a meeting where the phone can stay awake with the
 * app open. For a full workday, record with Voice Memos and import the file —
 * that path has none of these limits.
 *
 * Given that, the design is about surviving interruption rather than preventing
 * it:
 *
 *   - Segments rotate on an audio-thread sample count, never on setInterval,
 *     which browsers throttle the moment focus is lost.
 *   - A Screen Wake Lock is held, and re-acquired after every interruption,
 *     since iOS drops it on visibility change.
 *   - If the track dies anyway, the session is marked with a gap and recording
 *     resumes automatically when the app comes back — the recording continues
 *     rather than silently stopping.
 *   - Every completed segment is handed over immediately, so an interruption
 *     costs at most the segment in progress.
 */

export type RecorderState = 'idle' | 'recording' | 'paused' | 'interrupted';

export interface RecorderSegment {
  index: number;
  blob: Blob;
  mimeType: string;
  startSec: number;
  durationSec: number;
  /** True when audio was lost before this segment because the app was suspended. */
  gapBefore: boolean;
}

export interface RecorderEvents {
  onSegment(segment: RecorderSegment): void | Promise<void>;
  onLevel(rms: number, peak: number): void;
  onStateChange(state: RecorderState, detail?: string): void;
}

/** Roughly one Gemini call per segment; matches the import chunk size. */
const DEFAULT_SEGMENT_SECONDS = 300;

/** Low bitrate on purpose: speech, and it keeps each upload small. */
const AUDIO_BITS_PER_SECOND = 32000;

export class LiveRecorder {
  state: RecorderState = 'idle';
  mimeType = 'audio/mp4';

  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private context: AudioContext | null = null;
  private clock: AudioWorkletNode | null = null;
  private fallbackTimer: ReturnType<typeof setInterval> | null = null;
  private wakeLock: WakeLockSentinel | null = null;

  private segmentIndex = 0;
  /** Resolves once the current segment has been handed to onSegment. */
  private segmentHandled: Promise<void> = Promise.resolve();
  private elapsedSec = 0;
  private segmentStartedAt = 0;
  private pendingGap = false;
  private readonly segmentSeconds: number;
  private readonly events: RecorderEvents;

  constructor(events: RecorderEvents, segmentSeconds = DEFAULT_SEGMENT_SECONDS) {
    this.events = events;
    this.segmentSeconds = segmentSeconds;
    this.handleVisibility = this.handleVisibility.bind(this);
  }

  /** Total audio captured so far, excluding any interrupted gaps. */
  get elapsedSeconds(): number {
    return this.elapsedSec + (this.segmentStartedAt ? (Date.now() - this.segmentStartedAt) / 1000 : 0);
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') return;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    await this.startClock();
    this.startSegment();
    this.setState('recording');

    document.addEventListener('visibilitychange', this.handleVisibility);
    this.watchTrack();
    void this.acquireWakeLock();
  }

  pause(): void {
    if (this.state !== 'recording' || !this.recorder) return;
    this.recorder.pause();
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused' || !this.recorder) return;
    this.recorder.resume();
    this.setState('recording');
  }

  async stop(): Promise<void> {
    if (this.state === 'idle') return;
    document.removeEventListener('visibilitychange', this.handleVisibility);
    await this.finishSegment();
    // onstop fires synchronously but hands the blob over asynchronously, so
    // without this the caller could start processing before the last segment
    // has been written — losing the end of the recording.
    await this.segmentHandled;
    await this.teardown();
    this.setState('idle');
  }

  /* ------------------------------------------------------------------ clock */

  private async startClock(): Promise<void> {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new Ctor();
    if (this.context.state === 'suspended') await this.context.resume();

    const source = this.context.createMediaStreamSource(this.stream!);

    try {
      // Served as a real file rather than bundled: Vite would inline a small
      // module as a data: URL, and Safari refuses those in addModule().
      await this.context.audioWorklet.addModule(`${import.meta.env.BASE_URL}segment-clock.js`);
      this.clock = new AudioWorkletNode(this.context, 'segment-clock', {
        numberOfOutputs: 1,
        processorOptions: { segmentSeconds: this.segmentSeconds },
      });
      this.clock.port.onmessage = (event) => this.onClockMessage(event.data);

      // A worklet only runs while it is part of a live graph, so it is routed
      // to the speakers through a silent gain node rather than left dangling.
      const silence = this.context.createGain();
      silence.gain.value = 0;
      source.connect(this.clock).connect(silence).connect(this.context.destination);
    } catch (err) {
      // No AudioWorklet: fall back to a timer. Less reliable in a background
      // tab, but this recorder is a foreground tool anyway.
      console.warn('[recorder] AudioWorklet unavailable, using a timer', err);
      this.fallbackTimer = setInterval(() => void this.rotate(), this.segmentSeconds * 1000);
    }
  }

  private onClockMessage(data: { type: string; rms?: number; peak?: number }): void {
    if (data.type === 'level') {
      this.events.onLevel(data.rms || 0, data.peak || 0);
      return;
    }
    if (data.type === 'segment' && this.state === 'recording') void this.rotate();
  }

  /* -------------------------------------------------------------- segments */

  private startSegment(): void {
    if (!this.stream) return;

    const options: MediaRecorderOptions = { audioBitsPerSecond: AUDIO_BITS_PER_SECOND };
    for (const candidate of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']) {
      if (MediaRecorder.isTypeSupported?.(candidate)) {
        options.mimeType = candidate;
        break;
      }
    }

    const recorder = new MediaRecorder(this.stream, options);
    this.recorder = recorder;
    this.mimeType = recorder.mimeType || options.mimeType || 'audio/mp4';

    const parts: Blob[] = [];
    const index = this.segmentIndex++;
    const startSec = this.elapsedSec;
    const gapBefore = this.pendingGap;
    this.pendingGap = false;
    this.segmentStartedAt = Date.now();

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) parts.push(event.data);
    };

    recorder.onstop = () => {
      const durationSec = (Date.now() - this.segmentStartedAt) / 1000;
      this.elapsedSec += durationSec;
      this.segmentStartedAt = 0;
      if (!parts.length) return;

      this.segmentHandled = Promise.resolve(
        this.events.onSegment({
          index,
          blob: new Blob(parts, { type: this.mimeType }),
          mimeType: this.mimeType,
          startSec,
          durationSec,
          gapBefore,
        })
      ).catch((err) => {
        console.error('[recorder] segment handler failed', err);
      });
    };

    // A one-second timeslice means an unexpected kill loses a second, not a
    // whole segment: the parts collected so far are still in memory.
    recorder.start(1000);
  }

  private finishSegment(): Promise<void> {
    const recorder = this.recorder;
    if (!recorder || recorder.state === 'inactive') return Promise.resolve();

    return new Promise((resolve) => {
      recorder.addEventListener('stop', () => resolve(), { once: true });
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });
  }

  private async rotate(): Promise<void> {
    if (this.state !== 'recording') return;
    await this.finishSegment();
    if (this.state === 'recording') this.startSegment();
  }

  /** Waits for any segment still being written, without stopping the recorder. */
  async flush(): Promise<void> {
    await this.segmentHandled;
  }

  /* --------------------------------------------------------- interruptions */

  /**
   * iOS ends the track rather than muting it when the app is backgrounded, so
   * this is the signal that audio has actually been lost.
   */
  private watchTrack(): void {
    const track = this.stream?.getAudioTracks()[0];
    if (!track) return;

    track.addEventListener('ended', () => {
      if (this.state === 'idle') return;
      this.pendingGap = true;
      this.setState('interrupted', 'The microphone was cut off — probably the screen locked.');
      void this.finishSegment();
    });
  }

  private async handleVisibility(): Promise<void> {
    if (document.visibilityState !== 'visible') return;

    await this.acquireWakeLock();
    if (this.state !== 'interrupted') {
      if (this.context?.state === 'suspended') await this.context.resume();
      return;
    }

    // Coming back from an interruption: the old track is dead, so a fresh one
    // is opened and recording continues under the same session.
    try {
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
      await this.context?.resume();
      this.watchTrack();
      this.startSegment();
      this.setState('recording', 'Recording resumed. The time you were away was not captured.');
    } catch (err) {
      this.setState('interrupted', `Could not restart the microphone: ${(err as Error).message}`);
    }
  }

  private async acquireWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator) || this.state === 'idle') return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      // Denied when the battery is low or the page is hidden; not worth surfacing.
    }
  }

  private async teardown(): Promise<void> {
    if (this.fallbackTimer) clearInterval(this.fallbackTimer);
    this.fallbackTimer = null;

    try {
      await this.wakeLock?.release();
    } catch {
      /* already gone */
    }
    this.wakeLock = null;

    this.clock?.port.close();
    this.clock = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    await this.context?.close().catch(() => {});
    this.context = null;
    this.recorder = null;
    this.segmentIndex = 0;
    this.elapsedSec = 0;
    this.segmentStartedAt = 0;
  }

  private setState(state: RecorderState, detail?: string): void {
    this.state = state;
    this.events.onStateChange(state, detail);
  }
}

/** True on iOS/iPadOS, where background recording is impossible. */
export function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}
