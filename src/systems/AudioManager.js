/**
 * Procedural audio system using Web Audio API.
 * Generates all sounds synthetically — no external files needed.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.musicPlaying = false;
    this._musicNodes = [];
    this._initialized = false;
  }

  /** Must be called after user interaction (click/keydown) to unlock AudioContext */
  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.25;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.4;
      this.sfxGain.connect(this.masterGain);

      this._initialized = true;
    } catch (e) {
      console.warn('AudioManager: Web Audio API not available', e);
    }
  }

  ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ========== SFX ==========

  /** Short laser/gun shot */
  playShoot(pitch = 1) {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(200 * pitch, t + 0.08);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** Enemy hit */
  playHit() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  /** Enemy death */
  playEnemyDeath() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  /** Player taking damage */
  playPlayerHurt() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.setValueAtTime(100, t + 0.05);
    osc.frequency.setValueAtTime(80, t + 0.1);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Resource pickup */
  playPickup() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Build complete */
  playBuildComplete() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Ascending 3-note arpeggio
    [440, 554, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.12);
    });
  }

  /** Wave start warning */
  playWaveStart() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Two-tone alarm
    [0, 0.15].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = i === 0 ? 330 : 440;
      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.12);
    });
  }

  /** Player death */
  playDeath() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.8);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  /** UI click */
  playUIClick() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  /** Weapon reload */
  playReload() {
    if (!this._initialized || !this.sfxEnabled) return;
    this.ensureResumed();
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Metallic click sequence
    [800, 1200, 600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.04);
    });
  }

  // ========== AMBIENT MUSIC ==========

  startMusic() {
    if (!this._initialized || !this.musicEnabled || this.musicPlaying) return;
    this.ensureResumed();
    this.musicPlaying = true;
    this._playAmbientLoop();
  }

  stopMusic() {
    this.musicPlaying = false;
    this._musicNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this._musicNodes = [];
  }

  _playAmbientLoop() {
    if (!this.musicPlaying || !this._initialized) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // Ambient pad: slow chord progression with detuned oscillators
    const chords = [
      [65.41, 82.41, 98.00],   // C2 E2 G2
      [73.42, 92.50, 110.00],  // D2 F#2 A2
      [55.00, 69.30, 82.41],   // A1 C#2 E2
      [61.74, 77.78, 92.50],   // B1 D#2 F#2
    ];

    const chordDur = 4.0; // seconds per chord
    const totalDur = chords.length * chordDur;

    chords.forEach((freqs, ci) => {
      const startT = t + ci * chordDur;
      freqs.forEach((freq) => {
        // Main oscillator
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startT);
        gain.gain.linearRampToValueAtTime(0.08, startT + 0.8);
        gain.gain.setValueAtTime(0.08, startT + chordDur - 0.8);
        gain.gain.linearRampToValueAtTime(0, startT + chordDur);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(startT);
        osc.stop(startT + chordDur);
        this._musicNodes.push(osc);

        // Detuned layer
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = freq * 1.003; // slight detune
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, startT);
        gain2.gain.linearRampToValueAtTime(0.04, startT + 1.0);
        gain2.gain.setValueAtTime(0.04, startT + chordDur - 1.0);
        gain2.gain.linearRampToValueAtTime(0, startT + chordDur);
        osc2.connect(gain2);
        gain2.connect(this.musicGain);
        osc2.start(startT);
        osc2.stop(startT + chordDur);
        this._musicNodes.push(osc2);
      });
    });

    // High ambient shimmer (random sine pings)
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const freq = 400 + Math.random() * 800;
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const pingT = t + Math.random() * totalDur;
      gain.gain.setValueAtTime(0, pingT);
      gain.gain.linearRampToValueAtTime(0.03, pingT + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, pingT + 0.6);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(pingT);
      osc.stop(pingT + 0.6);
      this._musicNodes.push(osc);
    }

    // Schedule next loop
    this._musicTimeout = setTimeout(() => {
      this._musicNodes = [];
      this._playAmbientLoop();
    }, totalDur * 1000 - 200);
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  pause() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  destroy() {
    this.stopMusic();
    if (this._musicTimeout) clearTimeout(this._musicTimeout);
    if (this.ctx) this.ctx.close();
  }
}

// Singleton
export const audioManager = new AudioManager();
