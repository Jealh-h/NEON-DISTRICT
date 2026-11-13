import Phaser from 'phaser';
import { NPC_CONFIG, PALETTE } from '../config/BalanceConfig';

export type NpcState = 'WALKING' | 'IDLE' | 'PANICKING' | 'CHATTING' | 'KO';

export interface NpcProfile {
  id: string;
  name: string;
  role: string;
  variant: 0 | 1 | 2;
  waypoints: Array<{ x: number; y: number }>;
  dialogues: string[];
}

export class NPC {
  public readonly id: string;
  public readonly name: string;
  public readonly role: string;
  public readonly sprite: Phaser.Physics.Arcade.Sprite;

  private scene: Phaser.Scene;
  private shadow: Phaser.GameObjects.Ellipse;
  private alertMark: Phaser.GameObjects.Text;
  private variant: 0 | 1 | 2;
  private waypoints: Array<{ x: number; y: number }>;
  private dialogues: string[];
  private waypointIndex = 0;
  private dialogueIndex = 0;

  private hp = 60;
  private readonly maxHp = 60;
  private knockbackTimer = 0;
  private knockVel = { x: 0, y: 0 };

  private state: NpcState = 'WALKING';
  private stateTimer = 0;
  private aiTimer: number;
  private animTimer = 0;
  private walkToggle = false;
  private moveDir = { x: 0, y: 0 };
  private panicDir = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, profile: NpcProfile) {
    this.scene = scene;
    this.id = profile.id;
    this.name = profile.name;
    this.role = profile.role;
    this.variant = profile.variant;
    this.waypoints = profile.waypoints;
    this.dialogues = profile.dialogues;

    this.aiTimer = Math.random() * NPC_CONFIG.AI_TICK_INTERVAL;

    const start = profile.waypoints[0];
    this.waypointIndex = profile.waypoints.length > 1 ? 1 : 0;

    this.shadow = scene.add.ellipse(start.x, start.y + 3, 16, 11, 0x000000, 0.36);
    this.shadow.setDepth(17);

    this.sprite = scene.physics.add.sprite(start.x, start.y, `npc_${this.variant}_idle`);
    this.sprite.setDepth(19);
    this.sprite.setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(NPC_CONFIG.BODY_SIZE, NPC_CONFIG.BODY_SIZE, true);
    body.setBounce(0.2, 0.2);

    this.alertMark = scene.add.text(start.x, start.y - 18, '!', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: PALETTE.WARNING_RED_HEX,
      backgroundColor: '#080D18',
      padding: { x: 3, y: 0 },
    });
    this.alertMark.setOrigin(0.5);
    this.alertMark.setDepth(24);
    this.alertMark.setVisible(false);
  }

  public update(dtSeconds: number): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.aiTimer += dtSeconds;

    if (this.state === 'KO') {
      body.setVelocity(0, 0);
      this.stateTimer -= dtSeconds;
      if (this.stateTimer <= 0) {
        this.hp = this.maxHp;
        this.state = 'WALKING';
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        this.sprite.setScale(1, 1);
        body.enable = true;
      }
      this.syncAttachments();
      return;
    }

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dtSeconds;
      body.setVelocity(this.knockVel.x, this.knockVel.y);
      this.knockVel.x *= 0.85;
      this.knockVel.y *= 0.85;
      this.syncAttachments();
      return;
    }

    if (this.state === 'PANICKING') {
      this.stateTimer -= dtSeconds;
      if (this.stateTimer <= 0) {
        this.state = 'WALKING';
        this.alertMark.setVisible(false);
      } else {
        if (this.aiTimer >= NPC_CONFIG.AI_TICK_INTERVAL) {
          this.aiTimer = 0;
          if (!body.blocked.none) {
            const angle = Math.atan2(this.panicDir.y, this.panicDir.x) + Math.PI * 0.65;
            this.panicDir = { x: Math.cos(angle), y: Math.sin(angle) };
          }
        }
        body.setVelocity(
          this.panicDir.x * NPC_CONFIG.PANIC_SPEED,
          this.panicDir.y * NPC_CONFIG.PANIC_SPEED
        );
        this.sprite.setRotation(Math.atan2(this.panicDir.y, this.panicDir.x));
        this.animateWalk(dtSeconds, 0.09);
        this.syncAttachments();
        return;
      }
    }

    if (this.state === 'CHATTING' || this.state === 'IDLE') {
      body.setVelocity(0, 0);
      this.sprite.setTexture(`npc_${this.variant}_idle`);
      this.stateTimer -= dtSeconds;
      if (this.stateTimer <= 0) {
        this.state = 'WALKING';
      }
      this.syncAttachments();
      return;
    }

    if (this.aiTimer >= NPC_CONFIG.AI_TICK_INTERVAL) {
      this.aiTimer = 0;
      const target = this.waypoints[this.waypointIndex];
      const dx = target.x - this.sprite.x;
      const dy = target.y - this.sprite.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 18) {
        this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
        if (Math.random() < 0.35) {
          this.state = 'IDLE';
          this.stateTimer = 1.0 + Math.random() * 1.6;
          body.setVelocity(0, 0);
          this.syncAttachments();
          return;
        }
      } else if (!body.blocked.none) {
        const baseAngle = Math.atan2(dy, dx) + (Math.random() < 0.5 ? 0.9 : -0.9);
        this.moveDir = { x: Math.cos(baseAngle), y: Math.sin(baseAngle) };
      } else {
        this.moveDir = { x: dx / dist, y: dy / dist };
      }
    }

    body.setVelocity(
      this.moveDir.x * NPC_CONFIG.WALK_SPEED,
      this.moveDir.y * NPC_CONFIG.WALK_SPEED
    );
    if (Math.abs(this.moveDir.x) > 0.05 || Math.abs(this.moveDir.y) > 0.05) {
      this.sprite.setRotation(Math.atan2(this.moveDir.y, this.moveDir.x));
      this.animateWalk(dtSeconds, 0.17);
    }

    this.syncAttachments();
  }

  public takeHit(
    damage: number,
    dirX: number,
    dirY: number,
    knockStrength = 210
  ): { killed: boolean; cashDrop: number } {
    if (this.state === 'KO') {
      return { killed: false, cashDrop: 0 };
    }

    this.hp = Math.max(0, this.hp - damage);
    this.knockVel = { x: dirX * knockStrength, y: dirY * knockStrength };
    this.knockbackTimer = 0.14;

    // Crisp hit flash & squash-stretch recoil
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.sprite.setScale(1.24, 0.8);
    this.scene.time.delayedCall(65, () => {
      if (!this.sprite.active) return;
      if (this.state === 'KO') {
        this.sprite.setTint(0x64748b).setTintMode(Phaser.TintModes.MULTIPLY);
      } else {
        this.sprite.clearTint();
      }
      this.sprite.setScale(1, 1);
    });

    if (this.hp <= 0) {
      this.state = 'KO';
      this.stateTimer = 11.0;
      this.alertMark.setVisible(false);
      this.sprite.setAlpha(0.5);
      this.sprite.setTint(0x64748b).setTintMode(Phaser.TintModes.MULTIPLY);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.enable = false;
      return { killed: true, cashDrop: 25 };
    }

    this.panicDir = { x: dirX, y: dirY };
    this.state = 'PANICKING';
    this.stateTimer = NPC_CONFIG.PANIC_DURATION;
    this.alertMark.setText('!');
    this.alertMark.setVisible(true);
    return { killed: false, cashDrop: 0 };
  }

  public isIncapacitated(): boolean {
    return this.state === 'KO';
  }

  public triggerPanic(dangerX: number, dangerY: number): void {
    if (this.state === 'KO') return;
    const dx = this.sprite.x - dangerX;
    const dy = this.sprite.y - dangerY;
    const dist = Math.hypot(dx, dy) || 1;
    this.panicDir = { x: dx / dist, y: dy / dist };
    this.state = 'PANICKING';
    this.stateTimer = NPC_CONFIG.PANIC_DURATION;
    this.alertMark.setText('!');
    this.alertMark.setVisible(true);
  }

  public interact(playerX: number, playerY: number): string {
    const angle = Math.atan2(playerY - this.sprite.y, playerX - this.sprite.x);
    this.sprite.setRotation(angle);
    this.state = 'CHATTING';
    this.stateTimer = 2.2;

    const line = this.dialogues[this.dialogueIndex % this.dialogues.length];
    this.dialogueIndex += 1;
    return `${this.name}（${this.role}）：「${line}」`;
  }

  public freeze(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.sprite.setTexture(`npc_${this.variant}_idle`);
  }

  private animateWalk(dtSeconds: number, interval: number): void {
    this.animTimer += dtSeconds;
    if (this.animTimer >= interval) {
      this.animTimer = 0;
      this.walkToggle = !this.walkToggle;
      this.sprite.setTexture(`npc_${this.variant}_${this.walkToggle ? 'walk' : 'idle'}`);
    }
  }

  private syncAttachments(): void {
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 3);
    if (this.alertMark.visible) {
      this.alertMark.setPosition(this.sprite.x, this.sprite.y - 18);
    }
  }

  public destroy(): void {
    this.alertMark.destroy();
    this.shadow.destroy();
    this.sprite.destroy();
  }
}
