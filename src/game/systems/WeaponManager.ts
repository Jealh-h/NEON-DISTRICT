import Phaser from 'phaser';
import {
  PALETTE,
  WEAPON_ORDER,
  WEAPON_SPECS,
  WEAPON_UPGRADE_CONFIG,
  WeaponId,
  WeaponUpgradeTrack,
} from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { GAME_EVENT, gameEvents, WeaponUpgradeLevels } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';
import type { HordeManager } from './HordeManager';
import type { InteractivePropManager } from './InteractivePropManager';
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
  pierceLeft: number;
  blastRadius: number;
  hitTargets: Set<object>;
}

export interface SavedWeaponState {
  ownedIds: WeaponId[];
  equippedId: WeaponId;
  ammoByWeapon: Partial<Record<WeaponId, number>>;
  upgradesByWeapon?: Partial<Record<WeaponId, Partial<WeaponUpgradeLevels>>>;
}

function createEmptyUpgradeLevels(): WeaponUpgradeLevels {
  return { damage: 0, firerate: 0, capacity: 0 };
}

function createDefaultAmmoMap(): Record<WeaponId, number> {
  return {
    pistol: WEAPON_SPECS.pistol.initialAmmo,
    smg: 0,
    shotgun: 0,
    rifle: 0,
    flamethrower: 0,
    railgun: 0,
    launcher: 0,
  };
}

function createDefaultUpgradesMap(): Record<WeaponId, WeaponUpgradeLevels> {
  return {
    pistol: createEmptyUpgradeLevels(),
    smg: createEmptyUpgradeLevels(),
    shotgun: createEmptyUpgradeLevels(),
    rifle: createEmptyUpgradeLevels(),
    flamethrower: createEmptyUpgradeLevels(),
    railgun: createEmptyUpgradeLevels(),
    launcher: createEmptyUpgradeLevels(),
  };
}

export class WeaponManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;

  private ownedIds = new Set<WeaponId>(['pistol']);
  private equippedId: WeaponId = 'pistol';
  private ammoByWeapon: Record<WeaponId, number> = createDefaultAmmoMap();
  private upgradesByWeapon: Record<WeaponId, WeaponUpgradeLevels> = createDefaultUpgradesMap();

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

  public getUpgrades(weaponId: WeaponId): WeaponUpgradeLevels {
    const lvls = this.upgradesByWeapon[weaponId];
    return lvls ? { ...lvls } : createEmptyUpgradeLevels();
  }

  public getEffectiveDamage(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    const dmgLvl = this.upgradesByWeapon[weaponId]?.damage ?? 0;
    return Math.round(spec.damage * (1 + dmgLvl * 0.2));
  }

  public getEffectiveFireInterval(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    const rateLvl = this.upgradesByWeapon[weaponId]?.firerate ?? 0;
    return Math.max(45, Math.round(spec.fireIntervalMs * Math.pow(0.88, rateLvl)));
  }

  public getEffectiveProjectileSpeed(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    const capLvl = this.upgradesByWeapon[weaponId]?.capacity ?? 0;
    return Math.round(spec.projectileSpeed * (1 + capLvl * 0.1));
  }

  public getEffectiveRange(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    const capLvl = this.upgradesByWeapon[weaponId]?.capacity ?? 0;
    return Math.round(spec.range * (1 + capLvl * 0.1));
  }

  public getEffectiveMaxAmmo(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    if (spec.infiniteAmmo) return 999;
    const capLvl = this.upgradesByWeapon[weaponId]?.capacity ?? 0;
    return Math.round(spec.maxAmmo * (1 + capLvl * 0.3));
  }

  public getEffectivePierceCount(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    const dmgLvl = this.upgradesByWeapon[weaponId]?.damage ?? 0;
    return (spec.pierceCount ?? 1) + (weaponId === 'railgun' && dmgLvl >= 2 ? 1 : 0);
  }

  public getEffectiveBlastRadius(weaponId: WeaponId): number {
    const spec = WEAPON_SPECS[weaponId];
    if (!spec.blastRadius) return 0;
    const dmgLvl = this.upgradesByWeapon[weaponId]?.damage ?? 0;
    return spec.blastRadius + dmgLvl * 16;
  }

  public getUpgradeCost(weaponId: WeaponId, track: WeaponUpgradeTrack): number {
    const spec = WEAPON_SPECS[weaponId];
    const cfg = WEAPON_UPGRADE_CONFIG[track];
    const currentLvl = this.upgradesByWeapon[weaponId]?.[track] ?? 0;
    if (currentLvl >= cfg.maxLevel) return 0;
    const raw = spec.upgradeBaseCost * cfg.costMultipliers[currentLvl];
    return Math.max(50, Math.round(raw / 5) * 5);
  }

  public upgradeWeapon(
    weaponId: WeaponId,
    track: WeaponUpgradeTrack
  ): { upgraded: boolean; newLevel: number } {
    if (!this.ownedIds.has(weaponId)) {
      return { upgraded: false, newLevel: 0 };
    }
    const cfg = WEAPON_UPGRADE_CONFIG[track];
    const lvls = this.upgradesByWeapon[weaponId];
    if (!lvls || lvls[track] >= cfg.maxLevel) {
      return { upgraded: false, newLevel: lvls?.[track] ?? 0 };
    }

    lvls[track] += 1;
    const spec = WEAPON_SPECS[weaponId];
    if (track === 'capacity' && !spec.infiniteAmmo) {
      const newMax = this.getEffectiveMaxAmmo(weaponId);
      const current = this.ammoByWeapon[weaponId] ?? 0;
      this.ammoByWeapon[weaponId] = Math.min(newMax, current + spec.ammoPackSize);
    }

    this.emitTelemetry();
    return { upgraded: true, newLevel: lvls[track] };
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
    const baseInterval = this.getEffectiveFireInterval(this.equippedId);
    const fireInterval = overdriveActive ? baseInterval * 0.56 : baseInterval;
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
    const flashScale =
      spec.id === 'railgun' || spec.id === 'launcher'
        ? 1.55
        : spec.id === 'shotgun'
          ? 1.35
          : spec.id === 'flamethrower'
            ? 1.15
            : 0.95;
    this.muzzleFlash.setScale(flashScale * (overdriveActive ? 1.2 : 1));
    this.muzzleFlash.setVisible(true);
    this.muzzleTimer = spec.id === 'flamethrower' ? 0.035 : 0.05;

    // 2. Shell casing ejection sideways (skip for energy/flame weapons)
    if (spec.id !== 'flamethrower' && spec.id !== 'railgun') {
      const ejectAngle = aimAngleRad + Math.PI * 0.52;
      this.shellEmitter.emitParticleAt(
        muzzle.x + Math.cos(ejectAngle) * 4,
        muzzle.y + Math.sin(ejectAngle) * 4,
        spec.id === 'shotgun' ? 2 : 1
      );
    }

    // 3. Shooter recoil kick & camera shake punch
    player.applyRecoilKick(spec.recoilPx);
    const shakeMs =
      spec.id === 'launcher'
        ? 145
        : spec.id === 'railgun'
          ? 120
          : spec.id === 'shotgun'
            ? 95
            : 45;
    this.scene.cameras.main.shake(shakeMs, spec.cameraShake);
    this.audioManager.playGunshot(spec.id);

    // 4. Spawn pellets with upgraded stats
    const spreadRad = Phaser.Math.DegToRad(spec.spreadDeg);
    const baseDmg = this.getEffectiveDamage(spec.id);
    const pelletDamage = overdriveActive ? Math.round(baseDmg * 1.45) : baseDmg;
    const projSpeed = this.getEffectiveProjectileSpeed(spec.id);
    const range = this.getEffectiveRange(spec.id);
    const pierceCount = this.getEffectivePierceCount(spec.id);
    const blastRadius = this.getEffectiveBlastRadius(spec.id);

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

      if (spec.id === 'flamethrower') {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
        sprite.setScale(0.65);
        this.scene.tweens.add({
          targets: sprite,
          scaleX: 1.95,
          scaleY: 1.95,
          alpha: 0.2,
          duration: 420,
          ease: 'Quad.easeOut',
        });
      } else if (spec.id === 'railgun') {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
        sprite.setScale(1.25, 1.15);
      }

      this.projectiles.push({
        sprite,
        vx: dirX * projSpeed,
        vy: dirY * projSpeed,
        dirX,
        dirY,
        distanceLeft: range,
        damage: pelletDamage,
        colorNum: overdriveActive ? PALETTE.GOLD : spec.colorNum,
        weaponId: spec.id,
        pierceLeft: pierceCount,
        blastRadius,
        hitTargets: new Set<object>(),
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
    hordeManager?: HordeManager,
    interactivePropManager?: InteractivePropManager,
    onPlayerDamaged?: (amount: number) => void
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

      let removeProjectile = false;

      const detonateRocket = () => {
        this.triggerRocketBlast(
          p.sprite.x,
          p.sprite.y,
          p,
          npcManager,
          policeManager,
          vehicleManager,
          trafficManager,
          hordeManager,
          interactivePropManager,
          onCrime,
          onCashBonus,
          onHitstop,
          onPlayerDamaged
        );
        removeProjectile = true;
      };

      // 1. Walls, buildings & mountain cliffs stop projectiles
      if (this.collisionManager.isPointBlockedByWall(p.sprite.x, p.sprite.y)) {
        if (p.blastRadius > 0) {
          detonateRocket();
        } else {
          this.spawnImpactRing(p.sprite.x, p.sprite.y, p.colorNum, 0.8);
          this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 5);
          this.audioManager.playWallPing();
          removeProjectile = true;
        }
      }

      // 1.25 Destructible Street Props (Fuel Barrels, Supply Crates, Fire Hydrants)
      if (
        !removeProjectile &&
        interactivePropManager &&
        interactivePropManager.checkBulletHit(p.sprite.x, p.sprite.y, p.damage, {
          npcManager,
          policeManager,
          hordeManager,
          onCrime,
          onDamagePlayer: (dmg) => onPlayerDamaged?.(dmg),
          onCashBonus,
        })
      ) {
        if (p.blastRadius > 0) {
          detonateRocket();
        } else {
          this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 0.95);
          p.pierceLeft -= 1;
          if (p.pierceLeft <= 0) removeProjectile = true;
        }
      }

      // 1.5 Hit Horde Enemies
      if (!removeProjectile && hordeManager && hordeEnemies.length > 0) {
        for (const enemy of hordeEnemies) {
          if (p.hitTargets.has(enemy)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, enemy.x, enemy.y);
          const hitPad = p.weaponId === 'flamethrower' ? 11 : 5;
          if (dist <= enemy.radius + hitPad) {
            p.hitTargets.add(enemy);
            if (p.blastRadius > 0) {
              detonateRocket();
              break;
            }
            const res = hordeManager.damageEnemy(
              enemy,
              p.damage,
              p.dirX,
              p.dirY,
              p.weaponId === 'shotgun' || p.weaponId === 'railgun'
            );
            this.spawnImpactRing(
              p.sprite.x,
              p.sprite.y,
              enemy.isBoss ? PALETTE.GOLD : p.colorNum,
              enemy.isBoss ? 1.25 : 1.0
            );
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, enemy.isBoss ? 10 : 7);
            this.audioManager.playImpactHit(
              p.weaponId === 'shotgun' || p.weaponId === 'railgun' || enemy.isBoss
            );
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
            p.pierceLeft -= 1;
            if (p.pierceLeft <= 0) {
              removeProjectile = true;
              break;
            }
          }
        }
      }

      // 2. Hit NPCs
      if (!removeProjectile) {
        for (const npc of npcs) {
          if (npc.isIncapacitated() || p.hitTargets.has(npc)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, npc.sprite.x, npc.sprite.y);
          const hitR = p.weaponId === 'flamethrower' ? 20 : 16;
          if (dist <= hitR) {
            p.hitTargets.add(npc);
            if (p.blastRadius > 0) {
              detonateRocket();
              break;
            }
            const res = npc.takeHit(
              p.damage,
              p.dirX,
              p.dirY,
              p.weaponId === 'shotgun' || p.weaponId === 'railgun' ? 290 : 185
            );
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.NEON_PINK, 1.0);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 8);
            this.audioManager.playImpactHit(p.weaponId === 'shotgun' || p.weaponId === 'railgun');
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
            p.pierceLeft -= 1;
            if (p.pierceLeft <= 0) {
              removeProjectile = true;
              break;
            }
          }
        }
      }

      // 3. Hit Police Cruisers
      if (!removeProjectile) {
        for (const unit of policeUnits) {
          if (unit.isDisabled() || p.hitTargets.has(unit)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, unit.sprite.x, unit.sprite.y);
          if (dist <= 24) {
            p.hitTargets.add(unit);
            if (p.blastRadius > 0) {
              detonateRocket();
              break;
            }
            const res = unit.takeHit(p.damage, p.dirX, p.dirY);
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 1.15);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 9);
            this.audioManager.playImpactHit(p.weaponId === 'shotgun' || p.weaponId === 'railgun');
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
            p.pierceLeft -= 1;
            if (p.pierceLeft <= 0) {
              removeProjectile = true;
              break;
            }
          }
        }
      }

      // 4. Hit Parked/Drivable Vehicles or Traffic Cabs
      if (!removeProjectile) {
        for (const veh of vehicles) {
          if (veh.isOccupied() || p.hitTargets.has(veh)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, veh.sprite.x, veh.sprite.y);
          if (dist <= 23) {
            p.hitTargets.add(veh);
            if (p.blastRadius > 0) {
              detonateRocket();
              break;
            }
            veh.applyBulletHit(p.damage);
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 0.9);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 6);
            this.audioManager.playWallPing();
            p.pierceLeft -= 1;
            if (p.pierceLeft <= 0) {
              removeProjectile = true;
              break;
            }
          }
        }
      }

      if (!removeProjectile) {
        for (const carSprite of trafficSprites) {
          if (p.hitTargets.has(carSprite)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, carSprite.x, carSprite.y);
          if (dist <= 22) {
            p.hitTargets.add(carSprite);
            if (p.blastRadius > 0) {
              detonateRocket();
              break;
            }
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 0.9);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 6);
            this.audioManager.playWallPing();
            carSprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
            this.scene.time.delayedCall(55, () => {
              if (carSprite.active) carSprite.clearTint();
            });
            p.pierceLeft -= 1;
            if (p.pierceLeft <= 0) {
              removeProjectile = true;
              break;
            }
          }
        }
      }

      if (!removeProjectile && p.distanceLeft <= 0) {
        if (p.blastRadius > 0) {
          detonateRocket();
        } else {
          removeProjectile = true;
        }
      }

      if (removeProjectile) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private triggerRocketBlast(
    bx: number,
    by: number,
    proj: ActiveProjectile,
    npcManager: NPCManager,
    policeManager: PoliceManager,
    vehicleManager: VehicleManager,
    _trafficManager: TrafficManager,
    hordeManager: HordeManager | undefined,
    interactivePropManager: InteractivePropManager | undefined,
    onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void,
    onCashBonus: (amount: number) => void,
    onHitstop: (durationSec: number) => void,
    onPlayerDamaged?: (amount: number) => void
  ): void {
    const radius = proj.blastRadius;
    this.triggerExplosion(bx, by, radius);
    onHitstop(0.042);

    if (interactivePropManager) {
      interactivePropManager.checkBulletHit(bx, by, proj.damage, {
        npcManager,
        policeManager,
        hordeManager,
        onCrime,
        onDamagePlayer: (dmg) => onPlayerDamaged?.(dmg),
        onCashBonus,
      });
    }

    if (hordeManager && hordeManager.isActive()) {
      for (const enemy of [...hordeManager.getEnemies()]) {
        const dist = Phaser.Math.Distance.Between(bx, by, enemy.x, enemy.y);
        if (dist <= radius + enemy.radius) {
          const falloff = Math.max(0.45, 1 - (dist / (radius + enemy.radius)) * 0.55);
          const dmg = Math.round(proj.damage * falloff);
          const angle = Math.atan2(enemy.y - by, enemy.x - bx);
          const res = hordeManager.damageEnemy(
            enemy,
            dmg,
            Math.cos(angle),
            Math.sin(angle),
            true
          );
          this.spawnDamageText(
            enemy.x,
            enemy.y - enemy.radius - 4,
            res.killed ? `-${dmg} 爆破!` : `-${dmg}`,
            res.killed ? PALETTE.GOLD_HEX : PALETTE.WARNING_RED_HEX
          );
          if (res.killed) {
            onCashBonus(res.cashDrop);
            if (enemy.isBoss) {
              this.triggerExplosion(enemy.x, enemy.y, 60);
              gameEvents.emit(
                GAME_EVENT.STATUS_TOAST,
                `火箭爆破击毁【${enemy.name}】！赏金 +$${res.cashDrop} · 积分 +${res.scoreGained}`
              );
            }
          }
        }
      }
    }

    for (const npc of npcManager.getNpcs()) {
      if (npc.isIncapacitated()) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, npc.sprite.x, npc.sprite.y);
      if (dist <= radius) {
        const falloff = Math.max(0.5, 1 - (dist / radius) * 0.5);
        const dmg = Math.round(proj.damage * falloff);
        const angle = Math.atan2(npc.sprite.y - by, npc.sprite.x - bx);
        const res = npc.takeHit(dmg, Math.cos(angle), Math.sin(angle), 320);
        this.spawnDamageText(npc.sprite.x, npc.sprite.y - 14, `-${dmg}`, PALETTE.WARNING_RED_HEX);
        onCrime('hit_pedestrian', { x: npc.sprite.x, y: npc.sprite.y }, true);
        if (res.killed) {
          onCashBonus(res.cashDrop);
        }
      }
    }

    for (const unit of policeManager.getUnits()) {
      if (unit.isDisabled()) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, unit.sprite.x, unit.sprite.y);
      if (dist <= radius + 16) {
        const falloff = Math.max(0.5, 1 - (dist / (radius + 16)) * 0.45);
        const dmg = Math.round(proj.damage * falloff);
        const angle = Math.atan2(unit.sprite.y - by, unit.sprite.x - bx);
        const res = unit.takeHit(dmg, Math.cos(angle), Math.sin(angle));
        this.spawnDamageText(unit.sprite.x, unit.sprite.y - 18, `-${dmg}`, PALETTE.GOLD_HEX);
        onCrime('assault_police', { x: unit.sprite.x, y: unit.sprite.y }, true);
        if (res.destroyed) {
          this.triggerExplosion(unit.sprite.x, unit.sprite.y);
          onCashBonus(res.cashBonus);
          gameEvents.emit(
            GAME_EVENT.STATUS_TOAST,
            `火箭爆破瘫痪警车！获得赏金 +$${res.cashBonus}`
          );
        }
      }
    }

    for (const veh of vehicleManager.getVehicles()) {
      if (veh.isOccupied()) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, veh.sprite.x, veh.sprite.y);
      if (dist <= radius + 16) {
        veh.applyBulletHit(Math.round(proj.damage * 0.75));
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

  private triggerExplosion(x: number, y: number, targetRadius = 48): void {
    this.explosionEmitter.emitParticleAt(x, y, targetRadius > 70 ? 40 : 28);
    this.audioManager.playExplosion();
    this.scene.cameras.main.shake(220, targetRadius > 70 ? 0.014 : 0.011);

    const shock = this.scene.add.circle(x, y, 12, PALETTE.GOLD, 0.25);
    shock.setStrokeStyle(3, PALETTE.WARNING_RED, 0.95);
    shock.setDepth(27);
    this.scene.tweens.add({
      targets: shock,
      radius: targetRadius,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => shock.destroy(),
    });
  }

  public switchWeapon(slot: 'next' | number, player: Player): void {
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
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `尚未解锁【${WEAPON_SPECS[targetId].shortName}】，按 B 打开随身军械终端购买。`
      );
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
    const maxAmmo = this.getEffectiveMaxAmmo(weaponId);
    this.ammoByWeapon[weaponId] = Math.min(
      maxAmmo,
      Math.max(spec.initialAmmo, this.ammoByWeapon[weaponId] ?? 0)
    );
    this.equippedId = weaponId;
    player.setWeaponVisual(weaponId);
    this.emitTelemetry();
  }

  public addAmmo(weaponId: WeaponId, amount: number): boolean {
    const spec = WEAPON_SPECS[weaponId];
    if (spec.infiniteAmmo || !this.ownedIds.has(weaponId)) return false;
    const maxAmmo = this.getEffectiveMaxAmmo(weaponId);
    const current = this.ammoByWeapon[weaponId] ?? 0;
    if (current >= maxAmmo) return false;
    this.ammoByWeapon[weaponId] = Math.min(maxAmmo, current + amount);
    this.emitTelemetry();
    return true;
  }

  public emitTelemetry(): void {
    const spec = WEAPON_SPECS[this.equippedId];
    const maxAmmoByWeapon = {} as Record<WeaponId, number>;
    const upgradesSnapshot = {} as Record<WeaponId, WeaponUpgradeLevels>;
    for (const id of WEAPON_ORDER) {
      maxAmmoByWeapon[id] = this.getEffectiveMaxAmmo(id);
      upgradesSnapshot[id] = { ...(this.upgradesByWeapon[id] ?? createEmptyUpgradeLevels()) };
    }

    gameEvents.emit(GAME_EVENT.WEAPON_TELEMETRY, {
      equippedId: this.equippedId,
      name: spec.name,
      shortName: spec.shortName,
      colorHex: spec.colorHex,
      ammo: spec.infiniteAmmo ? 999 : this.ammoByWeapon[this.equippedId] ?? 0,
      infiniteAmmo: spec.infiniteAmmo,
      ownedIds: WEAPON_ORDER.filter((id) => this.ownedIds.has(id)),
      ammoByWeapon: { ...this.ammoByWeapon },
      maxAmmoByWeapon,
      upgradesByWeapon: upgradesSnapshot,
    });
  }

  public serialize(): SavedWeaponState {
    const upgradesCopy: Partial<Record<WeaponId, WeaponUpgradeLevels>> = {};
    for (const id of WEAPON_ORDER) {
      upgradesCopy[id] = { ...(this.upgradesByWeapon[id] ?? createEmptyUpgradeLevels()) };
    }
    return {
      ownedIds: WEAPON_ORDER.filter((id) => this.ownedIds.has(id)),
      equippedId: this.equippedId,
      ammoByWeapon: { ...this.ammoByWeapon },
      upgradesByWeapon: upgradesCopy,
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

    this.upgradesByWeapon = createDefaultUpgradesMap();
    for (const id of WEAPON_ORDER) {
      const savedUp = saved.upgradesByWeapon?.[id];
      if (savedUp) {
        this.upgradesByWeapon[id] = {
          damage: Phaser.Math.Clamp(Math.floor(savedUp.damage ?? 0), 0, 3),
          firerate: Phaser.Math.Clamp(Math.floor(savedUp.firerate ?? 0), 0, 3),
          capacity: Phaser.Math.Clamp(Math.floor(savedUp.capacity ?? 0), 0, 3),
        };
      }
    }

    this.ammoByWeapon = createDefaultAmmoMap();
    for (const id of WEAPON_ORDER) {
      if (id === 'pistol') {
        this.ammoByWeapon.pistol = WEAPON_SPECS.pistol.initialAmmo;
      } else {
        const maxAmmo = this.getEffectiveMaxAmmo(id);
        this.ammoByWeapon[id] = Math.max(0, Math.min(maxAmmo, saved.ammoByWeapon?.[id] ?? 0));
      }
    }

    this.equippedId =
      saved.equippedId && this.ownedIds.has(saved.equippedId) ? saved.equippedId : 'pistol';
    player.setWeaponVisual(this.equippedId);
    this.emitTelemetry();
  }

  public resetToDefault(player: Player): void {
    this.clearProjectiles();
    this.ownedIds = new Set<WeaponId>(['pistol']);
    this.equippedId = 'pistol';
    this.ammoByWeapon = createDefaultAmmoMap();
    this.upgradesByWeapon = createDefaultUpgradesMap();
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
