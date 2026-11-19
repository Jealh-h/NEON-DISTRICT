import Phaser from 'phaser';
import {
  TIME_PHASE_SPECS,
  TimePhaseId,
  WEATHER_ORDER,
  WEATHER_SPECS,
  WeatherId,
  WeatherPostFxSpec,
} from '../config/ExpansionConfig';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';

interface StreakDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  altTone: boolean;
}

interface SplashRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: number;
}

interface FogPuff {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  baseAlpha: number;
  phase: number;
}

const FOG_TEXTURE_KEY = 'env_fog_puff_v1';

export class EnvironmentManager {
  private scene: Phaser.Scene;
  private tintRect: Phaser.GameObjects.Rectangle;
  private weatherOverlayRect: Phaser.GameObjects.Rectangle;
  private flashRect: Phaser.GameObjects.Rectangle;
  private weatherGfx: Phaser.GameObjects.Graphics;
  private scanlineGfx: Phaser.GameObjects.Graphics;

  // WebGL camera post-processing filters (Phaser 4 FilterList)
  private colorMatrixFilter: Phaser.Filters.ColorMatrix | null = null;
  private vignetteFilter: Phaser.Filters.Vignette | null = null;
  private blurFilter: Phaser.Filters.Blur | null = null;

  private fogPuffs: FogPuff[] = [];
  private splashes: SplashRipple[] = [];

  // Start at bright 10:30 neon daylight with clear sky for crisp visibility
  private clockMinutes = 10 * 60 + 30;
  private readonly minutesPerSecond = 4.2;

  private currentWeather: WeatherId = 'clear';
  private weatherTimerSec = 60;
  private lightningTimerSec = 6;
  private flashAlpha = 0;

  private curPostFx: WeatherPostFxSpec;
  private curVignetteRgb = { r: 2, g: 6, b: 23 };
  private lastColorMatrixSig = '';

  private lastEmitAt = 0;
  private lastPhaseId: TimePhaseId = 'day';
  private streaks: StreakDrop[] = [];
  private viewW = 1280;
  private viewH = 720;
  private elapsedSec = 0;

  private weatherFxEnabled = true;
  private brightnessMode: 'bright' | 'classic' = 'bright';
  private qualityTier: 'high' | 'medium' | 'low' = 'high';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.viewW = Math.max(640, scene.scale.width || 1280);
    this.viewH = Math.max(480, scene.scale.height || 720);

    const startPost = WEATHER_SPECS[this.currentWeather].postFx;
    this.curPostFx = { ...startPost };
    const initCol = Phaser.Display.Color.IntegerToColor(startPost.vignetteColor);
    this.curVignetteRgb = { r: initCol.red, g: initCol.green, b: initCol.blue };

    this.ensureFogTexture();

    // Camera-locked screen-space atmosphere overlays
    this.tintRect = scene.add
      .rectangle(0, 0, this.viewW * 2, this.viewH * 2, 0x0f172a, 0.0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50);

    this.weatherOverlayRect = scene.add
      .rectangle(0, 0, this.viewW * 2, this.viewH * 2, 0x081126, 0.0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(51);

    this.initFogPuffs();

    this.weatherGfx = scene.add.graphics().setScrollFactor(0).setDepth(53);

    this.scanlineGfx = scene.add.graphics().setScrollFactor(0).setDepth(54);

    this.flashRect = scene.add
      .rectangle(0, 0, this.viewW * 2, this.viewH * 2, 0xe0f2fe, 0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(55)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.initCameraPostProcessing();
    this.initStreaks();
    this.recenterOverlays();
    this.applyPostFxToFilters(true);
    this.emitTelemetry(true);
  }

  private ensureFogTexture(): void {
    if (this.scene.textures.exists(FOG_TEXTURE_KEY)) return;
    const gfx = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const size = 128;
    const cx = size / 2;
    const rings = [
      { r: 62, a: 0.08 },
      { r: 48, a: 0.14 },
      { r: 34, a: 0.22 },
      { r: 20, a: 0.26 },
    ];
    for (const ring of rings) {
      gfx.fillStyle(0xffffff, ring.a);
      gfx.fillCircle(cx, cx, ring.r);
    }
    gfx.generateTexture(FOG_TEXTURE_KEY, size, size);
    gfx.destroy();
  }

  private initFogPuffs(): void {
    this.fogPuffs = [];
    for (let i = 0; i < 14; i++) {
      const sprite = this.scene.add
        .image(
          Math.random() * this.viewW,
          Math.random() * this.viewH,
          FOG_TEXTURE_KEY
        )
        .setScrollFactor(0)
        .setDepth(52)
        .setScale(2.4 + Math.random() * 2.2)
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);

      this.fogPuffs.push({
        sprite,
        vx: (i % 2 === 0 ? 1 : -1) * (16 + Math.random() * 22),
        vy: -4 + Math.random() * 8,
        baseAlpha: 0.08 + Math.random() * 0.09,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private initCameraPostProcessing(): void {
    const cam = this.scene.cameras.main;
    if (this.scene.game.renderer.type !== Phaser.WEBGL || !cam.filters?.external) {
      return;
    }

    const ext = cam.filters.external;
    this.blurFilter = ext.addBlur(0, 1.1, 1.1, 0, 0xffffff, 2);
    this.blurFilter.active = false;

    this.colorMatrixFilter = ext.addColorMatrix();
    this.vignetteFilter = ext.addVignette(
      0.5,
      0.5,
      this.curPostFx.vignetteRadius,
      this.curPostFx.vignetteStrength,
      WEATHER_SPECS[this.currentWeather].postFx.vignetteColor,
      Phaser.BlendModes.MULTIPLY
    );
  }

  private initStreaks(): void {
    this.streaks = [];
    for (let i = 0; i < 85; i++) {
      this.streaks.push({
        x: Math.random() * this.viewW,
        y: Math.random() * this.viewH,
        len: 10 + Math.random() * 15,
        speed: 440 + Math.random() * 280,
        altTone: i % 3 === 0,
      });
    }
  }

  private redrawScanlines(): void {
    this.scanlineGfx.clear();
    this.scanlineGfx.fillStyle(0x000000, 1);
    for (let y = 0; y < this.viewH; y += 4) {
      this.scanlineGfx.fillRect(0, y, this.viewW, 1);
    }
    this.scanlineGfx.setAlpha(this.curPostFx.scanlineAlpha);
  }

  private recenterOverlays(): void {
    const w = Math.max(640, this.scene.scale.width || 1280);
    const h = Math.max(480, this.scene.scale.height || 720);
    this.viewW = w;
    this.viewH = h;
    const coverW = w * 2.4;
    const coverH = h * 2.4;
    const cx = w * 0.5;
    const cy = h * 0.5;

    this.tintRect.setPosition(cx, cy).setSize(coverW, coverH);
    this.weatherOverlayRect.setPosition(cx, cy).setSize(coverW, coverH);
    this.flashRect.setPosition(cx, cy).setSize(coverW, coverH);
    this.redrawScanlines();
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

  public cycleWeatherManual(): void {
    const idx = WEATHER_ORDER.indexOf(this.currentWeather);
    const next = WEATHER_ORDER[(idx + 1) % WEATHER_ORDER.length];
    this.setWeather(next, true);
  }

  public setVisualPreferences(
    weatherFx: boolean,
    brightness: 'bright' | 'classic',
    quality: 'high' | 'medium' | 'low'
  ): void {
    this.weatherFxEnabled = weatherFx;
    this.brightnessMode = brightness;
    this.qualityTier = quality;
    if (!weatherFx) {
      this.weatherGfx.clear();
      this.weatherOverlayRect.setFillStyle(0x081126, 0);
      for (const puff of this.fogPuffs) {
        puff.sprite.setAlpha(0);
      }
    }
    this.lerpPostFx(1, this.getTimePhase());
    this.applyPostFxToFilters(true);
  }

  public setWeather(nextWeather: WeatherId, manual = false): void {
    const prev = this.currentWeather;
    this.currentWeather = nextWeather;
    this.weatherTimerSec = 55 + Math.random() * 40;
    if (nextWeather !== prev || manual) {
      const spec = WEATHER_SPECS[nextWeather];
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `气象切换：【${spec.label}】· ${spec.effectHint}`
      );
      this.emitTelemetry(true);
    }
  }

  public update(dtSeconds: number, nowMs: number, districtName: string, isPlaying: boolean): void {
    if (!isPlaying) return;

    this.elapsedSec += dtSeconds;
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
    this.weatherOverlayRect.setFillStyle(
      weatherSpec.overlayColor,
      this.weatherFxEnabled ? weatherSpec.overlayAlpha : 0
    );

    // Lightning flash decay in storm
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dtSeconds * 2.4);
      this.flashRect.setAlpha(this.weatherFxEnabled ? this.flashAlpha : 0);
    }

    if (this.weatherFxEnabled && this.currentWeather === 'storm') {
      this.lightningTimerSec -= dtSeconds;
      if (this.lightningTimerSec <= 0) {
        this.lightningTimerSec = 5 + Math.random() * 8;
        this.flashAlpha = 0.28;
        this.flashRect.setAlpha(this.flashAlpha);
      }
    }

    this.lerpPostFx(dtSeconds, phase);
    this.applyPostFxToFilters(false);
    this.updateFogPuffs(dtSeconds);
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
    let next: WeatherId = 'rain';

    if (districtName.includes('荒漠') || districtName.includes('火山')) {
      if (roll < 0.42) next = 'sandstorm';
      else if (roll < 0.68) next = 'acid_rain';
      else if (roll < 0.86) next = 'clear';
      else next = 'storm';
    } else if (districtName.includes('港') || districtName.includes('工业')) {
      if (roll < 0.3) next = 'rain';
      else if (roll < 0.56) next = 'acid_rain';
      else if (roll < 0.78) next = 'fog';
      else if (roll < 0.92) next = 'storm';
      else next = 'clear';
    } else {
      if (roll < 0.34) next = 'rain';
      else if (roll < 0.56) next = 'fog';
      else if (roll < 0.74) next = 'acid_rain';
      else if (roll < 0.88) next = 'clear';
      else next = 'storm';
    }

    this.weatherTimerSec = 52 + Math.random() * 40;
    this.currentWeather = next;
    if (next !== prev) {
      const spec = WEATHER_SPECS[next];
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `气象播报：全城转为【${spec.label}】· ${spec.effectHint}`
      );
      this.emitTelemetry(true);
    }
  }

  private lerpPostFx(dtSeconds: number, phase: TimePhaseId): void {
    const target = WEATHER_SPECS[this.currentWeather].postFx;
    const t = Math.min(1, dtSeconds * 1.45);

    const timeContrastBonus = phase === 'night' ? 0.03 : phase === 'dusk' ? 0.02 : 0;
    const timeBrightBonus = phase === 'day' ? 0.05 : phase === 'dawn' ? 0.02 : 0;
    const userBrightOffset = this.brightnessMode === 'bright' ? 0.08 : -0.04;
    const stormFlashBoost = this.weatherFxEnabled ? this.flashAlpha * 0.55 : 0;

    const targetSaturation = target.saturation;
    const targetContrast = target.contrast + timeContrastBonus + stormFlashBoost * 0.35;
    const targetBrightness = target.brightness + timeBrightBonus + userBrightOffset + stormFlashBoost;

    this.curPostFx.saturation += (targetSaturation - this.curPostFx.saturation) * t;
    this.curPostFx.contrast += (targetContrast - this.curPostFx.contrast) * t;
    this.curPostFx.brightness += (targetBrightness - this.curPostFx.brightness) * t;
    this.curPostFx.hueShiftDeg += (target.hueShiftDeg - this.curPostFx.hueShiftDeg) * t;
    this.curPostFx.vignetteRadius += (target.vignetteRadius - this.curPostFx.vignetteRadius) * t;
    this.curPostFx.vignetteStrength +=
      (target.vignetteStrength - this.curPostFx.vignetteStrength) * t;
    this.curPostFx.blurStrength += (target.blurStrength - this.curPostFx.blurStrength) * t;
    this.curPostFx.scanlineAlpha += (target.scanlineAlpha - this.curPostFx.scanlineAlpha) * t;

    const targetCol = Phaser.Display.Color.IntegerToColor(target.vignetteColor);
    this.curVignetteRgb.r += (targetCol.red - this.curVignetteRgb.r) * t;
    this.curVignetteRgb.g += (targetCol.green - this.curVignetteRgb.g) * t;
    this.curVignetteRgb.b += (targetCol.blue - this.curVignetteRgb.b) * t;
  }

  private applyPostFxToFilters(force: boolean): void {
    this.scanlineGfx.setAlpha(this.qualityTier === 'low' ? 0 : this.curPostFx.scanlineAlpha);

    if (this.colorMatrixFilter) {
      const sig = [
        this.curPostFx.saturation.toFixed(3),
        this.curPostFx.contrast.toFixed(3),
        this.curPostFx.brightness.toFixed(3),
        this.curPostFx.hueShiftDeg.toFixed(2),
      ].join('|');

      if (force || sig !== this.lastColorMatrixSig) {
        this.lastColorMatrixSig = sig;
        const cm = this.colorMatrixFilter.colorMatrix;
        cm.reset();
        cm.saturate(this.curPostFx.saturation, true);
        cm.contrast(this.curPostFx.contrast, true);
        cm.brightness(this.curPostFx.brightness, true);
        if (Math.abs(this.curPostFx.hueShiftDeg) > 0.25) {
          cm.hue(this.curPostFx.hueShiftDeg, true);
        }
      }
    }

    if (this.vignetteFilter) {
      this.vignetteFilter.radius = this.curPostFx.vignetteRadius;
      this.vignetteFilter.strength = this.curPostFx.vignetteStrength;
      this.vignetteFilter.setColor({
        r: Math.round(this.curVignetteRgb.r),
        g: Math.round(this.curVignetteRgb.g),
        b: Math.round(this.curVignetteRgb.b),
      });
    }

    if (this.blurFilter) {
      if (this.weatherFxEnabled && this.qualityTier !== 'low' && this.curPostFx.blurStrength > 0.03) {
        this.blurFilter.active = true;
        this.blurFilter.strength = this.curPostFx.blurStrength;
      } else {
        this.blurFilter.active = false;
      }
    }
  }

  private updateFogPuffs(dtSeconds: number): void {
    const w = this.viewW;
    const h = this.viewH;
    const weather = this.currentWeather;

    let targetVisibility = 0;
    let tintA = 0x94a3b8;
    let tintB = 0x38bdf8;
    if (this.weatherFxEnabled && this.qualityTier !== 'low') {
      if (weather === 'fog') {
        targetVisibility = 1;
        tintA = 0x7dd3fc;
        tintB = 0xc084fc;
      } else if (weather === 'acid_rain') {
        targetVisibility = 0.65;
        tintA = 0x4ade80;
        tintB = 0xa3e635;
      } else if (weather === 'sandstorm') {
        targetVisibility = 0.72;
        tintA = 0xf59e0b;
        tintB = 0xea580c;
      }
    }

    for (let i = 0; i < this.fogPuffs.length; i++) {
      const puff = this.fogPuffs[i];
      if (targetVisibility <= 0.01) {
        puff.sprite.setAlpha(Math.max(0, puff.sprite.alpha - dtSeconds * 0.25));
        continue;
      }

      const targetAlpha =
        puff.baseAlpha *
        targetVisibility *
        (0.82 + 0.18 * Math.sin(this.elapsedSec * 0.7 + puff.phase));
      const nextAlpha = puff.sprite.alpha + (targetAlpha - puff.sprite.alpha) * Math.min(1, dtSeconds * 2);
      puff.sprite.setAlpha(nextAlpha);
      puff.sprite.setTint(i % 2 === 0 ? tintA : tintB);

      const speedMult = weather === 'sandstorm' ? 3.2 : 1;
      puff.sprite.x += puff.vx * speedMult * dtSeconds;
      puff.sprite.y += puff.vy * dtSeconds;

      if (puff.sprite.x > w + 260) puff.sprite.x = -260;
      if (puff.sprite.x < -260) puff.sprite.x = w + 260;
      if (puff.sprite.y > h + 220) puff.sprite.y = -220;
      if (puff.sprite.y < -220) puff.sprite.y = h + 220;
    }
  }

  private spawnSplash(x: number, y: number, color: number): void {
    if (this.splashes.length >= 26) return;
    this.splashes.push({
      x,
      y,
      radius: 2,
      maxRadius: 8 + Math.random() * 7,
      alpha: 0.45,
      color,
    });
  }

  private renderWeatherParticles(dtSeconds: number): void {
    this.weatherGfx.clear();
    if (!this.weatherFxEnabled) {
      this.splashes = [];
      return;
    }

    const qScale = this.qualityTier === 'high' ? 1 : this.qualityTier === 'medium' ? 0.55 : 0.25;
    const w = this.viewW;
    const h = this.viewH;
    const weather = this.currentWeather;

    // Update & render ground splash ripples
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.radius += dtSeconds * 26;
      sp.alpha -= dtSeconds * 1.15;
      if (sp.alpha <= 0 || sp.radius >= sp.maxRadius) {
        this.splashes.splice(i, 1);
        continue;
      }
      this.weatherGfx.lineStyle(1, sp.color, sp.alpha);
      this.weatherGfx.strokeEllipse(sp.x, sp.y, sp.radius * 2, sp.radius * 0.85);
    }

    if (weather === 'clear' || weather === 'fog') {
      if (weather === 'fog') {
        const moteCount = Math.max(6, Math.round(24 * qScale));
        this.weatherGfx.fillStyle(0xcbd5e1, 0.22);
        for (let i = 0; i < moteCount; i++) {
          const s = this.streaks[i];
          s.x += 22 * dtSeconds;
          s.y += Math.sin(this.elapsedSec + i) * 8 * dtSeconds;
          if (s.x > w + 20) s.x = -16;
          this.weatherGfx.fillCircle(s.x, s.y, 1.5);
        }
      }
      return;
    }

    if (weather === 'rain' || weather === 'acid_rain' || weather === 'storm') {
      const baseCount = weather === 'storm' ? 82 : weather === 'acid_rain' ? 68 : 62;
      const count = Math.max(12, Math.round(baseCount * qScale));
      const dx = weather === 'storm' ? -150 : weather === 'acid_rain' ? -55 : -82;
      const dy = weather === 'storm' ? 610 : weather === 'acid_rain' ? 470 : 500;
      const baseAlpha = weather === 'storm' ? 0.36 : weather === 'acid_rain' ? 0.32 : 0.29;
      const primaryColor =
        weather === 'acid_rain' ? 0x4ade80 : weather === 'storm' ? 0x7dd3fc : 0x00f5ff;
      const secondaryColor =
        weather === 'acid_rain' ? 0xbef264 : weather === 'storm' ? 0xc084fc : 0xff2e88;

      for (let i = 0; i < count; i++) {
        const s = this.streaks[i];
        s.x += dx * dtSeconds;
        s.y += dy * dtSeconds;
        if (s.y > h + 20) {
          if (this.qualityTier !== 'low' && Math.random() < 0.22) {
            this.spawnSplash(
              Math.max(12, Math.min(w - 12, s.x)),
              h * (0.22 + Math.random() * 0.72),
              s.altTone ? secondaryColor : primaryColor
            );
          }
          s.y = -18;
          s.x = Math.random() * (w + 160);
        }
        if (s.x < -30) {
          s.x = w + 10;
        }
        const col = s.altTone ? secondaryColor : primaryColor;
        this.weatherGfx.lineStyle(s.altTone ? 1.4 : 1, col, baseAlpha);
        this.weatherGfx.lineBetween(s.x, s.y, s.x + (dx / dy) * s.len, s.y + s.len);
      }
      return;
    }

    if (weather === 'sandstorm') {
      const sandCount = Math.max(12, Math.round(55 * qScale));
      for (let i = 0; i < sandCount; i++) {
        const s = this.streaks[i];
        s.x += 320 * dtSeconds;
        s.y += 42 * dtSeconds;
        if (s.x > w + 30) {
          s.x = -24;
          s.y = Math.random() * h;
        }
        if (s.y > h + 20) s.y = 0;
        this.weatherGfx.lineStyle(2, s.altTone ? 0xf97316 : 0xfbbf24, 0.24);
        this.weatherGfx.lineBetween(s.x, s.y, s.x + s.len * 1.8, s.y + 3);
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
    const cam = this.scene.cameras?.main;
    if (cam?.filters?.external) {
      if (this.blurFilter) cam.filters.external.remove(this.blurFilter, true);
      if (this.colorMatrixFilter) cam.filters.external.remove(this.colorMatrixFilter, true);
      if (this.vignetteFilter) cam.filters.external.remove(this.vignetteFilter, true);
    }
    this.blurFilter = null;
    this.colorMatrixFilter = null;
    this.vignetteFilter = null;

    for (const puff of this.fogPuffs) {
      puff.sprite.destroy();
    }
    this.fogPuffs = [];
    this.splashes = [];
    this.tintRect.destroy();
    this.weatherOverlayRect.destroy();
    this.weatherGfx.destroy();
    this.scanlineGfx.destroy();
    this.flashRect.destroy();
  }
}
