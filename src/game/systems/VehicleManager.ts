import Phaser from 'phaser';
import { PLAYER_CONFIG, VEHICLE_EXIT_MAX_SPEED, VehicleType } from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';
import { GAME_EVENT, gameEvents, NearbyVehicleInfo } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { DistrictData } from '../world/DistrictManager';
import { AudioManager } from './AudioManager';
import { DrivingControlsState } from './InputManager';

interface VehicleSpawnDef {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  angleDeg: number;
}

const INITIAL_VEHICLE_SPAWNS: VehicleSpawnDef[] = [
  // East-side Plaza Parking Bay & Central Plaza
  { id: 'veh-compact-lot1', type: 'compact', x: 1488, y: 496, angleDeg: 180 },
  { id: 'veh-racer-lot2', type: 'racer', x: 1488, y: 560, angleDeg: 180 },
  { id: 'veh-super-plaza', type: 'supercar', x: 800, y: 344, angleDeg: 0 },
  { id: 'veh-moto-plaza', type: 'moto', x: 640, y: 354, angleDeg: 0 },
  { id: 'veh-racer-synth', type: 'racer', x: 960, y: 862, angleDeg: 180 },
  // Police Cruiser parked by Cyber Corp / Plaza West Ave
  { id: 'veh-cruiser-corp', type: 'cruiser', x: 382, y: 204, angleDeg: 90 },
  // Extra City Compact near Plaza Garage
  { id: 'veh-compact-garage', type: 'compact', x: 1326, y: 1020, angleDeg: -90 },
  // Near Riverside Park & Highland Overlook
  { id: 'veh-compact-park', type: 'compact', x: 420, y: 1600, angleDeg: 0 },
  { id: 'veh-racer-mountain', type: 'racer', x: 2212, y: 468, angleDeg: 90 },
  // Dark Harbor Docks & Chrome Town Industrial
  { id: 'veh-moto-harbor', type: 'moto', x: 440, y: 1840, angleDeg: 0 },
  { id: 'veh-compact-harbor', type: 'compact', x: 1220, y: 2060, angleDeg: 180 },
  { id: 'veh-super-chrome', type: 'supercar', x: 2288, y: 1720, angleDeg: 0 },
];

export class VehicleManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;
  private vehicles: Vehicle[] = [];
  private activeVehicle: Vehicle | null = null;
  private lastDrivenVehicleId: string | null = null;
  private lastNearbyId: string | null = null;

  constructor(scene: Phaser.Scene, collisionManager: CollisionManager, audioManager: AudioManager) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
  }

  public spawnInitialVehicles(player: Player): void {
    const group = this.scene.physics.add.group();

    for (const def of INITIAL_VEHICLE_SPAWNS) {
      const vehicle = new Vehicle(this.scene, def.id, def.type, def.x, def.y, def.angleDeg);
      this.vehicles.push(vehicle);
      group.add(vehicle.sprite);

      this.collisionManager.registerVehicleWorldCollider(vehicle.sprite, () => {
        const intensity = vehicle.handleCollision(this.scene.time.now);
        if (intensity > 0 && vehicle.isOccupied()) {
          this.audioManager.playCrash(this.scene.time.now, intensity);
          this.scene.cameras.main.shake(110, 0.004 * intensity);
        }
      });

      this.scene.physics.add.collider(player.sprite, vehicle.sprite);
    }

    // Vehicle-to-vehicle collisions
    this.scene.physics.add.collider(group, group, (objA, objB) => {
      const vA = this.vehicles.find((v) => v.sprite === objA);
      const vB = this.vehicles.find((v) => v.sprite === objB);
      if (vA && vB) {
        const iA = vA.handleCollision(this.scene.time.now);
        const iB = vB.handleCollision(this.scene.time.now);
        const maxI = Math.max(iA, iB);
        if (maxI > 0 && (vA.isOccupied() || vB.isOccupied())) {
          this.audioManager.playCrash(this.scene.time.now, maxI);
          this.scene.cameras.main.shake(90, 0.003 * maxI);
        }
      }
    });
  }

  public getActiveVehicle(): Vehicle | null {
    return this.activeVehicle;
  }

  public findClosestVehicle(x: number, y: number): NearbyVehicleInfo | null {
    if (this.activeVehicle) return null;

    let closest: Vehicle | null = null;
    let bestDist: number = PLAYER_CONFIG.VEHICLE_ENTER_RADIUS;

    for (const v of this.vehicles) {
      const dist = Phaser.Math.Distance.Between(x, y, v.sprite.x, v.sprite.y);
      if (dist <= bestDist) {
        bestDist = dist;
        closest = v;
      }
    }

    if (!closest) return null;

    return {
      id: closest.id,
      type: closest.spec.type,
      name: closest.spec.name,
      health: closest.getHealth(),
      maxHealth: closest.getEffectiveMaxHealth(),
      accentColor: closest.spec.accentHex,
    };
  }

  public checkNearbyVehicleChange(x: number, y: number): { changed: boolean; vehicle: NearbyVehicleInfo | null } {
    const info = this.findClosestVehicle(x, y);
    const nextId = info?.id ?? null;
    if (nextId !== this.lastNearbyId) {
      this.lastNearbyId = nextId;
      return { changed: true, vehicle: info };
    }
    return { changed: false, vehicle: info };
  }

  public tryToggleEnterExit(player: Player): {
    action: 'entered' | 'exited' | 'blocked' | 'none';
    vehicle?: Vehicle;
    reason?: string;
  } {
    if (this.activeVehicle) {
      const current = this.activeVehicle;
      if (current.isAirborne()) {
        return { action: 'blocked', reason: '车辆正在空中飞跃，落地后再下车！' };
      }
      if (current.getSpeedPxPerSec() > VEHICLE_EXIT_MAX_SPEED) {
        return { action: 'blocked', reason: '下车前请先减速。' };
      }

      const exitPos = current.findSafeExitPosition(this.collisionManager, this.vehicles);
      if (!exitPos) {
        return { action: 'blocked', reason: '车门被阻挡，请移动到空旷处再下车。' };
      }

      current.setOccupied(false);
      this.activeVehicle = null;
      this.lastNearbyId = null;
      player.setInVehicle(false, exitPos);
      this.audioManager.stopEngineSound();
      this.audioManager.playVehicleExit();
      return { action: 'exited', vehicle: current };
    }

    const pos = player.getPosition();
    const nearby = this.findClosestVehicle(pos.x, pos.y);
    if (!nearby) return { action: 'none' };

    const target = this.vehicles.find((v) => v.id === nearby.id);
    if (!target) return { action: 'none' };

    this.activeVehicle = target;
    this.lastDrivenVehicleId = target.id;
    this.lastNearbyId = null;
    target.setOccupied(true);
    player.setInVehicle(true);
    this.audioManager.playVehicleEnter();
    return { action: 'entered', vehicle: target };
  }

  public enterRaceVehicle(player: Player): Vehicle | null {
    const target = this.getVehicleById('veh-super-plaza') ?? this.vehicles[0];
    if (!target) return null;

    if (this.activeVehicle && this.activeVehicle !== target) {
      this.activeVehicle.setOccupied(false);
    }

    target.restoreState(800, 344, 0, target.getEffectiveMaxHealth(), target.getUpgrades());
    this.activeVehicle = target;
    this.lastDrivenVehicleId = target.id;
    this.lastNearbyId = null;
    target.setOccupied(true);
    player.setInVehicle(true);
    this.audioManager.playVehicleEnter();
    return target;
  }

  public forceEject(player: Player, targetPos: { x: number; y: number }): void {
    if (this.activeVehicle) {
      this.activeVehicle.setOccupied(false);
      this.activeVehicle = null;
    }
    this.lastNearbyId = null;
    this.audioManager.stopEngineSound();
    player.setInVehicle(false, targetPos);
  }

  public update(
    dtSeconds: number,
    controls: DrivingControlsState,
    district?: DistrictData,
    onStuntLanded?: (bonus: number) => void
  ): void {
    for (const v of this.vehicles) {
      if (v === this.activeVehicle) {
        v.update(dtSeconds, controls, (bonus) => {
          this.audioManager.playPurchase();
          gameEvents.emit(GAME_EVENT.STATUS_TOAST, `极限飞跃着陆！特技奖励 +$${bonus}`);
          onStuntLanded?.(bonus);
        });
      } else {
        v.update(dtSeconds);
      }
    }

    if (this.activeVehicle) {
      if (district) {
        const vx = this.activeVehicle.sprite.x;
        const vy = this.activeVehicle.sprite.y;

        for (const ts of district.turboStrips) {
          if (vx >= ts.x && vx <= ts.x + ts.w && vy >= ts.y && vy <= ts.y + ts.h) {
            if (this.activeVehicle.triggerTurboBoost()) {
              this.audioManager.playInteract();
              this.scene.cameras.main.shake(90, 0.003);
              gameEvents.emit(GAME_EVENT.STATUS_TOAST, '涡轮加速带激活！极速推进 + 氮气充能！');
            }
            break;
          }
        }

        for (const ramp of district.stuntRamps) {
          if (vx >= ramp.x && vx <= ramp.x + ramp.w && vy >= ramp.y && vy <= ramp.y + ramp.h) {
            if (this.activeVehicle.triggerStuntJump()) {
              this.audioManager.playVehicleEnter();
              gameEvents.emit(GAME_EVENT.STATUS_TOAST, `冲上【${ramp.name}】！凌空飞跃！`);
            }
            break;
          }
        }
      }

      const ratio = this.activeVehicle.getSpeedPxPerSec() / this.activeVehicle.spec.maxSpeed;
      this.audioManager.updateEngineSound(true, ratio);
    } else {
      this.audioManager.updateEngineSound(false, 0);
    }
  }

  public freezeAll(): void {
    this.audioManager.stopEngineSound();
    for (const v of this.vehicles) {
      v.freeze();
    }
  }

  public getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  public getVehicleById(id: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  public findGarageTargetVehicle(x: number, y: number): Vehicle | null {
    if (this.activeVehicle) return this.activeVehicle;

    let closest: Vehicle | null = null;
    let bestDist = 260;
    for (const v of this.vehicles) {
      const dist = Phaser.Math.Distance.Between(x, y, v.sprite.x, v.sprite.y);
      if (dist <= bestDist) {
        bestDist = dist;
        closest = v;
      }
    }
    if (closest) return closest;

    if (this.lastDrivenVehicleId) {
      const last = this.getVehicleById(this.lastDrivenVehicleId);
      if (last) return last;
    }

    return this.vehicles[0] ?? null;
  }

  public getVehicleSprites(): Phaser.Physics.Arcade.Sprite[] {
    return this.vehicles.map((v) => v.sprite);
  }

  public getFastVehicleData(): Array<{ x: number; y: number; speedPx: number }> {
    return this.vehicles.map((v) => ({
      x: v.sprite.x,
      y: v.sprite.y,
      speedPx: v.getSpeedPxPerSec(),
    }));
  }

  public getVehiclePositions(): Array<{ id: string; x: number; y: number; color: string; occupied: boolean }> {
    return this.vehicles.map((v) => ({
      id: v.id,
      x: Math.round(v.sprite.x),
      y: Math.round(v.sprite.y),
      color: v.spec.accentHex,
      occupied: v.isOccupied(),
    }));
  }

  public serializeAll(): Record<
    string,
    { x: number; y: number; angleDeg: number; health: number; upgrades: { engine: number; handling: number; armor: number } }
  > {
    const out: Record<
      string,
      { x: number; y: number; angleDeg: number; health: number; upgrades: { engine: number; handling: number; armor: number } }
    > = {};
    for (const v of this.vehicles) {
      const pos = v.getPosition();
      out[v.id] = {
        x: pos.x,
        y: pos.y,
        angleDeg: v.getRotationDeg(),
        health: v.getHealth(),
        upgrades: v.getUpgrades(),
      };
    }
    return out;
  }

  public restoreAll(
    savedVehicles: Record<
      string,
      { x: number; y: number; angleDeg: number; health: number; upgrades: { engine: number; handling: number; armor: number } }
    >,
    player: Player
  ): void {
    if (this.activeVehicle) {
      this.activeVehicle.setOccupied(false);
      this.activeVehicle = null;
    }
    this.lastDrivenVehicleId = null;
    this.lastNearbyId = null;
    this.audioManager.stopEngineSound();
    player.setInVehicle(false);

    for (const def of INITIAL_VEHICLE_SPAWNS) {
      const v = this.getVehicleById(def.id);
      if (!v) continue;
      const saved = savedVehicles[def.id];
      if (saved && this.collisionManager.isPointClearForEntity(saved.x, saved.y, 14)) {
        v.restoreState(saved.x, saved.y, saved.angleDeg, saved.health, saved.upgrades);
      } else {
        v.restoreState(def.x, def.y, def.angleDeg, v.spec.maxHealth, {
          engine: 0,
          handling: 0,
          armor: 0,
        });
      }
      v.setOccupied(false);
    }
  }

  public resetAllToInitial(player: Player): void {
    this.restoreAll({}, player);
  }

  public destroy(): void {
    this.audioManager.stopEngineSound();
    for (const v of this.vehicles) {
      v.destroy();
    }
    this.vehicles = [];
    this.activeVehicle = null;
  }
}
