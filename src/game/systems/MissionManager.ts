import Phaser from 'phaser';
import { MISSION_DEFINITIONS, MissionDef, PALETTE } from '../config/BalanceConfig';
import { ActiveMissionState, GAME_EVENT, gameEvents } from '../ui/GameEvents';
import { AudioManager } from './AudioManager';
import { WantedManager } from './WantedManager';

export class MissionManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private wantedManager: WantedManager;

  private activeDef: MissionDef | null = null;
  private stepIndex = 0;
  private timeRemainingSec: number | null = null;
  private completedIds = new Set<string>();
  private totalEarnings = 0;
  private lastSyncEmit = 0;

  // World beacon visuals for spatial mission objectives
  private beaconContainer: Phaser.GameObjects.Container;
  private beaconOuterRing: Phaser.GameObjects.Arc;
  private beaconInnerDiamond: Phaser.GameObjects.Rectangle;
  private beaconLabel: Phaser.GameObjects.Text;
  private pulseTime = 0;

  constructor(
    scene: Phaser.Scene,
    audioManager: AudioManager,
    wantedManager: WantedManager
  ) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.wantedManager = wantedManager;

    this.beaconContainer = scene.add.container(0, 0);
    this.beaconContainer.setDepth(17);
    this.beaconContainer.setVisible(false);

    this.beaconOuterRing = scene.add.circle(0, 0, 34, PALETTE.GOLD, 0.14);
    this.beaconOuterRing.setStrokeStyle(3, PALETTE.GOLD, 0.92);

    this.beaconInnerDiamond = scene.add.rectangle(0, 0, 14, 14, PALETTE.GOLD, 0.95);
    this.beaconInnerDiamond.setRotation(Math.PI / 4);
    this.beaconInnerDiamond.setStrokeStyle(2, PALETTE.BG, 1);

    this.beaconLabel = scene.add.text(0, -44, '', {
      fontFamily: "'Noto Sans SC', monospace",
      fontSize: '11px',
      fontStyle: 'bold',
      color: PALETTE.GOLD_HEX,
      backgroundColor: '#080D18DD',
      padding: { x: 6, y: 2 },
    });
    this.beaconLabel.setOrigin(0.5);

    this.beaconContainer.add([this.beaconOuterRing, this.beaconInnerDiamond, this.beaconLabel]);
  }

  public acceptMission(missionId: string): boolean {
    const def = MISSION_DEFINITIONS.find((m) => m.id === missionId);
    if (!def) return false;

    this.activeDef = def;
    this.stepIndex = 0;
    this.timeRemainingSec = def.timeLimitSec;
    this.audioManager.playUiConfirm();
    this.syncBeaconVisual();
    this.emitSync(true);

    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `已接取任务【${def.title}】：${def.steps[0].instruction}`
    );
    return true;
  }

  public abandonMission(silent = false): void {
    if (!this.activeDef) return;
    const title = this.activeDef.title;
    this.activeDef = null;
    this.stepIndex = 0;
    this.timeRemainingSec = null;
    this.beaconContainer.setVisible(false);
    this.emitSync(true);

    if (!silent) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `已放弃任务【${title}】。`);
    }
  }

  public failActiveMission(reason: string): void {
    if (!this.activeDef) return;
    const title = this.activeDef.title;
    this.activeDef = null;
    this.stepIndex = 0;
    this.timeRemainingSec = null;
    this.beaconContainer.setVisible(false);
    this.audioManager.playMissionFail();
    this.emitSync(true);
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, `任务【${title}】失败：${reason}`);
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    inVehicle: boolean,
    onRewardCash: (amount: number) => void
  ): void {
    if (!this.activeDef) {
      if (this.beaconContainer.visible) {
        this.beaconContainer.setVisible(false);
      }
      return;
    }

    // Countdown timer check
    if (this.timeRemainingSec !== null) {
      this.timeRemainingSec = Math.max(0, this.timeRemainingSec - dtSeconds);
      if (this.timeRemainingSec <= 0) {
        this.failActiveMission('超时未完成委托');
        return;
      }
    }

    const step = this.activeDef.steps[this.stepIndex];
    if (!step) return;

    // Animate world waypoint beacon
    if (this.beaconContainer.visible) {
      this.pulseTime += dtSeconds * 4.2;
      const scale = 1 + Math.sin(this.pulseTime) * 0.14;
      this.beaconOuterRing.setScale(scale);
      this.beaconInnerDiamond.setRotation(this.pulseTime * 0.6);
    }

    let stepCompleted = false;
    if (step.objectiveType === 'reach' && step.targetPos) {
      const triggerRadius = inVehicle ? 54 : 44;
      const dist = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        step.targetPos.x,
        step.targetPos.y
      );
      if (dist <= triggerRadius) {
        stepCompleted = true;
      }
    } else if (step.objectiveType === 'escape_wanted') {
      if (this.wantedManager.getWantedLevel() === 0) {
        stepCompleted = true;
      }
    }

    if (stepCompleted) {
      if (step.triggerWantedStars && step.triggerWantedStars > 0 && step.targetPos) {
        this.wantedManager.reportCrime('steal_police_car', step.targetPos, true);
      }

      if (this.stepIndex + 1 < this.activeDef.steps.length) {
        this.stepIndex += 1;
        const nextStep = this.activeDef.steps[this.stepIndex];
        this.audioManager.playInteract();
        this.syncBeaconVisual();
        this.emitSync(true);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `目标更新：${nextStep.instruction}`);
      } else {
        // Mission Completed!
        const completed = this.activeDef;
        this.completedIds.add(completed.id);
        this.totalEarnings += completed.reward;
        this.activeDef = null;
        this.stepIndex = 0;
        this.timeRemainingSec = null;
        this.beaconContainer.setVisible(false);
        this.audioManager.playMissionComplete();
        onRewardCash(completed.reward);
        this.emitSync(true);
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `任务完成【${completed.title}】！获得报酬 $${completed.reward}`
        );
      }
      return;
    }

    // Periodic timer UI refresh
    if (nowMs - this.lastSyncEmit >= 250) {
      this.emitSync(false, nowMs);
    }
  }

  public hasActiveMission(): boolean {
    return Boolean(this.activeDef);
  }

  public getProgress(): { completedIds: string[]; totalEarnings: number } {
    return {
      completedIds: Array.from(this.completedIds),
      totalEarnings: this.totalEarnings,
    };
  }

  public restoreProgress(completedIds: string[], totalEarnings: number): void {
    this.activeDef = null;
    this.stepIndex = 0;
    this.timeRemainingSec = null;
    this.beaconContainer.setVisible(false);
    this.completedIds = new Set(completedIds);
    this.totalEarnings = Math.max(0, totalEarnings);
    this.emitSync(true);
  }

  public resetProgress(): void {
    this.restoreProgress([], 0);
  }

  public emitSync(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastSyncEmit < 200) return;
    this.lastSyncEmit = nowMs;

    let activeMission: ActiveMissionState | null = null;
    if (this.activeDef) {
      const step = this.activeDef.steps[this.stepIndex];
      activeMission = {
        id: this.activeDef.id,
        title: this.activeDef.title,
        category: this.activeDef.category,
        reward: this.activeDef.reward,
        stepIndex: this.stepIndex,
        totalSteps: this.activeDef.steps.length,
        instruction: step.instruction,
        objectiveType: step.objectiveType,
        targetPos: step.targetPos,
        targetLabel: step.targetLabel,
        timeRemainingSec:
          this.timeRemainingSec !== null ? Math.ceil(this.timeRemainingSec) : null,
      };
    }

    gameEvents.emit(GAME_EVENT.MISSION_UPDATED, {
      activeMission,
      completedIds: Array.from(this.completedIds),
      totalEarnings: this.totalEarnings,
    });
  }

  private syncBeaconVisual(): void {
    if (!this.activeDef) {
      this.beaconContainer.setVisible(false);
      return;
    }
    const step = this.activeDef.steps[this.stepIndex];
    if (step.objectiveType === 'reach' && step.targetPos) {
      this.beaconContainer.setPosition(step.targetPos.x, step.targetPos.y);
      this.beaconLabel.setText(step.targetLabel ?? '任务目标');
      this.beaconContainer.setVisible(true);
    } else {
      this.beaconContainer.setVisible(false);
    }
  }

  public destroy(): void {
    this.beaconContainer.destroy();
  }
}
