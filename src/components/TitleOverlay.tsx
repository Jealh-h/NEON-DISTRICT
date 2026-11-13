import { useEffect, useMemo } from 'react';
import { Flame, Compass, Timer } from 'lucide-react';
import { GAME_MODE_DEFS, GamePlayMode, MISSION_DEFINITIONS } from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

function formatSaveTime(ts: number | null): string {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function TitleOverlay() {
  const saveStatus = useGameStore((s) => s.saveStatus);
  const horde = useGameStore((s) => s.horde);
  const race = useGameStore((s) => s.race);

  const localRecords = useMemo(() => {
    let bestWave = horde.bestWave;
    let bestScore = horde.bestScore;
    let bestRaceSec = race.bestTimeSec;
    try {
      const hRaw = window.localStorage.getItem('neon_district_horde_records_v1');
      if (hRaw) {
        const parsed = JSON.parse(hRaw) as { bestWave?: number; bestScore?: number };
        if (typeof parsed.bestWave === 'number') bestWave = Math.max(bestWave, parsed.bestWave);
        if (typeof parsed.bestScore === 'number') bestScore = Math.max(bestScore, parsed.bestScore);
      }
      const rRaw = window.localStorage.getItem('neon_district_race_records_v1');
      if (rRaw) {
        const parsed = JSON.parse(rRaw) as { bestTimeSec?: number };
        if (typeof parsed.bestTimeSec === 'number' && parsed.bestTimeSec > 0) {
          bestRaceSec =
            bestRaceSec === null ? parsed.bestTimeSec : Math.min(bestRaceSec, parsed.bestTimeSec);
        }
      }
    } catch {
      // Ignore storage access errors
    }
    return { bestWave, bestScore, bestRaceSec };
  }, [horde.bestWave, horde.bestScore, race.bestTimeSec]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        gameEvents.emit(saveStatus.hasSave ? GAME_EVENT.CONTINUE_GAME : GAME_EVENT.START_NEW_GAME);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveStatus.hasSave]);

  const handleStartMode = (modeId: GamePlayMode) => {
    if (modeId === 'sandbox') {
      gameEvents.emit(saveStatus.hasSave ? GAME_EVENT.CONTINUE_GAME : GAME_EVENT.START_NEW_GAME);
      return;
    }
    gameEvents.emit(GAME_EVENT.START_PLAY_MODE, modeId);
  };

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto px-4 py-6 sm:px-6"
      style={{
        background:
          'radial-gradient(circle at 50% 42%, rgba(8, 13, 24, 0.45) 0%, rgba(8, 13, 24, 0.85) 68%, rgba(8, 13, 24, 0.96) 100%)',
      }}
    >
      <div className="flex w-full max-w-4xl flex-col items-center text-center">
        <p className="mb-2 font-mono-tabular text-xs tracking-[0.26em] text-[#00F5FF]">
          五大连通城区 · 3200 × 2400 开放沙盒
        </p>

        {/* Bespoke inline SVG Title Lockup */}
        <svg
          viewBox="0 0 640 132"
          className="mb-3 w-full max-w-[480px]"
          role="img"
          aria-label="霓虹特区 NEON DISTRICT"
        >
          <defs>
            <linearGradient id="neonTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F5FF" />
              <stop offset="55%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#FF2E88" />
            </linearGradient>
          </defs>
          <path d="M8 26 V8 H44" fill="none" stroke="#00F5FF" strokeWidth="3" />
          <path d="M596 8 H632 V26" fill="none" stroke="#FF2E88" strokeWidth="3" />
          <path d="M8 106 V124 H44" fill="none" stroke="#C000FF" strokeWidth="3" />
          <path d="M596 124 H632 V106" fill="none" stroke="#00F5FF" strokeWidth="3" />

          <text
            x="320"
            y="70"
            textAnchor="middle"
            fill="#080D18"
            stroke="#C000FF"
            strokeWidth="7"
            fontFamily="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
            fontWeight="700"
            fontSize="60"
            letterSpacing="12"
          >
            霓虹特区
          </text>
          <text
            x="320"
            y="70"
            textAnchor="middle"
            fill="url(#neonTitleGrad)"
            fontFamily="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
            fontWeight="700"
            fontSize="60"
            letterSpacing="12"
          >
            霓虹特区
          </text>

          <rect x="88" y="90" width="464" height="3" fill="#00F5FF" fillOpacity="0.85" />
          <text
            x="320"
            y="112"
            textAnchor="middle"
            fill="#94A3B8"
            fontFamily="'Chakra Petch', sans-serif"
            fontWeight="700"
            fontSize="13"
            letterSpacing="8"
          >
            NEON DISTRICT · SANDBOX EDITION
          </text>
        </svg>

        <p className="mb-5 max-w-xl text-xs leading-relaxed text-slate-300 sm:text-sm">
          探索霓虹广场、暗港码头、铬铁涡轮高速与苍穹山脉，体验三大模式：开放沙盒、无尽杀怪与环城竞速。
        </p>

        {/* Three Mode Cards */}
        <div className="grid w-full grid-cols-1 gap-3 text-left md:grid-cols-3">
          {GAME_MODE_DEFS.map((m) => {
            const Icon = m.id === 'sandbox' ? Compass : m.id === 'horde' ? Flame : Timer;
            return (
              <div
                key={m.id}
                className="flex flex-col justify-between border bg-[#0D1424]/92 p-4 transition-colors"
                style={{ borderColor: `${m.accentHex}70` }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: m.accentHex }} />
                      <h2 className="text-base font-bold tracking-wider text-slate-100">
                        {m.name}
                      </h2>
                    </div>
                    <span
                      className="border px-1.5 py-0.5 text-[10px] font-bold"
                      style={{
                        borderColor: `${m.accentHex}60`,
                        color: m.accentHex,
                        backgroundColor: `${m.accentHex}15`,
                      }}
                    >
                      {m.tag}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{m.description}</p>

                  <div className="mt-2.5 border-t border-slate-800 pt-2 font-mono-tabular text-[11px] text-slate-400">
                    {m.id === 'sandbox' &&
                      (saveStatus.hasSave ? (
                        <span className="text-[#FFD166]">
                          存档：${(saveStatus.cash ?? 0).toLocaleString()} · 委托{' '}
                          {saveStatus.completedCount}/{MISSION_DEFINITIONS.length}
                          {saveStatus.savedAt ? ` · ${formatSaveTime(saveStatus.savedAt)}` : ''}
                        </span>
                      ) : (
                        <span>含 7 项委托 · 10 枚数据芯片 · 5 城区</span>
                      ))}
                    {m.id === 'horde' && (
                      <span>
                        最高波次：<strong className="text-[#FF2E88]">{localRecords.bestWave}</strong>
                        <span className="mx-1.5 text-slate-600">|</span>
                        最高分：<strong className="text-[#FFD166]">{localRecords.bestScore.toLocaleString()}</strong>
                      </span>
                    )}
                    {m.id === 'race' && (
                      <span>
                        环城最佳：
                        <strong className="text-[#FFD166]">
                          {localRecords.bestRaceSec !== null
                            ? `${localRecords.bestRaceSec}s`
                            : '尚无纪录'}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartMode(m.id)}
                    className="min-h-[44px] w-full cursor-pointer border-2 px-4 py-2 text-xs font-bold tracking-[0.16em] transition-all active:scale-[0.98]"
                    style={{
                      borderColor: m.accentHex,
                      color: m.accentHex,
                      backgroundColor: `${m.accentHex}16`,
                    }}
                  >
                    {m.id === 'sandbox'
                      ? saveStatus.hasSave
                        ? '继续沙盒存档'
                        : '进入自由沙盒'
                      : m.id === 'horde'
                        ? '开启无尽杀怪'
                        : '开启极速狂飙'}
                  </button>

                  {m.id === 'sandbox' && saveStatus.hasSave && (
                    <button
                      type="button"
                      onClick={() => gameEvents.emit(GAME_EVENT.START_NEW_GAME)}
                      className="min-h-[38px] w-full cursor-pointer border border-slate-700 bg-[#080D18]/85 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-[#FF2E88] hover:text-[#FF2E88]"
                    >
                      重置开始新沙盒
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 font-mono-tabular text-[11px] tracking-wide text-slate-400">
          WASD 移动 · 左键/J 开火 · Q/1-3 切枪 · B 随身军械 · Shift 氮气加速 · F 上下车 · M 地图
        </p>
      </div>
    </div>
  );
}
