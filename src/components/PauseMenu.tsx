import { useState } from 'react';
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
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const setShowMap = useGameStore((s) => s.setShowMap);
  const touchControlsMode = useGameStore((s) => s.touchControlsMode);
  const cycleTouchControlsMode = useGameStore((s) => s.cycleTouchControlsMode);
  const saveStatus = useGameStore((s) => s.saveStatus);
  const [confirmClear, setConfirmClear] = useState(false);

  const touchLabel =
    touchControlsMode === 'auto' ? '自动识别' : touchControlsMode === 'on' ? '始终显示' : '关闭';
  const modeLabel =
    playMode === 'horde' ? '无尽杀怪模式' : playMode === 'race' ? '极速狂飙模式' : '自由沙盒模式';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#080D18]/82 p-3 sm:p-4">
      <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto border border-[#00F5FF]/60 bg-[#0D1424] p-5 sm:p-6">
        <div className="mb-5 border-b border-slate-800 pb-3">
          <p className="font-mono-tabular text-[11px] tracking-[0.2em] text-[#FF2E88]">
            {districtName} · {modeLabel}
          </p>
          <h2 className="mt-0.5 text-2xl font-bold tracking-wider text-slate-100">
            游戏已暂停
          </h2>
          {playMode === 'sandbox' && (
            <p className="mt-1 font-mono-tabular text-[11px] text-slate-400">
              上次存档：{formatTime(saveStatus.savedAt)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.RESUME_GAME)}
            className="min-h-[44px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/12 px-4 py-2.5 text-sm font-bold tracking-wider text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18]"
          >
            继续游戏
          </button>

          {playMode === 'horde' && (
            <button
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.START_PLAY_MODE, 'horde')}
              className="min-h-[44px] cursor-pointer border border-[#FF2E88] bg-[#FF2E88]/12 px-4 py-2.5 text-sm font-bold text-[#FF2E88] transition-colors hover:bg-[#FF2E88] hover:text-[#080D18]"
            >
              重开无尽杀怪
            </button>
          )}

          {playMode === 'race' && (
            <button
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.START_PLAY_MODE, 'race')}
              className="min-h-[44px] cursor-pointer border border-[#FFD166] bg-[#FFD166]/12 px-4 py-2.5 text-sm font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18]"
            >
              重开极速狂飙
            </button>
          )}

          {playMode !== 'sandbox' && (
            <button
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.START_PLAY_MODE, 'sandbox')}
              className="min-h-[44px] cursor-pointer border border-slate-700 bg-[#151C2B] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
            >
              切换至自由沙盒模式
            </button>
          )}

          {playMode === 'sandbox' && (
            <button
              type="button"
              onClick={() => {
                gameEvents.emit(GAME_EVENT.SAVE_GAME);
                setConfirmClear(false);
              }}
              className="min-h-[44px] cursor-pointer border border-[#FFD166]/70 bg-[#FFD166]/10 px-4 py-2.5 text-sm font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18]"
            >
              手动保存进度
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              gameEvents.emit(GAME_EVENT.RESUME_GAME);
              setShowMap(true);
            }}
            className="min-h-[44px] cursor-pointer border border-slate-700 bg-[#151C2B] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            查看全特区地图
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="min-h-[44px] cursor-pointer border border-slate-700 bg-[#151C2B] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            音效：{muted ? '已静音' : '已开启'}
          </button>

          <button
            type="button"
            onClick={cycleTouchControlsMode}
            className="min-h-[44px] cursor-pointer border border-slate-700 bg-[#151C2B] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            触控按键：{touchLabel}
          </button>

          {playMode === 'sandbox' && (
            <button
              type="button"
              onClick={() => {
                gameEvents.emit(GAME_EVENT.RESET_POSITION);
                gameEvents.emit(GAME_EVENT.RESUME_GAME);
              }}
              className="min-h-[44px] cursor-pointer border border-slate-700 bg-[#151C2B] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-[#FFD166] hover:text-[#FFD166]"
            >
              重置至广场出生点
            </button>
          )}

          {playMode === 'sandbox' && saveStatus.hasSave && (
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
              className="min-h-[44px] cursor-pointer border border-slate-700 bg-[#151C2B] px-4 py-2.5 text-xs font-medium text-slate-300 transition-colors hover:border-[#FF4545] hover:text-[#FF4545]"
            >
              {confirmClear ? '再次点击确认清除本地存档' : '清除本地存档'}
            </button>
          )}

          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.RETURN_TITLE)}
            className="mt-1 min-h-[44px] cursor-pointer border border-[#FF4545]/50 bg-[#151C2B] px-4 py-2.5 text-sm font-medium text-[#FF4545] transition-colors hover:bg-[#FF4545] hover:text-[#080D18]"
          >
            {playMode === 'sandbox' ? '保存并返回主界面' : '返回主界面'}
          </button>
        </div>
      </div>
    </div>
  );
}
