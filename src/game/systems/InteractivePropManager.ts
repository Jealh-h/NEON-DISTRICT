import Phaser from 'phaser';
import { ECONOMY_CONFIG, PALETTE } from '../config/BalanceConfig';
import { GAME_EVENT, gameEvents, NearbyPropInfo } from '../ui/GameEvents';
import { DistrictData } from '../world/DistrictManager';
import { AudioManager } from './AudioManager';
import { HordeManager } from './HordeManager';
import { NPCManager } from './NPCManager';
import { PickupManager } from './PickupManager';
import { PoliceManager } from './PoliceManager';
import { CrimeType } from './WantedManager';

interface BarrelNode {
  id: string;
  x: number;
  y: number;
  hp: number;
  active: boolean;
  respawnAt: number;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
}

interface CrateNode {
  id: string;
  x: number;
  y: number;
  hp: number;
  active: boolean;
  respawnAt: number;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
}

interface HydrantNode {
  id: string;
  x: number;
  y: number;
  geyserUntil: number;
  cooldownUntil: number;
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
}

interface AtmNode {
  id: string;
  x: number;
  y: number;
  cooldownUntil: number;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

interface VendingNode {
  id: string;
  x: number;
  y: number;
}

export interface PropImpactContext {
  npcManager: NPCManager;
  policeManager: PoliceManager;
  hordeManager?: HordeManager;
  onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void;
  onDamagePlayer: (amount: number) => void;
  onCashBonus: (amount: number) => void;
}

export interface PropInteractContext {
  nowMs: number;
  isHealthFull: () => boolean;
  tryDeduct: (cost: number) => boolean;
  onHeal: (amount: number) => void;
  onCash: (amount: number) => void;
  onAtmAlarm: (pos: { x: number; y: number }) => void;
}

export class InteractivePropManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private pickupManager: PickupManager;

  private barrels: BarrelNode[] = [];
  private crates: CrateNode[] = [];
  private hydrants: HydrantNode[] = [];
  private atms: AtmNode[] = [];
  private vendings: VendingNode[] = [];

  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private debrisEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private waterEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private waterTickTimer = 0;

  constructor(
    scene: Phaser.Scene,
    audioManager: AudioManager,
    pickupManager: PickupManager,
    districtData: DistrictData
  ) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.pickupManager = pickupManager;

    this.explosionEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 70, max: 250 },
      scale: { start: 2.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 460,
      tint: [PALETTE.GOLD, PALETTE.WARNING_RED, PALETTE.NEON_PINK],
      emitting: false,
    });
    this.explosionEmitter.setDepth(28);

    this.debrisEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 45, max: 165 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 340,
      tint: [0xd97706, 0xfbbf24, 0x92400e],
      emitting: false,
    });
    this.debrisEmitter.setDepth(25);

    this.waterEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 45, max: 135 },
      angle: { min: 245, max: 295 },
      scale: { start: 1.6, end: 0.3 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 520,
      tint: [0x38bdf8, 0xe0f2fe, 0x00f5ff],
      emitting: false,
    });
    this.waterEmitter.setDepth(25);

    this.spawnProps(districtData);
  }

  private spawnProps(districtData: DistrictData): void {
    for (const def of districtData.interactiveProps) {
      if (def.type === 'barrel') {
        const shadow = this.scene.add.ellipse(def.x + 2, def.y + 3, 18, 12, 0x000000, 0.45);
        shadow.setDepth(17);
        const sprite = this.scene.add.image(def.x, def.y, 'prop_barrel');
        sprite.setDepth(19);
        this.barrels.push({
          id: def.id,
          x: def.x,
          y: def.y,
          hp: 24,
          active: true,
          respawnAt: 0,
          sprite,
          shadow,
        });
      } else if (def.type === 'crate') {
        const shadow = this.scene.add.ellipse(def.x + 2, def.y + 3, 22, 14, 0x000000, 0.45);
        shadow.setDepth(17);
        const sprite = this.scene.add.image(def.x, def.y, 'prop_crate');
        sprite.setDepth(19);
        this.crates.push({
          id: def.id,
          x: def.x,
          y: def.y,
          hp: 25,
          active: true,
          respawnAt: 0,
          sprite,
          shadow,
        });
      } else if (def.type === 'hydrant') {
        const shadow = this.scene.add.ellipse(def.x + 1, def.y + 2, 13, 9, 0x000000, 0.4);
        shadow.setDepth(17);
        const sprite = this.scene.add.image(def.x, def.y, 'prop_hydrant');
        sprite.setDepth(19);
        this.hydrants.push({
          id: def.id,
          x: def.x,
          y: def.y,
          geyserUntil: 0,
          cooldownUntil: 0,
          sprite,
          shadow,
        });
      } else if (def.type === 'atm') {
        const glow = this.scene.add.image(def.x, def.y, 'fx_pixel_glow');
        glow.setTint(PALETTE.NEON_CYAN);
        glow.setAlpha(0.24);
        glow.setScale(0.75);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        glow.setDepth(16);

        const sprite = this.scene.add.image(def.x, def.y, 'prop_atm');
        sprite.setDepth(18);
        this.atms.push({
          id: def.id,
          x: def.x,
          y: def.y,
          cooldownUntil: 0,
          sprite,
          glow,
        });
      }
    }

    districtData.props.forEach((p, idx) => {
      if (p.type === 'vending') {
        this.vendings.push({
          id: `vending-${idx}`,
          x: p.x,
          y: p.y,
        });
      }
    });
  }

  public update(dtSeconds: number, nowMs: number): void {
    for (const b of this.barrels) {
      if (!b.active && b.respawnAt > 0 && nowMs >= b.respawnAt) {
        b.active = true;
        b.hp = 24;
        b.respawnAt = 0;
        b.sprite.setVisible(true).setAlpha(1).clearTint();
        b.shadow.setVisible(true);
      }
    }

    for (const c of this.crates) {
      if (!c.active && c.respawnAt > 0 && nowMs >= c.respawnAt) {
        c.active = true;
        c.hp = 25;
        c.respawnAt = 0;
        c.sprite.setVisible(true).setAlpha(1).clearTint();
        c.shadow.setVisible(true);
      }
    }

    this.waterTickTimer += dtSeconds;
    if (this.waterTickTimer >= 0.06) {
      this.waterTickTimer = 0;
      for (const h of this.hydrants) {
        if (h.geyserUntil > nowMs) {
          this.waterEmitter.emitParticleAt(h.x, h.y - 3, 4);
        }
      }
    }
  }

  public checkBulletHit(
    px: number,
    py: number,
    damage: number,
    ctx: PropImpactContext
  ): boolean {
    for (const b of this.barrels) {
      if (!b.active) continue;
      if (Phaser.Math.Distance.Between(px, py, b.x, b.y) <= 15) {
        b.hp -= damage;
        b.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        this.scene.time.delayedCall(55, () => {
          if (b.sprite.active && b.active) b.sprite.clearTint();
        });
        if (b.hp <= 0) {
          this.detonateBarrel(b, ctx);
        } else {
          this.audioManager.playWallPing();
        }
        return true;
      }
    }

    for (const c of this.crates) {
      if (!c.active) continue;
      if (Phaser.Math.Distance.Between(px, py, c.x, c.y) <= 16) {
        c.hp -= damage;
        c.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
        this.scene.time.delayedCall(55, () => {
          if (c.sprite.active && c.active) c.sprite.clearTint();
        });
        if (c.hp <= 0) {
          this.smashCrate(c);
        } else {
          this.debrisEmitter.emitParticleAt(c.x, c.y, 4);
          this.audioManager.playImpactHit(false);
        }
        return true;
      }
    }

    for (const h of this.hydrants) {
      if (Phaser.Math.Distance.Between(px, py, h.x, h.y) <= 13) {
        this.triggerHydrant(h);
        return true;
      }
    }

    return false;
  }

  public checkVehicleRam(
    vx: number,
    vy: number,
    speedPx: number,
    ctx: PropImpactContext
  ): void {
    if (speedPx < 105) return;

    for (const b of this.barrels) {
      if (!b.active) continue;
      if (Phaser.Math.Distance.Between(vx, vy, b.x, b.y) <= 24) {
        this.detonateBarrel(b, ctx);
      }
    }

    for (const c of this.crates) {
      if (!c.active) continue;
      if (Phaser.Math.Distance.Between(vx, vy, c.x, c.y) <= 25) {
        this.smashCrate(c);
      }
    }

    for (const h of this.hydrants) {
      if (Phaser.Math.Distance.Between(vx, vy, h.x, h.y) <= 21) {
        this.triggerHydrant(h);
      }
    }
  }

  private detonateBarrel(barrel: BarrelNode, ctx: PropImpactContext): void {
    if (!barrel.active) return;
    barrel.active = false;
    barrel.respawnAt = this.scene.time.now + 32000;
    barrel.sprite.setVisible(false);
    barrel.shadow.setVisible(false);

    // Scorch decal on road/ground
    const scorch = this.scene.add.image(barrel.x, barrel.y, 'fx_scorch');
    scorch.setDepth(4);
    scorch.setRotation(Math.random() * Math.PI * 2);
    this.scene.tweens.add({
      targets: scorch,
      alpha: 0,
      delay: 14000,
      duration: 3000,
      onComplete: () => scorch.destroy(),
    });

    this.explosionEmitter.emitParticleAt(barrel.x, barrel.y, 32);
    this.audioManager.playExplosion();
    this.scene.cameras.main.shake(230, 0.011);

    const shock = this.scene.add.circle(barrel.x, barrel.y, 12, PALETTE.GOLD, 0.28);
    shock.setStrokeStyle(3, PALETTE.WARNING_RED, 0.95);
    shock.setDepth(27);
    this.scene.tweens.add({
      targets: shock,
      radius: 68,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => shock.destroy(),
    });

    const blastRadius = 135;

    // Damage Horde enemies
    if (ctx.hordeManager && ctx.hordeManager.isActive()) {
      for (const enemy of [...ctx.hordeManager.getEnemies()]) {
        const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, enemy.x, enemy.y);
        if (dist <= blastRadius) {
          const dx = (enemy.x - barrel.x) / Math.max(1, dist);
          const dy = (enemy.y - barrel.y) / Math.max(1, dist);
          const dmg = Math.round(165 * (1 - dist / (blastRadius * 1.45)));
          const res = ctx.hordeManager.damageEnemy(enemy, dmg, dx, dy, true);
          if (res.killed) {
            ctx.onCashBonus(res.cashDrop);
          }
        }
      }
    }

    // Damage Police units
    for (const unit of ctx.policeManager.getUnits()) {
      if (unit.isDisabled()) continue;
      const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, unit.sprite.x, unit.sprite.y);
      if (dist <= blastRadius) {
        const dx = (unit.sprite.x - barrel.x) / Math.max(1, dist);
        const dy = (unit.sprite.y - barrel.y) / Math.max(1, dist);
        const res = unit.takeHit(95, dx, dy);
        ctx.onCrime('assault_police', { x: barrel.x, y: barrel.y }, true);
        if (res.destroyed) {
          ctx.onCashBonus(res.cashBonus);
          gameEvents.emit(GAME_EVENT.STATUS_TOAST, `油桶爆破瘫痪警车！赏金 +$${res.cashBonus}`);
        }
      }
    }

    // Panic & hit nearby NPCs
    ctx.npcManager.triggerAreaPanic(barrel.x, barrel.y, 240);
    for (const npc of ctx.npcManager.getNpcs()) {
      if (npc.isIncapacitated()) continue;
      const dist = Phaser.Math.Distance.Between(barrel.x, barrel.y, npc.sprite.x, npc.sprite.y);
      if (dist <= 95) {
        const dx = (npc.sprite.x - barrel.x) / Math.max(1, dist);
        const dy = (npc.sprite.y - barrel.y) / Math.max(1, dist);
        const res = npc.takeHit(65, dx, dy, 250);
        if (res.killed) {
          ctx.onCashBonus(res.cashDrop);
        }
        ctx.onCrime('hit_pedestrian', { x: barrel.x, y: barrel.y }, true);
      }
    }

    // Report noisy urban explosion if police nearby
    if (ctx.policeManager.isPoliceNearby(barrel.x, barrel.y, 440)) {
      ctx.onCrime('weapon_discharge', { x: barrel.x, y: barrel.y }, true);
    }

    // Chain-detonate neighboring barrels with slight dramatic delay
    for (const other of this.barrels) {
      if (!other.active) continue;
      if (Phaser.Math.Distance.Between(barrel.x, barrel.y, other.x, other.y) <= 95) {
        this.scene.time.delayedCall(120, () => {
          if (other.active) {
            this.detonateBarrel(other, ctx);
          }
        });
      }
    }
  }

  private smashCrate(crate: CrateNode): void {
    if (!crate.active) return;
    crate.active = false;
    crate.respawnAt = this.scene.time.now + 40000;
    crate.sprite.setVisible(false);
    crate.shadow.setVisible(false);

    this.debrisEmitter.emitParticleAt(crate.x, crate.y, 16);
    this.audioManager.playImpactHit(true);

    const roll = Math.random();
    if (roll < 0.5) {
      this.pickupManager.spawnDrop(crate.x, crate.y, 'cash', 45 + Math.floor(Math.random() * 55));
    } else if (roll < 0.8) {
      this.pickupManager.spawnDrop(crate.x, crate.y, 'ammo', 40);
    } else {
      this.pickupManager.spawnDrop(crate.x, crate.y, 'medkit', 30);
    }
  }

  private triggerHydrant(hydrant: HydrantNode): void {
    const now = this.scene.time.now;
    if (now < hydrant.cooldownUntil) return;
    hydrant.cooldownUntil = now + 16000;
    hydrant.geyserUntil = now + 5200;
    this.audioManager.playWallPing();
    this.waterEmitter.emitParticleAt(hydrant.x, hydrant.y - 4, 14);
  }

  public getNearbyInteractable(x: number, y: number): NearbyPropInfo | null {
    let bestDist = 52;
    let best: NearbyPropInfo | null = null;

    for (const atm of this.atms) {
      const d = Phaser.Math.Distance.Between(x, y, atm.x, atm.y);
      if (d <= bestDist) {
        bestDist = d;
        best = {
          id: atm.id,
          kind: 'atm',
          title: '赛博 ATM 终端',
          actionLabel: '黑入终端提现（可能触发警报）',
        };
      }
    }

    for (const vm of this.vendings) {
      const d = Phaser.Math.Distance.Between(x, y, vm.x, vm.y);
      if (d <= bestDist) {
        bestDist = d;
        best = {
          id: vm.id,
          kind: 'vending',
          title: '街头自动售货机',
          actionLabel: `购买冰镇能量饮 ($${ECONOMY_CONFIG.VENDING_DRINK_COST} · +${ECONOMY_CONFIG.VENDING_DRINK_HEAL} 生命)`,
        };
      }
    }

    return best;
  }

  public interactNearest(x: number, y: number, ctx: PropInteractContext): boolean {
    const nearby = this.getNearbyInteractable(x, y);
    if (!nearby) return false;

    if (nearby.kind === 'atm') {
      const atm = this.atms.find((a) => a.id === nearby.id);
      if (!atm) return false;
      if (ctx.nowMs < atm.cooldownUntil) {
        this.audioManager.playBump(ctx.nowMs);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '该 ATM 终端安全锁冷却中，请稍后再试或前往其他终端。');
        return true;
      }

      atm.cooldownUntil = ctx.nowMs + 45000;
      atm.glow.setTint(PALETTE.WARNING_RED);
      this.scene.time.delayedCall(45000, () => {
        if (atm.glow.active) atm.glow.setTint(PALETTE.NEON_CYAN);
      });

      const cashAmount = 75 + Math.floor(Math.random() * 76);
      ctx.onCash(cashAmount);
      this.audioManager.playPurchase();

      const alarmTriggered = Math.random() < 0.55;
      if (alarmTriggered) {
        ctx.onAtmAlarm({ x: atm.x, y: atm.y });
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `ATM 破解提现 +$${cashAmount}！终端警报已触发！`
        );
      } else {
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `静默破解赛博 ATM 成功！提取 +$${cashAmount}，未惊动警队！`
        );
      }
      return true;
    }

    if (nearby.kind === 'vending') {
      if (ctx.isHealthFull()) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '生命值已满，暂时不需要能量饮料。');
        return true;
      }
      if (!ctx.tryDeduct(ECONOMY_CONFIG.VENDING_DRINK_COST)) {
        return true;
      }
      ctx.onHeal(ECONOMY_CONFIG.VENDING_DRINK_HEAL);
      this.audioManager.playPurchase();
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `售货机投币 $${ECONOMY_CONFIG.VENDING_DRINK_COST}，饮用能量饮恢复 +${ECONOMY_CONFIG.VENDING_DRINK_HEAL} 生命！`
      );
      return true;
    }

    return false;
  }

  public destroy(): void {
    this.explosionEmitter.destroy();
    this.debrisEmitter.destroy();
    this.waterEmitter.destroy();
    for (const b of this.barrels) {
      b.sprite.destroy();
      b.shadow.destroy();
    }
    for (const c of this.crates) {
      c.sprite.destroy();
      c.shadow.destroy();
    }
    for (const h of this.hydrants) {
      h.sprite.destroy();
      h.shadow.destroy();
    }
    for (const a of this.atms) {
      a.sprite.destroy();
      a.glow.destroy();
    }
    this.barrels = [];
    this.crates = [];
    this.hydrants = [];
    this.atms = [];
    this.vendings = [];
  }
}
