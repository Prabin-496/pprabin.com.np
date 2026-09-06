/**
 * WAV helpers: reading an uploaded .wav without decoding it, and writing WAV
 * headers for chunks produced by the decode fallback.
 *
 * Uncompressed PCM is the easy case — samples sit contiguously in the `data`
 * chunk, so a time range is a byte range, and only a fresh 44-byte header has
 * to be written in front of it.
 */

export interface WavFormat {
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  blockAlign: number;
  byteRate: number;
  /** Byte offset of the first sample within the file. */
  dataStart: number;
  dataLength: number;
}

export class NotAWavError extends Error {}

/** Reads the RIFF chunk list far enough to locate `fmt ` and `data`. */
export async function readWavFormat(file: Blob): Promise<WavFormat> {
  // 64 KB covers the header plus any LIST/INFO metadata sitting before `data`.
  const head = new DataView(await file.slice(0, Math.min(65536, file.size)).arrayBuffer());
  if (head.byteLength < 12) throw new NotAWavError('File is too short to be a WAV');

  const tag = (at: number) =>
    String.fromCharCode(head.getUint8(at), head.getUint8(at + 1), head.getUint8(at + 2), head.getUint8(at + 3));

  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new NotAWavError('Not a RIFF/WAVE file');

  let pos = 12;
  let format: Partial<WavFormat> = {};

  while (pos + 8 <= head.byteLength) {
    const id = tag(pos);
    const size = head.getUint32(pos + 4, true);

    if (id === 'fmt ') {
      format = {
        ...format,
        channels: head.getUint16(pos + 10, true),
        sampleRate: head.getUint32(pos + 12, true),
        byteRate: head.getUint32(pos + 16, true),
        blockAlign: head.getUint16(pos + 20, true),
        bitsPerSample: head.getUint16(pos + 22, true),
      };
    } else if (id === 'data') {
      format.dataStart = pos + 8;
      // A streamed WAV can carry a placeholder length; trust the file size then.
      format.dataLength = size > 0 && size !== 0xffffffff ? size : file.size - (pos + 8);
      break;
    }

    pos += 8 + size + (size % 2); // chunks are word-aligned
  }

  if (format.dataStart === undefined || !format.blockAlign) {
    throw new NotAWavError('WAV file is missing its fmt or data chunk');
  }
  return format as WavFormat;
}

/** The canonical 44-byte PCM header, for a body of `dataLength` bytes. */
export function wavHeader(format: {
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
}, dataLength: number): Uint8Array<ArrayBuffer> {
  const header = new Uint8Array(new ArrayBuffer(44));
  const view = new DataView(header.buffer);
  const blockAlign = (format.channels * format.bitsPerSample) / 8;

  const ascii = (at: number, text: string) => {
    for (let i = 0; i < text.length; i++) header[at + i] = text.charCodeAt(i);
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // format = PCM
  view.setUint16(22, format.channels, true);
  view.setUint32(24, format.sampleRate, true);
  view.setUint32(28, format.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, format.bitsPerSample, true);
  ascii(36, 'data');
  view.setUint32(40, dataLength, true);

  return header;
}

/** Float samples in [-1, 1] to a 16-bit PCM WAV blob. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const body = new Uint8Array(new ArrayBuffer(samples.length * 2));
  const view = new DataView(body.buffer);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([wavHeader({ channels: 1, sampleRate, bitsPerSample: 16 }, body.length), body], {
    type: 'audio/wav',
  });
}
