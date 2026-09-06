/**
 * Checks the audio splitter against real files, outside a browser.
 *
 * The splitter is the piece that has to be right for an 8-hour import to work
 * at all, and it is the hardest to eyeball: it re-frames AAC by byte offset, so
 * an error shows up as silently empty transcripts rather than a crash. This
 * runs each fixture through planSplit() and then hands the chunks to ffmpeg to
 * prove they are genuinely decodable and the right length.
 *
 *   node scripts/check-split.mjs <file.m4a> [more files…]
 *
 * Requires ffmpeg/ffprobe on PATH.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';

const CHUNK_SECONDS = 300;
const TOLERANCE_SECONDS = 1.0;

let failures = 0;

function fail(message) {
  console.error(`  ✗ ${message}`);
  failures++;
}

function pass(message) {
  console.log(`  ✓ ${message}`);
}

/**
 * Duration measured by actually decoding, not by reading a header.
 *
 * A raw ADTS stream carries no duration field, so ffprobe estimates one from
 * the bitrate — which is wrong by seconds on a VBR file and made this check
 * report phantom failures. Counting decoded samples is exact.
 */
function decodedSeconds(path) {
  const pcm = execFileSync('sh', [
    '-c',
    `ffmpeg -v error -i ${JSON.stringify(path)} -f s16le -ac 1 -ar 48000 - | wc -c`,
  ]);
  return Number(String(pcm).trim()) / 2 / 48000;
}

/**
 * A minimal AudioContext backed by ffmpeg.
 *
 * The splitter measures loudness with decodeAudioData, which Node does not
 * have. Shimming it here means the silence detection is exercised for real —
 * probe extraction, decoding and the dBFS maths — rather than being skipped in
 * tests and only running for the first time on a phone.
 */
function installAudioShim() {
  const dir = mkdtempSync(join(tmpdir(), 'split-decode-'));
  let counter = 0;

  class FfmpegAudioContext {
    async decodeAudioData(arrayBuffer) {
      const input = join(dir, `probe-${counter++}.bin`);
      writeFileSync(input, Buffer.from(arrayBuffer));
      const raw = execFileSync('ffmpeg', [
        '-v', 'error', '-i', input, '-f', 'f32le', '-ac', '1', '-ar', '44100', '-',
      ], { maxBuffer: 1 << 28 });
      rmSync(input, { force: true });
      if (!raw.length) throw new Error('decode produced no samples');

      const samples = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
      return { sampleRate: 44100, numberOfChannels: 1, getChannelData: () => samples };
    }

    close() {}
  }

  globalThis.window = { AudioContext: FfmpegAudioContext };
  return () => rmSync(dir, { recursive: true, force: true });
}

/** Bundles the TypeScript splitter into something Node can import. */
async function loadSplitter() {
  const dir = mkdtempSync(join(tmpdir(), 'split-check-'));
  const outfile = join(dir, 'split.mjs');
  await build({
    entryPoints: ['src/split/index.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    logLevel: 'error',
  });
  return { module: await import(outfile), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

async function checkFile(planSplit, path) {
  console.log(`\n${path}`);
  const bytes = readFileSync(path);
  const file = new Blob([bytes]);
  const actualDuration = decodedSeconds(path);

  const started = Date.now();
  const plan = await planSplit(file, CHUNK_SECONDS);
  const planMs = Date.now() - started;

  console.log(
    `  strategy=${plan.strategy} chunks=${plan.specs.length} ` +
      `duration=${plan.totalDurationSec.toFixed(1)}s planned in ${planMs}ms`
  );

  // Planning must not depend on file length — that is the whole point of
  // remuxing rather than decoding.
  if (plan.strategy === 'aac-remux' && planMs > 3000) {
    fail(`planning took ${planMs}ms; it should be near-instant for a remux`);
  }

  if (Math.abs(plan.totalDurationSec - actualDuration) > TOLERANCE_SECONDS) {
    fail(`plan says ${plan.totalDurationSec.toFixed(2)}s, decoding says ${actualDuration.toFixed(2)}s`);
  } else {
    pass(`duration matches the decoded file (${actualDuration.toFixed(2)}s)`);
  }

  // Rounded down by a hair: a 7200.02s file is 24 chunks of 300s, not 25.
  const expectedChunks = Math.max(1, Math.ceil((actualDuration - TOLERANCE_SECONDS) / CHUNK_SECONDS));
  if (plan.specs.length !== expectedChunks) {
    fail(`expected ${expectedChunks} chunks, got ${plan.specs.length}`);
  } else {
    pass(`${plan.specs.length} chunks of ~${CHUNK_SECONDS}s`);
  }

  const dir = mkdtempSync(join(tmpdir(), 'split-chunks-'));
  let summed = 0;

  try {
    for (const spec of plan.specs) {
      const blob = await plan.read(spec);
      const buffer = Buffer.from(await blob.arrayBuffer());

      if (plan.strategy === 'aac-remux') {
        // Every ADTS frame starts with a 12-bit syncword; without it no decoder
        // will touch the stream.
        if (buffer[0] !== 0xff || (buffer[1] & 0xf0) !== 0xf0) {
          fail(`chunk ${spec.index} does not start with an ADTS syncword`);
          continue;
        }
      }

      const ext = plan.mimeType === 'audio/aac' ? 'aac' : 'wav';
      const chunkPath = join(dir, `chunk-${spec.index}.${ext}`);
      writeFileSync(chunkPath, buffer);

      let decoded;
      try {
        decoded = decodedSeconds(chunkPath);
      } catch {
        fail(`chunk ${spec.index} could not be decoded`);
        continue;
      }
      if (!decoded) {
        fail(`chunk ${spec.index} decoded to silence of zero length`);
        continue;
      }

      summed += decoded;

      if (Math.abs(decoded - spec.durationSec) > TOLERANCE_SECONDS) {
        fail(
          `chunk ${spec.index}: planned ${spec.durationSec.toFixed(2)}s, ` +
            `decoded ${decoded.toFixed(2)}s`
        );
      }
    }

    await checkLevels(plan);

    if (Math.abs(summed - actualDuration) > TOLERANCE_SECONDS * 2) {
      fail(`chunks total ${summed.toFixed(2)}s but the file is ${actualDuration.toFixed(2)}s — audio was lost`);
    } else {
      pass(`all chunks decode; total ${summed.toFixed(2)}s, nothing lost`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Reports the measured level of every chunk and which ones would be skipped.
 * Expectations differ per fixture, so this prints rather than asserts — except
 * for the two cases that are always wrong: measuring nothing, or skipping
 * everything.
 */
async function checkLevels(plan) {
  const levels = [];
  for (const spec of plan.specs) {
    try {
      levels.push(await plan.measureLevel(spec));
    } catch {
      levels.push(null);
    }
  }

  const measured = levels.filter((level) => level !== null && Number.isFinite(level));
  if (!measured.length) {
    fail('no chunk levels could be measured — silence detection is inert');
    return;
  }

  const threshold = silenceThresholdOf(levels);
  const skipped = levels.filter((level) => level !== null && level < threshold).length;

  console.log(
    `  levels ${Math.min(...measured).toFixed(1)}..${Math.max(...measured).toFixed(1)} dBFS, ` +
      `threshold ${threshold.toFixed(1)} dBFS → would skip ${skipped}/${plan.specs.length}`
  );

  if (skipped === plan.specs.length) {
    fail('every chunk was classed as silence');
  } else {
    pass(`${plan.specs.length - skipped} chunk(s) would be sent to Gemini`);
  }
}

let silenceThresholdOf = () => -Infinity;

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node scripts/check-split.mjs <audio file> [...]');
  process.exit(2);
}

const removeShim = installAudioShim();
const { module, cleanup } = await loadSplitter();
silenceThresholdOf = module.silenceThreshold;

try {
  for (const path of files) await checkFile(module.planSplit, path);
} finally {
  cleanup();
  removeShim();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
