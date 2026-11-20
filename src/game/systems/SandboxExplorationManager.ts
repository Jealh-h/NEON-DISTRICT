import Phaser from 'phaser';
import { PALETTE } from '../config/BalanceConfig';
import {
  DistrictData,
  GangOutpostDef,
  MetroStationDef,
  SecretVaultDef,
  SignalTowerDef,
} from '../world/DistrictManager';
import {
  GAME_EVENT,
  gameEvents,
  GangOutpostStatus,
  MetroStationStatus,
  SandboxInteractableHint,
  SecretVaultStatus,
  SignalTowerStatus,
} from '../ui/GameEvents';
import { AudioManager } from './AudioManager';
import type { ProgressionManager } from './ProgressionManager';

interface TowerVisual {
  def: SignalTowerDef;
  base: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
  beacon: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface MetroVisual {
  def: MetroStationDef;
  pad: Phaser.GameObjects.Rectangle;
  ring: Phaser.GameObjects.Arc;
  badge: Phaser.GameObjects.Text;
}

interface VaultVisual {
  def: SecretVaultDef;
  box: Phaser.GameObjects.Rectangle;
  core: Phaser.GameObjects.Rectangle;
  sonarRing: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
}

interface OutpostGuard {
  id: string;
  outpostId: string;
  sprite: Phaser.GameObjects.Image;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  isBoss: boolean;
  fireCooldown: number;
  homeX: number;
  homeY: number;
  strafeSign: number;
  ramCooldown: number;
}

const groundDepth = (y: number) => 19 + Math.min(8.4, Math.max(0, y) * 0.0022);

interface OutpostState {
  def: GangOutpostDef;
  zoneRing: Phaser.GameObjects.Arc;
  banner: Phaser.GameObjects.Text;
  guards: OutpostGuard[];
  activeCombat: boolean;
}

interface EnemyBullet {
  sprite: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  life: number;
  damage: number;
}

export interface SandboxUpdateCallbacks {
  onCash: (amount: number) => void;
  onArmor: (amount: number) => void;
  onExp: (amount: number) => void;
  onDamagePlayer: (amount: number) => void;
  onMinorWantedPulse?: (pos: { x: number; y: number }) => void;
  progressionManager?: ProgressionManager;
}

export interface SavedSandboxState {
  syncedTowerIds?: string[];
  discoveredMetroIds?: string[];
  openedVaultIds?: string[];
  clearedOutpostIds?: string[];
  bestStuntMeters?: number;
  stuntsCompleted?: number;
}

export class SandboxExplorationManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private district: DistrictData | null = null;

  private syncedTowerIds = new Set<string>();
  private discoveredMetroIds = new Set<string>(['metro-plaza']);
  private openedVaultIds = new Set<string>();
  private clearedOutpostIds = new Set<string>();
  private bestStuntMeters = 0;
  private stuntsCompleted = 0;

  private towers: TowerVisual[] = [];
  private metros: MetroVisual[] = [];
  private vaults: VaultVisual[] = [];
  private outposts: OutpostState[] = [];
  private enemyBullets: EnemyBullet[] = [];

  private activeHackTowerId: string | null = null;
  private hackProgress = 0;
  private hackBarBg: Phaser.GameObjects.Rectangle | null = null;
  private hackBarFill: Phaser.GameObjects.Rectangle | null = null;
  private pulsePhase = 0;
  private sonarCooldown = 0;
  private lastHintKey: string | null = null;
  private lastEmitAt = 0;
  private enabled = true;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
  }

  public initializeWorld(district: DistrictData): void {
    this.clearVisuals();
    this.district = district;

    // 1. Signal Towers
    for (const def of district.signalTowers) {
      const synced = this.syncedTowerIds.has(def.id);
      const color = synced ? 0x34d399 : Phaser.Display.Color.HexStringToColor(def.accentHex).color;
      const base = this.scene.add.circle(def.x, def.y, 18, 0x0b1120, 0.9);
      base.setStrokeStyle(2, color, 0.95);
      base.setDepth(12);

      const ring = this.scene.add.circle(def.x, def.y, 26);
      ring.setStrokeStyle(1.5, color, synced ? 0.3 : 0.75);
      ring.setDepth(11);

      const beacon = this.scene.add.rectangle(def.x, def.y - 12, 8, 28, color, 0.95);
      beacon.setDepth(16);

      const label = this.scene.add.text(def.x, def.y - 34, synced ? `✓ ${def.districtName}已同步` : `信号塔 · ${def.districtName}`, {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: synced ? '#34D399' : def.accentHex,
        backgroundColor: '#080D18CC',
        padding: { x: 4, y: 2 },
      });
      label.setOrigin(0.5);
      label.setDepth(17);

      this.towers.push({ def, base, ring, beacon, label });
    }

    // 2. Maglev Metro Stations
    for (const def of district.metroStations) {
      const discovered = this.discoveredMetroIds.has(def.id);
      const color = Phaser.Display.Color.HexStringToColor(def.accentHex).color;
      const pad = this.scene.add.rectangle(def.x, def.y, 38, 28, 0x0f172a, 0.92);
      pad.setStrokeStyle(2, discovered ? color : 0x64748b, 0.9);
      pad.setDepth(8);

      const ring = this.scene.add.circle(def.x, def.y, 24);
      ring.setStrokeStyle(1.5, color, discovered ? 0.65 : 0.25);
      ring.setDepth(8);

      const badge = this.scene.add.text(def.x, def.y - 24, discovered ? `M · ${def.name.replace('磁悬浮 · ', '')}` : 'M · 未探索地铁', {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: discovered ? '#F8FAFC' : '#94A3B8',
        backgroundColor: '#080D18D0',
        padding: { x: 4, y: 1 },
      });
      badge.setOrigin(0.5);
      badge.setDepth(15);

      this.metros.push({ def, pad, ring, badge });
    }

    // 3. Hidden Secret Vaults
    for (const def of district.secretVaults) {
      const opened = this.openedVaultIds.has(def.id);
      const box = this.scene.add.rectangle(def.x, def.y, 24, 18, opened ? 0x1e293b : 0x3b2f0b, 0.95);
      box.setStrokeStyle(2, opened ? 0x475569 : PALETTE.GOLD, 0.95);
      box.setDepth(12);

      const core = this.scene.add.rectangle(def.x, def.y, 10, 6, opened ? 0x334155 : PALETTE.NEON_CYAN, 1);
      core.setDepth(13);

      const sonarRing = this.scene.add.circle(def.x, def.y, 18);
      sonarRing.setStrokeStyle(2, PALETTE.GOLD, 0);
      sonarRing.setDepth(11);

      const label = this.scene.add.text(def.x, def.y - 20, opened ? '金库已开启' : '加密金库', {
        fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: opened ? '#64748B' : '#FFD166',
        backgroundColor: '#080D18CC',
        padding: { x: 3, y: 1 },
      });
      label.setOrigin(0.5);
      label.setDepth(16);
      label.setVisible(!opened && this.isVaultRevealed(def));

      this.vaults.push({ def, box, core, sonarRing, label });
    }

    // 4. Gang Strongholds / Outposts
    for (const def of district.gangOutposts) {
      const cleared = this.clearedOutpostIds.has(def.id);
      const color = cleared ? 0x34d399 : Phaser.Display.Color.HexStringToColor(def.accentHex).color;
      const zoneRing = this.scene.add.circle(def.x, def.y, def.radius, color, cleared ? 0.04 : 0.08);
      zoneRing.setStrokeStyle(2, color, cleared ? 0.25 : 0.6);
      zoneRing.setDepth(5);

      const banner = this.scene.add.text(
        def.x,
        def.y - def.radius + 14,
        cleared ? `✓ ${def.name} (已清剿)` : `☠ ${def.name} [${def.faction}]`,
        {
          fontFamily: '"JetBrains Mono", "Noto Sans SC", monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: cleared ? '#34D399' : def.accentHex,
          backgroundColor: '#080D18D9',
          padding: { x: 6, y: 2 },
        }
      );
      banner.setOrigin(0.5);
      banner.setDepth(18);

      const state: OutpostState = {
        def,
        zoneRing,
        banner,
        guards: [],
        activeCombat: false,
      };
      if (!cleared) {
        this.spawnOutpostGuards(state);
      }
      this.outposts.push(state);
    }

    // Hack Progress Bar UI in world space
    this.hackBarBg = this.scene.add.rectangle(0, 0, 74, 8, 0x080d18, 0.92);
    this.hackBarBg.setStrokeStyle(1, PALETTE.NEON_CYAN, 0.9);
    this.hackBarBg.setDepth(38);
    this.hackBarBg.setVisible(false);

    this.hackBarFill = this.scene.add.rectangle(0, 0, 70, 4, PALETTE.NEON_CYAN, 1);
    this.hackBarFill.setOrigin(0, 0.5);
    this.hackBarFill.setDepth(39);
    this.hackBarFill.setVisible(false);

    this.emitSummary(true);
  }

  private spawnOutpostGuards(state: OutpostState): void {
    const { def } = state;
    const total = def.guardCount;
    for (let i = 0; i < total; i++) {
      const isBoss = def.hasBoss && i === 0;
      const angle = (i / total) * Math.PI * 2;
      const dist = isBoss ? 18 : Math.min(def.radius * 0.52, 92);
      const gx = def.x + Math.cos(angle) * dist;
      const gy = def.y + Math.sin(angle) * dist;

      const texKey = isBoss ? 'enemy_brute' : 'enemy_raider';
      const sprite = this.scene.add.image(gx, gy, texKey);
      sprite.setDepth(groundDepth(gy));
      sprite.setTint(isBoss ? PALETTE.GOLD : Phaser.Display.Color.HexStringToColor(def.accentHex).color);
      if (isBoss) sprite.setScale(1.18);

      state.guards.push({
        id: `${def.id}-g-${i}`,
        outpostId: def.id,
        sprite,
        hp: isBoss ? 165 : 64,
        maxHp: isBoss ? 165 : 64,
        speed: isBoss ? 92 : 122,
        damage: isBoss ? 11 : 6,
        isBoss,
        fireCooldown: 0.6 + Math.random() * 0.8,
        homeX: gx,
        homeY: gy,
        strafeSign: i % 2 === 0 ? 1 : -1,
        ramCooldown: 0,
      });
    }
  }

  private isVaultRevealed(def: SecretVaultDef): boolean {
    return (
      this.openedVaultIds.has(def.id) ||
      this.district?.signalTowers.some(
        (t) => t.districtId === def.districtId && this.syncedTowerIds.has(t.id)
      ) === true
    );
  }

  public setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (!enabled) {
      this.cancelHack();
      this.lastHintKey = null;
      gameEvents.emit(GAME_EVENT.SANDBOX_HINT, null);
      for (const b of this.enemyBullets) b.sprite.destroy();
      this.enemyBullets = [];
    }
    for (const tv of this.towers) {
      tv.base.setVisible(enabled);
      tv.ring.setVisible(enabled);
      tv.beacon.setVisible(enabled);
      tv.label.setVisible(enabled);
    }
    for (const mv of this.metros) {
      mv.pad.setVisible(enabled);
      mv.ring.setVisible(enabled);
      mv.badge.setVisible(enabled);
    }
    for (const vv of this.vaults) {
      vv.box.setVisible(enabled);
      vv.core.setVisible(enabled);
      vv.sonarRing.setVisible(enabled);
      vv.label.setVisible(enabled && (this.openedVaultIds.has(vv.def.id) || this.isVaultRevealed(vv.def)));
    }
    for (const o of this.outposts) {
      o.zoneRing.setVisible(enabled);
      o.banner.setVisible(enabled);
      for (const g of o.guards) g.sprite.setVisible(enabled);
    }
  }

  public getSyncedTowerCount(): number {
    return this.syncedTowerIds.size;
  }

  public update(
    dtSeconds: number,
    playerPos: { x: number; y: number },
    inVehicle: boolean,
    callbacks: SandboxUpdateCallbacks
  ): void {
    if (!this.enabled) return;
    this.pulsePhase += dtSeconds * 3.2;
    this.sonarCooldown = Math.max(0, this.sonarCooldown - dtSeconds);

    // Animate towers
    for (const tv of this.towers) {
      const synced = this.syncedTowerIds.has(tv.def.id);
      if (!synced) {
        const s = 0.88 + Math.sin(this.pulsePhase) * 0.22;
        tv.ring.setScale(s);
        tv.ring.setAlpha(0.45 + Math.sin(this.pulsePhase) * 0.25);
      } else {
        tv.ring.setScale(1);
        tv.ring.setAlpha(0.28);
      }
    }

    // Auto-discover nearby Metro Stations
    for (const mv of this.metros) {
      const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, mv.def.x, mv.def.y);
      if (!this.discoveredMetroIds.has(mv.def.id) && dist <= 115) {
        this.discoverMetro(mv, callbacks);
      }
      if (this.discoveredMetroIds.has(mv.def.id)) {
        mv.ring.setScale(0.95 + Math.sin(this.pulsePhase * 0.8) * 0.12);
      }
    }

    // Secret Vault proximity sonar ping!
    for (const vv of this.vaults) {
      if (this.openedVaultIds.has(vv.def.id)) {
        vv.sonarRing.setAlpha(0);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, vv.def.x, vv.def.y);
      const revealed = this.isVaultRevealed(vv.def);
      if (revealed || dist <= 240) {
        vv.label.setVisible(true);
        const pulse = (Math.sin(this.pulsePhase * 1.4) + 1) * 0.5;
        vv.sonarRing.setScale(0.75 + pulse * 0.8);
        vv.sonarRing.setAlpha(dist <= 240 ? 0.85 - pulse * 0.45 : 0.3);
        if (dist <= 220 && this.sonarCooldown <= 0) {
          this.sonarCooldown = Math.max(0.55, dist / 145);
          this.audioManager.playInteract();
        }
      } else {
        vv.sonarRing.setAlpha(0);
      }
    }

    // Active Signal Tower timed hack channel
    if (this.activeHackTowerId) {
      const tv = this.towers.find((t) => t.def.id === this.activeHackTowerId);
      if (!tv || Phaser.Math.Distance.Between(playerPos.x, playerPos.y, tv.def.x, tv.def.y) > 95) {
        this.cancelHack();
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '离开信号塔范围，骇入同步中断！');
      } else {
        this.hackProgress += dtSeconds / 1.8;
        if (this.hackBarBg && this.hackBarFill) {
          this.hackBarBg.setPosition(playerPos.x, playerPos.y - 34).setVisible(true);
          this.hackBarFill
            .setPosition(playerPos.x - 35, playerPos.y - 34)
            .setSize(Math.max(2, Math.min(70, this.hackProgress * 70)), 4)
            .setVisible(true);
        }
        if (this.hackProgress >= 1) {
          this.completeTowerSync(tv, callbacks);
        }
      }
    }

    // Gang Outpost Guard AI & Enemy Projectiles
    this.updateOutpostGuards(dtSeconds, playerPos, callbacks);
    this.updateEnemyBullets(dtSeconds, playerPos, inVehicle, callbacks);

    const nowMs = this.scene.time.now;
    if (nowMs - this.lastEmitAt > 1200) {
      this.emitSummary(false, nowMs);
    }
  }

  private discoverMetro(mv: MetroVisual, callbacks: SandboxUpdateCallbacks): void {
    this.discoveredMetroIds.add(mv.def.id);
    const color = Phaser.Display.Color.HexStringToColor(mv.def.accentHex).color;
    mv.pad.setStrokeStyle(2, color, 0.95);
    mv.ring.setStrokeStyle(1.5, color, 0.75);
    mv.badge.setText(`M · ${mv.def.name.replace('磁悬浮 · ', '')}`);
    mv.badge.setColor('#F8FAFC');
    this.audioManager.playInteract();
    callbacks.onExp(40);
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, `已发现新传送站：【${mv.def.name}】！按 [M] 打开地图可随时快速传送`);
    this.emitSummary(true);
  }

  private completeTowerSync(tv: TowerVisual, callbacks: SandboxUpdateCallbacks): void {
    this.cancelHack();
    this.syncedTowerIds.add(tv.def.id);
    tv.base.setStrokeStyle(2, 0x34d399, 1);
    tv.ring.setStrokeStyle(1.5, 0x34d399, 0.4);
    tv.beacon.setFillStyle(0x34d399, 1);
    tv.label.setText(`✓ ${tv.def.districtName}已同步`).setColor('#34D399');

    // Automatically unlock the matching district Metro station & reveal district Vaults!
    const matchingMetro = this.metros.find((m) => m.def.districtId === tv.def.districtId);
    if (matchingMetro && !this.discoveredMetroIds.has(matchingMetro.def.id)) {
      this.discoveredMetroIds.add(matchingMetro.def.id);
      const mCol = Phaser.Display.Color.HexStringToColor(matchingMetro.def.accentHex).color;
      matchingMetro.pad.setStrokeStyle(2, mCol, 0.95);
      matchingMetro.badge.setText(`M · ${matchingMetro.def.name.replace('磁悬浮 · ', '')}`).setColor('#F8FAFC');
    }
    for (const vv of this.vaults) {
      if (vv.def.districtId === tv.def.districtId && !this.openedVaultIds.has(vv.def.id)) {
        vv.label.setVisible(true);
      }
    }

    this.audioManager.playMissionComplete();
    callbacks.onCash(tv.def.rewardCash);
    callbacks.onExp(tv.def.rewardExp);
    callbacks.progressionManager?.addReputation({ hacker: 40 });
    callbacks.onMinorWantedPulse?.({ x: tv.def.x, y: tv.def.y });

    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `【${tv.def.name}】同步完成！+$${tv.def.rewardCash} · 解锁区域金库情报与磁悬浮传送！`
    );
    this.emitSummary(true);
  }

  private cancelHack(): void {
    this.activeHackTowerId = null;
    this.hackProgress = 0;
    this.hackBarBg?.setVisible(false);
    this.hackBarFill?.setVisible(false);
  }

  public getNearbyInteractable(playerPos: { x: number; y: number }): SandboxInteractableHint | null {
    for (const tv of this.towers) {
      if (this.syncedTowerIds.has(tv.def.id)) continue;
      if (Phaser.Math.Distance.Between(playerPos.x, playerPos.y, tv.def.x, tv.def.y) <= 64) {
        return {
          kind: 'tower',
          id: tv.def.id,
          name: tv.def.name,
          actionLabel: this.activeHackTowerId === tv.def.id ? '正在同步中...' : '按 [E] 骇入同步区际信号塔',
          accentHex: tv.def.accentHex,
        };
      }
    }
    for (const vv of this.vaults) {
      if (this.openedVaultIds.has(vv.def.id)) continue;
      if (Phaser.Math.Distance.Between(playerPos.x, playerPos.y, vv.def.x, vv.def.y) <= 52) {
        return {
          kind: 'vault',
          id: vv.def.id,
          name: vv.def.name,
          actionLabel: `按 [E] 破解开启加密金库 (+$${vv.def.rewardCash})`,
          accentHex: '#FFD166',
        };
      }
    }
    for (const mv of this.metros) {
      if (Phaser.Math.Distance.Between(playerPos.x, playerPos.y, mv.def.x, mv.def.y) <= 56) {
        return {
          kind: 'metro',
          id: mv.def.id,
          name: mv.def.name,
          actionLabel: '按 [M] 打开全城战术地图选择磁悬浮传送站',
          accentHex: mv.def.accentHex,
        };
      }
    }
    return null;
  }

  public tryInteractNearest(
    playerPos: { x: number; y: number },
    callbacks: SandboxUpdateCallbacks
  ): boolean {
    // 1. Signal Tower Hack
    for (const tv of this.towers) {
      if (this.syncedTowerIds.has(tv.def.id)) continue;
      if (Phaser.Math.Distance.Between(playerPos.x, playerPos.y, tv.def.x, tv.def.y) <= 68) {
        if (this.activeHackTowerId !== tv.def.id) {
          this.activeHackTowerId = tv.def.id;
          this.hackProgress = 0;
          this.audioManager.playInteract();
          gameEvents.emit(GAME_EVENT.STATUS_TOAST, `正在破解【${tv.def.name}】，请保持在塔台附近...`);
        }
        return true;
      }
    }

    // 2. Secret Encrypted Vault
    for (const vv of this.vaults) {
      if (this.openedVaultIds.has(vv.def.id)) continue;
      if (Phaser.Math.Distance.Between(playerPos.x, playerPos.y, vv.def.x, vv.def.y) <= 56) {
        this.openedVaultIds.add(vv.def.id);
        vv.box.setFillStyle(0x1e293b, 0.7).setStrokeStyle(2, 0x475569, 0.7);
        vv.core.setFillStyle(0x334155, 0.7);
        vv.sonarRing.setAlpha(0);
        vv.label.setText('金库已开启').setColor('#64748B').setVisible(true);

        this.audioManager.playMissionComplete();
        callbacks.onCash(vv.def.rewardCash);
        callbacks.onArmor(vv.def.rewardArmor);
        callbacks.onExp(vv.def.rewardExp);
        callbacks.progressionManager?.addReputation({ street: 30, hacker: 20 });

        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `破解【${vv.def.name}】！+$${vv.def.rewardCash} · +${vv.def.rewardArmor} 护甲 · +${vv.def.rewardExp} EXP`
        );
        this.emitSummary(true);
        return true;
      }
    }

    return false;
  }

  private updateOutpostGuards(
    dtSeconds: number,
    playerPos: { x: number; y: number },
    callbacks: SandboxUpdateCallbacks
  ): void {
    for (const state of this.outposts) {
      if (this.clearedOutpostIds.has(state.def.id) || state.guards.length === 0) continue;

      const distToCenter = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, state.def.x, state.def.y);
      if (distToCenter <= state.def.radius + 230) {
        if (!state.activeCombat) {
          state.activeCombat = true;
          gameEvents.emit(
            GAME_EVENT.STATUS_TOAST,
            `进入帮派据点：【${state.def.name}】！清除 ${state.guards.length} 名武装守卫可解放该区！`
          );
        }
      } else if (distToCenter > state.def.radius + 420) {
        state.activeCombat = false;
      }

      for (const g of state.guards) {
        if (g.ramCooldown > 0) g.ramCooldown = Math.max(0, g.ramCooldown - dtSeconds);
        const distToPlayer = Phaser.Math.Distance.Between(g.sprite.x, g.sprite.y, playerPos.x, playerPos.y);
        if (state.activeCombat && distToPlayer <= 420) {
          const angle = Math.atan2(playerPos.y - g.sprite.y, playerPos.x - g.sprite.x);
          g.sprite.setRotation(angle);

          // Tactical engagement ring: strafe at 135-190px rather than stacking on player
          if (distToPlayer > 175) {
            g.sprite.x += Math.cos(angle) * g.speed * dtSeconds;
            g.sprite.y += Math.sin(angle) * g.speed * dtSeconds;
          } else if (distToPlayer < 105) {
            g.sprite.x -= Math.cos(angle) * g.speed * 0.7 * dtSeconds;
            g.sprite.y -= Math.sin(angle) * g.speed * 0.7 * dtSeconds;
          } else {
            const perp = angle + (Math.PI / 2) * g.strafeSign;
            g.sprite.x += Math.cos(perp) * g.speed * 0.65 * dtSeconds;
            g.sprite.y += Math.sin(perp) * g.speed * 0.65 * dtSeconds;
          }

          g.fireCooldown -= dtSeconds;
          if (g.fireCooldown <= 0) {
            g.fireCooldown = g.isBoss ? 0.65 : 1.15;
            this.spawnGuardShot(g, angle);
          }
        } else {
          // Return calmly near post
          const dHome = Phaser.Math.Distance.Between(g.sprite.x, g.sprite.y, g.homeX, g.homeY);
          if (dHome > 14) {
            const ha = Math.atan2(g.homeY - g.sprite.y, g.homeX - g.sprite.x);
            g.sprite.setRotation(ha);
            g.sprite.x += Math.cos(ha) * 65 * dtSeconds;
            g.sprite.y += Math.sin(ha) * 65 * dtSeconds;
          }
        }
        g.sprite.setDepth(groundDepth(g.sprite.y));
      }
    }
  }

  public checkVehicleRam(
    vx: number,
    vy: number,
    speedPx: number,
    ramMult: number,
    callbacks: SandboxUpdateCallbacks
  ): void {
    if (!this.enabled || speedPx < 85) return;
    for (const state of this.outposts) {
      if (this.clearedOutpostIds.has(state.def.id)) continue;
      for (let i = state.guards.length - 1; i >= 0; i--) {
        const g = state.guards[i];
        if (g.ramCooldown > 0) continue;
        const hitRadius = g.isBoss ? 36 : 30;
        const dist = Phaser.Math.Distance.Between(vx, vy, g.sprite.x, g.sprite.y);
        if (dist <= hitRadius) {
          g.ramCooldown = 0.4;
          state.activeCombat = true;
          const dmg = Math.round(speedPx * 0.24 * ramMult);
          g.hp -= dmg;
          g.sprite.setTint(0xffffff);
          this.scene.time.delayedCall(60, () => {
            if (g.sprite.active) {
              g.sprite.setTint(
                g.isBoss
                  ? PALETTE.GOLD
                  : Phaser.Display.Color.HexStringToColor(state.def.accentHex).color
              );
            }
          });
          const killed = g.hp <= 0;
          this.audioManager.playImpactHit(killed);
          if (killed) {
            g.sprite.destroy();
            state.guards.splice(i, 1);
            this.handleOutpostCheck(state, callbacks);
          }
        }
      }
    }
  }

  private spawnGuardShot(g: OutpostGuard, angle: number): void {
    const spread = (Math.random() - 0.5) * 0.14;
    const finalAngle = angle + spread;
    const speed = g.isBoss ? 470 : 390;
    const bullet = this.scene.add.rectangle(
      g.sprite.x + Math.cos(finalAngle) * 14,
      g.sprite.y + Math.sin(finalAngle) * 14,
      8,
      3,
      g.isBoss ? PALETTE.GOLD : 0xf97316,
      1
    );
    bullet.setRotation(finalAngle);
    bullet.setDepth(24);
    this.enemyBullets.push({
      sprite: bullet,
      vx: Math.cos(finalAngle) * speed,
      vy: Math.sin(finalAngle) * speed,
      life: 1.15,
      damage: g.damage,
    });
  }

  private updateEnemyBullets(
    dtSeconds: number,
    playerPos: { x: number; y: number },
    inVehicle: boolean,
    callbacks: SandboxUpdateCallbacks
  ): void {
    const hitRadius = inVehicle ? 24 : 18;
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.sprite.x += b.vx * dtSeconds;
      b.sprite.y += b.vy * dtSeconds;
      b.life -= dtSeconds;

      const hitPlayer = Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, playerPos.x, playerPos.y) <= hitRadius;
      if (hitPlayer) {
        callbacks.onDamagePlayer(b.damage);
      }

      if (hitPlayer || b.life <= 0) {
        b.sprite.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  public checkProjectileHit(
    px: number,
    py: number,
    damage: number,
    hitTargets: Set<object>,
    callbacks: SandboxUpdateCallbacks,
    onFeedback?: (tx: number, ty: number, killed: boolean, isBoss: boolean) => void
  ): boolean {
    for (const state of this.outposts) {
      if (this.clearedOutpostIds.has(state.def.id)) continue;
      for (let i = state.guards.length - 1; i >= 0; i--) {
        const g = state.guards[i];
        if (hitTargets.has(g)) continue;
        const radius = g.isBoss ? 22 : 16;
        if (Phaser.Math.Distance.Between(px, py, g.sprite.x, g.sprite.y) <= radius) {
          hitTargets.add(g);
          state.activeCombat = true;
          g.hp -= damage;
          g.sprite.setTint(0xffffff);
          this.scene.time.delayedCall(60, () => {
            if (g.sprite.active) {
              g.sprite.setTint(
                g.isBoss
                  ? PALETTE.GOLD
                  : Phaser.Display.Color.HexStringToColor(state.def.accentHex).color
              );
            }
          });
          const killed = g.hp <= 0;
          const gx = g.sprite.x;
          const gy = g.sprite.y;
          if (killed) {
            g.sprite.destroy();
            state.guards.splice(i, 1);
            this.handleOutpostCheck(state, callbacks);
          }
          onFeedback?.(gx, gy, killed, g.isBoss);
          return true;
        }
      }
    }
    return false;
  }

  public isPointNearOutpostCombat(x: number, y: number, extraRadius = 180): boolean {
    if (!this.enabled) return false;
    for (const state of this.outposts) {
      if (this.clearedOutpostIds.has(state.def.id) || state.guards.length === 0) continue;
      if (
        Phaser.Math.Distance.Between(x, y, state.def.x, state.def.y) <=
        state.def.radius + extraRadius
      ) {
        return true;
      }
    }
    return false;
  }

  public getActiveGuardTargets(): Array<{ x: number; y: number; damage: (amount: number, callbacks: SandboxUpdateCallbacks) => boolean }> {
    if (!this.enabled) return [];
    const results: Array<{
      x: number;
      y: number;
      damage: (amount: number, callbacks: SandboxUpdateCallbacks) => boolean;
    }> = [];
    for (const state of this.outposts) {
      if (this.clearedOutpostIds.has(state.def.id)) continue;
      for (const g of state.guards) {
        if (!g.sprite.active) continue;
        results.push({
          x: g.sprite.x,
          y: g.sprite.y,
          damage: (amount: number, callbacks: SandboxUpdateCallbacks) => {
            const idx = state.guards.indexOf(g);
            if (idx === -1) return false;
            state.activeCombat = true;
            g.hp -= amount;
            g.sprite.setTint(0xffffff);
            this.scene.time.delayedCall(60, () => {
              if (g.sprite.active) {
                g.sprite.setTint(
                  g.isBoss
                    ? PALETTE.GOLD
                    : Phaser.Display.Color.HexStringToColor(state.def.accentHex).color
                );
              }
            });
            if (g.hp <= 0) {
              g.sprite.destroy();
              state.guards.splice(idx, 1);
              this.handleOutpostCheck(state, callbacks);
              return true;
            }
            return false;
          },
        });
      }
    }
    return results;
  }

  public applyBlastDamage(
    bx: number,
    by: number,
    radius: number,
    damage: number,
    callbacks: SandboxUpdateCallbacks
  ): void {
    for (const state of this.outposts) {
      if (this.clearedOutpostIds.has(state.def.id)) continue;
      for (let i = state.guards.length - 1; i >= 0; i--) {
        const g = state.guards[i];
        const dist = Phaser.Math.Distance.Between(bx, by, g.sprite.x, g.sprite.y);
        if (dist <= radius) {
          const scaled = Math.round(damage * Math.max(0.35, 1 - dist / radius));
          g.hp -= scaled;
          if (g.hp <= 0) {
            g.sprite.destroy();
            state.guards.splice(i, 1);
          }
        }
      }
      this.handleOutpostCheck(state, callbacks);
    }
  }

  private handleOutpostCheck(state: OutpostState, callbacks: SandboxUpdateCallbacks): void {
    if (this.clearedOutpostIds.has(state.def.id) || state.guards.length > 0) return;
    this.clearedOutpostIds.add(state.def.id);
    state.activeCombat = false;
    state.zoneRing.setFillStyle(0x34d399, 0.04).setStrokeStyle(2, 0x34d399, 0.35);
    state.banner.setText(`✓ ${state.def.name} (已清剿)`).setColor('#34D399');

    this.audioManager.playMissionComplete();
    callbacks.onCash(state.def.rewardCash);
    callbacks.onExp(state.def.rewardExp);
    callbacks.progressionManager?.addReputation({ street: 50 });

    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `据点清剿成功：【${state.def.name}】已解放！+$${state.def.rewardCash} · +${state.def.rewardExp} EXP`
    );
    this.emitSummary(true);
  }

  public recordStuntJump(
    meters: number,
    bonus: number,
    callbacks: SandboxUpdateCallbacks
  ): void {
    this.stuntsCompleted += 1;
    const isRecord = meters > this.bestStuntMeters;
    if (isRecord) {
      this.bestStuntMeters = meters;
    }
    const extraRecordCash = isRecord ? 100 : 0;
    const totalCash = bonus + extraRecordCash;
    callbacks.onCash(totalCash);
    callbacks.onExp(isRecord ? 85 : 40);
    callbacks.progressionManager?.addReputation({ street: isRecord ? 25 : 10 });

    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      isRecord
        ? `★ 飞跃新纪录！${meters} 米超级滞空！+$${totalCash}`
        : `飞跃着陆 ${meters} 米！特技奖金 +$${totalCash}`
    );
    this.emitSummary(true);
  }

  public getFastTravelDestination(metroId: string): MetroStationDef | null {
    if (!this.discoveredMetroIds.has(metroId)) return null;
    return this.district?.metroStations.find((m) => m.id === metroId) ?? null;
  }

  public emitSummary(force = false, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 800) return;
    this.lastEmitAt = nowMs;
    if (!this.district) return;

    const signalTowers: SignalTowerStatus[] = this.district.signalTowers.map((t) => ({
      id: t.id,
      districtId: t.districtId,
      districtName: t.districtName,
      name: t.name,
      x: t.x,
      y: t.y,
      synced: this.syncedTowerIds.has(t.id),
      accentHex: t.accentHex,
    }));

    const metroStations: MetroStationStatus[] = this.district.metroStations.map((m) => ({
      id: m.id,
      districtId: m.districtId,
      name: m.name,
      x: m.x,
      y: m.y,
      discovered: this.discoveredMetroIds.has(m.id),
      accentHex: m.accentHex,
    }));

    const secretVaults: SecretVaultStatus[] = this.district.secretVaults.map((v) => ({
      id: v.id,
      districtId: v.districtId,
      name: v.name,
      x: v.x,
      y: v.y,
      opened: this.openedVaultIds.has(v.id),
      revealed: this.isVaultRevealed(v),
    }));

    const gangOutposts: GangOutpostStatus[] = this.outposts.map((o) => ({
      id: o.def.id,
      districtId: o.def.districtId,
      name: o.def.name,
      faction: o.def.faction,
      x: o.def.x,
      y: o.def.y,
      cleared: this.clearedOutpostIds.has(o.def.id),
      guardsAlive: o.guards.length,
      accentHex: o.def.accentHex,
    }));

    gameEvents.emit(GAME_EVENT.SANDBOX_UPDATED, {
      signalTowers,
      metroStations,
      secretVaults,
      gangOutposts,
      bestStuntMeters: this.bestStuntMeters,
      stuntsCompleted: this.stuntsCompleted,
    });
  }

  public getSaveState(): SavedSandboxState {
    return {
      syncedTowerIds: Array.from(this.syncedTowerIds),
      discoveredMetroIds: Array.from(this.discoveredMetroIds),
      openedVaultIds: Array.from(this.openedVaultIds),
      clearedOutpostIds: Array.from(this.clearedOutpostIds),
      bestStuntMeters: this.bestStuntMeters,
      stuntsCompleted: this.stuntsCompleted,
    };
  }

  public loadFromSave(saved?: SavedSandboxState): void {
    this.syncedTowerIds = new Set(saved?.syncedTowerIds ?? []);
    this.discoveredMetroIds = new Set(['metro-plaza', ...(saved?.discoveredMetroIds ?? [])]);
    this.openedVaultIds = new Set(saved?.openedVaultIds ?? []);
    this.clearedOutpostIds = new Set(saved?.clearedOutpostIds ?? []);
    this.bestStuntMeters = saved?.bestStuntMeters ?? 0;
    this.stuntsCompleted = saved?.stuntsCompleted ?? 0;
    if (this.district) {
      this.initializeWorld(this.district);
    }
  }

  private clearVisuals(): void {
    this.cancelHack();
    this.hackBarBg?.destroy();
    this.hackBarFill?.destroy();
    this.hackBarBg = null;
    this.hackBarFill = null;

    for (const tv of this.towers) {
      tv.base.destroy();
      tv.ring.destroy();
      tv.beacon.destroy();
      tv.label.destroy();
    }
    this.towers = [];

    for (const mv of this.metros) {
      mv.pad.destroy();
      mv.ring.destroy();
      mv.badge.destroy();
    }
    this.metros = [];

    for (const vv of this.vaults) {
      vv.box.destroy();
      vv.core.destroy();
      vv.sonarRing.destroy();
      vv.label.destroy();
    }
    this.vaults = [];

    for (const o of this.outposts) {
      o.zoneRing.destroy();
      o.banner.destroy();
      for (const g of o.guards) g.sprite.destroy();
    }
    this.outposts = [];

    for (const b of this.enemyBullets) {
      b.sprite.destroy();
    }
    this.enemyBullets = [];
  }

  public destroy(): void {
    this.clearVisuals();
  }
}
