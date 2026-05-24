/** Chunked MediaRecorder — saves ~45s segments for long sessions */

export type RecorderState = 'idle' | 'recording' | 'paused';

export interface ChunkHandler {
  (blob: Blob, index: number): void | Promise<void>;
}

const CHUNK_MS = 45_000;

export class ChunkedRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private rafId = 0;
  private chunkIndex = 0;
  private chunkTimer: ReturnType<typeof setInterval> | null = null;
  private onChunk: ChunkHandler;
  private onLevel: (levels: number[]) => void;
  mimeType = 'audio/webm';

  state: RecorderState = 'idle';

  constructor(onChunk: ChunkHandler, onLevel: (levels: number[]) => void) {
    this.onChunk = onChunk;
    this.onLevel = onLevel;
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') return;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    const source = this.audioContext.createMediaStreamSource(this.stream);
    source.connect(this.analyser);
    this.startSegment();
    this.state = 'recording';
    this.drawLevels();
    this.chunkTimer = setInterval(() => this.rotateSegment(), CHUNK_MS);
  }

  pause(): void {
    if (this.state !== 'recording' || !this.recorder) return;
    this.recorder.pause();
    this.state = 'paused';
    if (this.chunkTimer) clearInterval(this.chunkTimer);
    this.chunkTimer = null;
  }

  resume(): void {
    if (this.state !== 'paused' || !this.recorder) return;
    this.recorder.resume();
    this.state = 'recording';
    this.chunkTimer = setInterval(() => this.rotateSegment(), CHUNK_MS);
  }

  async stop(): Promise<void> {
    if (this.state === 'idle') return;
    if (this.chunkTimer) clearInterval(this.chunkTimer);
    this.chunkTimer = null;
    await this.finishSegment();
    this.cleanup();
    this.state = 'idle';
    this.chunkIndex = 0;
  }

  private startSegment(): void {
    if (!this.stream) return;
    const options: MediaRecorderOptions = {};
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    }
    this.recorder = new MediaRecorder(this.stream, options);
    this.mimeType = this.recorder.mimeType || 'audio/webm';
    const chunks: Blob[] = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    this.recorder.onstop = async () => {
      if (chunks.length) {
        const blob = new Blob(chunks, { type: this.mimeType });
        const idx = this.chunkIndex++;
        await this.onChunk(blob, idx);
      }
    };
    this.recorder.start(1000);
  }

  private async finishSegment(): Promise<void> {
    if (!this.recorder || this.recorder.state === 'inactive') return;
    return new Promise((resolve) => {
      const r = this.recorder!;
      r.addEventListener('stop', () => resolve(), { once: true });
      r.stop();
    });
  }

  private async rotateSegment(): Promise<void> {
    if (this.state !== 'recording') return;
    await this.finishSegment();
    this.startSegment();
  }

  private drawLevels(): void {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const bars = 32;
    const step = Math.max(1, Math.floor(data.length / bars));
    const levels: number[] = [];
    for (let i = 0; i < bars; i++) {
      levels.push(data[i * step] / 255);
    }
    this.onLevel(levels);
    this.rafId = requestAnimationFrame(() => this.drawLevels());
  }

  private cleanup(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.recorder = null;
  }
}
