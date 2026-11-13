import Phaser from 'phaser';
import { PALETTE, WANTED_CONFIG } from '../config/BalanceConfig';
import { CollisionManager } from '../world/CollisionManager';

export type PoliceState = 'PATROL' | 'PURSUE' | 'SEARCH' | 'DISABLED';

export class Police {
  public readonly id: string;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private scene: Phaser.Scene;
  private shadow: Phaser.GameObjects.Ellipse;
  private headlight: Phaser.GameObjects.Image;
  private lightbarGlow: Phaser.GameObjects.Image;
  private smokeEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private patrolLoop: Array<{ x: number; y: number }>;
  private patrolIdx = 0;

  private hp = 160;
  private readonly maxHp = 160;
  private disabledTimer = 0;
  private smokeTimer = 0;

  private state: PoliceState = 'PATROL';
  private lightbarTimer = 0;
  private aiTimer: number;
  private stuckTimer = 0;
  private reverseTimer = 0;
  private reverseTurnDir = 1;
  private ramCooldownTimer = 0;
  private searchOrbitAngle = 0;
  private desiredAngle = 0;
  private currentSpeed = 0;

  constructor(
    scene: Phaser.Scene,
    id: string,
    patrolLoop: Array<{ x: number; y: number }>,
    startIdx = 0
  ) {
    this.scene = scene;
    this.id = id;
    this.patrolLoop = patrolLoop;
    this.patrolIdx = startIdx % patrolLoop.length;
    this.aiTimer = Math.random() * 0.15;

    const start = this.patrolLoop[this.patrolIdx];
    const next = this.patrolLoop[(this.patrolIdx + 1) % this.patrolLoop.length];
    this.desiredAngle = Math.atan2(next.y - start.y, next.x - start.x);

    this.shadow = scene.add.ellipse(start.x + 3, start.y + 4, 50, 28, 0x000000, 0.5);
    this.shadow.setDepth(18);

    this.headlight = scene.add.image(start.x, start.y, 'fx_headlight');
    this.headlight.setOrigin(0, 0.5);
    this.headlight.setBlendMode(Phaser.BlendModes.ADD);
    this.headlight.setAlpha(0.5);
    this.headlight.setDepth(19);

    this.sprite = scene.physics.add.sprite(start.x, start.y, 'veh_cruiser');
    this.sprite.setDepth(21);
    this.sprite.setRotation(this.desiredAngle);
    this.sprite.setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14, (this.sprite.width - 28) / 2, (this.sprite.height - 28) / 2);
    body.setBounce(0.25, 0.25);

    this.lightbarGlow = scene.add.image(start.x, start.y, 'fx_pixel_glow');
    this.lightbarGlow.setTint(PALETTE.NEON_CYAN);
    this.lightbarGlow.setAlpha(0.18);
    this.lightbarGlow.setScale(1.15);
    this.lightbarGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.lightbarGlow.setDepth(22);

    this.smokeEmitter = scene.add.particles(0, 0, 'fx_smoke', {
      speed: { min: 10, max: 35 },
      scale: { start: 1.1, end: 2.3 },
      alpha: { start: 0.55, end: 0 },
      lifespan: 700,
      emitting: false,
    });
    this.smokeEmitter.setDepth(22);

    this.patrolIdx = (this.patrolIdx + 1) % this.patrolLoop.length;
    this.syncAttachments();
  }

  public setState(next: Exclude<PoliceState, 'DISABLED'>): void {
    if (this.state === 'DISABLED') return;
    if (this.state !== next) {
      this.state = next;
      this.stuckTimer = 0;
      if (next === 'SEARCH') {
        this.searchOrbitAngle = Math.random() * Math.PI * 2;
      }
    }
  }

  public getState(): PoliceState {
    return this.state;
  }

  public isDisabled(): boolean {
    return this.state === 'DISABLED';
  }

  public triggerRamRecovery(): void {
    this.ramCooldownTimer = 0.85;
    this.currentSpeed *= 0.45;
  }

  public takeHit(
    damage: number,
    dirX: number,
    dirY: number
  ): { destroyed: boolean; cashBonus: number } {
    if (this.state === 'DISABLED') {
      return { destroyed: false, cashBonus: 0 };
    }

    this.hp = Math.max(0, this.hp - damage);
    this.currentSpeed *= 0.86;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(body.velocity.x + dirX * 55, body.velocity.y + dirY * 55);

    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(60, () => {
      if (!this.sprite.active) return;
      if (this.state === 'DISABLED') {
        this.sprite.setTint(0x475569).setTintMode(Phaser.TintModes.MULTIPLY);
      } else {
        this.sprite.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.state = 'DISABLED';
      this.disabledTimer = 11.0;
      this.currentSpeed = 0;
      body.setVelocity(0, 0);
      this.sprite.setTint(0x475569).setTintMode(Phaser.TintModes.MULTIPLY);
      this.headlight.setAlpha(0);
      this.lightbarGlow.setAlpha(0);
      return { destroyed: true, cashBonus: 120 };
    }

    return { destroyed: false, cashBonus: 0 };
  }

  public update(
    dtSeconds: number,
    playerPos: { x: number; y: number },
    playerInVehicle: boolean,
    lastKnownPos: { x: number; y: number } | null,
    collisionManager: CollisionManager
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.state === 'DISABLED') {
      body.setVelocity(0, 0);
      this.smokeTimer += dtSeconds;
      if (this.smokeTimer >= 0.14) {
        this.smokeTimer = 0;
        this.smokeEmitter.emitParticleAt(this.sprite.x, this.sprite.y, 1);
      }

      this.disabledTimer -= dtSeconds;
      if (this.disabledTimer <= 0) {
        this.resetToPatrol();
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
      targetPos = playerPos;
      targetSpeed = playerInVehicle
        ? WANTED_CONFIG.POLICE_PURSUIT_VEH_SPEED
        : WANTED_CONFIG.POLICE_PURSUIT_FOOT_SPEED;
    } else if (this.state === 'SEARCH') {
      const anchor = lastKnownPos ?? playerPos;
      const distToAnchor = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, anchor.x, anchor.y);
      if (distToAnchor < 95) {
        this.searchOrbitAngle += dtSeconds * 1.15;
        targetPos = {
          x: anchor.x + Math.cos(this.searchOrbitAngle) * 115,
          y: anchor.y + Math.sin(this.searchOrbitAngle) * 115,
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
      this.desiredAngle = this.computeAvoidanceAngle(rawAngle, collisionManager);

      if (this.state !== 'PATROL' && body.speed < 22) {
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

    // Realistic cruiser steering inertia instead of guided-missile snapping
    const angleDiff = Phaser.Math.Angle.Wrap(this.desiredAngle - this.sprite.rotation);
    const turnRate = (this.state === 'PURSUE' ? 2.35 : 2.1) * dtSeconds;
    if (Math.abs(angleDiff) <= turnRate) {
      this.sprite.rotation = this.desiredAngle;
    } else {
      this.sprite.rotation += Math.sign(angleDiff) * turnRate;
    }

    const turnSlowdown = Math.abs(angleDiff) > 0.7 ? 0.48 : 1;
    const goalSpeed = targetSpeed * turnSlowdown;
    this.currentSpeed = Phaser.Math.Linear(this.currentSpeed, goalSpeed, Math.min(1, 3.4 * dtSeconds));

    body.setVelocity(
      Math.cos(this.sprite.rotation) * this.currentSpeed,
      Math.sin(this.sprite.rotation) * this.currentSpeed
    );

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
    this.sprite.clearTint();
    const respawn = this.patrolLoop[this.patrolIdx];
    this.sprite.setPosition(respawn.x, respawn.y);
    body.reset(respawn.x, respawn.y);
    this.headlight.setAlpha(0.45);
    this.syncAttachments();
  }

  public setUnitVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
    this.shadow.setVisible(visible);
    this.headlight.setVisible(visible);
    this.lightbarGlow.setVisible(visible);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = visible;
    if (!visible) {
      this.freeze();
    }
  }

  private computeAvoidanceAngle(rawAngle: number, collisionManager: CollisionManager): number {
    const probeDist = 56;
    const aheadX = this.sprite.x + Math.cos(rawAngle) * probeDist;
    const aheadY = this.sprite.y + Math.sin(rawAngle) * probeDist;

    if (!collisionManager.isPointInsideBuilding(aheadX, aheadY, 16)) {
      return rawAngle;
    }

    const offsets = [0.65, -0.65, 1.25, -1.25, 1.9, -1.9];
    for (const off of offsets) {
      const testAngle = rawAngle + off;
      const tx = this.sprite.x + Math.cos(testAngle) * probeDist;
      const ty = this.sprite.y + Math.sin(testAngle) * probeDist;
      if (!collisionManager.isPointInsideBuilding(tx, ty, 16)) {
        return testAngle;
      }
    }

    return rawAngle + Math.PI * 0.5;
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

    this.shadow.setPosition(x + 3, y + 4);
    this.shadow.setRotation(rot);

    this.headlight.setPosition(x + Math.cos(rot) * 20, y + Math.sin(rot) * 20);
    this.headlight.setRotation(rot);

    this.lightbarGlow.setPosition(x, y);
  }

  public destroy(): void {
    this.smokeEmitter.destroy();
    this.shadow.destroy();
    this.headlight.destroy();
    this.lightbarGlow.destroy();
    this.sprite.destroy();
  }
}
