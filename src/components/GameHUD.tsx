import { Crosshair, Flame, Map, Pause, Timer, Volume2, VolumeX, Zap } from 'lucide-react';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';
import { MiniMap } from './MiniMap';

export function GameHUD() {
  const playMode = useGameStore((s) => s.playMode);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const cash = useGameStore((s) => s.cash);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const spotted = useGameStore((s) => s.spotted);
  const escapeProgress = useGameStore((s) => s.escapeProgress);
  const activeMission = useGameStore((s) => s.activeMission);
  const districtName = useGameStore((s) => s.districtName);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const nearbyLandmark = useGameStore((s) => s.nearbyLandmark);
  const nearbyNpc = useGameStore((s) => s.nearbyNpc);
  const nearbyVehicle = useGameStore((s) => s.nearbyVehicle);
  const inVehicle = useGameStore((s) => s.inVehicle);
  const vehicleName = useGameStore((s) => s.vehicleName);
  const vehicleSpeedKmh = useGameStore((s) => s.vehicleSpeedKmh);
  const vehicleHealth = useGameStore((s) => s.vehicleHealth);
  const vehicleMaxHealth = useGameStore((s) => s.vehicleMaxHealth);
  const vehicleNitro = useGameStore((s) => s.vehicleNitro);
  const vehicleBoosting = useGameStore((s) => s.vehicleBoosting);
  const horde = useGameStore((s) => s.horde);
  const race = useGameStore((s) => s.race);
  const exploration = useGameStore((s) => s.exploration);
  const interactionToast = useGameStore((s) => s.interactionToast);
  const weapon = useGameStore((s) => s.weapon);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleMap = useGameStore((s) => s.toggleMap);

  const healthPct = Math.max(0, Math.min(100, Math.round((health / maxHealth) * 100)));
  const vehHealthPct =
    vehicleMaxHealth > 0
      ? Math.max(0, Math.min(100, Math.round((vehicleHealth / vehicleMaxHealth) * 100)))
      : 0;
  const bossHpPct =
    horde.bossMaxHp > 0
      ? Math.max(0, Math.min(100, Math.round((horde.bossHp / horde.bossMaxHp) * 100)))
      : 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left: Player & Mode Status Cluster */}
        <div className="flex flex-col gap-1.5">
          <div
            className={`border bg-[#080D18]/92 px-3 py-2 transition-colors sm:px-3.5 sm:py-2.5 ${
              wantedLevel > 0 ? 'border-[#FF4545]' : 'border-[#00F5FF]/35'
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Cash */}
              <div>
                <div className="text-[10px] font-medium tracking-wider text-slate-400">
                  现金
                </div>
                <div className="font-mono-tabular text-base font-bold leading-tight text-[#FFD166] sm:text-lg">
                  ${cash.toLocaleString()}
                </div>
              </div>

              <div className="h-6 w-px bg-slate-700/80 sm:h-7" />

              {/* Health */}
              <div className="min-w-[92px] sm:min-w-[116px]">
                <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-medium tracking-wider text-slate-300">生命</span>
                  <span className="font-mono-tabular font-bold text-[#00F5FF]">
                    {health}/{maxHealth}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#151C2B] sm:h-2">
                  <div
                    className={`h-full transition-all duration-150 ${
                      healthPct <= 30 ? 'bg-[#FF4545]' : 'bg-[#00F5FF]'
                    }`}
                    style={{ width: `${healthPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sandbox Wanted Stars & Chips */}
            {playMode === 'sandbox' && (
              <>
                <div className="mt-1.5 flex items-center justify-between border-t border-slate-800 pt-1.5 text-[10px] sm:mt-2 sm:text-[11px]">
                  <span
                    className={
                      wantedLevel > 0
                        ? 'font-bold tracking-wider text-[#FF4545]'
                        : 'tracking-wider text-slate-400'
                    }
                  >
                    {wantedLevel > 0 ? '警队通缉' : '通缉等级'}
                  </span>
                  <div className="flex items-center gap-1" aria-label={`通缉等级 ${wantedLevel} / 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        className={star <= wantedLevel && spotted ? 'animate-pulse' : ''}
                        fill={star <= wantedLevel ? '#FF4545' : 'none'}
                        stroke={star <= wantedLevel ? '#FF4545' : '#475569'}
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>

                {wantedLevel > 0 && (
                  <div className="mt-1.5 border-t border-slate-800/80 pt-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={spotted ? 'font-bold text-[#FF4545]' : 'font-bold text-[#00F5FF]'}>
                        {spotted ? '被锁定 · 追捕中' : '脱离视线 · 搜寻中'}
                      </span>
                      {!spotted && (
                        <span className="font-mono-tabular font-bold text-[#00F5FF]">
                          {escapeProgress}%
                        </span>
                      )}
                    </div>
                    {!spotted && (
                      <div className="mt-1 h-1 w-full bg-[#151C2B]">
                        <div
                          className="h-full bg-[#00F5FF] transition-all duration-150"
                          style={{ width: `${escapeProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-1.5 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px]">
                  <span className="tracking-wider text-slate-400">霓虹数据芯片</span>
                  <span className="font-mono-tabular font-bold text-[#C000FF]">
                    {exploration.chipsCollected}/{exploration.totalChips}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Horde Mode Telemetry */}
          {playMode === 'horde' && (
            <div className="max-w-[260px] border border-[#FF2E88]/70 bg-[#080D18]/92 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-[#FF2E88]" />
                  <span className="text-xs font-bold tracking-wider text-[#FF2E88]">
                    第 {horde.wave} 波
                  </span>
                </div>
                <span className="font-mono-tabular text-[11px] font-bold text-[#FFD166]">
                  积分 {horde.score.toLocaleString()}
                </span>
              </div>

              <div className="mt-1.5 grid grid-cols-3 gap-1.5 font-mono-tabular text-[10px] text-slate-300">
                <div className="bg-[#111827] px-1.5 py-1">
                  <div className="text-[9px] text-slate-400">剩余</div>
                  <div className="font-bold text-slate-100">{horde.enemiesRemaining}</div>
                </div>
                <div className="bg-[#111827] px-1.5 py-1">
                  <div className="text-[9px] text-slate-400">击杀</div>
                  <div className="font-bold text-[#00F5FF]">{horde.kills}</div>
                </div>
                <div className="bg-[#111827] px-1.5 py-1">
                  <div className="text-[9px] text-slate-400">连击</div>
                  <div className="font-bold text-[#FFD166]">×{horde.combo}</div>
                </div>
              </div>

              {horde.overdriveSec > 0 && (
                <div className="mt-1.5 border border-[#FFD166]/70 bg-[#FFD166]/15 px-2 py-0.5 text-center font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                  武器过载中 · 射速伤害飙升 ({horde.overdriveSec}s)
                </div>
              )}

              {horde.restSec > 0 && (
                <div className="mt-1.5 border border-[#00F5FF]/50 bg-[#00F5FF]/10 px-2 py-0.5 text-center font-mono-tabular text-[10px] text-[#00F5FF]">
                  波次休整 · {horde.restSec}s 后开启下一波
                </div>
              )}

              <button
                type="button"
                onClick={() => gameEvents.emit(GAME_EVENT.OPEN_QUICK_ARMORY)}
                className="pointer-events-auto mt-2 flex min-h-[36px] w-full cursor-pointer items-center justify-center gap-1.5 border border-[#00F5FF]/70 bg-[#00F5FF]/12 px-2.5 py-1 text-[11px] font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18]"
              >
                <Crosshair className="h-3.5 w-3.5" />
                [B] 随身军械 / 医疗补给
              </button>
            </div>
          )}

          {/* Race Mode Telemetry */}
          {playMode === 'race' && (
            <div className="max-w-[260px] border border-[#FFD166]/75 bg-[#080D18]/92 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-[#FFD166]" />
                  <span className="text-xs font-bold tracking-wider text-[#FFD166]">
                    环城竞速 {race.checkpointIndex + 1}/{race.totalCheckpoints}
                  </span>
                </div>
                <span
                  className={`font-mono-tabular text-xs font-bold ${
                    race.timeRemainingSec <= 8 ? 'text-[#FF4545]' : 'text-[#00F5FF]'
                  }`}
                >
                  剩余 {race.timeRemainingSec}s
                </span>
              </div>
              {race.targetLabel && (
                <div className="mt-1 text-[11px] text-slate-200">
                  下一站：<span className="font-bold text-[#FFD166]">{race.targetLabel}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between font-mono-tabular text-[10px] text-slate-400">
                <span>用时：{race.elapsedSec}s</span>
                <span>
                  最佳：{race.bestTimeSec !== null ? `${race.bestTimeSec}s` : '--'}
                </span>
              </div>
            </div>
          )}

          {/* Active Weapon Telemetry (on foot) */}
          {!inVehicle && (
            <button
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.SWITCH_WEAPON, 'next')}
              title="切换武器 (Q / 1-3)"
              className="pointer-events-auto flex items-center justify-between gap-3 border bg-[#080D18]/92 px-3 py-1.5 text-left transition-colors hover:brightness-110"
              style={{
                borderColor: horde.overdriveSec > 0 ? '#FFD166' : `${weapon.colorHex}80`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-1"
                  style={{ backgroundColor: weapon.colorHex }}
                />
                <div>
                  <div className="text-[11px] font-bold tracking-wider" style={{ color: weapon.colorHex }}>
                    {weapon.shortName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {weapon.ownedIds.length > 1 ? '点击或按 Q 切枪' : '按 B 或去科技坊购重枪'}
                  </div>
                </div>
              </div>
              <div className="text-right font-mono-tabular">
                <div className="text-sm font-bold leading-none text-slate-100">
                  {weapon.infiniteAmmo ? '∞' : weapon.ammo}
                </div>
                <div className="text-[9px] text-slate-400">
                  {weapon.infiniteAmmo ? '微核供能' : '备弹'}
                </div>
              </div>
            </button>
          )}

          {/* Active Vehicle Speedometer, Integrity & Nitro */}
          {inVehicle && (
            <div className="border border-[#FF2E88]/45 bg-[#080D18]/92 px-3 py-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-[#FF2E88]">
                    {vehicleName}
                  </div>
                  <div className="mt-1 h-1.5 w-24 bg-[#151C2B]">
                    <div
                      className="h-full bg-[#FFD166] transition-all duration-150"
                      style={{ width: `${vehHealthPct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-tabular text-lg font-bold leading-none text-[#00F5FF]">
                    {vehicleSpeedKmh}
                  </span>
                  <span className="ml-1 text-[10px] text-slate-400">
                    公里/时
                  </span>
                </div>
              </div>

              <div className="mt-1.5 border-t border-slate-800/80 pt-1.5">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-medium text-slate-300">
                    <Zap className={`h-3 w-3 ${vehicleBoosting ? 'text-[#FFD166]' : 'text-[#00F5FF]'}`} />
                    氮气推进 (Shift)
                  </span>
                  <span
                    className={`font-mono-tabular font-bold ${
                      vehicleBoosting ? 'text-[#FFD166]' : 'text-[#00F5FF]'
                    }`}
                  >
                    {vehicleNitro}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#151C2B]">
                  <div
                    className={`h-full transition-all duration-100 ${
                      vehicleBoosting ? 'bg-[#FFD166]' : 'bg-[#00F5FF]'
                    }`}
                    style={{ width: `${vehicleNitro}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Mission Objective */}
          {playMode === 'sandbox' && activeMission && (
            <div className="max-w-[240px] border border-[#FFD166]/65 bg-[#080D18]/92 px-3 py-2 sm:max-w-[270px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider text-[#FFD166]">
                  {activeMission.title}
                </span>
                <span className="font-mono-tabular text-[10px] text-slate-300">
                  步骤 {activeMission.stepIndex + 1}/{activeMission.totalSteps}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-200">
                {activeMission.instruction}
              </p>
              <div className="mt-1.5 flex items-center justify-between border-t border-slate-800/90 pt-1 text-[10px]">
                <span className="font-mono-tabular text-[#00F5FF]">
                  报酬 ${activeMission.reward}
                </span>
                {activeMission.timeRemainingSec !== null && (
                  <span
                    className={`font-mono-tabular font-bold ${
                      activeMission.timeRemainingSec <= 12 ? 'text-[#FF4545]' : 'text-[#FFD166]'
                    }`}
                  >
                    剩余 {activeMission.timeRemainingSec}s
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top-Center: Horde Boss Bar or Race Countdown */}
        <div className="hidden flex-1 justify-center pt-1 sm:flex">
          {playMode === 'horde' && horde.active && horde.bossName && (
            <div className="w-full max-w-sm border-2 border-[#FFD166] bg-[#080D18]/94 px-4 py-2 text-center">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#FFD166]">BOSS · {horde.bossName}</span>
                <span className="font-mono-tabular text-[#FF4545]">
                  {horde.bossHp} / {horde.bossMaxHp}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full bg-[#151C2B]">
                <div
                  className="h-full bg-[#FF2E88] transition-all duration-100"
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>
          )}

          {playMode === 'race' && race.active && race.countdownSec > 0 && (
            <div className="border-2 border-[#FFD166] bg-[#080D18]/95 px-8 py-3 text-center">
              <div className="text-[11px] font-bold tracking-widest text-[#00F5FF]">
                准备发车
              </div>
              <div className="font-mono-tabular text-4xl font-bold text-[#FFD166]">
                {race.countdownSec}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: District Mini-Map & Utility Actions */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden text-right md:block">
              <div className="text-xs font-bold tracking-wider text-[#00F5FF]">
                {districtName}
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400">
                X {playerX} · Y {playerY}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMap}
              title="打开地图 (M)"
              aria-label="打开区域地图"
              className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center border border-slate-700 bg-[#080D18]/90 text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] focus-visible:outline-2 focus-visible:outline-[#00F5FF]"
            >
              <Map className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              title={muted ? '开启音效' : '静音'}
              aria-label={muted ? '开启音效' : '静音'}
              className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center border border-slate-700 bg-[#080D18]/90 text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] focus-visible:outline-2 focus-visible:outline-[#00F5FF]"
            >
              {muted ? <VolumeX className="h-4 w-4 text-[#FF4545]" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.PAUSE_GAME)}
              title="暂停游戏 (Esc)"
              aria-label="暂停游戏"
              className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center border border-slate-700 bg-[#080D18]/90 text-slate-200 transition-colors hover:border-[#FF2E88] hover:text-[#FF2E88] focus-visible:outline-2 focus-visible:outline-[#FF2E88]"
            >
              <Pause className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden sm:block">
            <MiniMap width={156} height={114} onClick={toggleMap} />
          </div>
          <div className="block sm:hidden">
            <MiniMap width={104} height={76} onClick={toggleMap} />
          </div>
        </div>
      </div>

      {/* Center-Bottom: Context Interaction Hints & Toast */}
      <div className="flex flex-col items-center gap-2 pb-16 sm:pb-2">
        {playMode === 'race' && race.active && race.countdownSec > 0 && (
          <div className="border-2 border-[#FFD166] bg-[#080D18]/95 px-6 py-2 text-center sm:hidden">
            <span className="font-mono-tabular text-2xl font-bold text-[#FFD166]">
              发车倒计时 {race.countdownSec}
            </span>
          </div>
        )}

        {interactionToast && (
          <div className="max-w-sm border border-[#00F5FF] bg-[#080D18]/95 px-3.5 py-2 text-center text-xs font-medium leading-relaxed text-slate-100 sm:max-w-md">
            {interactionToast}
          </div>
        )}

        {!inVehicle && nearbyVehicle && (
          <div className="border border-[#00F5FF]/85 bg-[#080D18]/92 px-3.5 py-1.5 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#00F5FF]">按 F</span>
            <span className="mx-2 text-slate-500">·</span>
            <span>驾驶 {nearbyVehicle.name}</span>
          </div>
        )}

        {!inVehicle && nearbyNpc && (
          <div className="border border-[#FF2E88]/85 bg-[#080D18]/92 px-3.5 py-1.5 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#FF2E88]">按 E</span>
            <span className="mx-2 text-slate-500">·</span>
            <span>与 {nearbyNpc.name}（{nearbyNpc.role}）对话</span>
          </div>
        )}

        {!inVehicle && !nearbyNpc && nearbyLandmark && (
          <div className="border border-[#FFD166]/80 bg-[#080D18]/92 px-3.5 py-1.5 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#FFD166]">按 E</span>
            <span className="mx-2 text-slate-500">·</span>
            <span>进入 {nearbyLandmark.name}</span>
          </div>
        )}

        {inVehicle && nearbyLandmark && (
          <div className="border border-[#00F5FF]/85 bg-[#080D18]/92 px-3.5 py-1.5 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#00F5FF]">按 E</span>
            <span className="mx-2 text-slate-500">·</span>
            <span>进入 {nearbyLandmark.name}（维修与改装）</span>
          </div>
        )}

        {inVehicle ? (
          <div className="hidden border border-slate-700/80 bg-[#080D18]/88 px-3 py-1 font-mono-tabular text-[11px] text-slate-300 md:block">
            W/S 油门刹车 · A/D 转向 · Shift 氮气加速 · 空格 手刹 · F 下车
          </div>
        ) : (
          <div className="hidden border border-slate-700/80 bg-[#080D18]/88 px-3 py-1 font-mono-tabular text-[11px] text-slate-300 md:block">
            WASD 移动 · 左键/J 开火 · Q/1-3 切枪 · B 军械补给 · E 交互 · F 上车
          </div>
        )}
      </div>
    </div>
  );
}
