/**
 * Wraps raw AAC frames in ADTS headers.
 *
 * MP4 stores AAC frames stripped of any framing — the decoder settings live
 * once in the container's `esds` box instead. Lifting a range of frames out of
 * an .m4a therefore produces bytes no decoder can read on its own. Giving each
 * frame a 7-byte ADTS header makes the range a self-contained .aac stream,
 * which is one of the formats Gemini accepts, and it costs no re-encoding:
 * the audio bytes are copied through untouched.
 */

/** ADTS sampling frequency table, by index. */
const SAMPLE_RATES = [
  96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350,
];

export interface AacConfig {
  /** ADTS profile field: audio object type minus one. */
  profileMinusOne: number;
  samplingFrequencyIndex: number;
  channelConfiguration: number;
  sampleRate: number;
}

export class UnsupportedAacError extends Error {}

/**
 * Decodes the AudioSpecificConfig bit fields:
 *   audioObjectType(5) samplingFrequencyIndex(4) channelConfiguration(4)
 *
 * HE-AAC (object type 5 or 29) nests the real config behind an extension: the
 * frequency index at the front is the *doubled* SBR rate, and the base decoder
 * follows. ADTS has no way to signal that explicitly, so it is written as
 * plain AAC-LC at the base rate and the decoder infers SBR — which is what
 * every AAC decoder expects from a low-bitrate ADTS stream anyway. Halving the
 * rate is an index shift of +3, since the table runs in descending order.
 */
export function parseAudioSpecificConfig(asc: Uint8Array): AacConfig {
  if (asc.length < 2) throw new UnsupportedAacError('Audio config is too short to read');

  const bits = (asc[0] << 8) | asc[1];
  let objectType = (bits >> 11) & 0x1f;
  let frequencyIndex = (bits >> 7) & 0x0f;
  let channelConfiguration = (bits >> 3) & 0x0f;

  if (objectType === 31) {
    throw new UnsupportedAacError('Escaped AAC object types are not supported');
  }

  if (objectType === 5 || objectType === 29) {
    if (frequencyIndex === 0x0f) {
      throw new UnsupportedAacError('Explicit sample rates are not supported');
    }
    frequencyIndex = Math.min(frequencyIndex + 3, SAMPLE_RATES.length - 1);
    // Re-read the channel count that follows the extension header.
    const tail = ((asc[1] & 0x07) << 8) | (asc.length > 2 ? asc[2] : 0);
    const baseChannels = (tail >> 4) & 0x0f;
    if (baseChannels) channelConfiguration = baseChannels;
    objectType = 2;
  }

  if (frequencyIndex === 0x0f) {
    throw new UnsupportedAacError('Explicit sample rates are not supported');
  }
  if (objectType < 1 || objectType > 4) {
    throw new UnsupportedAacError(`AAC object type ${objectType} cannot be written as ADTS`);
  }
  if (channelConfiguration < 1 || channelConfiguration > 7) {
    throw new UnsupportedAacError('Unusual channel layout — cannot write an ADTS header');
  }

  return {
    profileMinusOne: objectType - 1,
    samplingFrequencyIndex: frequencyIndex,
    channelConfiguration,
    sampleRate: SAMPLE_RATES[frequencyIndex],
  };
}

export const ADTS_HEADER_BYTES = 7;

/** Writes one 7-byte ADTS header (no CRC) for a frame of `frameLength` bytes. */
export function writeAdtsHeader(
  out: Uint8Array,
  at: number,
  config: AacConfig,
  frameLength: number
): void {
  const total = frameLength + ADTS_HEADER_BYTES;

  out[at] = 0xff; // syncword
  out[at + 1] = 0xf1; // syncword + MPEG-4, layer 0, no CRC
  out[at + 2] =
    (config.profileMinusOne << 6) |
    (config.samplingFrequencyIndex << 2) |
    ((config.channelConfiguration >> 2) & 0x01);
  out[at + 3] = ((config.channelConfiguration & 0x03) << 6) | ((total >> 11) & 0x03);
  out[at + 4] = (total >> 3) & 0xff;
  out[at + 5] = ((total & 0x07) << 5) | 0x1f; // buffer fullness = VBR
  out[at + 6] = 0xfc; // one frame per ADTS packet
}

/** True when `bytes` starts with an ADTS syncword — used to sanity-check output. */
export function looksLikeAdts(bytes: Uint8Array): boolean {
  return bytes.length >= 7 && bytes[0] === 0xff && (bytes[1] & 0xf0) === 0xf0;
}
