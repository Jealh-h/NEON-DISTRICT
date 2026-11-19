import { useState } from 'react';
import {
  Crosshair,
  Hammer,
  Home,
  Map,
  Play,
  RotateCcw,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

function formatTime(ts: number | null): string {
  if (!ts) return '尚未保存';
  try {
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '已保存';
  }
}

export function PauseMenu() {
  const playMode = useGameStore((s) => s.playMode);
  const districtName = useGameStore((s) => s.districtName);
  const openHubTab = useGameStore((s) => s.openHubTab);
  const saveStatus = useGameStore((s) => s.saveStatus);
  const [confirmClear, setConfirmClear] = useState(false);

  const modeLabel =
    playMode === 'horde' ? '无尽杀怪模式' : playMode === 'race' ? '极速狂飙模式' : '自由沙盒模式';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#060914]/84 p-3 sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-sm overflow-y-auto border-2 border-[#C000FF]/80 bg-[#090F22] p-5 sm:p-6"
        style={{ boxShadow: '0 0 28px rgba(192, 0, 255, 0.25), inset 0 0 18px rgba(0, 245, 255, 0.08)' }}
      >
        <div className="mb-5 border-b border-slate-800 pb-3 text-center">
          <p className="font-mono-tabular text-[11px] tracking-[0.2em] text-[#00F5FF]">
            {districtName} · {modeLabel}
          </p>
          <h2
            className="mt-1 text-3xl font-extrabold tracking-[0.18em] text-[#F472B6]"
            style={{ textShadow: '0 0 14px rgba(192, 0, 255, 0.7)' }}
          >
            游戏暂停
          </h2>
          {playMode === 'sandbox' && (
            <p className="mt-1 font-mono-tabular text-[10px] text-slate-400">
              上次存档：{formatTime(saveStatus.savedAt)}
            </p>
          )}
        </div>

        {/* Primary 6-Button Pause Menu matching Mockup Bottom-Right */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.RESUME_GAME)}
            className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2.5 border-2 border-[#00F5FF] bg-gradient-to-r from-[#0284C7]/65 to-[#00F5FF]/45 px-4 py-2 text-sm font-bold tracking-[0.16em] text-white transition-all hover:brightness-115"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>继续游戏</span>
          </button>

          <button
            type="button"
            onClick={() => openHubTab('map')}
            className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2.5 border border-[#2D3866] bg-[#101833] px-4 py-2 text-sm font-bold tracking-wider text-slate-100 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            <Map className="h-4 w-4 text-[#00F5FF]" />
            <span>战术全图 [M]</span>
          </button>

          <button
            type="button"
            onClick={() => openHubTab('armory')}
            className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2.5 border border-[#2D3866] bg-[#101833] px-4 py-2 text-sm font-bold tracking-wider text-slate-100 transition-colors hover:border-[#FFD166] hover:text-[#FFD166]"
          >
            <Crosshair className="h-4 w-4 text-[#FFD166]" />
            <span>随身军械 [B]</span>
          </button>

          <button
            type="button"
            onClick={() => openHubTab(playMode === 'sandbox' ? 'craft' : 'vehicles')}
            className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2.5 border border-[#2D3866] bg-[#101833] px-4 py-2 text-sm font-bold tracking-wider text-slate-100 transition-colors hover:border-[#4ADE80] hover:text-[#4ADE80]"
          >
            <Hammer className="h-4 w-4 text-[#4ADE80]" />
            <span>{playMode === 'sandbox' ? '造物台 / 支援 [K]' : '载具与支援'}</span>
          </button>

          <button
            type="button"
            onClick={() => openHubTab('settings')}
            className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2.5 border border-[#2D3866] bg-[#101833] px-4 py-2 text-sm font-bold tracking-wider text-slate-100 transition-colors hover:border-[#C000FF] hover:text-[#E879F9]"
          >
            <Settings className="h-4 w-4 text-[#C000FF]" />
            <span>设置选项</span>
          </button>

          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.RETURN_TITLE)}
            className="flex min-h-[42px] cursor-pointer items-center justify-center gap-2.5 border border-[#FF4545]/55 bg-[#191229] px-4 py-2 text-sm font-bold tracking-wider text-[#FF4545] transition-colors hover:bg-[#FF4545] hover:text-[#080D18]"
          >
            <Home className="h-4 w-4" />
            <span>{playMode === 'sandbox' ? '保存并返回主菜单' : '返回主菜单'}</span>
          </button>
        </div>

        {/* Compact Mode-Specific Quick Actions Footer */}
        <div className="mt-4 border-t border-slate-800 pt-3">
          {playMode === 'sandbox' ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  gameEvents.emit(GAME_EVENT.SAVE_GAME);
                  setConfirmClear(false);
                }}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 border border-[#FFD166]/60 bg-[#0D152B] px-2 py-1.5 text-[11px] font-bold text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]"
              >
                <Save className="h-3 w-3" />
                <span>手动保存</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  gameEvents.emit(GAME_EVENT.RESET_POSITION);
                  gameEvents.emit(GAME_EVENT.RESUME_GAME);
                }}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 border border-slate-700 bg-[#0D152B] px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:border-[#00F5FF] hover:text-[#00F5FF]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>回出生点</span>
              </button>
              {saveStatus.hasSave && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmClear) {
                      setConfirmClear(true);
                    } else {
                      gameEvents.emit(GAME_EVENT.DELETE_SAVE);
                      setConfirmClear(false);
                    }
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-1 border border-slate-800 bg-[#0B1020] px-2 py-1 text-[10px] text-slate-400 hover:border-[#FF4545] hover:text-[#FF4545]"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{confirmClear ? '再次点击确认清除本地存档' : '清除本地存档'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => gameEvents.emit(GAME_EVENT.START_PLAY_MODE, playMode)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 border border-[#FF2E88]/70 bg-[#FF2E88]/15 px-2 py-1.5 text-[11px] font-bold text-[#FF2E88] hover:bg-[#FF2E88] hover:text-[#080D18]"
              >
                <RotateCcw className="h-3 w-3" />
                <span>重开当前模式</span>
              </button>
              <button
                type="button"
                onClick={() => gameEvents.emit(GAME_EVENT.START_PLAY_MODE, 'sandbox')}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 border border-slate-700 bg-[#0D152B] px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:border-[#00F5FF] hover:text-[#00F5FF]"
              >
                <span>切换自由沙盒</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
