import Phaser from 'phaser';
import {
  ENEMY_SPECS,
  EnemyKind,
  HORDE_GEAR_COSTS,
  MECH_SPECS,
  MechKind,
  PALETTE,
  WORLD_CONFIG,
} from '../config/BalanceConfig';
import { HORDE_ROGUELITE_PERKS } from '../config/ExpansionConfig';
import { Player } from '../entities/Player';
import {
  ActiveHordePerkSummary,
  GAME_EVENT,
  gameEvents,
  HordePerkChoice,
  MechTelemetryPayload,
} from '../ui/GameEvents';
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
  ramCooldown: number;
  vx: number;
  vy: number;
}

const groundDepth = (y: number) => 19 + Math.min(8.4, Math.max(0, y) * 0.0022);

interface EnemyProjectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  distanceLeft: number;
  damage: number;
}

interface ActiveMechState {
  kind: MechKind;
  hp: number;
  maxHp: number;
  abilityCooldownSec: number;
  stompCooldownSec: number;
}

interface ActiveSentryTurret {
  base: Phaser.GameObjects.Image;
  gun: Phaser.GameObjects.Image;
  x: number;
  y: number;
  ttlSec: number;
  fireCooldownSec: number;
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
  private activeMech: ActiveMechState | null = null;
  private turrets: ActiveSentryTurret[] = [];
  private perks: Record<string, number> = {};
  private awaitingPerkChoice = false;
  private regenAccumulator = 0;
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
    this.activeMech = null;
    this.perks = {};
    this.awaitingPerkChoice = false;
    this.regenAccumulator = 0;
    gameEvents.emit(GAME_EVENT.HORDE_PERK_OFFER, null);
    this.startNextWave();
  }

  public stop(player?: Player): void {
    this.active = false;
    this.wave = 0;
    this.enemiesToSpawn = 0;
    this.restTimer = 0;
    this.overdriveTimer = 0;
    this.activeMech = null;
    this.perks = {};
    this.awaitingPerkChoice = false;
    this.regenAccumulator = 0;
    gameEvents.emit(GAME_EVENT.HORDE_PERK_OFFER, null);
    if (player) {
      player.setMechForm(null);
    }
    this.clearEntities();
    this.emitTelemetry(true);
  }

  public getPerkStacks(perkId: string): number {
    return this.perks[perkId] ?? 0;
  }

  public getDamageMultiplier(playerHpRatio = 1): number {
    const overload = this.getPerkStacks('overload_ammo') * 0.22;
    const berserk = playerHpRatio <= 0.55 ? this.getPerkStacks('cyber_berserk') * 0.42 : 0;
    return 1 + overload + berserk;
  }

  public getFireRateMultiplier(): number {
    return 1 + this.getPerkStacks('rapid_cycling') * 0.14;
  }

  public getBonusPierce(): number {
    return this.getPerkStacks('quantum_pierce');
  }

  public getProjectileSpeedMultiplier(): number {
    return 1 + this.getPerkStacks('quantum_pierce') * 0.15;
  }

  public getDamageReduction(): number {
    return Math.min(0.6, this.getPerkStacks('tactical_plate') * 0.14);
  }

  public getArcChainStacks(): number {
    return this.getPerkStacks('arc_chain');
  }

  public getVampiricStacks(): number {
    return this.getPerkStacks('vampiric_core');
  }

  public getMechAndTurretPowerMultiplier(): number {
    return 1 + this.getPerkStacks('mech_overclock') * 0.3;
  }

  public getCashDropMultiplier(): number {
    return 1 + this.getPerkStacks('bounty_multiplier') * 0.35;
  }

  public selectPerk(
    perkId: string,
    callbacks?: { onArmorBonus?: (amt: number) => void; onCashBonus?: (amt: number) => void }
  ): void {
    if (!this.active || !this.awaitingPerkChoice) return;
    const spec = HORDE_ROGUELITE_PERKS.find((p) => p.id === perkId);
    if (spec) {
      const prev = this.perks[perkId] ?? 0;
      this.perks[perkId] = Math.min(spec.maxStacks, prev + 1);
      this.audioManager.playPurchase();

      if (perkId === 'tactical_plate') {
        callbacks?.onArmorBonus?.(45);
      } else if (perkId === 'bounty_multiplier') {
        callbacks?.onCashBonus?.(260);
      }

      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `已装配波次强化【${spec.name} Lv.${this.perks[perkId]}】· ${spec.description}`
      );
    }
    this.awaitingPerkChoice = false;
    gameEvents.emit(GAME_EVENT.HORDE_PERK_OFFER, null);
    this.restTimer = 2.6;
    this.emitTelemetry(true);
  }

  private offerRoguelitePerks(): void {
    const available = HORDE_ROGUELITE_PERKS.filter(
      (p) => (this.perks[p.id] ?? 0) < p.maxStacks
    );
    if (available.length === 0) return;

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const choices: HordePerkChoice[] = shuffled.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      accentColor: p.accentColor,
      currentStacks: this.perks[p.id] ?? 0,
      maxStacks: p.maxStacks,
    }));

    this.awaitingPerkChoice = true;
    gameEvents.emit(GAME_EVENT.HORDE_PERK_OFFER, {
      waveCleared: this.wave,
      choices,
    });
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

  public isMechActive(): boolean {
    return this.active && this.activeMech !== null;
  }

  public getMechKind(): MechKind | null {
    return this.activeMech?.kind ?? null;
  }

  public canUseMechAbility(): boolean {
    return Boolean(this.activeMech && this.activeMech.abilityCooldownSec <= 0);
  }

  public markMechAbilityUsed(): void {
    if (!this.activeMech) return;
    const baseCd = MECH_SPECS[this.activeMech.kind].abilityCooldownSec;
    const cdScale = Math.max(0.4, 1 - this.getPerkStacks('mech_overclock') * 0.2);
    this.activeMech.abilityCooldownSec = Number((baseCd * cdScale).toFixed(1));
    this.emitTelemetry(true);
  }

  public deployMech(kind: MechKind, player: Player, onCashBonus?: (cash: number) => void): void {
    if (!this.active) return;
    const spec = MECH_SPECS[kind];
    this.activeMech = {
      kind,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      abilityCooldownSec: 0,
      stompCooldownSec: 0,
    };
    player.setMechForm(kind);

    // Deployment impact shockwave clears immediate crowd
    const pos = player.getPosition();
    const ring = this.scene.add.circle(pos.x, pos.y, 16, PALETTE.NEON_CYAN, 0.25);
    ring.setStrokeStyle(3, kind === 'titan' ? PALETTE.GOLD : PALETTE.NEON_CYAN, 0.95);
    ring.setDepth(26);
    this.scene.tweens.add({
      targets: ring,
      radius: 170,
      alpha: 0,
      duration: 320,
      onComplete: () => ring.destroy(),
    });
    this.audioManager.playOrbitalStrike();
    this.scene.cameras.main.shake(180, 0.008);

    for (const enemy of [...this.enemies]) {
      const dist = Phaser.Math.Distance.Between(pos.x, pos.y, enemy.x, enemy.y);
      if (dist <= 165) {
        const ang = Math.atan2(enemy.y - pos.y, enemy.x - pos.x);
        const res = this.damageEnemy(enemy, 110, Math.cos(ang), Math.sin(ang), true);
        if (res.killed) onCashBonus?.(res.cashDrop);
      }
    }

    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `【${spec.name}】空降部署完成！按 [空格] 释放「${spec.abilityLabel}」！`
    );
    this.emitTelemetry(true);
  }

  public absorbDamageByMech(damage: number, player: Player, onCashBonus?: (cash: number) => void): boolean {
    if (!this.activeMech) return false;
    this.activeMech.hp = Math.max(0, this.activeMech.hp - damage);

    if (this.activeMech.hp <= 0) {
      const pos = player.getPosition();
      this.activeMech = null;
      player.setMechForm(null);

      // Safe emergency eject pulse
      const shock = this.scene.add.circle(pos.x, pos.y, 14, PALETTE.GOLD, 0.3);
      shock.setStrokeStyle(3, PALETTE.WARNING_RED, 0.95);
      shock.setDepth(26);
      this.scene.tweens.add({
        targets: shock,
        radius: 180,
        alpha: 0,
        duration: 300,
        onComplete: () => shock.destroy(),
      });
      this.audioManager.playExplosion();
      this.scene.cameras.main.shake(220, 0.01);

      for (const enemy of [...this.enemies]) {
        const dist = Phaser.Math.Distance.Between(pos.x, pos.y, enemy.x, enemy.y);
        if (dist <= 175) {
          const ang = Math.atan2(enemy.y - pos.y, enemy.x - pos.x);
          const res = this.damageEnemy(enemy, 95, Math.cos(ang), Math.sin(ang), true);
          if (res.killed) onCashBonus?.(res.cashDrop);
        }
      }

      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '机甲护盾归零，已紧急弹射并震退周围敌军！');
    }

    this.emitTelemetry(true);
    return true;
  }

  public deploySentryTurret(x: number, y: number): boolean {
    if (!this.active) return false;
    if (this.turrets.length >= HORDE_GEAR_COSTS.MAX_TURRETS) {
      return false;
    }
    const base = this.scene.add.image(x, y, 'prop_turret').setDepth(groundDepth(y) - 0.1);
    const gun = this.scene.add.image(x, y, 'prop_turret_gun').setDepth(groundDepth(y));
    this.turrets.push({
      base,
      gun,
      x,
      y,
      ttlSec: HORDE_GEAR_COSTS.TURRET_DURATION_SEC,
      fireCooldownSec: 0.2,
    });
    this.audioManager.playPurchase();
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `已部署自动激光哨戒炮（${this.turrets.length}/${HORDE_GEAR_COSTS.MAX_TURRETS}），持续 ${HORDE_GEAR_COSTS.TURRET_DURATION_SEC} 秒！`
    );
    this.emitTelemetry(true);
    return true;
  }

  public getTurretCount(): number {
    return this.turrets.length;
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
    onWaveClearHeal: (amount: number) => void,
    onTurretShoot?: (sx: number, sy: number, angleRad: number) => void,
    onMechStompKilled?: (cash: number) => void
  ): void {
    if (!this.active) return;

    if (this.overdriveTimer > 0) {
      this.overdriveTimer = Math.max(0, this.overdriveTimer - dtSeconds);
    }

    if (this.activeMech) {
      if (this.activeMech.abilityCooldownSec > 0) {
        this.activeMech.abilityCooldownSec = Math.max(0, this.activeMech.abilityCooldownSec - dtSeconds);
      }
      if (this.activeMech.stompCooldownSec > 0) {
        this.activeMech.stompCooldownSec = Math.max(0, this.activeMech.stompCooldownSec - dtSeconds);
      }
    }

    if (this.combo > 0) {
      this.comboTimer -= dtSeconds;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // Update Auto-Sentry Turrets
    for (let i = this.turrets.length - 1; i >= 0; i--) {
      const t = this.turrets[i];
      t.ttlSec -= dtSeconds;
      if (t.ttlSec <= 0) {
        t.base.destroy();
        t.gun.destroy();
        this.turrets.splice(i, 1);
        this.emitTelemetry(true);
        continue;
      }
      t.fireCooldownSec -= dtSeconds;
      if (this.enemies.length > 0) {
        let nearest: ActiveHordeEnemy | null = null;
        let bestD: number = HORDE_GEAR_COSTS.TURRET_RANGE;
        for (const e of this.enemies) {
          const d = Phaser.Math.Distance.Between(t.x, t.y, e.x, e.y);
          if (d < bestD && this.collisionManager.hasLineOfSight(t.x, t.y, e.x, e.y)) {
            bestD = d;
            nearest = e;
          }
        }
        if (nearest) {
          const ang = Math.atan2(nearest.y - t.y, nearest.x - t.x);
          t.gun.setRotation(ang);
          if (t.fireCooldownSec <= 0) {
            t.fireCooldownSec = HORDE_GEAR_COSTS.TURRET_FIRE_INTERVAL_MS / 1000;
            onTurretShoot?.(t.x + Math.cos(ang) * 14, t.y + Math.sin(ang) * 14, ang);
          }
        }
      }
    }

    const nanoStacks = this.getPerkStacks('nano_regen');
    if (nanoStacks > 0 && !this.awaitingPerkChoice) {
      this.regenAccumulator += dtSeconds * nanoStacks * 3;
      if (this.regenAccumulator >= 1) {
        const healInt = Math.floor(this.regenAccumulator);
        this.regenAccumulator -= healInt;
        onWaveClearHeal(healInt);
      }
    }

    if (this.awaitingPerkChoice) {
      return;
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
      this.audioManager.playMissionComplete();
      onWaveClearHeal(25);
      if (this.wave % 3 === 0) {
        this.offerRoguelitePerks();
        if (this.awaitingPerkChoice) {
          this.emitTelemetry(true, nowMs);
          return;
        }
      }
      this.restTimer = 4.2;
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `第 ${this.wave} 波肃清！生命 +25，4秒后开启第 ${this.wave + 1} 波（按 B 部署机甲与武装）`
      );
      this.emitTelemetry(true, nowMs);
      return;
    }

    // Spawn enemies smoothly up to cap
    const maxConcurrent = Math.min(20, 6 + this.wave * 2);
    if (this.enemiesToSpawn > 0 && this.enemies.length < maxConcurrent) {
      this.spawnTimer -= dtSeconds;
      if (this.spawnTimer <= 0) {
        const shouldSpawnBoss = this.wave % 5 === 0 && this.enemiesToSpawn === 1;
        this.spawnEnemyAroundPlayer(playerPos, shouldSpawnBoss);
        this.enemiesToSpawn -= 1;
        this.spawnTimer = Math.max(0.25, 0.92 - this.wave * 0.04);
      }
    }

    // Update active enemies
    for (const enemy of [...this.enemies]) {
      if (enemy.attackCooldown > 0) enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dtSeconds);
      if (enemy.shootCooldown > 0) enemy.shootCooldown = Math.max(0, enemy.shootCooldown - dtSeconds);
      if (enemy.ramCooldown > 0) enemy.ramCooldown = Math.max(0, enemy.ramCooldown - dtSeconds);

      const dx = playerPos.x - enemy.x;
      const dy = playerPos.y - enemy.y;
      const dist = Math.hypot(dx, dy) || 1;
      const baseAngle = Math.atan2(dy, dx);

      enemy.sprite.setRotation(baseAngle);

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
      enemy.sprite.setDepth(groundDepth(enemy.y));
      enemy.glow.setPosition(enemy.x, enemy.y);

      // Mech stomp crush damage against non-boss enemies
      if (this.activeMech && !enemy.isBoss && dist <= enemy.radius + 24 && this.activeMech.stompCooldownSec <= 0) {
        this.activeMech.stompCooldownSec = 0.32;
        const stompDmg = MECH_SPECS[this.activeMech.kind].stompDamage;
        const res = this.damageEnemy(enemy, stompDmg, -Math.cos(baseAngle), -Math.sin(baseAngle), true);
        this.audioManager.playImpactHit(true);
        if (res.killed) {
          onMechStompKilled?.(res.cashDrop);
          continue;
        }
      }

      // Melee contact damage
      if (dist <= enemy.radius + (this.activeMech ? 20 : 14) && enemy.attackCooldown <= 0) {
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
        if (distPlayer <= (this.activeMech ? 22 : 16)) {
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
    sprite.setDepth(groundDepth(spawnY));

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
      ramCooldown: 0,
      vx: 0,
      vy: 0,
    });
  }

  public checkVehicleRam(
    vx: number,
    vy: number,
    speedPx: number,
    ramMult: number,
    velX: number,
    velY: number,
    onCashBonus?: (cash: number) => void
  ): void {
    if (!this.active || speedPx < 75) return;
    const vLen = Math.hypot(velX, velY) || 1;
    for (const enemy of [...this.enemies]) {
      if (enemy.ramCooldown > 0) continue;
      const dist = Phaser.Math.Distance.Between(vx, vy, enemy.x, enemy.y);
      if (dist <= enemy.radius + 24) {
        enemy.ramCooldown = 0.35;
        const dx = vLen > 1 ? velX / vLen : (enemy.x - vx) / (dist || 1);
        const dy = vLen > 1 ? velY / vLen : (enemy.y - vy) / (dist || 1);
        const dmg = Math.round(speedPx * 0.25 * ramMult);
        const res = this.damageEnemy(enemy, dmg, dx, dy, true);
        this.audioManager.playImpactHit(res.killed);
        if (res.killed) {
          onCashBonus?.(Math.round(res.cashDrop * this.getCashDropMultiplier()));
        }
      }
    }
  }

  public damageEnemy(
    enemy: ActiveHordeEnemy,
    damage: number,
    dirX: number,
    dirY: number,
    isHeavy: boolean
  ): { killed: boolean; cashDrop: number; scoreGained: number } {
    enemy.hp -= damage;

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

    if (enemy.isBoss) {
      this.pickupManager.spawnDrop(enemy.x, enemy.y, 'overdrive', 8);
      this.pickupManager.spawnDrop(enemy.x + 18, enemy.y, 'armor', 50);
    } else {
      const roll = Math.random();
      if (roll < 0.08) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'overdrive', 8);
      } else if (roll < 0.19) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'armor', 35);
      } else if (roll < 0.34) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'medkit', 30);
      } else if (roll < 0.5) {
        this.pickupManager.spawnDrop(enemy.x, enemy.y, 'ammo', 40);
      } else if (roll < 0.76) {
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

  public getMechTelemetry(): MechTelemetryPayload {
    if (!this.activeMech) {
      return {
        active: false,
        kind: null,
        name: null,
        hp: 0,
        maxHp: 0,
        abilityLabel: null,
        abilityCooldownSec: 0,
        abilityMaxCooldownSec: 0,
        turretCount: this.turrets.length,
        maxTurrets: HORDE_GEAR_COSTS.MAX_TURRETS,
      };
    }
    const spec = MECH_SPECS[this.activeMech.kind];
    return {
      active: true,
      kind: this.activeMech.kind,
      name: spec.shortName,
      hp: Math.round(this.activeMech.hp),
      maxHp: this.activeMech.maxHp,
      abilityLabel: spec.abilityLabel,
      abilityCooldownSec: Number(this.activeMech.abilityCooldownSec.toFixed(1)),
      abilityMaxCooldownSec: spec.abilityCooldownSec,
      turretCount: this.turrets.length,
      maxTurrets: HORDE_GEAR_COSTS.MAX_TURRETS,
    };
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 140) return;
    this.lastEmitAt = nowMs;

    const activePerks: ActiveHordePerkSummary[] = Object.entries(this.perks)
      .filter(([, stacks]) => stacks > 0)
      .map(([id, stacks]) => {
        const spec = HORDE_ROGUELITE_PERKS.find((p) => p.id === id);
        return {
          id,
          name: spec?.name ?? id,
          stacks,
          accentColor: spec?.accentColor ?? '#00F5FF',
        };
      });

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
      mech: this.getMechTelemetry(),
      activePerks,
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
    for (const t of this.turrets) {
      t.base.destroy();
      t.gun.destroy();
    }
    this.turrets = [];
  }

  public destroy(): void {
    this.clearEntities();
  }
}
