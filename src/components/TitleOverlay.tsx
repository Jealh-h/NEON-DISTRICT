import { useEffect, useMemo, useState } from 'react';
import {
  Car,
  Compass,
  Flame,
  Gamepad2,
  Play,
  RotateCcw,
  Settings,
  Timer,
  X,
} from 'lucide-react';
import { GAME_MODE_DEFS, GamePlayMode, MISSION_DEFINITIONS } from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';
import { TitleSkylineImg } from './PixelPortrait';

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
  const titleSubModal = useGameStore((s) => s.titleSubModal);
  const setTitleSubModal = useGameStore((s) => s.setTitleSubModal);
  const openHubTab = useGameStore((s) => s.openHubTab);

  const [confirmFreshStart, setConfirmFreshStart] = useState(false);

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
      if (e.key === 'Escape') {
        if (useGameStore.getState().titleSubModal !== null) {
          e.preventDefault();
          setTitleSubModal(null);
        }
        return;
      }

      if (useGameStore.getState().titleSubModal !== null) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        gameEvents.emit(saveStatus.hasSave ? GAME_EVENT.CONTINUE_GAME : GAME_EVENT.START_NEW_GAME);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saveStatus.hasSave, setTitleSubModal]);

  const handlePrimaryStart = () => {
    gameEvents.emit(saveStatus.hasSave ? GAME_EVENT.CONTINUE_GAME : GAME_EVENT.START_NEW_GAME);
  };

  const handleStartMode = (modeId: GamePlayMode) => {
    setTitleSubModal(null);
    if (modeId === 'sandbox') {
      gameEvents.emit(saveStatus.hasSave ? GAME_EVENT.CONTINUE_GAME : GAME_EVENT.START_NEW_GAME);
      return;
    }
    gameEvents.emit(GAME_EVENT.START_PLAY_MODE, modeId);
  };

  const handleFreshSandbox = () => {
    if (saveStatus.hasSave && !confirmFreshStart) {
      setConfirmFreshStart(true);
      return;
    }
    setConfirmFreshStart(false);
    setTitleSubModal(null);
    gameEvents.emit(GAME_EVENT.START_NEW_GAME);
  };

  return (
    <div className="fixed inset-0 z-20 overflow-hidden bg-[#080D18]">
      {/* Full-bleed Pixel Cyberpunk Skyline Art */}
      <TitleSkylineImg className="absolute inset-0 h-full w-full" />

      {/* Atmospheric Dark Scrims so left navigation pops while right skyline/hero stays vivid */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(95deg, rgba(7,10,24,0.92) 0%, rgba(10,13,32,0.78) 40%, rgba(10,14,32,0.28) 72%, rgba(8,13,24,0.45) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 22% 55%, rgba(192, 0, 255, 0.16) 0%, transparent 54%)',
        }}
      />

      <div className="relative z-10 flex h-full w-full flex-col justify-between overflow-y-auto px-5 py-6 sm:px-10 sm:py-8 lg:flex-row lg:items-center lg:gap-8">
        {/* Left Navigation Column (Matches Mockup Top-Left Composition) */}
        <div className="flex w-full max-w-[380px] shrink-0 flex-col justify-between gap-6">
          <div>
            <p className="mb-1.5 font-mono-tabular text-[11px] font-bold tracking-[0.22em] text-[#00F5FF]">
              七大连通城区 · 开放都市赛博动作沙盒
            </p>

            {/* Bespoke Neon SVG Title Lockup */}
            <svg
              viewBox="0 0 540 128"
              className="mb-3 w-full max-w-[360px]"
              role="img"
              aria-label="霓虹特区 NEON DISTRICT"
            >
              <defs>
                <linearGradient id="titleMainNeon" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00F5FF" />
                  <stop offset="50%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#FF2E88" />
                </linearGradient>
              </defs>
              <path d="M6 22 V6 H38" fill="none" stroke="#00F5FF" strokeWidth="2.5" />
              <path d="M502 6 H534 V22" fill="none" stroke="#FF2E88" strokeWidth="2.5" />
              <path d="M6 106 V122 H38" fill="none" stroke="#C000FF" strokeWidth="2.5" />
              <path d="M502 122 H534 V106" fill="none" stroke="#00F5FF" strokeWidth="2.5" />

              <text
                x="18"
                y="68"
                fill="#080D18"
                stroke="#C000FF"
                strokeWidth="8"
                fontFamily="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
                fontWeight="800"
                fontSize="58"
                letterSpacing="10"
              >
                霓虹特区
              </text>
              <text
                x="18"
                y="68"
                fill="url(#titleMainNeon)"
                fontFamily="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
                fontWeight="800"
                fontSize="58"
                letterSpacing="10"
              >
                霓虹特区
              </text>

              <rect x="18" y="84" width="380" height="3" fill="#00F5FF" fillOpacity="0.9" />
              <text
                x="20"
                y="110"
                fill="#FF2E88"
                fontFamily="'Chakra Petch', sans-serif"
                fontWeight="700"
                fontSize="20"
                letterSpacing="6"
              >
                NEON DISTRICT
              </text>
            </svg>

            {saveStatus.hasSave && (
              <div className="mb-3 border-l-2 border-[#FFD166] bg-[#0B1226]/90 px-3 py-1.5 font-mono-tabular text-[11px] text-[#FFD166]">
                当前存档：${(saveStatus.cash ?? 0).toLocaleString()} · 委托{' '}
                {saveStatus.completedCount}/{MISSION_DEFINITIONS.length}
                {saveStatus.savedAt ? ` · ${formatSaveTime(saveStatus.savedAt)}` : ''}
              </div>
            )}
          </div>

          {/* 5 Vertical Menu Buttons matching Mockup */}
          <nav className="flex flex-col gap-2.5" aria-label="主菜单">
            <button
              type="button"
              onClick={handlePrimaryStart}
              className="group flex min-h-[50px] cursor-pointer items-center justify-between border-2 border-[#FF2E88] bg-gradient-to-r from-[#C000FF]/85 via-[#D900B8]/80 to-[#FF2E88]/75 px-4 py-2.5 text-left transition-all hover:brightness-115 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <Play className="h-5 w-5 fill-white text-white" />
                <div>
                  <div className="text-base font-bold tracking-[0.18em] text-white">开始游戏</div>
                  <div className="text-[10px] font-medium text-pink-100/90">
                    {saveStatus.hasSave ? '继续沙盒存档进度' : '进入自由开放沙盒'}
                  </div>
                </div>
              </div>
              <span className="font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                [ENTER]
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setTitleSubModal(titleSubModal === 'modes' ? null : 'modes')
              }
              className={`flex min-h-[46px] cursor-pointer items-center justify-between border px-4 py-2 text-left transition-colors ${
                titleSubModal === 'modes'
                  ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                  : 'border-[#3B2B6E] bg-[#090E22]/90 text-slate-100 hover:border-[#00F5FF] hover:text-[#00F5FF]'
              }`}
            >
              <span className="flex items-center gap-3 text-sm font-bold tracking-wider">
                <Gamepad2 className="h-4 w-4 text-[#00F5FF]" />
                <span>模式选择</span>
              </span>
              <span className="font-mono-tabular text-[10px] text-slate-400">沙盒 · 杀怪 · 竞速</span>
            </button>

            <button
              type="button"
              onClick={() => openHubTab('vehicles')}
              className={`flex min-h-[46px] cursor-pointer items-center justify-between border px-4 py-2 text-left transition-colors ${
                titleSubModal === 'garage'
                  ? 'border-[#C000FF] bg-[#C000FF]/25 text-white'
                  : 'border-[#3B2B6E] bg-[#090E22]/90 text-slate-100 hover:border-[#C000FF] hover:text-[#FF2E88]'
              }`}
            >
              <span className="flex items-center gap-3 text-sm font-bold tracking-wider">
                <Car className="h-4 w-4 text-[#C000FF]" />
                <span>角色与车库</span>
              </span>
              <span className="font-mono-tabular text-[10px] text-slate-400">10款载具 · 技能</span>
            </button>

            <button
              type="button"
              onClick={() => openHubTab('settings')}
              className={`flex min-h-[46px] cursor-pointer items-center justify-between border px-4 py-2 text-left transition-colors ${
                titleSubModal === 'settings'
                  ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-white'
                  : 'border-[#3B2B6E] bg-[#090E22]/90 text-slate-100 hover:border-[#00F5FF] hover:text-[#00F5FF]'
              }`}
            >
              <span className="flex items-center gap-3 text-sm font-bold tracking-wider">
                <Settings className="h-4 w-4 text-[#38BDF8]" />
                <span>设置选项</span>
              </span>
              <span className="font-mono-tabular text-[10px] text-slate-400">画质 · 音频 · 按键</span>
            </button>

            <button
              type="button"
              onClick={handleFreshSandbox}
              onMouseLeave={() => setConfirmFreshStart(false)}
              className={`flex min-h-[44px] cursor-pointer items-center justify-between border px-4 py-2 text-left transition-colors ${
                confirmFreshStart
                  ? 'border-[#FF4545] bg-[#FF4545]/20 text-[#FF4545]'
                  : 'border-[#3B2B6E] bg-[#090E22]/90 text-slate-200 hover:border-[#FFD166] hover:text-[#FFD166]'
              }`}
            >
              <span className="flex items-center gap-3 text-sm font-bold tracking-wider">
                <RotateCcw className="h-4 w-4 text-[#FFD166]" />
                <span>
                  {saveStatus.hasSave
                    ? confirmFreshStart
                      ? '再次点击确认重置新档'
                      : '重置开始新档'
                    : '新建沙盒档案'}
                </span>
              </span>
              <span className="font-mono-tabular text-[10px] text-slate-400">
                {saveStatus.hasSave ? '覆盖存档' : '初始$500'}
              </span>
            </button>
          </nav>

          {/* Bottom-Left Signature */}
          <div className="pt-2">
            <div
              className="font-mono-tabular text-lg font-bold italic tracking-wider text-[#FF2E88]"
              style={{ textShadow: '0 0 12px rgba(255,46,136,0.65)' }}
            >
              Welcome to Neon District!
            </div>
            <p className="mt-1 font-mono-tabular text-[10px] text-slate-300/85">
              WASD 移动/驾驶 · 左键开火 · 1-7 切枪 · M 全图 · L 任务 · C 角色 · B 军械 · K 造物台
            </p>
          </div>
        </div>

        {/* Right Contextual Mode Picker Panel when "模式选择" is open */}
        {titleSubModal === 'modes' && (
          <div className="mt-4 w-full max-w-2xl border-2 border-[#00F5FF]/70 bg-[#090E20]/94 p-4 sm:p-5 lg:mt-0">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <div className="font-mono-tabular text-[10px] tracking-[0.2em] text-[#00F5FF]">
                  MODE SELECT // 模式选择
                </div>
                <h2 className="text-lg font-bold tracking-wider text-slate-100">
                  选择行动模式并直接出击
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTitleSubModal(null)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center border border-slate-700 bg-[#0D1428] text-slate-300 hover:border-[#FF2E88] hover:text-[#FF2E88]"
                aria-label="关闭模式选择"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {GAME_MODE_DEFS.map((m) => {
                const Icon = m.id === 'sandbox' ? Compass : m.id === 'horde' ? Flame : Timer;
                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between border bg-[#0E162E] p-3.5"
                    style={{ borderColor: `${m.accentHex}75` }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 shrink-0" style={{ color: m.accentHex }} />
                          <h3 className="text-sm font-bold text-slate-100">{m.name}</h3>
                        </div>
                        <span
                          className="border px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            borderColor: `${m.accentHex}60`,
                            color: m.accentHex,
                            backgroundColor: `${m.accentHex}18`,
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
                            </span>
                          ) : (
                            <span>7 大城区 · 7 项委托 · 10 芯片</span>
                          ))}
                        {m.id === 'horde' && (
                          <span>
                            最高波次：<strong className="text-[#FF2E88]">{localRecords.bestWave}</strong>
                            {' · '}
                            <strong className="text-[#FFD166]">
                              {localRecords.bestScore.toLocaleString()}
                            </strong>
                            分
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

                    <div className="mt-3 flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartMode(m.id)}
                        className="min-h-[40px] w-full cursor-pointer border-2 px-3 py-1.5 text-xs font-bold tracking-wider transition-colors hover:brightness-115"
                        style={{
                          borderColor: m.accentHex,
                          color: m.accentHex,
                          backgroundColor: `${m.accentHex}1A`,
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
                          onClick={() => {
                            setTitleSubModal(null);
                            gameEvents.emit(GAME_EVENT.START_NEW_GAME);
                          }}
                          className="min-h-[34px] w-full cursor-pointer border border-slate-700 bg-[#090F20] px-2 py-1 text-[10px] font-medium text-slate-300 hover:border-[#FF2E88] hover:text-[#FF2E88]"
                        >
                          新档重新开始
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
