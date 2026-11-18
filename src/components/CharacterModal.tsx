import { useState } from 'react';
import { Award, Cpu, ShieldCheck, Sparkles, X, Zap } from 'lucide-react';
import {
  CYBERWARE_SLOT_ORDER,
  CYBERWARE_SPECS,
  REPUTATION_ORDER,
  REPUTATION_SPECS,
  SKILL_TREE_ORDER,
  SKILL_TREE_SPECS,
} from '../game/config/ExpansionConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

type CharacterTabId = 'skills' | 'cyberware' | 'reputation';

export function CharacterModal() {
  const showCharacterModal = useGameStore((s) => s.showCharacterModal);
  const setShowCharacterModal = useGameStore((s) => s.setShowCharacterModal);
  const progression = useGameStore((s) => s.progression);
  const cash = useGameStore((s) => s.cash);
  const [activeTab, setActiveTab] = useState<CharacterTabId>('skills');

  if (!showCharacterModal) return null;

  const expPct =
    progression.nextLevelExp > 0
      ? Math.min(100, Math.round((progression.exp / progression.nextLevelExp) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#080D18]/88 p-3 sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto border border-[#00F5FF]/70 bg-[#0D1424] p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="border border-[#00F5FF] bg-[#00F5FF]/15 px-2 py-0.5 font-mono-tabular text-xs font-bold text-[#00F5FF]">
                Lv.{progression.level}
              </span>
              <h2 className="text-lg font-bold tracking-wider text-slate-100 sm:text-xl">
                角色能力 · 义体改造与声望档案
              </h2>
              <span
                className={`border px-2 py-0.5 font-mono-tabular text-xs font-bold ${
                  progression.skillPoints > 0
                    ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166]'
                    : 'border-slate-700 bg-[#151C2B] text-slate-400'
                }`}
              >
                可用技能点: {progression.skillPoints}
              </span>
              <span className="border border-[#FFD166]/45 bg-[#080D18] px-2 py-0.5 font-mono-tabular text-xs font-bold text-[#FFD166]">
                ${cash.toLocaleString()}
              </span>
            </div>

            {/* EXP Progress Bar */}
            <div className="mt-2.5 max-w-md">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                <span>经验值进度</span>
                <span className="font-mono-tabular text-[#00F5FF]">
                  {progression.exp} / {progression.nextLevelExp} ({expPct}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#151C2B]">
                <div
                  className="h-full bg-[#00F5FF] transition-all duration-150"
                  style={{ width: `${expPct}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCharacterModal(false)}
            aria-label="关闭角色面板"
            className="flex h-10 w-10 cursor-pointer items-center justify-center border border-slate-700 bg-[#151C2B] text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Combat Summary Strip */}
        <div className="grid grid-cols-2 gap-2 border border-slate-800 bg-[#080D18] px-3 py-2 font-mono-tabular text-[11px] sm:grid-cols-6">
          <div className="text-slate-300">
            伤害 <span className="font-bold text-[#FF2E88]">+{progression.damageBonusPct}%</span>
          </div>
          <div className="text-slate-300">
            暴击 <span className="font-bold text-[#FFD166]">{progression.critChancePct}%</span>
          </div>
          <div className="text-slate-300">
            射速 <span className="font-bold text-[#00F5FF]">+{progression.fireRateBonusPct}%</span>
          </div>
          <div className="text-slate-300">
            移速 <span className="font-bold text-[#38BDF8]">+{progression.moveSpeedBonusPct}%</span>
          </div>
          <div className="text-slate-300">
            车速 <span className="font-bold text-[#FACC15]">+{progression.vehicleSpeedBonusPct}%</span>
          </div>
          <div className="text-slate-300">
            减伤 <span className="font-bold text-[#4ADE80]">{progression.damageReductionPct}%</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
              activeTab === 'skills'
                ? 'border-[#FFD166] bg-[#FFD166]/18 text-[#FFD166]'
                : 'border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>能力技能树</span>
            {progression.skillPoints > 0 && (
              <span className="bg-[#FFD166] px-1.5 py-0.5 font-mono-tabular text-[10px] text-[#080D18]">
                {progression.skillPoints}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cyberware')}
            className={`flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
              activeTab === 'cyberware'
                ? 'border-[#00F5FF] bg-[#00F5FF]/18 text-[#00F5FF]'
                : 'border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>赛博义体植入</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reputation')}
            className={`flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
              activeTab === 'reputation'
                ? 'border-[#FF2E88] bg-[#FF2E88]/18 text-[#FF2E88]'
                : 'border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>三方声望档案</span>
          </button>
        </div>

        {/* Tab 1: Skill Trees */}
        {activeTab === 'skills' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {SKILL_TREE_ORDER.map((trackId) => {
              const spec = SKILL_TREE_SPECS[trackId];
              const curLv = progression.skills[trackId] ?? 0;
              const isMax = curLv >= spec.maxLevel;
              const canUpgrade = !isMax && progression.skillPoints > 0;

              return (
                <div
                  key={trackId}
                  className="flex flex-col justify-between gap-3 border bg-[#080D18] p-3.5"
                  style={{ borderColor: `${spec.accentColor}66` }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-bold tracking-wider"
                        style={{ color: spec.accentColor }}
                      >
                        {spec.name}
                      </span>
                      <span className="border border-slate-700 bg-[#111827] px-2 py-0.5 font-mono-tabular text-xs font-bold text-slate-100">
                        Lv.{curLv}/{spec.maxLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{spec.subtitle}</p>

                    <div className="mt-2.5 space-y-1.5">
                      {spec.levelEffects.map((effect, idx) => {
                        const tierLv = idx + 1;
                        const unlocked = curLv >= tierLv;
                        const isNext = curLv + 1 === tierLv;

                        return (
                          <div
                            key={`${trackId}-lv-${tierLv}`}
                            className={`flex items-start gap-2 border px-2.5 py-1.5 text-[11px] ${
                              unlocked
                                ? 'border-emerald-500/45 bg-emerald-950/25 text-slate-100'
                                : isNext
                                  ? 'border-slate-600 bg-[#111827] text-slate-200'
                                  : 'border-slate-800/80 bg-[#0D1424]/50 text-slate-500'
                            }`}
                          >
                            <span
                              className="mt-0.5 shrink-0 font-mono-tabular text-[10px] font-bold"
                              style={{ color: unlocked ? '#4ADE80' : spec.accentColor }}
                            >
                              Lv.{tierLv}
                            </span>
                            <span className="leading-snug">{effect}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!canUpgrade}
                    onClick={() => gameEvents.emit(GAME_EVENT.UPGRADE_SKILL, trackId)}
                    className={`flex min-h-[38px] w-full items-center justify-center gap-1.5 border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors ${
                      isMax
                        ? 'cursor-default border-emerald-600/50 bg-emerald-950/30 text-emerald-300'
                        : canUpgrade
                          ? 'cursor-pointer border-[#FFD166] bg-[#FFD166]/18 text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]'
                          : 'cursor-not-allowed border-slate-700 bg-[#111827] text-slate-500'
                    }`}
                  >
                    {isMax
                      ? '已达满级专精'
                      : canUpgrade
                        ? '消耗 1 技能点升级'
                        : '技能点不足（完成任务/事件/战斗获取经验）'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Cyberware Implants */}
        {activeTab === 'cyberware' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {CYBERWARE_SLOT_ORDER.map((slotId) => {
              const spec = CYBERWARE_SPECS[slotId];
              const installedTier = progression.cyberware[slotId] ?? 0;
              const currentSpec = installedTier > 0 ? spec.tiers[installedTier - 1] : null;
              const nextSpec =
                installedTier < spec.tiers.length ? spec.tiers[installedTier] : null;

              const reqFaction = nextSpec?.requiredFaction;
              const reqRep = nextSpec?.requiredRep ?? 0;
              const currentRep = reqFaction ? progression.reputation[reqFaction] ?? 0 : 0;
              const repMet = !reqFaction || currentRep >= reqRep;
              const cashMet = nextSpec ? cash >= nextSpec.cost : false;
              const canInstall = Boolean(nextSpec && repMet && cashMet);

              return (
                <div
                  key={slotId}
                  className="flex flex-col justify-between gap-3 border bg-[#080D18] p-3.5"
                  style={{ borderColor: `${spec.accentColor}66` }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-bold tracking-wider"
                        style={{ color: spec.accentColor }}
                      >
                        {spec.slotLabel}
                      </span>
                      <span className="border border-slate-700 bg-[#111827] px-2 py-0.5 font-mono-tabular text-xs font-bold text-slate-100">
                        {installedTier > 0 ? `已装 MK.${installedTier}` : '未安装'}
                      </span>
                    </div>

                    <div className="mt-2 border border-slate-800 bg-[#111827]/70 p-2.5 text-xs">
                      <div className="text-[10px] text-slate-400">当前生效配置</div>
                      {currentSpec ? (
                        <>
                          <div className="mt-0.5 font-bold text-slate-100">
                            {currentSpec.name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-emerald-300">
                            {currentSpec.effectText}
                          </div>
                        </>
                      ) : (
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          原生人体组织（尚未植入军用级义体）
                        </div>
                      )}
                    </div>

                    {nextSpec && (
                      <div className="mt-2 border border-slate-700/80 bg-[#0D1424] p-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#00F5FF]">
                            下一阶植入：MK.{nextSpec.tier}
                          </span>
                          <span className="font-mono-tabular text-xs font-bold text-[#FFD166]">
                            ${nextSpec.cost}
                          </span>
                        </div>
                        <div className="mt-0.5 font-bold text-slate-100">{nextSpec.name}</div>
                        <div className="mt-0.5 text-[11px] text-slate-300">
                          {nextSpec.effectText}
                        </div>

                        {reqFaction && (
                          <div
                            className={`mt-1.5 inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold ${
                              repMet
                                ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-300'
                                : 'border-[#FF4545]/60 bg-[#FF4545]/10 text-[#FF4545]'
                            }`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            <span>
                              需求 {REPUTATION_SPECS[reqFaction].name} {currentRep}/{reqRep}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {nextSpec ? (
                    <button
                      type="button"
                      disabled={!canInstall}
                      onClick={() => gameEvents.emit(GAME_EVENT.BUY_CYBERWARE, slotId)}
                      className={`flex min-h-[38px] w-full items-center justify-center gap-1.5 border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors ${
                        canInstall
                          ? 'cursor-pointer border-[#00F5FF] bg-[#00F5FF]/18 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                          : 'cursor-not-allowed border-slate-700 bg-[#111827] text-slate-500'
                      }`}
                    >
                      {!repMet
                        ? `需要${REPUTATION_SPECS[reqFaction!].name} ≥ ${reqRep}`
                        : !cashMet
                          ? `现金不足（需要 $${nextSpec.cost}）`
                          : `植入安装 $${nextSpec.cost}`}
                    </button>
                  ) : (
                    <div className="flex min-h-[38px] items-center justify-center border border-emerald-600/50 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-300">
                      终极军用义体已满阶
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Faction Reputations */}
        {activeTab === 'reputation' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {REPUTATION_ORDER.map((factionId) => {
              const spec = REPUTATION_SPECS[factionId];
              const rep = progression.reputation[factionId] ?? 0;
              let currentTitle = spec.ranks[0].title;
              let nextMilestone: { minRep: number; title: string } | null = null;

              for (let i = 0; i < spec.ranks.length; i++) {
                if (rep >= spec.ranks[i].minRep) {
                  currentTitle = spec.ranks[i].title;
                } else if (!nextMilestone) {
                  nextMilestone = spec.ranks[i];
                }
              }

              const maxMilestone = spec.ranks[spec.ranks.length - 1].minRep;
              const barPct = Math.min(100, Math.round((rep / maxMilestone) * 100));

              return (
                <div
                  key={factionId}
                  className="flex flex-col justify-between gap-3 border bg-[#080D18] p-4"
                  style={{ borderColor: `${spec.accentColor}70` }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-base font-bold tracking-wider"
                        style={{ color: spec.accentColor }}
                      >
                        {spec.name}
                      </span>
                      <span className="font-mono-tabular text-sm font-bold text-slate-100">
                        {rep} 声望
                      </span>
                    </div>

                    <div className="mt-2 inline-flex items-center gap-1.5 border border-slate-700 bg-[#111827] px-2.5 py-1 text-xs font-bold text-slate-100">
                      <Sparkles className="h-3.5 w-3.5" style={{ color: spec.accentColor }} />
                      <span>当前阶位：{currentTitle}</span>
                    </div>

                    <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
                      {spec.description}
                    </p>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>声望晋升进度</span>
                        <span className="font-mono-tabular">
                          {nextMilestone
                            ? `距「${nextMilestone.title}」(${nextMilestone.minRep})`
                            : '已达最高传奇阶位'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#151C2B]">
                        <div
                          className="h-full transition-all duration-200"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: spec.accentColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
                    {spec.ranks.map((rk) => {
                      const reached = rep >= rk.minRep;
                      return (
                        <div
                          key={`${factionId}-${rk.minRep}`}
                          className={`flex items-center justify-between px-2 py-1 text-[11px] ${
                            reached
                              ? 'bg-[#111827] font-semibold text-slate-100'
                              : 'text-slate-500'
                          }`}
                        >
                          <span>{rk.title}</span>
                          <span className="font-mono-tabular">
                            {rk.minRep === 0 ? '初始' : `${rk.minRep}+`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
