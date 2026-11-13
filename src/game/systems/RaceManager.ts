import Phaser from 'phaser';
import { PALETTE, RACE_CHECKPOINTS } from '../config/BalanceConfig';
import { Vehicle } from '../entities/Vehicle';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';
import { AudioManager } from './AudioManager';

const RACE_STORAGE_KEY = 'neon_district_race_records_v1';

export class RaceManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;

  private active = false;
  private checkpointIndex = 0;
  private timeRemainingSec = 0;
  private elapsedSec = 0;
  private countdownSec = 0;
  private lastWholeCountdown = 0;
  private bestTimeSec: number | null = null;
  private lastEmitAt = 0;

  private beaconContainer: Phaser.GameObjects.Container;
  private outerRing: Phaser.GameObjects.Arc;
  private innerRing: Phaser.GameObjects.Arc;
  private labelText: Phaser.GameObjects.Text;
  private pulsePhase = 0;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.loadBestTime();

    this.beaconContainer = scene.add.container(0, 0);
    this.beaconContainer.setDepth(19);
    this.beaconContainer.setVisible(false);

    this.outerRing = scene.add.circle(0, 0, 56, PALETTE.GOLD, 0.14);
    this.outerRing.setStrokeStyle(3, PALETTE.GOLD, 0.95);

    this.innerRing = scene.add.circle(0, 0, 32, PALETTE.NEON_CYAN, 0.18);
    this.innerRing.setStrokeStyle(2, PALETTE.NEON_CYAN, 0.9);

    this.labelText = scene.add.text(0, -68, '', {
      fontFamily: "'Noto Sans SC', monospace",
      fontSize: '12px',
      fontStyle: 'bold',
      color: PALETTE.GOLD_HEX,
      backgroundColor: '#080D18E0',
      padding: { x: 8, y: 3 },
    });
    this.labelText.setOrigin(0.5);

    this.beaconContainer.add([this.outerRing, this.innerRing, this.labelText]);
  }

  private loadBestTime(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(RACE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { bestTimeSec?: number };
      if (typeof parsed.bestTimeSec === 'number' && parsed.bestTimeSec > 0) {
        this.bestTimeSec = parsed.bestTimeSec;
      }
    } catch {
      // Ignore storage read errors
    }
  }

  private saveBestTime(timeSec: number): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(RACE_STORAGE_KEY, JSON.stringify({ bestTimeSec: timeSec }));
    } catch {
      // Ignore storage write errors
    }
  }

  public start(): void {
    this.active = true;
    this.checkpointIndex = 0;
    this.timeRemainingSec = 26;
    this.elapsedSec = 0;
    this.countdownSec = 3.0;
    this.lastWholeCountdown = 4;
    this.syncBeacon();
    this.emitTelemetry(true);
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, '极速狂飙准备发车！按住 W / 油门 + Shift 氮气冲刺！');
  }

  public stop(): void {
    this.active = false;
    this.countdownSec = 0;
    this.beaconContainer.setVisible(false);
    this.emitTelemetry(true);
  }

  public isActive(): boolean {
    return this.active;
  }

  public isCountingDown(): boolean {
    return this.active && this.countdownSec > 0;
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    racerPos: { x: number; y: number },
    vehicle: Vehicle | null,
    onRewardCash: (amount: number) => void
  ): void {
    if (!this.active) return;

    this.pulsePhase += dtSeconds * 5;
    if (this.beaconContainer.visible) {
      const s = 1 + Math.sin(this.pulsePhase) * 0.1;
      this.outerRing.setScale(s);
      this.innerRing.setScale(1 / s);
    }

    if (this.countdownSec > 0) {
      this.countdownSec = Math.max(0, this.countdownSec - dtSeconds);
      const whole = Math.ceil(this.countdownSec);
      if (whole !== this.lastWholeCountdown && whole > 0) {
        this.lastWholeCountdown = whole;
        this.audioManager.playInteract();
      }
      if (this.countdownSec <= 0) {
        this.audioManager.playPurchase();
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, 'GO! 全速冲刺！');
      }
      this.emitTelemetry(false, nowMs);
      return;
    }

    this.elapsedSec += dtSeconds;
    this.timeRemainingSec = Math.max(0, this.timeRemainingSec - dtSeconds);

    if (this.timeRemainingSec <= 0) {
      this.active = false;
      this.beaconContainer.setVisible(false);
      this.audioManager.playMissionFail();
      this.emitTelemetry(true, nowMs);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        '计时耗尽！按 Esc 打开菜单点击「重开极速狂飙」即可再次发车。'
      );
      return;
    }

    const cp = RACE_CHECKPOINTS[this.checkpointIndex];
    if (!cp) return;

    const dist = Phaser.Math.Distance.Between(racerPos.x, racerPos.y, cp.x, cp.y);
    if (dist <= 84) {
      vehicle?.refillNitro(65);

      if (this.checkpointIndex + 1 >= RACE_CHECKPOINTS.length) {
        // Finished circuit!
        const finalTime = Number(this.elapsedSec.toFixed(1));
        const isRecord = this.bestTimeSec === null || finalTime < this.bestTimeSec;
        if (isRecord) {
          this.bestTimeSec = finalTime;
          this.saveBestTime(finalTime);
        }
        this.active = false;
        this.beaconContainer.setVisible(false);
        this.audioManager.playMissionComplete();
        onRewardCash(800);
        this.emitTelemetry(true, nowMs);
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `环城赛冲线！用时 ${finalTime}s${isRecord ? '（刷新纪录！）' : ''}，赢得奖金 +$800！`
        );
        return;
      }

      this.checkpointIndex += 1;
      this.timeRemainingSec += cp.bonusSec;
      this.audioManager.playPurchase();
      const nextCp = RACE_CHECKPOINTS[this.checkpointIndex];
      this.syncBeacon();
      this.emitTelemetry(true, nowMs);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `通过【${cp.label}】+${cp.bonusSec}s！下一站：${nextCp.label}`
      );
      return;
    }

    this.emitTelemetry(false, nowMs);
  }

  private syncBeacon(): void {
    const cp = RACE_CHECKPOINTS[this.checkpointIndex];
    if (!cp || !this.active) {
      this.beaconContainer.setVisible(false);
      return;
    }
    this.beaconContainer.setPosition(cp.x, cp.y);
    this.labelText.setText(
      `检查点 ${this.checkpointIndex + 1}/${RACE_CHECKPOINTS.length} · ${cp.label}`
    );
    this.beaconContainer.setVisible(true);
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 120) return;
    this.lastEmitAt = nowMs;

    const cp = RACE_CHECKPOINTS[this.checkpointIndex];
    gameEvents.emit(GAME_EVENT.RACE_UPDATED, {
      active: this.active,
      checkpointIndex: this.checkpointIndex,
      totalCheckpoints: RACE_CHECKPOINTS.length,
      targetPos: this.active && cp ? { x: cp.x, y: cp.y } : null,
      targetLabel: this.active && cp ? cp.label : null,
      timeRemainingSec: Math.ceil(this.timeRemainingSec),
      elapsedSec: Number(this.elapsedSec.toFixed(1)),
      bestTimeSec: this.bestTimeSec,
      countdownSec: this.countdownSec > 0 ? Math.ceil(this.countdownSec) : 0,
    });
  }

  public destroy(): void {
    this.beaconContainer.destroy();
  }
}
