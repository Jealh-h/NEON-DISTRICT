import Phaser from 'phaser';
import { PALETTE, WORLD_CONFIG } from '../config/BalanceConfig';
import {
  RANDOM_EVENT_SPECS,
  RandomEventSpec,
  RandomEventType,
  ReputationFactionId,
} from '../config/ExpansionConfig';
import { GAME_EVENT, gameEvents, RandomEventMarker } from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { DistrictData, DistrictManager } from '../world/DistrictManager';
import { AudioManager } from './AudioManager';
import { PickupManager } from './PickupManager';

interface EventActor {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  hpBg: Phaser.GameObjects.Rectangle;
  hpFill: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  damage: number;
  isVehicle: boolean;
  angle: number;
  shootCooldown: number;
  ramCooldown: number;
}

interface EventProjectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  lifeMs: number;
  damage: number;
}

interface ActiveRandomEvent {
  id: string;
  spec: RandomEventSpec;
  district: string;
  x: number;
  y: number;
  timeRemainingSec: number;
  totalTargets: number;
  actors: EventActor[];
  beaconRing: Phaser.GameObjects.Arc;
  activatedToastShown: boolean;
}

export interface RandomEventCompletionReward {
  title: string;
  cash: number;
  exp: number;
  repRewards: Partial<Record<ReputationFactionId, number>>;
  type: RandomEventType;
  pos: { x: number; y: number };
}

export class RandomEventManager {
  private scene: Phaser.Scene;
  private collisionManager: CollisionManager;
  private districtManager: DistrictManager;
  private districtData: DistrictData;
  private audioManager: AudioManager;
  private pickupManager: PickupManager;

  private activeEvents: ActiveRandomEvent[] = [];
  private projectiles: EventProjectile[] = [];
  private eventSeq = 0;
  private spawnCooldownSec = 10; // First dynamic event pops quickly so city feels alive
  private lastEmitAt = 0;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    collisionManager: CollisionManager,
    districtManager: DistrictManager,
    districtData: DistrictData,
    audioManager: AudioManager,
    pickupManager: PickupManager
  ) {
    this.scene = scene;
    this.collisionManager = collisionManager;
    this.districtManager = districtManager;
    this.districtData = districtData;
    this.audioManager = audioManager;
    this.pickupManager = pickupManager;
  }

  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (!enabled) {
      this.clearAll();
      this.emitTelemetry(true);
    } else {
      this.spawnCooldownSec = 9;
    }
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    playerPos: { x: number; y: number },
    onPlayerDamaged: (amount: number) => void,
    onEventCompleted: (reward: RandomEventCompletionReward) => void
  ): void {
    if (!this.enabled) return;

    // Spawn new event up to 2 concurrent
    if (this.activeEvents.length < 2) {
      this.spawnCooldownSec -= dtSeconds;
      if (this.spawnCooldownSec <= 0) {
        this.trySpawnWeightedEvent(playerPos);
        this.spawnCooldownSec = this.activeEvents.length === 0 ? 28 : 44;
      }
    }

    // Update each active event
    for (let i = this.activeEvents.length - 1; i >= 0; i--) {
      const ev = this.activeEvents[i];
      ev.timeRemainingSec -= dtSeconds;

      // Pulse beacon ring
      const pulse = 1 + Math.sin(nowMs * 0.006) * 0.14;
      ev.beaconRing.setScale(pulse);

      // Keep anchor synced to lead actor for moving events
      if (ev.actors.length > 0) {
        ev.x = Math.round(ev.actors[0].x);
        ev.y = Math.round(ev.actors[0].y);
        ev.beaconRing.setPosition(ev.x, ev.y);
      }

      const distToEvent = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, ev.x, ev.y);
      if (!ev.activatedToastShown && distToEvent < 260) {
        ev.activatedToastShown = true;
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `接近突发事件【${ev.spec.title}】：${ev.spec.description}`
        );
      }

      // AI update for actors
      for (const actor of ev.actors) {
        if (actor.shootCooldown > 0) actor.shootCooldown -= dtSeconds;
        if (actor.ramCooldown > 0) actor.ramCooldown -= dtSeconds;

        const distPlayer = Phaser.Math.Distance.Between(actor.x, actor.y, playerPos.x, playerPos.y);
        const toPlayer = Math.atan2(playerPos.y - actor.y, playerPos.x - actor.x);

        if (actor.isVehicle) {
          // Moving vehicle (armored van, military convoy, or runaway bounty racer)
          const wantFlee = ev.spec.type === 'bounty_hunt' && distPlayer < 360;
          const desiredAngle = wantFlee ? toPlayer + Math.PI : actor.angle;
          const diff = Phaser.Math.Angle.Wrap(desiredAngle - actor.angle);
          actor.angle += Math.sign(diff) * Math.min(Math.abs(diff), 1.5 * dtSeconds);

          const lookX = actor.x + Math.cos(actor.angle) * 44;
          const lookY = actor.y + Math.sin(actor.angle) * 44;
          if (!this.collisionManager.isPointClearForEntity(lookX, lookY, actor.radius + 4)) {
            actor.angle += 0.95 * (Math.random() > 0.5 ? 1 : -1);
          } else {
            const nx = actor.x + Math.cos(actor.angle) * actor.speed * dtSeconds;
            const ny = actor.y + Math.sin(actor.angle) * actor.speed * dtSeconds;
            if (this.collisionManager.isPointClearForEntity(nx, ny, actor.radius)) {
              actor.x = nx;
              actor.y = ny;
            } else {
              actor.angle += 1.25;
            }
          }
          actor.sprite.setPosition(actor.x, actor.y).setRotation(actor.angle);

          if (distPlayer < 360 && actor.shootCooldown <= 0) {
            actor.shootCooldown = ev.spec.type === 'military_convoy' ? 1.15 : 1.45;
            this.fireEnemyBolt(actor.x, actor.y, toPlayer, actor.damage);
          }
        } else {
          // On-foot gangster / cyber psycho
          actor.sprite.setRotation(toPlayer);
          if (distPlayer < 410) {
            const desiredDist = ev.spec.type === 'cyber_psycho' ? 115 : 165;
            const moveDir = distPlayer > desiredDist ? 1 : distPlayer < 85 ? -0.5 : 0;
            if (moveDir !== 0) {
              const tryAngle = moveDir > 0 ? toPlayer : toPlayer + Math.PI;
              const step = actor.speed * Math.abs(moveDir) * dtSeconds;
              for (const off of [0, 0.6, -0.6, 1.2, -1.2]) {
                const nx = actor.x + Math.cos(tryAngle + off) * step;
                const ny = actor.y + Math.sin(tryAngle + off) * step;
                if (this.collisionManager.isPointClearForEntity(nx, ny, actor.radius)) {
                  actor.x = nx;
                  actor.y = ny;
                  break;
                }
              }
              actor.sprite.setPosition(actor.x, actor.y);
            }

            if (distPlayer < 360 && actor.shootCooldown <= 0) {
              if (this.collisionManager.hasLineOfSight(actor.x, actor.y, playerPos.x, playerPos.y)) {
                actor.shootCooldown = ev.spec.type === 'cyber_psycho' ? 0.9 : 1.55 + Math.random() * 0.4;
                this.fireEnemyBolt(actor.x, actor.y, toPlayer + (Math.random() - 0.5) * 0.14, actor.damage);
              }
            }
          }
        }

        // Sync HP bar above actor
        const barY = actor.y - actor.radius - 10;
        actor.hpBg.setPosition(actor.x, barY);
        actor.hpFill.setPosition(actor.x - 13, barY);
        const ratio = Math.max(0, Math.min(1, actor.hp / actor.maxHp));
        actor.hpFill.setSize(26 * ratio, 3);
      }

      // Check completion or timeout
      if (ev.actors.length === 0) {
        const reward: RandomEventCompletionReward = {
          title: ev.spec.title,
          cash: ev.spec.cashReward,
          exp: ev.spec.expReward,
          repRewards: ev.spec.repRewards,
          type: ev.spec.type,
          pos: { x: ev.x, y: ev.y },
        };
        this.destroyEventVisuals(ev);
        this.activeEvents.splice(i, 1);
        this.audioManager.playMissionComplete();
        onEventCompleted(reward);
        this.emitTelemetry(true, nowMs);
        continue;
      }

      if (ev.timeRemainingSec <= 0) {
        this.destroyEventVisuals(ev);
        this.activeEvents.splice(i, 1);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `突发事件【${ev.spec.title}】已结束。`);
        this.emitTelemetry(true, nowMs);
      }
    }

    // Update event projectiles
    const dtMs = dtSeconds * 1000;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifeMs -= dtMs;
      p.sprite.x += p.vx * dtSeconds;
      p.sprite.y += p.vy * dtSeconds;

      const hitWall = this.collisionManager.isPointBlockedByWall(p.sprite.x, p.sprite.y);
      const hitPlayer = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, playerPos.x, playerPos.y) <= 18;
      if (hitPlayer) {
        onPlayerDamaged(p.damage);
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      } else if (hitWall || p.lifeMs <= 0) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    this.emitTelemetry(false, nowMs);
  }

  public checkProjectileHit(
    px: number,
    py: number,
    damage: number,
    hitTargets: Set<object>,
    onActorHitFeedback?: (x: number, y: number, killed: boolean, wasVehicle: boolean) => void
  ): boolean {
    if (!this.enabled || this.activeEvents.length === 0) return false;

    for (const ev of this.activeEvents) {
      for (let j = ev.actors.length - 1; j >= 0; j--) {
        const actor = ev.actors[j];
        if (hitTargets.has(actor)) continue;
        const dist = Phaser.Math.Distance.Between(px, py, actor.x, actor.y);
        if (dist <= actor.radius + 7) {
          hitTargets.add(actor);
          const killed = this.applyDamageToActor(ev, j, damage);
          onActorHitFeedback?.(actor.x, actor.y, killed, actor.isVehicle);
          return true;
        }
      }
    }
    return false;
  }

  public applyBlastDamage(
    bx: number,
    by: number,
    radius: number,
    damage: number,
    onActorHitFeedback?: (x: number, y: number, killed: boolean, wasVehicle: boolean) => void
  ): void {
    if (!this.enabled || this.activeEvents.length === 0) return;

    for (const ev of this.activeEvents) {
      for (let j = ev.actors.length - 1; j >= 0; j--) {
        const actor = ev.actors[j];
        const dist = Phaser.Math.Distance.Between(bx, by, actor.x, actor.y);
        if (dist <= radius + actor.radius) {
          const falloff = Math.max(0.45, 1 - (dist / (radius + actor.radius)) * 0.5);
          const dmg = Math.round(damage * falloff);
          const killed = this.applyDamageToActor(ev, j, dmg);
          onActorHitFeedback?.(actor.x, actor.y, killed, actor.isVehicle);
        }
      }
    }
  }

  public isPointNearEvent(x: number, y: number, radius = 260): boolean {
    if (!this.enabled || this.activeEvents.length === 0) return false;
    for (const ev of this.activeEvents) {
      if (Phaser.Math.Distance.Between(x, y, ev.x, ev.y) <= radius) {
        return true;
      }
      for (const actor of ev.actors) {
        if (Phaser.Math.Distance.Between(x, y, actor.x, actor.y) <= radius) {
          return true;
        }
      }
    }
    return false;
  }

  public getTurretTargets(): Array<{ x: number; y: number; damage: (amount: number) => boolean }> {
    if (!this.enabled || this.activeEvents.length === 0) return [];
    const results: Array<{ x: number; y: number; damage: (amount: number) => boolean }> = [];
    for (const ev of this.activeEvents) {
      for (const actor of ev.actors) {
        if (!actor.sprite.active) continue;
        results.push({
          x: actor.x,
          y: actor.y,
          damage: (amount: number) => {
            const idx = ev.actors.indexOf(actor);
            if (idx === -1) return false;
            return this.applyDamageToActor(ev, idx, amount);
          },
        });
      }
    }
    return results;
  }

  public checkVehicleRam(vx: number, vy: number, speedPx: number): void {
    if (!this.enabled || speedPx < 130) return;
    for (const ev of this.activeEvents) {
      for (let j = ev.actors.length - 1; j >= 0; j--) {
        const actor = ev.actors[j];
        if (actor.ramCooldown > 0) continue;
        const dist = Phaser.Math.Distance.Between(vx, vy, actor.x, actor.y);
        if (dist <= actor.radius + 22) {
          actor.ramCooldown = 0.45;
          const ramDmg = Math.round(speedPx * 0.22);
          this.applyDamageToActor(ev, j, ramDmg);
          this.audioManager.playImpactHit(true);
        }
      }
    }
  }

  private applyDamageToActor(ev: ActiveRandomEvent, actorIdx: number, damage: number): boolean {
    const actor = ev.actors[actorIdx];
    actor.hp -= damage;

    actor.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(60, () => {
      if (actor.sprite.active) actor.sprite.clearTint();
    });

    if (actor.hp > 0) return false;

    // Spawn loot drops at defeated actor location
    if (actor.isVehicle) {
      this.pickupManager.spawnDrop(actor.x, actor.y, 'cash', 120);
      this.pickupManager.spawnDrop(actor.x + 16, actor.y, 'ammo', 45);
      this.audioManager.playExplosion();
    } else if (ev.spec.type === 'cyber_psycho') {
      this.pickupManager.spawnDrop(actor.x, actor.y, 'armor', 50);
      this.pickupManager.spawnDrop(actor.x - 14, actor.y, 'cash', 140);
    } else {
      this.pickupManager.spawnDrop(actor.x, actor.y, Math.random() < 0.55 ? 'cash' : 'medkit', 55);
    }

    actor.sprite.destroy();
    actor.hpBg.destroy();
    actor.hpFill.destroy();
    ev.actors.splice(actorIdx, 1);
    return true;
  }

  private fireEnemyBolt(sx: number, sy: number, angleRad: number, damage: number): void {
    const speed = 290;
    const sprite = this.scene.add.image(sx, sy, 'proj_enemy').setDepth(24).setRotation(angleRad);
    this.projectiles.push({
      sprite,
      vx: Math.cos(angleRad) * speed,
      vy: Math.sin(angleRad) * speed,
      lifeMs: 1450,
      damage,
    });
  }

  private trySpawnWeightedEvent(playerPos: { x: number; y: number }): void {
    const allSpecs = Object.values(RANDOM_EVENT_SPECS);
    const activeTypes = new Set(this.activeEvents.map((e) => e.spec.type));
    const candidates = allSpecs.filter((s) => !activeTypes.has(s.type));
    if (candidates.length === 0) return;

    const totalWeight = candidates.reduce((sum, s) => sum + s.weight, 0);
    let pick = Math.random() * totalWeight;
    let chosen = candidates[0];
    for (const c of candidates) {
      pick -= c.weight;
      if (pick <= 0) {
        chosen = c;
        break;
      }
    }

    const pos = this.findSpawnLocation(playerPos);
    if (!pos) return;

    this.eventSeq += 1;
    const evId = `revent-${this.eventSeq}`;
    const district = this.districtManager.getDistrictNameAt(pos.x, pos.y, this.districtData);

    const beaconRing = this.scene.add.circle(pos.x, pos.y, 44, chosen.accentNum, 0.14);
    beaconRing.setStrokeStyle(2.5, chosen.accentNum, 0.9);
    beaconRing.setDepth(14);

    const actors = this.spawnActorsForSpec(evId, chosen, pos);
    if (actors.length === 0) {
      beaconRing.destroy();
      return;
    }

    this.activeEvents.push({
      id: evId,
      spec: chosen,
      district,
      x: pos.x,
      y: pos.y,
      timeRemainingSec: chosen.durationSec,
      totalTargets: actors.length,
      actors,
      beaconRing,
      activatedToastShown: false,
    });

    this.audioManager.playInteract();
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `城市动态事件【${chosen.title}】在 ${district} 爆发！查看小地图前往截击！`
    );
    this.emitTelemetry(true);
  }

  private spawnActorsForSpec(
    evId: string,
    spec: RandomEventSpec,
    center: { x: number; y: number }
  ): EventActor[] {
    const actors: EventActor[] = [];
    const makeActor = (
      idx: number,
      tex: string,
      x: number,
      y: number,
      hp: number,
      radius: number,
      speed: number,
      damage: number,
      isVehicle: boolean,
      scale = 1
    ) => {
      const sprite = this.scene.add.sprite(x, y, tex).setDepth(21).setScale(scale);
      const hpBg = this.scene.add.rectangle(x, y - radius - 10, 28, 5, 0x080d18, 0.9).setDepth(26);
      const hpFill = this.scene.add
        .rectangle(x - 13, y - radius - 10, 26, 3, spec.accentNum, 1)
        .setOrigin(0, 0.5)
        .setDepth(27);
      actors.push({
        id: `${evId}-a${idx}`,
        sprite,
        hpBg,
        hpFill,
        x,
        y,
        hp,
        maxHp: hp,
        radius,
        speed,
        damage,
        isVehicle,
        angle: Math.random() * Math.PI * 2,
        shootCooldown: 1 + Math.random() * 0.6,
        ramCooldown: 0,
      });
    };

    const pickClearNear = (angle: number, dist: number, r: number): { x: number; y: number } => {
      const tx = Phaser.Math.Clamp(center.x + Math.cos(angle) * dist, 72, WORLD_CONFIG.WIDTH - 72);
      const ty = Phaser.Math.Clamp(center.y + Math.sin(angle) * dist, 72, WORLD_CONFIG.HEIGHT - 72);
      return this.collisionManager.isPointClearForEntity(tx, ty, r) ? { x: tx, y: ty } : center;
    };

    if (spec.type === 'street_robbery') {
      for (let i = 0; i < 3; i++) {
        const p = pickClearNear((Math.PI * 2 * i) / 3, 28, 12);
        makeActor(i, 'enemy_raider', p.x, p.y, 75, 13, 82, 8, false);
      }
    } else if (spec.type === 'gang_shootout') {
      for (let i = 0; i < 4; i++) {
        const p = pickClearNear((Math.PI * 2 * i) / 4, 38, 13);
        const tex = i === 0 ? 'enemy_brute' : 'enemy_raider';
        makeActor(i, tex, p.x, p.y, i === 0 ? 130 : 80, i === 0 ? 16 : 13, 86, 10, false);
      }
    } else if (spec.type === 'armored_van') {
      makeActor(0, 'veh_swat', center.x, center.y, 260, 24, 92, 11, true);
      const g1 = pickClearNear(0.8, 42, 13);
      makeActor(1, 'enemy_raider', g1.x, g1.y, 85, 13, 88, 9, false);
    } else if (spec.type === 'bounty_hunt') {
      makeActor(0, 'veh_racer', center.x, center.y, 195, 21, 148, 10, true);
    } else if (spec.type === 'military_convoy') {
      makeActor(0, 'veh_swat', center.x, center.y, 280, 24, 84, 13, true);
      const esc = pickClearNear(2.2, 46, 15);
      makeActor(1, 'enemy_brute', esc.x, esc.y, 140, 16, 85, 11, false);
      const dr = pickClearNear(-1.2, 44, 13);
      makeActor(2, 'enemy_drone', dr.x, dr.y, 90, 13, 105, 9, false);
    } else if (spec.type === 'cyber_psycho') {
      makeActor(0, 'enemy_boss', center.x, center.y, 340, 22, 98, 15, false, 1.05);
    }

    return actors;
  }

  private findSpawnLocation(playerPos: { x: number; y: number }): { x: number; y: number } | null {
    for (let attempt = 0; attempt < 34; attempt++) {
      const x = 140 + Math.random() * (WORLD_CONFIG.WIDTH - 280);
      const y = 140 + Math.random() * (WORLD_CONFIG.HEIGHT - 280);
      const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, x, y);
      if (dist < 360 || dist > 1750) continue;
      if (this.collisionManager.isPointClearForEntity(x, y, 28)) {
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
    return null;
  }

  private destroyEventVisuals(ev: ActiveRandomEvent): void {
    ev.beaconRing.destroy();
    for (const a of ev.actors) {
      a.sprite.destroy();
      a.hpBg.destroy();
      a.hpFill.destroy();
    }
    ev.actors = [];
  }

  public clearAll(): void {
    for (const ev of this.activeEvents) {
      this.destroyEventVisuals(ev);
    }
    this.activeEvents = [];
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 260) return;
    this.lastEmitAt = nowMs;

    const payload: RandomEventMarker[] = this.activeEvents.map((ev) => ({
      id: ev.id,
      type: ev.spec.type,
      title: ev.spec.title,
      description: ev.spec.description,
      district: ev.district,
      x: ev.x,
      y: ev.y,
      remainingTargets: ev.actors.length,
      totalTargets: ev.totalTargets,
      timeRemainingSec: Math.max(0, Math.ceil(ev.timeRemainingSec)),
      accentColor: ev.spec.accentColor,
    }));

    gameEvents.emit(GAME_EVENT.RANDOM_EVENTS_UPDATED, payload);
  }

  public destroy(): void {
    this.clearAll();
  }
}
