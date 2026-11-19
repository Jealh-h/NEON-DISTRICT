import Phaser from 'phaser';
import { PLAYER_CONFIG, VEHICLE_EXIT_MAX_SPEED, VehicleType } from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { Vehicle, VehicleInitOptions } from '../entities/Vehicle';
import { GAME_EVENT, gameEvents, NearbyVehicleInfo } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { DistrictData } from '../world/DistrictManager';
import { AudioManager } from './AudioManager';
import { DrivingControlsState } from './InputManager';
import { TrafficManager } from './TrafficManager';

interface VehicleSpawnDef {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  angleDeg: number;
}

const INITIAL_VEHICLE_SPAWNS: VehicleSpawnDef[] = [
  // Neon Plaza & Parking Lot
  { id: 'veh-compact-lot1', type: 'compact', x: 656, y: 1120, angleDeg: 180 },
  { id: 'veh-racer-lot2', type: 'racer', x: 656, y: 1200, angleDeg: 180 },
  { id: 'veh-super-plaza', type: 'supercar', x: 1312, y: 1280, angleDeg: 0 },
  { id: 'veh-moto-plaza', type: 'moto', x: 1120, y: 1088, angleDeg: 0 },
  { id: 'veh-superbike-plaza', type: 'superbike', x: 1480, y: 1280, angleDeg: 180 },
  { id: 'veh-racer-synth', type: 'racer', x: 1040, y: 1024, angleDeg: 180 },
  { id: 'veh-compact-garage', type: 'compact', x: 480, y: 1056, angleDeg: -90 },
  // NCPD HQ Patrols
  { id: 'veh-cruiser-corp', type: 'cruiser', x: 1040, y: 464, angleDeg: 90 },
  { id: 'veh-swat-ncpd', type: 'swat', x: 1248, y: 464, angleDeg: 0 },
  // Quantum Tech Corridor
  { id: 'veh-super-tech', type: 'supercar', x: 2048, y: 512, angleDeg: 0 },
  { id: 'veh-superbike-tech', type: 'superbike', x: 2352, y: 1088, angleDeg: 180 },
  // Riverside Park & Highlands (Snow, Canyon, Volcano)
  { id: 'veh-compact-park', type: 'compact', x: 1584, y: 1584, angleDeg: 0 },
  { id: 'veh-racer-mountain', type: 'racer', x: 3680, y: 704, angleDeg: 90 },
  { id: 'veh-buggy-highland', type: 'buggy', x: 4032, y: 672, angleDeg: 90 },
  { id: 'veh-buggy-volcano', type: 'buggy', x: 3968, y: 1280, angleDeg: 0 },
  // Dark Harbor Docks & Helipad
  { id: 'veh-moto-harbor', type: 'moto', x: 448, y: 2768, angleDeg: 0 },
  { id: 'veh-buggy-harbor', type: 'buggy', x: 1120, y: 2992, angleDeg: 0 },
  { id: 'veh-heli-harbor', type: 'heli', x: 544, y: 2432, angleDeg: 0 },
  { id: 'veh-compact-harbor', type: 'compact', x: 768, y: 2496, angleDeg: 180 },
  // Chrome Town Foundry, F1 Speedway & Tank Depot
  { id: 'veh-super-chrome', type: 'supercar', x: 1976, y: 2768, angleDeg: 0 },
  { id: 'veh-tank-chrome', type: 'tank', x: 3120, y: 2496, angleDeg: 180 },
  // Neon Skyport Runway, Helipads & Hangar
  { id: 'veh-heli-skyport-1', type: 'heli', x: 3680, y: 2240, angleDeg: 0 },
  { id: 'veh-heli-skyport-2', type: 'heli', x: 4160, y: 2240, angleDeg: 180 },
  { id: 'veh-super-skyport', type: 'supercar', x: 3648, y: 2464, angleDeg: 0 },
];

export class VehicleManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;
  private vehicles: Vehicle[] = [];
  private groundGroup!: Phaser.Physics.Arcade.Group;
  private playerRef: Player | null = null;
  private activeVehicle: Vehicle | null = null;
  private lastDrivenVehicleId: string | null = null;
  private lastNearbyId: string | null = null;
  private dynamicCounter = 0;

  constructor(scene: Phaser.Scene, collisionManager: CollisionManager, audioManager: AudioManager) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
  }

  public spawnInitialVehicles(player: Player): void {
    this.playerRef = player;
    this.groundGroup = this.scene.physics.add.group();

    for (const def of INITIAL_VEHICLE_SPAWNS) {
      this.createAndRegisterVehicle(def.id, def.type, def.x, def.y, def.angleDeg);
    }

    // Ground vehicle-to-vehicle collisions (flying choppers pass cleanly overhead)
    this.scene.physics.add.collider(this.groundGroup, this.groundGroup, (objA, objB) => {
      const vA = this.vehicles.find((v) => v.sprite === objA);
      const vB = this.vehicles.find((v) => v.sprite === objB);
      if (vA && vB && !vA.isDestroyed() && !vB.isDestroyed()) {
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

  private createAndRegisterVehicle(
    id: string,
    type: VehicleType,
    x: number,
    y: number,
    angleDeg: number,
    options?: VehicleInitOptions
  ): Vehicle {
    const vehicle = new Vehicle(this.scene, id, type, x, y, angleDeg, options);
    this.vehicles.push(vehicle);

    if (!vehicle.spec.isFlying) {
      this.groundGroup.add(vehicle.sprite);
      this.collisionManager.registerVehicleWorldCollider(vehicle.sprite, () => {
        const intensity = vehicle.handleCollision(this.scene.time.now);
        if (intensity > 0 && vehicle.isOccupied()) {
          this.audioManager.playCrash(this.scene.time.now, intensity);
          this.scene.cameras.main.shake(110, 0.004 * intensity);
        }
      });
    }

    if (this.playerRef) {
      this.scene.physics.add.collider(this.playerRef.sprite, vehicle.sprite);
    }
    return vehicle;
  }

  public spawnDynamicVehicle(
    type: VehicleType,
    x: number,
    y: number,
    angleDeg: number,
    options?: VehicleInitOptions
  ): Vehicle {
    this.dynamicCounter += 1;
    return this.createAndRegisterVehicle(`dyn-${type}-${this.dynamicCounter}`, type, x, y, angleDeg, options);
  }

  public getActiveVehicle(): Vehicle | null {
    return this.activeVehicle;
  }

  public findClosestVehicle(x: number, y: number): NearbyVehicleInfo | null {
    if (this.activeVehicle) return null;

    let closest: Vehicle | null = null;
    let bestDist: number = PLAYER_CONFIG.VEHICLE_ENTER_RADIUS;

    for (const v of this.vehicles) {
      if (v.isDestroyed()) continue;
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
      upgrades: closest.getUpgrades(),
      paintColor: closest.getPaintColor(),
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

  public tryToggleEnterExit(
    player: Player,
    trafficManager?: TrafficManager,
    onTrafficHijacked?: (pos: { x: number; y: number }) => void
  ): {
    action: 'entered' | 'exited' | 'blocked' | 'hijacked' | 'none';
    vehicle?: Vehicle;
    reason?: string;
  } {
    if (this.activeVehicle) {
      const current = this.activeVehicle;
      if (current.isAirborne()) {
        return { action: 'blocked', reason: '车辆正在空中飞跃，落地后再下车！' };
      }
      if (current.getSpeedPxPerSec() > VEHICLE_EXIT_MAX_SPEED) {
        return { action: 'blocked', reason: current.spec.isFlying ? '请先悬停减速后再降落离机！' : '下车前请先减速。' };
      }

      const exitPos = current.findSafeExitPosition(this.collisionManager, this.vehicles);
      if (!exitPos) {
        return {
          action: 'blocked',
          reason: current.spec.isFlying
            ? '下方为水域或建筑，请飞至空旷地面后再降落！'
            : '车门被阻挡，请移动到空旷处再下车。',
        };
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
    if (nearby) {
      const target = this.vehicles.find((v) => v.id === nearby.id);
      if (target && !target.isDestroyed()) {
        this.activeVehicle = target;
        this.lastDrivenVehicleId = target.id;
        this.lastNearbyId = null;
        target.setOccupied(true);
        player.setInVehicle(true);
        this.audioManager.playVehicleEnter();
        return { action: 'entered', vehicle: target };
      }
    }

    // GTA-style moving traffic carjacking!
    if (trafficManager) {
      const hijacked = trafficManager.hijackNearestCar(pos.x, pos.y, PLAYER_CONFIG.VEHICLE_ENTER_RADIUS + 14);
      if (hijacked) {
        const veh = this.spawnDynamicVehicle(
          'compact',
          hijacked.x,
          hijacked.y,
          Phaser.Math.RadToDeg(hijacked.rotation),
          { textureOverride: hijacked.textureKey, isTempHijacked: true }
        );
        this.activeVehicle = veh;
        this.lastDrivenVehicleId = veh.id;
        this.lastNearbyId = null;
        veh.setOccupied(true);
        player.setInVehicle(true);
        this.audioManager.playVehicleEnter();
        onTrafficHijacked?.({ x: hijacked.x, y: hijacked.y });
        return { action: 'hijacked', vehicle: veh };
      }
    }

    return { action: 'none' };
  }

  public enterRaceVehicle(player: Player): Vehicle | null {
    const target = this.getVehicleById('veh-super-plaza') ?? this.vehicles[0];
    if (!target) return null;

    if (this.activeVehicle && this.activeVehicle !== target) {
      this.activeVehicle.setOccupied(false);
    }

    target.restoreState(
      1312,
      1320,
      0,
      target.getEffectiveMaxHealth(),
      target.getUpgrades(),
      target.getPaintColor()
    );
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
    onStuntLanded?: (bonus: number, meters: number) => void,
    onVehicleDestroyed?: (vehicle: Vehicle, wasOccupied: boolean) => void,
    modifiers?: { speedMult?: number; nitroRegenMult?: number; gripMult?: number }
  ): void {
    const nowMs = this.scene.time.now;

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      if (v.shouldRemoveTempWreck(nowMs)) {
        if (this.activeVehicle === v) this.activeVehicle = null;
        v.destroy();
        this.vehicles.splice(i, 1);
        continue;
      }

      const handleDestroyed = (destroyedVeh: Vehicle) => {
        const wasOccupied = this.activeVehicle === destroyedVeh;
        this.audioManager.playExplosion();
        this.scene.cameras.main.shake(260, 0.011);
        if (wasOccupied) {
          this.activeVehicle = null;
          this.audioManager.stopEngineSound();
        }
        onVehicleDestroyed?.(destroyedVeh, wasOccupied);
      };

      if (v === this.activeVehicle) {
        v.update(
          dtSeconds,
          controls,
          (bonus, meters) => {
            this.audioManager.playPurchase();
            onStuntLanded?.(bonus, meters);
          },
          handleDestroyed,
          modifiers
        );
      } else {
        v.update(dtSeconds, undefined, undefined, handleDestroyed);
      }
    }

    if (this.activeVehicle) {
      if (district && !this.activeVehicle.spec.isFlying) {
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
      if (v.isDestroyed()) continue;
      const dist = Phaser.Math.Distance.Between(x, y, v.sprite.x, v.sprite.y);
      if (dist <= bestDist) {
        bestDist = dist;
        closest = v;
      }
    }
    if (closest) return closest;

    if (this.lastDrivenVehicleId) {
      const last = this.getVehicleById(this.lastDrivenVehicleId);
      if (last && !last.isDestroyed()) return last;
    }

    return this.vehicles[0] ?? null;
  }

  public getVehicleSprites(): Phaser.Physics.Arcade.Sprite[] {
    return this.vehicles.filter((v) => !v.isDestroyed()).map((v) => v.sprite);
  }

  public getFastVehicleData(): Array<{ x: number; y: number; speedPx: number }> {
    return this.vehicles
      .filter((v) => !v.isDestroyed() && !v.spec.isFlying)
      .map((v) => ({
        x: v.sprite.x,
        y: v.sprite.y,
        speedPx: v.getSpeedPxPerSec(),
      }));
  }

  public getVehiclePositions(): Array<{ id: string; x: number; y: number; color: string; occupied: boolean }> {
    return this.vehicles
      .filter((v) => !v.isDestroyed())
      .map((v) => ({
        id: v.id,
        x: Math.round(v.sprite.x),
        y: Math.round(v.sprite.y),
        color: v.spec.accentHex,
        occupied: v.isOccupied(),
      }));
  }

  public serializeAll(): Record<
    string,
    {
      x: number;
      y: number;
      angleDeg: number;
      health: number;
      upgrades: { engine: number; handling: number; armor: number };
      paintColor?: number | null;
    }
  > {
    const out: Record<
      string,
      {
        x: number;
        y: number;
        angleDeg: number;
        health: number;
        upgrades: { engine: number; handling: number; armor: number };
        paintColor?: number | null;
      }
    > = {};
    for (const v of this.vehicles) {
      if (v.isTempHijacked) continue;
      const pos = v.getPosition();
      out[v.id] = {
        x: pos.x,
        y: pos.y,
        angleDeg: v.getRotationDeg(),
        health: Math.max(10, v.getHealth()),
        upgrades: v.getUpgrades(),
        paintColor: v.getPaintColor(),
      };
    }
    return out;
  }

  public restoreAll(
    savedVehicles: Record<
      string,
      {
        x: number;
        y: number;
        angleDeg: number;
        health: number;
        upgrades: { engine: number; handling: number; armor: number };
        paintColor?: number | null;
      }
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

    // Clean out dynamic hijacked or airdropped vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      if (!INITIAL_VEHICLE_SPAWNS.some((d) => d.id === v.id)) {
        v.destroy();
        this.vehicles.splice(i, 1);
      }
    }

    for (const def of INITIAL_VEHICLE_SPAWNS) {
      const v = this.getVehicleById(def.id);
      if (!v) continue;
      const saved = savedVehicles[def.id];
      if (saved && (v.spec.isFlying || this.collisionManager.isPointClearForEntity(saved.x, saved.y, 14))) {
        v.restoreState(
          saved.x,
          saved.y,
          saved.angleDeg,
          saved.health,
          saved.upgrades,
          saved.paintColor ?? null
        );
      } else {
        v.restoreState(
          def.x,
          def.y,
          def.angleDeg,
          v.spec.maxHealth,
          {
            engine: 0,
            handling: 0,
            armor: 0,
          },
          null
        );
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
