import Phaser from 'phaser';
import {
  PALETTE,
  WEAPON_ORDER,
  WEAPON_SPECS,
  WeaponId,
} from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';
import type { HordeManager } from './HordeManager';
import { NPCManager } from './NPCManager';
import { PoliceManager } from './PoliceManager';
import { TrafficManager } from './TrafficManager';
import { VehicleManager } from './VehicleManager';
import { CrimeType } from './WantedManager';

interface ActiveProjectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  dirX: number;
  dirY: number;
  distanceLeft: number;
  damage: number;
  colorNum: number;
  weaponId: WeaponId;
}

export interface SavedWeaponState {
  ownedIds: WeaponId[];
  equippedId: WeaponId;
  ammoByWeapon: Record<WeaponId, number>;
}

export class WeaponManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;

  private ownedIds = new Set<WeaponId>(['pistol']);
  private equippedId: WeaponId = 'pistol';
  private ammoByWeapon: Record<WeaponId, number> = {
    pistol: WEAPON_SPECS.pistol.initialAmmo,
    smg: 0,
    shotgun: 0,
  };

  private projectiles: ActiveProjectile[] = [];
  private lastFireAt = 0;
  private lastEmptyClickAt = 0;

  private muzzleFlash: Phaser.GameObjects.Image;
  private muzzleTimer = 0;
  private hitSparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private shellEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    audioManager: AudioManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;

    this.muzzleFlash = scene.add.image(0, 0, 'fx_muzzle');
    this.muzzleFlash.setOrigin(0, 0.5);
    this.muzzleFlash.setBlendMode(Phaser.BlendModes.ADD);
    this.muzzleFlash.setDepth(25);
    this.muzzleFlash.setVisible(false);

    this.hitSparkEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 55, max: 190 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 210,
      tint: [PALETTE.GOLD, PALETTE.NEON_PINK, PALETTE.NEON_CYAN, 0xffffff],
      emitting: false,
    });
    this.hitSparkEmitter.setDepth(26);

    this.shellEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 35, max: 85 },
      scale: { start: 0.9, end: 0.3 },
      alpha: { start: 0.95, end: 0 },
      lifespan: 340,
      tint: [PALETTE.GOLD, 0xfbbf24],
      emitting: false,
    });
    this.shellEmitter.setDepth(18);

    this.explosionEmitter = scene.add.particles(0, 0, 'pixel_spark', {
      speed: { min: 60, max: 260 },
      scale: { start: 2.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 480,
      tint: [PALETTE.WARNING_RED, PALETTE.GOLD, PALETTE.NEON_PINK, 0xffffff],
      emitting: false,
    });
    this.explosionEmitter.setDepth(27);
  }

  public getEquippedId(): WeaponId {
    return this.equippedId;
  }

  public isOwned(weaponId: WeaponId): boolean {
    return this.ownedIds.has(weaponId);
  }

  public getAmmo(weaponId: WeaponId): number {
    return this.ammoByWeapon[weaponId] ?? 0;
  }

  public tryFire(
    nowMs: number,
    player: Player,
    aimAngleRad: number,
    npcManager: NPCManager,
    policeManager: PoliceManager,
    onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void,
    overdriveActive = false
  ): boolean {
    const spec = WEAPON_SPECS[this.equippedId];
    const fireInterval = overdriveActive ? spec.fireIntervalMs * 0.56 : spec.fireIntervalMs;
    if (nowMs - this.lastFireAt < fireInterval) {
      return false;
    }

    if (!spec.infiniteAmmo && this.ammoByWeapon[this.equippedId] <= 0) {
      if (nowMs - this.lastEmptyClickAt > 300) {
        this.lastEmptyClickAt = nowMs;
        this.audioManager.playEmptyClick();
        this.equippedId = 'pistol';
        player.setWeaponVisual('pistol');
        this.emitTelemetry();
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${spec.shortName} 弹药耗尽，已切回脉冲手枪！`);
      }
      return false;
    }

    this.lastFireAt = nowMs;
    if (!spec.infiniteAmmo) {
      this.ammoByWeapon[this.equippedId] = Math.max(0, this.ammoByWeapon[this.equippedId] - 1);
      this.emitTelemetry();
    }

    const muzzle = player.getMuzzlePosition();

    // 1. Muzzle flash + additive pop
    this.muzzleFlash.setPosition(muzzle.x, muzzle.y);
    this.muzzleFlash.setRotation(aimAngleRad);
    this.muzzleFlash.setTint(overdriveActive ? PALETTE.GOLD : spec.colorNum);
    this.muzzleFlash.setScale((spec.id === 'shotgun' ? 1.35 : 0.95) * (overdriveActive ? 1.2 : 1));
    this.muzzleFlash.setVisible(true);
    this.muzzleTimer = 0.045;

    // 2. Shell casing ejection sideways
    const ejectAngle = aimAngleRad + Math.PI * 0.52;
    this.shellEmitter.emitParticleAt(
      muzzle.x + Math.cos(ejectAngle) * 4,
      muzzle.y + Math.sin(ejectAngle) * 4,
      spec.id === 'shotgun' ? 2 : 1
    );

    // 3. Shooter recoil kick & camera shake punch
    player.applyRecoilKick(spec.recoilPx);
    this.scene.cameras.main.shake(spec.id === 'shotgun' ? 95 : 48, spec.cameraShake);
    this.audioManager.playGunshot(spec.id);

    // 4. Spawn pellets
    const spreadRad = Phaser.Math.DegToRad(spec.spreadDeg);
    const pelletDamage = overdriveActive ? Math.round(spec.damage * 1.45) : spec.damage;
    for (let i = 0; i < spec.pellets; i++) {
      const offset =
        spec.pellets === 1
          ? (Math.random() - 0.5) * spreadRad
          : ((i / (spec.pellets - 1)) - 0.5) * spreadRad + (Math.random() - 0.5) * 0.04;
      const angle = aimAngleRad + offset;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      const sprite = this.scene.add.image(muzzle.x, muzzle.y, spec.projectileTexture);
      sprite.setDepth(24);
      sprite.setRotation(angle);

      this.projectiles.push({
        sprite,
        vx: dirX * spec.projectileSpeed,
        vy: dirY * spec.projectileSpeed,
        dirX,
        dirY,
        distanceLeft: spec.range,
        damage: pelletDamage,
        colorNum: overdriveActive ? PALETTE.GOLD : spec.colorNum,
        weaponId: spec.id,
      });
    }

    // 5. Public gunfire triggers nearby NPC panic & police attention
    npcManager.triggerAreaPanic(muzzle.x, muzzle.y, 195);
    const nearbyPolice = policeManager.isPoliceNearby(muzzle.x, muzzle.y, 440);
    if (nearbyPolice) {
      onCrime('weapon_discharge', muzzle, true);
    }

    return true;
  }

  public update(
    dtSeconds: number,
    player: Player,
    npcManager: NPCManager,
    policeManager: PoliceManager,
    vehicleManager: VehicleManager,
    trafficManager: TrafficManager,
    onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void,
    onCashBonus: (amount: number) => void,
    onHitstop: (durationSec: number) => void,
    hordeManager?: HordeManager
  ): void {
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dtSeconds;
      if (this.muzzleTimer <= 0) {
        this.muzzleFlash.setVisible(false);
      } else {
        const muzzle = player.getMuzzlePosition();
        this.muzzleFlash.setPosition(muzzle.x, muzzle.y);
      }
    }

    const npcs = npcManager.getNpcs();
    const policeUnits = policeManager.getUnits();
    const vehicles = vehicleManager.getVehicles();
    const trafficSprites = trafficManager.getCarSprites();
    const hordeEnemies = hordeManager?.isActive() ? hordeManager.getEnemies() : [];

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const stepX = p.vx * dtSeconds;
      const stepY = p.vy * dtSeconds;
      const stepDist = Math.hypot(stepX, stepY);

      p.sprite.x += stepX;
      p.sprite.y += stepY;
      p.distanceLeft -= stepDist;

      let hit = false;

      // 1. Walls, buildings & mountain cliffs stop bullets (rivers do not!)
      if (this.collisionManager.isPointBlockedByWall(p.sprite.x, p.sprite.y)) {
        this.spawnImpactRing(p.sprite.x, p.sprite.y, p.colorNum, 0.8);
        this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 5);
        this.audioManager.playWallPing();
        hit = true;
      }

      // 1.5 Hit Horde Enemies
      if (!hit && hordeManager && hordeEnemies.length > 0) {
        for (const enemy of hordeEnemies) {
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, enemy.x, enemy.y);
          if (dist <= enemy.radius + 5) {
            const res = hordeManager.damageEnemy(
              enemy,
              p.damage,
              p.dirX,
              p.dirY,
              p.weaponId === 'shotgun'
            );
            this.spawnImpactRing(
              p.sprite.x,
              p.sprite.y,
              enemy.isBoss ? PALETTE.GOLD : PALETTE.NEON_PINK,
              enemy.isBoss ? 1.25 : 1.0
            );
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, enemy.isBoss ? 10 : 7);
            this.audioManager.playImpactHit(p.weaponId === 'shotgun' || enemy.isBoss);
            this.spawnDamageText(
              enemy.x,
              enemy.y - enemy.radius - 4,
              res.killed ? `-${p.damage} 击破!` : `-${p.damage}`,
              res.killed ? PALETTE.GOLD_HEX : PALETTE.NEON_PINK_HEX
            );
            if (res.killed) {
              onCashBonus(res.cashDrop);
              if (enemy.isBoss) {
                this.triggerExplosion(enemy.x, enemy.y);
                onHitstop(0.055);
                gameEvents.emit(
                  GAME_EVENT.STATUS_TOAST,
                  `击毁【${enemy.name}】！赏金 +$${res.cashDrop} · 积分 +${res.scoreGained}`
                );
              } else {
                onHitstop(0.024);
              }
            }
            hit = true;
            break;
          }
        }
      }

      // 2. Hit NPCs
      if (!hit) {
        for (const npc of npcs) {
          if (npc.isIncapacitated()) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, npc.sprite.x, npc.sprite.y);
          if (dist <= 16) {
            const res = npc.takeHit(
              p.damage,
              p.dirX,
              p.dirY,
              p.weaponId === 'shotgun' ? 290 : 185
            );
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.NEON_PINK, 1.0);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 8);
            this.audioManager.playImpactHit(p.weaponId === 'shotgun');
            this.spawnDamageText(
              npc.sprite.x,
              npc.sprite.y - 14,
              res.killed ? `-${p.damage} 击倒!` : `-${p.damage}`,
              res.killed ? PALETTE.GOLD_HEX : PALETTE.NEON_PINK_HEX
            );
            onCrime('hit_pedestrian', { x: npc.sprite.x, y: npc.sprite.y }, true);

            if (res.killed) {
              onCashBonus(res.cashDrop);
              onHitstop(0.032);
              this.spawnDamageText(npc.sprite.x, npc.sprite.y - 28, `+$${res.cashDrop}`, PALETTE.GOLD_HEX);
            }
            hit = true;
            break;
          }
        }
      }

      // 3. Hit Police Cruisers
      if (!hit) {
        for (const unit of policeUnits) {
          if (unit.isDisabled()) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, unit.sprite.x, unit.sprite.y);
          if (dist <= 24) {
            const res = unit.takeHit(p.damage, p.dirX, p.dirY);
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 1.15);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 9);
            this.audioManager.playImpactHit(p.weaponId === 'shotgun');
            this.spawnDamageText(
              unit.sprite.x,
              unit.sprite.y - 18,
              `-${p.damage}`,
              PALETTE.GOLD_HEX
            );
            onCrime('assault_police', { x: unit.sprite.x, y: unit.sprite.y }, true);

            if (res.destroyed) {
              this.triggerExplosion(unit.sprite.x, unit.sprite.y);
              onCashBonus(res.cashBonus);
              onHitstop(0.05);
              this.spawnDamageText(
                unit.sprite.x,
                unit.sprite.y - 32,
                `瘫痪警车 +$${res.cashBonus}`,
                PALETTE.GOLD_HEX
              );
              gameEvents.emit(
                GAME_EVENT.STATUS_TOAST,
                `已瘫痪特区巡逻警车！获得赏金 +$${res.cashBonus}`
              );
            }
            hit = true;
            break;
          }
        }
      }

      // 4. Hit Parked/Drivable Vehicles or Traffic Cabs
      if (!hit) {
        for (const veh of vehicles) {
          if (veh.isOccupied()) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, veh.sprite.x, veh.sprite.y);
          if (dist <= 23) {
            veh.applyBulletHit(p.damage);
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 0.9);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 6);
            this.audioManager.playWallPing();
            hit = true;
            break;
          }
        }
      }

      if (!hit) {
        for (const carSprite of trafficSprites) {
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, carSprite.x, carSprite.y);
          if (dist <= 22) {
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 0.9);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 6);
            this.audioManager.playWallPing();
            carSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
            this.scene.time.delayedCall(55, () => {
              if (carSprite.active) carSprite.clearTint();
            });
            hit = true;
            break;
          }
        }
      }

      if (hit || p.distanceLeft <= 0) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private spawnImpactRing(x: number, y: number, tint: number, baseScale: number): void {
    const ring = this.scene.add.image(x, y, 'fx_hit_ring');
    ring.setTint(tint);
    ring.setScale(baseScale * 0.55);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    ring.setDepth(26);
    this.scene.tweens.add({
      targets: ring,
      scaleX: baseScale * 1.45,
      scaleY: baseScale * 1.45,
      alpha: 0,
      duration: 130,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private spawnDamageText(x: number, y: number, label: string, colorHex: string): void {
    const txt = this.scene.add.text(x + (Math.random() - 0.5) * 10, y, label, {
      fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: colorHex,
      stroke: '#080D18',
      strokeThickness: 3,
    });
    txt.setOrigin(0.5);
    txt.setDepth(30);
    txt.setScale(1.25);

    this.scene.tweens.add({
      targets: txt,
      y: y - 22,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  private triggerExplosion(x: number, y: number): void {
    this.explosionEmitter.emitParticleAt(x, y, 28);
    this.audioManager.playExplosion();
    this.scene.cameras.main.shake(220, 0.011);

    const shock = this.scene.add.circle(x, y, 10, PALETTE.GOLD, 0.25);
    shock.setStrokeStyle(3, PALETTE.WARNING_RED, 0.95);
    shock.setDepth(27);
    this.scene.tweens.add({
      targets: shock,
      radius: 48,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => shock.destroy(),
    });
  }

  public switchWeapon(slot: 'next' | 0 | 1 | 2, player: Player): void {
    if (slot === 'next') {
      const ownedList = WEAPON_ORDER.filter((id) => this.ownedIds.has(id));
      if (ownedList.length <= 1) return;
      const curIdx = ownedList.indexOf(this.equippedId);
      const nextId = ownedList[(curIdx + 1) % ownedList.length];
      this.equipWeapon(nextId, player, true);
      return;
    }

    const targetId = WEAPON_ORDER[slot];
    if (!targetId) return;
    if (!this.ownedIds.has(targetId)) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `尚未解锁【${WEAPON_SPECS[targetId].shortName}】，前往广场科技坊购买。`);
      return;
    }
    this.equipWeapon(targetId, player, true);
  }

  public equipWeapon(weaponId: WeaponId, player: Player, showToast = false): void {
    if (!this.ownedIds.has(weaponId)) return;
    this.equippedId = weaponId;
    player.setWeaponVisual(weaponId);
    this.audioManager.playUiConfirm();
    this.emitTelemetry();
    if (showToast) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `已切换武器：${WEAPON_SPECS[weaponId].name}`);
    }
  }

  public unlockAndEquipWeapon(weaponId: WeaponId, player: Player): void {
    const spec = WEAPON_SPECS[weaponId];
    this.ownedIds.add(weaponId);
    this.ammoByWeapon[weaponId] = Math.min(
      spec.maxAmmo,
      Math.max(spec.initialAmmo, this.ammoByWeapon[weaponId] ?? 0)
    );
    this.equippedId = weaponId;
    player.setWeaponVisual(weaponId);
    this.emitTelemetry();
  }

  public addAmmo(weaponId: WeaponId, amount: number): boolean {
    const spec = WEAPON_SPECS[weaponId];
    if (spec.infiniteAmmo || !this.ownedIds.has(weaponId)) return false;
    const current = this.ammoByWeapon[weaponId] ?? 0;
    if (current >= spec.maxAmmo) return false;
    this.ammoByWeapon[weaponId] = Math.min(spec.maxAmmo, current + amount);
    this.emitTelemetry();
    return true;
  }

  public emitTelemetry(): void {
    const spec = WEAPON_SPECS[this.equippedId];
    gameEvents.emit(GAME_EVENT.WEAPON_TELEMETRY, {
      equippedId: this.equippedId,
      name: spec.name,
      shortName: spec.shortName,
      colorHex: spec.colorHex,
      ammo: spec.infiniteAmmo ? 999 : this.ammoByWeapon[this.equippedId] ?? 0,
      infiniteAmmo: spec.infiniteAmmo,
      ownedIds: WEAPON_ORDER.filter((id) => this.ownedIds.has(id)),
      ammoByWeapon: { ...this.ammoByWeapon },
    });
  }

  public serialize(): SavedWeaponState {
    return {
      ownedIds: WEAPON_ORDER.filter((id) => this.ownedIds.has(id)),
      equippedId: this.equippedId,
      ammoByWeapon: { ...this.ammoByWeapon },
    };
  }

  public restore(saved: SavedWeaponState | undefined, player: Player): void {
    this.clearProjectiles();
    if (!saved) {
      this.resetToDefault(player);
      return;
    }

    const validOwned = new Set<WeaponId>(['pistol']);
    if (Array.isArray(saved.ownedIds)) {
      for (const id of saved.ownedIds) {
        if (id in WEAPON_SPECS) validOwned.add(id);
      }
    }
    this.ownedIds = validOwned;
    this.ammoByWeapon = {
      pistol: WEAPON_SPECS.pistol.initialAmmo,
      smg: Math.max(0, Math.min(WEAPON_SPECS.smg.maxAmmo, saved.ammoByWeapon?.smg ?? 0)),
      shotgun: Math.max(0, Math.min(WEAPON_SPECS.shotgun.maxAmmo, saved.ammoByWeapon?.shotgun ?? 0)),
    };
    this.equippedId =
      saved.equippedId && this.ownedIds.has(saved.equippedId) ? saved.equippedId : 'pistol';
    player.setWeaponVisual(this.equippedId);
    this.emitTelemetry();
  }

  public resetToDefault(player: Player): void {
    this.clearProjectiles();
    this.ownedIds = new Set<WeaponId>(['pistol']);
    this.equippedId = 'pistol';
    this.ammoByWeapon = {
      pistol: WEAPON_SPECS.pistol.initialAmmo,
      smg: 0,
      shotgun: 0,
    };
    player.setWeaponVisual('pistol');
    this.emitTelemetry();
  }

  public clearProjectiles(): void {
    this.muzzleFlash.setVisible(false);
    this.muzzleTimer = 0;
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];
  }

  public destroy(): void {
    this.clearProjectiles();
    this.muzzleFlash.destroy();
    this.hitSparkEmitter.destroy();
    this.shellEmitter.destroy();
    this.explosionEmitter.destroy();
  }
}
