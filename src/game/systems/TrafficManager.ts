import Phaser from 'phaser';
import { PALETTE, TRAFFIC_CONFIG } from '../config/BalanceConfig';
import { Player } from '../entities/Player';
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
  private blockedAhead = false;

  constructor(scene: Phaser.Scene, def: TrafficLoopDef) {
    this.waypoints = def.waypoints;
    this.wpIdx = def.startWaypointIdx;
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

  public update(
    dtSeconds: number,
    timeSeconds: number,
    obstacles: Array<{ x: number; y: number; selfSprite?: Phaser.Physics.Arcade.Sprite }>
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

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

    if (dist < 28) {
      this.wpIdx = (this.wpIdx + 1) % this.waypoints.length;
    }

    // Smooth steering toward current lane waypoint
    const desiredAngle = Math.atan2(dy, dx);
    const angleDiff = Phaser.Math.Angle.Wrap(desiredAngle - this.sprite.rotation);
    const turnRate = 4.2 * dtSeconds;
    if (Math.abs(angleDiff) <= turnRate) {
      this.sprite.rotation = desiredAngle;
    } else {
      this.sprite.rotation += Math.sign(angleDiff) * turnRate;
    }

    // Staggered forward obstacle & intersection signal check
    this.aiTimer += dtSeconds;
    if (this.aiTimer >= 0.12) {
      this.aiTimer = 0;
      this.blockedAhead = this.checkForwardBlocked(timeSeconds, obstacles);
    }

    const targetSpeed = this.blockedAhead ? 0 : this.maxCruiseSpeed;
    const accelRate = this.blockedAhead ? 260 : 150;
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

  private checkForwardBlocked(
    timeSeconds: number,
    obstacles: Array<{ x: number; y: number; selfSprite?: Phaser.Physics.Arcade.Sprite }>
  ): boolean {
    const fwdX = Math.cos(this.sprite.rotation);
    const fwdY = Math.sin(this.sprite.rotation);

    // 1. Check nearby entities ahead in our forward cone
    for (const obs of obstacles) {
      if (obs.selfSprite === this.sprite) continue;
      const ox = obs.x - this.sprite.x;
      const oy = obs.y - this.sprite.y;
      const forwardProj = ox * fwdX + oy * fwdY;
      if (forwardProj > 0 && forwardProj < TRAFFIC_CONFIG.STOP_DISTANCE) {
        const lateralDist = Math.abs(-ox * fwdY + oy * fwdX);
        if (lateralDist < 28) {
          return true;
        }
      }
    }

    // 2. Yield to red traffic signals right before entering major intersections
    const cycle = timeSeconds % 10;
    const movingHoriz = Math.abs(fwdX) > Math.abs(fwdY);
    const isRed = movingHoriz ? ((cycle + 5) % 10) >= 4.2 : cycle >= 4.2;

    if (isRed) {
      const stopChecks = movingHoriz
        ? [
            { x: 256, y: 352, dir: 1 },
            { x: 1152, y: 352, dir: 1 },
            { x: 448, y: 288, dir: -1 },
            { x: 1344, y: 288, dir: -1 },
            { x: 448, y: 864, dir: -1 },
            { x: 1344, y: 864, dir: -1 },
            { x: 256, y: 928, dir: 1 },
            { x: 1152, y: 928, dir: 1 },
          ]
        : [
            { x: 320, y: 224, dir: 1 },
            { x: 320, y: 800, dir: 1 },
            { x: 1216, y: 224, dir: 1 },
            { x: 1216, y: 800, dir: 1 },
            { x: 384, y: 416, dir: -1 },
            { x: 384, y: 992, dir: -1 },
            { x: 1280, y: 416, dir: -1 },
            { x: 1280, y: 992, dir: -1 },
          ];

      for (const s of stopChecks) {
        const axisMatch = movingHoriz ? Math.sign(fwdX) === s.dir : Math.sign(fwdY) === s.dir;
        if (!axisMatch) continue;
        const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, s.x, s.y);
        if (dist < 42) {
          return true;
        }
      }
    }

    return false;
  }

  public handleBump(): void {
    this.currentSpeed = 0;
    this.pauseTimer = 1.4;
  }

  public freeze(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.currentSpeed = 0;
  }

  public getSpeedPx(): number {
    return Math.round(this.currentSpeed);
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

const INNER_CLOCKWISE_LOOP = [
  { x: 384, y: 352 },
  { x: 1216, y: 352 },
  { x: 1216, y: 864 },
  { x: 384, y: 864 },
];

const OUTER_COUNTER_LOOP = [
  { x: 320, y: 288 },
  { x: 320, y: 928 },
  { x: 1280, y: 928 },
  { x: 1280, y: 288 },
];

const TRAFFIC_DEFS: TrafficLoopDef[] = [
  {
    id: 'traffic-cab-1',
    textureKey: 'veh_traffic',
    waypoints: INNER_CLOCKWISE_LOOP,
    startWaypointIdx: 0,
    speedMultiplier: 1.0,
  },
  {
    id: 'traffic-cab-2',
    textureKey: 'veh_traffic',
    waypoints: INNER_CLOCKWISE_LOOP,
    startWaypointIdx: 2,
    speedMultiplier: 0.94,
  },
  {
    id: 'traffic-cab-3',
    textureKey: 'veh_traffic',
    waypoints: OUTER_COUNTER_LOOP,
    startWaypointIdx: 1,
    speedMultiplier: 1.02,
  },
  {
    id: 'traffic-compact-loop',
    textureKey: 'veh_compact',
    waypoints: OUTER_COUNTER_LOOP,
    startWaypointIdx: 3,
    speedMultiplier: 0.9,
  },
  {
    id: 'traffic-bridge-cab',
    textureKey: 'veh_traffic',
    waypoints: [
      { x: 1280, y: 352 },
      { x: 1952, y: 352 },
      { x: 1952, y: 1600 },
      { x: 1280, y: 1600 },
    ],
    startWaypointIdx: 0,
    speedMultiplier: 1.05,
  },
];

export class TrafficManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private cars: TrafficCar[] = [];
  private trafficGroup!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
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

    // Collide with player on foot
    this.scene.physics.add.collider(player.sprite, this.trafficGroup, (_p, carObj) => {
      const car = this.cars.find((c) => c.sprite === carObj);
      if (car) {
        car.handleBump();
        this.audioManager.playBump(this.scene.time.now);
      }
    });

    // Collide with drivable vehicles
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
            onVehicleCrash?.(vSprite, body.speed);
          }
        }
      });
    }

    // Traffic vs NPCs
    npcManager.registerVehicleColliders(this.cars.map((c) => c.sprite));
  }

  public update(
    dtSeconds: number,
    timeSeconds: number,
    dynamicObstacles: Array<{ x: number; y: number }>
  ): void {
    const allObstacles: Array<{ x: number; y: number; selfSprite?: Phaser.Physics.Arcade.Sprite }> = [
      ...dynamicObstacles,
      ...this.cars.map((c) => ({ x: c.sprite.x, y: c.sprite.y, selfSprite: c.sprite })),
    ];

    for (const car of this.cars) {
      car.update(dtSeconds, timeSeconds, allObstacles);
    }
  }

  public getCarSprites(): Phaser.Physics.Arcade.Sprite[] {
    return this.cars.map((c) => c.sprite);
  }

  public getFastVehicleData(): Array<{ x: number; y: number; speedPx: number }> {
    return this.cars.map((c) => ({
      x: c.sprite.x,
      y: c.sprite.y,
      speedPx: c.getSpeedPx(),
    }));
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
