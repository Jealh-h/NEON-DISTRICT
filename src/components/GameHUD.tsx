import { useState } from 'react';
import {
  Car,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Hammer,
  Heart,
  Map,
  Pause,
  Play,
  Radio,
  ScrollText,
  Shield,
  SkipBack,
  SkipForward,
  Sparkles,
  UserCog,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
} from 'lucide-react';
import { WEAPON_ORDER, WEAPON_SPECS } from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';
import { MiniMap } from './MiniMap';
import { FarTargetPixelPointer, MissionTracker } from './MissionTracker';
import { HeroAvatarImg } from './PixelPortrait';
import { MedkitPixelIcon, WeaponPixelArt } from './WeaponPixelArt';

const SERVICE_LANDMARK_IDS = new Set([
  'nexus-ops',
  'plaza-garage',
  'chrome-workshop',
  'skyport-garage',
  'plaza-tech',
  'harbor-market',
  'cyber-clinic',
  'byte-mart',
  'kitsune-noodles',
  'skyline-apts',
  'arcade-lounge',
  'synth-club',
]);

const EQUALIZER_BARS = [
  { delay: '0ms', base: 42 },
  { delay: '120ms', base: 74 },
  { delay: '240ms', base: 92 },
  { delay: '80ms', base: 64 },
  { delay: '190ms', base: 86 },
  { delay: '310ms', base: 54 },
  { delay: '150ms', base: 70 },
];

const SHORTCUT_ITEMS = [
  { key: 'B', label: '随身军械' },
  { key: 'M', label: '打开地图' },
  { key: 'E', label: '互动 / 进入' },
  { key: 'F', label: '上车 / 劫车' },
  { key: 'Shift', label: '氮气加速' },
  { key: '空格', label: '手刹漂移' },
];

interface CircularSpeedometerProps {
  speedKmh: number;
  nitro: number;
  isBoosting: boolean;
  vehicleName: string | null;
  vehHealthPct: number;
  weaponLabel: string | null;
  isFlying: boolean;
}

function CircularSpeedometer({
  speedKmh,
  nitro,
  isBoosting,
  vehicleName,
  vehHealthPct,
  weaponLabel,
  isFlying,
}: CircularSpeedometerProps) {
  const maxGaugeKmh = 220;
  const ratio = Math.max(0, Math.min(1, speedKmh / maxGaugeKmh));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 deg sweep
  const filledLength = arcLength * ratio;

  return (
    <div
      className={`pointer-events-auto flex flex-col items-center border bg-[#070B18]/90 px-2.5 py-2 ${
        vehHealthPct <= 30 ? 'border-[#FF4545] animate-pulse' : 'border-[#00F5FF]/65'
      }`}
      style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.9), 0 0 18px rgba(0, 245, 255, 0.16)' }}
    >
      {/* Top Vehicle Name + Durability Mini Readout */}
      <div className="mb-1 flex w-full items-center justify-between gap-1.5 text-[9px]">
        <span className="max-w-[78px] truncate font-bold text-[#00F5FF]">
          {vehicleName ?? '载具'}
        </span>
        <span
          className={`font-mono-tabular font-bold ${
            vehHealthPct <= 30 ? 'text-[#FF4545]' : 'text-[#FFD166]'
          }`}
        >
          {vehHealthPct}%
        </span>
      </div>

      {/* Glowing SVG Speedometer Ring */}
      <div className="relative flex h-[86px] w-[86px] items-center justify-center">
        <svg width="86" height="86" viewBox="0 0 86 86" className="-rotate-[225deg]">
          <circle
            cx="43"
            cy="43"
            r={radius}
            fill="none"
            stroke="#13203E"
            strokeWidth="7"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="butt"
          />
          <circle
            cx="43"
            cy="43"
            r={radius}
            fill="none"
            stroke={isBoosting ? '#FFD166' : '#00F5FF'}
            strokeWidth="7"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="butt"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <span
            className={`font-mono-tabular text-xl font-black leading-none ${
              isBoosting ? 'text-[#FFD166]' : 'text-slate-100'
            }`}
          >
            {speedKmh}
          </span>
          <span className="mt-0.5 font-mono-tabular text-[9px] font-bold text-[#38BDF8]">
            km/h
          </span>
        </div>
      </div>

      {/* N2O Nitro Progress Bar */}
      <div className="mt-1 flex w-full items-center gap-1.5 text-[9px]">
        <span
          className={`font-mono-tabular font-extrabold ${
            isBoosting ? 'text-[#FFD166]' : 'text-[#00F5FF]'
          }`}
        >
          N₂O
        </span>
        <div className="h-2 flex-1 bg-[#121B33]">
          <div
            className={`h-full transition-all duration-100 ${
              isBoosting ? 'bg-[#FFD166]' : 'bg-[#00F5FF]'
            }`}
            style={{ width: `${nitro}%` }}
          />
        </div>
      </div>

      {(weaponLabel || isFlying) && (
        <div className="mt-1 w-full truncate border-t border-slate-800/80 pt-1 text-center font-mono-tabular text-[8px] font-bold text-[#FFD166]">
          {weaponLabel ?? '已武装'}
          {isFlying ? ' · 低空飞行' : ''}
        </div>
      )}
    </div>
  );
}

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
  const districtName = useGameStore((s) => s.districtName);
  const districtBanner = useGameStore((s) => s.districtBanner);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const nearbyLandmark = useGameStore((s) => s.nearbyLandmark);
  const nearbyProp = useGameStore((s) => s.nearbyProp);
  const nearbyNpc = useGameStore((s) => s.nearbyNpc);
  const nearbyVehicle = useGameStore((s) => s.nearbyVehicle);
  const sandboxHint = useGameStore((s) => s.sandboxHint);
  const sandboxCombo = useGameStore((s) => s.sandboxCombo);
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
  const terraria = useGameStore((s) => s.terraria);
  const interactionToast = useGameStore((s) => s.interactionToast);
  const weapon = useGameStore((s) => s.weapon);
  const settings = useGameStore((s) => s.settings);
  const muted = useGameStore((s) => s.muted);
  const hudCompact = useGameStore((s) => s.hudCompact);
  const openHubTab = useGameStore((s) => s.openHubTab);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleMap = useGameStore((s) => s.toggleMap);
  const toggleHudCompact = useGameStore((s) => s.toggleHudCompact);

  const [rightCardCollapsed, setRightCardCollapsed] = useState(false);
  const [shortcutsCollapsed, setShortcutsCollapsed] = useState(false);

  const healthPct = Math.max(0, Math.min(100, Math.round((health / maxHealth) * 100)));
  const armorPct =
    maxArmor > 0 ? Math.max(0, Math.min(100, Math.round((armor / maxArmor) * 100))) : 0;
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
  const worldBoss = terraria.activeBoss;
  const worldBossHpPct =
    worldBoss && worldBoss.maxHp > 0
      ? Math.max(0, Math.min(100, Math.round((worldBoss.hp / worldBoss.maxHp) * 100)))
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

  const activeCombo =
    playMode === 'horde' ? horde.combo : playMode === 'sandbox' ? sandboxCombo : 0;

  // Live "城市快讯" Ticker Message
  const cityNewsText = interactionToast
    ? interactionToast
    : wantedLevel > 0
      ? `NCPD：全城进入 ${wantedLevel} 星警戒状态，请市民注意交通安全与执法巡逻。`
      : nearestEvent
        ? `紧急快讯：${nearestEvent.ev.district}出现「${nearestEvent.ev.title}」，${nearestEvent.ev.description}`
        : `${districtName} · ${environment.timeLabel} ${environment.clockText} · 天气：${environment.weatherLabel}（${environment.weatherEffectHint}）`;

  const isRadioActivelyPlaying = Boolean(radioStation.playing) && !muted && settings.musicVolume > 0;

  const vehicleWeaponLabel =
    vehicleWeaponKind === 'tank_cannon'
      ? '120mm 主炮'
      : vehicleWeaponKind === 'autocannon'
        ? '双联机炮'
        : vehicleWeaponKind
          ? weapon.shortName
          : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2 sm:p-3">
      <FarTargetPixelPointer />

      {/* Slanted Floating Combat Combo Callout */}
      {activeCombo >= 2 && (
        <div
          className="pointer-events-none fixed top-[36%] left-3 z-10 -skew-x-12 border-l-4 border-[#FFD166] bg-[#070B18]/86 px-3 py-1 sm:left-6"
          style={{ boxShadow: '0 0 18px rgba(255, 209, 102, 0.28)' }}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black tracking-wider text-[#FFD166] sm:text-xl">
              连击
            </span>
            <span
              className="font-mono-tabular text-xl font-black text-[#FB923C] sm:text-2xl"
              style={{ textShadow: '0 0 10px rgba(251, 146, 60, 0.7)' }}
            >
              ×{activeCombo}
            </span>
          </div>
        </div>
      )}

      {/* TOP PERIMETER ROW */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* TOP-LEFT: Hero Avatar + Level/EXP + HP/Armor/Cash + Stacked 3-Card Mission List */}
        <div className="flex w-[228px] flex-col gap-1.5 sm:w-[272px]">
          <div
            className={`border bg-[#070B18]/90 p-2 transition-colors ${
              wantedLevel > 0 ? 'border-[#FF2E88]/90' : 'border-[#00F5FF]/60'
            }`}
            style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.9), 0 0 18px rgba(0, 245, 255, 0.14)' }}
          >
            <div className="flex items-start gap-2.5">
              {/* Framed Hero Avatar + Level Pill-less Tag */}
              <div className="flex shrink-0 flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => openHubTab('character')}
                  title="查看角色属性与技能树 (C)"
                  className="pointer-events-auto relative shrink-0 cursor-pointer border-2 border-[#00F5FF] bg-[#0B1324] transition-transform hover:scale-[1.03]"
                >
                  <HeroAvatarImg className="h-11 w-11 sm:h-12 sm:w-12" />
                </button>
                <span className="font-mono-tabular text-[9px] font-bold tracking-wider text-[#FFD166]">
                  Lv.{progression.level}
                </span>
              </div>

              {/* Right Column: EXP + HP + Armor + Cash */}
              <div className="min-w-0 flex-1">
                {/* HP Row */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-bold text-[#FF4545]">
                    <Heart className="h-2.5 w-2.5 fill-current" />
                    HP
                  </span>
                  <span className="font-mono-tabular font-bold text-slate-100">
                    {health}/{maxHealth}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 w-full bg-[#121B33]">
                  <div
                    className={`h-full transition-all duration-150 ${
                      healthPct <= 30 ? 'animate-pulse bg-[#FF4545]' : 'bg-[#FF2E88]'
                    }`}
                    style={{ width: `${healthPct}%` }}
                  />
                </div>

                {/* Armor Row */}
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-bold text-[#38BDF8]">
                    <Shield className="h-2.5 w-2.5" />
                    护甲
                  </span>
                  <span className="font-mono-tabular font-bold text-[#38BDF8]">
                    {armor}/{maxArmor}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 w-full bg-[#121B33]">
                  <div
                    className="h-full bg-[#00F5FF] transition-all duration-150"
                    style={{ width: `${armorPct}%` }}
                  />
                </div>

                {/* Cash + EXP Row */}
                <div className="mt-1 flex items-center justify-between gap-1.5">
                  <span className="font-mono-tabular text-xs font-extrabold leading-none text-[#BEF264] sm:text-sm">
                    $ {cash.toLocaleString()}
                  </span>
                  <span className="font-mono-tabular text-[8px] font-bold text-[#FB923C]">
                    EXP {progression.exp}/{progression.nextLevelExp}
                  </span>
                </div>
                <div className="mt-0.5 h-1 w-full bg-[#121B33]">
                  <div
                    className="h-full bg-[#F59E0B] transition-all duration-150"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Hub Action Bar */}
            <div className="mt-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => openHubTab('character')}
                title="角色技能与义体 (C)"
                className={`pointer-events-auto flex flex-1 cursor-pointer items-center justify-center gap-1 border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  progression.skillPoints > 0
                    ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]'
                    : 'border-[#00F5FF]/45 bg-[#0D1424]/85 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
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

              <button
                type="button"
                onClick={() => openHubTab('missions')}
                title="任务日志与委托面板 (L)"
                className="pointer-events-auto flex flex-1 cursor-pointer items-center justify-center gap-1 border border-[#C000FF]/55 bg-[#0D1424]/85 px-1.5 py-0.5 text-[10px] font-bold text-[#E879F9] transition-colors hover:bg-[#C000FF] hover:text-white"
              >
                <ScrollText className="h-3 w-3" />
                <span>[L]</span>
              </button>

              {playMode === 'sandbox' && (
                <button
                  type="button"
                  onClick={() => openHubTab('craft')}
                  title="打开赛博造物台 · 采矿/建造/世界Boss (K)"
                  className={`pointer-events-auto flex flex-1 cursor-pointer items-center justify-center gap-1 border px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                    worldBoss
                      ? 'border-[#FF2E88] bg-[#FF2E88]/20 text-[#FF2E88] hover:bg-[#FF2E88] hover:text-[#080D18]'
                      : 'border-[#4ADE80]/55 bg-[#0D1424]/85 text-[#4ADE80] hover:bg-[#4ADE80] hover:text-[#080D18]'
                  }`}
                >
                  <Hammer className="h-3 w-3" />
                  <span>[K]</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => openHubTab('vehicles')}
                title="打开车库与载具空投"
                className="pointer-events-auto flex flex-1 cursor-pointer items-center justify-center gap-1 border border-[#38BDF8]/55 bg-[#0D1424]/85 px-1.5 py-0.5 text-[10px] font-bold text-[#38BDF8] transition-colors hover:bg-[#38BDF8] hover:text-[#080D18]"
              >
                <span>车库</span>
              </button>
            </div>

            {/* Sandbox Jammer & Terraria Active Buffs */}
            {playMode === 'sandbox' &&
              ((wantedLevel > 0 && progression.jammerUnlocked && wantedLevel <= 3) ||
                (!hudCompact &&
                  (terraria.ironskinBuffSec > 0 ||
                    terraria.miningBuffSec > 0 ||
                    terraria.equippedAccessories.length > 0))) && (
                <div className="mt-1.5 border-t border-slate-800/80 pt-1">
                  {wantedLevel > 0 && progression.jammerUnlocked && wantedLevel <= 3 && (
                    <button
                      type="button"
                      onClick={() => gameEvents.emit(GAME_EVENT.TRIGGER_HACK_JAM)}
                      className={`pointer-events-auto flex w-full cursor-pointer items-center justify-between border px-1.5 py-0.5 text-[9px] font-bold transition-colors ${
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

                  {!hudCompact &&
                    (terraria.ironskinBuffSec > 0 ||
                      terraria.miningBuffSec > 0 ||
                      terraria.equippedAccessories.length > 0) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px]">
                        {terraria.ironskinBuffSec > 0 && (
                          <span className="border border-[#38BDF8]/65 bg-[#38BDF8]/15 px-1 font-mono-tabular font-bold text-[#38BDF8]">
                            铁皮 {terraria.ironskinBuffSec}s
                          </span>
                        )}
                        {terraria.miningBuffSec > 0 && (
                          <span className="border border-[#FFD166]/65 bg-[#FFD166]/15 px-1 font-mono-tabular font-bold text-[#FFD166]">
                            探矿 {terraria.miningBuffSec}s
                          </span>
                        )}
                        {terraria.equippedAccessories.length > 0 && (
                          <span className="border border-[#4ADE80]/55 bg-[#4ADE80]/10 px-1 font-mono-tabular font-bold text-[#4ADE80]">
                            饰品 {terraria.equippedAccessories.length}/3
                          </span>
                        )}
                      </div>
                    )}
                </div>
              )}
          </div>

          {/* Left-Docked 3-Card Mission Tracker (Desktop) + Compact Strip (Mobile) */}
          <div className="hidden sm:block">
            <MissionTracker compact={hudCompact} />
          </div>
          <div className="block sm:hidden">
            <MissionTracker compact={true} />
          </div>
        </div>

        {/* TOP-CENTER: Weather/Time Pill-less Bar + District Banner + Boss HP + Race Countdown */}
        <div className="hidden flex-1 flex-col items-center gap-1 pt-0.5 sm:flex">
          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.CYCLE_WEATHER)}
            title={`${environment.weatherEffectHint}（点击或按 [T] 切换动态天气）`}
            className="pointer-events-auto flex cursor-pointer items-center gap-1.5 border border-[#00F5FF]/40 bg-[#070B18]/86 px-2.5 py-0.5 text-[10px] transition-colors hover:border-[#00F5FF]"
          >
            <CloudRain className="h-3 w-3 text-[#00F5FF]" />
            <span className="font-mono-tabular font-bold text-slate-100">
              {environment.clockText}
            </span>
            <span className="text-[#FFD166]">{environment.timeLabel}</span>
            <span className="text-slate-600">·</span>
            <span className="font-bold text-[#00F5FF]">{environment.weatherLabel}</span>
            <span className="text-slate-400">[T]</span>
          </button>

          {districtBanner && (
            <div className="border-y border-[#00F5FF]/85 bg-[#070B18]/88 px-5 py-0.5 text-center">
              <span className="text-[10px] font-bold tracking-widest text-[#00F5FF]">
                进入区域 ·{' '}
              </span>
              <span className="text-xs font-bold tracking-widest text-[#FFD166]">
                {districtBanner}
              </span>
            </div>
          )}

          {playMode === 'horde' && horde.active && horde.bossName && (
            <div className="w-full max-w-xs border border-[#FFD166] bg-[#070B18]/92 px-3 py-1.5 text-center">
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

          {playMode === 'sandbox' && worldBoss && (
            <div
              className="w-full max-w-xs border bg-[#070B18]/92 px-3 py-1.5 text-center"
              style={{ borderColor: worldBoss.colorHex }}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span style={{ color: worldBoss.colorHex }}>
                  世界 BOSS · {worldBoss.name}
                  {worldBoss.phase2 ? ' [二阶段]' : ''}
                </span>
                <span className="font-mono-tabular text-[#FF4545]">
                  {worldBoss.hp}/{worldBoss.maxHp}
                </span>
              </div>
              <div className="mt-1 h-2 w-full bg-[#151C2B]">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${worldBossHpPct}%`,
                    backgroundColor: worldBoss.colorHex,
                  }}
                />
              </div>
            </div>
          )}

          {playMode === 'race' && race.active && race.countdownSec > 0 && (
            <div className="border-2 border-[#FFD166] bg-[#070B18]/92 px-6 py-2 text-center">
              <div className="text-[10px] font-bold tracking-widest text-[#00F5FF]">准备发车</div>
              <div className="font-mono-tabular text-3xl font-bold text-[#FFD166]">
                {race.countdownSec}
              </div>
            </div>
          )}
        </div>

        {/* TOP-RIGHT: MiniMap (with District Header + N) -> 5★ Wanted Stars -> Keybind Legend / Horde */}
        <div className="flex w-[144px] flex-col items-end gap-1.5 sm:w-[186px]">
          {!hudCompact && (
            <>
              <div className="hidden sm:block">
                <MiniMap width={176} height={114} onClick={toggleMap} />
              </div>
              <div className="block sm:hidden">
                <MiniMap width={128} height={82} onClick={toggleMap} />
              </div>
            </>
          )}

          {/* 5★ Wanted Banner directly below MiniMap */}
          {playMode === 'sandbox' && (
            <div
              className={`w-full border bg-[#070B18]/90 px-2 py-1 transition-colors ${
                wantedLevel > 0 ? 'border-[#FF2E88]' : 'border-[#00F5FF]/45'
              }`}
              style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.9)' }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold text-slate-300 sm:text-[10px]">
                  通缉等级
                </span>
                <div className="flex items-center gap-0.5" aria-label={`通缉等级 ${wantedLevel} / 5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      className={star <= wantedLevel && spotted ? 'animate-pulse' : ''}
                      fill={star <= wantedLevel ? (star <= 3 ? '#FF2E88' : '#FFD166') : '#1E293B'}
                      stroke={star <= wantedLevel ? '#FF2E88' : '#475569'}
                      strokeWidth="1.8"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="mt-0.5 flex items-center justify-between text-[9px]">
                <span className="font-mono-tabular text-slate-400">
                  {playerX},{playerY}
                </span>
                <span
                  className={`font-mono-tabular font-bold ${
                    wantedLevel > 0
                      ? spotted
                        ? 'text-[#FF4545]'
                        : 'text-[#00F5FF]'
                      : 'text-[#C000FF]'
                  }`}
                >
                  {wantedLevel > 0
                    ? spotted
                      ? '锁定中'
                      : `甩脱 ${escapeProgress}%`
                    : `芯片 ${exploration.chipsCollected}/${exploration.totalChips}`}
                </span>
              </div>

              {wantedLevel > 0 && !spotted && (
                <div className="mt-1 h-1 w-full bg-[#151C2B]">
                  <div
                    className="h-full bg-[#00F5FF] transition-all duration-150"
                    style={{ width: `${escapeProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Collapsible Keybind Legend Card (Desktop, matches reference Right Side Key Guide) */}
          {!hudCompact && playMode !== 'horde' && (
            <div
              className="hidden w-full border border-[#00F5FF]/40 bg-[#070B18]/86 px-2 py-1.5 md:block"
              style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.85)' }}
            >
              <button
                type="button"
                onClick={() => setShortcutsCollapsed((v) => !v)}
                className="pointer-events-auto flex w-full cursor-pointer items-center justify-between text-[10px] font-bold text-[#38BDF8] hover:text-[#00F5FF]"
              >
                <span>快捷操作指南</span>
                {shortcutsCollapsed ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronUp className="h-3 w-3" />
                )}
              </button>

              {!shortcutsCollapsed && (
                <div className="mt-1.5 flex flex-col gap-1 border-t border-slate-800/80 pt-1.5">
                  {SHORTCUT_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-[10px]">
                      <kbd className="min-w-[34px] border border-slate-600/90 bg-[#0E1730] px-1 py-0.5 text-center font-mono-tabular text-[9px] font-bold leading-none text-slate-100">
                        {item.key}
                      </kbd>
                      <span className="text-slate-300">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Horde Mode Telemetry */}
          {playMode === 'horde' && !hudCompact && (
            <div
              className="w-full border border-[#FF2E88]/65 bg-[#070B18]/90 px-2.5 py-1.5"
              style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.88)' }}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-[#FF2E88]" />
                  <span className="text-[11px] font-bold text-[#FF2E88]">第 {horde.wave} 波</span>
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
                    onClick={() => openHubTab('armory')}
                    className="pointer-events-auto mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1 border border-[#00F5FF]/65 bg-[#00F5FF]/12 px-2 py-1 text-[10px] font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18]"
                  >
                    <Crosshair className="h-3 w-3" />
                    <span>
                      [B] 军械 / 机甲 ({mech?.turretCount ?? 0}/{mech?.maxTurrets ?? 2}塔)
                    </span>
                  </button>
                </>
              )}
            </div>
          )}

          {playMode === 'horde' && hudCompact && (
            <div className="border border-[#FF2E88]/65 bg-[#070B18]/88 px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-[#FF2E88]">
              W{horde.wave} · 剩{horde.enemiesRemaining}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PERIMETER ROW: Bottom-Left City News & Radio Deck | Bottom-Center Prompts & 1-7 Hotbar | Bottom-Right Speedometer & Vertical Tool Dock */}
      <div className="flex items-end justify-between gap-2 pb-20 md:pb-0">
        {/* BOTTOM-LEFT: 城市快讯 + 赛博电台 Player Deck (Matches reference Bottom-Left) */}
        {!hudCompact ? (
          <div className="hidden w-[250px] shrink-0 flex-col gap-1.5 sm:flex lg:w-[276px]">
            {/* 城市快讯 Marquee Card */}
            <div
              className="border border-[#38BDF8]/60 bg-[#070B18]/88 px-2.5 py-1.5"
              style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.88)' }}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-[#38BDF8]">
                <Zap className="h-3 w-3 text-[#00F5FF]" />
                <span>城市快讯</span>
              </div>
              <div className="mt-0.5 w-full overflow-hidden whitespace-nowrap text-[10px] text-slate-200">
                <div className="animate-cyber-marquee">
                  <span className="pr-8">{cityNewsText}</span>
                  <span className="pr-8" aria-hidden="true">
                    {cityNewsText}
                  </span>
                </div>
              </div>
            </div>

            {/* 赛博电台 Audio Deck with Animated Waveform, Transport & Volume Slider */}
            <div
              className="pointer-events-auto flex items-center gap-2 border border-[#C000FF]/70 bg-[#070B18]/92 px-2 py-1.5"
              style={{
                boxShadow: '0 4px 0 rgba(3, 6, 12, 0.9), 0 0 16px rgba(192, 0, 255, 0.16)',
              }}
            >
              {/* Animated Equalizer Visualizer */}
              <div className="flex h-10 w-10 shrink-0 items-end justify-center gap-[2px] border border-[#C000FF]/55 bg-[#110822] px-1 py-1.5">
                {EQUALIZER_BARS.map((bar, idx) => (
                  <span
                    key={idx}
                    className={`w-[3px] bg-gradient-to-t from-[#C000FF] via-[#FF2E88] to-[#00F5FF] ${
                      isRadioActivelyPlaying ? 'animate-eq-bar' : 'opacity-45'
                    }`}
                    style={{
                      height: isRadioActivelyPlaying ? `${bar.base}%` : '28%',
                      animationDelay: bar.delay,
                    }}
                  />
                ))}
              </div>

              {/* Station Title + Prev / Play-Pause / Next */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 truncate text-[10px] font-bold text-[#E879F9]">
                  <Radio className="h-2.5 w-2.5 shrink-0 text-[#00F5FF]" />
                  <span className="truncate">赛博电台：{radioStation.name}</span>
                </div>

                <div className="mt-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => gameEvents.emit(GAME_EVENT.RADIO_CONTROL, 'prev')}
                    title="上一频道"
                    aria-label="上一频道"
                    className="flex h-6 flex-1 cursor-pointer items-center justify-center border border-slate-700 bg-[#0D1426] text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
                  >
                    <SkipBack className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => gameEvents.emit(GAME_EVENT.RADIO_CONTROL, 'toggle')}
                    title={radioStation.playing ? '暂停电台 (R 切台)' : '播放赛博电台'}
                    aria-label={radioStation.playing ? '暂停电台' : '播放电台'}
                    className={`flex h-6 flex-1 cursor-pointer items-center justify-center border transition-colors ${
                      isRadioActivelyPlaying
                        ? 'border-[#FF2E88] bg-[#FF2E88]/20 text-[#FF2E88] hover:bg-[#FF2E88] hover:text-white'
                        : 'border-[#00F5FF]/65 bg-[#00F5FF]/15 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                    }`}
                  >
                    {radioStation.playing ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => gameEvents.emit(GAME_EVENT.RADIO_CONTROL, 'next')}
                    title="下一频道 (R)"
                    aria-label="下一频道"
                    className="flex h-6 flex-1 cursor-pointer items-center justify-center border border-slate-700 bg-[#0D1426] text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF]"
                  >
                    <SkipForward className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Compact Music Volume Slider */}
              <div className="flex w-10 shrink-0 flex-col items-center gap-0.5">
                <span className="font-mono-tabular text-[8px] font-bold text-[#00F5FF]">
                  {settings.musicVolume}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.musicVolume}
                  onChange={(e) =>
                    updateSettings({ musicVolume: Number(e.target.value) })
                  }
                  aria-label="电台音量"
                  title="电台音乐音量"
                  className="h-1.5 w-10 cursor-pointer accent-[#00F5FF]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden w-4 sm:block" />
        )}

        {/* BOTTOM-CENTER: Context Interaction Prompts + 1-7 Weapon Quick Hotbar */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          {playMode === 'sandbox' && worldBoss && (
            <div
              className="w-full max-w-[260px] border bg-[#070B18]/88 px-3 py-1 text-center sm:hidden"
              style={{ borderColor: worldBoss.colorHex }}
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span style={{ color: worldBoss.colorHex }}>
                  {worldBoss.name}
                  {worldBoss.phase2 ? ' · P2' : ''}
                </span>
                <span className="font-mono-tabular text-[#FF4545]">
                  {worldBoss.hp}/{worldBoss.maxHp}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full bg-[#151C2B]">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${worldBossHpPct}%`,
                    backgroundColor: worldBoss.colorHex,
                  }}
                />
              </div>
            </div>
          )}

          {districtBanner && (
            <div className="border-y border-[#00F5FF]/85 bg-[#070B18]/85 px-4 py-0.5 text-center sm:hidden">
              <span className="text-[10px] font-bold text-[#00F5FF]">进入 · </span>
              <span className="text-xs font-bold text-[#FFD166]">{districtBanner}</span>
            </div>
          )}

          {playMode === 'race' && race.active && race.countdownSec > 0 && (
            <div className="border-2 border-[#FFD166] bg-[#070B18]/90 px-5 py-1.5 text-center sm:hidden">
              <span className="font-mono-tabular text-xl font-bold text-[#FFD166]">
                发车倒计时 {race.countdownSec}
              </span>
            </div>
          )}

          {interactionToast && (
            <div className="max-w-xs border border-[#00F5FF]/75 bg-[#070B18]/90 px-3 py-1 text-center text-[11px] leading-snug text-slate-100 sm:hidden">
              {interactionToast}
            </div>
          )}

          {!inVehicle && nearbyVehicle && (
            <div className="border border-[#00F5FF]/80 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#00F5FF]">按 F</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>驾驶 {nearbyVehicle.name}</span>
            </div>
          )}

          {!inVehicle && isAtServiceTerminal && nearbyLandmark && (
            <div className="border border-[#FFD166]/80 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#FFD166]">按 E</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>进入 {nearbyLandmark.name}</span>
            </div>
          )}

          {!inVehicle && !isAtServiceTerminal && sandboxHint && (
            <div
              className="border bg-[#070B18]/90 px-3 py-1 text-xs text-slate-100"
              style={{ borderColor: sandboxHint.accentHex }}
            >
              <span
                className="font-mono-tabular font-bold"
                style={{ color: sandboxHint.accentHex }}
              >
                按 E
              </span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>
                {sandboxHint.name} — {sandboxHint.actionLabel}
              </span>
            </div>
          )}

          {!inVehicle && !isAtServiceTerminal && !sandboxHint && nearbyProp && (
            <div className="border border-[#00F5FF]/80 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#00F5FF]">按 E</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>
                {nearbyProp.title} — {nearbyProp.actionLabel}
              </span>
            </div>
          )}

          {!inVehicle && !isAtServiceTerminal && !sandboxHint && !nearbyProp && nearbyNpc && (
            <div className="border border-[#FF2E88]/80 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#FF2E88]">按 E</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>与 {nearbyNpc.name}（{nearbyNpc.role}）对话</span>
            </div>
          )}

          {!inVehicle && !isAtServiceTerminal && !sandboxHint && !nearbyProp && !nearbyNpc && nearbyLandmark && (
            <div className="border border-[#FFD166]/75 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#FFD166]">按 E</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>查看 {nearbyLandmark.name}</span>
            </div>
          )}

          {inVehicle && nearbyLandmark && (
            <div className="border border-[#00F5FF]/80 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#00F5FF]">按 E</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>进入 {nearbyLandmark.name}（维修与改装）</span>
            </div>
          )}

          {inVehicle && !nearbyLandmark && isPoliceVehicle && playMode === 'sandbox' && (
            <div className="border border-[#38BDF8]/80 bg-[#070B18]/88 px-3 py-1 text-xs text-slate-100">
              <span className="font-mono-tabular font-bold text-[#38BDF8]">按 E</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span>开启【治安追缉】警用悬赏行动</span>
            </div>
          )}

          {/* 1-7 Weapon Quick Hotbar */}
          {!inVehicle && !mech?.active && (
            <div
              className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto border border-[#00F5FF]/55 bg-[#070B18]/92 p-1"
              style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.9), 0 0 16px rgba(0, 245, 255, 0.14)' }}
            >
              {WEAPON_ORDER.map((wId, idx) => {
                const spec = WEAPON_SPECS[wId];
                const isOwned = weapon.ownedIds.includes(wId);
                const isActive = weapon.equippedId === wId;
                const slotAmmo = weapon.ammoByWeapon?.[wId] ?? 0;

                return (
                  <button
                    key={wId}
                    type="button"
                    onClick={() => {
                      if (isOwned) {
                        gameEvents.emit(GAME_EVENT.SWITCH_WEAPON, idx);
                      } else {
                        openHubTab('armory');
                      }
                    }}
                    title={
                      isOwned
                        ? `[${idx + 1}] ${spec.name}`
                        : `${spec.name}（点击前往军械库解锁）`
                    }
                    className={`relative flex h-12 w-11 shrink-0 cursor-pointer flex-col items-center justify-between border px-1 py-0.5 transition-colors sm:h-13 sm:w-13 ${
                      isActive
                        ? 'border-[#FFD166] bg-[#162244]'
                        : isOwned
                          ? 'border-slate-700/90 bg-[#0B1224]/90 hover:border-[#00F5FF]/70'
                          : 'border-slate-800/70 bg-[#070B14]/85 opacity-55 hover:opacity-85'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between font-mono-tabular text-[8px] leading-none">
                      <span className={isActive ? 'font-bold text-[#FFD166]' : 'text-slate-400'}>
                        {idx + 1}
                      </span>
                      {isActive && horde.overdriveSec > 0 && (
                        <span className="text-[#FFD166]">OD</span>
                      )}
                    </div>

                    <WeaponPixelArt weaponId={wId} owned={isOwned} className="h-5 w-9" />

                    <div className="w-full truncate text-center font-mono-tabular text-[8px] font-bold leading-none">
                      {isOwned ? (
                        <span style={{ color: isActive ? '#FFD166' : spec.colorHex }}>
                          {spec.infiniteAmmo ? '∞' : slotAmmo}
                        </span>
                      ) : (
                        <span className="text-slate-500">未解锁</span>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Adjacent Armory & Medkit Quick Button */}
              <button
                type="button"
                onClick={() => openHubTab('armory')}
                title="打开随身军械库与弹药/护甲补给 (B)"
                className="flex h-12 w-11 shrink-0 cursor-pointer flex-col items-center justify-between border border-[#FF2E88]/65 bg-[#150E26]/90 px-1 py-0.5 text-[#FF2E88] transition-colors hover:bg-[#FF2E88] hover:text-white sm:h-13 sm:w-13"
              >
                <span className="w-full text-left font-mono-tabular text-[8px] font-bold leading-none">
                  [B]
                </span>
                <MedkitPixelIcon className="h-5 w-7" />
                <span className="text-[8px] font-bold leading-none">军械补给</span>
              </button>
            </div>
          )}

          {inVehicle && (
            <div className="hidden border border-slate-700/60 bg-[#070B18]/82 px-2.5 py-0.5 font-mono-tabular text-[10px] text-slate-300/90 md:block">
              WASD 驾驶 · 左键/J 开火 · Shift 氮气 · 空格 手刹漂移 · R 电台 ·{' '}
              {isPoliceVehicle && playMode === 'sandbox' ? 'E 治安追缉 · ' : ''}F 下车
            </div>
          )}
        </div>

        {/* BOTTOM-RIGHT: Glowing Circular Speedometer (when driving) + Slim Vertical Utility Dock */}
        <div className="flex shrink-0 items-end gap-1.5">
          {inVehicle && (
            <CircularSpeedometer
              speedKmh={vehicleSpeedKmh}
              nitro={vehicleNitro}
              isBoosting={vehicleBoosting}
              vehicleName={vehicleName}
              vehHealthPct={vehHealthPct}
              weaponLabel={vehicleWeaponLabel}
              isFlying={vehicleFlying}
            />
          )}

          {/* Slim Vertical Utility Dock (Matches Reference Far-Right Icon Column) */}
          <div
            className="pointer-events-auto flex flex-col gap-1 border border-[#00F5FF]/45 bg-[#070B18]/90 p-1"
            style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.9)' }}
          >
            <button
              type="button"
              onClick={toggleHudCompact}
              title={hudCompact ? '展开 HUD 面板 (V)' : '精简视野 HUD (V)'}
              aria-label={hudCompact ? '展开 HUD 面板' : '精简视野 HUD'}
              className={`flex h-7 w-7 cursor-pointer items-center justify-center border transition-colors sm:h-8 sm:w-8 ${
                hudCompact
                  ? 'border-[#FFD166] bg-[#FFD166]/15 text-[#FFD166]'
                  : 'border-slate-700/80 bg-[#0B1224] text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF]'
              }`}
            >
              {hudCompact ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleMap}
              title="打开战术全图 (M)"
              aria-label="打开区域地图"
              className="flex h-7 w-7 cursor-pointer items-center justify-center border border-slate-700/80 bg-[#0B1224] text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] sm:h-8 sm:w-8"
            >
              <Map className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => openHubTab('vehicles')}
              title="车库与载具空投"
              aria-label="打开车库"
              className="flex h-7 w-7 cursor-pointer items-center justify-center border border-slate-700/80 bg-[#0B1224] text-[#38BDF8] transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] sm:h-8 sm:w-8"
            >
              <Car className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              title={muted ? '开启音效' : '静音'}
              aria-label={muted ? '开启音效' : '静音'}
              className="flex h-7 w-7 cursor-pointer items-center justify-center border border-slate-700/80 bg-[#0B1224] text-slate-200 transition-colors hover:border-[#00F5FF] hover:text-[#00F5FF] sm:h-8 sm:w-8"
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
              className="flex h-7 w-7 cursor-pointer items-center justify-center border border-slate-700/80 bg-[#0B1224] text-slate-200 transition-colors hover:border-[#FF2E88] hover:text-[#FF2E88] sm:h-8 sm:w-8"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
