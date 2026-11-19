import Phaser from 'phaser';
import { PALETTE, TRAFFIC_CONFIG } from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { TrafficSignalDef } from '../world/DistrictManager';
import { AudioManager } from './AudioManager';
import { NPCManager } from './NPCManager';

interface TrafficLoopDef {
  id: string;
  textureKey: string;
  waypoints: Array<{ x: number; y: number }>;
  startWaypointIdx: number;
  speedMultiplier: number;
}

class TrafficCar {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  private shadow: Phaser.GameObjects.Ellipse;
  private headlight: Phaser.GameObjects.Image;
  private waypoints: Array<{ x: number; y: number }>;
  private wpIdx: number;
  private currentSpeed = 0;
  private maxCruiseSpeed: number;
  private aiTimer: number;
  private pauseTimer = 0;
  private panicTimer = 0;
  private speedFactorAhead = 1;
  private swerveOffset = 0;
  public readonly textureKey: string;
  private hiddenUntilMs = 0;

  constructor(scene: Phaser.Scene, def: TrafficLoopDef) {
    this.textureKey = def.textureKey;
    this.waypoints = def.waypoints;
    this.wpIdx = def.startWaypointIdx % def.waypoints.length;
    this.maxCruiseSpeed = TRAFFIC_CONFIG.CRUISE_SPEED * def.speedMultiplier;
    this.aiTimer = Math.random() * 0.14;

    const start = this.waypoints[this.wpIdx];
    const next = this.waypoints[(this.wpIdx + 1) % this.waypoints.length];
    const initialAngle = Math.atan2(next.y - start.y, next.x - start.x);

    this.shadow = scene.add.ellipse(start.x + 3, start.y + 4, 46, 26, 0x000000, 0.45);
    this.shadow.setDepth(18);

    this.headlight = scene.add.image(start.x, start.y, 'fx_headlight');
    this.headlight.setOrigin(0, 0.5);
    this.headlight.setBlendMode(Phaser.BlendModes.ADD);
    this.headlight.setAlpha(0.45);
    this.headlight.setDepth(19);

    this.sprite = scene.physics.add.sprite(start.x, start.y, def.textureKey);
    this.sprite.setDepth(20);
    this.sprite.setRotation(initialAngle);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14, (this.sprite.width - 28) / 2, (this.sprite.height - 28) / 2);
    body.setBounce(0.2, 0.2);
    body.setImmovable(false);

    this.wpIdx = (this.wpIdx + 1) % this.waypoints.length;
    this.syncAttachments();
  }

  public triggerPanicDrive(durationSec = 2.6): void {
    this.panicTimer = Math.max(this.panicTimer, durationSec);
    this.pauseTimer = 0;
  }

  public update(
    dtSeconds: number,
    timeSeconds: number,
    nowMs: number,
    obstacles: Array<{ x: number; y: number; selfSprite?: Phaser.Physics.Arcade.Sprite }>,
    signals: TrafficSignalDef[]
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.hiddenUntilMs > 0) {
      if (nowMs >= this.hiddenUntilMs) {
        this.hiddenUntilMs = 0;
        const wp = this.waypoints[this.wpIdx];
        this.sprite.setPosition(wp.x, wp.y);
        body.reset(wp.x, wp.y);
        body.enable = true;
        this.sprite.setVisible(true);
        this.shadow.setVisible(true);
        this.headlight.setVisible(true);
      } else {
        return;
      }
    }

    if (this.panicTimer > 0) {
      this.panicTimer = Math.max(0, this.panicTimer - dtSeconds);
    }

    if (this.pauseTimer > 0) {
      this.pauseTimer -= dtSeconds;
      this.currentSpeed = Math.max(0, this.currentSpeed - 260 * dtSeconds);
      body.setVelocity(
        Math.cos(this.sprite.rotation) * this.currentSpeed,
        Math.sin(this.sprite.rotation) * this.currentSpeed
      );
      this.syncAttachments();
      return;
    }

    const target = this.waypoints[this.wpIdx];
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 32) {
      this.wpIdx = (this.wpIdx + 1) % this.waypoints.length;
    }

    // Staggered forward obstacle, smooth braking, lane nudge & dynamic traffic signal check
    this.aiTimer += dtSeconds;
    if (this.aiTimer >= 0.12) {
      this.aiTimer = 0;
      const evalRes = this.evaluateTrafficAhead(timeSeconds, obstacles, signals);
      this.speedFactorAhead = evalRes.speedFactor;
      this.swerveOffset = evalRes.swerveAngle;
    }

    // Smooth steering toward current lane waypoint + mild avoidance swerve
    const desiredAngle = Math.atan2(dy, dx) + this.swerveOffset;
    const angleDiff = Phaser.Math.Angle.Wrap(desiredAngle - this.sprite.rotation);
    const turnRate = (this.panicTimer > 0 ? 5.6 : 4.2) * dtSeconds;
    if (Math.abs(angleDiff) <= turnRate) {
      this.sprite.rotation = desiredAngle;
    } else {
      this.sprite.rotation += Math.sign(angleDiff) * turnRate;
    }

    const panicMult = this.panicTimer > 0 ? 1.48 : 1;
    const targetSpeed = this.maxCruiseSpeed * panicMult * this.speedFactorAhead;
    const accelRate = this.speedFactorAhead < 0.4 ? 275 : this.panicTimer > 0 ? 240 : 155;
    if (this.currentSpeed < targetSpeed) {
      this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + accelRate * dtSeconds);
    } else {
      this.currentSpeed = Math.max(targetSpeed, this.currentSpeed - accelRate * dtSeconds);
    }

    body.setVelocity(
      Math.cos(this.sprite.rotation) * this.currentSpeed,
      Math.sin(this.sprite.rotation) * this.currentSpeed
    );

    this.syncAttachments();
  }

  private evaluateTrafficAhead(
    timeSeconds: number,
    obstacles: Array<{ x: number; y: number; selfSprite?: Phaser.Physics.Arcade.Sprite }>,
    signals: TrafficSignalDef[]
  ): { speedFactor: number; swerveAngle: number } {
    const fwdX = Math.cos(this.sprite.rotation);
    const fwdY = Math.sin(this.sprite.rotation);
    let minFactor = 1;
    let swerveAngle = 0;

    // 1. Check nearby entities ahead in our forward lane cone with proportional braking & lane nudge
    for (const obs of obstacles) {
      if (obs.selfSprite === this.sprite) continue;
      const ox = obs.x - this.sprite.x;
      const oy = obs.y - this.sprite.y;
      const forwardProj = ox * fwdX + oy * fwdY;
      if (forwardProj > 0 && forwardProj < TRAFFIC_CONFIG.SLOW_DISTANCE) {
        const lateralSigned = -ox * fwdY + oy * fwdX;
        const lateralDist = Math.abs(lateralSigned);
        if (lateralDist < 30) {
          if (forwardProj <= TRAFFIC_CONFIG.STOP_DISTANCE) {
            minFactor = 0;
            // Gentle steer away from blocked car if not at complete standstill
            if (lateralDist > 4) {
              swerveAngle = lateralSigned > 0 ? -0.22 : 0.22;
            }
            break;
          }
          const t =
            (forwardProj - TRAFFIC_CONFIG.STOP_DISTANCE) /
            Math.max(1, TRAFFIC_CONFIG.SLOW_DISTANCE - TRAFFIC_CONFIG.STOP_DISTANCE);
          minFactor = Math.min(minFactor, Math.max(0.25, t));
        }
      }
    }

    // 2. Yield to red traffic signals derived dynamically from DistrictData (panicking drivers run red lights!)
    if (minFactor > 0 && this.panicTimer <= 0 && signals.length > 0) {
      const cycle = timeSeconds % 10;
      const movingHoriz = Math.abs(fwdX) > Math.abs(fwdY);
      const isRed = movingHoriz ? ((cycle + 5) % 10) >= 4.2 : cycle >= 4.2;

      if (isRed) {
        for (const sig of signals) {
          const ox = sig.x - this.sprite.x;
          const oy = sig.y - this.sprite.y;
          const fwdDist = ox * fwdX + oy * fwdY;
          const latDist = Math.abs(-ox * fwdY + oy * fwdX);
          if (fwdDist > 46 && fwdDist < 104 && latDist < 68) {
            minFactor = 0;
            swerveAngle = 0;
            break;
          }
        }
      }
    }

    return { speedFactor: minFactor, swerveAngle };
  }

  public handleBump(): void {
    this.currentSpeed = 0;
    this.pauseTimer = 1.2;
  }

  public freeze(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.currentSpeed = 0;
  }

  public isHidden(): boolean {
    return this.hiddenUntilMs > 0;
  }

  public markHijacked(nowMs: number): { x: number; y: number; rotation: number; textureKey: string } {
    const info = {
      x: this.sprite.x,
      y: this.sprite.y,
      rotation: this.sprite.rotation,
      textureKey: this.textureKey,
    };
    this.hiddenUntilMs = nowMs + 25000;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.sprite.setVisible(false);
    this.shadow.setVisible(false);
    this.headlight.setVisible(false);
    this.currentSpeed = 0;
    return info;
  }

  public getSpeedPx(): number {
    return this.hiddenUntilMs > 0 ? 0 : Math.round(this.currentSpeed);
  }

  private syncAttachments(): void {
    const x = this.sprite.x;
    const y = this.sprite.y;
    const rot = this.sprite.rotation;

    this.shadow.setPosition(x + 3, y + 4);
    this.shadow.setRotation(rot);

    this.headlight.setPosition(x + Math.cos(rot) * 20, y + Math.sin(rot) * 20);
    this.headlight.setRotation(rot);
  }

  public destroy(): void {
    this.shadow.destroy();
    this.headlight.destroy();
    this.sprite.destroy();
  }
}

// Right-hand lane offsets along the 4800x3584 arterial grid
const PLAZA_INNER_CLOCKWISE = [
  { x: 924, y: 732 },
  { x: 1700, y: 732 },
  { x: 1700, y: 1316 },
  { x: 924, y: 1316 },
];

const PLAZA_OUTER_COUNTER = [
  { x: 220, y: 220 },
  { x: 220, y: 1372 },
  { x: 1756, y: 1372 },
  { x: 1756, y: 220 },
];

const TECH_EXPRESS_LOOP = [
  { x: 1756, y: 220 },
  { x: 3364, y: 220 },
  { x: 3364, y: 1316 },
  { x: 1756, y: 1316 },
];

const HARBOR_CHROME_LOOP = [
  { x: 868, y: 2140 },
  { x: 2588, y: 2140 },
  { x: 2588, y: 2852 },
  { x: 868, y: 2852 },
];

const SKYPORT_RING_LOOP = [
  { x: 3420, y: 1372 },
  { x: 4576, y: 1372 },
  { x: 4576, y: 2852 },
  { x: 3420, y: 2852 },
];

const NORTH_SOUTH_BRIDGE_EXPRESS = [
  { x: 1696, y: 732 },
  { x: 2528, y: 732 },
  { x: 2528, y: 2080 },
  { x: 1696, y: 2080 },
];

const TRAFFIC_DEFS: TrafficLoopDef[] = [
  { id: 'traffic-cab-1', textureKey: 'veh_traffic', waypoints: PLAZA_INNER_CLOCKWISE, startWaypointIdx: 0, speedMultiplier: 1.0 },
  { id: 'traffic-cab-2', textureKey: 'veh_traffic', waypoints: PLAZA_INNER_CLOCKWISE, startWaypointIdx: 2, speedMultiplier: 0.94 },
  { id: 'traffic-cab-3', textureKey: 'veh_traffic', waypoints: PLAZA_OUTER_COUNTER, startWaypointIdx: 1, speedMultiplier: 1.04 },
  { id: 'traffic-compact-plaza', textureKey: 'veh_compact', waypoints: PLAZA_OUTER_COUNTER, startWaypointIdx: 3, speedMultiplier: 0.92 },
  { id: 'traffic-tech-1', textureKey: 'veh_traffic', waypoints: TECH_EXPRESS_LOOP, startWaypointIdx: 0, speedMultiplier: 1.08 },
  { id: 'traffic-tech-2', textureKey: 'veh_compact', waypoints: TECH_EXPRESS_LOOP, startWaypointIdx: 2, speedMultiplier: 0.98 },
  { id: 'traffic-harbor-1', textureKey: 'veh_traffic', waypoints: HARBOR_CHROME_LOOP, startWaypointIdx: 0, speedMultiplier: 1.02 },
  { id: 'traffic-chrome-2', textureKey: 'veh_compact', waypoints: HARBOR_CHROME_LOOP, startWaypointIdx: 2, speedMultiplier: 1.12 },
  { id: 'traffic-skyport-1', textureKey: 'veh_traffic', waypoints: SKYPORT_RING_LOOP, startWaypointIdx: 1, speedMultiplier: 1.1 },
  { id: 'traffic-bridge-cab', textureKey: 'veh_traffic', waypoints: NORTH_SOUTH_BRIDGE_EXPRESS, startWaypointIdx: 0, speedMultiplier: 1.05 },
];

export class TrafficManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private cars: TrafficCar[] = [];
  private trafficGroup!: Phaser.Physics.Arcade.Group;
  private signals: TrafficSignalDef[] = [];

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
  }

  public setTrafficSignals(signals: TrafficSignalDef[]): void {
    this.signals = signals;
  }

  public spawnTraffic(
    player: Player,
    playerVehicleSprites: Phaser.Physics.Arcade.Sprite[],
    npcManager: NPCManager,
    onVehicleCrash?: (vehSprite: Phaser.Physics.Arcade.Sprite, speed: number) => void
  ): void {
    this.trafficGroup = this.scene.physics.add.group();

    for (const def of TRAFFIC_DEFS) {
      const car = new TrafficCar(this.scene, def);
      this.cars.push(car);
      this.trafficGroup.add(car.sprite);
    }

    this.scene.physics.add.collider(player.sprite, this.trafficGroup, (_p, carObj) => {
      const car = this.cars.find((c) => c.sprite === carObj);
      if (car) {
        car.handleBump();
        this.audioManager.playBump(this.scene.time.now);
      }
    });

    for (const vSprite of playerVehicleSprites) {
      this.scene.physics.add.collider(vSprite, this.trafficGroup, (_v, carObj) => {
        const car = this.cars.find((c) => c.sprite === carObj);
        if (car) {
          car.handleBump();
          const body = vSprite.body as Phaser.Physics.Arcade.Body;
          if (body && body.speed > 110) {
            this.audioManager.playCrash(this.scene.time.now, Math.min(1, body.speed / 350));
            this.scene.cameras.main.shake(90, 0.003);
            npcManager.triggerAreaPanic(vSprite.x, vSprite.y);
            this.notifyDisturbance(vSprite.x, vSprite.y, 220);
            onVehicleCrash?.(vSprite, body.speed);
          }
        }
      });
    }

    npcManager.registerVehicleColliders(this.cars.map((c) => c.sprite));
  }

  public notifyDisturbance(x: number, y: number, radius = 260): void {
    for (const car of this.cars) {
      if (car.isHidden()) continue;
      if (Phaser.Math.Distance.Between(x, y, car.sprite.x, car.sprite.y) <= radius) {
        car.triggerPanicDrive(2.8);
      }
    }
  }

  public update(
    dtSeconds: number,
    timeSeconds: number,
    dynamicObstacles: Array<{ x: number; y: number }>
  ): void {
    const nowMs = this.scene.time.now;
    const allObstacles: Array<{ x: number; y: number; selfSprite?: Phaser.Physics.Arcade.Sprite }> = [
      ...dynamicObstacles,
      ...this.cars
        .filter((c) => !c.isHidden())
        .map((c) => ({ x: c.sprite.x, y: c.sprite.y, selfSprite: c.sprite })),
    ];

    for (const car of this.cars) {
      car.update(dtSeconds, timeSeconds, nowMs, allObstacles, this.signals);
    }
  }

  public hijackNearestCar(
    x: number,
    y: number,
    maxDist: number
  ): { x: number; y: number; rotation: number; textureKey: string } | null {
    let best: TrafficCar | null = null;
    let bestDist = maxDist;
    for (const car of this.cars) {
      if (car.isHidden()) continue;
      const d = Phaser.Math.Distance.Between(x, y, car.sprite.x, car.sprite.y);
      if (d <= bestDist) {
        bestDist = d;
        best = car;
      }
    }
    if (!best) return null;
    return best.markHijacked(this.scene.time.now);
  }

  public getCarSprites(): Phaser.Physics.Arcade.Sprite[] {
    return this.cars.map((c) => c.sprite);
  }

  public getFastVehicleData(): Array<{ x: number; y: number; vx?: number; vy?: number; speedPx: number }> {
    return this.cars
      .filter((c) => !c.isHidden())
      .map((c) => {
        const body = c.sprite.body as Phaser.Physics.Arcade.Body;
        return {
          x: c.sprite.x,
          y: c.sprite.y,
          vx: body?.velocity.x ?? 0,
          vy: body?.velocity.y ?? 0,
          speedPx: c.getSpeedPx(),
        };
      });
  }

  public freezeAll(): void {
    for (const car of this.cars) {
      car.freeze();
    }
  }

  public destroy(): void {
    for (const car of this.cars) {
      car.destroy();
    }
    this.cars = [];
  }
}

export const TRAFFIC_MARKER_COLOR = PALETTE.GOLD_HEX;
