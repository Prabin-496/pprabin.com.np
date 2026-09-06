/**
 * Minimal MP4/M4A reader — enough to locate an audio track's sample table.
 *
 * The point of this file is that an 8-hour Voice Memo can never be decoded in
 * the browser: 8 hours of mono 16 kHz float32 is ~1.8 GB and iOS Safari kills
 * the tab long before that. But a .m4a is just AAC frames sitting inside an MP4
 * container, so the frames can be lifted out by byte range and re-wrapped
 * without touching a decoder. Memory stays flat no matter how long the file is,
 * because samples are read straight off the File with Blob.slice().
 *
 * Only what that job needs is parsed: the sample table (stts/stsc/stsz/stco)
 * and the decoder config. No video, no edit lists, no fragmented MP4.
 */

export interface Mp4AudioTrack {
  /** Four-character codec from stsd — 'mp4a' is the only one we can remux. */
  format: string;
  timescale: number;
  durationSec: number;
  /** AudioSpecificConfig from the esds box; needed to build ADTS headers. */
  asc: Uint8Array | null;
  sampleRate: number;
  channels: number;
  sampleCount: number;
  /** Per-sample byte offset into the file. Float64 because files exceed 2^32/4. */
  offsets: Float64Array;
  sizes: Uint32Array;
  /** Per-sample start time in seconds from the beginning of the track. */
  startTimes: Float64Array;
}

export class NotAnMp4Error extends Error {}
export class UnsupportedTrackError extends Error {}

const HEADER_SCAN_BYTES = 32;

interface BoxHeader {
  type: string;
  /** Offset of the first byte of the box, including its header. */
  start: number;
  /** Total size of the box including its header. */
  size: number;
  headerSize: number;
}

async function readSlice(file: Blob, start: number, end: number): Promise<DataView> {
  const buf = await file.slice(start, Math.min(end, file.size)).arrayBuffer();
  return new DataView(buf);
}

function typeAt(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

/**
 * Walks the top-level boxes by seeking header to header. QuickTime — and so
 * Voice Memos — usually writes `moov` *after* the audio data, so this cannot
 * assume the metadata is near the front.
 */
async function findTopLevelBox(file: Blob, wanted: string): Promise<BoxHeader | null> {
  let pos = 0;

  while (pos + 8 <= file.size) {
    const view = await readSlice(file, pos, pos + HEADER_SCAN_BYTES);
    if (view.byteLength < 8) return null;

    let size = view.getUint32(0);
    const type = typeAt(view, 4);
    let headerSize = 8;

    if (size === 1) {
      if (view.byteLength < 16) return null;
      // 64-bit largesize. getBigUint64 keeps files over 4 GB honest.
      size = Number(view.getBigUint64(8));
      headerSize = 16;
    } else if (size === 0) {
      size = file.size - pos; // box runs to end of file
    }

    if (size < headerSize) return null; // malformed; refuse to loop forever
    if (type === wanted) return { type, start: pos, size, headerSize };
    pos += size;
  }

  return null;
}

/** Iterates the child boxes contained in [start, end) of an already-read buffer. */
function* children(view: DataView, start: number, end: number): Generator<BoxHeader> {
  let pos = start;
  while (pos + 8 <= end) {
    let size = view.getUint32(pos);
    const type = typeAt(view, pos + 4);
    let headerSize = 8;

    if (size === 1) {
      if (pos + 16 > end) return;
      size = Number(view.getBigUint64(pos + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = end - pos;
    }

    if (size < headerSize || pos + size > end) return;
    yield { type, start: pos, size, headerSize };
    pos += size;
  }
}

function findChild(view: DataView, box: BoxHeader, type: string): BoxHeader | null {
  for (const child of children(view, box.start + box.headerSize, box.start + box.size)) {
    if (child.type === type) return child;
  }
  return null;
}

/** Follows a chain of nested box types, e.g. mdia → minf → stbl. */
function descend(view: DataView, box: BoxHeader, path: string[]): BoxHeader | null {
  let node: BoxHeader | null = box;
  for (const type of path) {
    if (!node) return null;
    node = findChild(view, node, type);
  }
  return node;
}

/* ------------------------------------------------------------ sample tables */

function parseStts(view: DataView, box: BoxHeader): { count: number; delta: number }[] {
  const base = box.start + box.headerSize + 4; // skip version/flags
  const entryCount = view.getUint32(base);
  const entries: { count: number; delta: number }[] = [];
  for (let i = 0; i < entryCount; i++) {
    const at = base + 4 + i * 8;
    entries.push({ count: view.getUint32(at), delta: view.getUint32(at + 4) });
  }
  return entries;
}

function parseStsz(view: DataView, box: BoxHeader): Uint32Array {
  const base = box.start + box.headerSize + 4;
  const uniformSize = view.getUint32(base);
  const count = view.getUint32(base + 4);
  const sizes = new Uint32Array(count);

  if (uniformSize !== 0) {
    sizes.fill(uniformSize);
    return sizes;
  }
  for (let i = 0; i < count; i++) sizes[i] = view.getUint32(base + 8 + i * 4);
  return sizes;
}

function parseStsc(
  view: DataView,
  box: BoxHeader
): { firstChunk: number; samplesPerChunk: number }[] {
  const base = box.start + box.headerSize + 4;
  const entryCount = view.getUint32(base);
  const entries: { firstChunk: number; samplesPerChunk: number }[] = [];
  for (let i = 0; i < entryCount; i++) {
    const at = base + 4 + i * 12;
    entries.push({ firstChunk: view.getUint32(at), samplesPerChunk: view.getUint32(at + 4) });
  }
  return entries;
}

function parseChunkOffsets(view: DataView, stbl: BoxHeader): Float64Array {
  const stco = findChild(view, stbl, 'stco');
  const co64 = stco ? null : findChild(view, stbl, 'co64');
  const box = stco || co64;
  if (!box) throw new UnsupportedTrackError('Track has no chunk offset table');

  const base = box.start + box.headerSize + 4;
  const count = view.getUint32(base);
  const offsets = new Float64Array(count);

  for (let i = 0; i < count; i++) {
    offsets[i] = stco
      ? view.getUint32(base + 4 + i * 4)
      : Number(view.getBigUint64(base + 4 + i * 8));
  }
  return offsets;
}

/**
 * Expands stsc's run-length chunk map and stsz's sizes into a flat per-sample
 * offset table. Typed arrays rather than objects: an 8-hour AAC track is ~1.2M
 * samples, and an array of objects that size would cost hundreds of megabytes.
 */
function buildSampleTable(
  sizes: Uint32Array,
  stsc: { firstChunk: number; samplesPerChunk: number }[],
  chunkOffsets: Float64Array
): Float64Array {
  const offsets = new Float64Array(sizes.length);
  let sampleIndex = 0;

  for (let entry = 0; entry < stsc.length && sampleIndex < sizes.length; entry++) {
    const { firstChunk, samplesPerChunk } = stsc[entry];
    const lastChunk =
      entry + 1 < stsc.length ? stsc[entry + 1].firstChunk - 1 : chunkOffsets.length;

    for (let chunk = firstChunk; chunk <= lastChunk && sampleIndex < sizes.length; chunk++) {
      let cursor = chunkOffsets[chunk - 1];
      if (cursor === undefined) break;

      for (let i = 0; i < samplesPerChunk && sampleIndex < sizes.length; i++) {
        offsets[sampleIndex] = cursor;
        cursor += sizes[sampleIndex];
        sampleIndex++;
      }
    }
  }

  if (sampleIndex < sizes.length) {
    throw new UnsupportedTrackError('Sample table is incomplete or inconsistent');
  }
  return offsets;
}

function buildStartTimes(
  stts: { count: number; delta: number }[],
  sampleCount: number,
  timescale: number
): Float64Array {
  const times = new Float64Array(sampleCount);
  let index = 0;
  let ticks = 0;

  for (const { count, delta } of stts) {
    for (let i = 0; i < count && index < sampleCount; i++) {
      times[index++] = ticks / timescale;
      ticks += delta;
    }
  }
  // A short stts (or none) means constant duration; carry the last delta on.
  const lastDelta = stts.length ? stts[stts.length - 1].delta : 1024;
  while (index < sampleCount) {
    times[index++] = ticks / timescale;
    ticks += lastDelta;
  }
  return times;
}

/* --------------------------------------------------------- decoder config */

/**
 * Pulls the AudioSpecificConfig out of an esds box. The descriptors use a
 * 7-bit-continuation length encoding, so lengths cannot simply be read as bytes.
 */
function parseEsds(view: DataView, box: BoxHeader): Uint8Array | null {
  let pos = box.start + box.headerSize + 4; // version/flags
  const end = box.start + box.size;

  const readLength = (): number => {
    let length = 0;
    for (let i = 0; i < 4 && pos < end; i++) {
      const byte = view.getUint8(pos++);
      length = (length << 7) | (byte & 0x7f);
      if (!(byte & 0x80)) break;
    }
    return length;
  };

  while (pos < end) {
    const tag = view.getUint8(pos++);
    const length = readLength();
    const bodyStart = pos;

    if (tag === 0x03) {
      // ES_Descriptor: skip ES_ID and the optional trailing fields.
      pos += 2;
      const flags = view.getUint8(pos++);
      if (flags & 0x80) pos += 2; // stream dependency
      if (flags & 0x40) pos += 1 + view.getUint8(pos); // URL
      if (flags & 0x20) pos += 2; // OCR stream
      continue; // descend into the children that follow
    }

    if (tag === 0x04) {
      // DecoderConfigDescriptor: fixed 13-byte head, then DecoderSpecificInfo.
      pos += 13;
      continue;
    }

    if (tag === 0x05) {
      const asc = new Uint8Array(length);
      for (let i = 0; i < length; i++) asc[i] = view.getUint8(bodyStart + i);
      return asc;
    }

    pos = bodyStart + length; // an descriptor we don't care about
  }

  return null;
}

/** Reads the audio sample entry in stsd: codec four-cc, channels, rate, esds. */
function parseStsd(view: DataView, stbl: BoxHeader) {
  const stsd = findChild(view, stbl, 'stsd');
  if (!stsd) throw new UnsupportedTrackError('Track has no sample description');

  const base = stsd.start + stsd.headerSize + 4;
  const entryCount = view.getUint32(base);
  if (!entryCount) throw new UnsupportedTrackError('Empty sample description');

  const entryStart = base + 4;
  const entrySize = view.getUint32(entryStart);
  const format = typeAt(view, entryStart + 4);

  // AudioSampleEntry: 8 header + 6 reserved + 2 data ref + 8 fixed fields,
  // then the 16.16 fixed-point sample rate.
  const version = view.getUint16(entryStart + 16);
  const channels = view.getUint16(entryStart + 24);
  const sampleRate = view.getUint16(entryStart + 32);

  // Version 1 sample entries carry 16 extra bytes before their child boxes.
  const childStart = entryStart + 36 + (version === 1 ? 16 : 0);

  let asc: Uint8Array | null = null;
  for (const child of children(view, childStart, entryStart + entrySize)) {
    if (child.type === 'esds') {
      asc = parseEsds(view, child);
      break;
    }
  }

  return { format, channels, sampleRate, asc };
}

/* --------------------------------------------------------------- entry point */

/**
 * Reads the first audio track's sample table. `moov` is read into memory in
 * full — for an 8-hour recording that is roughly 10 MB of tables, which is
 * fine; the ~100 MB of audio it points at is never loaded.
 */
export async function readAudioTrack(file: Blob): Promise<Mp4AudioTrack> {
  const ftyp = await findTopLevelBox(file, 'ftyp');
  const moovBox = await findTopLevelBox(file, 'moov');
  if (!ftyp && !moovBox) throw new NotAnMp4Error('Not an MP4/M4A file');
  if (!moovBox) throw new NotAnMp4Error('MP4 has no moov box (file may be truncated)');

  const view = await readSlice(file, moovBox.start, moovBox.start + moovBox.size);
  // The slice starts at zero, so shift the box to match its buffer coordinates.
  const moov: BoxHeader = { ...moovBox, start: 0 };

  for (const trak of children(view, moov.headerSize, moov.size)) {
    if (trak.type !== 'trak') continue;

    const hdlr = descend(view, trak, ['mdia', 'hdlr']);
    if (!hdlr) continue;
    if (typeAt(view, hdlr.start + hdlr.headerSize + 8) !== 'soun') continue;

    const mdhd = descend(view, trak, ['mdia', 'mdhd']);
    const stbl = descend(view, trak, ['mdia', 'minf', 'stbl']);
    if (!mdhd || !stbl) continue;

    const mdhdVersion = view.getUint8(mdhd.start + mdhd.headerSize);
    const mdhdBase = mdhd.start + mdhd.headerSize + 4;
    const timescale =
      mdhdVersion === 1 ? view.getUint32(mdhdBase + 16) : view.getUint32(mdhdBase + 8);
    const durationTicks =
      mdhdVersion === 1
        ? Number(view.getBigUint64(mdhdBase + 20))
        : view.getUint32(mdhdBase + 12);

    const { format, channels, sampleRate, asc } = parseStsd(view, stbl);

    const sttsBox = findChild(view, stbl, 'stts');
    const stszBox = findChild(view, stbl, 'stsz');
    const stscBox = findChild(view, stbl, 'stsc');
    if (!sttsBox || !stszBox || !stscBox) {
      throw new UnsupportedTrackError('Audio track is missing its sample table');
    }

    const sizes = parseStsz(view, stszBox);
    const offsets = buildSampleTable(sizes, parseStsc(view, stscBox), parseChunkOffsets(view, stbl));
    const startTimes = buildStartTimes(parseStts(view, sttsBox), sizes.length, timescale || 1);

    return {
      format,
      timescale: timescale || 1,
      durationSec: timescale ? durationTicks / timescale : 0,
      asc,
      sampleRate,
      channels,
      sampleCount: sizes.length,
      offsets,
      sizes,
      startTimes,
    };
  }

  throw new UnsupportedTrackError('No audio track found in this file');
}
