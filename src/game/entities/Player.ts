import Phaser from 'phaser';
import { PALETTE, PLAYER_CONFIG, WEAPON_SPECS, WeaponId } from '../config/BalanceConfig';
import { MovementVector } from '../systems/InputManager';

const WALK_SEQUENCE = ['player_walk_1', 'player_walk_3', 'player_walk_2', 'player_walk_3'] as const;

export class Player {
  public readonly sprite: Phaser.Physics.Arcade.Sprite;
  private shadow: Phaser.GameObjects.Ellipse;
  private weaponBarrel: Phaser.GameObjects.Rectangle;
  private scene: Phaser.Scene;
  private facingAngle = -Math.PI / 2;
  private walkTimer = 0;
  private stepIndex = 0;
  private idleTimer = 0;
  private inVehicle = false;
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private lastBumpFlashAt = 0;
  private recoilOffset = 0;
  private activeWeaponId: WeaponId = 'pistol';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    this.shadow = scene.add.ellipse(x, y + 4, 20, 14, 0x000000, 0.42);
    this.shadow.setDepth(18);

    this.sprite = scene.physics.add.sprite(x, y, 'player_idle');
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_CONFIG.BODY_WIDTH, PLAYER_CONFIG.BODY_HEIGHT, true);
    body.setMaxVelocity(PLAYER_CONFIG.WALK_SPEED, PLAYER_CONFIG.WALK_SPEED);

    this.sprite.setRotation(this.facingAngle);

    // Compact pixel weapon barrel rendered at right-hand side of player
    this.weaponBarrel = scene.add.rectangle(x, y, 10, 3, PALETTE.NEON_CYAN, 1);
    this.weaponBarrel.setStrokeStyle(1, 0x080d18, 1);
    this.weaponBarrel.setDepth(21);

    this.dustEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 10, max: 32 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 240,
      tint: [PALETTE.NEON_CYAN, PALETTE.NEON_PURPLE],
      emitting: false,
    });
    this.dustEmitter.setDepth(17);
    this.syncWeaponBarrel();
  }

  public setWeaponVisual(weaponId: WeaponId): void {
    this.activeWeaponId = weaponId;
    const spec = WEAPON_SPECS[weaponId];
    this.weaponBarrel.setSize(spec.barrelLength, spec.barrelWidth);
    this.weaponBarrel.setFillStyle(spec.colorNum, 1);
    this.syncWeaponBarrel();
  }

  public applyRecoilKick(amountPx: number): void {
    this.recoilOffset = Math.min(7, amountPx);
    this.syncWeaponBarrel();
  }

  public update(
    dtSeconds: number,
    moveVec: MovementVector,
    isMovingCallback?: () => void,
    aimOverrideRad?: number
  ): boolean {
    if (this.inVehicle) return false;

    const isMoving = Math.abs(moveVec.x) > 0.05 || Math.abs(moveVec.y) > 0.05;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dtSeconds * 36);
    }

    if (isMoving) {
      const vx = moveVec.x * PLAYER_CONFIG.WALK_SPEED;
      const vy = moveVec.y * PLAYER_CONFIG.WALK_SPEED;
      body.setVelocity(vx, vy);

      this.facingAngle = aimOverrideRad !== undefined ? aimOverrideRad : Math.atan2(moveVec.y, moveVec.x);
      this.sprite.setRotation(this.facingAngle);

      this.walkTimer += dtSeconds;
      if (this.walkTimer >= 0.095) {
        this.walkTimer = 0;
        this.stepIndex = (this.stepIndex + 1) % WALK_SEQUENCE.length;
        this.sprite.setTexture(WALK_SEQUENCE[this.stepIndex]);
        if (this.stepIndex === 0 || this.stepIndex === 2) {
          this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y + 4, 1);
        }
      }

      const stridePulse = 1 + Math.sin(this.stepIndex * Math.PI * 0.5) * 0.04;
      this.sprite.setScale(stridePulse, 1 / stridePulse);

      if (isMovingCallback) {
        isMovingCallback();
      }
    } else {
      body.setVelocity(0, 0);
      this.walkTimer = 0;
      this.idleTimer += dtSeconds;
      if (aimOverrideRad !== undefined) {
        this.facingAngle = aimOverrideRad;
        this.sprite.setRotation(this.facingAngle);
      }
      const breath = 1 + Math.sin(this.idleTimer * 3.0) * 0.025;
      this.sprite.setScale(breath, breath);
      if (this.sprite.texture.key !== 'player_idle') {
        this.sprite.setTexture('player_idle');
      }
    }

    this.shadow.setPosition(this.sprite.x, this.sprite.y + 4);
    this.syncWeaponBarrel();
    return isMoving;
  }

  public getMuzzlePosition(): { x: number; y: number } {
    const spec = WEAPON_SPECS[this.activeWeaponId];
    const barrelReach = spec.barrelLength + 7;
    const rightSide = 4;
    const cos = Math.cos(this.facingAngle);
    const sin = Math.sin(this.facingAngle);
    return {
      x: this.sprite.x + cos * barrelReach - sin * rightSide,
      y: this.sprite.y + sin * barrelReach + cos * rightSide,
    };
  }

  private syncWeaponBarrel(): void {
    const cos = Math.cos(this.facingAngle);
    const sin = Math.sin(this.facingAngle);
    const forward = 11 - this.recoilOffset;
    const rightSide = 4;
    this.weaponBarrel.setPosition(
      this.sprite.x + cos * forward - sin * rightSide,
      this.sprite.y + sin * forward + cos * rightSide
    );
    this.weaponBarrel.setRotation(this.facingAngle);
  }

  public setInVehicle(occupied: boolean, spawnPos?: { x: number; y: number }): void {
    this.inVehicle = occupied;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (occupied) {
      body.setVelocity(0, 0);
      body.enable = false;
      this.sprite.setVisible(false);
      this.shadow.setVisible(false);
      this.weaponBarrel.setVisible(false);
    } else {
      if (spawnPos) {
        this.sprite.setPosition(spawnPos.x, spawnPos.y);
        this.shadow.setPosition(spawnPos.x, spawnPos.y + 4);
        body.reset(spawnPos.x, spawnPos.y);
      }
      body.enable = true;
      this.sprite.setVisible(true);
      this.shadow.setVisible(true);
      this.weaponBarrel.setVisible(true);
      this.sprite.setTexture('player_idle');
      this.sprite.setScale(0.75);
      this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1,
        scaleY: 1,
        duration: 140,
        ease: 'Back.easeOut',
      });
      this.syncWeaponBarrel();
    }
  }

  public isInVehicle(): boolean {
    return this.inVehicle;
  }

  public freeze(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.sprite.setTexture('player_idle');
    this.sprite.setScale(1, 1);
    this.syncWeaponBarrel();
  }

  public resetPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.shadow.setPosition(x, y + 4);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    this.syncWeaponBarrel();
  }

  public triggerBumpFeedback(nowMs: number): void {
    if (this.inVehicle) return;
    if (nowMs - this.lastBumpFlashAt < 340) return;
    this.lastBumpFlashAt = nowMs;

    this.sprite.setTint(PALETTE.NEON_PINK);
    this.scene.time.delayedCall(90, () => {
      if (this.sprite.active) {
        this.sprite.clearTint();
      }
    });
    this.dustEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 4);
  }

  public getPosition(): { x: number; y: number } {
    return { x: Math.round(this.sprite.x), y: Math.round(this.sprite.y) };
  }

  public getFacingRadians(): number {
    return this.facingAngle;
  }

  public getFacingDegrees(): number {
    return Math.round(Phaser.Math.RadToDeg(this.facingAngle));
  }

  public destroy(): void {
    this.dustEmitter.destroy();
    this.weaponBarrel.destroy();
    this.shadow.destroy();
    this.sprite.destroy();
  }
}
