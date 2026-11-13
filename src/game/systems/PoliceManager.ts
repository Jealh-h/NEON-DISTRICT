import Phaser from 'phaser';
import { WANTED_CONFIG } from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { Police } from '../entities/Police';
import { Vehicle } from '../entities/Vehicle';
import { PoliceMapMarker } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';
import { WantedManager } from './WantedManager';

const PATROL_LOOP_NORTH = [
  { x: 352, y: 288 },
  { x: 1248, y: 288 },
  { x: 1248, y: 896 },
  { x: 352, y: 896 },
];

const PATROL_LOOP_SOUTH = [
  { x: 1248, y: 896 },
  { x: 352, y: 896 },
  { x: 352, y: 320 },
  { x: 1248, y: 320 },
];

const PATROL_LOOP_HIGHLAND = [
  { x: 1248, y: 320 },
  { x: 1952, y: 320 },
  { x: 1952, y: 896 },
  { x: 1248, y: 896 },
];

const PATROL_LOOP_HARBOR_CHROME = [
  { x: 1248, y: 1632 },
  { x: 2400, y: 1632 },
  { x: 2400, y: 2144 },
  { x: 1248, y: 2144 },
];

export class PoliceManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;
  private wantedManager: WantedManager;
  private units: Police[] = [];
  private losTimer = 0;
  private cachedSpotted = false;
  private pursuitEnabled = true;

  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    audioManager: AudioManager,
    wantedManager: WantedManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
    this.wantedManager = wantedManager;
  }

  public setPursuitEnabled(enabled: boolean): void {
    this.pursuitEnabled = enabled;
    for (const u of this.units) {
      u.setUnitVisible(enabled);
      if (enabled) {
        u.resetToPatrol();
      }
    }
    if (!enabled) {
      this.wantedManager.clearWanted(true);
    }
  }

  public spawnPoliceUnits(
    player: Player,
    vehicles: Vehicle[],
    onPlayerDamaged: (amount: number, sourceX: number, sourceY: number) => void
  ): void {
    const unitDefs = [
      { id: 'police-1', loop: PATROL_LOOP_NORTH, startIdx: 0 },
      { id: 'police-2', loop: PATROL_LOOP_SOUTH, startIdx: 1 },
      { id: 'police-3', loop: PATROL_LOOP_HIGHLAND, startIdx: 1 },
      { id: 'police-4', loop: PATROL_LOOP_HARBOR_CHROME, startIdx: 0 },
    ];

    const group = this.scene.physics.add.group();

    for (const def of unitDefs) {
      const unit = new Police(this.scene, def.id, def.loop, def.startIdx);
      this.units.push(unit);
      group.add(unit.sprite);

      this.collisionManager.registerVehicleWorldCollider(unit.sprite);

      // Police ramming player on foot
      this.scene.physics.add.collider(player.sprite, unit.sprite, () => {
        if (!this.pursuitEnabled || unit.isDisabled()) return;
        if (this.wantedManager.getWantedLevel() > 0) {
          unit.triggerRamRecovery();
          onPlayerDamaged(WANTED_CONFIG.POLICE_CONTACT_DAMAGE_FOOT, unit.sprite.x, unit.sprite.y);
        } else {
          this.audioManager.playBump(this.scene.time.now);
        }
      });

      // Police vs drivable vehicles
      for (const v of vehicles) {
        this.scene.physics.add.collider(v.sprite, unit.sprite, () => {
          if (!this.pursuitEnabled || unit.isDisabled()) return;
          const vBody = v.sprite.body as Phaser.Physics.Arcade.Body;
          const pBody = unit.sprite.body as Phaser.Physics.Arcade.Body;
          const relSpeed = Math.max(vBody?.speed ?? 0, pBody?.speed ?? 0);

          if (v.isOccupied() && relSpeed > 105) {
            unit.triggerRamRecovery();
            this.wantedManager.reportCrime('ram_police', { x: v.sprite.x, y: v.sprite.y }, true);
            this.audioManager.playCrash(this.scene.time.now, Math.min(1, relSpeed / 360));
            this.scene.cameras.main.shake(100, 0.0035);
            if (this.wantedManager.getWantedLevel() > 0) {
              onPlayerDamaged(WANTED_CONFIG.POLICE_CONTACT_DAMAGE_VEH, unit.sprite.x, unit.sprite.y);
            }
          }
        });
      }
    }

    this.scene.physics.add.collider(group, group);
  }

  public getUnits(): Police[] {
    return this.units;
  }

  public isPoliceNearby(x: number, y: number, radius = 340): boolean {
    if (!this.pursuitEnabled) return false;
    for (const unit of this.units) {
      if (unit.isDisabled()) continue;
      if (Phaser.Math.Distance.Between(x, y, unit.sprite.x, unit.sprite.y) <= radius) {
        return true;
      }
    }
    return false;
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    playerInVehicle: boolean
  ): void {
    if (!this.pursuitEnabled) {
      return;
    }

    const wantedLevel = this.wantedManager.getWantedLevel();

    this.losTimer += dtSeconds;
    if (this.losTimer >= 0.16) {
      this.losTimer = 0;
      this.cachedSpotted = this.evaluateLineOfSight(wantedLevel, playerPos);
    }

    if (wantedLevel === 0) {
      this.cachedSpotted = false;
      for (const unit of this.units) {
        unit.setState('PATROL');
      }
    } else if (wantedLevel === 1) {
      let closestIdx = 0;
      let closestDist = Infinity;
      this.units.forEach((u, idx) => {
        const d = Phaser.Math.Distance.Between(u.sprite.x, u.sprite.y, playerPos.x, playerPos.y);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = idx;
        }
      });

      this.units.forEach((u, idx) => {
        if (u.isDisabled()) return;
        if (idx === closestIdx) {
          u.setState(this.cachedSpotted ? 'PURSUE' : 'SEARCH');
        } else {
          const canSee = this.canUnitSeePlayer(u, playerPos, WANTED_CONFIG.DETECT_RANGE);
          u.setState(canSee ? 'PURSUE' : 'PATROL');
        }
      });
    } else {
      for (const unit of this.units) {
        unit.setState(this.cachedSpotted ? 'PURSUE' : 'SEARCH');
      }
    }

    const lastKnown = this.wantedManager.getLastKnownPos();
    for (const unit of this.units) {
      unit.update(dtSeconds, playerPos, playerInVehicle, lastKnown, this.collisionManager);
    }

    const markers: PoliceMapMarker[] = this.units
      .filter((u) => !u.isDisabled())
      .map((u) => ({
        id: u.id,
        x: Math.round(u.sprite.x),
        y: Math.round(u.sprite.y),
        state: u.getState() === 'DISABLED' ? 'PATROL' : (u.getState() as 'PATROL' | 'PURSUE' | 'SEARCH'),
      }));

    this.wantedManager.update(dtSeconds, nowMs, this.cachedSpotted, playerPos, markers);
  }

  private evaluateLineOfSight(wantedLevel: number, playerPos: { x: number; y: number }): boolean {
    if (wantedLevel === 0) return false;

    const sightRange = WANTED_CONFIG.LOS_BREAK_RANGE;
    for (const unit of this.units) {
      if (unit.isDisabled()) continue;
      if (this.canUnitSeePlayer(unit, playerPos, sightRange)) {
        return true;
      }
    }
    return false;
  }

  private canUnitSeePlayer(
    unit: Police,
    playerPos: { x: number; y: number },
    maxRange: number
  ): boolean {
    if (unit.isDisabled()) return false;
    const dist = Phaser.Math.Distance.Between(unit.sprite.x, unit.sprite.y, playerPos.x, playerPos.y);
    if (dist > maxRange) return false;
    return this.collisionManager.hasLineOfSight(unit.sprite.x, unit.sprite.y, playerPos.x, playerPos.y);
  }

  public freezeAll(): void {
    for (const unit of this.units) {
      unit.freeze();
    }
  }

  public destroy(): void {
    for (const unit of this.units) {
      unit.destroy();
    }
    this.units = [];
  }
}
