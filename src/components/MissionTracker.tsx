import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Flag,
  MapPin,
  Navigation,
  Siren,
  Target,
  XCircle,
} from 'lucide-react';
import { MISSION_DEFINITIONS } from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

export const FAR_TARGET_THRESHOLD_PX = 560; // 70m (~outside immediate viewport)

function formatMeters(distPx: number): string {
  const meters = Math.max(0, Math.round(distPx / 8));
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }
  return `${meters}m`;
}

function getCardinalDirection(dx: number, dy: number): string {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const norm = ((deg % 360) + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return '正东';
  if (norm < 67.5) return '东南';
  if (norm < 112.5) return '正南';
  if (norm < 157.5) return '西南';
  if (norm < 202.5) return '正西';
  if (norm < 247.5) return '西北';
  if (norm < 292.5) return '正北';
  return '东北';
}

interface PixelNavPointerProps {
  angleDeg: number;
  color: string;
  size?: number;
  bob?: boolean;
}

/**
 * Crisp 12x12 stepped pixel-art directional arrow SVG rotated toward target angle.
 */
export function PixelNavPointer({
  angleDeg,
  color,
  size = 16,
  bob = false,
}: PixelNavPointerProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${
        bob ? 'animate-pixel-bob' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 12 12"
        shapeRendering="crispEdges"
        style={{ transform: `rotate(${angleDeg}deg)` }}
        aria-hidden="true"
      >
        {/* Pixel border silhouette */}
        <rect x="5" y="0" width="2" height="1" fill="#080D18" />
        <rect x="4" y="1" width="1" height="1" fill="#080D18" />
        <rect x="7" y="1" width="1" height="1" fill="#080D18" />
        <rect x="3" y="2" width="1" height="1" fill="#080D18" />
        <rect x="8" y="2" width="1" height="1" fill="#080D18" />
        <rect x="2" y="3" width="1" height="1" fill="#080D18" />
        <rect x="9" y="3" width="1" height="1" fill="#080D18" />
        <rect x="1" y="4" width="1" height="1" fill="#080D18" />
        <rect x="10" y="4" width="1" height="1" fill="#080D18" />
        <rect x="0" y="5" width="1" height="2" fill="#080D18" />
        <rect x="11" y="5" width="1" height="2" fill="#080D18" />
        <rect x="1" y="6" width="3" height="1" fill="#080D18" />
        <rect x="8" y="6" width="3" height="1" fill="#080D18" />
        <rect x="3" y="7" width="1" height="4" fill="#080D18" />
        <rect x="8" y="7" width="1" height="4" fill="#080D18" />
        <rect x="5" y="10" width="2" height="1" fill="#080D18" />
        <rect x="3" y="11" width="2" height="1" fill="#080D18" />
        <rect x="7" y="11" width="2" height="1" fill="#080D18" />

        {/* Colored pixel body */}
        <rect x="5" y="1" width="2" height="1" fill={color} />
        <rect x="4" y="2" width="4" height="1" fill={color} />
        <rect x="3" y="3" width="6" height="1" fill={color} />
        <rect x="2" y="4" width="8" height="1" fill={color} />
        <rect x="1" y="5" width="10" height="1" fill={color} />
        <rect x="4" y="6" width="4" height="4" fill={color} />
        <rect x="4" y="10" width="1" height="1" fill={color} />
        <rect x="7" y="10" width="1" height="1" fill={color} />

        {/* Crisp inner specular pixel highlight */}
        <rect x="5" y="2" width="1" height="1" fill="#FFFFFF" />
        <rect x="4" y="3" width="2" height="1" fill="#FFFFFF" />
        <rect x="3" y="4" width="2" height="1" fill="#FFFFFF" />
        <rect x="5" y="6" width="1" height="3" fill="#FFFFFF" />
      </svg>
    </span>
  );
}

interface ScrollingTickerProps {
  text: string;
  accentColor: string;
  prefix?: string;
}

function ScrollingTicker({ text, accentColor, prefix = '▸' }: ScrollingTickerProps) {
  const segment = `${prefix} ${text}`;
  return (
    <div
      className="mt-1 w-full overflow-hidden whitespace-nowrap border-y border-slate-800/90 bg-[#050912]/90 py-0.5 text-[10px]"
      style={{ borderColor: `${accentColor}40` }}
    >
      <div className="animate-cyber-marquee">
        <span className="pr-6 font-medium text-slate-100">{segment}</span>
        <span className="pr-6 font-medium text-slate-100" aria-hidden="true">
          {segment}
        </span>
      </div>
    </div>
  );
}

/**
 * Floating HUD-perimeter pixel navigation pointer displayed when the active tracked
 * objective is far outside immediate camera view.
 */
export function FarTargetPixelPointer() {
  const playMode = useGameStore((s) => s.playMode);
  const activeMission = useGameStore((s) => s.activeMission);
  const policeMarkers = useGameStore((s) => s.policeMarkers);
  const race = useGameStore((s) => s.race);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const customWaypoint = useGameStore((s) => s.customWaypoint);
  const showMap = useGameStore((s) => s.showMap);
  const serviceModal = useGameStore((s) => s.serviceModal);
  const showCharacterModal = useGameStore((s) => s.showCharacterModal);
  const showCraftModal = useGameStore((s) => s.showCraftModal);
  const activeHubTab = useGameStore((s) => s.activeHubTab);
  const hordePerkOffer = useGameStore((s) => s.hordePerkOffer);

  if (
    showMap ||
    serviceModal ||
    showCharacterModal ||
    showCraftModal ||
    activeHubTab !== null ||
    hordePerkOffer
  ) {
    return null;
  }

  let target: { x: number; y: number; color: string; tag: string } | null = null;

  if (playMode === 'race' && race.active && race.targetPos) {
    target = {
      x: race.targetPos.x,
      y: race.targetPos.y,
      color: '#FFD166',
      tag: `CP${race.checkpointIndex + 1}`,
    };
  } else if (playMode === 'sandbox') {
    if (activeMission?.objectiveType === 'reach' && activeMission.targetPos) {
      target = {
        x: activeMission.targetPos.x,
        y: activeMission.targetPos.y,
        color: '#FFD166',
        tag: activeMission.targetLabel ?? '任务目标',
      };
    } else {
      const vigilanteTarget = policeMarkers.find((pm) => pm.id === 'vigilante-target');
      if (vigilanteTarget) {
        target = {
          x: vigilanteTarget.x,
          y: vigilanteTarget.y,
          color: '#FF4545',
          tag: '追缉目标',
        };
      } else if (customWaypoint) {
        target = {
          x: customWaypoint.x,
          y: customWaypoint.y,
          color: '#38BDF8',
          tag: '航标',
        };
      }
    }
  }

  if (!target) return null;

  const dx = target.x - playerX;
  const dy = target.y - playerY;
  const distPx = Math.hypot(dx, dy);
  if (distPx <= FAR_TARGET_THRESHOLD_PX) return null;

  const rad = Math.atan2(dy, dx);
  const angleDeg = (rad * 180) / Math.PI + 90;
  // Position on a safe viewport perimeter ellipse clear of HUD corners and joysticks
  const leftPct = 50 + Math.cos(rad) * 35;
  const topPct = 50 + Math.sin(rad) * 31;

  return (
    <div
      className="pointer-events-none fixed z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      <div
        className="flex h-7 w-7 items-center justify-center border-2 bg-[#080D18]/90"
        style={{ borderColor: target.color }}
      >
        <PixelNavPointer angleDeg={angleDeg} color={target.color} size={18} bob />
      </div>
      <div
        className="flex items-center gap-1 border bg-[#080D18]/92 px-1.5 py-0.5 font-mono-tabular text-[9px] font-bold leading-none whitespace-nowrap"
        style={{ borderColor: target.color, color: target.color }}
      >
        <span className="max-w-[68px] truncate text-slate-100">{target.tag}</span>
        <span>{formatMeters(distPx)}</span>
      </div>
    </div>
  );
}

interface MissionTrackerProps {
  compact: boolean;
}

export function MissionTracker({ compact }: MissionTrackerProps) {
  const playMode = useGameStore((s) => s.playMode);
  const activeMission = useGameStore((s) => s.activeMission);
  const completedMissionIds = useGameStore((s) => s.completedMissionIds);
  const policeMarkers = useGameStore((s) => s.policeMarkers);
  const randomEvents = useGameStore((s) => s.randomEvents);
  const race = useGameStore((s) => s.race);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const spotted = useGameStore((s) => s.spotted);
  const escapeProgress = useGameStore((s) => s.escapeProgress);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const customWaypoint = useGameStore((s) => s.customWaypoint);
  const districtData = useGameStore((s) => s.districtData);
  const toggleMap = useGameStore((s) => s.toggleMap);

  const [collapsed, setCollapsed] = useState(false);

  const wpDx = customWaypoint ? customWaypoint.x - playerX : 0;
  const wpDy = customWaypoint ? customWaypoint.y - playerY : 0;
  const wpDistPx = customWaypoint ? Math.hypot(wpDx, wpDy) : 0;
  const wpAngleDeg = customWaypoint ? (Math.atan2(wpDy, wpDx) * 180) / Math.PI + 90 : 0;
  const wpIsFar = customWaypoint !== null && wpDistPx > FAR_TARGET_THRESHOLD_PX;

  const renderDirectionIcon = (
    angleDeg: number,
    distPx: number,
    color: string,
    compactSize = false
  ) => {
    if (distPx > FAR_TARGET_THRESHOLD_PX) {
      return (
        <PixelNavPointer
          angleDeg={angleDeg}
          color={color}
          size={compactSize ? 13 : 16}
          bob
        />
      );
    }
    return (
      <Navigation
        className={`${compactSize ? 'h-2.5 w-2.5' : 'h-3 w-3'} shrink-0 transition-transform duration-100`}
        style={{ color, transform: `rotate(${angleDeg}deg)` }}
      />
    );
  };

  const renderSlimWaypointStrip = () => {
    if (!customWaypoint) return null;
    return (
      <div className="mt-1 flex w-full items-center justify-between gap-1.5 border border-[#38BDF8]/65 bg-[#080D18]/86 px-2 py-0.5 text-[10px]">
        <button
          type="button"
          onClick={toggleMap}
          className="pointer-events-auto flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left text-[#38BDF8] hover:text-[#00F5FF]"
          title="点击打开全图调整航标"
        >
          {renderDirectionIcon(wpAngleDeg, wpDistPx, '#38BDF8', true)}
          <span className="truncate font-semibold">{customWaypoint.label}</span>
        </button>
        <div className="flex shrink-0 items-center gap-1 font-mono-tabular">
          {wpIsFar && (
            <span className="border border-[#38BDF8]/50 bg-[#38BDF8]/15 px-1 text-[8px] font-bold text-[#38BDF8]">
              远距
            </span>
          )}
          <span className="font-bold text-[#00F5FF]">{formatMeters(wpDistPx)}</span>
          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.SET_CUSTOM_WAYPOINT, null)}
            title="取消自定义航标"
            className="pointer-events-auto cursor-pointer text-slate-400 hover:text-[#FF4545]"
          >
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  // 1. Race mode checkpoint tracker
  if (playMode === 'race') {
    if (!race.active) return null;

    const dx = race.targetPos ? race.targetPos.x - playerX : 0;
    const dy = race.targetPos ? race.targetPos.y - playerY : 0;
    const distPx = race.targetPos ? Math.hypot(dx, dy) : 0;
    const angleDeg = race.targetPos ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : 0;
    const isFar = race.targetPos !== null && distPx > FAR_TARGET_THRESHOLD_PX;

    if (compact) {
      return (
        <div className="flex items-center gap-1.5 border border-[#FFD166]/70 bg-[#080D18]/86 px-2 py-0.5 font-mono-tabular text-[10px] text-[#FFD166]">
          {race.targetPos && renderDirectionIcon(angleDeg, distPx, '#FFD166', true)}
          <span>
            CP {race.checkpointIndex + 1}/{race.totalCheckpoints} · {formatMeters(distPx)}
          </span>
        </div>
      );
    }

    return (
      <div
        key={`race-cp-${race.checkpointIndex}`}
        className="animate-mission-step w-full border border-[#FFD166]/70 bg-[#080D18]/86 px-2.5 py-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#FFD166]">
            <Flag className="h-3 w-3" />
            <span>
              检查点 {race.checkpointIndex + 1}/{race.totalCheckpoints}
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
          <div className="mt-1 flex items-center justify-between gap-1.5 text-[10px]">
            <span className="truncate font-semibold text-slate-100">{race.targetLabel}</span>
            {race.targetPos && (
              <span className="flex shrink-0 items-center gap-1 font-mono-tabular font-bold text-[#00F5FF]">
                {renderDirectionIcon(angleDeg, distPx, '#FFD166', true)}
                {formatMeters(distPx)}
              </span>
            )}
          </div>
        )}

        <ScrollingTicker
          accentColor="#FFD166"
          text={`下一检查点：${race.targetLabel ?? '终点'} · 方位 ${getCardinalDirection(dx, dy)} · 剩余 ${race.timeRemainingSec}s`}
        />

        <div className="mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1 font-mono-tabular text-[9px] text-slate-400">
          <span>
            用时 {race.elapsedSec}s{isFar ? ' · 远距导引' : ''}
          </span>
          <span>最佳 {race.bestTimeSec !== null ? `${race.bestTimeSec}s` : '--'}</span>
        </div>
      </div>
    );
  }

  if (playMode !== 'sandbox') return null;

  // 2. Active Cyber Mission (Primary GTA-style Mission Waypoint Tracker)
  if (activeMission) {
    const hasPos = activeMission.objectiveType === 'reach' && activeMission.targetPos !== null;
    const dx = hasPos && activeMission.targetPos ? activeMission.targetPos.x - playerX : 0;
    const dy = hasPos && activeMission.targetPos ? activeMission.targetPos.y - playerY : 0;
    const distPx = hasPos ? Math.hypot(dx, dy) : 0;
    const angleDeg = hasPos ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : 0;
    const dirLabel = hasPos ? getCardinalDirection(dx, dy) : '';
    const isNear = hasPos && distPx <= 280;
    const isFar = hasPos && distPx > FAR_TARGET_THRESHOLD_PX;
    const proximityPct = hasPos
      ? Math.max(8, Math.min(100, Math.round(100 - (distPx / 2800) * 100)))
      : 0;

    if (compact) {
      return (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={toggleMap}
            title="点击打开战术全图查看任务路线 (M)"
            className="pointer-events-auto flex cursor-pointer items-center gap-1.5 border border-[#FFD166]/75 bg-[#080D18]/86 px-2 py-0.5 text-[10px] hover:border-[#00F5FF]"
          >
            {hasPos ? (
              renderDirectionIcon(angleDeg, distPx, '#FFD166', true)
            ) : (
              <Siren className="h-3 w-3 shrink-0 text-[#FF4545]" />
            )}
            <span className="max-w-[96px] truncate font-bold text-[#FFD166]">
              {activeMission.title}
            </span>
            <span className="font-mono-tabular font-bold text-[#00F5FF]">
              {hasPos ? formatMeters(distPx) : `${escapeProgress}%`}
            </span>
          </button>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div
          key={`${activeMission.id}-${activeMission.stepIndex}`}
          className="animate-mission-step w-full border border-[#FFD166]/70 bg-[#080D18]/86 px-2.5 py-1.5"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1">
              <Target className="h-3 w-3 shrink-0 text-[#FFD166]" />
              <span className="truncate text-[10px] font-bold tracking-wider text-[#FFD166]">
                {activeMission.title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="border border-[#FFD166]/45 bg-[#FFD166]/10 px-1 font-mono-tabular text-[9px] font-bold text-[#FFD166]">
                {activeMission.stepIndex + 1}/{activeMission.totalSteps}
              </span>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="pointer-events-auto cursor-pointer text-slate-400 hover:text-[#FFD166]"
                title={collapsed ? '展开任务追踪' : '收起任务追踪'}
              >
                {collapsed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Always-visible GPS Waypoint Distance Bar with Pixel Navigation Pointer when far */}
          {hasPos && (
            <button
              type="button"
              onClick={toggleMap}
              title="点击打开战术全图定位目标 (M)"
              className={`pointer-events-auto mt-1 flex w-full cursor-pointer items-center justify-between gap-1.5 border bg-[#0D1424]/90 px-1.5 py-1 text-left transition-colors hover:border-[#00F5FF] ${
                isFar ? 'border-[#FFD166]/70' : 'border-[#00F5FF]/35'
              }`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                    isFar
                      ? 'border-[#FFD166] bg-[#FFD166]/20'
                      : 'border-[#FFD166]/60 bg-[#FFD166]/15'
                  }`}
                >
                  {renderDirectionIcon(angleDeg, distPx, '#FFD166')}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[10px] font-bold text-slate-100">
                    {activeMission.targetLabel ?? '目标信标'}
                  </div>
                  <div className="flex items-center gap-1 font-mono-tabular text-[8px] text-slate-400">
                    <span>方位 {dirLabel}</span>
                    {isFar && (
                      <span className="bg-[#FFD166]/20 px-1 font-bold text-[#FFD166]">
                        像素导引
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right font-mono-tabular">
                <div
                  className={`text-[11px] font-bold leading-none ${
                    isNear
                      ? 'animate-pulse text-[#4ADE80]'
                      : isFar
                        ? 'text-[#FFD166]'
                        : 'text-[#00F5FF]'
                  }`}
                >
                  {formatMeters(distPx)}
                </div>
                <div className="text-[8px] text-slate-400">
                  {isNear ? '即将抵达' : isFar ? '目标过远' : '直线距离'}
                </div>
              </div>
            </button>
          )}

          {activeMission.objectiveType === 'escape_wanted' && (
            <div className="mt-1 border border-[#FF4545]/60 bg-[#FF4545]/10 px-1.5 py-1 text-[10px]">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1 text-[#FF4545]">
                  <Siren className="h-3 w-3" />
                  {wantedLevel > 0 ? (spotted ? '被警队锁定' : '脱离视线中') : '警星已消除'}
                </span>
                <span className="font-mono-tabular text-[#00F5FF]">{escapeProgress}%</span>
              </div>
            </div>
          )}

          {!collapsed && (
            <>
              {/* Dynamic Scrolling Cyber Instruction Ticker */}
              <ScrollingTicker
                accentColor="#FFD166"
                text={
                  hasPos
                    ? `${activeMission.instruction} · 目标：${activeMission.targetLabel ?? '信标'} (${dirLabel} ${formatMeters(distPx)})`
                    : activeMission.instruction
                }
              />

              <p className="mt-1 text-[10px] leading-snug text-slate-300">
                {activeMission.instruction}
              </p>

              {hasPos && (
                <div className="relative mt-1 h-1.5 w-full overflow-hidden bg-[#151C2B]">
                  <div
                    className="relative h-full bg-[#FFD166] transition-all duration-150"
                    style={{ width: `${proximityPct}%` }}
                  >
                    <div className="pixel-scroll-rail absolute inset-0" />
                  </div>
                </div>
              )}

              <div className="mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1 text-[9px]">
                <div className="flex items-center gap-2 font-mono-tabular">
                  <span className="font-bold text-[#00F5FF]">+${activeMission.reward}</span>
                  {activeMission.timeRemainingSec !== null && (
                    <span
                      className={`font-bold ${
                        activeMission.timeRemainingSec <= 12
                          ? 'animate-pulse text-[#FF4545]'
                          : 'text-[#FFD166]'
                      }`}
                    >
                      限 {activeMission.timeRemainingSec}s
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => gameEvents.emit(GAME_EVENT.ABANDON_MISSION)}
                  title="放弃当前委托"
                  className="pointer-events-auto flex cursor-pointer items-center gap-0.5 text-slate-400 transition-colors hover:text-[#FF4545]"
                >
                  <XCircle className="h-2.5 w-2.5" />
                  <span>放弃</span>
                </button>
              </div>
            </>
          )}
        </div>
        {renderSlimWaypointStrip()}
      </div>
    );
  }

  // 3. Vigilante Police Bounty Target (if active without main mission)
  const vigilanteTarget = policeMarkers.find((pm) => pm.id === 'vigilante-target') ?? null;
  if (vigilanteTarget) {
    const dx = vigilanteTarget.x - playerX;
    const dy = vigilanteTarget.y - playerY;
    const distPx = Math.hypot(dx, dy);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const isFar = distPx > FAR_TARGET_THRESHOLD_PX;

    if (compact) {
      return (
        <div className="flex items-center gap-1.5 border border-[#FF4545]/75 bg-[#080D18]/86 px-2 py-0.5 font-mono-tabular text-[10px] text-[#FFD166]">
          {renderDirectionIcon(angleDeg, distPx, '#FF4545', true)}
          <span>追缉目标 · {formatMeters(distPx)}</span>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="animate-mission-step w-full border border-[#FF4545]/75 bg-[#080D18]/86 px-2.5 py-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="flex items-center gap-1 text-[#FF4545]">
              <Siren className="h-3 w-3 animate-pulse" />
              治安追缉悬赏
            </span>
            <span className="font-mono-tabular text-[#FFD166]">
              {getCardinalDirection(dx, dy)} · {formatMeters(distPx)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-1.5 border border-[#FF4545]/35 bg-[#0D1424]/85 px-1.5 py-1 text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-200">
              {renderDirectionIcon(angleDeg, distPx, '#FFD166')}
              <span>截停并摧毁逃犯载具</span>
            </span>
            {isFar && (
              <span className="bg-[#FF4545]/20 px-1 font-mono-tabular text-[8px] font-bold text-[#FF4545]">
                远距导引
              </span>
            )}
          </div>
          <ScrollingTicker
            accentColor="#FF4545"
            text={`特区警讯锁定：向 ${getCardinalDirection(dx, dy)} 追击逃犯载具 · 距离 ${formatMeters(distPx)}`}
          />
        </div>
        {renderSlimWaypointStrip()}
      </div>
    );
  }

  // 4. Custom GPS Waypoint (when idle in Sandbox, shown in both compact & expanded mode)
  if (customWaypoint) {
    const isNear = wpDistPx <= 200;
    const proximityPct = Math.max(8, Math.min(100, Math.round(100 - (wpDistPx / 2800) * 100)));

    if (compact) {
      return (
        <div className="flex items-center gap-1.5 border border-[#38BDF8]/75 bg-[#080D18]/86 px-2 py-0.5 font-mono-tabular text-[10px] text-[#38BDF8]">
          {renderDirectionIcon(wpAngleDeg, wpDistPx, '#38BDF8', true)}
          <span className="max-w-[84px] truncate">{customWaypoint.label}</span>
          <span className="font-bold text-[#00F5FF]">{formatMeters(wpDistPx)}</span>
        </div>
      );
    }

    return (
      <div className="animate-mission-step w-full border border-[#38BDF8]/75 bg-[#080D18]/86 px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1 text-[10px]">
          <span className="flex items-center gap-1 truncate font-bold text-[#38BDF8]">
            <Crosshair className="h-3 w-3 shrink-0" />
            <span className="truncate">{customWaypoint.label}</span>
          </span>
          <button
            type="button"
            onClick={() => gameEvents.emit(GAME_EVENT.SET_CUSTOM_WAYPOINT, null)}
            title="取消自定义航标"
            className="pointer-events-auto flex shrink-0 cursor-pointer items-center gap-0.5 text-slate-400 hover:text-[#FF4545]"
          >
            <XCircle className="h-3 w-3" />
            <span>取消</span>
          </button>
        </div>
        <button
          type="button"
          onClick={toggleMap}
          className="pointer-events-auto mt-1 flex w-full cursor-pointer items-center justify-between text-[10px]"
        >
          <span className="flex items-center gap-1.5 text-slate-300">
            {renderDirectionIcon(wpAngleDeg, wpDistPx, '#00F5FF')}
            <span>方位 {getCardinalDirection(wpDx, wpDy)}</span>
            {wpIsFar && (
              <span className="bg-[#38BDF8]/20 px-1 font-mono-tabular text-[8px] font-bold text-[#38BDF8]">
                远距导引
              </span>
            )}
          </span>
          <span
            className={`font-mono-tabular font-bold ${
              isNear ? 'animate-pulse text-[#4ADE80]' : 'text-[#00F5FF]'
            }`}
          >
            {formatMeters(wpDistPx)}
          </span>
        </button>
        <ScrollingTicker
          accentColor="#38BDF8"
          text={`GPS 航标导航中：前往 ${customWaypoint.label} (${getCardinalDirection(wpDx, wpDy)} ${formatMeters(wpDistPx)})`}
        />
        <div className="relative mt-1 h-1.5 w-full overflow-hidden bg-[#151C2B]">
          <div
            className="relative h-full bg-[#38BDF8] transition-all duration-150"
            style={{ width: `${proximityPct}%` }}
          >
            <div className="pixel-scroll-rail absolute inset-0" />
          </div>
        </div>
      </div>
    );
  }

  // 5. Nearest Dynamic City Event or Hub Guidance when idle in Sandbox
  if (compact) return null;

  const nearestEvent =
    randomEvents.length > 0
      ? randomEvents.reduce<{ ev: (typeof randomEvents)[number]; dist: number } | null>(
          (best, ev) => {
            const d = Math.hypot(ev.x - playerX, ev.y - playerY);
            if (!best || d < best.dist) return { ev, dist: d };
            return best;
          },
          null
        )
      : null;

  if (nearestEvent) {
    const dx = nearestEvent.ev.x - playerX;
    const dy = nearestEvent.ev.y - playerY;
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const isFar = nearestEvent.dist > FAR_TARGET_THRESHOLD_PX;

    return (
      <button
        type="button"
        onClick={toggleMap}
        title="点击查看战术全图动态事件信标 (M)"
        className="pointer-events-auto w-full cursor-pointer border bg-[#080D18]/84 px-2.5 py-1.5 text-left transition-colors hover:brightness-110"
        style={{ borderColor: `${nearestEvent.ev.accentColor}88` }}
      >
        <div className="flex items-center justify-between gap-1 text-[10px]">
          <span
            className="flex items-center gap-1 truncate font-bold"
            style={{ color: nearestEvent.ev.accentColor }}
          >
            <Compass className="h-3 w-3 shrink-0" />
            <span className="truncate">{nearestEvent.ev.title}</span>
          </span>
          <span className="shrink-0 font-mono-tabular text-[9px] text-slate-400">
            {nearestEvent.ev.timeRemainingSec}s
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[9px] text-slate-300">
          <span className="flex items-center gap-1.5">
            {renderDirectionIcon(angleDeg, nearestEvent.dist, nearestEvent.ev.accentColor)}
            <span>
              {nearestEvent.ev.district} · {getCardinalDirection(dx, dy)}
            </span>
            {isFar && (
              <span
                className="px-1 font-mono-tabular text-[8px] font-bold"
                style={{
                  backgroundColor: `${nearestEvent.ev.accentColor}25`,
                  color: nearestEvent.ev.accentColor,
                }}
              >
                远距
              </span>
            )}
          </span>
          <span className="font-mono-tabular font-bold text-[#00F5FF]">
            {formatMeters(nearestEvent.dist)}
          </span>
        </div>
        <ScrollingTicker
          accentColor={nearestEvent.ev.accentColor}
          text={`紧急事件播报：${nearestEvent.ev.district} · ${nearestEvent.ev.description}`}
        />
      </button>
    );
  }

  // Fallback idle mission hint pointing toward Nexus Ops Hub
  const nexusHub = districtData?.landmarks.find((l) => l.id === 'nexus-ops');
  const hubX = nexusHub?.x ?? 1480;
  const hubY = nexusHub?.y ?? 624;
  const hubDx = hubX - playerX;
  const hubDy = hubY - playerY;
  const hubDist = Math.hypot(hubDx, hubDy);
  const hubAngle = (Math.atan2(hubDy, hubDx) * 180) / Math.PI + 90;
  const hubIsFar = hubDist > FAR_TARGET_THRESHOLD_PX;

  return (
    <button
      type="button"
      onClick={toggleMap}
      title="前往霓虹广场枢纽行动终端接取赛博委托"
      className="pointer-events-auto w-full cursor-pointer border border-slate-700/75 bg-[#080D18]/84 px-2.5 py-1 text-left transition-colors hover:border-[#00F5FF]/70"
    >
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 font-bold text-slate-200">
          <MapPin className="h-3 w-3 text-[#00F5FF]" />
          <span>赛博委托待接取</span>
        </span>
        <span className="font-mono-tabular text-[9px] text-slate-400">
          已完成 {completedMissionIds.length}/{MISSION_DEFINITIONS.length}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[9px] text-slate-400">
        <span className="flex items-center gap-1.5">
          {renderDirectionIcon(hubAngle, hubDist, '#00F5FF')}
          <span>枢纽终端 · {getCardinalDirection(hubDx, hubDy)}</span>
          {hubIsFar && (
            <span className="bg-[#00F5FF]/15 px-1 font-mono-tabular text-[8px] font-bold text-[#00F5FF]">
              远距
            </span>
          )}
        </span>
        <span className="font-mono-tabular font-bold text-[#00F5FF]">
          {formatMeters(hubDist)}
        </span>
      </div>
      <ScrollingTicker
        accentColor="#00F5FF"
        text={`前往霓虹广场「枢纽行动终端」按 E 接取赛博委托 · 按 M 点击地图放置航标`}
      />
    </button>
  );
}
