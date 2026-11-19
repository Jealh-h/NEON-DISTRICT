import Phaser from 'phaser';
import { PALETTE, WEAPON_ORDER, WEAPON_SPECS } from '../config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';
import { AudioManager } from './AudioManager';
import { WeaponManager } from './WeaponManager';

export type PickupKind = 'cash' | 'medkit' | 'ammo' | 'chip' | 'overdrive' | 'armor' | 'bribe';

interface ChipDef {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface StreetCrateDef {
  id: string;
  kind: 'cash' | 'medkit' | 'ammo' | 'armor' | 'bribe';
  x: number;
  y: number;
  amount: number;
}

interface ActivePickupNode {
  id: string;
  kind: PickupKind;
  x: number;
  y: number;
  amount: number;
  sprite: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  phase: number;
  persistentChipId?: string;
  crateIndex?: number;
  expiresAt?: number;
}

const CHIP_LOCATIONS: ChipDef[] = [
  { id: 'chip-1', x: 1312, y: 1024, label: '霓虹中心喷泉芯片' },
  { id: 'chip-2', x: 680, y: 380, label: '天际公寓加密暗巷芯片' },
  { id: 'chip-3', x: 416, y: 920, label: '霓虹街机后巷芯片' },
  { id: 'chip-4', x: 2048, y: 400, label: '量子实验室科研芯片' },
  { id: 'chip-5', x: 3120, y: 920, label: '生态科研温室芯片' },
  { id: 'chip-6', x: 3680, y: 580, label: '苍穹雪岭观景台芯片' },
  { id: 'chip-7', x: 4320, y: 480, label: '红岩峡谷断崖芯片' },
  { id: 'chip-8', x: 3968, y: 1184, label: '黑曜石火山前哨芯片' },
  { id: 'chip-9', x: 2096, y: 1584, label: '翠水湾湖心木桥芯片' },
  { id: 'chip-10', x: 2816, y: 1648, label: '霓虹竞技场南门芯片' },
  { id: 'chip-11', x: 1296, y: 3424, label: '暗港离岸灯塔岛芯片' },
  { id: 'chip-12', x: 528, y: 2432, label: '暗港深水货柜泊位芯片' },
  { id: 'chip-13', x: 2320, y: 2432, label: '铬铁冷核聚变厂芯片' },
  { id: 'chip-14', x: 4224, y: 2464, label: '星港超长主跑道芯片' },
];

const STREET_CRATES: StreetCrateDef[] = [
  { id: 'crate-plaza-cash', kind: 'cash', x: 1480, y: 960, amount: 85 },
  { id: 'crate-clinic-med', kind: 'medkit', x: 1120, y: 616, amount: 45 },
  { id: 'crate-tech-ammo', kind: 'ammo', x: 1984, y: 560, amount: 50 },
  { id: 'crate-tech-cash', kind: 'cash', x: 2880, y: 1024, amount: 110 },
  { id: 'crate-park-med', kind: 'medkit', x: 1584, y: 1520, amount: 45 },
  { id: 'crate-park-cash', kind: 'cash', x: 2320, y: 1504, amount: 100 },
  { id: 'crate-highland-ammo', kind: 'ammo', x: 3744, y: 640, amount: 65 },
  { id: 'crate-volcano-med', kind: 'medkit', x: 3968, y: 1120, amount: 55 },
  { id: 'crate-harbor-cash', kind: 'cash', x: 640, y: 2688, amount: 125 },
  { id: 'crate-harbor-ammo', kind: 'ammo', x: 1312, y: 2464, amount: 65 },
  { id: 'crate-chrome-med', kind: 'medkit', x: 1976, y: 2496, amount: 55 },
  { id: 'crate-chrome-cash', kind: 'cash', x: 2800, y: 2496, amount: 130 },
  { id: 'crate-skyport-ammo', kind: 'ammo', x: 4064, y: 1760, amount: 70 },
  { id: 'crate-plaza-armor', kind: 'armor', x: 680, y: 920, amount: 50 },
  { id: 'crate-harbor-armor', kind: 'armor', x: 416, y: 2496, amount: 50 },
  { id: 'crate-chrome-armor', kind: 'armor', x: 3120, y: 2432, amount: 50 },
  { id: 'crate-highland-armor', kind: 'armor', x: 3600, y: 560, amount: 50 },
  { id: 'crate-skyport-armor', kind: 'armor', x: 3680, y: 1760, amount: 60 },
  { id: 'bribe-alley-west', kind: 'bribe', x: 544, y: 400, amount: 1 },
  { id: 'bribe-tech-east', kind: 'bribe', x: 3168, y: 520, amount: 1 },
  { id: 'bribe-park-canal', kind: 'bribe', x: 1856, y: 1520, amount: 1 },
  { id: 'bribe-highland-pass', kind: 'bribe', x: 4224, y: 720, amount: 1 },
  { id: 'bribe-harbor-pier', kind: 'bribe', x: 688, y: 3440, amount: 1 },
  { id: 'bribe-chrome-yard', kind: 'bribe', x: 2432, y: 2752, amount: 1 },
  { id: 'bribe-skyport-north', kind: 'bribe', x: 4384, y: 1888, amount: 1 },
];

export interface PickupCallbacks {
  onCash: (amount: number) => void;
  onHeal: (amount: number) => void;
  onArmor?: (amount: number) => void;
  onBribe?: () => void;
  onChipCollected?: (allDone: boolean) => void;
  onOverdrive: (durationSec: number) => void;
  weaponManager: WeaponManager;
}

export class PickupManager {
  private scene: Phaser.Scene;
  private audioManager: AudioManager;
  private nodes: ActivePickupNode[] = [];
  private collectedChipIds = new Set<string>();
  private crateRespawnAt = new Map<number, number>();
  private chipsVisible = true;
  private dropCounter = 0;

  constructor(scene: Phaser.Scene, audioManager: AudioManager) {
    this.scene = scene;
    this.audioManager = audioManager;
  }

  public initializeWorldPickups(): void {
    this.clearAllNodes();
    this.spawnUncollectedChips();
    this.spawnAllCrates();
    this.emitExploration();
  }

  private spawnUncollectedChips(): void {
    for (const chip of CHIP_LOCATIONS) {
      if (this.collectedChipIds.has(chip.id)) continue;
      const node = this.createNode(chip.id, 'chip', chip.x, chip.y, 120, {
        persistentChipId: chip.id,
      });
      node.sprite.setVisible(this.chipsVisible);
      node.glow.setVisible(this.chipsVisible);
      this.nodes.push(node);
    }
  }

  private spawnAllCrates(): void {
    this.crateRespawnAt.clear();
    STREET_CRATES.forEach((def, idx) => {
      const node = this.createNode(def.id, def.kind, def.x, def.y, def.amount, {
        crateIndex: idx,
      });
      this.nodes.push(node);
    });
  }

  public spawnDrop(
    x: number,
    y: number,
    kind: 'cash' | 'medkit' | 'ammo' | 'overdrive' | 'armor',
    amount = 0
  ): void {
    this.dropCounter += 1;
    const defaultAmt =
      kind === 'cash' ? 35 : kind === 'medkit' ? 32 : kind === 'ammo' ? 40 : kind === 'armor' ? 35 : 8;
    const node = this.createNode(
      `drop-${this.dropCounter}`,
      kind,
      x,
      y,
      amount > 0 ? amount : defaultAmt,
      { expiresAt: this.scene.time.now + 24000 }
    );
    this.nodes.push(node);
  }

  private createNode(
    id: string,
    kind: PickupKind,
    x: number,
    y: number,
    amount: number,
    meta: { persistentChipId?: string; crateIndex?: number; expiresAt?: number }
  ): ActivePickupNode {
    const textureMap: Record<PickupKind, string> = {
      cash: 'pickup_cash',
      medkit: 'pickup_medkit',
      ammo: 'pickup_ammo',
      chip: 'pickup_chip',
      overdrive: 'pickup_overdrive',
      armor: 'pickup_armor',
      bribe: 'pickup_bribe',
    };
    const tintMap: Record<PickupKind, number> = {
      cash: PALETTE.GOLD,
      medkit: PALETTE.NEON_CYAN,
      ammo: PALETTE.NEON_PINK,
      chip: PALETTE.NEON_PURPLE,
      overdrive: PALETTE.NEON_PINK,
      armor: 0x38bdf8,
      bribe: 0xfacc15,
    };

    const glow = this.scene.add.image(x, y, 'fx_pixel_glow');
    glow.setTint(tintMap[kind]);
    glow.setAlpha(kind === 'chip' ? 0.42 : 0.3);
    glow.setScale(kind === 'chip' ? 0.95 : 0.75);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(16);

    const sprite = this.scene.add.image(x, y, textureMap[kind]);
    sprite.setDepth(17);
    if (kind === 'chip') {
      sprite.setScale(1.15);
    }

    return {
      id,
      kind,
      x,
      y,
      amount,
      sprite,
      glow,
      phase: Math.random() * Math.PI * 2,
      ...meta,
    };
  }

  public setChipsVisible(visible: boolean): void {
    this.chipsVisible = visible;
    for (const node of this.nodes) {
      if (node.kind === 'chip') {
        node.sprite.setVisible(visible);
        node.glow.setVisible(visible);
      }
    }
  }

  public clearTemporaryDrops(): void {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (node.expiresAt !== undefined) {
        node.sprite.destroy();
        node.glow.destroy();
        this.nodes.splice(i, 1);
      }
    }
  }

  public update(
    dtSeconds: number,
    nowMs: number,
    collectorPos: { x: number; y: number },
    callbacks: PickupCallbacks
  ): void {
    // Respawn street loot crates
    for (const [crateIdx, readyAt] of this.crateRespawnAt.entries()) {
      if (nowMs >= readyAt) {
        this.crateRespawnAt.delete(crateIdx);
        const def = STREET_CRATES[crateIdx];
        if (def) {
          this.nodes.push(
            this.createNode(def.id, def.kind, def.x, def.y, def.amount, { crateIndex: crateIdx })
          );
        }
      }
    }

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];

      if (node.expiresAt !== undefined && nowMs >= node.expiresAt) {
        node.sprite.destroy();
        node.glow.destroy();
        this.nodes.splice(i, 1);
        continue;
      }

      if (node.kind === 'chip' && !this.chipsVisible) {
        continue;
      }

      node.phase += dtSeconds * 3.8;
      const bob = Math.sin(node.phase) * 3;
      node.sprite.setPosition(node.x, node.y + bob);
      node.glow.setAlpha((node.kind === 'chip' ? 0.34 : 0.24) + Math.sin(node.phase) * 0.08);

      const dist = Phaser.Math.Distance.Between(collectorPos.x, collectorPos.y, node.x, node.y);
      if (dist <= 28) {
        this.collectNode(node, nowMs, callbacks);
        node.sprite.destroy();
        node.glow.destroy();
        this.nodes.splice(i, 1);
      }
    }
  }

  private collectNode(node: ActivePickupNode, nowMs: number, callbacks: PickupCallbacks): void {
    if (node.crateIndex !== undefined) {
      this.crateRespawnAt.set(node.crateIndex, nowMs + 45000);
    }

    if (node.kind === 'chip' && node.persistentChipId) {
      this.collectedChipIds.add(node.persistentChipId);
      const chipDef = CHIP_LOCATIONS.find((c) => c.id === node.persistentChipId);
      const allDone = this.collectedChipIds.size >= CHIP_LOCATIONS.length;
      const reward = node.amount + (allDone ? 1500 : 0);
      callbacks.onCash(reward);
      callbacks.onChipCollected?.(allDone);
      if (allDone) {
        this.audioManager.playMissionComplete();
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `集齐全部 ${CHIP_LOCATIONS.length} 枚霓虹数据芯片！额外奖励 +$1,500！`
        );
      } else {
        this.audioManager.playPurchase();
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `拾取【${chipDef?.label ?? '霓虹芯片'}】(${this.collectedChipIds.size}/${CHIP_LOCATIONS.length}) +$${node.amount}`
        );
      }
      this.emitExploration();
      return;
    }

    if (node.kind === 'cash') {
      callbacks.onCash(node.amount);
      this.audioManager.playPurchase();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `拾取现金模块 +$${node.amount}`);
      return;
    }

    if (node.kind === 'medkit') {
      callbacks.onHeal(node.amount);
      this.audioManager.playInteract();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `纳米医疗包 +${node.amount} 生命值`);
      return;
    }

    if (node.kind === 'ammo') {
      let refilled = false;
      for (const wId of WEAPON_ORDER) {
        const spec = WEAPON_SPECS[wId];
        if (!spec.infiniteAmmo && callbacks.weaponManager.isOwned(wId)) {
          if (callbacks.weaponManager.addAmmo(wId, Math.round(spec.ammoPackSize * 0.6))) {
            refilled = true;
          }
        }
      }
      this.audioManager.playPurchase();
      if (refilled) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '高能弹药箱：已补充重武器弹药！');
      } else {
        callbacks.onCash(30);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '弹药模块折算现金 +$30');
      }
      return;
    }

    if (node.kind === 'armor') {
      callbacks.onArmor?.(node.amount || 50);
      this.audioManager.playArmorPickup();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `防弹战术护甲 +${node.amount || 50}`);
      return;
    }

    if (node.kind === 'bribe') {
      callbacks.onBribe?.();
      this.audioManager.playPurchase();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '获取警方通缉消除徽章：通缉等级 -1★！');
      return;
    }

    if (node.kind === 'overdrive') {
      callbacks.onOverdrive(node.amount || 8);
      this.audioManager.playMissionComplete();
    }
  }

  public serializeCollectedChips(): string[] {
    return Array.from(this.collectedChipIds);
  }

  public restoreCollectedChips(ids?: string[]): void {
    this.collectedChipIds = new Set(Array.isArray(ids) ? ids : []);
    this.initializeWorldPickups();
  }

  public resetAllChips(): void {
    this.collectedChipIds.clear();
    this.initializeWorldPickups();
  }

  public emitExploration(): void {
    const chipMarkers = CHIP_LOCATIONS.filter((c) => !this.collectedChipIds.has(c.id)).map((c) => ({
      x: c.x,
      y: c.y,
    }));
    gameEvents.emit(GAME_EVENT.EXPLORATION_UPDATED, {
      chipsCollected: this.collectedChipIds.size,
      totalChips: CHIP_LOCATIONS.length,
      chipMarkers,
    });
  }

  private clearAllNodes(): void {
    for (const node of this.nodes) {
      node.sprite.destroy();
      node.glow.destroy();
    }
    this.nodes = [];
  }

  public destroy(): void {
    this.clearAllNodes();
    this.crateRespawnAt.clear();
  }
}
