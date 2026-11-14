import Phaser from 'phaser';
import {
  PALETTE,
  VEHICLE_SPECS,
  VEHICLE_UPGRADE_CONFIG,
  VehicleSpec,
  VehicleType,
  VehicleUpgradeTrack,
} from '../config/BalanceConfig';
import { DrivingControlsState } from '../systems/InputManager';
import { VehicleSummary, VehicleUpgradeLevels } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';

export class Vehicle {
  public readonly id: string;
  public readonly spec: VehicleSpec;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private scene: Phaser.Scene;
  private shadow: Phaser.GameObjects.Ellipse;
  private headlight: Phaser.GameObjects.Image;
  private lightbarGlow: Phaser.GameObjects.Image | null = null;
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private nitroEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private health: number;
  private upgrades: VehicleUpgradeLevels = { engine: 0, handling: 0, armor: 0 };
  private paintColor: number | null = null;
  private forwardSpeed = 0;
  private occupied = false;
  private lastImpactAt = 0;
  private lightbarTimer = 0;

  private nitro = 100;
  private isBoosting = false;
  private turboPadTimer = 0;
  private turboPadCooldown = 0;
  private airTimer = 0;
  private airDuration = 0;
  private rampCooldown = 0;

  constructor(scene: Phaser.Scene, id: string, type: VehicleType, x: number, y: number, angleDeg = 0) {
    this.scene = scene;
    this.id = id;
    this.spec = VEHICLE_SPECS[type];
    this.health = this.spec.maxHealth;

    this.shadow = scene.add.ellipse(x + 3, y + 4, this.spec.width + 4, this.spec.height + 2, 0x000000, 0.52);
    this.shadow.setDepth(18);

    this.headlight = scene.add.image(x, y, 'fx_headlight');
    this.headlight.setOrigin(0, 0.5);
    this.headlight.setBlendMode(Phaser.BlendModes.ADD);
    this.headlight.setAlpha(0.18);
    this.headlight.setDepth(19);

    this.sprite = scene.physics.add.sprite(x, y, this.spec.textureKey);
    this.sprite.setDepth(21);
    this.sprite.setCollideWorldBounds(true);

    const angleRad = Phaser.Math.DegToRad(angleDeg);
    this.sprite.setRotation(angleRad);
    this.shadow.setRotation(angleRad);
    this.headlight.setRotation(angleRad);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const hitboxDiameter = Math.min(this.spec.width, this.spec.height) + 4;
    body.setCircle(
      hitboxDiameter / 2,
      (this.spec.width - hitboxDiameter) / 2,
      (this.spec.height - hitboxDiameter) / 2
    );
    body.setBounce(0.25, 0.25);
    body.setDrag(180, 180);
    body.setMaxVelocity(this.spec.maxSpeed * 1.6, this.spec.maxSpeed * 1.6);

    if (this.spec.hasLightbar) {
      this.lightbarGlow = scene.add.image(x, y, 'fx_pixel_glow');
      this.lightbarGlow.setTint(PALETTE.WARNING_RED);
      this.lightbarGlow.setAlpha(0.16);
      this.lightbarGlow.setScale(1.1);
      this.lightbarGlow.setBlendMode(Phaser.BlendModes.ADD);
      this.lightbarGlow.setDepth(22);
    }

    this.sparkEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 35, max: 110 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 280,
      tint: [PALETTE.GOLD, PALETTE.NEON_PINK, PALETTE.NEON_CYAN],
      emitting: false,
    });
    this.sparkEmitter.setDepth(23);

    this.nitroEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 45, max: 130 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 220,
      tint: [PALETTE.NEON_CYAN, PALETTE.NEON_PINK, PALETTE.GOLD],
      emitting: false,
    });
    this.nitroEmitter.setDepth(20);

    this.syncAttachments();
  }

  public setOccupied(occupied: boolean): void {
    this.occupied = occupied;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (occupied) {
      this.headlight.setAlpha(0.84);
      body.setDrag(0, 0);
      body.setImmovable(false);
    } else {
      this.isBoosting = false;
      this.headlight.setAlpha(0.18);
      body.setDrag(240, 240);
    }
  }

  public isOccupied(): boolean {
    return this.occupied;
  }

  public update(
    dtSeconds: number,
    controls?: DrivingControlsState,
    onStuntLanded?: (bonus: number) => void
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.turboPadTimer > 0) this.turboPadTimer = Math.max(0, this.turboPadTimer - dtSeconds);
    if (this.turboPadCooldown > 0) this.turboPadCooldown = Math.max(0, this.turboPadCooldown - dtSeconds);
    if (this.rampCooldown > 0) this.rampCooldown = Math.max(0, this.rampCooldown - dtSeconds);

    // Airtime stunt jump scale arc
    if (this.airTimer > 0 && this.airDuration > 0) {
      this.airTimer -= dtSeconds;
      const progress = 1 - Math.max(0, this.airTimer) / this.airDuration;
      const arc = Math.sin(progress * Math.PI);
      this.sprite.setScale(1 + arc * 0.42);
      this.sprite.setDepth(32);
      this.shadow.setScale(1 - arc * 0.16);

      if (this.airTimer <= 0) {
        this.airTimer = 0;
        this.airDuration = 0;
        this.sprite.setScale(1);
        this.sprite.setDepth(21);
        this.shadow.setScale(1);
        this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 12);
        this.scene.cameras.main.shake(95, 0.004);
        onStuntLanded?.(100);
      }
    }

    if (this.occupied && controls) {
      const { driveX, driveY, handbrake, nitro } = controls;

      const headingX = Math.cos(this.sprite.rotation);
      const headingY = Math.sin(this.sprite.rotation);
      const rightX = -headingY;
      const rightY = headingX;

      const currentForward = body.velocity.x * headingX + body.velocity.y * headingY;
      const currentLateral = body.velocity.x * rightX + body.velocity.y * rightY;

      // Only clamp internal speed downward if an external collision stopped the chassis
      if (Math.abs(currentForward) < Math.abs(this.forwardSpeed) * 0.72) {
        this.forwardSpeed = currentForward;
      }

      const inputMag = Math.min(1, Math.hypot(driveX, driveY));
      const hasDriveInput = inputMag > 0.08 && !handbrake;
      const wantNitro = Boolean(nitro && hasDriveInput && this.nitro > 4);
      this.isBoosting = wantNitro || this.turboPadTimer > 0;

      if (wantNitro) {
        this.nitro = Math.max(0, this.nitro - 26 * dtSeconds);
      } else {
        this.nitro = Math.min(100, this.nitro + 14 * dtSeconds);
      }

      const boostSpeedMult = this.turboPadTimer > 0 ? 1.42 : wantNitro ? 1.34 : 1;
      const boostAccelMult = this.turboPadTimer > 0 ? 1.65 : wantNitro ? 1.55 : 1;

      const maxSpeed = this.getEffectiveMaxSpeed() * boostSpeedMult;
      const accel = this.getEffectiveAcceleration() * boostAccelMult;
      const turnSpeed = this.getEffectiveTurnSpeed();
      const lateralGrip = this.getEffectiveLateralGrip();

      body.setMaxVelocity(maxSpeed * 1.15, maxSpeed * 1.15);

      if (handbrake) {
        const decel = this.spec.braking * 1.65 * dtSeconds;
        if (Math.abs(this.forwardSpeed) <= decel) {
          this.forwardSpeed = 0;
        } else {
          this.forwardSpeed -= Math.sign(this.forwardSpeed) * decel;
        }
      } else if (hasDriveInput) {
        const targetAngle = Math.atan2(driveY, driveX);
        const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.sprite.rotation);

        // Responsive arcade-style turning: pivots quickly from low speed and sweeps smoothly at high speed
        const lowSpeedAgility = Math.abs(this.forwardSpeed) < 90 ? 1.45 : 1.0;
        const maxTurnStep = turnSpeed * 2.65 * lowSpeedAgility * dtSeconds;
        if (Math.abs(angleDiff) <= maxTurnStep) {
          this.sprite.rotation = targetAngle;
        } else {
          this.sprite.rotation += Math.sign(angleDiff) * maxTurnStep;
        }

        const remainingDiff = Math.abs(Phaser.Math.Angle.Wrap(targetAngle - this.sprite.rotation));
        const alignFactor = Math.max(0.32, Math.cos(remainingDiff * 0.5));
        const targetSpeed = maxSpeed * inputMag * alignFactor;

        if (this.forwardSpeed < targetSpeed) {
          this.forwardSpeed = Math.min(targetSpeed, this.forwardSpeed + accel * dtSeconds);
        } else {
          this.forwardSpeed = Math.max(
            targetSpeed,
            this.forwardSpeed - this.spec.braking * 0.85 * dtSeconds
          );
        }
      } else {
        const dragAmount = this.spec.drag * 125 * dtSeconds;
        if (Math.abs(this.forwardSpeed) <= dragAmount) {
          this.forwardSpeed = 0;
        } else {
          this.forwardSpeed -= Math.sign(this.forwardSpeed) * dragAmount;
        }
      }

      this.forwardSpeed = Phaser.Math.Clamp(this.forwardSpeed, 0, maxSpeed);

      // Apply forward speed directly along heading while damping lateral slip naturally
      const nextHeadingX = Math.cos(this.sprite.rotation);
      const nextHeadingY = Math.sin(this.sprite.rotation);
      const nextRightX = -nextHeadingY;
      const nextRightY = nextHeadingX;
      const slipDamp = Math.max(0, 1 - lateralGrip * 1.35 * dtSeconds);
      const nextLateral = currentLateral * slipDamp;

      body.setVelocity(
        nextHeadingX * this.forwardSpeed + nextRightX * nextLateral,
        nextHeadingY * this.forwardSpeed + nextRightY * nextLateral
      );

      if (this.isBoosting && this.airTimer <= 0) {
        const rearX = this.sprite.x - nextHeadingX * (this.spec.width * 0.5);
        const rearY = this.sprite.y - nextHeadingY * (this.spec.width * 0.5);
        this.nitroEmitter.emitParticleAt(rearX, rearY, 2);
      }
    } else {
      this.isBoosting = false;
      this.forwardSpeed = Math.hypot(body.velocity.x, body.velocity.y);
      if (this.forwardSpeed < 6) {
        body.setVelocity(0, 0);
        this.forwardSpeed = 0;
      }
    }

    if (this.lightbarGlow) {
      if (this.occupied) {
        this.lightbarTimer += dtSeconds;
        const flashBlue = Math.floor(this.lightbarTimer * 7) % 2 === 0;
        this.lightbarGlow.setTint(flashBlue ? PALETTE.NEON_CYAN : PALETTE.WARNING_RED);
        this.lightbarGlow.setAlpha(0.55);
      } else {
        this.lightbarGlow.setAlpha(0.12);
      }
    }

    this.syncAttachments();
  }

  public triggerTurboBoost(): boolean {
    if (this.turboPadCooldown > 0) return false;
    this.turboPadCooldown = 0.7;
    this.turboPadTimer = 1.25;
    this.nitro = Math.min(100, this.nitro + 35);
    const boostTarget = this.getEffectiveMaxSpeed() * 1.4;
    if (this.forwardSpeed < boostTarget) {
      this.forwardSpeed = Math.max(this.forwardSpeed + 180, boostTarget * 0.92);
    }
    this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 10);
    return true;
  }

  public triggerStuntJump(): boolean {
    if (this.airTimer > 0 || this.rampCooldown > 0 || Math.abs(this.forwardSpeed) < 230) {
      return false;
    }
    this.airDuration = 0.85;
    this.airTimer = 0.85;
    this.rampCooldown = 1.8;
    this.nitro = Math.min(100, this.nitro + 25);
    this.forwardSpeed = Math.max(this.forwardSpeed, this.getEffectiveMaxSpeed() * 1.12);
    this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 10);
    return true;
  }

  public refillNitro(amount: number): void {
    this.nitro = Math.min(100, this.nitro + amount);
  }

  public getNitro(): number {
    return Math.round(this.nitro);
  }

  public isNitroBoosting(): boolean {
    return this.isBoosting;
  }

  public isAirborne(): boolean {
    return this.airTimer > 0;
  }

  public handleCollision(nowMs: number): number {
    if (this.airTimer > 0) return 0;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const impactSpeed = Math.max(Math.abs(this.forwardSpeed), body.speed);

    if (nowMs - this.lastImpactAt < 250) return 0;
    this.lastImpactAt = nowMs;

    this.forwardSpeed *= 0.45;

    if (impactSpeed > 150) {
      const dmg = Math.max(2, Math.round((impactSpeed - 135) * 0.04));
      this.health = Math.max(10, this.health - dmg);
      this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 8);
      this.sprite.setTint(PALETTE.GOLD);
      this.scene.time.delayedCall(80, () => {
        if (this.sprite.active) this.applyBaseTint();
      });
      return Math.min(1, impactSpeed / this.spec.maxSpeed);
    }
    return 0;
  }

  public applyBulletHit(damage: number): void {
    if (this.occupied) return;
    this.health = Math.max(10, this.health - Math.max(1, Math.round(damage * 0.35)));
    this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 6);
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(55, () => {
      if (this.sprite.active) this.applyBaseTint();
    });
  }

  public setPaintColor(colorNum: number | null): void {
    this.paintColor = colorNum;
    this.applyBaseTint();
  }

  public getPaintColor(): number | null {
    return this.paintColor;
  }

  private applyBaseTint(): void {
    if (this.paintColor !== null) {
      this.sprite.setTint(this.paintColor).setTintMode(Phaser.TintModes.MULTIPLY);
    } else {
      this.sprite.clearTint();
    }
  }

  public findSafeExitPosition(
    collisionManager: CollisionManager,
    otherVehicles: Vehicle[]
  ): { x: number; y: number } | null {
    const angle = this.sprite.rotation;
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const fwdX = Math.cos(angle);
    const fwdY = Math.sin(angle);

    const candidates = [
      { x: this.sprite.x - perpX * 34, y: this.sprite.y - perpY * 34 },
      { x: this.sprite.x + perpX * 34, y: this.sprite.y + perpY * 34 },
      { x: this.sprite.x - fwdX * 40, y: this.sprite.y - fwdY * 40 },
      { x: this.sprite.x + fwdX * 40, y: this.sprite.y + fwdY * 40 },
    ];

    for (const c of candidates) {
      if (!collisionManager.isPointClearForEntity(c.x, c.y, 13)) {
        continue;
      }
      const blockedByCar = otherVehicles.some((v) => {
        if (v.id === this.id) return false;
        return Phaser.Math.Distance.Between(c.x, c.y, v.sprite.x, v.sprite.y) < 30;
      });
      if (!blockedByCar) {
        return { x: Math.round(c.x), y: Math.round(c.y) };
      }
    }

    return null;
  }

  public getSpeedPxPerSec(): number {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return Math.round(Math.hypot(body.velocity.x, body.velocity.y));
  }

  public getSpeedKmh(): number {
    return Math.round(this.getSpeedPxPerSec() * 0.28);
  }

  public getEffectiveMaxSpeed(): number {
    return Math.round(this.spec.maxSpeed * (1 + this.upgrades.engine * 0.1));
  }

  public getEffectiveAcceleration(): number {
    return Math.round(this.spec.acceleration * (1 + this.upgrades.engine * 0.12));
  }

  public getEffectiveTurnSpeed(): number {
    return this.spec.turnSpeed * (1 + this.upgrades.handling * 0.1);
  }

  public getEffectiveLateralGrip(): number {
    return this.spec.lateralGrip * (1 + this.upgrades.handling * 0.12);
  }

  public getEffectiveMaxHealth(): number {
    return this.spec.maxHealth + this.upgrades.armor * 30;
  }

  public getHealth(): number {
    return this.health;
  }

  public getUpgrades(): VehicleUpgradeLevels {
    return { ...this.upgrades };
  }

  public repairFull(): boolean {
    const maxHp = this.getEffectiveMaxHealth();
    if (this.health >= maxHp) return false;
    this.health = maxHp;
    return true;
  }

  public applyUpgrade(track: VehicleUpgradeTrack): boolean {
    const maxLvl = VEHICLE_UPGRADE_CONFIG[track].maxLevel;
    if (this.upgrades[track] >= maxLvl) return false;
    this.upgrades[track] += 1;

    if (track === 'engine') {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      const newMax = this.getEffectiveMaxSpeed() * 1.5;
      body.setMaxVelocity(newMax, newMax);
    } else if (track === 'armor') {
      this.health = this.getEffectiveMaxHealth();
    }
    return true;
  }

  public getSummary(): VehicleSummary {
    return {
      id: this.id,
      type: this.spec.type,
      name: this.spec.name,
      health: this.health,
      maxHealth: this.getEffectiveMaxHealth(),
      upgrades: this.getUpgrades(),
      accentColor: this.spec.accentHex,
      paintColor: this.paintColor,
    };
  }

  public restoreState(
    x: number,
    y: number,
    angleDeg: number,
    health: number,
    upgrades: VehicleUpgradeLevels,
    paintColor: number | null = null
  ): void {
    this.upgrades = {
      engine: Phaser.Math.Clamp(upgrades?.engine ?? 0, 0, VEHICLE_UPGRADE_CONFIG.engine.maxLevel),
      handling: Phaser.Math.Clamp(upgrades?.handling ?? 0, 0, VEHICLE_UPGRADE_CONFIG.handling.maxLevel),
      armor: Phaser.Math.Clamp(upgrades?.armor ?? 0, 0, VEHICLE_UPGRADE_CONFIG.armor.maxLevel),
    };
    this.paintColor = paintColor ?? null;
    this.applyBaseTint();
    const maxHp = this.getEffectiveMaxHealth();
    this.health = Phaser.Math.Clamp(Math.round(health), 10, maxHp);
    this.forwardSpeed = 0;
    this.nitro = 100;
    this.airTimer = 0;
    this.airDuration = 0;
    this.sprite.setScale(1);
    this.sprite.setDepth(21);

    const angleRad = Phaser.Math.DegToRad(angleDeg);
    this.sprite.setPosition(x, y);
    this.sprite.setRotation(angleRad);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setMaxVelocity(this.getEffectiveMaxSpeed() * 1.5, this.getEffectiveMaxSpeed() * 1.5);
    this.syncAttachments();
  }

  public getPosition(): { x: number; y: number } {
    return { x: Math.round(this.sprite.x), y: Math.round(this.sprite.y) };
  }

  public getRotationDeg(): number {
    return Math.round(Phaser.Math.RadToDeg(this.sprite.rotation));
  }

  public freeze(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.forwardSpeed = 0;
    this.isBoosting = false;
  }

  private syncAttachments(): void {
    const x = this.sprite.x;
    const y = this.sprite.y;
    const rot = this.sprite.rotation;
    const airOffset = this.airDuration > 0
      ? Math.sin((1 - Math.max(0, this.airTimer) / this.airDuration) * Math.PI) * 14
      : 0;

    this.shadow.setPosition(x + 3 + airOffset, y + 4 + airOffset);
    this.shadow.setRotation(rot);

    const frontOffset = this.spec.width * 0.44;
    this.headlight.setPosition(
      x + Math.cos(rot) * frontOffset,
      y + Math.sin(rot) * frontOffset
    );
    this.headlight.setRotation(rot);

    if (this.lightbarGlow) {
      this.lightbarGlow.setPosition(x, y);
    }
  }

  public destroy(): void {
    this.sparkEmitter.destroy();
    this.nitroEmitter.destroy();
    this.shadow.destroy();
    this.headlight.destroy();
    if (this.lightbarGlow) {
      this.lightbarGlow.destroy();
    }
    this.sprite.destroy();
  }
}
