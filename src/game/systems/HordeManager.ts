import Phaser from 'phaser';
import { ENEMY_SPECS, EnemyKind, PALETTE, WORLD_CONFIG } from '../config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';
import { PickupManager } from './PickupManager';

export interface ActiveHordeEnemy {
  id: string;
  kind: EnemyKind;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  score: number;
  cashDrop: number;
  ranged: boolean;
  isBoss: boolean;
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Image;
  attackCooldown: number;
  shootCooldown: number;
  vx: number;
  vy: number;
}

interface EnemyProjectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  distanceLeft: number;
  damage: number;
}

interface HordeRecordData {
  bestWave: number;
  bestScore: number;
}

const HORDE_STORAGE_KEY = 'neon_district_horde_records_v1';

export class HordeManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;
  private pickupManager: PickupManager;

  private active = false;
  private wave = 0;
  private enemiesToSpawn = 0;
  private spawnTimer = 0;
  private restTimer = 0;
  private kills = 0;
  private combo = 0;
  private comboTimer = 0;
  private score = 0;
  private overdriveTimer = 0;
  private enemySeq = 0;
  private lastEmitAt = 0;

  private enemies: ActiveHordeEnemy[] = [];
  private projectiles: EnemyProjectile[] = [];
  private bestWave = 0;
  private bestScore = 0;

  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    audioManager: AudioManager,
    pickupManager: PickupManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
    this.pickupManager = pickupManager;
    this.loadRecords();
  }

  private loadRecords(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem(HORDE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<HordeRecordData>;
      this.bestWave = typeof parsed.bestWave === 'number' ? parsed.bestWave : 0;
      this.bestScore = typeof parsed.bestScore === 'number' ? parsed.bestScore : 0;
    } catch {
      // Ignore storage read errors
    }
  }

  private saveRecords(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(
        HORDE_STORAGE_KEY,
        JSON.stringify({ bestWave: this.bestWave, bestScore: this.bestScore })
      );
    } catch {
      // Ignore storage write errors
    }
  }

  public start(): void {
    this.clearEntities();
    this.active = true;
    this.wave = 0;
    this.kills = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.score = 0;
    this.overdriveTimer = 0;
    this.restTimer = 0;
    this.startNextWave();
  }

  public stop(): void {
    this.active = false;
    this.wave = 0;
    this.enemiesToSpawn = 0;
    this.restTimer = 0;
    this.overdriveTimer = 0;
    this.clearEntities();
    this.emitTelemetry(true);
  }

  public isActive(): boolean {
    return this.active;
  }

  public isOverdriveActive(): boolean {
    return this.active && this.overdriveTimer > 0;
  }

  public activateOverdrive(durationSec = 8): void {
    this.overdriveTimer = Math.max(this.overdriveTimer, durationSec);
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, `武器过载激活！${durationSec}秒内射速与火力暴涨！`);
    this.emitTelemetry(true);
  }

  public getEnemies(): ActiveHordeEnemy[] {
    return this.enemies;
  }

  private startNextWave(): void {
    this.wave += 1;
    if (this.wave > this.bestWave) {
      this.bestWave = this.wave;
      this.saveRecords();
    }
    this.enemiesToSpawn = Math.min(48, 6 + this.wave * 3);
    this.spawnTimer = 0.25;
    this.restTimer = 0;

    if (this.wave % 5 === 0) {
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `警告！第 ${this.wave} 波 Boss 降临：【铁幕机甲 · 屠戮者】正在逼近！`
      );
    } else {
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `无尽浪潮 · 第 ${this.wave} 波来袭！共有 ${this.enemiesToSpawn} 个目标！`
      );
    }
    this.emitTelemetry(true);
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    onPlayerDamaged: (damage: number) => void,
    onWaveClearHeal: (amount: number) => void
  ): void {
    if (!this.active) return;

    if (this.overdriveTimer > 0) {
      this.overdriveTimer = Math.max(0, this.overdriveTimer - dtSeconds);
    }

    if (this.combo > 0) {
      this.comboTimer -= dtSeconds;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Wave intermission rest countdown
    if (this.restTimer > 0) {
      this.restTimer = Math.max(0, this.restTimer - dtSeconds);
      if (this.restTimer <= 0) {
        this.startNextWave();
      } else {
        this.emitTelemetry(false, nowMs);
      }
      return;
    }

    // Check wave completion
    if (this.enemiesToSpawn <= 0 && this.enemies.length === 0) {
      this.restTimer = 4.2;
      this.audioManager.playMissionComplete();
      onWaveClearHeal(25);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `第 ${this.wave} 波肃清！生命 +25，4秒后开启第 ${this.wave + 1} 波（按 B 打开军械补给）`
      );
      this.emitTelemetry(true, nowMs);
      return;
    }

    // Spawn enemies smoothly up to cap
    const maxConcurrent = Math.min(18, 6 + this.wave * 2);
    if (this.enemiesToSpawn > 0 && this.enemies.length < maxConcurrent) {
      this.spawnTimer -= dtSeconds;
      if (this.spawnTimer <= 0) {
        const shouldSpawnBoss = this.wave % 5 === 0 && this.enemiesToSpawn === 1;
        this.spawnEnemyAroundPlayer(playerPos, shouldSpawnBoss);
        this.enemiesToSpawn -= 1;
        this.spawnTimer = Math.max(0.28, 0.92 - this.wave * 0.04);
      }
    }

    // Update active enemies
    for (const enemy of this.enemies) {
      if (enemy.attackCooldown > 0) enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dtSeconds);
      if (enemy.shootCooldown > 0) enemy.shootCooldown = Math.max(0, enemy.shootCooldown - dtSeconds);

      const dx = playerPos.x - enemy.x;
      const dy = playerPos.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const baseAngle = Math.atan2(dy, dx);

      enemy.sprite.setRotation(baseAngle);

      // Determine desired travel speed (ranged drones hold standoff distance)
      let moveFactor = 1;
      if (enemy.kind === 'drone' && dist < 210) {
        moveFactor = dist < 140 ? -0.45 : 0.15;
      } else if (enemy.isBoss && dist < 190) {
        moveFactor = 0.25;
      }

      const stepDist = enemy.speed * Math.abs(moveFactor) * dtSeconds;
      const desiredAngle = moveFactor >= 0 ? baseAngle : baseAngle + Math.PI;
      const offsets = [0, 0.55, -0.55, 1.1, -1.1, 1.6, -1.6];

      for (const offset of offsets) {
        const tryAngle = desiredAngle + offset;
        const nx = enemy.x + Math.cos(tryAngle) * stepDist;
        const ny = enemy.y + Math.sin(tryAngle) * stepDist;
        if (this.collisionManager.isPointClearForEntity(nx, ny, enemy.radius)) {
          enemy.x = nx;
          enemy.y = ny;
          break;
        }
      }

      enemy.sprite.setPosition(enemy.x, enemy.y);
      enemy.glow.setPosition(enemy.x, enemy.y);

      // Melee contact damage
      if (dist <= enemy.radius + 14 && enemy.attackCooldown <= 0) {
        enemy.attackCooldown = 0.85;
        onPlayerDamaged(enemy.damage);
      }

      // Ranged drone & boss fire plasma bolts
      if (enemy.ranged && dist <= 440 && enemy.shootCooldown <= 0) {
        if (this.collisionManager.hasLineOfSight(enemy.x, enemy.y, playerPos.x, playerPos.y)) {
          enemy.shootCooldown = enemy.isBoss ? 1.35 : 2.1;
          this.fireEnemyProjectile(enemy, baseAngle);
        }
      }
    }

    // Update enemy projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const sx = p.vx * dtSeconds;
      const sy = p.vy * dtSeconds;
      p.sprite.x += sx;
      p.sprite.y += sy;
      p.distanceLeft -= Math.hypot(sx, sy);

      let remove = p.distanceLeft <= 0;
      if (!remove && this.collisionManager.isPointBlockedByWall(p.sprite.x, p.sprite.y)) {
        remove = true;
      }
      if (!remove) {
        const distPlayer = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, playerPos.x, playerPos.y);
        if (distPlayer <= 16) {
          onPlayerDamaged(p.damage);
          remove = true;
        }
      }

      if (remove) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    this.emitTelemetry(false, nowMs);
  }

  private fireEnemyProjectile(enemy: ActiveHordeEnemy, angle: number): void {
    const speed = enemy.isBoss ? 305 : 245;
    const count = enemy.isBoss ? 3 : 1;

    for (let i = 0; i < count; i++) {
      const spread = count === 1 ? 0 : (i - 1) * 0.22;
      const a = angle + spread;
      const sprite = this.scene.add.image(enemy.x, enemy.y, 'proj_enemy');
      sprite.setDepth(23);
      sprite.setRotation(a);
      this.projectiles.push({
        sprite,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        distanceLeft: 480,
        damage: enemy.isBoss ? 14 : enemy.damage,
      });
    }
  }

  private spawnEnemyAroundPlayer(playerPos: { x: number; y: number }, forceBoss: boolean): void {
    let kind: EnemyKind = 'raider';
    if (forceBoss) {
      kind = 'boss';
    } else {
      const roll = Math.random();
      if (this.wave >= 3 && roll > 0.78) {
        kind = 'brute';
      } else if (this.wave >= 2 && roll > 0.48) {
        kind = 'drone';
      }
    }

    const spec = ENEMY_SPECS[kind];
    let spawnX = 800;
    let spawnY = 320;
    let found = false;

    for (let attempt = 0; attempt < 18; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 360 + Math.random() * 230;
      const cx = Phaser.Math.Clamp(playerPos.x + Math.cos(angle) * dist, 48, WORLD_CONFIG.WIDTH - 48);
      const cy = Phaser.Math.Clamp(playerPos.y + Math.sin(angle) * dist, 48, WORLD_CONFIG.HEIGHT - 48);
      if (this.collisionManager.isPointClearForEntity(cx, cy, spec.radius + 4)) {
        spawnX = cx;
        spawnY = cy;
        found = true;
        break;
      }
    }

    if (!found) {
      const fallback = [
        { x: 352, y: 320 },
        { x: 1248, y: 320 },
        { x: 1248, y: 896 },
        { x: 352, y: 896 },
      ];
      const pick = fallback[Math.floor(Math.random() * fallback.length)];
      spawnX = pick.x;
      spawnY = pick.y;
    }

    this.enemySeq += 1;
    const hpMult = kind === 'boss' ? 1 + Math.max(0, Math.floor(this.wave / 5) - 1) * 0.42 : 1 + (this.wave - 1) * 0.14;
    const speedMult = 1 + Math.min(0.45, (this.wave - 1) * 0.045);
    const maxHp = Math.round(spec.hp * hpMult);

    const glow = this.scene.add.image(spawnX, spawnY, 'fx_pixel_glow');
    glow.setTint(kind === 'boss' ? PALETTE.GOLD : kind === 'drone' ? PALETTE.NEON_PURPLE : PALETTE.WARNING_RED);
    glow.setAlpha(kind === 'boss' ? 0.45 : 0.25);
    glow.setScale(kind === 'boss' ? 1.5 : 0.85);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(18);

    const sprite = this.scene.add.sprite(spawnX, spawnY, spec.textureKey);
    sprite.setDepth(21);

    this.enemies.push({
      id: `horde-${this.enemySeq}`,
      kind,
      name: spec.name,
      x: spawnX,
      y: spawnY,
      hp: maxHp,
      maxHp,
      speed: spec.speed * speedMult,
      damage: spec.damage,
      radius: spec.radius,
      score: spec.score,
      cashDrop: spec.cashDrop,
      ranged: spec.ranged,
      isBoss: kind === 'boss',
      sprite,
      glow,
      attackCooldown: 0.4,
      shootCooldown: 1.2 + Math.random() * 0.8,
      vx: 0,
      vy: 0,
    });
  }

  public damageEnemy(
    enemy: ActiveHordeEnemy,
    damage: number,
    dirX: number,
    dirY: number,
    isHeavy: boolean
  ): { killed: boolean; cashDrop: number; scoreGained: number } {
    enemy.hp -= damage;

    // Knockback
    const kb = enemy.isBoss ? 4 : isHeavy ? 18 : 10;
    const kx = enemy.x + dirX * kb;
    const ky = enemy.y + dirY * kb;
    if (this.collisionManager.isPointClearForEntity(kx, ky, enemy.radius)) {
      enemy.x = kx;
      enemy.y = ky;
      enemy.sprite.setPosition(kx, ky);
      enemy.glow.setPosition(kx, ky);
    }

    if (enemy.hp > 0) {
      enemy.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(65, () => {
        if (enemy.sprite.active) enemy.sprite.clearTint();
      });
      return { killed: false, cashDrop: 0, scoreGained: 0 };
    }

    // Killed!
    this.kills += 1;
    this.combo += 1;
    this.comboTimer = 4.5;
    const comboMult = 1 + Math.min(4, Math.floor(this.combo / 4)) * 0.25;
    const scoreGained = Math.round(enemy.score * comboMult);
    this.score += scoreGained;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveRecords();
    }

    // Spawn loot drop
    if (enemy.isBoss) {
      this.pickupManager.spawnDrop(enemy.x, enemy.y, 'overdrive', 8);
      this.pickupManager.spawnDrop(enemy.x + 18, enemy.y, 'medkit', 50);
    } else {
      const roll = Math.random();
      if (roll < 0.08) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'overdrive', 8);
      } else if (roll < 0.24) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'medkit', 30);
      } else if (roll < 0.42) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'ammo', 40);
      } else if (roll < 0.7) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'cash', enemy.cashDrop);
      }
    }

    enemy.sprite.destroy();
    enemy.glow.destroy();
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.emitTelemetry(true);
    return { killed: true, cashDrop: enemy.cashDrop, scoreGained };
  }

  public freezeAll(): void {
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 140) return;
    this.lastEmitAt = nowMs;

    const boss = this.enemies.find((e) => e.isBoss);
    gameEvents.emit(GAME_EVENT.HORDE_UPDATED, {
      active: this.active,
      wave: this.wave,
      enemiesRemaining: this.enemiesToSpawn + this.enemies.length,
      kills: this.kills,
      combo: this.combo,
      score: this.score,
      overdriveSec: Math.ceil(this.overdriveTimer),
      restSec: Math.ceil(this.restTimer),
      bossName: boss ? boss.name : null,
      bossHp: boss ? Math.max(0, boss.hp) : 0,
      bossMaxHp: boss ? boss.maxHp : 0,
      bestWave: this.bestWave,
      bestScore: this.bestScore,
      enemyMarkers: this.enemies.map((e) => ({
        x: Math.round(e.x),
        y: Math.round(e.y),
        isBoss: e.isBoss,
      })),
    });
  }

  private clearEntities(): void {
    for (const e of this.enemies) {
      e.sprite.destroy();
      e.glow.destroy();
    }
    this.enemies = [];
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];
  }

  public destroy(): void {
    this.clearEntities();
  }
}
