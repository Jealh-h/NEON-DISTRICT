import Phaser from 'phaser';
import { PALETTE, WORLD_CONFIG } from '../config/BalanceConfig';
import {
  BIOME_ORE_SPAWNS,
  TERRARIA_LIMITS,
  TERRARIA_RECIPES,
  TERRARIA_RESOURCE_ORDER,
  TERRARIA_RESOURCES,
  TerrariaAccessoryId,
  TerrariaBossId,
  TerrariaPotionId,
  TerrariaResourceId,
  TerrariaStructureType,
  WORLD_BOSS_SPECS,
  WorldBossSpec,
} from '../config/TerrariaConfig';
import {
  GAME_EVENT,
  gameEvents,
  SandboxInteractableHint,
  TerrariaPylonMarker,
  TerrariaTelemetryPayload,
} from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';

interface OreNodeEntity {
  id: string;
  resourceId: TerrariaResourceId;
  districtName: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  respawnTimerSec: number;
  visual: Phaser.GameObjects.Container;
  crystal: Phaser.GameObjects.Polygon;
  ring: Phaser.GameObjects.Arc;
  hpBg: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  ramCooldown: number;
}

interface OrePickupDrop {
  resourceId: TerrariaResourceId;
  amount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifeSec: number;
  sprite: Phaser.GameObjects.Polygon;
}

interface PlacedStructure {
  id: string;
  type: TerrariaStructureType;
  label: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cooldownSec: number;
  visual: Phaser.GameObjects.Container;
  turretHead?: Phaser.GameObjects.Rectangle;
  auraRing?: Phaser.GameObjects.Arc;
}

interface ActiveWorldBoss {
  spec: WorldBossSpec;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  phase2: boolean;
  fireCooldown: number;
  dashCooldown: number;
  dashTimer: number;
  dashAngle: number;
  contactCooldown: number;
  ramCooldown: number;
  container: Phaser.GameObjects.Container;
  corePoly: Phaser.GameObjects.Polygon;
  outerRing: Phaser.GameObjects.Arc;
}

interface BossProjectile {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  damage: number;
  lifeSec: number;
}

interface TurretBolt {
  sprite: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  damage: number;
  lifeSec: number;
  onHitTarget?: () => void;
  hitDone?: boolean;
}

export interface SavedTerrariaState {
  resources: Partial<Record<TerrariaResourceId, number>>;
  hasPlasmaPickaxe: boolean;
  unlockedAccessories: TerrariaAccessoryId[];
  equippedAccessories: TerrariaAccessoryId[];
  potions: Partial<Record<TerrariaPotionId, number>>;
  structures: Array<{
    id: string;
    type: TerrariaStructureType;
    label: string;
    x: number;
    y: number;
  }>;
  defeatedBossIds: TerrariaBossId[];
}

export interface TerrariaTurretTarget {
  x: number;
  y: number;
  damage: (amount: number) => boolean;
}

export interface TerrariaUpdateCallbacks {
  onHealPlayer: (amount: number) => void;
  onDamagePlayer: (amount: number) => void;
  onCash: (amount: number) => void;
  onExp: (amount: number) => void;
  onRecallHome: () => void;
  onOverdrive: (sec: number) => void;
  getExtraTurretTargets: () => TerrariaTurretTarget[];
}

function createEmptyResourceBag(): Record<TerrariaResourceId, number> {
  return {
    scrap_alloy: 2,
    neon_crystal: 1,
    quantum_core: 0,
    frost_ore: 0,
    obsidian_shard: 0,
    abyss_pearl: 0,
    boss_soul: 0,
  };
}

export class TerrariaSandboxManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;

  private enabled = true;
  private resources: Record<TerrariaResourceId, number> = createEmptyResourceBag();
  private hasPlasmaPickaxe = false;
  private unlockedAccessories = new Set<TerrariaAccessoryId>();
  private equippedAccessories: TerrariaAccessoryId[] = [];
  private potions: Record<TerrariaPotionId, number> = {
    ironskin: 1,
    mining: 1,
    recall: 1,
  };
  private ironskinBuffSec = 0;
  private miningBuffSec = 0;
  private defeatedBossIds = new Set<TerrariaBossId>();

  private oreNodes: OreNodeEntity[] = [];
  private oreDrops: OrePickupDrop[] = [];
  private structures: PlacedStructure[] = [];
  private activeBoss: ActiveWorldBoss | null = null;
  private bossProjectiles: BossProjectile[] = [];
  private turretBolts: TurretBolt[] = [];

  private structureSeq = 0;
  private campfireHealAccum = 0;
  private lastEmitAt = 0;

  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    audioManager: AudioManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
  }

  public initializeWorld(): void {
    this.clearOreNodes();
    for (const def of BIOME_ORE_SPAWNS) {
      const clearPos = this.findClearPointNear(def.x, def.y, 20);
      const spec = TERRARIA_RESOURCES[def.resourceId];
      const visual = this.scene.add.container(clearPos.x, clearPos.y).setDepth(19 + Math.min(8.4, Math.max(0, clearPos.y) * 0.0022));

      const ring = this.scene.add
        .circle(0, 0, 17, spec.colorNum, 0.12)
        .setStrokeStyle(1.5, spec.colorNum, 0.6);
      const crystal = this.scene.add
        .polygon(
          0,
          0,
          [
            0, -13,
            10, -5,
            12, 6,
            0, 13,
            -11, 5,
            -9, -6,
          ],
          spec.colorNum,
          0.95
        )
        .setStrokeStyle(2, 0x080d18, 0.9);
      const glint = this.scene.add.polygon(
        -2,
        -3,
        [0, -7, 5, -1, 0, 5, -5, -1],
        0xffffff,
        0.55
      );
      const hpBg = this.scene.add.rectangle(0, -22, 30, 4, 0x080d18, 0.9).setVisible(false);
      const hpFill = this.scene.add
        .rectangle(-14, -22, 28, 2.5, spec.colorNum, 1)
        .setOrigin(0, 0.5)
        .setVisible(false);

      visual.add([ring, crystal, glint, hpBg, hpFill]);

      this.oreNodes.push({
        id: def.id,
        resourceId: def.resourceId,
        districtName: def.districtName,
        x: clearPos.x,
        y: clearPos.y,
        hp: spec.nodeHp,
        maxHp: spec.nodeHp,
        respawnTimerSec: 0,
        visual,
        crystal,
        ring,
        hpBg,
        hpFill,
        ramCooldown: 0,
      });
    }
    this.emitTelemetry(true);
  }

  private findClearPointNear(x: number, y: number, radius: number): { x: number; y: number } {
    if (this.collisionManager.isPointClearForEntity(x, y, radius)) {
      return { x: Math.round(x), y: Math.round(y) };
    }
    for (let ring = 1; ring <= 8; ring++) {
      const dist = ring * 36;
      for (let i = 0; i < 12; i++) {
        const ang = (Math.PI * 2 * i) / 12;
        const cx = Phaser.Math.Clamp(x + Math.cos(ang) * dist, 72, WORLD_CONFIG.WIDTH - 72);
        const cy = Phaser.Math.Clamp(y + Math.sin(ang) * dist, 72, WORLD_CONFIG.HEIGHT - 72);
        if (this.collisionManager.isPointClearForEntity(cx, cy, radius)) {
          return { x: Math.round(cx), y: Math.round(cy) };
        }
      }
    }
    return { x: WORLD_CONFIG.PLAYER_SPAWN.x, y: WORLD_CONFIG.PLAYER_SPAWN.y };
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    for (const node of this.oreNodes) {
      node.visual.setVisible(enabled && node.respawnTimerSec <= 0);
    }
    for (const st of this.structures) {
      st.visual.setVisible(enabled);
    }
    if (!enabled) {
      this.clearBoss();
      this.clearDrops();
      this.clearBolts();
    }
    this.emitTelemetry(true);
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    inVehicle: boolean,
    callbacks: TerrariaUpdateCallbacks
  ): void {
    if (!this.enabled) return;

    // 1. Buff timers
    let dirtyBuff = false;
    if (this.ironskinBuffSec > 0) {
      this.ironskinBuffSec = Math.max(0, this.ironskinBuffSec - dtSeconds);
      dirtyBuff = true;
    }
    if (this.miningBuffSec > 0) {
      this.miningBuffSec = Math.max(0, this.miningBuffSec - dtSeconds);
      dirtyBuff = true;
    }

    // 2. Respawn depleted ore nodes & pulse visual
    for (const node of this.oreNodes) {
      if (node.ramCooldown > 0) node.ramCooldown = Math.max(0, node.ramCooldown - dtSeconds);
      if (node.respawnTimerSec > 0) {
        node.respawnTimerSec -= dtSeconds;
        if (node.respawnTimerSec <= 0) {
          node.respawnTimerSec = 0;
          node.hp = node.maxHp;
          node.hpBg.setVisible(false);
          node.hpFill.setVisible(false);
          node.visual.setVisible(true);
        }
      } else {
        const pulse = 1 + Math.sin(nowMs * 0.004 + node.x * 0.01) * 0.08;
        node.ring.setScale(pulse);
      }
    }

    // 3. Magnetic Ore Drops
    const magnetRadius = this.getMagnetRadius();
    for (let i = this.oreDrops.length - 1; i >= 0; i--) {
      const d = this.oreDrops[i];
      d.lifeSec -= dtSeconds;
      const dist = Phaser.Math.Distance.Between(d.x, d.y, playerPos.x, playerPos.y);
      if (dist <= magnetRadius) {
        const ang = Math.atan2(playerPos.y - d.y, playerPos.x - d.x);
        const pullSpeed = dist < 64 ? 460 : 320;
        d.vx = Math.cos(ang) * pullSpeed;
        d.vy = Math.sin(ang) * pullSpeed;
      } else {
        d.vx *= Math.max(0, 1 - 4.5 * dtSeconds);
        d.vy *= Math.max(0, 1 - 4.5 * dtSeconds);
      }
      d.x += d.vx * dtSeconds;
      d.y += d.vy * dtSeconds;
      d.sprite.setPosition(d.x, d.y).setRotation(nowMs * 0.004 + i);

      if (dist <= 24) {
        this.resources[d.resourceId] = (this.resources[d.resourceId] ?? 0) + d.amount;
        const spec = TERRARIA_RESOURCES[d.resourceId];
        this.audioManager.playArmorPickup();
        this.spawnFloatingText(d.x, d.y - 12, `+${d.amount} ${spec.name}`, spec.colorHex);
        d.sprite.destroy();
        this.oreDrops.splice(i, 1);
        this.emitTelemetry(true, nowMs);
      } else if (d.lifeSec <= 0) {
        d.sprite.destroy();
        this.oreDrops.splice(i, 1);
      }
    }

    // 4. Structures update (Campfire regen + Turret auto-fire)
    let nearCampfire = false;
    const allTargets: TerrariaTurretTarget[] = [];
    if (this.activeBoss) {
      const bossRef = this.activeBoss;
      allTargets.push({
        x: bossRef.x,
        y: bossRef.y,
        damage: (amt) => this.damageBoss(amt, callbacks),
      });
    }
    allTargets.push(...callbacks.getExtraTurretTargets());

    for (const st of this.structures) {
      if (st.type === 'campfire') {
        const d = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, st.x, st.y);
        if (d <= TERRARIA_LIMITS.CAMPFIRE_HEAL_RADIUS) {
          nearCampfire = true;
        }
        if (st.auraRing) {
          st.auraRing.setAlpha(0.11 + Math.sin(nowMs * 0.005) * 0.04);
        }
      } else if (st.type === 'turret') {
        st.cooldownSec = Math.max(0, st.cooldownSec - dtSeconds);
        if (st.cooldownSec <= 0 && allTargets.length > 0) {
          let best: TerrariaTurretTarget | null = null;
          let bestDist = TERRARIA_LIMITS.TURRET_RANGE;
          for (const tgt of allTargets) {
            const d = Phaser.Math.Distance.Between(st.x, st.y, tgt.x, tgt.y);
            if (d <= bestDist) {
              bestDist = d;
              best = tgt;
            }
          }
          if (best) {
            st.cooldownSec = TERRARIA_LIMITS.TURRET_COOLDOWN_SEC;
            const ang = Math.atan2(best.y - st.y, best.x - st.x);
            st.turretHead?.setRotation(ang);
            this.fireTurretBolt(st.x, st.y, ang);
          }
        }
      }
    }

    if (nearCampfire && !inVehicle) {
      this.campfireHealAccum += TERRARIA_LIMITS.CAMPFIRE_HEAL_PER_SEC * dtSeconds;
      if (this.campfireHealAccum >= 2) {
        const healAmt = Math.floor(this.campfireHealAccum);
        this.campfireHealAccum -= healAmt;
        callbacks.onHealPlayer(healAmt);
      }
    } else {
      this.campfireHealAccum = 0;
    }

    // 5. Turret bolts vs Boss / Extra targets / walls
    for (let i = this.turretBolts.length - 1; i >= 0; i--) {
      const b = this.turretBolts[i];
      b.lifeSec -= dtSeconds;
      b.sprite.x += b.vx * dtSeconds;
      b.sprite.y += b.vy * dtSeconds;

      let hit = false;
      if (this.activeBoss) {
        const dBoss = Phaser.Math.Distance.Between(
          b.sprite.x,
          b.sprite.y,
          this.activeBoss.x,
          this.activeBoss.y
        );
        if (dBoss <= this.activeBoss.spec.radius + 8) {
          this.damageBoss(b.damage, callbacks);
          hit = true;
        }
      }
      if (!hit) {
        for (const tgt of callbacks.getExtraTurretTargets()) {
          if (Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, tgt.x, tgt.y) <= 20) {
            tgt.damage(b.damage);
            hit = true;
            break;
          }
        }
      }

      if (hit || b.lifeSec <= 0 || this.collisionManager.isPointBlockedByWall(b.sprite.x, b.sprite.y)) {
        b.sprite.destroy();
        this.turretBolts.splice(i, 1);
      }
    }

    // 6. Active World Boss AI
    if (this.activeBoss) {
      this.updateActiveBoss(dtSeconds, nowMs, playerPos, callbacks);
    }

    // 7. Boss Projectiles vs Player & Alloy Barricades
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i];
      bp.lifeSec -= dtSeconds;
      bp.sprite.x += bp.vx * dtSeconds;
      bp.sprite.y += bp.vy * dtSeconds;

      let destroyed = bp.lifeSec <= 0;
      if (!destroyed) {
        for (let sIdx = this.structures.length - 1; sIdx >= 0; sIdx--) {
          const st = this.structures[sIdx];
          if (st.type !== 'barricade') continue;
          if (Phaser.Math.Distance.Between(bp.sprite.x, bp.sprite.y, st.x, st.y) <= 22) {
            st.hp -= bp.damage;
            this.spawnFloatingText(st.x, st.y - 14, '格挡!', '#38BDF8');
            if (st.hp <= 0) {
              st.visual.destroy();
              this.structures.splice(sIdx, 1);
              gameEvents.emit(GAME_EVENT.STATUS_TOAST, '一座合金壁垒在激战中被摧毁！');
              this.emitTelemetry(true, nowMs);
            }
            destroyed = true;
            break;
          }
        }
      }

      if (!destroyed) {
        const hitDist = Phaser.Math.Distance.Between(bp.sprite.x, bp.sprite.y, playerPos.x, playerPos.y);
        if (hitDist <= (inVehicle ? 24 : 16)) {
          callbacks.onDamagePlayer(bp.damage);
          destroyed = true;
        }
      }

      if (destroyed) {
        bp.sprite.destroy();
        this.bossProjectiles.splice(i, 1);
      }
    }

    if (dirtyBuff || this.activeBoss) {
      this.emitTelemetry(false, nowMs);
    }
  }

  private updateActiveBoss(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    callbacks: TerrariaUpdateCallbacks
  ): void {
    const boss = this.activeBoss;
    if (!boss) return;

    const hpRatio = boss.hp / boss.maxHp;
    if (!boss.phase2 && hpRatio <= 0.5) {
      boss.phase2 = true;
      boss.outerRing.setStrokeStyle(4, PALETTE.GOLD, 0.95);
      this.audioManager.playOrbitalStrike();
      this.scene.cameras.main.shake(220, 0.008);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `⚠ 【${boss.spec.name}】进入二阶段狂暴形态！注意躲避连续突袭与扩散弹幕！`
      );
      this.emitTelemetry(true, nowMs);
    }

    const toPlayerAngle = Math.atan2(playerPos.y - boss.y, playerPos.x - boss.x);
    const distToPlayer = Phaser.Math.Distance.Between(boss.x, boss.y, playerPos.x, playerPos.y);

    if (boss.dashTimer > 0) {
      boss.dashTimer -= dtSeconds;
      const dashSpeed = boss.spec.speed * (boss.phase2 ? 2.4 : 1.9);
      boss.x = Phaser.Math.Clamp(
        boss.x + Math.cos(boss.dashAngle) * dashSpeed * dtSeconds,
        60,
        WORLD_CONFIG.WIDTH - 60
      );
      boss.y = Phaser.Math.Clamp(
        boss.y + Math.sin(boss.dashAngle) * dashSpeed * dtSeconds,
        60,
        WORLD_CONFIG.HEIGHT - 60
      );
    } else {
      boss.dashCooldown -= dtSeconds;
      const moveSpeed = boss.spec.speed * (boss.phase2 ? 1.24 : 1);
      const orbitOffset = distToPlayer < 165 ? 1.15 : 0.25;
      const moveAngle = toPlayerAngle + orbitOffset;
      boss.x = Phaser.Math.Clamp(
        boss.x + Math.cos(moveAngle) * moveSpeed * dtSeconds,
        60,
        WORLD_CONFIG.WIDTH - 60
      );
      boss.y = Phaser.Math.Clamp(
        boss.y + Math.sin(moveAngle) * moveSpeed * dtSeconds,
        60,
        WORLD_CONFIG.HEIGHT - 60
      );

      if (boss.dashCooldown <= 0 && distToPlayer < 460) {
        boss.dashCooldown = boss.phase2 ? 3.2 : 5.0;
        boss.dashTimer = 0.65;
        boss.dashAngle = toPlayerAngle;
        this.audioManager.playInteract();
      }
    }

    boss.container.setPosition(boss.x, boss.y);
    boss.corePoly.setRotation(nowMs * 0.003);
    boss.outerRing.setScale(1 + Math.sin(nowMs * 0.008) * 0.09);

    // Boss Contact Damage
    if (boss.ramCooldown > 0) boss.ramCooldown = Math.max(0, boss.ramCooldown - dtSeconds);
    if (boss.contactCooldown > 0) boss.contactCooldown -= dtSeconds;
    if (distToPlayer <= boss.spec.radius + 16 && boss.contactCooldown <= 0) {
      boss.contactCooldown = 0.9;
      callbacks.onDamagePlayer(boss.spec.contactDamage);
    }

    // Boss Barrages
    boss.fireCooldown -= dtSeconds;
    if (boss.fireCooldown <= 0 && distToPlayer < 650) {
      boss.fireCooldown = boss.phase2 ? 1.05 : 1.55;
      if (boss.spec.id === 'frost_skeletron' && boss.phase2) {
        for (let k = 0; k < 8; k++) {
          const ang = (Math.PI * 2 * k) / 8 + nowMs * 0.001;
          this.spawnBossBolt(boss.x, boss.y, ang, boss.spec.projectileDamage, 290, 0x7dd3fc);
        }
      } else {
        const offsets = boss.phase2 ? [-0.28, -0.14, 0, 0.14, 0.28] : [-0.15, 0, 0.15];
        for (const off of offsets) {
          this.spawnBossBolt(
            boss.x,
            boss.y,
            toPlayerAngle + off,
            boss.spec.projectileDamage,
            320,
            boss.spec.colorNum
          );
        }
      }
    }
  }

  private spawnBossBolt(
    x: number,
    y: number,
    angle: number,
    damage: number,
    speed: number,
    colorNum: number
  ): void {
    const sprite = this.scene.add.circle(x, y, 5, colorNum, 1).setStrokeStyle(1.5, 0xffffff, 0.9).setDepth(32);
    this.bossProjectiles.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      lifeSec: 2.2,
    });
  }

  private fireTurretBolt(x: number, y: number, angle: number): void {
    const sprite = this.scene.add
      .rectangle(x + Math.cos(angle) * 14, y + Math.sin(angle) * 14, 10, 3, PALETTE.NEON_CYAN, 1)
      .setRotation(angle)
      .setDepth(26);
    this.turretBolts.push({
      sprite,
      vx: Math.cos(angle) * 760,
      vy: Math.sin(angle) * 760,
      damage: TERRARIA_LIMITS.TURRET_DAMAGE,
      lifeSec: 0.55,
    });
  }

  public checkProjectileHit(
    px: number,
    py: number,
    damage: number,
    hitTargets: Set<object>,
    callbacks: TerrariaUpdateCallbacks,
    onFeedback?: (tx: number, ty: number, killed: boolean, isBoss: boolean, colorHex: string) => void
  ): boolean {
    if (!this.enabled) return false;

    // 1. Check Active World Boss
    if (this.activeBoss && !hitTargets.has(this.activeBoss)) {
      const boss = this.activeBoss;
      if (Phaser.Math.Distance.Between(px, py, boss.x, boss.y) <= boss.spec.radius + 8) {
        hitTargets.add(boss);
        const killed = this.damageBoss(damage, callbacks);
        onFeedback?.(boss.x, boss.y, killed, true, boss.spec.colorHex);
        return true;
      }
    }

    // 2. Check Ore Nodes (shooting mines ores too!)
    for (const node of this.oreNodes) {
      if (node.respawnTimerSec > 0 || hitTargets.has(node)) continue;
      if (Phaser.Math.Distance.Between(px, py, node.x, node.y) <= 22) {
        hitTargets.add(node);
        const mined = this.damageOreNode(node, damage, false);
        const spec = TERRARIA_RESOURCES[node.resourceId];
        onFeedback?.(node.x, node.y, mined, false, spec.colorHex);
        return true;
      }
    }

    return false;
  }

  public applyBlastDamage(
    bx: number,
    by: number,
    radius: number,
    damage: number,
    callbacks: TerrariaUpdateCallbacks
  ): void {
    if (!this.enabled) return;

    if (this.activeBoss) {
      const dist = Phaser.Math.Distance.Between(bx, by, this.activeBoss.x, this.activeBoss.y);
      if (dist <= radius + this.activeBoss.spec.radius) {
        const scaled = Math.round(damage * Math.max(0.45, 1 - dist / (radius + 32)));
        this.damageBoss(scaled, callbacks);
      }
    }

    for (const node of this.oreNodes) {
      if (node.respawnTimerSec > 0) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, node.x, node.y);
      if (dist <= radius + 16) {
        this.damageOreNode(node, Math.round(damage * 0.8), false);
      }
    }
  }

  public checkVehicleRam(
    vx: number,
    vy: number,
    speedPx: number,
    ramMult: number,
    callbacks: TerrariaUpdateCallbacks
  ): void {
    if (!this.enabled || speedPx < 90) return;

    if (this.activeBoss && this.activeBoss.ramCooldown <= 0) {
      const dist = Phaser.Math.Distance.Between(vx, vy, this.activeBoss.x, this.activeBoss.y);
      if (dist <= this.activeBoss.spec.radius + 26) {
        this.activeBoss.ramCooldown = 0.45;
        const dmg = Math.round(speedPx * 0.24 * ramMult);
        this.spawnFloatingText(this.activeBoss.x, this.activeBoss.y - 24, `-${dmg}`, '#FFD166');
        this.damageBoss(dmg, callbacks);
        this.audioManager.playImpactHit(true);
        this.scene.cameras.main.shake(95, 0.004);
      }
    }

    for (const node of this.oreNodes) {
      if (node.respawnTimerSec > 0 || node.ramCooldown > 0) continue;
      const dist = Phaser.Math.Distance.Between(vx, vy, node.x, node.y);
      if (dist <= 28) {
        node.ramCooldown = 0.45;
        const dmg = Math.round(speedPx * 0.18 * ramMult);
        const spec = TERRARIA_RESOURCES[node.resourceId];
        const mined = this.damageOreNode(node, dmg, false);
        this.spawnFloatingText(
          node.x,
          node.y - 18,
          mined ? '撞碎矿脉!' : `💥 -${dmg}`,
          spec.colorHex
        );
        this.audioManager.playImpactHit(mined);
      }
    }
  }

  private damageBoss(amount: number, callbacks: TerrariaUpdateCallbacks): boolean {
    const boss = this.activeBoss;
    if (!boss) return false;
    boss.hp = Math.max(0, boss.hp - amount);
    boss.corePoly.setFillStyle(0xffffff, 1);
    this.scene.time.delayedCall(60, () => {
      if (this.activeBoss === boss && boss.corePoly.active) {
        boss.corePoly.setFillStyle(boss.spec.colorNum, 0.95);
      }
    });

    if (boss.hp <= 0) {
      const bx = boss.x;
      const by = boss.y;
      const spec = boss.spec;
      this.defeatedBossIds.add(spec.id);
      this.clearBoss();
      this.audioManager.playMissionComplete();
      this.scene.cameras.main.shake(260, 0.011);

      callbacks.onCash(spec.rewardCash);
      callbacks.onExp(spec.rewardExp);
      callbacks.onOverdrive(14);
      this.spawnOreDrop(bx, by, 'boss_soul', spec.bossSoulsDrop);

      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `🏆 击败世界 Boss【${spec.name}】！+$${spec.rewardCash} · +${spec.rewardExp} EXP · 掉落 ${spec.bossSoulsDrop} 机魂核心！`
      );
      this.emitTelemetry(true);
      return true;
    }
    this.emitTelemetry(false);
    return false;
  }

  private damageOreNode(node: OreNodeEntity, amount: number, fromPickaxe: boolean): boolean {
    const spec = TERRARIA_RESOURCES[node.resourceId];
    node.hp -= amount;
    node.hpBg.setVisible(true);
    node.hpFill.setVisible(true);
    node.hpFill.setSize(Math.max(0, 28 * (node.hp / node.maxHp)), 2.5);

    this.scene.tweens.add({
      targets: node.crystal,
      scaleX: 1.24,
      scaleY: 1.24,
      duration: 60,
      yoyo: true,
    });

    if (node.hp > 0) return false;

    // Depleted: spawn ore pickups!
    const [minY, maxY] = spec.baseYield;
    let totalYield = minY + Math.floor(Math.random() * (maxY - minY + 1));
    if (this.hasPlasmaPickaxe) totalYield *= 2;
    if (this.miningBuffSec > 0) totalYield *= 2;
    if (fromPickaxe) totalYield += 1;

    this.spawnOreDrop(node.x, node.y, node.resourceId, totalYield);
    node.respawnTimerSec = TERRARIA_LIMITS.ORE_RESPAWN_SEC;
    node.visual.setVisible(false);
    this.audioManager.playImpactHit(true);
    return true;
  }

  private spawnOreDrop(x: number, y: number, resourceId: TerrariaResourceId, totalAmount: number): void {
    const spec = TERRARIA_RESOURCES[resourceId];
    const pieces = Math.min(4, Math.max(1, totalAmount));
    const baseEach = Math.floor(totalAmount / pieces);
    let rem = totalAmount - baseEach * pieces;

    for (let i = 0; i < pieces; i++) {
      const amt = baseEach + (rem > 0 ? 1 : 0);
      if (rem > 0) rem -= 1;
      if (amt <= 0) continue;

      const ang = (Math.PI * 2 * i) / pieces + Math.random() * 0.5;
      const spd = 70 + Math.random() * 65;
      const sprite = this.scene.add
        .polygon(x, y, [0, -7, 6, 0, 0, 7, -6, 0], spec.colorNum, 1)
        .setStrokeStyle(1.5, 0xffffff, 0.9)
        .setDepth(22);

      this.oreDrops.push({
        resourceId,
        amount: amt,
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        lifeSec: 40,
        sprite,
      });
    }
  }

  public getNearbyInteractable(pos: { x: number; y: number }): SandboxInteractableHint | null {
    if (!this.enabled) return null;

    // Check active ore nodes within 54px
    for (const node of this.oreNodes) {
      if (node.respawnTimerSec > 0) continue;
      if (Phaser.Math.Distance.Between(pos.x, pos.y, node.x, node.y) <= 54) {
        const spec = TERRARIA_RESOURCES[node.resourceId];
        return {
          kind: 'ore',
          id: node.id,
          name: `${spec.name}矿脉 (${node.hp}/${node.maxHp})`,
          actionLabel: this.hasPlasmaPickaxe ? '聚能矿镐开采 (K造物)' : '挥镐采集 (也可直接射击)',
          accentHex: spec.colorHex,
        };
      }
    }

    // Check placed campfires / pylons
    for (const st of this.structures) {
      if (Phaser.Math.Distance.Between(pos.x, pos.y, st.x, st.y) <= 56) {
        if (st.type === 'campfire') {
          return {
            kind: 'campfire',
            id: st.id,
            name: st.label,
            actionLabel: '营火庇护区 (+8 HP/秒) · 打开造物台',
            accentHex: '#F97316',
          };
        }
        if (st.type === 'pylon') {
          return {
            kind: 'pylon',
            id: st.id,
            name: st.label,
            actionLabel: '拆除收回或打开地图折跃',
            accentHex: '#C000FF',
          };
        }
      }
    }

    return null;
  }

  public tryInteractNearest(pos: { x: number; y: number }): boolean {
    if (!this.enabled) return false;

    for (const node of this.oreNodes) {
      if (node.respawnTimerSec > 0) continue;
      if (Phaser.Math.Distance.Between(pos.x, pos.y, node.x, node.y) <= 56) {
        const swingDmg = this.hasPlasmaPickaxe ? 90 : 48;
        const spec = TERRARIA_RESOURCES[node.resourceId];
        const mined = this.damageOreNode(node, swingDmg, true);
        this.audioManager.playImpactHit(false);
        this.spawnFloatingText(
          node.x,
          node.y - 18,
          mined ? `采掘完毕!` : `⛏ -${swingDmg}`,
          spec.colorHex
        );
        return true;
      }
    }

    return false;
  }

  public isPointNearCombatOrOre(x: number, y: number): boolean {
    if (!this.enabled) return false;
    if (this.activeBoss && Phaser.Math.Distance.Between(x, y, this.activeBoss.x, this.activeBoss.y) <= 460) {
      return true;
    }
    for (const node of this.oreNodes) {
      if (node.respawnTimerSec <= 0 && Phaser.Math.Distance.Between(x, y, node.x, node.y) <= 180) {
        return true;
      }
    }
    return false;
  }

  public craftRecipe(
    recipeId: string,
    playerPos: { x: number; y: number },
    facingRad: number,
    callbacks: TerrariaUpdateCallbacks
  ): boolean {
    const recipe = TERRARIA_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;

    if (recipe.kind.type === 'pickaxe' && this.hasPlasmaPickaxe) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '你已拥有【等离子聚能矿镐】，无需重复锻造。');
      return false;
    }
    if (recipe.kind.type === 'accessory' && this.unlockedAccessories.has(recipe.kind.accessoryId)) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `你已锻造过【${recipe.name}】，请点击下方装备栏位佩戴！`);
      return false;
    }
    if (recipe.kind.type === 'boss' && this.activeBoss) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `当前已有世界 Boss【${this.activeBoss.spec.name}】在场！`);
      return false;
    }

    // Verify resources
    for (const [resId, req] of Object.entries(recipe.cost) as Array<[TerrariaResourceId, number]>) {
      if ((this.resources[resId] ?? 0) < req) {
        const resSpec = TERRARIA_RESOURCES[resId];
        this.audioManager.playBump(this.scene.time.now);
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `材料不足！需要 ${resSpec.name} ×${req}（前往 ${resSpec.districtHint} 采集）`
        );
        return false;
      }
    }

    // Deduct materials
    for (const [resId, req] of Object.entries(recipe.cost) as Array<[TerrariaResourceId, number]>) {
      this.resources[resId] = Math.max(0, (this.resources[resId] ?? 0) - req);
    }

    this.audioManager.playPurchase();

    if (recipe.kind.type === 'pickaxe') {
      this.hasPlasmaPickaxe = true;
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '⚒ 已锻造【等离子聚能矿镐】！采矿产量永久翻倍！');
    } else if (recipe.kind.type === 'accessory') {
      this.unlockedAccessories.add(recipe.kind.accessoryId);
      if (this.equippedAccessories.length < TERRARIA_LIMITS.MAX_EQUIPPED_ACCESSORIES) {
        this.equippedAccessories.push(recipe.kind.accessoryId);
      }
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `✨ 已锻造并佩戴饰品【${recipe.name}】！`);
    } else if (recipe.kind.type === 'potion') {
      this.potions[recipe.kind.potionId] = (this.potions[recipe.kind.potionId] ?? 0) + 1;
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `🧪 已炼制【${recipe.name}】×1！`);
    } else if (recipe.kind.type === 'structure') {
      this.placeStructure(recipe.kind.structureType, playerPos, facingRad);
    } else if (recipe.kind.type === 'boss') {
      this.spawnBoss(recipe.kind.bossId, playerPos, callbacks);
    }

    this.emitTelemetry(true);
    return true;
  }

  private placeStructure(
    type: TerrariaStructureType,
    playerPos: { x: number; y: number },
    facingRad: number
  ): void {
    const maxMap: Record<TerrariaStructureType, number> = {
      campfire: TERRARIA_LIMITS.MAX_CAMPFIRES,
      barricade: TERRARIA_LIMITS.MAX_BARRICADES,
      turret: TERRARIA_LIMITS.MAX_TURRETS,
      pylon: TERRARIA_LIMITS.MAX_PYLONS,
    };
    const sameType = this.structures.filter((s) => s.type === type);
    if (sameType.length >= maxMap[type]) {
      const oldest = sameType[0];
      const idx = this.structures.indexOf(oldest);
      if (idx !== -1) {
        oldest.visual.destroy();
        this.structures.splice(idx, 1);
      }
    }

    const tx = playerPos.x + Math.cos(facingRad) * 44;
    const ty = playerPos.y + Math.sin(facingRad) * 44;
    const pos = this.findClearPointNear(tx, ty, 16);

    this.createStructureVisual(type, pos.x, pos.y);
    const labelMap: Record<TerrariaStructureType, string> = {
      campfire: '霓虹营火已点燃！靠近可每秒自动回血 +8！',
      barricade: '合金壁垒已部署，可格挡来袭敌方弹幕！',
      turret: '聚能哨戒炮已就位，将自动协防打击所有敌对目标！',
      pylon: '个人折跃晶塔已建立！可在地图或造物台直接折跃至此！',
    };
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, labelMap[type]);
  }

  private createStructureVisual(
    type: TerrariaStructureType,
    x: number,
    y: number,
    existingId?: string,
    existingLabel?: string
  ): void {
    this.structureSeq += 1;
    const id = existingId ?? `struct-${type}-${this.structureSeq}`;
    const structDepth = type === 'campfire' || type === 'pylon' ? 16 : 19 + Math.min(8.4, Math.max(0, y) * 0.0022);
    const container = this.scene.add.container(x, y).setDepth(structDepth);
    let turretHead: Phaser.GameObjects.Rectangle | undefined;
    let auraRing: Phaser.GameObjects.Arc | undefined;
    let label = existingLabel ?? '';
    let hp = 120;

    if (type === 'campfire') {
      label = existingLabel || `战术营火 #${this.structureSeq}`;
      auraRing = this.scene.add
        .circle(0, 0, TERRARIA_LIMITS.CAMPFIRE_HEAL_RADIUS, 0xf97316, 0.08)
        .setStrokeStyle(1.5, 0xf97316, 0.35);
      const logs = this.scene.add.rectangle(0, 4, 22, 7, 0x78350f, 1).setStrokeStyle(1, 0x080d18, 1);
      const flame = this.scene.add.polygon(0, -3, [0, -12, 8, 2, -8, 2], 0xfbbf24, 1);
      const core = this.scene.add.circle(0, 0, 4, 0xf97316, 1);
      container.add([auraRing, logs, flame, core]);
    } else if (type === 'barricade') {
      label = existingLabel || `合金壁垒 #${this.structureSeq}`;
      hp = TERRARIA_LIMITS.BARRICADE_HP;
      const wall = this.scene.add
        .rectangle(0, 0, 38, 14, 0x1e293b, 1)
        .setStrokeStyle(2, 0x38bdf8, 0.95);
      const stripe = this.scene.add.rectangle(0, 0, 26, 4, 0x00f5ff, 0.85);
      container.add([wall, stripe]);
    } else if (type === 'turret') {
      label = existingLabel || `聚能炮台 #${this.structureSeq}`;
      const base = this.scene.add.circle(0, 0, 14, 0x0f172a, 1).setStrokeStyle(2, 0x00f5ff, 0.95);
      turretHead = this.scene.add.rectangle(4, 0, 22, 7, 0x00f5ff, 1).setStrokeStyle(1, 0x080d18, 1);
      container.add([base, turretHead]);
    } else {
      label = existingLabel || `个人折跃晶塔 #${this.structureSeq}`;
      auraRing = this.scene.add
        .circle(0, 0, 36, 0xc000ff, 0.1)
        .setStrokeStyle(1.5, 0xc000ff, 0.5);
      const crystal = this.scene.add
        .polygon(0, 0, [0, -16, 11, 0, 0, 16, -11, 0], 0xc000ff, 0.95)
        .setStrokeStyle(2, 0x00f5ff, 0.95);
      container.add([auraRing, crystal]);
    }

    this.structures.push({
      id,
      type,
      label,
      x,
      y,
      hp,
      maxHp: hp,
      cooldownSec: 0,
      visual: container,
      turretHead,
      auraRing,
    });
  }

  public spawnBoss(
    bossId: TerrariaBossId,
    playerPos: { x: number; y: number },
    _callbacks?: TerrariaUpdateCallbacks
  ): boolean {
    if (this.activeBoss) return false;
    const spec = WORLD_BOSS_SPECS[bossId];
    const spawn = this.findClearPointNear(playerPos.x + 260, playerPos.y - 160, spec.radius + 8);

    const container = this.scene.add.container(spawn.x, spawn.y).setDepth(35);
    const outerRing = this.scene.add
      .circle(0, 0, spec.radius + 10, spec.colorNum, 0.14)
      .setStrokeStyle(3, spec.colorNum, 0.95);
    const corePoly = this.scene.add
      .polygon(
        0,
        0,
        [
          0, -spec.radius,
          spec.radius * 0.72, -spec.radius * 0.72,
          spec.radius, 0,
          spec.radius * 0.72, spec.radius * 0.72,
          0, spec.radius,
          -spec.radius * 0.72, spec.radius * 0.72,
          -spec.radius, 0,
          -spec.radius * 0.72, -spec.radius * 0.72,
        ],
        spec.colorNum,
        0.92
      )
      .setStrokeStyle(3, 0x080d18, 1);
    const eye = this.scene.add.circle(0, 0, 9, 0xffffff, 0.95);
    container.add([outerRing, corePoly, eye]);

    this.activeBoss = {
      spec,
      x: spawn.x,
      y: spawn.y,
      hp: spec.maxHp,
      maxHp: spec.maxHp,
      phase2: false,
      fireCooldown: 1.4,
      dashCooldown: 4.0,
      dashTimer: 0,
      dashAngle: 0,
      contactCooldown: 0,
      ramCooldown: 0,
      container,
      corePoly,
      outerRing,
    };

    this.audioManager.playWantedTriggered();
    this.scene.cameras.main.shake(200, 0.008);
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `⚠ 世界 Boss【${spec.name}】降临！${spec.subtitle}`
    );
    this.emitTelemetry(true);
    return true;
  }

  public toggleAccessory(accessoryId: TerrariaAccessoryId): void {
    if (!this.unlockedAccessories.has(accessoryId)) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '尚未锻造该饰品，请先在造物台合成解锁。');
      return;
    }
    const idx = this.equippedAccessories.indexOf(accessoryId);
    if (idx !== -1) {
      this.equippedAccessories.splice(idx, 1);
      this.audioManager.playInteract();
    } else {
      if (this.equippedAccessories.length >= TERRARIA_LIMITS.MAX_EQUIPPED_ACCESSORIES) {
        this.equippedAccessories.shift();
      }
      this.equippedAccessories.push(accessoryId);
      this.audioManager.playPurchase();
    }
    this.emitTelemetry(true);
  }

  public usePotion(potionId: TerrariaPotionId, callbacks: TerrariaUpdateCallbacks): boolean {
    if ((this.potions[potionId] ?? 0) <= 0) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '该药剂储备不足，请在造物台炼制！');
      return false;
    }
    this.potions[potionId] -= 1;
    this.audioManager.playPurchase();

    if (potionId === 'ironskin') {
      this.ironskinBuffSec = 45;
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '🛡 饮用铁皮合剂：45 秒内伤害减免额外 +18%！');
    } else if (potionId === 'mining') {
      this.miningBuffSec = 45;
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '⛏ 饮用狂热探矿合剂：45 秒内双倍出矿 & 移速 +15%！');
    } else if (potionId === 'recall') {
      callbacks.onRecallHome();
    }
    this.emitTelemetry(true);
    return true;
  }

  public getPylonDestination(pylonId: string): { x: number; y: number; label: string } | null {
    const found = this.structures.find((s) => s.type === 'pylon' && s.id === pylonId);
    return found ? { x: found.x, y: found.y, label: found.label } : null;
  }

  // Passive bonus multipliers for CityScene & WeaponManager
  public getMoveSpeedBonus(): number {
    let bonus = 0;
    if (this.equippedAccessories.includes('hermes_boots')) bonus += 0.22;
    if (this.miningBuffSec > 0) bonus += 0.15;
    return bonus;
  }

  public getDamageReductionBonus(): number {
    let dr = 0;
    if (this.equippedAccessories.includes('obsidian_shield')) dr += 0.14;
    if (this.ironskinBuffSec > 0) dr += 0.18;
    return dr;
  }

  public getFireRateMultiplier(): number {
    return this.equippedAccessories.includes('celestial_cuff') ? 0.85 : 1;
  }

  public hasCelestialLifesteal(): boolean {
    return this.equippedAccessories.includes('celestial_cuff');
  }

  public getMagnetRadius(): number {
    return this.equippedAccessories.includes('treasure_magnet') ? 260 : 85;
  }

  public getActiveBossId(): TerrariaBossId | null {
    return this.activeBoss?.spec.id ?? null;
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 200) return;
    this.lastEmitAt = nowMs;

    const pylons: TerrariaPylonMarker[] = this.structures
      .filter((s) => s.type === 'pylon')
      .map((s) => ({ id: s.id, label: s.label, x: Math.round(s.x), y: Math.round(s.y) }));

    const structureCounts: Record<TerrariaStructureType, number> = {
      campfire: 0,
      barricade: 0,
      turret: 0,
      pylon: 0,
    };
    for (const s of this.structures) {
      structureCounts[s.type] += 1;
    }

    const resCopy = {} as Record<TerrariaResourceId, number>;
    for (const id of TERRARIA_RESOURCE_ORDER) {
      resCopy[id] = this.resources[id] ?? 0;
    }

    const payload: TerrariaTelemetryPayload = {
      resources: resCopy,
      hasPlasmaPickaxe: this.hasPlasmaPickaxe,
      unlockedAccessories: Array.from(this.unlockedAccessories),
      equippedAccessories: [...this.equippedAccessories],
      potions: { ...this.potions },
      ironskinBuffSec: Math.ceil(this.ironskinBuffSec),
      miningBuffSec: Math.ceil(this.miningBuffSec),
      structureCounts,
      pylons,
      defeatedBossIds: Array.from(this.defeatedBossIds),
      activeBoss: this.activeBoss
        ? {
            id: this.activeBoss.spec.id,
            name: this.activeBoss.spec.name,
            hp: Math.round(this.activeBoss.hp),
            maxHp: this.activeBoss.maxHp,
            phase2: this.activeBoss.phase2,
            x: Math.round(this.activeBoss.x),
            y: Math.round(this.activeBoss.y),
            colorHex: this.activeBoss.spec.colorHex,
          }
        : null,
    };

    gameEvents.emit(GAME_EVENT.TERRARIA_UPDATED, payload);
  }

  public getSaveState(): SavedTerrariaState {
    return {
      resources: { ...this.resources },
      hasPlasmaPickaxe: this.hasPlasmaPickaxe,
      unlockedAccessories: Array.from(this.unlockedAccessories),
      equippedAccessories: [...this.equippedAccessories],
      potions: { ...this.potions },
      structures: this.structures.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label,
        x: Math.round(s.x),
        y: Math.round(s.y),
      })),
      defeatedBossIds: Array.from(this.defeatedBossIds),
    };
  }

  public loadFromSave(saved?: SavedTerrariaState): void {
    this.clearBoss();
    this.clearDrops();
    this.clearBolts();
    this.clearStructures();

    this.resources = createEmptyResourceBag();
    if (saved?.resources) {
      for (const id of TERRARIA_RESOURCE_ORDER) {
        if (typeof saved.resources[id] === 'number') {
          this.resources[id] = Math.max(0, Math.round(saved.resources[id]!));
        }
      }
    }
    this.hasPlasmaPickaxe = Boolean(saved?.hasPlasmaPickaxe);
    this.unlockedAccessories = new Set(saved?.unlockedAccessories ?? []);
    this.equippedAccessories = (saved?.equippedAccessories ?? []).slice(
      0,
      TERRARIA_LIMITS.MAX_EQUIPPED_ACCESSORIES
    );
    this.potions = {
      ironskin: typeof saved?.potions?.ironskin === 'number' ? saved.potions.ironskin : 1,
      mining: typeof saved?.potions?.mining === 'number' ? saved.potions.mining : 1,
      recall: typeof saved?.potions?.recall === 'number' ? saved.potions.recall : 1,
    };
    this.ironskinBuffSec = 0;
    this.miningBuffSec = 0;
    this.defeatedBossIds = new Set(saved?.defeatedBossIds ?? []);

    if (Array.isArray(saved?.structures)) {
      for (const st of saved.structures) {
        if (this.collisionManager.isPointClearForEntity(st.x, st.y, 12)) {
          this.createStructureVisual(st.type, st.x, st.y, st.id, st.label);
        }
      }
    }

    this.emitTelemetry(true);
  }

  private spawnFloatingText(x: number, y: number, label: string, colorHex: string): void {
    const txt = this.scene.add
      .text(x, y, label, {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: colorHex,
        stroke: '#080D18',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(34);

    this.scene.tweens.add({
      targets: txt,
      y: y - 24,
      alpha: 0,
      duration: 620,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  private clearOreNodes(): void {
    for (const node of this.oreNodes) {
      node.visual.destroy();
    }
    this.oreNodes = [];
  }

  private clearDrops(): void {
    for (const d of this.oreDrops) {
      d.sprite.destroy();
    }
    this.oreDrops = [];
  }

  private clearStructures(): void {
    for (const st of this.structures) {
      st.visual.destroy();
    }
    this.structures = [];
  }

  private clearBoss(): void {
    if (this.activeBoss) {
      this.activeBoss.container.destroy();
      this.activeBoss = null;
    }
    for (const bp of this.bossProjectiles) {
      bp.sprite.destroy();
    }
    this.bossProjectiles = [];
  }

  private clearBolts(): void {
    for (const b of this.turretBolts) {
      b.sprite.destroy();
    }
    this.turretBolts = [];
  }

  public destroy(): void {
    this.clearOreNodes();
    this.clearDrops();
    this.clearStructures();
    this.clearBoss();
    this.clearBolts();
  }
}
