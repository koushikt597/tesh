// Web Audio API ambient, UI, and cinematic physics sound generator for Tesh Digitals
// Purely programmatic, zero external dependencies, robust high-fidelity audio levels.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientOsc3 = null;
    this.filter = null;
    this.lfo = null;
    this.lfoGain = null;

    // Charging sound nodes
    this.chargeOsc = null;
    this.chargeOsc2 = null;
    this.chargeFilter = null;
    this.chargeGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAmbience() {
    this.init();
    if (!this.ctx || this.isPlaying) return;

    try {
      const now = this.ctx.currentTime;

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.24, now + 1.2);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(520, now);
      this.filter.Q.setValueAtTime(2.5, now);

      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'triangle';
      this.ambientOsc1.frequency.setValueAtTime(110, now);

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(164.81, now);
      this.ambientOsc2.detune.setValueAtTime(4, now);

      this.ambientOsc3 = this.ctx.createOscillator();
      this.ambientOsc3.type = 'sine';
      this.ambientOsc3.frequency.setValueAtTime(220, now);
      this.ambientOsc3.detune.setValueAtTime(-6, now);

      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.22, now);
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(120, now);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      this.ambientOsc1.connect(this.filter);
      this.ambientOsc2.connect(this.filter);
      this.ambientOsc3.connect(this.filter);
      this.filter.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.ambientOsc3.start(now);
      this.lfo.start(now);

      this.isPlaying = true;
    } catch {
      // Audio fallback
    }
  }

  stopAmbience() {
    if (!this.isPlaying || !this.ctx || !this.ambientGain) {
      this.isPlaying = false;
      return;
    }

    try {
      const now = this.ctx.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      setTimeout(() => {
        try {
          if (this.ambientOsc1) this.ambientOsc1.stop();
          if (this.ambientOsc2) this.ambientOsc2.stop();
          if (this.ambientOsc3) this.ambientOsc3.stop();
          if (this.lfo) this.lfo.stop();
        } catch {}
        this.isPlaying = false;
      }, 550);
    } catch {
      this.isPlaying = false;
    }
  }

  playToggleChime(enable) {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (enable) {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      } else {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.12);
      }

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  playHoverTick() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  playStartSwell() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + 1.1);

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(73.42, now);
      osc1.frequency.exponentialRampToValueAtTime(220, now + 1.2);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(55, now);
      osc2.frequency.exponentialRampToValueAtTime(146.83, now + 1.2);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.7);
      osc2.stop(now + 1.7);
    } catch {}
  }

  // 3-Second Charging Riser for Sphere Hold
  startChargingRiser() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;

      this.chargeGain = this.ctx.createGain();
      this.chargeGain.gain.setValueAtTime(0.001, now);
      this.chargeGain.gain.linearRampToValueAtTime(0.25, now + 2.8);

      this.chargeFilter = this.ctx.createBiquadFilter();
      this.chargeFilter.type = 'bandpass';
      this.chargeFilter.frequency.setValueAtTime(160, now);
      this.chargeFilter.frequency.exponentialRampToValueAtTime(1400, now + 3.0);
      this.chargeFilter.Q.setValueAtTime(3.5, now);

      this.chargeOsc = this.ctx.createOscillator();
      this.chargeOsc.type = 'sawtooth';
      this.chargeOsc.frequency.setValueAtTime(110, now);
      this.chargeOsc.frequency.exponentialRampToValueAtTime(440, now + 3.0);

      this.chargeOsc2 = this.ctx.createOscillator();
      this.chargeOsc2.type = 'sine';
      this.chargeOsc2.frequency.setValueAtTime(220, now);
      this.chargeOsc2.frequency.exponentialRampToValueAtTime(880, now + 3.0);

      this.chargeOsc.connect(this.chargeFilter);
      this.chargeOsc2.connect(this.chargeFilter);
      this.chargeFilter.connect(this.chargeGain);
      this.chargeGain.connect(this.masterGain);

      this.chargeOsc.start(now);
      this.chargeOsc2.start(now);
    } catch {}
  }

  stopChargingRiser() {
    if (!this.chargeGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.chargeGain.gain.cancelScheduledValues(now);
      this.chargeGain.gain.setValueAtTime(this.chargeGain.gain.value, now);
      this.chargeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      setTimeout(() => {
        try {
          if (this.chargeOsc) this.chargeOsc.stop();
          if (this.chargeOsc2) this.chargeOsc2.stop();
        } catch {}
        this.chargeOsc = null;
        this.chargeOsc2 = null;
        this.chargeGain = null;
      }, 300);
    } catch {}
  }

  // Cinematic 3D Explosion Impact & Sub Blast
  playExplosion() {
    this.stopChargingRiser();
    if (!this.isPlaying || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Heavy Sub Boom (Low sine drop)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(120, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 2.1);

      // 2. High Metallic Shatter / Noise Burst
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 1.4);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(now);
      noise.stop(now + 1.6);
    } catch {}
  }
}

export const soundManager = new SoundManager();
