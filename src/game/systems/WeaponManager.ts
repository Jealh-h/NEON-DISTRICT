import Phaser from 'phaser';
import {
  HORDE_GEAR_COSTS,
  MECH_SPECS,
  MechKind,
  PALETTE,
  WEAPON_ORDER,
  WEAPON_SPECS,
  WEAPON_UPGRADE_CONFIG,
  WeaponId,
  WeaponUpgradeTrack,
} from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { Vehicle } from '../entities/Vehicle';
import { GAME_EVENT, gameEvents, WeaponUpgradeLevels } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';
import type { HordeManager } from './HordeManager';
import type { InteractivePropManager } from './InteractivePropManager';
import { NPCManager } from './NPCManager';
import { PoliceManager } from './PoliceManager';
import type { ProgressionManager } from './ProgressionManager';
import type { RandomEventManager } from './RandomEventManager';
import type {
  SandboxExplorationManager,
  SandboxUpdateCallbacks,
} from './SandboxExplorationManager';
import type {
  TerrariaSandboxManager,
  TerrariaUpdateCallbacks,
} from './TerrariaSandboxManager';
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
  ignoreWalls?: boolean;
  isCrit?: boolean;
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
  private lastMountedFireAt = 0;
  private lastMechFireAt = 0;
  private autocannonSide = 0;
  private lastEmptyClickAt = 0;

  private muzzleFlash: Phaser.GameObjects.Image;
  private muzzleTimer = 0;
  private hitSparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private shellEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private progressionManager?: ProgressionManager;
  private hordeRef?: HordeManager;
  private randomEventManager?: RandomEventManager;
  private sandboxExplorationManager?: SandboxExplorationManager;
  private sandboxCallbacks?: SandboxUpdateCallbacks;
  private terrariaManager?: TerrariaSandboxManager;
  private terrariaCallbacks?: TerrariaUpdateCallbacks;
  private getPlayerHpRatio?: () => number;
  private onCombatKillBonus?: (healHp: number, healArmor: number, exp: number) => void;

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

  public configureIntegrations(opts: {
    progressionManager?: ProgressionManager;
    hordeManager?: HordeManager;
    randomEventManager?: RandomEventManager;
    sandboxExplorationManager?: SandboxExplorationManager;
    sandboxCallbacks?: SandboxUpdateCallbacks;
    terrariaManager?: TerrariaSandboxManager;
    terrariaCallbacks?: TerrariaUpdateCallbacks;
    getPlayerHpRatio?: () => number;
    onCombatKillBonus?: (healHp: number, healArmor: number, exp: number) => void;
  }): void {
    this.progressionManager = opts.progressionManager;
    this.hordeRef = opts.hordeManager;
    this.randomEventManager = opts.randomEventManager;
    this.sandboxExplorationManager = opts.sandboxExplorationManager;
    this.sandboxCallbacks = opts.sandboxCallbacks;
    this.terrariaManager = opts.terrariaManager;
    this.terrariaCallbacks = opts.terrariaCallbacks;
    this.getPlayerHpRatio = opts.getPlayerHpRatio;
    this.onCombatKillBonus = opts.onCombatKillBonus;
  }

  private isAuthorizedCombatZone(x: number, y: number): boolean {
    return Boolean(
      this.sandboxExplorationManager?.isPointNearOutpostCombat(x, y) ||
        this.randomEventManager?.isPointNearEvent(x, y) ||
        this.terrariaManager?.isPointNearCombatOrOre(x, y)
    );
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
    const muzzle = player.getMuzzlePosition();
    return this.firePlayerWeaponFromOrigin(
      nowMs,
      muzzle,
      aimAngleRad,
      npcManager,
      policeManager,
      onCrime,
      overdriveActive,
      player
    );
  }

  private firePlayerWeaponFromOrigin(
    nowMs: number,
    muzzle: { x: number; y: number },
    aimAngleRad: number,
    npcManager: NPCManager,
    policeManager: PoliceManager,
    onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void,
    overdriveActive: boolean,
    player?: Player
  ): boolean {
    const spec = WEAPON_SPECS[this.equippedId];
    const baseInterval = this.getEffectiveFireInterval(this.equippedId);
    const progRateMult = this.progressionManager?.getFireRateMultiplier() ?? 1;
    const hordeRateMult = this.hordeRef?.isActive() ? this.hordeRef.getFireRateMultiplier() : 1;
    const totalRateMult = progRateMult * hordeRateMult;
    const terrariaRateIntervalMult = this.terrariaManager?.getFireRateMultiplier() ?? 1;
    const fireInterval = Math.max(
      40,
      Math.round(((overdriveActive ? baseInterval * 0.56 : baseInterval) / totalRateMult) * terrariaRateIntervalMult)
    );
    if (nowMs - this.lastFireAt < fireInterval) {
      return false;
    }

    if (!spec.infiniteAmmo && this.ammoByWeapon[this.equippedId] <= 0) {
      if (nowMs - this.lastEmptyClickAt > 300) {
        this.lastEmptyClickAt = nowMs;
        this.audioManager.playEmptyClick();
        this.equippedId = 'pistol';
        player?.setWeaponVisual('pistol');
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
    player?.applyRecoilKick(spec.recoilPx);
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

    // 4. Spawn pellets with upgraded stats + progression & horde roguelite bonuses
    const spreadRad = Phaser.Math.DegToRad(spec.spreadDeg);
    const baseDmg = this.getEffectiveDamage(spec.id);
    const progDmgMult = this.progressionManager?.getWeaponDamageMultiplier() ?? 1;
    const hordeDmgMult = this.hordeRef?.isActive()
      ? this.hordeRef.getDamageMultiplier(this.getPlayerHpRatio ? this.getPlayerHpRatio() : 1)
      : 1;
    const critChance = this.progressionManager?.getCritChance() ?? 0;
    const isCrit = critChance > 0 && Math.random() < critChance;
    const critMult = isCrit ? 1.75 : 1;
    const pelletDamage = Math.round(
      baseDmg * (overdriveActive ? 1.45 : 1) * progDmgMult * hordeDmgMult * critMult
    );
    const hordeSpeedMult = this.hordeRef?.isActive() ? this.hordeRef.getProjectileSpeedMultiplier() : 1;
    const projSpeed = Math.round(this.getEffectiveProjectileSpeed(spec.id) * hordeSpeedMult);
    const range = this.getEffectiveRange(spec.id);
    const bonusPierce = this.hordeRef?.isActive() ? this.hordeRef.getBonusPierce() : 0;
    const pierceCount = this.getEffectivePierceCount(spec.id) + bonusPierce;
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
        colorNum: isCrit ? PALETTE.GOLD : overdriveActive ? PALETTE.GOLD : spec.colorNum,
        weaponId: spec.id,
        pierceLeft: pierceCount,
        blastRadius,
        isCrit,
        hitTargets: new Set<object>(),
      });
    }

    // 5. Public gunfire triggers nearby NPC panic & police attention (exempt when fighting Bosses/Outposts/Events or mining)
    npcManager.triggerAreaPanic(muzzle.x, muzzle.y, 175);
    const nearbyPolice = policeManager.isPoliceNearby(muzzle.x, muzzle.y, 260);
    if (nearbyPolice && !this.isAuthorizedCombatZone(muzzle.x, muzzle.y)) {
      onCrime('weapon_discharge', muzzle, true);
    }

    return true;
  }

  public tryFireVehicleWeapon(
    nowMs: number,
    vehicle: Vehicle,
    aimAngleRad: number,
    player: Player,
    npcManager: NPCManager,
    policeManager: PoliceManager,
    onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void,
    overdriveActive = false
  ): boolean {
    const kind = vehicle.spec.weaponKind;

    if (kind === 'tank_cannon') {
      const cd = overdriveActive ? 560 : 950;
      if (nowMs - this.lastMountedFireAt < cd) return false;
      this.lastMountedFireAt = nowMs;

      const angle = vehicle.getTurretAngle();
      const muzzle = vehicle.getTurretMuzzle();
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      this.muzzleFlash.setPosition(muzzle.x, muzzle.y);
      this.muzzleFlash.setRotation(angle);
      this.muzzleFlash.setTint(PALETTE.GOLD);
      this.muzzleFlash.setScale(2.1);
      this.muzzleFlash.setVisible(true);
      this.muzzleTimer = 0.08;

      this.scene.cameras.main.shake(175, 0.011);
      this.audioManager.playTankCannon();

      const sprite = this.scene.add.image(muzzle.x, muzzle.y, 'proj_tank_shell');
      sprite.setDepth(26);
      sprite.setRotation(angle);

      this.projectiles.push({
        sprite,
        vx: dirX * 880,
        vy: dirY * 880,
        dirX,
        dirY,
        distanceLeft: 740,
        damage: overdriveActive ? 300 : 220,
        colorNum: PALETTE.GOLD,
        weaponId: 'launcher',
        pierceLeft: 1,
        blastRadius: 135,
        hitTargets: new Set<object>(),
      });

      npcManager.triggerAreaPanic(muzzle.x, muzzle.y, 240);
      if (
        policeManager.isPoliceNearby(muzzle.x, muzzle.y, 320) &&
        !this.isAuthorizedCombatZone(muzzle.x, muzzle.y)
      ) {
        onCrime('weapon_discharge', muzzle, true);
      }
      return true;
    }

    if (kind === 'autocannon') {
      const cd = overdriveActive ? 68 : 105;
      if (nowMs - this.lastMountedFireAt < cd) return false;
      this.lastMountedFireAt = nowMs;

      const muzzles = vehicle.getAutocannonMuzzles();
      this.autocannonSide = (this.autocannonSide + 1) % muzzles.length;
      const muzzle = muzzles[this.autocannonSide];
      const angle = vehicle.sprite.rotation + (Math.random() - 0.5) * 0.06;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);

      this.muzzleFlash.setPosition(muzzle.x, muzzle.y);
      this.muzzleFlash.setRotation(angle);
      this.muzzleFlash.setTint(PALETTE.GOLD);
      this.muzzleFlash.setScale(1.25);
      this.muzzleFlash.setVisible(true);
      this.muzzleTimer = 0.04;

      this.scene.cameras.main.shake(45, 0.0025);
      this.audioManager.playGunshot('rifle');

      const sprite = this.scene.add.image(muzzle.x, muzzle.y, 'proj_heli_autocannon');
      sprite.setDepth(35);
      sprite.setRotation(angle);

      this.projectiles.push({
        sprite,
        vx: dirX * 1120,
        vy: dirY * 1120,
        dirX,
        dirY,
        distanceLeft: 640,
        damage: overdriveActive ? 54 : 38,
        colorNum: PALETTE.GOLD,
        weaponId: 'rifle',
        pierceLeft: 1,
        blastRadius: 0,
        ignoreWalls: true,
        hitTargets: new Set<object>(),
      });

      npcManager.triggerAreaPanic(muzzle.x, muzzle.y, 210);
      if (
        policeManager.isPoliceNearby(muzzle.x, muzzle.y, 310) &&
        !this.isAuthorizedCombatZone(muzzle.x, muzzle.y)
      ) {
        onCrime('weapon_discharge', muzzle, true);
      }
      return true;
    }

    // Standard drive-by shooting from cars/motos/buggies/swat
    const origin = {
      x: vehicle.sprite.x + Math.cos(aimAngleRad) * 18,
      y: vehicle.sprite.y + Math.sin(aimAngleRad) * 18,
    };
    return this.firePlayerWeaponFromOrigin(
      nowMs,
      origin,
      aimAngleRad,
      npcManager,
      policeManager,
      onCrime,
      overdriveActive,
      player
    );
  }

  public tryFireMechPrimary(
    nowMs: number,
    mechKind: MechKind,
    player: Player,
    aimAngleRad: number,
    overdriveActive = false
  ): boolean {
    const spec = MECH_SPECS[mechKind];
    const cd = overdriveActive ? Math.round(spec.fireIntervalMs * 0.6) : spec.fireIntervalMs;
    if (nowMs - this.lastMechFireAt < cd) return false;
    this.lastMechFireAt = nowMs;

    const muzzles = player.getMechDualMuzzles();
    const isPhantom = mechKind === 'phantom';
    const projTex = isPhantom ? 'proj_rail' : 'proj_mech_plasma';
    const colorNum = isPhantom ? PALETTE.NEON_CYAN : PALETTE.GOLD;

    this.muzzleFlash.setPosition(muzzles[0].x, muzzles[0].y);
    this.muzzleFlash.setRotation(aimAngleRad);
    this.muzzleFlash.setTint(colorNum);
    this.muzzleFlash.setScale(1.45);
    this.muzzleFlash.setVisible(true);
    this.muzzleTimer = 0.045;

    if (isPhantom) {
      this.audioManager.playGunshot('railgun');
      this.scene.cameras.main.shake(65, 0.0038);
    } else {
      this.audioManager.playMechPlasma();
      this.scene.cameras.main.shake(50, 0.003);
    }

    const mechMult =
      (this.progressionManager?.getMechAndTurretPowerMultiplier() ?? 1) *
      (this.hordeRef?.isActive() ? this.hordeRef.getMechAndTurretPowerMultiplier() : 1) *
      (this.hordeRef?.isActive() ? this.hordeRef.getDamageMultiplier(1) : 1);

    for (const muzzle of muzzles) {
      const spread = (Math.random() - 0.5) * (isPhantom ? 0.025 : 0.06);
      const ang = aimAngleRad + spread;
      const dirX = Math.cos(ang);
      const dirY = Math.sin(ang);
      const sprite = this.scene.add.image(muzzle.x, muzzle.y, projTex);
      sprite.setDepth(25);
      sprite.setRotation(ang);
      if (isPhantom) {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
      }

      this.projectiles.push({
        sprite,
        vx: dirX * spec.projectileSpeed,
        vy: dirY * spec.projectileSpeed,
        dirX,
        dirY,
        distanceLeft: spec.range,
        damage: Math.round((overdriveActive ? spec.damage * 1.4 : spec.damage) * mechMult),
        colorNum,
        weaponId: isPhantom ? 'railgun' : 'rifle',
        pierceLeft: isPhantom ? 3 : 1,
        blastRadius: 0,
        hitTargets: new Set<object>(),
      });
    }

    return true;
  }

  public triggerMechAbility(
    mechKind: MechKind,
    player: Player,
    aimAngleRad: number,
    hordeManager: HordeManager,
    onCashBonus: (amount: number) => void,
    onHitstop: (durationSec: number) => void
  ): boolean {
    if (!hordeManager.canUseMechAbility()) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '机甲战术技能冷却中...');
      return false;
    }

    hordeManager.markMechAbilityUsed();
    const pos = player.getPosition();

    if (mechKind === 'titan') {
      const fanAngles = [-0.28, -0.14, 0, 0.14, 0.28];
      this.audioManager.playGunshot('launcher');
      this.scene.cameras.main.shake(180, 0.009);
      for (const off of fanAngles) {
        const ang = aimAngleRad + off;
        const dirX = Math.cos(ang);
        const dirY = Math.sin(ang);
        const sx = pos.x + dirX * 22;
        const sy = pos.y + dirY * 22;
        const sprite = this.scene.add.image(sx, sy, 'proj_rocket').setDepth(26).setRotation(ang);
        this.projectiles.push({
          sprite,
          vx: dirX * 590,
          vy: dirY * 590,
          dirX,
          dirY,
          distanceLeft: 560,
          damage: 135,
          colorNum: PALETTE.WARNING_RED,
          weaponId: 'launcher',
          pierceLeft: 1,
          blastRadius: 120,
          hitTargets: new Set<object>(),
        });
      }
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '【泰坦机甲】发射 5 联肩部集束火箭齐射！');
      return true;
    }

    // Phantom Mech: 220px EMP Shockwave Ring
    const empRadius = 220;
    this.audioManager.playOrbitalStrike();
    this.scene.cameras.main.shake(210, 0.01);
    onHitstop(0.05);

    const ring = this.scene.add.circle(pos.x, pos.y, 18, PALETTE.NEON_CYAN, 0.28);
    ring.setStrokeStyle(4, PALETTE.NEON_CYAN, 0.98);
    ring.setDepth(28);
    this.scene.tweens.add({
      targets: ring,
      radius: empRadius,
      alpha: 0,
      duration: 340,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    let hits = 0;
    for (const enemy of [...hordeManager.getEnemies()]) {
      const dist = Phaser.Math.Distance.Between(pos.x, pos.y, enemy.x, enemy.y);
      if (dist <= empRadius + enemy.radius) {
        hits += 1;
        const ang = Math.atan2(enemy.y - pos.y, enemy.x - pos.x);
        const res = hordeManager.damageEnemy(enemy, 145, Math.cos(ang), Math.sin(ang), true);
        this.spawnDamageText(
          enemy.x,
          enemy.y - enemy.radius - 6,
          res.killed ? '-145 EMP击破!' : '-145 EMP!',
          PALETTE.NEON_CYAN_HEX
        );
        if (res.killed) onCashBonus(res.cashDrop);
      }
    }
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, `【幻影机甲】EMP 震荡脉冲冲击命中 ${hits} 个目标！`);
    return true;
  }

  public fireTurretBolt(sx: number, sy: number, angleRad: number): void {
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    const turretMult =
      (this.progressionManager?.getMechAndTurretPowerMultiplier() ?? 1) *
      (this.hordeRef?.isActive() ? this.hordeRef.getMechAndTurretPowerMultiplier() : 1);
    const sprite = this.scene.add.image(sx, sy, 'proj_cyan').setDepth(24).setRotation(angleRad);
    this.projectiles.push({
      sprite,
      vx: dirX * 1050,
      vy: dirY * 1050,
      dirX,
      dirY,
      distanceLeft: HORDE_GEAR_COSTS.TURRET_RANGE + 40,
      damage: Math.round(HORDE_GEAR_COSTS.TURRET_DAMAGE * turretMult),
      colorNum: PALETTE.NEON_CYAN,
      weaponId: 'rifle',
      pierceLeft: 1,
      blastRadius: 0,
      hitTargets: new Set<object>(),
    });
  }

  public triggerOrbitalStrike(
    centerPos: { x: number; y: number },
    npcManager: NPCManager,
    policeManager: PoliceManager,
    vehicleManager: VehicleManager,
    trafficManager: TrafficManager,
    hordeManager: HordeManager | undefined,
    interactivePropManager: InteractivePropManager | undefined,
    onCrime: (type: CrimeType, pos: { x: number; y: number }, hasWitness: boolean) => void,
    onCashBonus: (amount: number) => void,
    onHitstop: (durationSec: number) => void,
    onPlayerDamaged?: (amount: number) => void
  ): void {
    const targets: Array<{ x: number; y: number }> = [];
    const enemies = hordeManager?.isActive() ? [...hordeManager.getEnemies()] : [];
    enemies.sort((a, b) => (b.isBoss ? 1 : 0) - (a.isBoss ? 1 : 0));

    for (const e of enemies) {
      if (targets.length >= HORDE_GEAR_COSTS.ORBITAL_BEAM_COUNT) break;
      if (!targets.some((t) => Phaser.Math.Distance.Between(t.x, t.y, e.x, e.y) < 95)) {
        targets.push({ x: e.x, y: e.y });
      }
    }

    let fallbackIdx = 0;
    while (targets.length < HORDE_GEAR_COSTS.ORBITAL_BEAM_COUNT) {
      const ang = (Math.PI * 2 * fallbackIdx) / HORDE_GEAR_COSTS.ORBITAL_BEAM_COUNT + 0.35;
      fallbackIdx += 1;
      targets.push({
        x: centerPos.x + Math.cos(ang) * 165,
        y: centerPos.y + Math.sin(ang) * 165,
      });
    }

    this.audioManager.playOrbitalStrike();
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, '轨道离子支援已锁定！高能光束即将降临！');

    targets.forEach((pt, idx) => {
      const reticle = this.scene.add.circle(pt.x, pt.y, 46, PALETTE.WARNING_RED, 0.16);
      reticle.setStrokeStyle(2, PALETTE.NEON_CYAN, 0.95);
      reticle.setDepth(26);

      this.scene.time.delayedCall(480 + idx * 140, () => {
        if (reticle.active) reticle.destroy();
        const beam = this.scene.add.rectangle(pt.x, pt.y - 180, 32, 380, PALETTE.NEON_CYAN, 0.85);
        beam.setBlendMode(Phaser.BlendModes.ADD);
        beam.setDepth(36);
        this.scene.tweens.add({
          targets: beam,
          scaleX: 0.1,
          alpha: 0,
          duration: 280,
          onComplete: () => beam.destroy(),
        });

        const blastProxy: ActiveProjectile = {
          sprite: beam as unknown as Phaser.GameObjects.Image,
          vx: 0,
          vy: 0,
          dirX: 0,
          dirY: -1,
          distanceLeft: 0,
          damage: HORDE_GEAR_COSTS.ORBITAL_BEAM_DAMAGE,
          colorNum: PALETTE.NEON_CYAN,
          weaponId: 'launcher',
          pierceLeft: 1,
          blastRadius: HORDE_GEAR_COSTS.ORBITAL_BEAM_RADIUS,
          hitTargets: new Set<object>(),
        };

        this.triggerRocketBlast(
          pt.x,
          pt.y,
          blastProxy,
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
      });
    });
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

      // 1. Walls, buildings & mountain cliffs stop ground projectiles (gunship autocannons fire from above)
      if (!p.ignoreWalls && this.collisionManager.isPointBlockedByWall(p.sprite.x, p.sprite.y)) {
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

      // 1.35 Hit Random Event Actors (Sandbox Dynamic World Events)
      if (
        !removeProjectile &&
        this.randomEventManager &&
        this.randomEventManager.checkProjectileHit(
          p.sprite.x,
          p.sprite.y,
          p.damage,
          p.hitTargets,
          (tx, ty, killed, wasVehicle) => {
            if (p.blastRadius > 0) return;
            this.spawnImpactRing(tx, ty, wasVehicle ? PALETTE.GOLD : p.colorNum, wasVehicle ? 1.15 : 0.95);
            this.hitSparkEmitter.emitParticleAt(tx, ty, 8);
            this.audioManager.playImpactHit(wasVehicle || Boolean(p.isCrit));
            this.spawnDamageText(
              tx,
              ty - 18,
              killed ? `-${p.damage} 击破!` : p.isCrit ? `暴击 -${p.damage}!` : `-${p.damage}`,
              killed || p.isCrit ? PALETTE.GOLD_HEX : PALETTE.NEON_CYAN_HEX
            );
            if (killed) {
              this.onCombatKillBonus?.(
                this.progressionManager?.getKillHealAmount() ?? 0,
                0,
                wasVehicle ? 35 : 18
              );
              onHitstop(wasVehicle ? 0.045 : 0.025);
            }
          }
        )
      ) {
        if (p.blastRadius > 0) {
          detonateRocket();
        } else {
          p.pierceLeft -= 1;
          if (p.pierceLeft <= 0) removeProjectile = true;
        }
      }

      // 1.38 Hit Sandbox Gang Outpost Guards
      if (
        !removeProjectile &&
        this.sandboxExplorationManager &&
        this.sandboxCallbacks &&
        this.sandboxExplorationManager.checkProjectileHit(
          p.sprite.x,
          p.sprite.y,
          p.damage,
          p.hitTargets,
          this.sandboxCallbacks,
          (tx, ty, killed, isBoss) => {
            if (p.blastRadius > 0) return;
            this.spawnImpactRing(tx, ty, isBoss ? PALETTE.GOLD : p.colorNum, isBoss ? 1.2 : 0.95);
            this.hitSparkEmitter.emitParticleAt(tx, ty, isBoss ? 9 : 6);
            this.audioManager.playImpactHit(isBoss || Boolean(p.isCrit));
            this.spawnDamageText(
              tx,
              ty - 16,
              killed ? `-${p.damage} 击倒!` : p.isCrit ? `暴击 -${p.damage}` : `-${p.damage}`,
              killed || p.isCrit ? PALETTE.GOLD_HEX : PALETTE.NEON_PINK_HEX
            );
            if (killed) {
              this.onCombatKillBonus?.(
                this.progressionManager?.getKillHealAmount() ?? 0,
                0,
                isBoss ? 40 : 20
              );
              onHitstop(isBoss ? 0.045 : 0.022);
            }
          }
        )
      ) {
        if (p.blastRadius > 0) {
          detonateRocket();
        } else {
          p.pierceLeft -= 1;
          if (p.pierceLeft <= 0) removeProjectile = true;
        }
      }

      // 1.42 Hit Terraria Ore Veins & Summoned World Boss
      if (
        !removeProjectile &&
        this.terrariaManager &&
        this.terrariaCallbacks &&
        this.terrariaManager.checkProjectileHit(
          p.sprite.x,
          p.sprite.y,
          p.damage,
          p.hitTargets,
          this.terrariaCallbacks,
          (tx, ty, killed, isBoss, colorHex) => {
            if (p.blastRadius > 0) return;
            this.spawnImpactRing(tx, ty, isBoss ? PALETTE.GOLD : p.colorNum, isBoss ? 1.25 : 0.95);
            this.hitSparkEmitter.emitParticleAt(tx, ty, isBoss ? 9 : 6);
            this.audioManager.playImpactHit(isBoss || Boolean(p.isCrit));
            this.spawnDamageText(
              tx,
              ty - 16,
              killed && isBoss ? 'BOSS 击破!' : `-${p.damage}`,
              isBoss && p.isCrit ? PALETTE.GOLD_HEX : colorHex
            );
            if (this.terrariaManager?.hasCelestialLifesteal() && Math.random() < (isBoss ? 0.35 : 0.14)) {
              this.onCombatKillBonus?.(2, 0, 0);
            }
            if (killed && isBoss) {
              this.triggerExplosion(tx, ty, 78);
              onHitstop(0.055);
            }
          }
        )
      ) {
        if (p.blastRadius > 0) {
          detonateRocket();
        } else {
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
              p.weaponId === 'shotgun' || p.weaponId === 'railgun' || enemy.isBoss || Boolean(p.isCrit)
            );
            this.spawnDamageText(
              enemy.x,
              enemy.y - enemy.radius - 4,
              res.killed
                ? `-${p.damage} 击破!`
                : p.isCrit
                  ? `暴击 -${p.damage}`
                  : `-${p.damage}`,
              res.killed || p.isCrit ? PALETTE.GOLD_HEX : PALETTE.NEON_PINK_HEX
            );

            // Roguelite Arc Chain Lightning
            const arcStacks = hordeManager.getArcChainStacks();
            if (arcStacks > 0) {
              const arcDmg = Math.round(p.damage * (0.35 + arcStacks * 0.14));
              let jumps = 0;
              for (const other of [...hordeManager.getEnemies()]) {
                if (other === enemy || jumps >= 2) continue;
                const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
                if (d <= 150) {
                  jumps += 1;
                  const arcLine = this.scene.add
                    .line(0, 0, enemy.x, enemy.y, other.x, other.y, PALETTE.NEON_CYAN, 0.9)
                    .setOrigin(0, 0)
                    .setDepth(29);
                  this.scene.tweens.add({
                    targets: arcLine,
                    alpha: 0,
                    duration: 140,
                    onComplete: () => arcLine.destroy(),
                  });
                  const arcRes = hordeManager.damageEnemy(other, arcDmg, 0, 0, false);
                  this.spawnDamageText(other.x, other.y - 14, `⚡-${arcDmg}`, PALETTE.NEON_CYAN_HEX);
                  if (arcRes.killed) {
                    const cashGain = Math.round(arcRes.cashDrop * hordeManager.getCashDropMultiplier());
                    onCashBonus(cashGain);
                  }
                }
              }
            }

            if (res.killed) {
              const cashGain = Math.round(res.cashDrop * hordeManager.getCashDropMultiplier());
              onCashBonus(cashGain);
              const vamp = hordeManager.getVampiricStacks();
              const killHeal = (this.progressionManager?.getKillHealAmount() ?? 0) + vamp * 4;
              const killArmor = vamp * 2;
              this.onCombatKillBonus?.(killHeal, killArmor, enemy.isBoss ? 55 : 10);
              if (enemy.isBoss) {
                this.triggerExplosion(enemy.x, enemy.y);
                onHitstop(0.055);
                gameEvents.emit(
                  GAME_EVENT.STATUS_TOAST,
                  `击毁【${enemy.name}】！赏金 +$${cashGain} · 积分 +${res.scoreGained}`
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
              this.triggerExplosion(unit.sprite.x, unit.sprite.y, unit.unitKind === 'tank' ? 85 : 55);
              onCrime('destroy_police', { x: unit.sprite.x, y: unit.sprite.y }, true);
              onCashBonus(res.cashBonus);
              onHitstop(0.05);
              this.spawnDamageText(
                unit.sprite.x,
                unit.sprite.y - 32,
                `摧毁警备单位 +$${res.cashBonus}`,
                PALETTE.GOLD_HEX
              );
              gameEvents.emit(
                GAME_EVENT.STATUS_TOAST,
                `已瘫痪特区警备单位！获得赏金 +$${res.cashBonus}`
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

      // 3.5 Hit Vigilante Fugitive Target
      if (!removeProjectile) {
        const vigilante = policeManager.getVigilanteSprite();
        if (vigilante && vigilante.active && !p.hitTargets.has(vigilante)) {
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, vigilante.x, vigilante.y);
          if (dist <= 24) {
            p.hitTargets.add(vigilante);
            if (p.blastRadius > 0) {
              detonateRocket();
            } else {
              const killed = policeManager.damageVigilanteFugitive(p.damage, onCashBonus);
              this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 1.15);
              this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 9);
              this.audioManager.playImpactHit(p.weaponId === 'shotgun' || p.weaponId === 'railgun');
              this.spawnDamageText(
                vigilante.x,
                vigilante.y - 18,
                killed ? '击毁通缉犯!' : `-${p.damage}`,
                PALETTE.GOLD_HEX
              );
              if (killed) onHitstop(0.05);
              p.pierceLeft -= 1;
              if (p.pierceLeft <= 0) removeProjectile = true;
            }
          }
        }
      }

      // 4. Hit Parked/Drivable Vehicles or Traffic Cabs
      if (!removeProjectile) {
        for (const veh of vehicles) {
          if (veh.isOccupied() || veh.isDestroyed() || p.hitTargets.has(veh)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, veh.sprite.x, veh.sprite.y);
          if (dist <= 24) {
            p.hitTargets.add(veh);
            if (p.blastRadius > 0) {
              detonateRocket();
              break;
            }
            const killed = veh.applyBulletHit(p.damage);
            this.spawnImpactRing(p.sprite.x, p.sprite.y, PALETTE.GOLD, 0.9);
            this.hitSparkEmitter.emitParticleAt(p.sprite.x, p.sprite.y, 6);
            this.audioManager.playWallPing();
            if (killed) {
              veh.forceCheckDestruction((dVeh) => {
                this.triggerExplosion(dVeh.sprite.x, dVeh.sprite.y, 88);
                onHitstop(0.05);
              });
            }
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
    _trafficManager.notifyDisturbance(bx, by, radius + 220);
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

    if (this.randomEventManager) {
      this.randomEventManager.applyBlastDamage(bx, by, radius, proj.damage, (tx, ty, killed) => {
        this.spawnDamageText(tx, ty - 18, killed ? '爆破击破!' : `-${proj.damage}`, PALETTE.GOLD_HEX);
        if (killed) {
          this.onCombatKillBonus?.(this.progressionManager?.getKillHealAmount() ?? 0, 0, 22);
        }
      });
    }

    if (this.sandboxExplorationManager && this.sandboxCallbacks) {
      this.sandboxExplorationManager.applyBlastDamage(
        bx,
        by,
        radius,
        proj.damage,
        this.sandboxCallbacks
      );
    }

    if (this.terrariaManager && this.terrariaCallbacks) {
      this.terrariaManager.applyBlastDamage(bx, by, radius, proj.damage, this.terrariaCallbacks);
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
          this.triggerExplosion(unit.sprite.x, unit.sprite.y, unit.unitKind === 'tank' ? 85 : 55);
          onCrime('destroy_police', { x: unit.sprite.x, y: unit.sprite.y }, true);
          onCashBonus(res.cashBonus);
          gameEvents.emit(
            GAME_EVENT.STATUS_TOAST,
            `爆破瘫痪警备单位！获得赏金 +$${res.cashBonus}`
          );
        }
      }
    }

    const vigilante = policeManager.getVigilanteSprite();
    if (vigilante && vigilante.active) {
      const dist = Phaser.Math.Distance.Between(bx, by, vigilante.x, vigilante.y);
      if (dist <= radius + 18) {
        const falloff = Math.max(0.5, 1 - (dist / (radius + 18)) * 0.45);
        const dmg = Math.round(proj.damage * falloff);
        policeManager.damageVigilanteFugitive(dmg, onCashBonus);
        this.spawnDamageText(vigilante.x, vigilante.y - 18, `-${dmg}`, PALETTE.GOLD_HEX);
      }
    }

    for (const veh of vehicleManager.getVehicles()) {
      if (veh.isOccupied() || veh.isDestroyed()) continue;
      const dist = Phaser.Math.Distance.Between(bx, by, veh.sprite.x, veh.sprite.y);
      if (dist <= radius + 16) {
        const killed = veh.applyBulletHit(Math.round(proj.damage * 0.75));
        if (killed) {
          veh.forceCheckDestruction((dVeh) => {
            this.triggerExplosion(dVeh.sprite.x, dVeh.sprite.y, 88);
          });
        }
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
