/**
 * Audio-thread clock and level meter.
 *
 * Segment rotation used to run on setInterval, which browsers throttle to about
 * once a minute once the tab loses focus — so a 45-second segment could quietly
 * become a ten-minute one. Counting samples on the audio thread instead means
 * the timing is exact and completely immune to throttling, because it is driven
 * by the audio hardware rather than by the event loop.
 *
 * It also reports RMS, which the UI uses for the level meter and which flags a
 * dead microphone (a track that is technically live but delivering silence).
 */

const LEVEL_INTERVAL_SAMPLES = 4096;

class SegmentClock extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { segmentSeconds = 300 } = options.processorOptions || {};
    this.segmentSamples = Math.max(1, Math.round(segmentSeconds * sampleRate));
    this.sinceSegment = 0;
    this.sinceLevel = 0;
    this.peak = 0;
    this.sumSquares = 0;
    this.squareCount = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    // No input frames yet (or the track was interrupted); keep the node alive.
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      const value = channel[i];
      this.sumSquares += value * value;
      if (Math.abs(value) > this.peak) this.peak = Math.abs(value);
    }
    this.squareCount += channel.length;
    this.sinceLevel += channel.length;
    this.sinceSegment += channel.length;

    if (this.sinceLevel >= LEVEL_INTERVAL_SAMPLES) {
      this.port.postMessage({
        type: 'level',
        rms: Math.sqrt(this.sumSquares / Math.max(1, this.squareCount)),
        peak: this.peak,
      });
      this.sinceLevel = 0;
      this.sumSquares = 0;
      this.squareCount = 0;
      this.peak = 0;
    }

    if (this.sinceSegment >= this.segmentSamples) {
      this.port.postMessage({ type: 'segment', elapsedSeconds: this.sinceSegment / sampleRate });
      this.sinceSegment = 0;
    }

    return true;
  }
}

registerProcessor('segment-clock', SegmentClock);
