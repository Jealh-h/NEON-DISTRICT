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

export interface VehicleInitOptions {
  textureOverride?: string;
  isTempHijacked?: boolean;
}

export class Vehicle {
  public readonly id: string;
  public readonly spec: VehicleSpec;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  public readonly isTempHijacked: boolean;

  private scene: Phaser.Scene;
  private baseTextureKey: string;
  private spawnOrigin: { x: number; y: number; angleDeg: number };
  private shadow: Phaser.GameObjects.Ellipse;
  private headlight: Phaser.GameObjects.Image;
  private lightbarGlow: Phaser.GameObjects.Image | null = null;
  private rotorSprite: Phaser.GameObjects.Image | null = null;
  private turretSprite: Phaser.GameObjects.Image | null = null;
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private nitroEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private health: number;
  private destroyed = false;
  private respawnAtMs = 0;
  private smokeTimer = 0;
  private upgrades: VehicleUpgradeLevels = { engine: 0, handling: 0, armor: 0 };
  private paintColor: number | null = null;
  private forwardSpeed = 0;
  private occupied = false;
  private lastImpactAt = 0;
  private lightbarTimer = 0;

  private rotorAngle = 0;
  private rotorSpinSpeed = 0;
  private flightLift = 0;
  private turretAngleRad: number;

  private nitro = 100;
  private isBoosting = false;
  private turboPadTimer = 0;
  private turboPadCooldown = 0;
  private airTimer = 0;
  private airDuration = 0;
  private rampCooldown = 0;
  private rampLaunchPos: { x: number; y: number } | null = null;

  constructor(
    scene: Phaser.Scene,
    id: string,
    type: VehicleType,
    x: number,
    y: number,
    angleDeg = 0,
    options?: VehicleInitOptions
  ) {
    this.scene = scene;
    this.id = id;
    this.spec = VEHICLE_SPECS[type];
    this.isTempHijacked = Boolean(options?.isTempHijacked);
    this.baseTextureKey = options?.textureOverride ?? this.spec.textureKey;
    this.spawnOrigin = { x, y, angleDeg };
    this.health = this.spec.maxHealth;

    this.shadow = scene.add.ellipse(x + 3, y + 4, this.spec.width + 4, this.spec.height + 2, 0x000000, 0.52);
    this.shadow.setDepth(18);

    this.headlight = scene.add.image(x, y, 'fx_headlight');
    this.headlight.setOrigin(0, 0.5);
    this.headlight.setBlendMode(Phaser.BlendModes.ADD);
    this.headlight.setAlpha(0.18);
    this.headlight.setDepth(19);

    this.sprite = scene.physics.add.sprite(x, y, this.baseTextureKey);
    this.sprite.setDepth(21);
    this.sprite.setCollideWorldBounds(true);

    const angleRad = Phaser.Math.DegToRad(angleDeg);
    this.turretAngleRad = angleRad;
    this.sprite.setRotation(angleRad);
    this.shadow.setRotation(angleRad);
    this.headlight.setRotation(angleRad);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const hitboxDiameter = Math.min(this.spec.width, this.spec.height) + 4;
    body.setCircle(
      hitboxDiameter / 2,
      (this.sprite.width - hitboxDiameter) / 2,
      (this.sprite.height - hitboxDiameter) / 2
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

    if (this.spec.hasTurret) {
      this.turretSprite = scene.add.image(x, y, 'veh_tank_turret');
      this.turretSprite.setOrigin(18 / 58, 0.5);
      this.turretSprite.setRotation(angleRad);
      this.turretSprite.setDepth(22);
    }

    if (this.spec.isFlying) {
      this.rotorSprite = scene.add.image(x, y, 'veh_heli_rotor');
      this.rotorSprite.setDepth(35);
      this.headlight.setAlpha(0.08);
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

    this.smokeEmitter = scene.add.particles(0, 0, 'fx_smoke', {
      speed: { min: 14, max: 48 },
      scale: { start: 1.5, end: 2.6 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 520,
      tint: [0x475569, 0x1e293b, 0xf97316],
      emitting: false,
    });
    this.smokeEmitter.setDepth(36);

    this.syncAttachments();
  }

  public setOccupied(occupied: boolean): void {
    this.occupied = occupied;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (occupied) {
      this.headlight.setAlpha(this.spec.isFlying ? 0.45 : 0.84);
      body.setDrag(0, 0);
      body.setImmovable(false);
    } else {
      this.isBoosting = false;
      this.headlight.setAlpha(this.spec.isFlying ? 0.08 : 0.18);
      body.setDrag(240, 240);
    }
  }

  public isOccupied(): boolean {
    return this.occupied;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public shouldRemoveTempWreck(nowMs: number): boolean {
    return this.isTempHijacked && this.destroyed && this.respawnAtMs > 0 && nowMs >= this.respawnAtMs;
  }

  public setTurretAngle(angleRad: number): void {
    if (!this.spec.hasTurret) return;
    const diff = Phaser.Math.Angle.Wrap(angleRad - this.turretAngleRad);
    this.turretAngleRad += diff * 0.25;
  }

  public getTurretAngle(): number {
    return this.spec.hasTurret ? this.turretAngleRad : this.sprite.rotation;
  }

  public getTurretMuzzle(): { x: number; y: number } {
    const angle = this.getTurretAngle();
    const reach = this.spec.hasTurret ? 38 : this.spec.width * 0.55;
    return {
      x: this.sprite.x + Math.cos(angle) * reach,
      y: this.sprite.y + Math.sin(angle) * reach,
    };
  }

  public getAutocannonMuzzles(): Array<{ x: number; y: number }> {
    const rot = this.sprite.rotation;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const fwd = 20;
    const wing = 11;
    return [
      { x: this.sprite.x + cos * fwd - sin * wing, y: this.sprite.y + sin * fwd + cos * wing },
      { x: this.sprite.x + cos * fwd + sin * wing, y: this.sprite.y + sin * fwd - cos * wing },
    ];
  }

  public update(
    dtSeconds: number,
    controls?: DrivingControlsState,
    onStuntLanded?: (bonus: number, meters: number) => void,
    onDestroyed?: (vehicle: Vehicle) => void,
    modifiers?: { speedMult?: number; nitroRegenMult?: number; gripMult?: number }
  ): void {
    const nowMs = this.scene.time.now;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.destroyed) {
      body.setVelocity(0, 0);
      this.forwardSpeed = 0;
      this.smokeTimer += dtSeconds;
      if (this.smokeTimer >= 0.16) {
        this.smokeTimer = 0;
        this.smokeEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 1);
      }
      if (!this.isTempHijacked && this.respawnAtMs > 0 && nowMs >= this.respawnAtMs) {
        this.respawnAtOrigin();
      }
      this.syncAttachments();
      return;
    }

    if (this.turboPadTimer > 0) this.turboPadTimer = Math.max(0, this.turboPadTimer - dtSeconds);
    if (this.turboPadCooldown > 0) this.turboPadCooldown = Math.max(0, this.turboPadCooldown - dtSeconds);
    if (this.rampCooldown > 0) this.rampCooldown = Math.max(0, this.rampCooldown - dtSeconds);

    // Helicopter rotor spin + vertical takeoff lift
    if (this.spec.isFlying) {
      const targetSpin = this.occupied ? 20 : 0;
      this.rotorSpinSpeed = Phaser.Math.Linear(this.rotorSpinSpeed, targetSpin, Math.min(1, dtSeconds * 3.5));
      this.rotorAngle = Phaser.Math.Angle.Wrap(this.rotorAngle + this.rotorSpinSpeed * dtSeconds);
      const targetLift = this.occupied ? 1 : 0;
      this.flightLift = Phaser.Math.Linear(this.flightLift, targetLift, Math.min(1, dtSeconds * 2.6));
      const scale = 1 + this.flightLift * 0.24;
      this.sprite.setScale(scale);
      this.sprite.setDepth(this.flightLift > 0.15 ? 34 : 21);
      this.shadow.setScale(1 - this.flightLift * 0.14);
      this.shadow.setAlpha(0.52 - this.flightLift * 0.2);
    }

    // Airtime stunt jump scale arc (ground vehicles)
    if (!this.spec.isFlying && this.airTimer > 0 && this.airDuration > 0) {
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
        const launch = this.rampLaunchPos;
        this.rampLaunchPos = null;
        const meters = launch
          ? Math.max(8, Math.round(Phaser.Math.Distance.Between(launch.x, launch.y, this.sprite.x, this.sprite.y) / 7))
          : 15;
        const bonus = 80 + Math.round(meters * 4);
        onStuntLanded?.(bonus, meters);
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

      if (Math.abs(currentForward) < Math.abs(this.forwardSpeed) * 0.72) {
        this.forwardSpeed = currentForward;
      }

      const inputMag = Math.min(1, Math.hypot(driveX, driveY));
      const hasDriveInput = inputMag > 0.08 && !handbrake;
      const wantNitro = Boolean(nitro && hasDriveInput && this.nitro > 4);
      this.isBoosting = wantNitro || this.turboPadTimer > 0;

      const nitroRegenMult = modifiers?.nitroRegenMult ?? 1;
      if (wantNitro) {
        this.nitro = Math.max(0, this.nitro - 26 * dtSeconds);
      } else {
        this.nitro = Math.min(100, this.nitro + 14 * nitroRegenMult * dtSeconds);
      }

      const speedMult = modifiers?.speedMult ?? 1;
      const gripMult = modifiers?.gripMult ?? 1;
      const boostSpeedMult = (this.turboPadTimer > 0 ? 1.32 : wantNitro ? 1.24 : 1) * speedMult;
      const boostAccelMult = (this.turboPadTimer > 0 ? 1.45 : wantNitro ? 1.35 : 1) * speedMult;

      const maxSpeed = this.getEffectiveMaxSpeed() * boostSpeedMult;
      const accel = this.getEffectiveAcceleration() * boostAccelMult;
      const turnSpeed = this.getEffectiveTurnSpeed();
      const lateralGrip = this.getEffectiveLateralGrip() * gripMult;

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
        const dragAmount = this.spec.drag * 145 * dtSeconds;
        if (Math.abs(this.forwardSpeed) <= dragAmount) {
          this.forwardSpeed = 0;
        } else {
          this.forwardSpeed -= Math.sign(this.forwardSpeed) * dragAmount;
        }
      }

      this.forwardSpeed = Phaser.Math.Clamp(this.forwardSpeed, 0, maxSpeed);

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

      if (this.isBoosting && this.airTimer <= 0 && !this.spec.isFlying) {
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

    // Damage smoke warning below 35% HP
    const hpRatio = this.health / Math.max(1, this.getEffectiveMaxHealth());
    if (hpRatio <= 0.35) {
      this.smokeTimer += dtSeconds;
      if (this.smokeTimer >= (hpRatio <= 0.18 ? 0.09 : 0.22)) {
        this.smokeTimer = 0;
        this.smokeEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 1);
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

    if (this.health <= 0 && !this.destroyed) {
      this.triggerDestruction(onDestroyed);
    }

    this.syncAttachments();
  }

  private triggerDestruction(onDestroyed?: (vehicle: Vehicle) => void): void {
    this.destroyed = true;
    this.health = 0;
    this.forwardSpeed = 0;
    this.isBoosting = false;
    this.flightLift = 0;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;

    this.sprite.setTint(0x334155).setTintMode(Phaser.TintModes.MULTIPLY);
    this.sprite.setAlpha(0.72);
    this.sprite.setScale(1);
    this.sprite.setDepth(20);
    this.headlight.setAlpha(0);
    if (this.lightbarGlow) this.lightbarGlow.setAlpha(0);
    if (this.turretSprite) this.turretSprite.setTint(0x334155);
    if (this.rotorSprite) this.rotorSprite.setAlpha(0.35);

    const scorch = this.scene.add.image(this.sprite.x, this.sprite.y, 'fx_scorch');
    scorch.setDepth(6);
    scorch.setScale(1.7);
    this.scene.tweens.add({
      targets: scorch,
      alpha: 0,
      duration: 6000,
      onComplete: () => scorch.destroy(),
    });

    this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 20);
    this.smokeEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 12);
    this.respawnAtMs = this.scene.time.now + (this.isTempHijacked ? 4500 : 18000);
    onDestroyed?.(this);
  }

  private respawnAtOrigin(): void {
    this.destroyed = false;
    this.respawnAtMs = 0;
    this.sprite.setAlpha(1);
    if (this.rotorSprite) this.rotorSprite.setAlpha(1);
    if (this.turretSprite) this.turretSprite.clearTint();
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    this.restoreState(
      this.spawnOrigin.x,
      this.spawnOrigin.y,
      this.spawnOrigin.angleDeg,
      this.getEffectiveMaxHealth(),
      this.upgrades,
      this.paintColor
    );
  }

  public triggerTurboBoost(): boolean {
    if (this.destroyed || this.spec.isFlying) return false;
    if (this.turboPadCooldown > 0) return false;
    this.turboPadCooldown = 0.7;
    this.turboPadTimer = 1.25;
    this.nitro = Math.min(100, this.nitro + 35);
    const boostTarget = this.getEffectiveMaxSpeed() * 1.3;
    if (this.forwardSpeed < boostTarget) {
      this.forwardSpeed = Math.max(this.forwardSpeed + 120, boostTarget * 0.9);
    }
    this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 10);
    return true;
  }

  public triggerStuntJump(): boolean {
    if (this.destroyed || this.spec.isFlying) return false;
    if (this.airTimer > 0 || this.rampCooldown > 0 || Math.abs(this.forwardSpeed) < 185) {
      return false;
    }
    this.airDuration = 0.85;
    this.airTimer = 0.85;
    this.rampCooldown = 1.8;
    this.rampLaunchPos = { x: this.sprite.x, y: this.sprite.y };
    this.nitro = Math.min(100, this.nitro + 25);
    this.forwardSpeed = Math.max(this.forwardSpeed, this.getEffectiveMaxSpeed() * 1.1);
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
    if (this.destroyed || this.airTimer > 0 || this.spec.isFlying) return 0;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const impactSpeed = Math.max(Math.abs(this.forwardSpeed), body.speed);

    if (nowMs - this.lastImpactAt < 250) return 0;
    this.lastImpactAt = nowMs;

    const dmgScale = this.spec.collisionDamageScale ?? 1;
    this.forwardSpeed *= dmgScale < 0.3 ? 0.72 : 0.45;

    if (impactSpeed > 150) {
      const dmg = Math.max(1, Math.round((impactSpeed - 135) * 0.04 * dmgScale));
      this.health = Math.max(0, this.health - dmg);
      this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 8);
      this.sprite.setTint(PALETTE.GOLD);
      this.scene.time.delayedCall(80, () => {
        if (this.sprite.active && !this.destroyed) this.applyBaseTint();
      });
      return Math.min(1, impactSpeed / this.spec.maxSpeed);
    }
    return 0;
  }

  public applyBulletHit(damage: number, allowOccupiedDamage = false): boolean {
    if (this.destroyed) return false;
    if (this.occupied && !allowOccupiedDamage) return false;
    const scale = this.occupied ? 0.25 : 0.55;
    this.health = Math.max(0, this.health - Math.max(2, Math.round(damage * scale)));
    this.sparkEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 6);
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(55, () => {
      if (this.sprite.active && !this.destroyed) this.applyBaseTint();
    });
    return this.health <= 0;
  }

  public forceCheckDestruction(onDestroyed?: (vehicle: Vehicle) => void): void {
    if (this.health <= 0 && !this.destroyed) {
      this.triggerDestruction(onDestroyed);
    }
  }

  public setPaintColor(colorNum: number | null): void {
    this.paintColor = colorNum;
    if (!this.destroyed) {
      this.applyBaseTint();
    }
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
    // Helicopters must be above solid dry ground to disembark safely
    if (this.spec.isFlying) {
      if (!collisionManager.isPointClearForEntity(this.sprite.x, this.sprite.y, 16)) {
        return null;
      }
    }

    const angle = this.sprite.rotation;
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const fwdX = Math.cos(angle);
    const fwdY = Math.sin(angle);

    const sideDist = Math.max(34, this.spec.height * 0.72 + 16);
    const fwdDist = Math.max(40, this.spec.width * 0.68 + 14);
    const candidates = [
      { x: this.sprite.x - perpX * sideDist, y: this.sprite.y - perpY * sideDist },
      { x: this.sprite.x + perpX * sideDist, y: this.sprite.y + perpY * sideDist },
      { x: this.sprite.x - fwdX * fwdDist, y: this.sprite.y - fwdY * fwdDist },
      { x: this.sprite.x + fwdX * fwdDist, y: this.sprite.y + fwdY * fwdDist },
    ];

    for (const c of candidates) {
      if (!collisionManager.isPointClearForEntity(c.x, c.y, 13)) {
        continue;
      }
      const blockedByCar = otherVehicles.some((v) => {
        if (v.id === this.id || v.isDestroyed() || v.spec.isFlying) return false;
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

  public getVelocity(): { vx: number; vy: number } {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    return { vx: body.velocity.x, vy: body.velocity.y };
  }

  public getSpeedKmh(): number {
    return Math.round(this.getSpeedPxPerSec() * 0.38);
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
    if (this.destroyed) {
      this.respawnAtOrigin();
      return true;
    }
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
    this.destroyed = false;
    this.respawnAtMs = 0;
    this.upgrades = {
      engine: Phaser.Math.Clamp(upgrades?.engine ?? 0, 0, VEHICLE_UPGRADE_CONFIG.engine.maxLevel),
      handling: Phaser.Math.Clamp(upgrades?.handling ?? 0, 0, VEHICLE_UPGRADE_CONFIG.handling.maxLevel),
      armor: Phaser.Math.Clamp(upgrades?.armor ?? 0, 0, VEHICLE_UPGRADE_CONFIG.armor.maxLevel),
    };
    this.paintColor = paintColor ?? null;
    this.sprite.setAlpha(1);
    this.applyBaseTint();
    const maxHp = this.getEffectiveMaxHealth();
    this.health = Phaser.Math.Clamp(Math.round(health), 20, maxHp);
    this.forwardSpeed = 0;
    this.nitro = 100;
    this.airTimer = 0;
    this.airDuration = 0;
    this.flightLift = 0;
    this.rotorSpinSpeed = 0;
    this.sprite.setScale(1);
    this.sprite.setDepth(21);
    if (this.rotorSprite) this.rotorSprite.setAlpha(1);
    if (this.turretSprite) this.turretSprite.clearTint();

    const angleRad = Phaser.Math.DegToRad(angleDeg);
    this.turretAngleRad = angleRad;
    this.sprite.setPosition(x, y);
    this.sprite.setRotation(angleRad);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
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
    const airOffset = this.spec.isFlying
      ? this.flightLift * 20
      : this.airDuration > 0
        ? Math.sin((1 - Math.max(0, this.airTimer) / this.airDuration) * Math.PI) * 14
        : 0;

    this.shadow.setPosition(x + 3 + airOffset, y + 5 + airOffset);
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

    if (this.turretSprite) {
      this.turretSprite.setPosition(x, y);
      this.turretSprite.setRotation(this.turretAngleRad);
    }

    if (this.rotorSprite) {
      this.rotorSprite.setPosition(x, y);
      this.rotorSprite.setRotation(this.rotorAngle);
      this.rotorSprite.setScale(1 + this.flightLift * 0.24);
      this.rotorSprite.setDepth(this.sprite.depth + 1);
    }
  }

  public destroy(): void {
    this.sparkEmitter.destroy();
    this.nitroEmitter.destroy();
    this.smokeEmitter.destroy();
    this.shadow.destroy();
    this.headlight.destroy();
    if (this.lightbarGlow) {
      this.lightbarGlow.destroy();
    }
    if (this.turretSprite) {
      this.turretSprite.destroy();
    }
    if (this.rotorSprite) {
      this.rotorSprite.destroy();
    }
    this.sprite.destroy();
  }
}
