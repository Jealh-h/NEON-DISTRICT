import Phaser from 'phaser';
import {
  TIME_PHASE_SPECS,
  TimePhaseId,
  WEATHER_SPECS,
  WeatherId,
} from '../config/ExpansionConfig';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';

interface StreakDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
}

export class EnvironmentManager {
  private scene: Phaser.Scene;
  private tintRect: Phaser.GameObjects.Rectangle;
  private weatherOverlayRect: Phaser.GameObjects.Rectangle;
  private flashRect: Phaser.GameObjects.Rectangle;
  private weatherGfx: Phaser.GameObjects.Graphics;

  // Game clock in minutes (0..1440), start at 20:15 neon evening for iconic vibe
  private clockMinutes = 20 * 60 + 15;
  // 1440 game minutes per ~260 real seconds (~4.3 min full day/night cycle)
  private readonly minutesPerSecond = 5.5;

  private currentWeather: WeatherId = 'clear';
  private weatherTimerSec = 55;
  private lightningTimerSec = 5;
  private flashAlpha = 0;

  private lastEmitAt = 0;
  private lastPhaseId: TimePhaseId = 'night';
  private streaks: StreakDrop[] = [];
  private viewW = 1280;
  private viewH = 720;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.viewW = Math.max(640, scene.scale.width || 1280);
    this.viewH = Math.max(480, scene.scale.height || 720);

    // Camera-locked screen-space overlays (always visible over viewport, ultra lightweight)
    this.tintRect = scene.add
      .rectangle(0, 0, this.viewW * 2, this.viewH * 2, 0x060b1c, 0.22)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50);

    this.weatherOverlayRect = scene.add
      .rectangle(0, 0, this.viewW * 2, this.viewH * 2, 0x082f49, 0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(51);

    this.weatherGfx = scene.add.graphics().setScrollFactor(0).setDepth(52);

    this.flashRect = scene.add
      .rectangle(0, 0, this.viewW * 2, this.viewH * 2, 0xe0f2fe, 0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(53)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.initStreaks();
    this.recenterOverlays();
    this.emitTelemetry(true);
  }

  private initStreaks(): void {
    this.streaks = [];
    for (let i = 0; i < 65; i++) {
      this.streaks.push({
        x: Math.random() * this.viewW,
        y: Math.random() * this.viewH,
        len: 10 + Math.random() * 14,
        speed: 420 + Math.random() * 260,
      });
    }
  }

  private recenterOverlays(): void {
    const w = Math.max(640, this.scene.scale.width || 1280);
    const h = Math.max(480, this.scene.scale.height || 720);
    this.viewW = w;
    this.viewH = h;
    // Account for camera zoom (<1 when driving) by sizing generously around viewport center
    const coverW = w * 2.4;
    const coverH = h * 2.4;
    const cx = w * 0.5;
    const cy = h * 0.5;

    this.tintRect.setPosition(cx, cy).setSize(coverW, coverH);
    this.weatherOverlayRect.setPosition(cx, cy).setSize(coverW, coverH);
    this.flashRect.setPosition(cx, cy).setSize(coverW, coverH);
  }

  public onResize(): void {
    this.recenterOverlays();
    this.initStreaks();
  }

  public getTimePhase(): TimePhaseId {
    const hour = Math.floor(this.clockMinutes / 60) % 24;
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  }

  public getWeather(): WeatherId {
    return this.currentWeather;
  }

  public getPoliceSightMultiplier(): number {
    const phase = this.getTimePhase();
    const timeMult = phase === 'night' ? 0.9 : 1.0;
    return WEATHER_SPECS[this.currentWeather].policeSightMult * timeMult;
  }

  public getVehicleGripMultiplier(): number {
    return WEATHER_SPECS[this.currentWeather].vehicleGripMult;
  }

  public update(dtSeconds: number, nowMs: number, districtName: string, isPlaying: boolean): void {
    if (!isPlaying) return;

    this.clockMinutes = (this.clockMinutes + dtSeconds * this.minutesPerSecond) % 1440;
    const phase = this.getTimePhase();
    const phaseSpec = TIME_PHASE_SPECS[phase];

    this.tintRect.setFillStyle(phaseSpec.tintColor, phaseSpec.darknessAlpha);

    // Weather rotation
    this.weatherTimerSec -= dtSeconds;
    if (this.weatherTimerSec <= 0) {
      this.pickNextWeather(districtName);
    }

    const weatherSpec = WEATHER_SPECS[this.currentWeather];
    this.weatherOverlayRect.setFillStyle(weatherSpec.overlayColor, weatherSpec.overlayAlpha);

    // Lightning flash decay in storm
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dtSeconds * 2.2);
      this.flashRect.setAlpha(this.flashAlpha);
    }

    if (this.currentWeather === 'storm') {
      this.lightningTimerSec -= dtSeconds;
      if (this.lightningTimerSec <= 0) {
        this.lightningTimerSec = 5 + Math.random() * 8;
        this.flashAlpha = 0.24;
        this.flashRect.setAlpha(this.flashAlpha);
      }
    }

    this.renderWeatherParticles(dtSeconds);

    if (phase !== this.lastPhaseId) {
      this.lastPhaseId = phase;
      this.emitTelemetry(true, nowMs);
    } else {
      this.emitTelemetry(false, nowMs);
    }
  }

  private pickNextWeather(districtName: string): void {
    const prev = this.currentWeather;
    const roll = Math.random();
    if (districtName.includes('荒漠') || districtName.includes('火山')) {
      if (roll < 0.42) this.currentWeather = 'sandstorm';
      else if (roll < 0.78) this.currentWeather = 'clear';
      else this.currentWeather = 'storm';
    } else {
      if (roll < 0.42) this.currentWeather = 'clear';
      else if (roll < 0.74) this.currentWeather = 'rain';
      else if (roll < 0.92) this.currentWeather = 'storm';
      else this.currentWeather = 'sandstorm';
    }

    this.weatherTimerSec = 55 + Math.random() * 40;
    if (this.currentWeather !== prev) {
      const spec = WEATHER_SPECS[this.currentWeather];
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `气象播报：全城转为【${spec.label}】· ${spec.effectHint}`
      );
      this.emitTelemetry(true);
    }
  }

  private renderWeatherParticles(dtSeconds: number): void {
    this.weatherGfx.clear();
    if (this.currentWeather === 'clear') return;

    const w = this.viewW;
    const h = this.viewH;

    if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
      const count = this.currentWeather === 'storm' ? 65 : 42;
      const dx = this.currentWeather === 'storm' ? -130 : -75;
      const dy = this.currentWeather === 'storm' ? 540 : 440;
      const alpha = this.currentWeather === 'storm' ? 0.34 : 0.24;

      this.weatherGfx.lineStyle(1, 0x7dd3fc, alpha);
      for (let i = 0; i < count; i++) {
        const s = this.streaks[i];
        s.x += dx * dtSeconds;
        s.y += dy * dtSeconds;
        if (s.y > h + 20) {
          s.y = -18;
          s.x = Math.random() * (w + 140);
        }
        if (s.x < -30) {
          s.x = w + 10;
        }
        this.weatherGfx.lineBetween(s.x, s.y, s.x - 3, s.y + s.len);
      }
      return;
    }

    if (this.currentWeather === 'sandstorm') {
      this.weatherGfx.lineStyle(2, 0xfbbf24, 0.2);
      for (let i = 0; i < 45; i++) {
        const s = this.streaks[i];
        s.x += 280 * dtSeconds;
        s.y += 38 * dtSeconds;
        if (s.x > w + 30) {
          s.x = -24;
          s.y = Math.random() * h;
        }
        if (s.y > h + 20) s.y = 0;
        this.weatherGfx.lineBetween(s.x, s.y, s.x + s.len * 1.6, s.y + 2);
      }
    }
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 650) return;
    this.lastEmitAt = nowMs;

    const totalMin = Math.floor(this.clockMinutes) % 1440;
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    const phase = this.getTimePhase();
    const phaseSpec = TIME_PHASE_SPECS[phase];
    const weatherSpec = WEATHER_SPECS[this.currentWeather];

    gameEvents.emit(GAME_EVENT.ENVIRONMENT_UPDATED, {
      timePhase: phase,
      timeLabel: phaseSpec.label,
      clockText: `${hh}:${mm}`,
      weather: this.currentWeather,
      weatherLabel: weatherSpec.label,
      weatherEffectHint: weatherSpec.effectHint,
      darknessAlpha: phaseSpec.darknessAlpha,
    });
  }

  public destroy(): void {
    this.tintRect.destroy();
    this.weatherOverlayRect.destroy();
    this.weatherGfx.destroy();
    this.flashRect.destroy();
  }
}
