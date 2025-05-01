export class SimpleVAD {
  private analyser: AnalyserNode;
  private data: Uint8Array;

  constructor(ctx: AudioContext, source: MediaStreamAudioSourceNode) {
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 512;
    source.connect(this.analyser);
    this.data = new Uint8Array(this.analyser.fftSize);
  }

  /** returns true if RMS(volume) > threshold */
  isSpeaking(threshold = 0.02): boolean {
    this.analyser.getByteTimeDomainData(this.data);
    // normalize to [-1,1]
    let sumSq = 0;
    for (let i = 0; i < this.data.length; i++) {
      const x = (this.data[i] / 128) - 1;
      sumSq += x * x;
    }
    const rms = Math.sqrt(sumSq / this.data.length);
    return rms > threshold;
  }
} 