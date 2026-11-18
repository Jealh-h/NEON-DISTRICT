import {
  CYBERWARE_SLOT_ORDER,
  CYBERWARE_SPECS,
  CyberwareSlotId,
  REPUTATION_SPECS,
  ReputationFactionId,
  SKILL_TREE_ORDER,
  SKILL_TREE_SPECS,
  SkillTrackId,
} from '../config/ExpansionConfig';
import { GAME_EVENT, gameEvents } from '../ui/GameEvents';
import { AudioManager } from './AudioManager';

export interface SavedProgressionState {
  level: number;
  exp: number;
  skillPoints: number;
  skills: Record<SkillTrackId, number>;
  cyberware: Record<CyberwareSlotId, number>;
  reputation: Record<ReputationFactionId, number>;
}

function createDefaultSkills(): Record<SkillTrackId, number> {
  return { combat: 0, mechanics: 0, hacking: 0, survival: 0 };
}

function createDefaultCyberware(): Record<CyberwareSlotId, number> {
  return { optics: 0, arms: 0, legs: 0, spine: 0, neural: 0 };
}

function createDefaultReputation(): Record<ReputationFactionId, number> {
  return { street: 0, hacker: 0, law: 0 };
}

export class ProgressionManager {
  private audioManager: AudioManager;

  private level = 1;
  private exp = 0;
  private skillPoints = 1; // Start with 1 skill point so players can try skill tree immediately!
  private skills: Record<SkillTrackId, number> = createDefaultSkills();
  private cyberware: Record<CyberwareSlotId, number> = createDefaultCyberware();
  private reputation: Record<ReputationFactionId, number> = createDefaultReputation();

  private jammerCooldownSec = 0;
  private jammerActiveSec = 0;
  private lastEmitAt = 0;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public getNextLevelExp(level = this.level): number {
    return 120 + (level - 1) * 75;
  }

  public update(dtSeconds: number, nowMs: number): void {
    let changed = false;
    if (this.jammerCooldownSec > 0) {
      this.jammerCooldownSec = Math.max(0, this.jammerCooldownSec - dtSeconds);
      changed = true;
    }
    if (this.jammerActiveSec > 0) {
      this.jammerActiveSec = Math.max(0, this.jammerActiveSec - dtSeconds);
      changed = true;
    }
    if (changed) {
      this.emitTelemetry(false, nowMs);
    }
  }

  public addExp(baseAmount: number, sourceLabel?: string): void {
    if (baseAmount <= 0) return;
    const gained = Math.max(1, Math.round(baseAmount * this.getExpMultiplier()));
    this.exp += gained;

    let leveledUp = false;
    while (this.exp >= this.getNextLevelExp(this.level)) {
      this.exp -= this.getNextLevelExp(this.level);
      this.level += 1;
      this.skillPoints += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      this.audioManager.playMissionComplete();
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `角色升级！达到 Lv.${this.level}，获得 +1 技能点（按 C 打开角色与义体终端）！`
      );
    } else if (sourceLabel && gained >= 25) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${sourceLabel} · 经验 +${gained}`);
    }
    this.emitTelemetry(true);
  }

  public addReputation(rewards: Partial<Record<ReputationFactionId, number>>): void {
    let updated = false;
    for (const [k, amt] of Object.entries(rewards)) {
      const faction = k as ReputationFactionId;
      if (!amt || amt <= 0 || !(faction in this.reputation)) continue;
      const prevRank = this.getFactionRankTitle(faction);
      this.reputation[faction] += Math.round(amt);
      updated = true;
      const nextRank = this.getFactionRankTitle(faction);
      if (nextRank !== prevRank) {
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `${REPUTATION_SPECS[faction].name}晋升为【${nextRank}】！已解锁更高阶义体！`
        );
      }
    }
    if (updated) {
      this.emitTelemetry(true);
    }
  }

  public getFactionRankTitle(faction: ReputationFactionId): string {
    const rep = this.reputation[faction] ?? 0;
    const ranks = REPUTATION_SPECS[faction].ranks;
    let title = ranks[0].title;
    for (const r of ranks) {
      if (rep >= r.minRep) title = r.title;
    }
    return title;
  }

  public upgradeSkill(track: SkillTrackId): boolean {
    const spec = SKILL_TREE_SPECS[track];
    const current = this.skills[track] ?? 0;
    if (current >= spec.maxLevel) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `【${spec.name}】已达最高等级！`);
      return false;
    }
    if (this.skillPoints <= 0) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '可用技能点不足，完成委托、事件或战斗升级即可获取！');
      return false;
    }
    this.skillPoints -= 1;
    this.skills[track] = current + 1;
    this.audioManager.playPurchase();
    this.emitTelemetry(true);
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `已升级【${spec.name} Lv.${this.skills[track]}】· ${spec.levelEffects[this.skills[track] - 1]}`
    );
    return true;
  }

  public getCyberwareCost(slot: CyberwareSlotId, targetTier: number): number {
    const spec = CYBERWARE_SPECS[slot];
    const tierSpec = spec.tiers[targetTier - 1];
    if (!tierSpec) return 0;
    return Math.round(tierSpec.cost * this.getShopPriceMultiplier());
  }

  public buyCyberware(
    slot: CyberwareSlotId,
    deductCash: (cost: number) => boolean
  ): boolean {
    const spec = CYBERWARE_SPECS[slot];
    const currentTier = this.cyberware[slot] ?? 0;
    if (currentTier >= spec.tiers.length) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `【${spec.slotLabel}】已植入最高阶军用义体！`);
      return false;
    }
    const nextTierSpec = spec.tiers[currentTier];
    if (nextTierSpec.requiredFaction && nextTierSpec.requiredRep) {
      const currentRep = this.reputation[nextTierSpec.requiredFaction] ?? 0;
      if (currentRep < nextTierSpec.requiredRep) {
        const facName = REPUTATION_SPECS[nextTierSpec.requiredFaction].name;
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          `植入【${nextTierSpec.name}】需要 ${facName} ≥ ${nextTierSpec.requiredRep}（当前 ${currentRep}）！`
        );
        return false;
      }
    }

    const finalCost = this.getCyberwareCost(slot, nextTierSpec.tier);
    if (!deductCash(finalCost)) return false;

    this.cyberware[slot] = nextTierSpec.tier;
    this.audioManager.playPurchase();
    this.emitTelemetry(true);
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `义体手术完成！已植入【${nextTierSpec.name}】(${nextTierSpec.effectText})`
    );
    return true;
  }

  public canUseJammer(): boolean {
    return this.skills.hacking >= 2;
  }

  public isJammerActive(): boolean {
    return this.jammerActiveSec > 0;
  }

  public tryTriggerJammer(wantedLevel: number): { activated: boolean; durationSec: number } {
    if (!this.canUseJammer()) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '需先将【黑客专家】升至 Lv.2 才可启用警用信号干扰！');
      return { activated: false, durationSec: 0 };
    }
    if (wantedLevel === 0) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '当前未被通缉，无需启动信号干扰。');
      return { activated: false, durationSec: 0 };
    }
    if (wantedLevel > 3) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '4-5星军用加密频道无法被民用干扰器屏蔽！');
      return { activated: false, durationSec: 0 };
    }
    if (this.jammerCooldownSec > 0) {
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `信号干扰器充能中，剩余 ${Math.ceil(this.jammerCooldownSec)} 秒。`
      );
      return { activated: false, durationSec: 0 };
    }

    const durationSec = this.skills.hacking >= 4 ? 11 : 8;
    const cdBase = this.skills.hacking >= 3 ? 22 : 28;
    const neuralCdMult = this.cyberware.neural >= 3 ? 0.65 : this.cyberware.neural === 2 ? 0.8 : 1;
    this.jammerActiveSec = durationSec;
    this.jammerCooldownSec = Math.round(cdBase * neuralCdMult);
    this.audioManager.playEscapedChime();
    this.emitTelemetry(true);
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `【警用雷达干扰已启动】持续 ${durationSec} 秒！警队已暂时丢失你的实时坐标！`
    );
    return { activated: true, durationSec };
  }

  // ---- Computed Gameplay Modifiers ----

  public getWeaponDamageMultiplier(): number {
    const combatLvl = this.skills.combat;
    const combatBonus = [0, 0.1, 0.2, 0.32, 0.45][combatLvl] ?? 0;
    const opticsBonus = [0, 0.05, 0.12, 0.2][this.cyberware.optics] ?? 0;
    const armsBonus = [0, 0.08, 0.16, 0.26][this.cyberware.arms] ?? 0;
    return 1 + combatBonus + opticsBonus + armsBonus;
  }

  public getCritChance(): number {
    const combatCrit = [0, 0.06, 0.12, 0.18, 0.25][this.skills.combat] ?? 0;
    const opticsCrit = [0, 0.06, 0.12, 0.2][this.cyberware.optics] ?? 0;
    return Math.min(0.65, combatCrit + opticsCrit);
  }

  public getFireRateMultiplier(): number {
    const combatRate = this.skills.combat >= 3 ? 0.15 : this.skills.combat >= 2 ? 0.08 : 0;
    const armsRate = this.cyberware.arms >= 3 ? 0.15 : this.cyberware.arms === 2 ? 0.08 : 0;
    const spineRate = [0, 0.1, 0.18, 0.26][this.cyberware.spine] ?? 0;
    return 1 + combatRate + armsRate + spineRate;
  }

  public getKillHealAmount(): number {
    return this.skills.combat >= 4 ? 5 : 0;
  }

  public getMoveSpeedMultiplier(): number {
    const survSpeed = [0, 0.07, 0.07, 0.14, 0.14][this.skills.survival] ?? 0;
    const legsSpeed = [0, 0.1, 0.18, 0.26][this.cyberware.legs] ?? 0;
    return 1 + survSpeed + legsSpeed;
  }

  public getVehicleSpeedMultiplier(): number {
    const mechSpeed = [0, 0.06, 0.12, 0.18, 0.25][this.skills.mechanics] ?? 0;
    return 1 + mechSpeed;
  }

  public getNitroRegenMultiplier(): number {
    const mechNitro = [0, 0.18, 0.35, 0.35, 0.35][this.skills.mechanics] ?? 0;
    const legsNitro = this.cyberware.legs >= 3 ? 0.3 : this.cyberware.legs === 2 ? 0.15 : 0;
    return 1 + mechNitro + legsNitro;
  }

  public getGaragePriceMultiplier(): number {
    return [1, 0.9, 0.8, 0.75, 0.65][this.skills.mechanics] ?? 1;
  }

  public getShopPriceMultiplier(): number {
    return this.skills.hacking >= 3 ? 0.88 : 1;
  }

  public getMechAndTurretPowerMultiplier(): number {
    return this.skills.mechanics >= 4 ? 1.35 : this.skills.mechanics >= 3 ? 1.2 : 1;
  }

  public getAtmCashMultiplier(): number {
    return [1, 1.3, 1.3, 1.7, 2.0][this.skills.hacking] ?? 1;
  }

  public getAtmAlarmChance(): number {
    return [0.55, 0.38, 0.34, 0.28, 0.12][this.skills.hacking] ?? 0.55;
  }

  public getBonusMaxHealth(): number {
    return [0, 25, 50, 80, 120][this.skills.survival] ?? 0;
  }

  public getBonusMaxArmor(): number {
    return [0, 20, 40, 65, 90][this.skills.survival] ?? 0;
  }

  public getHealMultiplier(): number {
    return this.skills.survival >= 4 ? 1.35 : this.skills.survival >= 2 ? 1.2 : 1;
  }

  public getDamageReduction(): number {
    const survDR = this.skills.survival >= 4 ? 0.18 : this.skills.survival >= 3 ? 0.1 : 0;
    const spineDR = this.cyberware.spine >= 3 ? 0.16 : this.cyberware.spine === 2 ? 0.08 : 0;
    return Math.min(0.45, survDR + spineDR);
  }

  public getExpMultiplier(): number {
    return [1, 1.15, 1.28, 1.45][this.cyberware.neural] ?? 1;
  }

  public getRewardCashMultiplier(): number {
    return [1, 1.08, 1.16, 1.28][this.cyberware.neural] ?? 1;
  }

  public getLevel(): number {
    return this.level;
  }

  public serialize(): SavedProgressionState {
    return {
      level: this.level,
      exp: this.exp,
      skillPoints: this.skillPoints,
      skills: { ...this.skills },
      cyberware: { ...this.cyberware },
      reputation: { ...this.reputation },
    };
  }

  public restore(saved?: Partial<SavedProgressionState>): void {
    if (!saved) {
      this.reset();
      return;
    }
    this.level = Math.max(1, Math.floor(saved.level ?? 1));
    this.exp = Math.max(0, Math.floor(saved.exp ?? 0));
    this.skillPoints = Math.max(0, Math.floor(saved.skillPoints ?? 0));
    this.skills = createDefaultSkills();
    for (const id of SKILL_TREE_ORDER) {
      const max = SKILL_TREE_SPECS[id].maxLevel;
      this.skills[id] = Math.max(0, Math.min(max, Math.floor(saved.skills?.[id] ?? 0)));
    }
    this.cyberware = createDefaultCyberware();
    for (const slot of CYBERWARE_SLOT_ORDER) {
      const max = CYBERWARE_SPECS[slot].tiers.length;
      this.cyberware[slot] = Math.max(0, Math.min(max, Math.floor(saved.cyberware?.[slot] ?? 0)));
    }
    this.reputation = createDefaultReputation();
    this.reputation.street = Math.max(0, Math.floor(saved.reputation?.street ?? 0));
    this.reputation.hacker = Math.max(0, Math.floor(saved.reputation?.hacker ?? 0));
    this.reputation.law = Math.max(0, Math.floor(saved.reputation?.law ?? 0));
    this.jammerCooldownSec = 0;
    this.jammerActiveSec = 0;
    this.emitTelemetry(true);
  }

  public reset(): void {
    this.level = 1;
    this.exp = 0;
    this.skillPoints = 1;
    this.skills = createDefaultSkills();
    this.cyberware = createDefaultCyberware();
    this.reputation = createDefaultReputation();
    this.jammerCooldownSec = 0;
    this.jammerActiveSec = 0;
    this.emitTelemetry(true);
  }

  public emitTelemetry(force: boolean, nowMs = Date.now()): void {
    if (!force && nowMs - this.lastEmitAt < 250) return;
    this.lastEmitAt = nowMs;

    gameEvents.emit(GAME_EVENT.PROGRESSION_UPDATED, {
      level: this.level,
      exp: this.exp,
      nextLevelExp: this.getNextLevelExp(this.level),
      skillPoints: this.skillPoints,
      skills: { ...this.skills },
      cyberware: { ...this.cyberware },
      reputation: { ...this.reputation },
      jammerUnlocked: this.canUseJammer(),
      jammerCooldownSec: Math.ceil(this.jammerCooldownSec),
      jammerActiveSec: Math.ceil(this.jammerActiveSec),
      damageBonusPct: Math.round((this.getWeaponDamageMultiplier() - 1) * 100),
      critChancePct: Math.round(this.getCritChance() * 100),
      fireRateBonusPct: Math.round((this.getFireRateMultiplier() - 1) * 100),
      moveSpeedBonusPct: Math.round((this.getMoveSpeedMultiplier() - 1) * 100),
      vehicleSpeedBonusPct: Math.round((this.getVehicleSpeedMultiplier() - 1) * 100),
      damageReductionPct: Math.round(this.getDamageReduction() * 100),
    });
  }
}
