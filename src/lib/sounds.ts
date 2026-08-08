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

  // 6. Chemical Wash Slosh: Low-pass filtered noise modulated by a slow LFO for wave ripples
  public playChemicalWash(duration: number) {
    if (this.isMuted) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      // Noise source
      const noise = context.createBufferSource();
      noise.buffer = this.createNoiseBuffer(duration);

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, now);
      filter.Q.value = 1.0;

      // Modulator (LFO) to simulate rising and falling waves
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.6; // 0.6 Hz slow wave
      lfoGain.gain.value = 100; // Modulate frequency by +/- 100 Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.2, now);
      // Fade out slowly at the end
      gain.gain.setValueAtTime(0.2, now + duration - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      lfo.start(now);
      noise.start(now);

      lfo.stop(now + duration);
      noise.stop(now + duration);
    } catch (e) {
      console.warn("Failed to play chemical wash sound:", e);
    }
  }

  private soundtrackActive: boolean = false;
  private soundtrackNodes: { oscs: OscillatorNode[], filter: BiquadFilterNode, gain: GainNode, rumble: OscillatorNode } | null = null;

  public playCrackleLoop() {
    if (!this.soundtrackActive) return;
    try {
      const context = this.init();
      const now = context.currentTime;

      // Play random record scratch pop
      const clickOsc = context.createOscillator();
      const clickGain = context.createGain();
      clickOsc.type = "sine";
      clickOsc.frequency.setValueAtTime(1200 + Math.random() * 2500, now);
      clickGain.gain.setValueAtTime(0.004 + Math.random() * 0.007, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.004);

      clickOsc.connect(clickGain);
      clickGain.connect(context.destination);
      clickOsc.start();
      clickOsc.stop(now + 0.005);
    } catch (e) {
      // ignore
    }

    setTimeout(() => this.playCrackleLoop(), 100 + Math.random() * 600);
  }

  public startVinylSoundtrack() {
    if (this.soundtrackActive) return;
    this.soundtrackActive = true;
    
    try {
      const context = this.init();
      const now = context.currentTime;

      // Start crackles
      this.playCrackleLoop();

      // Start turntable rumble
      const rumble = context.createOscillator();
      const rumbleGain = context.createGain();
      rumble.type = "sawtooth";
      rumble.frequency.value = 45; // Turntable low end hum
      rumbleGain.gain.value = 0.004;

      const rumbleFilter = context.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.value = 70;

      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(context.destination);
      rumble.start();

      // Chord progression: Cmaj7 -> Am7 -> Fmaj7 -> G6
      const chordSeq = [
        [130.81, 164.81, 196.00, 246.94], // Cmaj7
        [110.00, 130.81, 164.81, 196.00], // Am7
        [87.31, 220.00, 130.81, 164.81],  // Fmaj7
        [98.00, 246.94, 146.83, 164.81]   // G6
      ];

      const oscs: OscillatorNode[] = [];
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 450; // soft low pass filter

      // Slow LFO for filter sweep
      const filterLfo = context.createOscillator();
      const filterLfoGain = context.createGain();
      filterLfo.type = "sine";
      filterLfo.frequency.value = 0.15; // slow filter sweep
      filterLfoGain.gain.value = 100;
      filterLfo.connect(filterLfoGain);
      filterLfoGain.connect(filter.frequency);
      filterLfo.start();

      const mainGain = context.createGain();
      mainGain.gain.value = 0.035; // soft background level

      filter.connect(mainGain);
      mainGain.connect(context.destination);

      // Create chord oscillators
      for (let i = 0; i < 4; i++) {
        const osc = context.createOscillator();
        osc.type = "triangle"; // vintage soft synth
        osc.frequency.setValueAtTime(chordSeq[0][i], now);
        osc.connect(filter);
        osc.start();
        oscs.push(osc);
      }

      // Loop chord changes
      let chordIndex = 0;
      const interval = setInterval(() => {
        if (!this.soundtrackActive) {
          clearInterval(interval);
          return;
        }
        chordIndex = (chordIndex + 1) % chordSeq.length;
        const chord = chordSeq[chordIndex];
        const transitionTime = context.currentTime + 1.8; // smooth pitch glide!

        oscs.forEach((osc, i) => {
          osc.frequency.exponentialRampToValueAtTime(chord[i], transitionTime);
        });
      }, 6000);

      this.soundtrackNodes = {
        oscs,
        filter,
        gain: mainGain,
        rumble
      };
    } catch (e) {
      console.warn("Failed to play soundtrack:", e);
    }
  }

  public stopVinylSoundtrack() {
    this.soundtrackActive = false;
    if (this.soundtrackNodes) {
      try {
        const { oscs, rumble, gain } = this.soundtrackNodes;
        const context = this.init();
        gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);

        setTimeout(() => {
          oscs.forEach((osc) => {
            try { osc.stop(); } catch (err) { }
          });
          try { rumble.stop(); } catch (err) { }
        }, 500);
      } catch (e) {
        // ignore
      }
      this.soundtrackNodes = null;
    }
  }

  public getIsSoundtrackActive() {
    return this.soundtrackActive;
  }

  public playPrinterWhirr(durationSeconds = 3.5) {
    try {
      const context = this.init();
      const now = context.currentTime;

      // Motor buzz
      const osc = context.createOscillator();
      const oscGain = context.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(110, now);
      oscGain.gain.setValueAtTime(0.003, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      osc.connect(oscGain);
      oscGain.connect(context.destination);
      osc.start(now);
      osc.stop(now + durationSeconds);

      // Low hum
      const hum = context.createOscillator();
      const humGain = context.createGain();
      hum.type = "triangle";
      hum.frequency.setValueAtTime(60, now);
      humGain.gain.setValueAtTime(0.012, now);
      humGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds);

      hum.connect(humGain);
      humGain.connect(context.destination);
      hum.start(now);
      hum.stop(now + durationSeconds);
    } catch (e) {
      // ignore
    }
  }

  public playPrinterCut() {
    try {
      const context = this.init();
      const now = context.currentTime;

      const osc = context.createOscillator();
      const oscGain = context.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.16);

      oscGain.gain.setValueAtTime(0.04, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(oscGain);
      oscGain.connect(context.destination);
      osc.start(now);
      osc.stop(now + 0.18);

      // Cutter friction rasp
      const rasp = context.createOscillator();
      const raspGain = context.createGain();
      rasp.type = "sawtooth";
      rasp.frequency.setValueAtTime(280, now);
      raspGain.gain.setValueAtTime(0.008, now);
      raspGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      rasp.connect(raspGain);
      raspGain.connect(context.destination);
      rasp.start(now);
      rasp.stop(now + 0.08);
    } catch (e) {
      // ignore
    }
  }
}

export const sounds = new SoundManager();
