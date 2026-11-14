import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Crosshair,
  HeartPulse,
  Home,
  Palette,
  Shield,
  Sparkles,
  Timer,
  Wine,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect } from 'react';
import {
  ECONOMY_CONFIG,
  MISSION_DEFINITIONS,
  VEHICLE_PAINT_OPTIONS,
  VEHICLE_UPGRADE_CONFIG,
  VehicleUpgradeTrack,
  WEAPON_ORDER,
  WEAPON_SPECS,
  WEAPON_UPGRADE_CONFIG,
  WeaponUpgradeTrack,
} from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

const UPGRADE_TRACKS: VehicleUpgradeTrack[] = ['engine', 'handling', 'armor'];
const WEAPON_UPGRADE_TRACKS: WeaponUpgradeTrack[] = ['damage', 'firerate', 'capacity'];

export function ServiceModal() {
  const serviceModal = useGameStore((s) => s.serviceModal);
  const setServiceModal = useGameStore((s) => s.setServiceModal);
  const playMode = useGameStore((s) => s.playMode);
  const cash = useGameStore((s) => s.cash);
  const ownsSafehouse = useGameStore((s) => s.ownsSafehouse);
  const arcadeResult = useGameStore((s) => s.arcadeResult);
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

                {/* Custom Paint Jobs */}
                <div className="border border-slate-700/90 bg-[#111827] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                      <Palette className="h-4 w-4 text-[#FF2E88]" />
                      <span>个性车体涂装</span>
                    </div>
                    <span className="font-mono-tabular text-xs text-slate-400">
                      ${ECONOMY_CONFIG.PAINT_JOB_COST}（原厂免费）
                    </span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {VEHICLE_PAINT_OPTIONS.map((opt) => {
                      const currentPaint = serviceModal.targetVehicle!.paintColor ?? null;
                      const isCurrent = currentPaint === opt.colorNum;
                      const cost = opt.colorNum === null ? 0 : ECONOMY_CONFIG.PAINT_JOB_COST;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isCurrent || cash < cost}
                          onClick={() =>
                            gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                              serviceType: 'paint',
                              vehicleId: serviceModal.targetVehicle!.id,
                              colorNum: opt.colorNum,
                              colorName: opt.name,
                            })
                          }
                          className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-2 border px-3 py-2 text-xs font-bold transition-colors ${
                            isCurrent
                              ? 'border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF]'
                              : 'border-slate-700 bg-[#080D18] text-slate-200 hover:border-[#FF2E88] disabled:cursor-not-allowed disabled:opacity-45'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 shrink-0 border border-slate-400/60"
                              style={{ backgroundColor: opt.swatchHex }}
                            />
                            <span>{opt.name}</span>
                          </span>
                          <span className="font-mono-tabular text-[11px] text-slate-400">
                            {isCurrent ? '当前' : cost === 0 ? '免费' : `$${cost}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-slate-700 bg-[#111827] p-4 text-xs text-slate-300">
                附近没有可整备的载具，请先驾驶或把车辆停靠在车库附近。
              </div>
            )}
          </div>
        )}

        {/* Plaza Tech Armory & Weapon Upgrade Lab */}
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
                左键 / J / 右侧摇杆 开火 · Q / 1-7 切枪 · [B] 随身终端
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {WEAPON_ORDER.map((wId, idx) => {
                const spec = WEAPON_SPECS[wId];
                const owned = weapon.ownedIds.includes(wId);
                const equipped = weapon.equippedId === wId;
                const upg = weapon.upgradesByWeapon?.[wId] ?? {
                  damage: 0,
                  firerate: 0,
                  capacity: 0,
                };
                const totalUpgradeLvl = upg.damage + upg.firerate + upg.capacity;

                const effDmg = Math.round(spec.damage * (1 + upg.damage * 0.2));
                const effInterval = Math.max(
                  45,
                  Math.round(spec.fireIntervalMs * Math.pow(0.88, upg.firerate))
                );
                const effRange = Math.round(spec.range * (1 + upg.capacity * 0.1));
                const effMaxAmmo = weapon.maxAmmoByWeapon?.[wId] ?? spec.maxAmmo;
                const effPierce =
                  (spec.pierceCount ?? 1) + (wId === 'railgun' && upg.damage >= 2 ? 1 : 0);
                const effBlast = spec.blastRadius ? spec.blastRadius + upg.damage * 16 : 0;

                const currentAmmo = weapon.ammoByWeapon[wId] ?? 0;
                const isAmmoFull = spec.infiniteAmmo || currentAmmo >= effMaxAmmo;
                const damageLabel =
                  spec.pellets > 1 ? `${effDmg} × ${spec.pellets} 发` : `${effDmg} 伤害`;
                const rpmLabel = `${Math.round(60000 / effInterval)} 发/分`;

                return (
                  <div
                    key={wId}
                    className={`border p-3.5 transition-colors ${
                      equipped
                        ? 'border-[#00F5FF] bg-[#161F33]'
                        : 'border-slate-700/90 bg-[#111827]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="border border-slate-700 bg-[#080D18] px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-slate-300">
                            {idx + 1}
                          </span>
                          <Crosshair className="h-4 w-4" style={{ color: spec.colorHex }} />
                          <span className="text-sm font-bold text-slate-100">{spec.name}</span>
                          <span
                            className="border px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              borderColor: `${spec.colorHex}55`,
                              color: spec.colorHex,
                              backgroundColor: `${spec.colorHex}14`,
                            }}
                          >
                            {spec.tag}
                          </span>
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
                          {owned && totalUpgradeLvl > 0 && (
                            <span className="border border-[#FFD166]/65 bg-[#FFD166]/15 px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                              +{totalUpgradeLvl} 强化
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                          {spec.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-tabular text-[11px] text-slate-400">
                          <span>火力：{damageLabel}</span>
                          <span>射速：{rpmLabel}</span>
                          <span>射程：{effRange}px</span>
                          {effPierce > 1 && (
                            <span className="text-[#38BDF8]">穿透：{effPierce} 目标</span>
                          )}
                          {effBlast > 0 && (
                            <span className="text-[#FF4545]">爆破半径：{effBlast}px</span>
                          )}
                          <span>
                            备弹：
                            {spec.infiniteAmmo ? '无限微核' : `${currentAmmo} / ${effMaxAmmo}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                            className="min-h-[44px] min-w-[116px] cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-3.5 py-2 font-mono-tabular text-xs font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                          >
                            购买 ${spec.buyCost}
                          </button>
                        ) : (
                          <>
                            {!equipped && (
                              <button
                                type="button"
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                    serviceType: 'equip_weapon',
                                    weaponId: wId,
                                  })
                                }
                                className="min-h-[44px] min-w-[78px] cursor-pointer border border-emerald-400/80 bg-emerald-500/12 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-400 hover:text-[#080D18]"
                              >
                                装备
                              </button>
                            )}
                            {spec.infiniteAmmo ? (
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
                                className="min-h-[44px] min-w-[126px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-3 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                              >
                                {isAmmoFull
                                  ? '弹药已满'
                                  : `+${spec.ammoPackSize}发 $${spec.ammoPackCost}`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Weapon Upgrade Matrix for owned weapons */}
                    {owned && (
                      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-slate-800 pt-2.5 sm:grid-cols-3">
                        {WEAPON_UPGRADE_TRACKS.map((track) => {
                          const cfg = WEAPON_UPGRADE_CONFIG[track];
                          const lvl = upg[track];
                          const isMax = lvl >= cfg.maxLevel;
                          const cost = isMax
                            ? 0
                            : Math.max(
                                50,
                                Math.round(
                                  (spec.upgradeBaseCost * cfg.costMultipliers[lvl]) / 5
                                ) * 5
                              );

                          return (
                            <div
                              key={track}
                              className="flex items-center justify-between gap-2 border border-slate-800 bg-[#0A101E] px-2.5 py-2"
                              title={cfg.description}
                            >
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-200">
                                  {cfg.label}
                                </div>
                                <div className="mt-1 flex items-center gap-1">
                                  {[1, 2, 3].map((step) => (
                                    <span
                                      key={step}
                                      className={`h-1.5 w-3.5 ${
                                        step <= lvl ? 'bg-[#FFD166]' : 'bg-slate-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={isMax || cash < cost}
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                    serviceType: 'upgrade_weapon',
                                    weaponId: wId,
                                    track,
                                  })
                                }
                                className="min-h-[36px] shrink-0 cursor-pointer border border-[#FFD166]/80 bg-[#FFD166]/12 px-2.5 py-1 font-mono-tabular text-[11px] font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                              >
                                {isMax ? '满级' : `$${cost}`}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
              <>
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

                <div className="flex flex-wrap items-center justify-between gap-3 border border-[#FF4545]/60 bg-[#1A1018] p-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#FF4545]">
                      <AlertTriangle className="h-4 w-4 text-[#FF4545]" />
                      <span>便利店收银台 · 高风险行动</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      {playMode === 'sandbox'
                        ? '将触发 2★ 警队追捕 · 90秒冷却，建议门口停好接应载具再下手！'
                        : '仅自由沙盒模式可用。'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={playMode !== 'sandbox'}
                    onClick={() => {
                      gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'rob_store' });
                      close();
                    }}
                    className="min-h-[44px] cursor-pointer border border-[#FF4545] bg-[#FF4545]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#FF4545] transition-colors hover:bg-[#FF4545] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                  >
                    持枪洗劫收银台 (+$220~$340)
                  </button>
                </div>
              </>
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

        {/* Safehouse Terminal */}
        {serviceModal.kind === 'safehouse' && (
          <div className="flex flex-col gap-3">
            {!ownsSafehouse ? (
              <div className="flex flex-col gap-4 border border-[#FFD166]/60 bg-[#111827] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-base font-bold text-slate-100">
                      <Home className="h-4 w-4 text-[#FFD166]" />
                      <span>天际公寓 · 私人高层安全屋</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      在霓虹广场东北区购置一处属于你的秘密避风港。一次投资，永久享有免费医疗修整、消除警方通缉追踪与随时本地安全存档特权！
                    </p>
                  </div>
                  <span className="border border-[#FFD166] bg-[#FFD166]/10 px-2.5 py-1 font-mono-tabular text-sm font-bold text-[#FFD166]">
                    购入价 ${ECONOMY_CONFIG.SAFEHOUSE_PRICE}
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={cash < ECONOMY_CONFIG.SAFEHOUSE_PRICE}
                    onClick={() =>
                      gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'buy_safehouse' })
                    }
                    className="min-h-[44px] cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-5 py-2 font-mono-tabular text-xs font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                  >
                    购置安全屋 (${ECONOMY_CONFIG.SAFEHOUSE_PRICE})
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 border border-[#00F5FF]/60 bg-[#111827] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-base font-bold text-slate-100">
                    <Home className="h-4 w-4 text-[#00F5FF]" />
                    <span>安全屋休整（免费）</span>
                  </div>
                  <span className="border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    已持有产权
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  在私人公寓内安全躲避特区巡警搜捕、使用自动医疗舱回满生命，并将当前全部进度立刻写入本地存档。
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="font-mono-tabular text-xs text-slate-400">
                    当前生命 {health}/{maxHealth} · 通缉 {wantedLevel}★
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'safehouse_rest' })
                    }
                    className="min-h-[44px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-5 py-2 text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18]"
                  >
                    免费恢复满状态 · 消星 · 存档
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cyber Arcade Slot Machine */}
        {serviceModal.kind === 'arcade' && (
          <div className="flex flex-col gap-3.5">
            <div className="border border-[#C000FF]/65 bg-[#111827] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <Coins className="h-4 w-4 text-[#FFD166]" />
                  <span>霓虹脉冲老虎机 · 街机搏彩</span>
                </div>
                <span className="font-mono-tabular text-[11px] text-slate-400">
                  777×3: 4× · GOLD×3: 2.5× · NEON×3: 1.6× · CHIP×2: 0.8×
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {(arcadeResult?.reels ?? ['777', 'NEON', 'GOLD']).map((symbol, idx) => (
                  <div
                    key={`${idx}-${symbol}`}
                    className={`flex h-20 items-center justify-center border-2 bg-[#080D18] font-mono-tabular text-xl font-bold tracking-widest sm:text-2xl ${
                      symbol === '777'
                        ? 'border-[#FFD166] text-[#FFD166]'
                        : symbol === 'GOLD'
                          ? 'border-[#FF2E88] text-[#FF2E88]'
                          : symbol === 'NEON'
                            ? 'border-[#00F5FF] text-[#00F5FF]'
                            : 'border-slate-700 text-slate-300'
                    }`}
                  >
                    {symbol}
                  </div>
                ))}
              </div>

              {arcadeResult && (
                <div
                  className={`mt-3 border px-3 py-2 text-center font-mono-tabular text-xs font-bold ${
                    arcadeResult.multiplier >= 1.5
                      ? 'border-[#FFD166] bg-[#FFD166]/15 text-[#FFD166]'
                      : arcadeResult.multiplier > 0
                        ? 'border-[#00F5FF]/70 bg-[#00F5FF]/10 text-[#00F5FF]'
                        : 'border-slate-700 bg-[#080D18] text-slate-400'
                  }`}
                >
                  下注 ${arcadeResult.bet} · {arcadeResult.message}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={cash < 25}
                  onClick={() =>
                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                      serviceType: 'arcade_spin',
                      bet: 25,
                    })
                  }
                  className="min-h-[44px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                >
                  小试手气 ($25)
                </button>
                <button
                  type="button"
                  disabled={cash < 100}
                  onClick={() =>
                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                      serviceType: 'arcade_spin',
                      bet: 100,
                    })
                  }
                  className="min-h-[44px] cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#FFD166] transition-colors hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
                >
                  高额博弈 ($100)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Synth Nightclub */}
        {serviceModal.kind === 'club' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#FF2E88]/60 bg-[#111827] p-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <Wine className="h-4 w-4 text-[#FF2E88]" />
                  <span>合成霓虹特调</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  即时恢复 +{ECONOMY_CONFIG.CLUB_COCKTAIL_HEAL} 生命值，并激活{' '}
                  {ECONOMY_CONFIG.CLUB_OVERDRIVE_SEC} 秒武器过载狂暴（射速与威力飙升）！
                </p>
              </div>
              <button
                type="button"
                disabled={cash < ECONOMY_CONFIG.CLUB_COCKTAIL_COST}
                onClick={() =>
                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'club_cocktail' })
                }
                className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#FF2E88] bg-[#FF2E88]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#FF2E88] transition-colors hover:bg-[#FF2E88] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
              >
                点单 ${ECONOMY_CONFIG.CLUB_COCKTAIL_COST}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#00F5FF]/55 bg-[#111827] p-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                  <AlertTriangle className="h-4 w-4 text-[#FFD166]" />
                  <span>买通地下线人</span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  通过夜店地下情报网伪造身份信号，立即降低 1 星警队通缉等级（当前 {wantedLevel}★）。
                </p>
              </div>
              <button
                type="button"
                disabled={wantedLevel === 0 || cash < ECONOMY_CONFIG.CLUB_BRIBE_COST}
                onClick={() =>
                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'club_bribe' })
                }
                className="min-h-[44px] min-w-[120px] cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-4 py-2 font-mono-tabular text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-transparent disabled:text-slate-500"
              >
                {wantedLevel === 0 ? '未被通缉' : `疏通 $${ECONOMY_CONFIG.CLUB_BRIBE_COST}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
