import { RADIO_STATIONS, WeaponId } from '../config/BalanceConfig';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private musicVolume = 0.8;
  private sfxVolume = 0.9;
  private lastStepTime = 0;
  private lastBumpTime = 0;
  private lastCrashTime = 0;
  private lastHitTime = 0;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenPhase = 0;

  private radioStationIndex = 1;
  private radioActive = false;
  private radioStep = 0;
  private radioTimer: number | null = null;

  private sg(baseGain: number): number {
    return Math.max(0.0005, baseGain * this.sfxVolume);
  }

  private mg(baseGain: number): number {
    return Math.max(0.0005, baseGain * this.musicVolume);
  }

  public setVolumes(musicPercent: number, sfxPercent: number): void {
    this.musicVolume = Math.max(0, Math.min(1, musicPercent / 100));
    this.sfxVolume = Math.max(0, Math.min(1, sfxPercent / 100));
    if (this.sirenGain && this.ctx) {
      this.sirenGain.gain.setTargetAtTime(this.sg(0.018), this.ctx.currentTime, 0.03);
    }
    if (this.sfxVolume <= 0.005) {
      this.stopEngineSound();
      this.stopSirenSound();
    }
  }

  public unlock(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopEngineSound();
      this.stopSirenSound();
      this.stopRadioLoop();
    } else if (this.radioActive && this.radioStationIndex > 0) {
      this.startRadioLoop();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getRadioStationIndex(): number {
    return this.radioStationIndex;
  }

  public setRadioPlaying(active: boolean): void {
    this.radioActive = active;
    if (!active || this.muted || this.radioStationIndex === 0) {
      this.stopRadioLoop();
    } else {
      this.startRadioLoop();
    }
  }

  public cycleRadioStation(): number {
    this.radioStationIndex = (this.radioStationIndex + 1) % RADIO_STATIONS.length;
    this.radioStep = 0;
    this.stopRadioLoop();
    if (this.radioActive && !this.muted && this.radioStationIndex > 0) {
      this.startRadioLoop();
    }
    return this.radioStationIndex;
  }

  private startRadioLoop(): void {
    if (typeof window === 'undefined' || this.radioTimer !== null) return;
    const station = RADIO_STATIONS[this.radioStationIndex];
    if (!station || station.bpm <= 0) return;
    const stepMs = Math.round((60 / station.bpm / 2) * 1000);
    this.radioTimer = window.setInterval(() => {
      this.playRadioStep();
    }, stepMs);
  }

  private stopRadioLoop(): void {
    if (this.radioTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.radioTimer);
      this.radioTimer = null;
    }
  }

  private playRadioStep(): void {
    if (
      !this.radioActive ||
      this.muted ||
      this.musicVolume <= 0.005 ||
      !this.ctx ||
      this.ctx.state !== 'running'
    ) {
      return;
    }
    const step = this.radioStep++ % 16;
    const t = this.ctx.currentTime;

    const bassLines: Record<number, number[]> = {
      1: [110, 110, 130.81, 110, 98, 98, 130.81, 146.83, 110, 110, 164.81, 146.83, 98, 110, 130.81, 146.83],
      2: [82.41, 0, 82.41, 98, 73.42, 0, 110, 98, 82.41, 0, 82.41, 123.47, 73.42, 98, 110, 82.41],
      3: [65.41, 65.41, 98, 65.41, 73.42, 73.42, 110, 98, 65.41, 65.41, 130.81, 98, 82.41, 73.42, 98, 110],
    };
    const leadLines: Record<number, number[]> = {
      1: [440, 0, 523.25, 0, 659.25, 0, 587.33, 523.25, 440, 0, 392, 0, 523.25, 587.33, 659.25, 0],
      2: [329.63, 0, 0, 392, 0, 293.66, 0, 329.63, 440, 0, 392, 0, 329.63, 0, 293.66, 0],
      3: [261.63, 392, 0, 329.63, 293.66, 0, 440, 392, 261.63, 392, 523.25, 0, 329.63, 293.66, 261.63, 0],
    };

    const bassFreq = bassLines[this.radioStationIndex]?.[step] ?? 0;
    const leadFreq = leadLines[this.radioStationIndex]?.[step] ?? 0;

    if (bassFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = this.radioStationIndex === 3 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(bassFreq, t);
      gain.gain.setValueAtTime(this.mg(0.022), t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    if (leadFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = this.radioStationIndex === 1 ? 'sine' : 'square';
      osc.frequency.setValueAtTime(leadFreq, t);
      gain.gain.setValueAtTime(this.mg(0.014), t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }
  }

  public playFootstep(nowMs: number): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    if (nowMs - this.lastStepTime < 220) return;
    this.lastStepTime = nowMs;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(115 + Math.random() * 25, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.045);

    gain.gain.setValueAtTime(this.sg(0.035), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  public playBump(nowMs: number): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    if (nowMs - this.lastBumpTime < 340) return;
    this.lastBumpTime = nowMs;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(92, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.08);

    gain.gain.setValueAtTime(this.sg(0.045), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.085);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playCrash(nowMs: number, intensity: number): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    if (nowMs - this.lastCrashTime < 260) return;
    this.lastCrashTime = nowMs;

    const clamped = Math.max(0.25, Math.min(1, intensity));
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140 * clamped + 50, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.16);

    gain.gain.setValueAtTime(this.sg(0.09 * clamped), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playVehicleEnter(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const freqs = [220, 330, 440];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.04;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(this.sg(0.045), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }

  public playVehicleExit(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    gain.gain.setValueAtTime(this.sg(0.05), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.11);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playWantedTriggered(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [587.33, 783.99].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.08;
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(this.sg(0.05), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  public playEscapedChime(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(this.sg(0.05), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  public playMissionComplete(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.07;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(this.sg(0.055), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.23);
    });
  }

  public playMissionFail(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [311.13, 233.08].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.12;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(this.sg(0.05), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.23);
    });
  }

  public playPurchase(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    [660, 880].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.045;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(this.sg(0.05), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  public updateSirenSound(active: boolean, dtSeconds: number): void {
    if (!active || this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') {
      this.stopSirenSound();
      return;
    }

    if (!this.sirenOsc || !this.sirenGain) {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'triangle';
      this.sirenOsc.frequency.setValueAtTime(620, this.ctx.currentTime);
      this.sirenGain.gain.setValueAtTime(this.sg(0.018), this.ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);
      this.sirenOsc.start();
    }

    this.sirenPhase += dtSeconds * 3.4;
    const freq = 580 + Math.sin(this.sirenPhase * Math.PI) * 180;
    this.sirenOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.04);
  }

  public stopSirenSound(): void {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.sirenOsc = null;
    }
    if (this.sirenGain) {
      this.sirenGain.disconnect();
      this.sirenGain = null;
    }
  }

  public updateEngineSound(active: boolean, speedRatio: number): void {
    if (!active || this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') {
      this.stopEngineSound();
      return;
    }

    if (!this.engineOsc || !this.engineGain) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(52, this.ctx.currentTime);
      this.engineGain.gain.setValueAtTime(this.sg(0.015), this.ctx.currentTime);
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    }

    const clamped = Math.max(0, Math.min(1, speedRatio));
    const targetFreq = 48 + clamped * 98;
    const targetGain = this.sg(0.012 + clamped * 0.022);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.06);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.06);
  }

  public stopEngineSound(): void {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // Ignore already stopped oscillator
      }
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
  }

  public playInteract(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 783.99];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(this.sg(0.06), start);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.15);
    });
  }

  public playUiConfirm(): void {
    if (this.muted || this.sfxVolume <= 0.005) return;
    this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.09);

    gain.gain.setValueAtTime(this.sg(0.045), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  public playGunshot(weaponId: WeaponId): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;

    // 1. Noise burst transient for tactile gunshot crack
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      if (weaponId === 'shotgun') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, t);
        filter.frequency.exponentialRampToValueAtTime(320, t + 0.19);
        gain.gain.setValueAtTime(this.sg(0.18), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.21);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.22);
      } else if (weaponId === 'launcher') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(180, t + 0.28);
        gain.gain.setValueAtTime(this.sg(0.2), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.3);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.31);
      } else if (weaponId === 'flamethrower') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750 + Math.random() * 260, t);
        gain.gain.setValueAtTime(this.sg(0.08), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.095);
      } else if (weaponId === 'railgun') {
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1600, t);
        gain.gain.setValueAtTime(this.sg(0.15), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.22);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.23);
      } else if (weaponId === 'rifle') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200 + Math.random() * 250, t);
        gain.gain.setValueAtTime(this.sg(0.13), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.095);
      } else if (weaponId === 'smg') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2600 + Math.random() * 400, t);
        gain.gain.setValueAtTime(this.sg(0.09), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.065);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.07);
      } else {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1900, t);
        gain.gain.setValueAtTime(this.sg(0.12), t);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.1);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        src.start(t);
        src.stop(t + 0.11);
      }
    }

    // 2. Low-end punch body thump / sci-fi sweep
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type =
      weaponId === 'shotgun' || weaponId === 'launcher'
        ? 'sawtooth'
        : weaponId === 'railgun'
          ? 'square'
          : 'triangle';

    if (weaponId === 'shotgun') {
      osc.frequency.setValueAtTime(195, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.17);
      oscGain.gain.setValueAtTime(this.sg(0.15), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
    } else if (weaponId === 'launcher') {
      osc.frequency.setValueAtTime(155, t);
      osc.frequency.exponentialRampToValueAtTime(34, t + 0.25);
      oscGain.gain.setValueAtTime(this.sg(0.17), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.26);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.27);
    } else if (weaponId === 'railgun') {
      osc.frequency.setValueAtTime(1180, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.24);
      oscGain.gain.setValueAtTime(this.sg(0.13), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.25);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    } else if (weaponId === 'flamethrower') {
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.06);
      oscGain.gain.setValueAtTime(this.sg(0.035), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.065);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } else if (weaponId === 'rifle') {
      osc.frequency.setValueAtTime(310, t);
      osc.frequency.exponentialRampToValueAtTime(72, t + 0.085);
      oscGain.gain.setValueAtTime(this.sg(0.11), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.095);
    } else if (weaponId === 'smg') {
      osc.frequency.setValueAtTime(320 + Math.random() * 45, t);
      osc.frequency.exponentialRampToValueAtTime(85, t + 0.055);
      oscGain.gain.setValueAtTime(this.sg(0.065), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.065);
    } else {
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(64, t + 0.085);
      oscGain.gain.setValueAtTime(this.sg(0.095), t);
      oscGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.095);
    }
  }

  public playImpactHit(heavy: boolean): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const now = performance.now();
    if (now - this.lastHitTime < 35) return;
    this.lastHitTime = now;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(heavy ? 180 : 280, t);
    osc.frequency.exponentialRampToValueAtTime(heavy ? 52 : 95, t + 0.065);
    gain.gain.setValueAtTime(this.sg(heavy ? 0.11 : 0.065), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.075);
  }

  public playWallPing(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980 + Math.random() * 280, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.045);
    gain.gain.setValueAtTime(this.sg(0.028), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  public playExplosion(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, t);
      filter.frequency.exponentialRampToValueAtTime(90, t + 0.42);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sg(0.24), t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.44);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t);
      src.stop(t + 0.45);
    }

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.36);
    subGain.gain.setValueAtTime(this.sg(0.2), t);
    subGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.38);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.4);
  }

  public playEmptyClick(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(640, t);
    gain.gain.setValueAtTime(this.sg(0.03), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.025);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  public playTankCannon(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const noiseBuf = this.getNoiseBuffer();
    if (noiseBuf) {
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.38);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.sg(0.28), t);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.4);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t);
      src.stop(t + 0.42);
    }

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(125, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.34);
    subGain.gain.setValueAtTime(this.sg(0.22), t);
    subGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.36);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.37);
  }

  public playMechPlasma(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);
    gain.gain.setValueAtTime(this.sg(0.11), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.13);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playOrbitalStrike(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.55);
    gain.gain.setValueAtTime(this.sg(0.22), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.58);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  public playArmorPickup(): void {
    if (this.muted || this.sfxVolume <= 0.005 || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.setValueAtTime(640, t + 0.06);
    gain.gain.setValueAtTime(this.sg(0.11), t);
    gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.17);
  }
}
