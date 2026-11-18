import { WANTED_CONFIG } from '../config/BalanceConfig';
import { GAME_EVENT, gameEvents, PoliceMapMarker } from '../ui/GameEvents';
import { AudioManager } from './AudioManager';

export type CrimeType =
  | 'hit_pedestrian'
  | 'ram_police'
  | 'reckless_crash'
  | 'steal_police_car'
  | 'weapon_discharge'
  | 'assault_police'
  | 'destroy_police';

export class WantedManager {
  private audioManager: AudioManager;
  private wantedLevel = 0;
  private spotted = false;
  private escapeTimer = 0;
  private lastKnownPos: { x: number; y: number } | null = null;
  private policeMarkers: PoliceMapMarker[] = [];
  private lastEmitTime = 0;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public reportCrime(
    type: CrimeType,
    crimePos: { x: number; y: number },
    hasWitnessOrNearbyPolice = true
  ): void {
    if (
      !hasWitnessOrNearbyPolice &&
      this.wantedLevel === 0 &&
      (type === 'reckless_crash' || type === 'weapon_discharge')
    ) {
      return;
    }

    const prevLevel = this.wantedLevel;
    let nextLevel = this.wantedLevel;

    if (type === 'destroy_police') {
      nextLevel = Math.min(WANTED_CONFIG.MAX_STARS, Math.max(nextLevel + 1, 3));
    } else if (type === 'ram_police' || type === 'steal_police_car' || type === 'assault_police') {
      nextLevel = Math.min(WANTED_CONFIG.MAX_STARS, Math.max(nextLevel + 1, 2));
    } else if (type === 'hit_pedestrian') {
      nextLevel = Math.min(WANTED_CONFIG.MAX_STARS, Math.max(nextLevel + 1, 1));
    } else if (type === 'reckless_crash' || type === 'weapon_discharge') {
      nextLevel = Math.min(WANTED_CONFIG.MAX_STARS, Math.max(nextLevel, 1));
    }

    this.lastKnownPos = { x: Math.round(crimePos.x), y: Math.round(crimePos.y) };
    this.escapeTimer = 0;

    if (nextLevel > prevLevel) {
      this.wantedLevel = nextLevel;
      this.spotted = true;
      this.audioManager.playWantedTriggered();

      if (nextLevel === 5) {
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          '★★★★★ 五星最高通缉！NCPD 特警装甲车与主战坦克已出动拦截！'
        );
      } else if (nextLevel === 4) {
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          '★★★★ 四星通缉！武装警用直升机已升空锁定你的行踪！'
        );
      } else if (nextLevel === 3) {
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          '★★★ 三星通缉！高速拦截警车加入全城围捕！'
        );
      } else {
        const reasonMap: Record<CrimeType, string> = {
          hit_pedestrian: '伤及市民，特区警队已发出通缉！',
          ram_police: '袭击特区警车，通缉等级升级！',
          reckless_crash: '危险驾驶引发事故，引起巡逻警车注意！',
          steal_police_car: '劫持警用巡逻车，全区警力正在追捕！',
          weapon_discharge: '城区非法开火，特区警队正在赶往现场！',
          assault_police: '武装袭警！全区警车进入高度拦截状态！',
          destroy_police: '击毁警用单位！特区防卫部队介入追缉！',
        };
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, reasonMap[type]);
      }
      this.emitState(true);
    }
  }

  private getEscapeDuration(stars: number): number {
    if (stars >= 5) return WANTED_CONFIG.ESCAPE_TIME_STAR_5;
    if (stars === 4) return WANTED_CONFIG.ESCAPE_TIME_STAR_4;
    if (stars === 3) return WANTED_CONFIG.ESCAPE_TIME_STAR_3;
    if (stars === 2) return WANTED_CONFIG.ESCAPE_TIME_STAR_2;
    return WANTED_CONFIG.ESCAPE_TIME_STAR_1;
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    spottedNow: boolean,
    playerPos: { x: number; y: number },
    markers: PoliceMapMarker[]
  ): void {
    this.policeMarkers = markers;

    if (this.wantedLevel === 0) {
      this.spotted = false;
      this.escapeTimer = 0;
      this.lastKnownPos = null;
      this.audioManager.updateSirenSound(false, dtSeconds);
      if (nowMs - this.lastEmitTime > 300) {
        this.emitState(false, nowMs);
      }
      return;
    }

    this.spotted = spottedNow;
    if (spottedNow) {
      this.lastKnownPos = { x: Math.round(playerPos.x), y: Math.round(playerPos.y) };
      this.escapeTimer = 0;
    } else {
      this.escapeTimer += dtSeconds;
      const requiredTime = this.getEscapeDuration(this.wantedLevel);

      if (this.escapeTimer >= requiredTime) {
        this.clearWanted(true);
        return;
      }
    }

    this.audioManager.updateSirenSound(this.wantedLevel > 0, dtSeconds);

    if (nowMs - this.lastEmitTime > 120) {
      this.emitState(false, nowMs);
    }
  }

  public clearWanted(escaped: boolean): void {
    if (this.wantedLevel === 0) return;
    this.wantedLevel = 0;
    this.spotted = false;
    this.escapeTimer = 0;
    this.lastKnownPos = null;
    this.audioManager.stopSirenSound();

    if (escaped) {
      this.audioManager.playEscapedChime();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '成功甩掉特区警队追捕，通缉已解除！');
    }

    this.emitState(true);
  }

  public reduceWanted(stars = 1): void {
    if (this.wantedLevel === 0) return;
    const next = Math.max(0, this.wantedLevel - stars);
    if (next === 0) {
      this.clearWanted(true);
      return;
    }
    this.wantedLevel = next;
    this.escapeTimer = 0;
    this.audioManager.playEscapedChime();
    this.emitState(true);
  }

  public getWantedLevel(): number {
    return this.wantedLevel;
  }

  public isSpotted(): boolean {
    return this.spotted;
  }

  public getLastKnownPos(): { x: number; y: number } | null {
    return this.lastKnownPos;
  }

  private emitState(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitTime < 100) return;
    this.lastEmitTime = nowMs;

    const requiredTime = this.getEscapeDuration(this.wantedLevel);
    const escapeProgress =
      this.wantedLevel > 0 && !this.spotted
        ? Math.min(100, Math.round((this.escapeTimer / requiredTime) * 100))
        : 0;

    gameEvents.emit(GAME_EVENT.WANTED_CHANGED, {
      wantedLevel: this.wantedLevel,
      spotted: this.spotted,
      escapeProgress,
      lastKnownPos: this.lastKnownPos,
      policeMarkers: this.policeMarkers,
    });
  }

  public destroy(): void {
    this.audioManager.stopSirenSound();
  }
}
