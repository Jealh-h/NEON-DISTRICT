import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Map,
  Pause,
  Radio,
  Shield,
  Sparkles,
  Timer,
  UserCog,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
} from 'lucide-react';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';
import { MiniMap } from './MiniMap';

const SERVICE_LANDMARK_IDS = new Set([
  'nexus-ops',
  'plaza-garage',
  'chrome-workshop',
  'plaza-tech',
  'harbor-market',
  'cyber-clinic',
  'byte-mart',
  'kitsune-noodles',
  'skyline-apts',
  'arcade-lounge',
  'synth-club',
]);

export function GameHUD() {
  const playMode = useGameStore((s) => s.playMode);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const armor = useGameStore((s) => s.armor);
  const maxArmor = useGameStore((s) => s.maxArmor);
  const cash = useGameStore((s) => s.cash);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const spotted = useGameStore((s) => s.spotted);
  const escapeProgress = useGameStore((s) => s.escapeProgress);
  const activeMission = useGameStore((s) => s.activeMission);
  const districtName = useGameStore((s) => s.districtName);
  const districtBanner = useGameStore((s) => s.districtBanner);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const nearbyLandmark = useGameStore((s) => s.nearbyLandmark);
  const nearbyProp = useGameStore((s) => s.nearbyProp);
  const nearbyNpc = useGameStore((s) => s.nearbyNpc);
  const nearbyVehicle = useGameStore((s) => s.nearbyVehicle);
  const inVehicle = useGameStore((s) => s.inVehicle);
  const vehicleName = useGameStore((s) => s.vehicleName);
  const vehicleType = useGameStore((s) => s.vehicleType);
  const radioStation = useGameStore((s) => s.radioStation);
  const vehicleSpeedKmh = useGameStore((s) => s.vehicleSpeedKmh);
  const vehicleHealth = useGameStore((s) => s.vehicleHealth);
  const vehicleMaxHealth = useGameStore((s) => s.vehicleMaxHealth);
  const vehicleNitro = useGameStore((s) => s.vehicleNitro);
  const vehicleBoosting = useGameStore((s) => s.vehicleBoosting);
  const vehicleFlying = useGameStore((s) => s.vehicleFlying);
  const vehicleWeaponKind = useGameStore((s) => s.vehicleWeaponKind);
  const horde = useGameStore((s) => s.horde);
  const race = useGameStore((s) => s.race);
  const exploration = useGameStore((s) => s.exploration);
  const environment = useGameStore((s) => s.environment);
  const randomEvents = useGameStore((s) => s.randomEvents);
  const progression = useGameStore((s) => s.progression);
  const toggleCharacterModal = useGameStore((s) => s.toggleCharacterModal);
  const interactionToast = useGameStore((s) => s.interactionToast);
  const weapon = useGameStore((s) => s.weapon);
  const muted = useGameStore((s) => s.muted);
  const hudCompact = useGameStore((s) => s.hudCompact);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleMap = useGameStore((s) => s.toggleMap);
  const toggleHudCompact = useGameStore((s) => s.toggleHudCompact);

  const [rightCardCollapsed, setRightCardCollapsed] = useState(false);

  const healthPct = Math.max(0, Math.min(100, Math.round((health / maxHealth) * 100)));
  const armorPct = maxArmor > 0 ? Math.max(0, Math.min(100, Math.round((armor / maxArmor) * 100))) : 0;
  const expPct =
    progression.nextLevelExp > 0
      ? Math.max(0, Math.min(100, Math.round((progression.exp / progression.nextLevelExp) * 100)))
      : 0;
  const vehHealthPct =
    vehicleMaxHealth > 0
      ? Math.max(0, Math.min(100, Math.round((vehicleHealth / vehicleMaxHealth) * 100)))
      : 0;
  const bossHpPct =
    horde.bossMaxHp > 0
      ? Math.max(0, Math.min(100, Math.round((horde.bossHp / horde.bossMaxHp) * 100)))
      : 0;
  const mech = horde.mech;
  const mechHpPct =
    mech && mech.maxHp > 0
      ? Math.max(0, Math.min(100, Math.round((mech.hp / mech.maxHp) * 100)))
      : 0;
  const isPoliceVehicle = vehicleType === 'cruiser' || vehicleType === 'swat';
  const isAtServiceTerminal =
    nearbyLandmark !== null && SERVICE_LANDMARK_IDS.has(nearbyLandmark.id);

  const nearestEvent =
    playMode === 'sandbox' && randomEvents.length > 0
      ? randomEvents.reduce<{ ev: (typeof randomEvents)[number]; dist: number } | null>(
          (best, ev) => {
            const dist = Math.hypot(ev.x - playerX, ev.y - playerY);
            if (!best || dist < best.dist) return { ev, dist };
            return best;
          },
          null
        )
      : null;

  const curUpg = weapon.upgradesByWeapon?.[weapon.equippedId];
  const totalUpg = curUpg ? curUpg.damage + curUpg.firerate + curUpg.capacity : 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 sm:p-3">
      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left: Compact Player Vitals & Weapon/Vehicle Bar */}
        <div className="flex w-[212px] flex-col gap-1 sm:w-[238px]">
          <div
            className={`border bg-[#080D18]/76 px-2.5 py-1.5 backdrop-blur-[2px] transition-colors ${
              wantedLevel > 0 ? 'border-[#FF4545]/90' : 'border-[#00F5FF]/35'
            }`}
          >
            {/* Cash + Health & Armor */}
            <div className="flex items-center gap-2.5">
              <div className="min-w-[58px]">
                <div className="text-[9px] tracking-wider text-slate-400">现金</div>
                <div className="font-mono-tabular text-sm font-bold leading-tight text-[#FFD166] sm:text-base">
                  ${cash.toLocaleString()}
                </div>
              </div>

              <div className="h-6 w-px bg-slate-700/70" />

              <div className="flex-1">
                <div className="mb-0.5 flex items-center justify-between text-[9px] sm:text-[10px]">
                  <span className="text-slate-300">生命</span>
                  <span className="font-mono-tabular font-bold text-[#00F5FF]">
                    {health}/{maxHealth}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#151C2B]">
                  <div
                    className={`h-full transition-all duration-150 ${
                      healthPct <= 30 ? 'bg-[#FF4545]' : 'bg-[#00F5FF]'
                    }`}
                    style={{ width: `${healthPct}%` }}
                  />
                </div>

                <div className="mt-1 mb-0.5 flex items-center justify-between text-[9px]">
                  <span className="flex items-center gap-0.5 text-slate-400">
                    <Shield className="h-2.5 w-2.5 text-[#38BDF8]" />
                    护甲
                  </span>
                  <span className="font-mono-tabular font-bold text-[#38BDF8]">
                    {armor}/{maxArmor}
                  </span>
                </div>
                <div className="h-1 w-full bg-[#151C2B]">
                  <div
                    className="h-full bg-[#38BDF8] transition-all duration-150"
                    style={{ width: `${armorPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Level, EXP & [C] Character Modal Button */}
            <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-1">
              <div className="min-w-[74px] flex-1">
                <div className="mb-0.5 flex items-center justify-between text-[9px]">
                  <span className="font-mono-tabular font-bold text-[#00F5FF]">
                    Lv.{progression.level}
                  </span>
                  <span className="font-mono-tabular text-slate-400">
                    {progression.exp}/{progression.nextLevelExp}
                  </span>
                </div>
                <div className="h-1 w-full bg-[#151C2B]">
                  <div
                    className="h-full bg-[#C000FF] transition-all duration-150"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={toggleCharacterModal}
                title="打开角色技能与义体面板 (C)"
                className={`pointer-events-auto flex cursor-pointer items-center gap-1 border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  progression.skillPoints > 0
                    ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]'
                    : 'border-[#00F5FF]/50 bg-[#0D1424]/80 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                }`}
              >
                <UserCog className="h-3 w-3" />
                <span>[C]</span>
                {progression.skillPoints > 0 && (
                  <span className="bg-[#FFD166] px-1 font-mono-tabular text-[9px] font-bold text-[#080D18]">
                    +{progression.skillPoints}
                  </span>
                )}
              </button>
            </div>

            {/* Sandbox Wanted Stars & Chips (single compact section) */}
            {playMode === 'sandbox' && (
              <div className="mt-1 border-t border-slate-800/80 pt-1">
                <div className="flex items-center justify-between gap-1 text-[10px]">
                  <div className="flex items-center gap-1" aria-label={`通缉等级 ${wantedLevel} / 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="10"
                        height="10"
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

                  {wantedLevel > 0 ? (
                    <span
                      className={`font-mono-tabular text-[9px] font-bold ${
                        spotted ? 'text-[#FF4545]' : 'text-[#00F5FF]'
                      }`}
                    >
                      {spotted ? '追捕锁定' : `甩脱 ${escapeProgress}%`}
                    </span>
                  ) : (
                    <span className="font-mono-tabular text-[9px] font-bold text-[#C000FF]">
                      芯片 {exploration.chipsCollected}/{exploration.totalChips}
                    </span>
                  )}
                </div>

                {wantedLevel > 0 && !spotted && (
                  <div className="mt-0.5 h-1 w-full bg-[#151C2B]">
                    <div
                      className="h-full bg-[#00F5FF] transition-all duration-150"
                      style={{ width: `${escapeProgress}%` }}
                    />
                  </div>
                )}

                {wantedLevel > 0 && progression.jammerUnlocked && wantedLevel <= 3 && (
                  <button
                    type="button"
                    onClick={() => gameEvents.emit(GAME_EVENT.TRIGGER_HACK_JAM)}
                    className={`pointer-events-auto mt-1 flex w-full cursor-pointer items-center justify-between border px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
                      progression.jammerActiveSec > 0
                        ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                        : progression.jammerCooldownSec > 0
                          ? 'border-slate-700 bg-[#0D1424]/80 text-slate-400'
                          : 'border-[#00F5FF]/80 bg-[#0D1424]/85 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <WifiOff className="h-2.5 w-2.5" />
                      <span>[H] 干扰警讯</span>
                    </span>
                    <span className="font-mono-tabular">
                      {progression.jammerActiveSec > 0
                        ? `${progression.jammerActiveSec}s`
                        : progression.jammerCooldownSec > 0
                          ? `冷却 ${progression.jammerCooldownSec}s`
                          : '就绪'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active Weapon Telemetry (on foot) */}
          {!inVehicle && (
            <div className="flex items-stretch gap-1">
              <button
                type="button"
                onClick={() => gameEvents.emit(GAME_EVENT.SWITCH_WEAPON, 'next')}
                title="切换武器 (Q / 1-7)"
                className="pointer-events-auto flex flex-1 cursor-pointer items-center justify-between gap-2 border bg-[#080D18]/76 px-2.5 py-1 text-left backdrop-blur-[2px] transition-colors hover:brightness-110"
                style={{
                  borderColor: horde.overdriveSec > 0 ? '#FFD166' : `${weapon.colorHex}80`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-3 w-1"
                    style={{ backgroundColor: weapon.colorHex }}
                  />
                  <span
                    className="text-[11px] font-bold tracking-wider"
                    style={{ color: weapon.colorHex }}
                  >
                    {weapon.shortName}
                  </span>
                  {totalUpg > 0 && (
                    <span className="border border-[#FFD166]/60 bg-[#FFD166]/15 px-1 font-mono-tabular text-[9px] font-bold text-[#FFD166]">
                      +{totalUpg}
                    </span>
                  )}
                </div>
                <span className="font-mono-tabular text-xs font-bold text-slate-100">
                  {weapon.infiniteAmmo ? '∞' : weapon.ammo}
                </span>
              </button>
              <button
                type="button"
                onClick={() => gameEvents.emit(GAME_EVENT.OPEN_QUICK_ARMORY)}
                title="打开军械库与升级 (B)"
                className="pointer-events-auto flex cursor-pointer items-center justify-center border border-[#FFD166]/60 bg-[#080D18]/76 px-2 text-[10px] font-bold text-[#FFD166] backdrop-blur-[2px] transition-colors hover:bg-[#FFD166] hover:text-[#080D18]"
              >
                [B] 军械
              </button>
            </div>
          )}

          {/* Active Vehicle Telemetry (compact) */}
          {inVehicle && (
            <div className="border border-[#FF2E88]/45 bg-[#080D18]/76 px-2.5 py-1.5 backdrop-blur-[2px]">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold tracking-wider text-[#FF2E88]">
                    {vehicleName}
                  </div>
                  <div className="mt-1 h-1 w-full bg-[#151C2B]">
                    <div
                      className="h-full bg-[#FFD166] transition-all duration-150"
                      style={{ width: `${vehHealthPct}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right font-mono-tabular">
                  <span className="text-base font-bold leading-none text-[#00F5FF]">
                    {vehicleSpeedKmh}
                  </span>
                  <span className="ml-0.5 text-[9px] text-slate-400">km/h</span>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2 text-[9px]">
                <span className="flex items-center gap-0.5 text-slate-300">
                  <Zap className={`h-2.5 w-2.5 ${vehicleBoosting ? 'text-[#FFD166]' : 'text-[#00F5FF]'}`} />
                  氮气
                </span>
                <div className="h-1 flex-1 bg-[#151C2B]">
                  <div
                    className={`h-full transition-all duration-100 ${
                      vehicleBoosting ? 'bg-[#FFD166]' : 'bg-[#00F5FF]'
                    }`}
                    style={{ width: `${vehicleNitro}%` }}
                  />
                </div>
                <span className="font-mono-tabular font-bold text-[#00F5FF]">
                  {vehicleNitro}%
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-1 border-t border-slate-800/80 pt-1 text-[9px]">
                <span className="truncate font-bold text-[#FFD166]">
                  {vehicleWeaponKind === 'tank_cannon'
                    ? '120mm 主炮'
                    : vehicleWeaponKind === 'autocannon'
                      ? '双联机炮'
                      : vehicleWeaponKind
                        ? weapon.shortName
                        : '无武装'}
                  {vehicleFlying ? ' · 低空飞行' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => gameEvents.emit(GAME_EVENT.CYCLE_RADIO)}
                  title="切换车载电台 (R)"
                  className="pointer-events-auto flex shrink-0 cursor-pointer items-center gap-1 font-bold text-[#C000FF] hover:text-[#00F5FF]"
                >
                  <Radio className="h-2.5 w-2.5" />
                  <span>[R] {radioStation.name}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-Center: Slim Environment Pill, Event Tracker, District Banner, Boss Bar */}
        <div className="hidden flex-1 flex-col items-center gap-1 pt-0.5 sm:flex">
          <div
            title={environment.weatherEffectHint}
            className="pointer-events-auto flex items-center gap-1.5 border border-slate-700/70 bg-[#080D18]/72 px-2.5 py-0.5 text-[10px] backdrop-blur-[2px]"
          >
            <CloudRain className="h-3 w-3 text-[#00F5FF]" />
            <span className="font-mono-tabular font-bold text-slate-100">
              {environment.clockText}
            </span>
            <span className="text-[#FFD166]">{environment.timeLabel}</span>
            <span className="text-slate-600">·</span>
            <span className="font-bold text-[#00F5FF]">{environment.weatherLabel}</span>
          </div>

          {!hudCompact && nearestEvent && (
            <div
              className="flex items-center gap-1.5 border bg-[#080D18]/74 px-2.5 py-0.5 text-[10px] backdrop-blur-[2px]"
              style={{ borderColor: `${nearestEvent.ev.accentColor}AA` }}
            >
              <span
                className="inline-block h-1.5 w-1.5 animate-pulse"
                style={{ backgroundColor: nearestEvent.ev.accentColor }}
              />
              <span className="font-bold" style={{ color: nearestEvent.ev.accentColor }}>
                {nearestEvent.ev.title}
              </span>
              <span className="font-mono-tabular text-slate-300">
                {nearestEvent.ev.district} · {Math.round(nearestEvent.dist)}px ·{' '}
                {nearestEvent.ev.timeRemainingSec}s
              </span>
            </div>
          )}

          {districtBanner && (
            <div className="border-y border-[#00F5FF]/85 bg-[#080D18]/75 px-5 py-0.5 text-center backdrop-blur-[2px]">
              <span className="text-[10px] font-bold tracking-widest text-[#00F5FF]">
                进入区域 ·{' '}
              </span>
              <span className="text-xs font-bold tracking-widest text-[#FFD166]">
                {districtBanner}
              </span>
            </div>
          )}

          {playMode === 'horde' && horde.active && horde.bossName && (
            <div className="w-full max-w-xs border border-[#FFD166] bg-[#080D18]/80 px-3 py-1.5 text-center backdrop-blur-[2px]">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#FFD166]">BOSS · {horde.bossName}</span>
                <span className="font-mono-tabular text-[#FF4545]">
                  {horde.bossHp}/{horde.bossMaxHp}
                </span>
              </div>
              <div className="mt-1 h-2 w-full bg-[#151C2B]">
                <div
                  className="h-full bg-[#FF2E88] transition-all duration-100"
                  style={{ width: `${bossHpPct}%` }}
                />
              </div>
            </div>
          )}

          {playMode === 'race' && race.active && race.countdownSec > 0 && (
            <div className="border-2 border-[#FFD166] bg-[#080D18]/88 px-6 py-2 text-center">
              <div className="text-[10px] font-bold tracking-widest text-[#00F5FF]">准备发车</div>
              <div className="font-mono-tabular text-3xl font-bold text-[#FFD166]">
                {race.countdownSec}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Utility Actions, MiniMap & Mode/Mission Telemetry (Balanced Right Column) */}
        <div className="flex w-[144px] flex-col items-end gap-1 sm:w-[218px]">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="hidden text-right lg:block">
              <div className="text-[11px] font-bold tracking-wider text-[#00F5FF]">
                {districtName}
              </div>
              <div className="font-mono-tabular text-[10px] text-slate-400">
                {playerX},{playerY}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleHudCompact}
              title={hudCompact ? '展开 HUD 面板 (V)' : '精简视野 HUD (V)'}
              aria-label={hudCompact ? '展开 HUD 面板' : '精简视野 HUD'}
              className={`pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center border bg-[#080D18]/78 transition-colors sm:h-9 sm:w-9 ${
                hudCompact
                  ? 'border-[#FFD166] text-[#FFD166]'
                  : 'border-slate-700 text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF]'
              }`}
            >
              {hudCompact ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleMap}
              title="打开地图 (M)"
              aria-label="打开区域地图"
              className="pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center border border-slate-700 bg-[#080D18]/78 text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] sm:h-9 sm:w-9"
            >
              <Map className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              title={muted ? '开启音效' : '静音'}
              aria-label={muted ? '开启音效' : '静音'}
              className="pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center border border-slate-700 bg-[#080D18]/78 text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] sm:h-9 sm:w-9"
            >
              {muted ? (
                <VolumeX className="h-3.5 w-3.5 text-[#FF4545]" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => gameEvents.emit(GAME_EVENT.PAUSE_GAME)}
              title="暂停游戏 (Esc)"
              aria-label="暂停游戏"
              className="pointer-events-auto flex h-8 w-8 cursor-pointer items-center justify-center border border-slate-700 bg-[#080D18]/78 text-slate-200 transition-colors hover:border-[#FF2E88] hover:text-[#FF2E88] sm:h-9 sm:w-9"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          </div>

          {!hudCompact && (
            <>
              <div className="hidden sm:block">
                <MiniMap width={132} height={96} onClick={toggleMap} />
              </div>
              <div className="block sm:hidden">
                <MiniMap width={92} height={66} onClick={toggleMap} />
              </div>
            </>
          )}

          {/* Sandbox Active Mission (moved to Top-Right so Left Column stays compact!) */}
          {playMode === 'sandbox' && activeMission && !hudCompact && (
            <div className="w-full border border-[#FFD166]/60 bg-[#080D18]/76 px-2.5 py-1.5 backdrop-blur-[2px]">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-[10px] font-bold text-[#FFD166]">
                  {activeMission.title} ({activeMission.stepIndex + 1}/{activeMission.totalSteps})
                </span>
                <button
                  type="button"
                  onClick={() => setRightCardCollapsed((c) => !c)}
                  className="pointer-events-auto cursor-pointer text-slate-400 hover:text-[#FFD166]"
                  title={rightCardCollapsed ? '展开委托详情' : '收起委托详情'}
                >
                  {rightCardCollapsed ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronUp className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {!rightCardCollapsed && (
                <>
                  <p className="mt-1 text-[10px] leading-snug text-slate-200">
                    {activeMission.instruction}
                  </p>
                  <div className="mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1 font-mono-tabular text-[9px]">
                    <span className="text-[#00F5FF]">${activeMission.reward}</span>
                    {activeMission.timeRemainingSec !== null && (
                      <span
                        className={
                          activeMission.timeRemainingSec <= 12
                            ? 'font-bold text-[#FF4545]'
                            : 'text-[#FFD166]'
                        }
                      >
                        {activeMission.timeRemainingSec}s
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Horde Mode Telemetry (moved to Top-Right, collapsible & compact) */}
          {playMode === 'horde' && !hudCompact && (
            <div className="w-full border border-[#FF2E88]/65 bg-[#080D18]/76 px-2.5 py-1.5 backdrop-blur-[2px]">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-[#FF2E88]" />
                  <span className="text-[11px] font-bold text-[#FF2E88]">
                    第 {horde.wave} 波
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                    {horde.score.toLocaleString()}分
                  </span>
                  <button
                    type="button"
                    onClick={() => setRightCardCollapsed((c) => !c)}
                    className="pointer-events-auto cursor-pointer text-slate-400 hover:text-[#00F5FF]"
                    title={rightCardCollapsed ? '展开波次面板' : '收起波次面板'}
                  >
                    {rightCardCollapsed ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {!rightCardCollapsed && (
                <>
                  <div className="mt-1 grid grid-cols-3 gap-1 font-mono-tabular text-[9px] text-slate-300">
                    <div className="bg-[#111827]/85 px-1 py-0.5 text-center">
                      剩 <span className="font-bold text-slate-100">{horde.enemiesRemaining}</span>
                    </div>
                    <div className="bg-[#111827]/85 px-1 py-0.5 text-center">
                      杀 <span className="font-bold text-[#00F5FF]">{horde.kills}</span>
                    </div>
                    <div className="bg-[#111827]/85 px-1 py-0.5 text-center">
                      <span className="font-bold text-[#FFD166]">×{horde.combo}</span>
                    </div>
                  </div>

                  {mech?.active && (
                    <div className="mt-1 border border-[#FFD166]/70 bg-[#121B2E]/85 p-1.5">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="truncate font-bold text-[#FFD166]">{mech.name}</span>
                        <span className="font-mono-tabular text-[#00F5FF]">
                          {mech.hp}/{mech.maxHp}
                        </span>
                      </div>
                      <div className="mt-0.5 h-1 w-full bg-[#080D18]">
                        <div
                          className="h-full bg-[#FFD166] transition-all duration-150"
                          style={{ width: `${mechHpPct}%` }}
                        />
                      </div>
                      {mech.abilityLabel && (
                        <button
                          type="button"
                          onClick={() => gameEvents.emit(GAME_EVENT.TRIGGER_MECH_ABILITY)}
                          className={`pointer-events-auto mt-1 flex w-full cursor-pointer items-center justify-between border px-1.5 py-0.5 text-[9px] font-bold ${
                            mech.abilityCooldownSec > 0
                              ? 'border-slate-700 bg-[#080D18]/80 text-slate-400'
                              : 'border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                          }`}
                        >
                          <span className="truncate">[空格] {mech.abilityLabel}</span>
                          <span className="font-mono-tabular">
                            {mech.abilityCooldownSec > 0 ? `${mech.abilityCooldownSec}s` : '就绪'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {horde.overdriveSec > 0 && (
                    <div className="mt-1 border border-[#FFD166]/65 bg-[#FFD166]/15 px-1.5 py-0.5 text-center font-mono-tabular text-[9px] font-bold text-[#FFD166]">
                      武器过载 ({horde.overdriveSec}s)
                    </div>
                  )}

                  {horde.restSec > 0 && (
                    <div className="mt-1 border border-[#00F5FF]/50 bg-[#00F5FF]/10 px-1.5 py-0.5 text-center font-mono-tabular text-[9px] text-[#00F5FF]">
                      休整 {horde.restSec}s 后下波
                    </div>
                  )}

                  {horde.activePerks && horde.activePerks.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {horde.activePerks.map((perk) => (
                        <span
                          key={perk.id}
                          className="inline-flex items-center gap-0.5 border bg-[#0D1424]/85 px-1 py-0.5 font-mono-tabular text-[8px] font-bold"
                          style={{
                            borderColor: `${perk.accentColor}80`,
                            color: perk.accentColor,
                          }}
                        >
                          <Sparkles className="h-2 w-2" />
                          {perk.name}×{perk.stacks}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => gameEvents.emit(GAME_EVENT.OPEN_QUICK_ARMORY)}
                    className="pointer-events-auto mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1 border border-[#00F5FF]/65 bg-[#00F5FF]/12 px-2 py-1 text-[10px] font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18]"
                  >
                    <Crosshair className="h-3 w-3" />
                    <span>[B] 军械 / 机甲 ({mech?.turretCount ?? 0}/{mech?.maxTurrets ?? 2}塔)</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Compact Horde Pill when hudCompact is on */}
          {playMode === 'horde' && hudCompact && (
            <div className="border border-[#FF2E88]/65 bg-[#080D18]/75 px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-[#FF2E88]">
              W{horde.wave} · 剩{horde.enemiesRemaining}
            </div>
          )}

          {/* Race Mode Telemetry (moved to Top-Right) */}
          {playMode === 'race' && !hudCompact && (
            <div className="w-full border border-[#FFD166]/70 bg-[#080D18]/76 px-2.5 py-1.5 backdrop-blur-[2px]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3 text-[#FFD166]" />
                  <span className="text-[10px] font-bold text-[#FFD166]">
                    {race.checkpointIndex + 1}/{race.totalCheckpoints}
                  </span>
                </div>
                <span
                  className={`font-mono-tabular text-[11px] font-bold ${
                    race.timeRemainingSec <= 8 ? 'text-[#FF4545]' : 'text-[#00F5FF]'
                  }`}
                >
                  {race.timeRemainingSec}s
                </span>
              </div>
              {race.targetLabel && (
                <div className="mt-0.5 truncate text-[10px] text-slate-200">
                  → <span className="font-bold text-[#FFD166]">{race.targetLabel}</span>
                </div>
              )}
              <div className="mt-0.5 flex items-center justify-between font-mono-tabular text-[9px] text-slate-400">
                <span>用时 {race.elapsedSec}s</span>
                <span>最佳 {race.bestTimeSec !== null ? `${race.bestTimeSec}s` : '--'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center-Bottom: Slim Context Interaction Hints & Toast */}
      <div className="flex flex-col items-center gap-1.5 pb-14 sm:pb-1.5">
        {districtBanner && (
          <div className="border-y border-[#00F5FF]/85 bg-[#080D18]/76 px-4 py-0.5 text-center sm:hidden">
            <span className="text-[10px] font-bold text-[#00F5FF]">进入 · </span>
            <span className="text-xs font-bold text-[#FFD166]">{districtBanner}</span>
          </div>
        )}

        {playMode === 'race' && race.active && race.countdownSec > 0 && (
          <div className="border-2 border-[#FFD166] bg-[#080D18]/90 px-5 py-1.5 text-center sm:hidden">
            <span className="font-mono-tabular text-xl font-bold text-[#FFD166]">
              发车倒计时 {race.countdownSec}
            </span>
          </div>
        )}

        {interactionToast && (
          <div className="max-w-xs border border-[#00F5FF]/75 bg-[#080D18]/78 px-3 py-1 text-center text-[11px] leading-snug text-slate-100 backdrop-blur-[2px] sm:max-w-sm">
            {interactionToast}
          </div>
        )}

        {!inVehicle && nearbyVehicle && (
          <div className="border border-[#00F5FF]/80 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#00F5FF]">按 F</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>驾驶 {nearbyVehicle.name}</span>
          </div>
        )}

        {!inVehicle && isAtServiceTerminal && nearbyLandmark && (
          <div className="border border-[#FFD166]/80 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#FFD166]">按 E</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>进入 {nearbyLandmark.name}</span>
          </div>
        )}

        {!inVehicle && !isAtServiceTerminal && nearbyProp && (
          <div className="border border-[#00F5FF]/80 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#00F5FF]">按 E</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>
              {nearbyProp.title} — {nearbyProp.actionLabel}
            </span>
          </div>
        )}

        {!inVehicle && !isAtServiceTerminal && !nearbyProp && nearbyNpc && (
          <div className="border border-[#FF2E88]/80 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#FF2E88]">按 E</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>与 {nearbyNpc.name}（{nearbyNpc.role}）对话</span>
          </div>
        )}

        {!inVehicle && !isAtServiceTerminal && !nearbyProp && !nearbyNpc && nearbyLandmark && (
          <div className="border border-[#FFD166]/75 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#FFD166]">按 E</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>查看 {nearbyLandmark.name}</span>
          </div>
        )}

        {inVehicle && nearbyLandmark && (
          <div className="border border-[#00F5FF]/80 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#00F5FF]">按 E</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>进入 {nearbyLandmark.name}（维修与改装）</span>
          </div>
        )}

        {inVehicle && !nearbyLandmark && isPoliceVehicle && playMode === 'sandbox' && (
          <div className="border border-[#38BDF8]/80 bg-[#080D18]/80 px-3 py-1 text-xs text-slate-100">
            <span className="font-mono-tabular font-bold text-[#38BDF8]">按 E</span>
            <span className="mx-1.5 text-slate-500">·</span>
            <span>开启【治安追缉】警用悬赏行动</span>
          </div>
        )}

        {!hudCompact &&
          (inVehicle ? (
            <div className="hidden border border-slate-700/60 bg-[#080D18]/65 px-2.5 py-0.5 font-mono-tabular text-[10px] text-slate-300/85 md:block">
              WASD 驾驶 · 左键/J 开火 · Shift 氮气 · 空格 刹车 · R 电台 · C 角色 · V 精简视角 ·{' '}
              {isPoliceVehicle && playMode === 'sandbox' ? 'E 治安追缉 · ' : ''}F 下车
            </div>
          ) : (
            <div className="hidden border border-slate-700/60 bg-[#080D18]/65 px-2.5 py-0.5 font-mono-tabular text-[10px] text-slate-300/85 md:block">
              WASD 移动 · 左键/J 开火 · {mech?.active ? '空格 机甲技 · ' : 'Q/1-7 切枪 · '}
              B 军械 · C 角色 · V 精简视角 · E 交互 · F 上车
            </div>
          ))}
      </div>
    </div>
  );
}
