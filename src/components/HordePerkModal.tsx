import { Sparkles } from 'lucide-react';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

export function HordePerkModal() {
  const playMode = useGameStore((s) => s.playMode);
  const hordePerkOffer = useGameStore((s) => s.hordePerkOffer);

  if (playMode !== 'horde' || !hordePerkOffer || hordePerkOffer.choices.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#080D18]/88 p-3 sm:p-5">
      <div className="w-full max-w-4xl border-2 border-[#FFD166] bg-[#0D1424] p-4 sm:p-6">
        <div className="border-b border-slate-800 pb-3 text-center">
          <div className="inline-flex items-center gap-1.5 border border-[#FF2E88]/70 bg-[#FF2E88]/15 px-3 py-0.5 text-[11px] font-bold tracking-widest text-[#FF2E88]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>肉鸽战地强化空投</span>
          </div>
          <h2 className="mt-2 text-xl font-bold tracking-wider text-[#FFD166] sm:text-2xl">
            第 {hordePerkOffer.waveCleared} 波肃清 · 战术强化三选一
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            选择一项可叠加战斗强化模块，立即生效并进入下一波尸潮攻势
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {hordePerkOffer.choices.map((choice, idx) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.SELECT_HORDE_PERK, choice.id)}
              className="group flex cursor-pointer flex-col justify-between gap-3 border-2 bg-[#080D18] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-[#111B30]"
              style={{ borderColor: choice.accentColor }}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="border px-2 py-0.5 text-[10px] font-bold tracking-widest"
                    style={{
                      borderColor: `${choice.accentColor}99`,
                      color: choice.accentColor,
                      backgroundColor: `${choice.accentColor}18`,
                    }}
                  >
                    {choice.tagline}
                  </span>
                  <span className="font-mono-tabular text-[11px] font-bold text-slate-300">
                    Lv.{choice.currentStacks} → Lv.{choice.currentStacks + 1} / {choice.maxStacks}
                  </span>
                </div>

                <h3
                  className="mt-3 text-lg font-bold tracking-wider"
                  style={{ color: choice.accentColor }}
                >
                  {choice.name}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  {choice.description}
                </p>
              </div>

              <div
                className="flex items-center justify-between border-t border-slate-800 pt-2.5 text-xs font-bold"
                style={{ color: choice.accentColor }}
              >
                <span>方案 {idx + 1}</span>
                <span className="group-hover:underline">装载此模块 →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
