import Phaser from 'phaser';
import { PALETTE, WANTED_CONFIG, WORLD_CONFIG } from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { Police, PoliceUnitKind } from '../entities/Police';
import { Vehicle } from '../entities/Vehicle';
import { GAME_EVENT, gameEvents, PoliceMapMarker } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from './AudioManager';
import { WantedManager } from './WantedManager';

const PATROL_LOOP_PLAZA = [
  { x: 896, y: 192 },
  { x: 1728, y: 192 },
  { x: 1728, y: 1344 },
  { x: 896, y: 1344 },
];

const PATROL_LOOP_TECH = [
  { x: 1728, y: 192 },
  { x: 3392, y: 192 },
  { x: 3392, y: 1344 },
  { x: 1728, y: 1344 },
];

const PATROL_LOOP_HARBOR_CHROME = [
  { x: 896, y: 2112 },
  { x: 2560, y: 2112 },
  { x: 2560, y: 2880 },
  { x: 896, y: 2880 },
];

const PATROL_LOOP_SKYPORT_RING = [
  { x: 2560, y: 1344 },
  { x: 4608, y: 1344 },
  { x: 4608, y: 2880 },
  { x: 2560, y: 2880 },
];

interface PoliceProjectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  damage: number;
  lifeMs: number;
}

interface VigilanteFugitive {
  sprite: Phaser.Physics.Arcade.Sprite;
  ring: Phaser.GameObjects.Arc;
  hp: number;
  maxHp: number;
  level: number;
  speed: number;
  angle: number;
  shootTimer: number;
  ramCooldown: number;
}

export class PoliceManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private audioManager: AudioManager;
  private wantedManager: WantedManager;
  private units: Police[] = [];
  private projectiles: PoliceProjectile[] = [];
  private losTimer = 0;
  private cachedSpotted = false;
  private pursuitEnabled = true;

  private fugitive: VigilanteFugitive | null = null;
  private vigilanteStreak = 0;
  private lastRamReportAt = 0;
  private unitRamCooldowns = new Map<string, number>();
  private onPlayerDamagedRef?: (amount: number, sourceX: number, sourceY: number) => void;
  private onBountyCashRef?: (cash: number) => void;

  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    audioManager: AudioManager,
    wantedManager: WantedManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.audioManager = audioManager;
    this.wantedManager = wantedManager;
  }

  public setPursuitEnabled(enabled: boolean): void {
    this.pursuitEnabled = enabled;
    for (const u of this.units) {
      if (enabled && u.minWantedStars === 0) {
        u.setUnitVisible(true);
        u.resetToPatrol();
      } else {
        u.setUnitVisible(false);
      }
    }
    if (!enabled) {
      this.clearProjectiles();
      this.clearVigilante();
      this.wantedManager.clearWanted(true);
    }
  }

  public spawnPoliceUnits(
    player: Player,
    vehicles: Vehicle[],
    onPlayerDamaged: (amount: number, sourceX: number, sourceY: number) => void,
    onBountyCash?: (cash: number) => void
  ): void {
    this.onPlayerDamagedRef = onPlayerDamaged;
    this.onBountyCashRef = onBountyCash;
    const unitDefs: Array<{
      id: string;
      loop: Array<{ x: number; y: number }>;
      startIdx: number;
      kind: PoliceUnitKind;
      minStars: number;
      flankSign: number;
    }> = [
      { id: 'police-1', loop: PATROL_LOOP_PLAZA, startIdx: 0, kind: 'cruiser', minStars: 0, flankSign: 0 },
      { id: 'police-2', loop: PATROL_LOOP_TECH, startIdx: 1, kind: 'cruiser', minStars: 0, flankSign: 1 },
      { id: 'police-3', loop: PATROL_LOOP_HARBOR_CHROME, startIdx: 0, kind: 'cruiser', minStars: 0, flankSign: -1 },
      { id: 'police-4', loop: PATROL_LOOP_SKYPORT_RING, startIdx: 2, kind: 'cruiser', minStars: 0, flankSign: 1 },
      { id: 'police-interceptor', loop: PATROL_LOOP_PLAZA, startIdx: 2, kind: 'interceptor', minStars: 3, flankSign: -1 },
      { id: 'police-heli', loop: PATROL_LOOP_TECH, startIdx: 0, kind: 'heli', minStars: 4, flankSign: 0 },
      { id: 'police-swat', loop: PATROL_LOOP_SKYPORT_RING, startIdx: 0, kind: 'swat', minStars: 5, flankSign: 1 },
      { id: 'police-tank', loop: PATROL_LOOP_HARBOR_CHROME, startIdx: 1, kind: 'tank', minStars: 5, flankSign: 0 },
    ];

    const groundGroup = this.scene.physics.add.group();

    for (const def of unitDefs) {
      const unit = new Police(
        this.scene,
        def.id,
        def.loop,
        def.startIdx,
        def.kind,
        def.minStars,
        def.flankSign
      );
      this.units.push(unit);

      if (def.minStars > 0) {
        unit.setUnitVisible(false);
      }

      if (!unit.isFlying()) {
        groundGroup.add(unit.sprite);
        this.collisionManager.registerVehicleWorldCollider(unit.sprite);

        this.scene.physics.add.collider(player.sprite, unit.sprite, () => {
          if (!this.pursuitEnabled || unit.isDisabled()) return;
          if (this.wantedManager.getWantedLevel() > 0) {
            unit.triggerRamRecovery();
            onPlayerDamaged(
              unit.unitKind === 'tank'
                ? WANTED_CONFIG.POLICE_CONTACT_DAMAGE_FOOT * 2
                : WANTED_CONFIG.POLICE_CONTACT_DAMAGE_FOOT,
              unit.sprite.x,
              unit.sprite.y
            );
          } else {
            this.audioManager.playBump(this.scene.time.now);
          }
        });
      }
    }

    for (const v of vehicles) {
      this.registerPlayerVehicle(v);
    }

    this.scene.physics.add.collider(groundGroup, groundGroup);
  }

  public registerPlayerVehicle(v: Vehicle): void {
    if (v.spec.isFlying) return;
    for (const unit of this.units) {
      if (unit.isFlying()) continue;
      this.scene.physics.add.collider(v.sprite, unit.sprite, () => {
        if (!this.pursuitEnabled || unit.isDisabled()) return;
        const vBody = v.sprite.body as Phaser.Physics.Arcade.Body;
        const pBody = unit.sprite.body as Phaser.Physics.Arcade.Body;
        const relSpeed = Math.max(vBody?.speed ?? 0, pBody?.speed ?? 0);
        const nowMs = this.scene.time.now;

        const lastUnitRam = this.unitRamCooldowns.get(unit.id) ?? 0;
        if (v.isOccupied() && relSpeed >= v.getRamSpeedThreshold() && nowMs - lastUnitRam >= 380) {
          this.unitRamCooldowns.set(unit.id, nowMs);
          unit.triggerRamRecovery();

          const dx = unit.sprite.x - v.sprite.x;
          const dy = unit.sprite.y - v.sprite.y;
          const dist = Math.hypot(dx, dy) || 1;
          const ramDmg = Math.round(relSpeed * 0.24 * v.getRamDamageMultiplier());
          const res = unit.takeHit(ramDmg, dx / dist, dy / dist);

          if (nowMs - this.lastRamReportAt > 1800) {
            this.lastRamReportAt = nowMs;
            this.wantedManager.reportCrime('ram_police', { x: v.sprite.x, y: v.sprite.y }, true);
          }

          this.audioManager.playCrash(nowMs, Math.min(1, relSpeed / 360));
          this.scene.cameras.main.shake(105, 0.004);

          if (res.destroyed) {
            const scorch = this.scene.add.image(unit.sprite.x, unit.sprite.y, 'fx_scorch').setDepth(6);
            this.scene.tweens.add({
              targets: scorch,
              alpha: 0,
              duration: 5000,
              onComplete: () => scorch.destroy(),
            });
            this.audioManager.playExplosion();
            this.onBountyCashRef?.(res.cashBonus);
            gameEvents.emit(GAME_EVENT.STATUS_TOAST, `撞毁特区警用载具！悬赏 +$${res.cashBonus}！`);
          }

          if (
            this.wantedManager.getWantedLevel() > 0 &&
            v.spec.type !== 'tank' &&
            v.spec.type !== 'swat'
          ) {
            const counterDmg = Math.max(
              4,
              Math.round(WANTED_CONFIG.POLICE_CONTACT_DAMAGE_VEH * (unit.unitKind === 'tank' ? 2.2 : 1))
            );
            this.onPlayerDamagedRef?.(counterDmg, unit.sprite.x, unit.sprite.y);
          }
        } else if (v.isOccupied() && relSpeed > 65) {
          this.audioManager.playBump(nowMs);
        }
      });
    }
  }

  public startVigilanteMission(playerPos: { x: number; y: number }): boolean {
    if (this.fugitive) {
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `治安追缉进行中（目标悬赏等级 Lv.${this.fugitive.level}）！按地图红金圈追踪拦截！`
      );
      return false;
    }

    this.vigilanteStreak += 1;
    const spawn = this.findSpawnPointAround(playerPos, 560, false);
    const maxHp = 180 + (this.vigilanteStreak - 1) * 55;
    const sprite = this.scene.physics.add.sprite(spawn.x, spawn.y, 'veh_racer');
    sprite.setDepth(21);
    sprite.setTint(0xff4545);
    sprite.setCollideWorldBounds(true);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14, (sprite.width - 28) / 2, (sprite.height - 28) / 2);
    body.setMass(240);
    body.pushable = false;
    this.collisionManager.registerVehicleWorldCollider(sprite);

    const ring = this.scene.add.circle(spawn.x, spawn.y, 26, 0xffd166, 0);
    ring.setStrokeStyle(2, 0xffd166, 0.9);
    ring.setDepth(20);

    this.fugitive = {
      sprite,
      ring,
      hp: maxHp,
      maxHp,
      level: this.vigilanteStreak,
      speed: Math.min(340, 230 + this.vigilanteStreak * 18),
      angle: Math.random() * Math.PI * 2,
      shootTimer: 1.5,
      ramCooldown: 0,
    };

    const reward = WANTED_CONFIG.VIGILANTE_BASE_REWARD + (this.vigilanteStreak - 1) * 80;
    this.audioManager.playWantedTriggered();
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `【治安追缉 Lv.${this.vigilanteStreak}】在逃通缉犯已标记！摧毁目标赏金 +$${reward}`
    );
    return true;
  }

  public damageVigilanteFugitive(
    damage: number,
    onRewardCash: (cash: number) => void
  ): boolean {
    if (!this.fugitive) return false;
    this.fugitive.hp = Math.max(0, this.fugitive.hp - damage);
    this.fugitive.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.fugitive?.sprite.active) {
        this.fugitive.sprite.setTint(0xff4545);
      }
    });
    if (this.fugitive.hp <= 0) {
      const fx = this.fugitive.sprite.x;
      const fy = this.fugitive.sprite.y;
      const reward = WANTED_CONFIG.VIGILANTE_BASE_REWARD + (this.fugitive.level - 1) * 80;
      const scorch = this.scene.add.image(fx, fy, 'fx_scorch').setDepth(6);
      this.scene.tweens.add({ targets: scorch, alpha: 0, duration: 4000, onComplete: () => scorch.destroy() });
      this.audioManager.playExplosion();
      this.audioManager.playMissionComplete();
      this.scene.cameras.main.shake(180, 0.007);
      onRewardCash(reward);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `成功击毁通缉犯 Lv.${this.fugitive.level}！治安赏金 +$${reward}（警车内再按 E 追捕下一名）`
      );
      this.clearVigilante();
      return true;
    }
    return false;
  }

  public getVigilanteSprite(): Phaser.Physics.Arcade.Sprite | null {
    return this.fugitive?.sprite ?? null;
  }

  public checkVehicleRamFugitive(
    vx: number,
    vy: number,
    speedPx: number,
    ramMult: number,
    onRewardCash: (cash: number) => void
  ): void {
    if (!this.fugitive || speedPx < 95 || this.fugitive.ramCooldown > 0) return;
    const dist = Phaser.Math.Distance.Between(vx, vy, this.fugitive.sprite.x, this.fugitive.sprite.y);
    if (dist <= 38) {
      this.fugitive.ramCooldown = 0.4;
      const ramDmg = Math.round(speedPx * 0.24 * ramMult);
      this.damageVigilanteFugitive(ramDmg, onRewardCash);
      this.audioManager.playCrash(this.scene.time.now, Math.min(1, speedPx / 360));
      this.scene.cameras.main.shake(95, 0.004);
    }
  }

  public getUnits(): Police[] {
    return this.units;
  }

  public isPoliceNearby(x: number, y: number, radius = 340): boolean {
    if (!this.pursuitEnabled) return false;
    for (const unit of this.units) {
      if (unit.isDisabled()) continue;
      if (Phaser.Math.Distance.Between(x, y, unit.sprite.x, unit.sprite.y) <= radius) {
        return true;
      }
    }
    return false;
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    playerInVehicle: boolean,
    onProjectileHitPlayer?: (damage: number, srcX: number, srcY: number) => void,
    sightMultiplier = 1,
    signalJamActive = false,
    playerVel?: { vx: number; vy: number }
  ): void {
    if (!this.pursuitEnabled) {
      return;
    }

    const wantedLevel = this.wantedManager.getWantedLevel();
    const speedMag = playerVel ? Math.hypot(playerVel.vx, playerVel.vy) : 0;
    const aheadBiasAngle = speedMag > 90 && playerVel ? Math.atan2(playerVel.vy, playerVel.vx) : undefined;

    // Activate or deactivate star-tiered reinforcements (3★ Interceptor, 4★ Heli, 5★ SWAT & Tank)
    for (const unit of this.units) {
      if (unit.minWantedStars === 0) continue;
      if (wantedLevel >= unit.minWantedStars) {
        if (!unit.isActiveOnMap() && unit.getState() !== 'DISABLED') {
          const spawn = this.findSpawnPointAround(playerPos, 560, unit.isFlying(), aheadBiasAngle);
          unit.deployNear(spawn.x, spawn.y);
        }
      } else if (unit.isActiveOnMap()) {
        unit.setUnitVisible(false);
      }
    }

    this.losTimer += dtSeconds;
    if (this.losTimer >= 0.16) {
      this.losTimer = 0;
      this.cachedSpotted =
        signalJamActive && wantedLevel <= 3
          ? false
          : this.evaluateLineOfSight(wantedLevel, playerPos, sightMultiplier);
    }

    if (wantedLevel === 0) {
      this.cachedSpotted = false;
      for (const unit of this.units) {
        if (!unit.isActiveOnMap()) continue;
        unit.setState('PATROL');
      }
    } else if (wantedLevel === 1) {
      let closestIdx = 0;
      let closestDist = Infinity;
      this.units.forEach((u, idx) => {
        if (!u.isActiveOnMap()) return;
        const d = Phaser.Math.Distance.Between(u.sprite.x, u.sprite.y, playerPos.x, playerPos.y);
        if (d < closestDist) {
          closestDist = d;
          closestIdx = idx;
        }
      });

      this.units.forEach((u, idx) => {
        if (u.isDisabled()) return;
        if (idx === closestIdx) {
          u.setState(this.cachedSpotted ? 'PURSUE' : 'SEARCH');
        } else {
          const canSee =
            !(signalJamActive && wantedLevel <= 3) &&
            this.canUnitSeePlayer(u, playerPos, WANTED_CONFIG.DETECT_RANGE * sightMultiplier);
          u.setState(canSee ? 'PURSUE' : 'PATROL');
        }
      });
    } else {
      for (const unit of this.units) {
        if (!unit.isActiveOnMap()) continue;
        unit.setState(this.cachedSpotted ? 'PURSUE' : 'SEARCH');
      }
    }

    const lastKnown = this.wantedManager.getLastKnownPos();
    const spawnProj = (sx: number, sy: number, angleRad: number, damage: number, speed: number) => {
      const sprite = this.scene.add.image(sx, sy, 'proj_enemy');
      sprite.setDepth(28);
      sprite.setRotation(angleRad);
      this.projectiles.push({
        sprite,
        vx: Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        damage,
        lifeMs: 1400,
      });
    };

    for (const unit of this.units) {
      unit.update(
        dtSeconds,
        playerPos,
        playerInVehicle,
        lastKnown,
        this.collisionManager,
        spawnProj,
        playerVel
      );
    }

    // Update Vigilante fugitive target
    if (this.fugitive) {
      const fg = this.fugitive;
      if (fg.ramCooldown > 0) fg.ramCooldown = Math.max(0, fg.ramCooldown - dtSeconds);
      const body = fg.sprite.body as Phaser.Physics.Arcade.Body;
      const awayAngle = Math.atan2(fg.sprite.y - playerPos.y, fg.sprite.x - playerPos.x);
      const dist = Phaser.Math.Distance.Between(fg.sprite.x, fg.sprite.y, playerPos.x, playerPos.y);
      const targetAngle = dist < 420 ? awayAngle : awayAngle + Math.PI * 0.45;
      const diff = Phaser.Math.Angle.Wrap(targetAngle - fg.angle);
      fg.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.4 * dtSeconds);
      if (this.collisionManager.isPointInsideBuilding(fg.sprite.x + Math.cos(fg.angle) * 52, fg.sprite.y + Math.sin(fg.angle) * 52, 16)) {
        fg.angle += 0.9;
      }
      fg.sprite.setRotation(fg.angle);
      fg.sprite.setDepth(19 + Math.min(8.4, Math.max(0, fg.sprite.y) * 0.0022));
      body.setVelocity(Math.cos(fg.angle) * fg.speed, Math.sin(fg.angle) * fg.speed);
      fg.ring.setPosition(fg.sprite.x, fg.sprite.y);

      fg.shootTimer -= dtSeconds;
      if (fg.shootTimer <= 0 && dist < 340) {
        fg.shootTimer = 1.25;
        const aim = Math.atan2(playerPos.y - fg.sprite.y, playerPos.x - fg.sprite.x);
        spawnProj(fg.sprite.x, fg.sprite.y, aim, 9, 390);
      }
    }

    // Update police/fugitive projectiles
    const dtMs = dtSeconds * 1000;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifeMs -= dtMs;
      p.sprite.x += p.vx * dtSeconds;
      p.sprite.y += p.vy * dtSeconds;

      const hitWall = this.collisionManager.isPointInsideBuilding(p.sprite.x, p.sprite.y, 4);
      const hitPlayer = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, playerPos.x, playerPos.y) <= (playerInVehicle ? 24 : 15);
      if (hitPlayer) {
        onProjectileHitPlayer?.(p.damage, p.sprite.x, p.sprite.y);
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      } else if (hitWall || p.lifeMs <= 0) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    const markers: PoliceMapMarker[] = this.units
      .filter((u) => !u.isDisabled())
      .map((u) => ({
        id: u.id,
        x: Math.round(u.sprite.x),
        y: Math.round(u.sprite.y),
        state: u.getState() === 'DISABLED' ? 'PATROL' : (u.getState() as 'PATROL' | 'PURSUE' | 'SEARCH'),
      }));

    if (this.fugitive) {
      markers.push({
        id: 'vigilante-target',
        x: Math.round(this.fugitive.sprite.x),
        y: Math.round(this.fugitive.sprite.y),
        state: 'PURSUE',
      });
    }

    this.wantedManager.update(dtSeconds, nowMs, this.cachedSpotted, playerPos, markers);
  }

  private findSpawnPointAround(
    center: { x: number; y: number },
    radius: number,
    allowWaterAndRoofs: boolean,
    biasAngle?: number
  ): { x: number; y: number } {
    for (let i = 0; i < 16; i++) {
      const spread = (i % 2 === 0 ? 1 : -1) * Math.floor((i + 1) / 2) * (Math.PI / 8);
      const ang = biasAngle !== undefined ? biasAngle + spread : (Math.PI * 2 * i) / 16 + Math.random() * 0.25;
      const tx = Phaser.Math.Clamp(center.x + Math.cos(ang) * radius, 80, WORLD_CONFIG.WIDTH - 80);
      const ty = Phaser.Math.Clamp(center.y + Math.sin(ang) * radius, 80, WORLD_CONFIG.HEIGHT - 80);
      if (allowWaterAndRoofs || this.collisionManager.isPointClearForEntity(tx, ty, 18)) {
        return { x: Math.round(tx), y: Math.round(ty) };
      }
    }
    return { x: 1312, y: 1344 };
  }

  private evaluateLineOfSight(
    wantedLevel: number,
    playerPos: { x: number; y: number },
    sightMultiplier = 1
  ): boolean {
    if (wantedLevel === 0) return false;

    const sightRange = (WANTED_CONFIG.LOS_BREAK_RANGE + wantedLevel * 24) * sightMultiplier;
    for (const unit of this.units) {
      if (unit.isDisabled()) continue;
      if (this.canUnitSeePlayer(unit, playerPos, sightRange)) {
        return true;
      }
    }
    return false;
  }

  private canUnitSeePlayer(
    unit: Police,
    playerPos: { x: number; y: number },
    maxRange: number
  ): boolean {
    if (unit.isDisabled()) return false;
    const dist = Phaser.Math.Distance.Between(unit.sprite.x, unit.sprite.y, playerPos.x, playerPos.y);
    if (dist > maxRange) return false;
    if (unit.isFlying()) return true;
    return this.collisionManager.hasLineOfSight(unit.sprite.x, unit.sprite.y, playerPos.x, playerPos.y);
  }

  public freezeAll(): void {
    for (const unit of this.units) {
      unit.freeze();
    }
  }

  private clearProjectiles(): void {
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];
  }

  private clearVigilante(): void {
    if (this.fugitive) {
      this.fugitive.sprite.destroy();
      this.fugitive.ring.destroy();
      this.fugitive = null;
    }
  }

  public destroy(): void {
    this.clearProjectiles();
    this.clearVigilante();
    for (const unit of this.units) {
      unit.destroy();
    }
    this.units = [];
  }
}
