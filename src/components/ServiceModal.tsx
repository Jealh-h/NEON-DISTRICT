import {
  CheckCircle2,
  Crosshair,
  HeartPulse,
  Shield,
  Sparkles,
  Timer,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect } from 'react';
import {
  ECONOMY_CONFIG,
  MISSION_DEFINITIONS,
  VEHICLE_UPGRADE_CONFIG,
  VehicleUpgradeTrack,
  WEAPON_ORDER,
  WEAPON_SPECS,
} from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

const UPGRADE_TRACKS: VehicleUpgradeTrack[] = ['engine', 'handling', 'armor'];

export function ServiceModal() {
  const serviceModal = useGameStore((s) => s.serviceModal);
  const setServiceModal = useGameStore((s) => s.setServiceModal);
  const cash = useGameStore((s) => s.cash);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const weapon = useGameStore((s) => s.weapon);
  const activeMission = useGameStore((s) => s.activeMission);
  const completedMissionIds = useGameStore((s) => s.completedMissionIds);
  const totalMissionEarnings = useGameStore((s) => s.totalMissionEarnings);

  useEffect(() => {
    if (!serviceModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setServiceModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [serviceModal, setServiceModal]);

  if (!serviceModal) return null;

  const close = () => setServiceModal(null);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#080D18]/86 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto border border-[#00F5FF]/60 bg-[#0D1424] p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold tracking-wider text-slate-100">
                {serviceModal.title}
              </h2>
              <span className="border border-[#FFD166]/60 bg-[#FFD166]/10 px-2 py-0.5 font-mono-tabular text-xs font-bold text-[#FFD166]">
                持有现金 ${cash.toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {serviceModal.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="关闭终端"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border border-slate-700 bg-[#151C2B] text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Missions Terminal */}
        {serviceModal.kind === 'missions' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#111827] px-3.5 py-2.5 text-xs">
              <div className="text-slate-300">
                已完成委托：<span className="font-mono-tabular font-bold text-[#00F5FF]">{completedMissionIds.length}/{MISSION_DEFINITIONS.length}</span>
                <span className="mx-2 text-slate-600">|</span>
                累计佣金：<span className="font-mono-tabular font-bold text-[#FFD166]">${totalMissionEarnings.toLocaleString()}</span>
              </div>
              {activeMission && (
                <button
                  type="button"
                  onClick={() => gameEvents.emit(GAME_EVENT.ABANDON_MISSION)}
                  className="min-h-[36px] cursor-pointer border border-[#FF4545]/60 bg-[#FF4545]/10 px-3 py-1 text-xs font-bold text-[#FF4545] hover:bg-[#FF4545] hover:text-[#080D18]"
                >
                  放弃当前任务
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {MISSION_DEFINITIONS.map((m) => {
                const isActive = activeMission?.id === m.id;
                const isCompleted = completedMissionIds.includes(m.id);

                return (
                  <div
                    key={m.id}
                    className={`border p-3.5 transition-colors ${
                      isActive
                        ? 'border-[#FFD166] bg-[#161F33]'
                        : 'border-slate-700/90 bg-[#111827]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-100">{m.title}</span>
                          <span className="border border-slate-700 bg-[#080D18] px-2 py-0.5 text-[10px] text-[#00F5FF]">
                            {m.category}
                          </span>
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              已完成
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{m.summary}</p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono-tabular text-base font-bold text-[#FFD166]">
                          +${m.reward}
                        </div>
                        <div className="mt-0.5 flex items-center justify-end gap-1 font-mono-tabular text-[11px] text-slate-400">
                          <Timer className="h-3 w-3" />
                          {m.timeLimitSec ? `${m.timeLimitSec}秒` : '无时限'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => {
                          gameEvents.emit(GAME_EVENT.ACCEPT_MISSION, m.id);
                          close();
                        }}
                        className={`min-h-[44px] min-w-[120px] px-4 py-2 text-xs font-bold tracking-wider transition-colors ${
                          isActive
                            ? 'cursor-default border border-[#FFD166]/60 bg-[#FFD166]/15 text-[#FFD166]'
                            : 'cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                        }`}
                      >
                        {isActive ? '进行中' : isCompleted ? '重新挑战' : '接取委托'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plaza Garage */}
        {serviceModal.kind === 'garage' && (
          <div className="flex flex-col gap-3.5">
            {serviceModal.targetVehicle ? (
              <>
                <div className="border border-slate-700 bg-[#111827] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-slate-400">当前整备载具</div>
                      <div
                        className="text-base font-bold"
                        style={{ color: serviceModal.targetVehicle.accentColor }}
                      >
                        {serviceModal.targetVehicle.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">车身耐久</div>
                      <div className="font-mono-tabular text-sm font-bold text-[#00F5FF]">
                        {serviceModal.targetVehicle.health} / {serviceModal.targetVehicle.maxHealth}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full bg-[#080D18]">
                    <div
                      className="h-full bg-[#FFD166] transition-all duration-150"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (serviceModal.targetVehicle.health /
                              serviceModal.targetVehicle.maxHealth) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={
                        serviceModal.targetVehicle.health >= serviceModal.targetVehicle.maxHealth ||
                        cash < ECONOMY_CONFIG.VEHICLE_REPAIR_COST
                      }
                      onClick={() =>
                        gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                          serviceType: 'repair',
                          vehicleId: serviceModal.targetVehicle!.id,
                        })
                      }
                      className="flex min-h-[44px] cursor-pointer items-center justify-between border border-[#00F5FF]/70 bg-[#00F5FF]/10 px-3.5 py-2 text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                    >
                      <span className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5" />
                        车身全面修复
                      </span>
                      <span className="font-mono-tabular">
                        ${ECONOMY_CONFIG.VEHICLE_REPAIR_COST}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={wantedLevel === 0 || cash < ECONOMY_CONFIG.STEALTH_RESPRAY_COST}
                      onClick={() =>
                        gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                          serviceType: 'respray',
                        })
                      }
                      className="flex min-h-[44px] cursor-pointer items-center justify-between border border-[#FF2E88]/75 bg-[#FF2E88]/10 px-3.5 py-2 text-xs font-bold text-[#FF2E88] transition-colors hover:bg-[#FF2E88] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {wantedLevel > 0 ? '隐匿喷漆消星' : '隐匿喷漆（未被通缉）'}
                      </span>
                      <span className="font-mono-tabular">
                        ${ECONOMY_CONFIG.STEALTH_RESPRAY_COST}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Upgrade Tracks */}
                <div className="grid grid-cols-1 gap-2.5">
                  {UPGRADE_TRACKS.map((track) => {
                    const cfg = VEHICLE_UPGRADE_CONFIG[track];
                    const lvl = serviceModal.targetVehicle!.upgrades[track];
                    const isMax = lvl >= cfg.maxLevel;
                    const cost = isMax ? 0 : cfg.costs[lvl];
                    const Icon =
                      track === 'engine' ? Zap : track === 'handling' ? Wrench : Shield;

                    return (
                      <div
                        key={track}
                        className="flex flex-wrap items-center justify-between gap-3 border border-slate-700/90 bg-[#111827] p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[#00F5FF]" />
                            <span className="text-sm font-bold text-slate-100">{cfg.label}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={`h-2 w-4 ${
                                    step <= lvl ? 'bg-[#00F5FF]' : 'bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{cfg.description}</p>
                        </div>

                        <button
                          type="button"
                          disabled={isMax || cash < cost}
                          onClick={() =>
                            gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                              serviceType: 'upgrade',
                              vehicleId: serviceModal.targetVehicle!.id,
                              track,
                            })
                          }
                          className="min-h-[44px] min-w-[116px] cursor-pointer border border-[#FFD166] bg-[#FFD166]/12 px-3.5 py-2 font-mono-tabular text-xs font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                        >
                          {isMax ? '已满级' : `升级 $${cost}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="border border-slate-700 bg-[#111827] p-4 text-xs text-slate-300">
                附近没有可整备的载具，请先驾驶或把车辆停靠在车库附近。
              </div>
            )}
          </div>
        )}

        {/* Plaza Tech Armory */}
        {serviceModal.kind === 'armory' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#111827] px-3.5 py-2.5 text-xs">
              <div className="text-slate-300">
                当前装备：
                <span className="font-bold" style={{ color: weapon.colorHex }}>
                  {weapon.name}
                </span>
              </div>
              <div className="font-mono-tabular text-slate-400">
                左键 / J / 右侧摇杆 开火 · Q / 1-3 切换
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {WEAPON_ORDER.map((wId) => {
                const spec = WEAPON_SPECS[wId];
                const owned = weapon.ownedIds.includes(wId);
                const equipped = weapon.equippedId === wId;
                const currentAmmo = weapon.ammoByWeapon[wId] ?? 0;
                const isAmmoFull = spec.infiniteAmmo || currentAmmo >= spec.maxAmmo;
                const damageLabel =
                  spec.pellets > 1 ? `${spec.damage} × ${spec.pellets} 发` : `${spec.damage} 伤害`;

                return (
                  <div
                    key={wId}
                    className={`border p-3.5 ${
                      equipped ? 'border-[#00F5FF] bg-[#161F33]' : 'border-slate-700/90 bg-[#111827]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Crosshair className="h-4 w-4" style={{ color: spec.colorHex }} />
                          <span className="text-sm font-bold text-slate-100">{spec.name}</span>
                          {equipped && (
                            <span className="border border-[#00F5FF]/70 bg-[#00F5FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#00F5FF]">
                              已装备
                            </span>
                          )}
                          {!equipped && owned && (
                            <span className="border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                              已拥有
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {spec.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-tabular text-[11px] text-slate-400">
                          <span>火力：{damageLabel}</span>
                          <span>射程：{spec.range}px</span>
                          <span>
                            备弹：
                            {spec.infiniteAmmo ? '无限微核' : `${currentAmmo} / ${spec.maxAmmo}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!owned ? (
                          <button
                            type="button"
                            disabled={cash < spec.buyCost}
                            onClick={() =>
                              gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                serviceType: 'buy_weapon',
                                weaponId: wId,
                              })
                            }
                            className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-3.5 py-2 font-mono-tabular text-xs font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                          >
                            购买 ${spec.buyCost}
                          </button>
                        ) : spec.infiniteAmmo ? (
                          <span className="border border-slate-700 bg-[#080D18] px-3 py-2 text-xs text-slate-400">
                            制式配枪
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isAmmoFull || cash < spec.ammoPackCost}
                            onClick={() =>
                              gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                serviceType: 'buy_ammo',
                                weaponId: wId,
                              })
                            }
                            className="min-h-[44px] min-w-[132px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-3.5 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                          >
                            {isAmmoFull
                              ? '弹药已满'
                              : `+${spec.ammoPackSize}发 $${spec.ammoPackCost}`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#00F5FF]/40 bg-[#111827] p-3.5">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <HeartPulse className="h-4 w-4 text-[#00F5FF]" />
                  <span>战地紧急纳米急救</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  当前生命 {health}/{maxHealth}，立即注射纳米修复液将生命恢复至上限。
                </p>
              </div>
              <button
                type="button"
                disabled={health >= maxHealth || cash < ECONOMY_CONFIG.CLINIC_HEAL_COST}
                onClick={() =>
                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'heal' })
                }
                className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
              >
                {health >= maxHealth ? '生命已满' : `急救 $${ECONOMY_CONFIG.CLINIC_HEAL_COST}`}
              </button>
            </div>
          </div>
        )}

        {/* Clinic / Store / Diner Recovery Services */}
        {(serviceModal.kind === 'clinic' ||
          serviceModal.kind === 'store' ||
          serviceModal.kind === 'diner') && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border border-slate-800 bg-[#111827] px-3.5 py-2.5 text-xs">
              <span className="text-slate-300">当前生命状态</span>
              <span className="font-mono-tabular font-bold text-[#00F5FF]">
                {health} / {maxHealth} HP
              </span>
            </div>

            {serviceModal.kind === 'clinic' && (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-700 bg-[#111827] p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                    <HeartPulse className="h-4 w-4 text-[#00F5FF]" />
                    <span>全效纳米急救修复</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    立即修复所有外伤与神经损伤，将生命值恢复至上限 {maxHealth}。
                  </p>
                </div>
                <button
                  type="button"
                  disabled={health >= maxHealth || cash < ECONOMY_CONFIG.CLINIC_HEAL_COST}
                  onClick={() =>
                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'heal' })
                  }
                  className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                >
                  {health >= maxHealth
                    ? '生命已满'
                    : `治疗 $${ECONOMY_CONFIG.CLINIC_HEAL_COST}`}
                </button>
              </div>
            )}

            {serviceModal.kind === 'store' && (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-700 bg-[#111827] p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                    <Zap className="h-4 w-4 text-[#00F5FF]" />
                    <span>霓虹高能电解饮</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    即时恢复 +{ECONOMY_CONFIG.SNACK_HEAL} 点生命值，街头奔波必备补给。
                  </p>
                </div>
                <button
                  type="button"
                  disabled={health >= maxHealth || cash < ECONOMY_CONFIG.SNACK_COST}
                  onClick={() =>
                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'snack' })
                  }
                  className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                >
                  {health >= maxHealth ? '生命已满' : `购买 $${ECONOMY_CONFIG.SNACK_COST}`}
                </button>
              </div>
            )}

            {serviceModal.kind === 'diner' && (
              <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-700 bg-[#111827] p-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                    <HeartPulse className="h-4 w-4 text-[#FF2E88]" />
                    <span>狐狸招牌合成豚骨拉面</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    热气腾腾的浓汤拉面，即时恢复 +{ECONOMY_CONFIG.RAMEN_HEAL} 点生命值。
                  </p>
                </div>
                <button
                  type="button"
                  disabled={health >= maxHealth || cash < ECONOMY_CONFIG.RAMEN_COST}
                  onClick={() =>
                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'ramen' })
                  }
                  className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#FF2E88] bg-[#FF2E88]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#FF2E88] hover:bg-[#FF2E88] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                >
                  {health >= maxHealth ? '生命已满' : `点餐 $${ECONOMY_CONFIG.RAMEN_COST}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
