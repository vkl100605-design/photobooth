// Web Audio API Programmatic Sound Generator
// Creates vintage photobooth sound effects locally and offline-ready with no license concerns.

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted() {
    return this.isMuted;
  }

  private createNoiseBuffer(duration: number) {
    const context = this.init();
    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 1. Shutter Click: Short high-pass noise burst + click
  public playShutter() {
    if (this.isMuted) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      // Noise source
      const noise = context.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.15);

      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 0.1);

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      noise.start(now);

      // Pop / click sound
      const osc = context.createOscillator();
      const oscGain = context.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(oscGain);
      oscGain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn("Failed to play shutter sound:", e);
    }
  }

  // 2. Camera Flash / Charge-up: High pitch sweep up & down
  public playFlash() {
    if (this.isMuted) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(3000, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn("Failed to play flash sound:", e);
    }
  }

  // 3. Vintage Printer: Low-frequency repeating hum and motor noise
  public playPrinter(duration: number) {
    if (this.isMuted) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      const osc = context.createOscillator();
      const osc2 = context.createOscillator();
      const gain = context.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(60, now); // Line hum
      // Add light vibrato to sound mechanical
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.frequency.value = 12; // 12Hz mechanical jitter
      lfoGain.gain.value = 5;

      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc2.type = "square";
      osc2.frequency.setValueAtTime(120, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
      gain.gain.setValueAtTime(0.05, now + duration - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(context.destination);

      lfo.start(now);
      osc.start(now);
      osc2.start(now);

      lfo.stop(now + duration);
      osc.stop(now + duration);
      osc2.stop(now + duration);

      // Periodic clicks for winding gear
      const interval = 0.25;
      for (let t = 0; t < duration; t += interval) {
        const clickOsc = context.createOscillator();
        const clickGain = context.createGain();
        clickOsc.type = "triangle";
        clickOsc.frequency.setValueAtTime(300, now + t);
        clickOsc.frequency.exponentialRampToValueAtTime(50, now + t + 0.03);

        clickGain.gain.setValueAtTime(0.03, now + t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.03);

        clickOsc.connect(clickGain);
        clickGain.connect(context.destination);
        clickOsc.start(now + t);
        clickOsc.stop(now + t + 0.04);
      }
    } catch (e) {
      console.warn("Failed to play printer sound:", e);
    }
  }

  // 4. Curtain Slide: Low frequency noise rustle
  public playCurtain() {
    if (this.isMuted) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      const noise = context.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.65);

      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);
      filter.Q.value = 1.0;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      noise.start(now);
    } catch (e) {
      console.warn("Failed to play curtain sound:", e);
    }
  }

  // 5. Button Click: Subtle warm click
  public playClick() {
    if (this.isMuted) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      const osc = context.createOscillator();
      const gain = context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(context.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn("Failed to play click sound:", e);
    }
  }
}

export const sounds = new SoundManager();
