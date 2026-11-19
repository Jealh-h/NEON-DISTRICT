import Phaser from 'phaser';
import { PALETTE, WANTED_CONFIG } from '../config/BalanceConfig';
import { CollisionManager } from '../world/CollisionManager';

export type PoliceState = 'PATROL' | 'PURSUE' | 'SEARCH' | 'DISABLED';
export type PoliceUnitKind = 'cruiser' | 'interceptor' | 'heli' | 'swat' | 'tank';

export class Police {
  public readonly id: string;
  public readonly unitKind: PoliceUnitKind;
  public readonly minWantedStars: number;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private scene: Phaser.Scene;
  private shadow: Phaser.GameObjects.Ellipse;
  private headlight: Phaser.GameObjects.Image;
  private lightbarGlow: Phaser.GameObjects.Image;
  private rotorOverlay: Phaser.GameObjects.Image | null = null;
  private turretOverlay: Phaser.GameObjects.Image | null = null;
  private smokeEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private patrolLoop: Array<{ x: number; y: number }>;
  private patrolIdx = 0;

  private hp: number;
  private readonly maxHp: number;
  private readonly bounty: number;
  private disabledTimer = 0;
  private smokeTimer = 0;
  private shootTimer = 0;

  private state: PoliceState = 'PATROL';
  private unitVisible = true;
  private lightbarTimer = 0;
  private aiTimer: number;
  private stuckTimer = 0;
  private reverseTimer = 0;
  private reverseTurnDir = 1;
  private ramCooldownTimer = 0;
  private searchOrbitAngle = 0;
  private desiredAngle = 0;
  private currentSpeed = 0;
  private rotorAngle = 0;
  private flankSign = 0;
  private searchRadius = 115;

  constructor(
    scene: Phaser.Scene,
    id: string,
    patrolLoop: Array<{ x: number; y: number }>,
    startIdx = 0,
    unitKind: PoliceUnitKind = 'cruiser',
    minWantedStars = 0,
    flankSign = 0
  ) {
    this.scene = scene;
    this.id = id;
    this.unitKind = unitKind;
    this.minWantedStars = minWantedStars;
    this.flankSign = flankSign;
    this.patrolLoop = patrolLoop;
    this.patrolIdx = startIdx % patrolLoop.length;
    this.aiTimer = Math.random() * 0.15;

    const hpMap: Record<PoliceUnitKind, number> = {
      cruiser: 160,
      interceptor: 195,
      heli: 280,
      swat: 380,
      tank: 620,
    };
    const bountyMap: Record<PoliceUnitKind, number> = {
      cruiser: 120,
      interceptor: 180,
      heli: WANTED_CONFIG.POLICE_HELI_BOUNTY,
      swat: 240,
      tank: WANTED_CONFIG.POLICE_TANK_BOUNTY,
    };
    const texMap: Record<PoliceUnitKind, string> = {
      cruiser: 'veh_cruiser',
      interceptor: 'veh_racer',
      heli: 'veh_heli',
      swat: 'veh_swat',
      tank: 'veh_tank',
    };

    this.maxHp = hpMap[unitKind];
    this.hp = this.maxHp;
    this.bounty = bountyMap[unitKind];

    const start = this.patrolLoop[this.patrolIdx];
    const next = this.patrolLoop[(this.patrolIdx + 1) % this.patrolLoop.length];
    this.desiredAngle = Math.atan2(next.y - start.y, next.x - start.x);

    this.shadow = scene.add.ellipse(start.x + 3, start.y + 4, 52, 30, 0x000000, unitKind === 'heli' ? 0.34 : 0.5);
    this.shadow.setDepth(18);

    this.headlight = scene.add.image(start.x, start.y, 'fx_headlight');
    this.headlight.setOrigin(0, 0.5);
    this.headlight.setBlendMode(Phaser.BlendModes.ADD);
    this.headlight.setAlpha(0.5);
    this.headlight.setDepth(19);

    this.sprite = scene.physics.add.sprite(start.x, start.y, texMap[unitKind]);
    this.sprite.setDepth(unitKind === 'heli' ? 34 : 21);
    this.sprite.setRotation(this.desiredAngle);
    this.sprite.setCollideWorldBounds(true);

    if (unitKind === 'interceptor') {
      this.sprite.setTint(0x38bdf8);
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14, (this.sprite.width - 28) / 2, (this.sprite.height - 28) / 2);
    body.setBounce(0.25, 0.25);

    this.lightbarGlow = scene.add.image(start.x, start.y, 'fx_pixel_glow');
    this.lightbarGlow.setTint(PALETTE.NEON_CYAN);
    this.lightbarGlow.setAlpha(0.18);
    this.lightbarGlow.setScale(unitKind === 'heli' ? 1.4 : 1.15);
    this.lightbarGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.lightbarGlow.setDepth(unitKind === 'heli' ? 35 : 22);

    if (unitKind === 'heli') {
      this.rotorOverlay = scene.add.image(start.x, start.y, 'veh_heli_rotor');
      this.rotorOverlay.setDepth(36);
      this.sprite.setScale(1.15);
      this.rotorOverlay.setScale(1.15);
    } else if (unitKind === 'tank') {
      this.turretOverlay = scene.add.image(start.x, start.y, 'veh_tank_turret');
      this.turretOverlay.setOrigin(18 / 58, 0.5);
      this.turretOverlay.setDepth(22);
    }

    this.smokeEmitter = scene.add.particles(0, 0, 'fx_smoke', {
      speed: { min: 10, max: 35 },
      scale: { start: 1.1, end: 2.3 },
      alpha: { start: 0.55, end: 0 },
      lifespan: 700,
      emitting: false,
    });
    this.smokeEmitter.setDepth(37);

    this.patrolIdx = (this.patrolIdx + 1) % this.patrolLoop.length;
    this.syncAttachments();
  }

  public isFlying(): boolean {
    return this.unitKind === 'heli';
  }

  public isActiveOnMap(): boolean {
    return this.unitVisible;
  }

  public deployNear(x: number, y: number): void {
    this.hp = this.maxHp;
    this.state = 'PURSUE';
    this.ramCooldownTimer = 0;
    this.reverseTimer = 0;
    this.currentSpeed = 0;
    this.shootTimer = 1.0;
    this.sprite.clearTint();
    if (this.unitKind === 'interceptor') {
      this.sprite.setTint(0x38bdf8);
    }
    this.sprite.setPosition(x, y);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    this.setUnitVisible(true);
    this.syncAttachments();
  }

  public setState(next: Exclude<PoliceState, 'DISABLED'>): void {
    if (this.state === 'DISABLED') return;
    if (this.state !== next) {
      this.state = next;
      this.stuckTimer = 0;
      if (next === 'SEARCH') {
        this.searchOrbitAngle = Math.random() * Math.PI * 2;
        this.searchRadius = 110;
      }
    }
  }

  public getState(): PoliceState {
    return this.state;
  }

  public isDisabled(): boolean {
    return this.state === 'DISABLED' || !this.unitVisible;
  }

  public triggerRamRecovery(): void {
    if (this.unitKind === 'heli') return;
    this.ramCooldownTimer = this.unitKind === 'tank' ? 0.35 : 0.85;
    this.currentSpeed *= this.unitKind === 'tank' ? 0.8 : 0.45;
  }

  public takeHit(
    damage: number,
    dirX: number,
    dirY: number
  ): { destroyed: boolean; cashBonus: number } {
    if (this.state === 'DISABLED' || !this.unitVisible) {
      return { destroyed: false, cashBonus: 0 };
    }

    this.hp = Math.max(0, this.hp - damage);
    this.currentSpeed *= 0.88;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const kbScale = this.unitKind === 'tank' ? 12 : this.unitKind === 'swat' ? 24 : 55;
    body.setVelocity(body.velocity.x + dirX * kbScale, body.velocity.y + dirY * kbScale);

    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(60, () => {
      if (!this.sprite.active) return;
      if (this.state === 'DISABLED') {
        this.sprite.setTint(0x475569).setTintMode(Phaser.TintModes.MULTIPLY);
      } else if (this.unitKind === 'interceptor') {
        this.sprite.setTint(0x38bdf8);
      } else {
        this.sprite.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.state = 'DISABLED';
      this.disabledTimer = this.unitKind === 'heli' || this.unitKind === 'tank' ? 18.0 : 11.0;
      this.currentSpeed = 0;
      body.setVelocity(0, 0);
      this.sprite.setTint(0x475569).setTintMode(Phaser.TintModes.MULTIPLY);
      this.headlight.setAlpha(0);
      this.lightbarGlow.setAlpha(0);
      return { destroyed: true, cashBonus: this.bounty };
    }

    return { destroyed: false, cashBonus: 0 };
  }

  public update(
    dtSeconds: number,
    playerPos: { x: number; y: number },
    playerInVehicle: boolean,
    lastKnownPos: { x: number; y: number } | null,
    collisionManager: CollisionManager,
    onShoot?: (x: number, y: number, angleRad: number, damage: number, speed: number) => void,
    playerVel?: { vx: number; vy: number }
  ): void {
    if (!this.unitVisible) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.rotorOverlay) {
      this.rotorAngle = Phaser.Math.Angle.Wrap(this.rotorAngle + (this.state === 'DISABLED' ? 2 : 18) * dtSeconds);
    }

    if (this.state === 'DISABLED') {
      body.setVelocity(0, 0);
      this.smokeTimer += dtSeconds;
      if (this.smokeTimer >= 0.14) {
        this.smokeTimer = 0;
        this.smokeEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 1);
      }

      this.disabledTimer -= dtSeconds;
      if (this.disabledTimer <= 0) {
        if (this.minWantedStars > 0) {
          this.setUnitVisible(false);
        } else {
          this.resetToPatrol();
        }
      }
      this.syncAttachments();
      return;
    }

    if (this.hp < this.maxHp * 0.45) {
      this.smokeTimer += dtSeconds;
      if (this.smokeTimer >= 0.18) {
        this.smokeTimer = 0;
        this.smokeEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 1);
      }
    }

    if (this.reverseTimer > 0) {
      this.reverseTimer -= dtSeconds;
      this.sprite.rotation += this.reverseTurnDir * 2.1 * dtSeconds;
      const revSpeed = -115;
      body.setVelocity(
        Math.cos(this.sprite.rotation) * revSpeed,
        Math.sin(this.sprite.rotation) * revSpeed
      );
      this.updateLightbar(dtSeconds);
      this.syncAttachments();
      return;
    }

    if (this.ramCooldownTimer > 0) {
      this.ramCooldownTimer -= dtSeconds;
      this.currentSpeed = Math.max(40, this.currentSpeed * (1 - 2.2 * dtSeconds));
      body.setVelocity(
        Math.cos(this.sprite.rotation) * this.currentSpeed,
        Math.sin(this.sprite.rotation) * this.currentSpeed
      );
      this.updateLightbar(dtSeconds);
      this.syncAttachments();
      return;
    }

    let targetPos = this.patrolLoop[this.patrolIdx];
    let targetSpeed: number = WANTED_CONFIG.POLICE_PATROL_SPEED;

    if (this.state === 'PURSUE') {
      const distRaw = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
      // Predictive velocity lead interception for fast units & helicopters
      const leadScale =
        this.unitKind === 'interceptor' || this.unitKind === 'heli' ? 0.55 : 0.35;
      const leadSec = Math.min(leadScale, distRaw / 760);
      const leadX = playerPos.x + (playerVel?.vx ?? 0) * leadSec;
      const leadY = playerPos.y + (playerVel?.vy ?? 0) * leadSec;

      if (this.unitKind === 'heli') {
        // Helicopter maintains an orbital tactical firing ring rather than hovering directly over player
        const ringRadius = 205;
        const orbitAngle = Math.atan2(this.sprite.y - playerPos.y, this.sprite.x - playerPos.x) + dtSeconds * 0.9;
        targetPos = distRaw > 280
          ? { x: leadX, y: leadY }
          : { x: playerPos.x + Math.cos(orbitAngle) * ringRadius, y: playerPos.y + Math.sin(orbitAngle) * ringRadius };
        targetSpeed = WANTED_CONFIG.POLICE_HELI_SPEED;
      } else if (this.flankSign !== 0 && distRaw > 140 && distRaw < 480) {
        // Pincer flanking maneuver so pursuit units box the player in instead of tailgating
        const baseAng = Math.atan2(leadY - this.sprite.y, leadX - this.sprite.x);
        const flankAng = baseAng + this.flankSign * 0.42;
        targetPos = {
          x: this.sprite.x + Math.cos(flankAng) * Math.min(distRaw, 220),
          y: this.sprite.y + Math.sin(flankAng) * Math.min(distRaw, 220),
        };
        targetSpeed =
          this.unitKind === 'interceptor'
            ? playerInVehicle
              ? WANTED_CONFIG.POLICE_INTERCEPTOR_SPEED
              : WANTED_CONFIG.POLICE_PURSUIT_FOOT_SPEED + 25
            : playerInVehicle
              ? WANTED_CONFIG.POLICE_PURSUIT_VEH_SPEED
              : WANTED_CONFIG.POLICE_PURSUIT_FOOT_SPEED;
      } else {
        targetPos = { x: leadX, y: leadY };
        if (this.unitKind === 'tank') {
          targetSpeed = WANTED_CONFIG.POLICE_TANK_SPEED;
        } else if (this.unitKind === 'swat') {
          targetSpeed = WANTED_CONFIG.POLICE_SWAT_SPEED;
        } else if (this.unitKind === 'interceptor') {
          targetSpeed = playerInVehicle ? WANTED_CONFIG.POLICE_INTERCEPTOR_SPEED : WANTED_CONFIG.POLICE_PURSUIT_FOOT_SPEED + 25;
        } else {
          targetSpeed = playerInVehicle
            ? WANTED_CONFIG.POLICE_PURSUIT_VEH_SPEED
            : WANTED_CONFIG.POLICE_PURSUIT_FOOT_SPEED;
        }
      }
    } else if (this.state === 'SEARCH') {
      const anchor = lastKnownPos ?? playerPos;
      const distToAnchor = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, anchor.x, anchor.y);
      if (distToAnchor < this.searchRadius + 25) {
        this.searchOrbitAngle += dtSeconds * 1.1;
        this.searchRadius = Math.min(260, this.searchRadius + dtSeconds * 16);
        targetPos = {
          x: anchor.x + Math.cos(this.searchOrbitAngle) * this.searchRadius,
          y: anchor.y + Math.sin(this.searchOrbitAngle) * this.searchRadius,
        };
      } else {
        targetPos = anchor;
      }
      targetSpeed = WANTED_CONFIG.POLICE_SEARCH_SPEED;
    } else {
      const distWp = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, targetPos.x, targetPos.y);
      if (distWp < 32) {
        this.patrolIdx = (this.patrolIdx + 1) % this.patrolLoop.length;
        targetPos = this.patrolLoop[this.patrolIdx];
      }
    }

    this.aiTimer += dtSeconds;
    if (this.aiTimer >= 0.14) {
      this.aiTimer = 0;
      const rawAngle = Math.atan2(targetPos.y - this.sprite.y, targetPos.x - this.sprite.x);
      this.desiredAngle =
        this.unitKind === 'heli' ? rawAngle : this.computeAvoidanceAngle(rawAngle, collisionManager);

      if (this.unitKind !== 'heli' && this.state !== 'PATROL' && body.speed < 22) {
        this.stuckTimer += 0.14;
        if (this.stuckTimer >= 0.65) {
          this.stuckTimer = 0;
          this.reverseTimer = 0.55;
          this.reverseTurnDir = Math.random() < 0.5 ? 1 : -1;
        }
      } else {
        this.stuckTimer = 0;
      }
    }

    const angleDiff = Phaser.Math.Angle.Wrap(this.desiredAngle - this.sprite.rotation);
    const turnRate = (this.unitKind === 'heli' ? 3.2 : this.state === 'PURSUE' ? 2.45 : 2.1) * dtSeconds;
    if (Math.abs(angleDiff) <= turnRate) {
      this.sprite.rotation = this.desiredAngle;
    } else {
      this.sprite.rotation += Math.sign(angleDiff) * turnRate;
    }

    const turnSlowdown = this.unitKind === 'heli' ? 0.85 : Math.abs(angleDiff) > 0.7 ? 0.48 : 1;
    const distToPlayer = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPos.x, playerPos.y);
    const orbitSlow = this.unitKind === 'heli' && distToPlayer < 160 ? 0.45 : 1;
    const goalSpeed = targetSpeed * turnSlowdown * orbitSlow;
    this.currentSpeed = Phaser.Math.Linear(this.currentSpeed, goalSpeed, Math.min(1, 3.4 * dtSeconds));

    body.setVelocity(
      Math.cos(this.sprite.rotation) * this.currentSpeed,
      Math.sin(this.sprite.rotation) * this.currentSpeed
    );

    if (this.turretOverlay) {
      const aimToPlayer = Math.atan2(playerPos.y - this.sprite.y, playerPos.x - this.sprite.x);
      this.turretOverlay.setRotation(this.state === 'PURSUE' ? aimToPlayer : this.sprite.rotation);
    }

    // Armed Police Helicopter (4★+) & Tank (5★) fire pursuit rounds
    if (onShoot && this.state === 'PURSUE' && (this.unitKind === 'heli' || this.unitKind === 'tank')) {
      this.shootTimer -= dtSeconds;
      const fireDist = this.unitKind === 'heli' ? 420 : 390;
      if (this.shootTimer <= 0 && distToPlayer <= fireDist) {
        const aimAngle = Math.atan2(playerPos.y - this.sprite.y, playerPos.x - this.sprite.x);
        if (this.unitKind === 'heli') {
          this.shootTimer = 0.52;
          onShoot(this.sprite.x, this.sprite.y, aimAngle + (Math.random() - 0.5) * 0.08, 7, 460);
        } else {
          this.shootTimer = 1.65;
          onShoot(this.sprite.x + Math.cos(aimAngle) * 30, this.sprite.y + Math.sin(aimAngle) * 30, aimAngle, 20, 420);
        }
      }
    }

    this.updateLightbar(dtSeconds);
    this.syncAttachments();
  }

  public resetToPatrol(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.hp = this.maxHp;
    this.state = 'PATROL';
    this.ramCooldownTimer = 0;
    this.reverseTimer = 0;
    this.currentSpeed = 0;
    if (this.unitKind === 'interceptor') {
      this.sprite.setTint(0x38bdf8);
    } else {
      this.sprite.clearTint();
    }
    const respawn = this.patrolLoop[this.patrolIdx];
    this.sprite.setPosition(respawn.x, respawn.y);
    body.reset(respawn.x, respawn.y);
    this.headlight.setAlpha(0.45);
    this.syncAttachments();
  }

  public setUnitVisible(visible: boolean): void {
    this.unitVisible = visible;
    this.sprite.setVisible(visible);
    this.shadow.setVisible(visible);
    this.headlight.setVisible(visible);
    this.lightbarGlow.setVisible(visible);
    if (this.rotorOverlay) this.rotorOverlay.setVisible(visible);
    if (this.turretOverlay) this.turretOverlay.setVisible(visible);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = visible;
    if (!visible) {
      this.freeze();
    }
  }

  private computeAvoidanceAngle(rawAngle: number, collisionManager: CollisionManager): number {
    const isClearAt = (angle: number) => {
      for (const dist of [42, 76]) {
        const tx = this.sprite.x + Math.cos(angle) * dist;
        const ty = this.sprite.y + Math.sin(angle) * dist;
        if (!collisionManager.isPointClearForEntity(tx, ty, 15)) {
          return false;
        }
      }
      return true;
    };

    if (isClearAt(rawAngle)) {
      return rawAngle;
    }

    const offsets = [0.48, -0.48, 0.95, -0.95, 1.45, -1.45, 2.05, -2.05];
    for (const off of offsets) {
      const testAngle = rawAngle + off;
      if (isClearAt(testAngle)) {
        return testAngle;
      }
    }

    return rawAngle + Math.PI * 0.65;
  }

  private updateLightbar(dtSeconds: number): void {
    if (this.state === 'PATROL') {
      this.lightbarGlow.setAlpha(0.14);
      this.lightbarGlow.setTint(PALETTE.NEON_CYAN);
      this.headlight.setAlpha(0.45);
      return;
    }

    this.lightbarTimer += dtSeconds;
    const flash = Math.floor(this.lightbarTimer * 9) % 2 === 0;
    this.lightbarGlow.setTint(flash ? PALETTE.WARNING_RED : PALETTE.NEON_CYAN);
    this.lightbarGlow.setAlpha(0.72);
    this.headlight.setAlpha(0.8);
  }

  public freeze(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.currentSpeed = 0;
  }

  private syncAttachments(): void {
    const x = this.sprite.x;
    const y = this.sprite.y;
    const rot = this.sprite.rotation;
    const airOffset = this.unitKind === 'heli' ? 18 : 0;

    this.shadow.setPosition(x + 3 + airOffset, y + 4 + airOffset);
    this.shadow.setRotation(rot);

    this.headlight.setPosition(x + Math.cos(rot) * 20, y + Math.sin(rot) * 20);
    this.headlight.setRotation(rot);

    this.lightbarGlow.setPosition(x, y);

    if (this.rotorOverlay) {
      this.rotorOverlay.setPosition(x, y);
      this.rotorOverlay.setRotation(this.rotorAngle);
    }
    if (this.turretOverlay) {
      this.turretOverlay.setPosition(x, y);
    }
  }

  public destroy(): void {
    this.smokeEmitter.destroy();
    this.shadow.destroy();
    this.headlight.destroy();
    this.lightbarGlow.destroy();
    if (this.rotorOverlay) this.rotorOverlay.destroy();
    if (this.turretOverlay) this.turretOverlay.destroy();
    this.sprite.destroy();
  }
}
