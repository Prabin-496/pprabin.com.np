/**
 * Splits an audio file into chunks small enough to send to Gemini one at a time.
 *
 * The chunk list is planned up front from metadata only — no audio is read
 * until a chunk is actually about to be uploaded. That is what lets an 8-hour
 * recording be processed on a phone: memory holds one chunk at a time, and the
 * pipeline can stop, resume, and retry individual chunks without redoing work.
 *
 * Three strategies, in order of preference:
 *
 *   aac-remux  .m4a / .mp4 — lifts AAC frames out by byte range and re-frames
 *              them as ADTS. No decoding, so cost is independent of duration.
 *              This is the Voice Memos path and the Safari recording path.
 *   wav-slice  .wav — PCM is contiguous, so a time range is a byte range.
 *   decode     anything else — decodes to 16 kHz mono and re-encodes WAV
 *              chunks. Correct for any format the browser can play, but it
 *              holds the whole decoded signal in memory, so it is capped.
 */

import { ADTS_HEADER_BYTES, looksLikeAdts, parseAudioSpecificConfig, writeAdtsHeader } from './adts';
import type { AacConfig } from './adts';
import { readAudioTrack } from './mp4';
import type { Mp4AudioTrack } from './mp4';
import { encodeWav, readWavFormat, wavHeader } from './wav';

export type SplitStrategy = 'aac-remux' | 'wav-slice' | 'decode';

export interface ChunkSpec {
  index: number;
  startSec: number;
  durationSec: number;
}

export interface SplitPlan {
  strategy: SplitStrategy;
  mimeType: string;
  totalDurationSec: number;
  specs: ChunkSpec[];
  /** Materialises one chunk's bytes. Called just before upload, then dropped. */
  read(spec: ChunkSpec): Promise<Blob>;
  /**
   * Loudness of a chunk in dBFS, from short probes rather than the whole thing,
   * or null when it cannot be measured (no audio decoder available). Used to
   * skip silence without paying a Gemini call for it.
   */
  measureLevel(spec: ChunkSpec): Promise<number | null>;
}

export const DEFAULT_CHUNK_SECONDS = 300;

/** Decoding holds the whole signal in memory; ~2h at 16 kHz mono is ~460 MB. */
const MAX_DECODE_SECONDS = 2 * 60 * 60;
const DECODE_SAMPLE_RATE = 16000;

/** Cap on a single read while remuxing, so memory stays bounded. */
const MAX_RUN_BYTES = 8 * 1024 * 1024;

export class SplitError extends Error {}

/* -------------------------------------------------------------------- sniff */

type Container = 'mp4' | 'wav' | 'other';

async function sniff(file: Blob): Promise<Container> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (head.length < 12) throw new SplitError('That file is too small to contain audio.');

  const ascii = (at: number, len: number) =>
    String.fromCharCode(...head.subarray(at, at + len));

  if (ascii(4, 4) === 'ftyp') return 'mp4';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') return 'wav';
  return 'other';
}

/* -------------------------------------------------------------------- level */

/** Probes per chunk, and how much audio each one covers. */
const PROBE_COUNT = 3;
const PROBE_SECONDS = 2;

/** Anything quieter than this is silence in any recording setup. */
const ABSOLUTE_SILENCE_DBFS = -58;

/**
 * How far below the loudest part of a recording a chunk has to be before it is
 * treated as silence. Speech in a meeting varies by maybe 15 dB between the
 * person next to you and someone across the table; 28 dB is comfortably past
 * that, so a quiet speaker is never mistaken for an empty room.
 */
const RELATIVE_SILENCE_DB = 28;

/**
 * One AudioContext, reused for every decode.
 *
 * Measuring an 8-hour file means a few hundred short decodes. Browsers cap how
 * many AudioContexts may exist at once (Safari is stricter than most), and
 * creating one per probe would hit that limit partway through the scan.
 * decodeAudioData does not need a running context, so a single suspended one
 * serves them all.
 */
let decodeContext: AudioContext | null | undefined;

function sharedDecodeContext(): AudioContext | null {
  if (decodeContext !== undefined) return decodeContext;

  const Ctor =
    typeof window === 'undefined'
      ? null
      : window.AudioContext || (window as any).webkitAudioContext || null;

  decodeContext = Ctor ? new Ctor() : null;
  return decodeContext;
}

/**
 * Loudness of a signal in dBFS, taken as the 90th percentile of short-window
 * RMS rather than the mean.
 *
 * A plain average over five minutes is dominated by the pauses between
 * sentences, so a chunk containing real speech can average down to something
 * that looks like silence. Taking a high percentile of 250 ms windows asks the
 * useful question instead: was anyone talking at any point in here?
 */
function levelDbfs(samples: Float32Array, sampleRate: number): number {
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.25));
  const levels: number[] = [];

  for (let start = 0; start + windowSize <= samples.length; start += windowSize) {
    let sum = 0;
    for (let i = start; i < start + windowSize; i++) sum += samples[i] * samples[i];
    levels.push(Math.sqrt(sum / windowSize));
  }

  if (!levels.length) return -Infinity;
  levels.sort((a, b) => a - b);
  const rms = levels[Math.min(levels.length - 1, Math.floor(levels.length * 0.9))];
  return rms > 0 ? 20 * Math.log10(rms) : -Infinity;
}

/** Evenly spaced probe windows across a range, as [start, end) index pairs. */
function probeWindows(first: number, count: number, windowLength: number): [number, number][] {
  if (count <= windowLength * PROBE_COUNT) return [[first, first + count]];

  const windows: [number, number][] = [];
  for (let i = 0; i < PROBE_COUNT; i++) {
    const at = first + Math.floor(((i + 0.5) / PROBE_COUNT) * count) - Math.floor(windowLength / 2);
    windows.push([Math.max(first, at), Math.min(first + count, Math.max(first, at) + windowLength)]);
  }
  return windows;
}

async function decodeLevel(blob: Blob): Promise<number | null> {
  const ctx = sharedDecodeContext();
  if (!ctx) return null;

  try {
    const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    return levelDbfs(buffer.getChannelData(0), buffer.sampleRate);
  } catch {
    return null; // undecodable probe: treated as unknown, which means "send it"
  }
}

/** Decides the silence cutoff for one recording from its own loudest chunks. */
export function silenceThreshold(levels: (number | null)[]): number {
  const measured = levels.filter((level): level is number => level !== null && isFinite(level));
  if (!measured.length) return -Infinity;

  const sorted = [...measured].sort((a, b) => a - b);
  const loudest = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  return Math.max(ABSOLUTE_SILENCE_DBFS, loudest - RELATIVE_SILENCE_DB);
}

/* ---------------------------------------------------------------- aac remux */

function planAacChunks(track: Mp4AudioTrack, chunkSeconds: number) {
  const specs: ChunkSpec[] = [];
  const ranges: { first: number; last: number }[] = [];

  let first = 0;
  for (let i = 1; i <= track.sampleCount; i++) {
    const atEnd = i === track.sampleCount;
    const elapsed = atEnd ? Infinity : track.startTimes[i] - track.startTimes[first];
    if (!atEnd && elapsed < chunkSeconds) continue;

    const startSec = track.startTimes[first];
    const endSec = atEnd ? track.durationSec || track.startTimes[i - 1] : track.startTimes[i];

    specs.push({ index: specs.length, startSec, durationSec: Math.max(0, endSec - startSec) });
    ranges.push({ first, last: i - 1 });
    first = i;
  }

  return { specs, ranges };
}

async function readAacFrames(
  file: Blob,
  track: Mp4AudioTrack,
  config: AacConfig,
  range: { first: number; last: number }
): Promise<Blob> {
  let outSize = 0;
  for (let i = range.first; i <= range.last; i++) outSize += track.sizes[i] + ADTS_HEADER_BYTES;

  const out = new Uint8Array(new ArrayBuffer(outSize));
  let outPos = 0;
  let i = range.first;

  while (i <= range.last) {
    // Frames written back to back in the file are read in one go; a plain
    // recording is almost entirely contiguous, so this is a handful of reads.
    const runStart = track.offsets[i];
    let runEnd = runStart + track.sizes[i];
    let last = i;

    while (
      last + 1 <= range.last &&
      track.offsets[last + 1] === runEnd &&
      runEnd - runStart + track.sizes[last + 1] <= MAX_RUN_BYTES
    ) {
      last++;
      runEnd += track.sizes[last];
    }

    const run = new Uint8Array(await file.slice(runStart, runEnd).arrayBuffer());
    let runPos = 0;

    for (let k = i; k <= last; k++) {
      const size = track.sizes[k];
      writeAdtsHeader(out, outPos, config, size);
      outPos += ADTS_HEADER_BYTES;
      out.set(run.subarray(runPos, runPos + size), outPos);
      outPos += size;
      runPos += size;
    }

    i = last + 1;
  }

  return new Blob([out], { type: 'audio/aac' });
}

async function planAac(file: Blob, chunkSeconds: number): Promise<SplitPlan> {
  const track = await readAudioTrack(file);

  if (track.format !== 'mp4a' || !track.asc) {
    // ALAC (Voice Memos set to Lossless) and anything exotic land here.
    throw new SplitError(`Track is ${track.format}, not AAC`);
  }

  const config = parseAudioSpecificConfig(track.asc);
  const { specs, ranges } = planAacChunks(track, chunkSeconds);
  if (!specs.length) throw new SplitError('Recording contains no audio frames');

  // Frames per probe window, from the track's own frame duration.
  const framesPerSecond = track.sampleCount / Math.max(1, track.durationSec);
  const probeFrames = Math.max(8, Math.round(framesPerSecond * PROBE_SECONDS));

  return {
    strategy: 'aac-remux',
    mimeType: 'audio/aac',
    totalDurationSec: track.durationSec || specs[specs.length - 1].startSec,
    specs,
    read: (spec) => readAacFrames(file, track, config, ranges[spec.index]),

    /**
     * Only a few seconds out of each five-minute chunk are decoded. AAC frames
     * are independently decodable and the exact frame offsets are known, so a
     * probe is a valid little ADTS stream rather than a truncated one — which
     * is what makes measuring an 8-hour file affordable at all.
     */
    async measureLevel(spec) {
      const range = ranges[spec.index];
      const windows = probeWindows(range.first, range.last - range.first + 1, probeFrames);
      let loudest = -Infinity;

      for (const [from, to] of windows) {
        const level = await decodeLevel(
          await readAacFrames(file, track, config, { first: from, last: to - 1 })
        );
        if (level === null) return null;
        loudest = Math.max(loudest, level);
      }
      return loudest;
    },
  };
}

/**
 * Confirms the remuxed output is really decodable before committing a long job
 * to it. A malformed header would otherwise show up as Gemini returning empty
 * transcripts for every chunk, which is a miserable way to find out.
 */
async function verifyAacPlan(plan: SplitPlan): Promise<void> {
  const probe = await plan.read(plan.specs[0]);
  const head = new Uint8Array(await probe.slice(0, 16).arrayBuffer());
  if (!looksLikeAdts(head)) throw new SplitError('Remuxed audio has no ADTS syncword');

  // Decode only the first slice: enough to prove the framing, cheap enough to
  // throw away. Some browsers reject a truncated tail, so failure here is not
  // treated as fatal on its own — the syncword check above is the hard gate.
  const ctx = sharedDecodeContext();
  if (!ctx) return; // no decoder available (tests, or a very old browser)

  try {
    await ctx.decodeAudioData(
      await probe.slice(0, Math.min(probe.size, 256 * 1024)).arrayBuffer()
    );
  } catch {
    /* tolerated — see above */
  }
}

/* ---------------------------------------------------------------- wav slice */

async function planWav(file: Blob, chunkSeconds: number): Promise<SplitPlan> {
  const format = await readWavFormat(file);
  const bytesPerSecond = format.sampleRate * format.blockAlign;
  if (!bytesPerSecond) throw new SplitError('WAV header has no usable sample rate');

  const totalDurationSec = format.dataLength / bytesPerSecond;
  const specs: ChunkSpec[] = [];

  for (let start = 0; start < totalDurationSec; start += chunkSeconds) {
    specs.push({
      index: specs.length,
      startSec: start,
      durationSec: Math.min(chunkSeconds, totalDurationSec - start),
    });
  }

  const readChunk = async (spec: ChunkSpec): Promise<Blob> => {
    // Align to a whole frame, or the chunk starts mid-sample and sounds torn.
    const rawStart = Math.floor(spec.startSec * bytesPerSecond);
    const byteStart = format.dataStart + rawStart - (rawStart % format.blockAlign);
    const byteEnd = Math.min(
      format.dataStart + format.dataLength,
      byteStart + Math.ceil(spec.durationSec * bytesPerSecond)
    );
    const body = file.slice(byteStart, byteEnd);
    return new Blob([wavHeader(format, body.size), body], { type: 'audio/wav' });
  };

  return {
    strategy: 'wav-slice',
    mimeType: 'audio/wav',
    totalDurationSec,
    specs,
    read: readChunk,

    // PCM needs no decoder: the samples are already sitting there.
    async measureLevel(spec) {
      if (format.bitsPerSample !== 16) return decodeLevel(await readChunk(spec));

      const windowBytes = format.sampleRate * format.blockAlign * PROBE_SECONDS;
      const chunkStart = format.dataStart + Math.floor(spec.startSec * bytesPerSecond);
      const chunkBytes = Math.floor(spec.durationSec * bytesPerSecond);
      let loudest = -Infinity;

      for (const [from, to] of probeWindows(chunkStart, chunkBytes, windowBytes)) {
        const view = new DataView(await file.slice(from, to).arrayBuffer());
        const count = Math.floor(view.byteLength / 2 / format.channels);
        const samples = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          samples[i] = view.getInt16(i * format.blockAlign, true) / 32768;
        }
        loudest = Math.max(loudest, levelDbfs(samples, format.sampleRate));
      }
      return loudest;
    },
  };
}

/* ------------------------------------------------------------------- decode */

async function planDecode(file: Blob, chunkSeconds: number): Promise<SplitPlan> {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: DECODE_SAMPLE_RATE,
  });

  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    throw new SplitError('This audio format could not be read by your browser.');
  } finally {
    void ctx.close();
  }

  if (buffer.duration > MAX_DECODE_SECONDS) {
    throw new SplitError(
      `This ${Math.round(buffer.duration / 60)} minute file is in a format that has to be ` +
        `decoded in full, which will not fit in memory. Re-record with Voice Memos set to ` +
        `Compressed (Settings → Voice Memos → Audio Quality), or convert it to .m4a first.`
    );
  }

  // Mono mixdown up front; keeping every channel doubles memory for no gain,
  // since speech recognition works from a single channel.
  const mono = mixToMono(buffer);
  const rate = buffer.sampleRate;
  const specs: ChunkSpec[] = [];

  for (let start = 0; start < buffer.duration; start += chunkSeconds) {
    specs.push({
      index: specs.length,
      startSec: start,
      durationSec: Math.min(chunkSeconds, buffer.duration - start),
    });
  }

  return {
    strategy: 'decode',
    mimeType: 'audio/wav',
    totalDurationSec: buffer.duration,
    specs,
    async read(spec) {
      const from = Math.floor(spec.startSec * rate);
      const to = Math.min(mono.length, Math.ceil((spec.startSec + spec.durationSec) * rate));
      return encodeWav(mono.subarray(from, to), rate);
    },

    async measureLevel(spec) {
      const from = Math.floor(spec.startSec * rate);
      const to = Math.min(mono.length, Math.ceil((spec.startSec + spec.durationSec) * rate));
      return levelDbfs(mono.subarray(from, to), rate);
    },
  };
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);

  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < channel.length; i++) mono[i] += channel[i];
  }
  for (let i = 0; i < mono.length; i++) mono[i] /= buffer.numberOfChannels;
  return mono;
}

/* -------------------------------------------------------------- entry point */

/**
 * Converts one freshly recorded segment into something Gemini accepts inline.
 *
 * Safari's MediaRecorder only produces MP4, which is not one of Gemini's inline
 * audio types, so an MP4 segment is remuxed to ADTS by the same path an
 * imported Voice Memo takes. Chrome's WebM/Opus is accepted as-is. Anything
 * that cannot be remuxed is passed through unchanged rather than dropped — a
 * segment Gemini might reject is still better than one thrown away.
 */
export async function normaliseSegment(
  blob: Blob,
  mimeType: string
): Promise<{ blob: Blob; mimeType: string }> {
  if ((await sniff(blob)) !== 'mp4') return { blob, mimeType: mimeType || blob.type || 'audio/webm' };

  try {
    // One chunk covering the whole segment: no splitting, just re-framing.
    const plan = await planAac(blob, Number.MAX_SAFE_INTEGER);
    return { blob: await plan.read(plan.specs[0]), mimeType: 'audio/aac' };
  } catch (err) {
    console.warn('[split] could not remux recorded segment, sending as captured:', err);
    return { blob, mimeType: mimeType || 'audio/mp4' };
  }
}

export async function planSplit(
  file: Blob,
  chunkSeconds: number = DEFAULT_CHUNK_SECONDS
): Promise<SplitPlan> {
  const container = await sniff(file);

  if (container === 'mp4') {
    try {
      const plan = await planAac(file, chunkSeconds);
      await verifyAacPlan(plan);
      return plan;
    } catch (err) {
      if (err instanceof SplitError && /no audio frames/.test(err.message)) throw err;
      // Remuxing is an optimisation, not a requirement — fall through and decode.
      console.warn('[split] AAC remux unavailable, decoding instead:', err);
    }
  }

  if (container === 'wav') {
    try {
      return await planWav(file, chunkSeconds);
    } catch (err) {
      console.warn('[split] WAV slicing unavailable, decoding instead:', err);
    }
  }

  return planDecode(file, chunkSeconds);
}
