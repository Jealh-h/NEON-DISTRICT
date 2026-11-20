import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Crosshair,
  Flag,
  MapPin,
  Navigation,
  Siren,
  Star,
  XCircle,
} from 'lucide-react';
import { MISSION_DEFINITIONS } from '../game/config/BalanceConfig';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

export const FAR_TARGET_THRESHOLD_PX = 560; // 70m (~outside immediate viewport)

function formatMeters(distPx: number): string {
  const meters = Math.max(0, Math.round(distPx / 8));
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
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
  const leftPct = 50 + Math.cos(rad) * 34;
  const topPct = 50 + Math.sin(rad) * 30;

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
  const exploration = useGameStore((s) => s.exploration);
  const sandboxSummary = useGameStore((s) => s.sandboxSummary);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const spotted = useGameStore((s) => s.spotted);
  const escapeProgress = useGameStore((s) => s.escapeProgress);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const customWaypoint = useGameStore((s) => s.customWaypoint);
  const districtData = useGameStore((s) => s.districtData);
  const toggleMap = useGameStore((s) => s.toggleMap);
  const openHubTab = useGameStore((s) => s.openHubTab);

  const [collapsed, setCollapsed] = useState(false);

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
          size={compactSize ? 12 : 14}
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

  // 1. Race mode checkpoint tracker
  if (playMode === 'race') {
    if (!race.active) return null;

    const dx = race.targetPos ? race.targetPos.x - playerX : 0;
    const dy = race.targetPos ? race.targetPos.y - playerY : 0;
    const distPx = race.targetPos ? Math.hypot(dx, dy) : 0;
    const angleDeg = race.targetPos ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : 0;

    if (compact) {
      return (
        <div className="flex items-center gap-1.5 border border-[#FFD166]/70 bg-[#070B18]/88 px-2 py-0.5 font-mono-tabular text-[10px] text-[#FFD166]">
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
        className="animate-mission-step w-full border border-[#00F5FF]/55 bg-[#070B18]/88 p-2"
        style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.88)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center bg-[#FFD166]/20 text-[#FFD166]">
              <Flag className="h-3 w-3" />
            </span>
            <span className="text-[11px] font-bold text-[#FFD166]">
              环城竞速 · 检查点 {race.checkpointIndex + 1}/{race.totalCheckpoints}
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

        <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
          <span className="truncate text-slate-200">{race.targetLabel ?? '下一检查点'}</span>
          {race.targetPos && (
            <span className="flex shrink-0 items-center gap-1 font-mono-tabular font-bold text-[#FFD166]">
              {renderDirectionIcon(angleDeg, distPx, '#FFD166', true)}
              {formatMeters(distPx)}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between border-t border-slate-800/80 pt-1 font-mono-tabular text-[9px] text-slate-400">
          <span>用时 {race.elapsedSec}s</span>
          <span>最佳 {race.bestTimeSec !== null ? `${race.bestTimeSec}s` : '--'}</span>
        </div>
      </div>
    );
  }

  if (playMode !== 'sandbox') return null;

  // Compact single-line fallback when HUD is minimized [V] or on tiny phones
  if (compact) {
    if (activeMission) {
      const hasPos = activeMission.objectiveType === 'reach' && activeMission.targetPos !== null;
      const dx = hasPos && activeMission.targetPos ? activeMission.targetPos.x - playerX : 0;
      const dy = hasPos && activeMission.targetPos ? activeMission.targetPos.y - playerY : 0;
      const distPx = hasPos ? Math.hypot(dx, dy) : 0;
      const angleDeg = hasPos ? (Math.atan2(dy, dx) * 180) / Math.PI + 90 : 0;
      return (
        <button
          type="button"
          onClick={toggleMap}
          className="pointer-events-auto flex cursor-pointer items-center gap-1.5 border border-[#FF2E88]/75 bg-[#070B18]/88 px-2 py-0.5 text-[10px] hover:border-[#00F5FF]"
        >
          {hasPos ? (
            renderDirectionIcon(angleDeg, distPx, '#FF2E88', true)
          ) : (
            <Siren className="h-3 w-3 shrink-0 text-[#FF4545]" />
          )}
          <span className="max-w-[96px] truncate font-bold text-[#FF2E88]">
            {activeMission.title}
          </span>
          <span className="font-mono-tabular font-bold text-[#FFD166]">
            {hasPos ? formatMeters(distPx) : `${escapeProgress}%`}
          </span>
        </button>
      );
    }

    if (customWaypoint) {
      const dx = customWaypoint.x - playerX;
      const dy = customWaypoint.y - playerY;
      const distPx = Math.hypot(dx, dy);
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      return (
        <button
          type="button"
          onClick={toggleMap}
          className="pointer-events-auto flex cursor-pointer items-center gap-1.5 border border-[#00F5FF]/75 bg-[#070B18]/88 px-2 py-0.5 font-mono-tabular text-[10px] text-[#00F5FF]"
        >
          {renderDirectionIcon(angleDeg, distPx, '#00F5FF', true)}
          <span className="max-w-[84px] truncate">{customWaypoint.label}</span>
          <span className="font-bold text-[#FFD166]">{formatMeters(distPx)}</span>
        </button>
      );
    }
    return null;
  }

  // Compute Main Card Data (Card 1: 主线任务 - Magenta Star #FF2E88)
  const nexusHub = districtData?.landmarks.find((l) => l.id === 'nexus-ops');
  const hubX = nexusHub?.x ?? 1480;
  const hubY = nexusHub?.y ?? 624;
  const hubDx = hubX - playerX;
  const hubDy = hubY - playerY;
  const hubDist = Math.hypot(hubDx, hubDy);
  const hubAngle = (Math.atan2(hubDy, hubDx) * 180) / Math.PI + 90;

  const mainHasPos =
    activeMission !== null &&
    activeMission.objectiveType === 'reach' &&
    activeMission.targetPos !== null;
  const mainDx =
    mainHasPos && activeMission?.targetPos ? activeMission.targetPos.x - playerX : 0;
  const mainDy =
    mainHasPos && activeMission?.targetPos ? activeMission.targetPos.y - playerY : 0;
  const mainDist = mainHasPos ? Math.hypot(mainDx, mainDy) : 0;
  const mainAngle = mainHasPos ? (Math.atan2(mainDy, mainDx) * 180) / Math.PI + 90 : 0;

  // Compute Side Card Data (Card 2: 支线任务 - Cyan Star #00F5FF)
  const vigilanteTarget = policeMarkers.find((pm) => pm.id === 'vigilante-target') ?? null;
  const nearestUnsyncedTower =
    sandboxSummary.signalTowers
      .filter((t) => !t.synced)
      .reduce<{ tower: (typeof sandboxSummary.signalTowers)[number]; dist: number } | null>(
        (best, tw) => {
          const d = Math.hypot(tw.x - playerX, tw.y - playerY);
          return !best || d < best.dist ? { tower: tw, dist: d } : best;
        },
        null
      ) ?? null;
  const nearestChip =
    exploration.chipMarkers.reduce<{ x: number; y: number; dist: number } | null>((best, cm) => {
      const d = Math.hypot(cm.x - playerX, cm.y - playerY);
      return !best || d < best.dist ? { x: cm.x, y: cm.y, dist: d } : best;
    }, null) ?? null;

  type SideQuestInfo = {
    title: string;
    subtitle: string;
    x: number;
    y: number;
    distPx: number;
    canClearWaypoint?: boolean;
  };

  let sideQuest: SideQuestInfo | null = null;
  if (vigilanteTarget) {
    sideQuest = {
      title: '治安追缉悬赏',
      subtitle: '截停并摧毁逃犯载具',
      x: vigilanteTarget.x,
      y: vigilanteTarget.y,
      distPx: Math.hypot(vigilanteTarget.x - playerX, vigilanteTarget.y - playerY),
    };
  } else if (customWaypoint) {
    sideQuest = {
      title: `GPS 航标 · ${customWaypoint.label}`,
      subtitle: `方位 ${getCardinalDirection(customWaypoint.x - playerX, customWaypoint.y - playerY)}`,
      x: customWaypoint.x,
      y: customWaypoint.y,
      distPx: Math.hypot(customWaypoint.x - playerX, customWaypoint.y - playerY),
      canClearWaypoint: true,
    };
  } else if (nearestChip) {
    sideQuest = {
      title: `收集数据芯片 (${exploration.chipsCollected}/${exploration.totalChips})`,
      subtitle: '扫描周边街区探索加密芯片',
      x: nearestChip.x,
      y: nearestChip.y,
      distPx: nearestChip.dist,
    };
  } else if (nearestUnsyncedTower) {
    sideQuest = {
      title: `同步信号塔 · ${nearestUnsyncedTower.tower.districtName}`,
      subtitle: `${nearestUnsyncedTower.tower.name}（按 E 同步）`,
      x: nearestUnsyncedTower.tower.x,
      y: nearestUnsyncedTower.tower.y,
      distPx: nearestUnsyncedTower.dist,
    };
  }

  // Compute Random Event Data (Card 3: 随机事件 - Gold ! #FFD166)
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

  return (
    <div className="flex w-full flex-col gap-1.5">
      {/* CARD 1: 主线任务 (Magenta Star) */}
      <div
        key={activeMission ? `${activeMission.id}-${activeMission.stepIndex}` : 'main-idle'}
        className="animate-mission-step w-full border border-[#FF2E88]/65 bg-[#070B18]/88 px-2.5 py-1.5"
        style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.88), 0 0 14px rgba(255, 46, 136, 0.14)' }}
      >
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-[#FF2E88] text-white">
              <Star className="h-2.5 w-2.5 fill-current" />
            </span>
            <span className="text-[11px] font-extrabold tracking-wide text-[#FF2E88]">
              主线任务
            </span>
          </div>

          <div className="flex items-center gap-1">
            {activeMission && (
              <span className="border border-[#FF2E88]/45 bg-[#FF2E88]/15 px-1 font-mono-tabular text-[9px] font-bold text-[#FF2E88]">
                {activeMission.stepIndex + 1}/{activeMission.totalSteps}
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="pointer-events-auto cursor-pointer text-slate-400 hover:text-white"
              title={collapsed ? '展开任务详情' : '收起任务详情'}
            >
              {collapsed ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {activeMission ? (
          <>
            <div className="mt-1 flex items-center justify-between gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={toggleMap}
                className="pointer-events-auto flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left font-bold text-slate-100 hover:text-[#00F5FF]"
                title="在战术全图定位主线目标 (M)"
              >
                {mainHasPos && renderDirectionIcon(mainAngle, mainDist, '#FF2E88', true)}
                <span className="truncate">{activeMission.title}</span>
              </button>

              {mainHasPos ? (
                <span className="flex shrink-0 items-center gap-0.5 font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                  <MapPin className="h-3 w-3 text-[#FFD166]" />
                  {formatMeters(mainDist)}
                </span>
              ) : (
                <span className="shrink-0 font-mono-tabular text-[10px] font-bold text-[#00F5FF]">
                  {wantedLevel > 0 ? (spotted ? '被锁定' : `${escapeProgress}%`) : '已甩脱'}
                </span>
              )}
            </div>

            {!collapsed && (
              <>
                <p className="mt-0.5 truncate text-[10px] text-slate-300">
                  {activeMission.instruction}
                </p>
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
                    className="pointer-events-auto flex cursor-pointer items-center gap-0.5 text-slate-400 hover:text-[#FF4545]"
                  >
                    <XCircle className="h-2.5 w-2.5" />
                    <span>放弃</span>
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mt-1">
            <div className="flex items-center justify-between gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => openHubTab('missions')}
                className="pointer-events-auto flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left font-bold text-slate-100 hover:text-[#FF2E88]"
                title="点击打开任务日志 [L]"
              >
                {renderDirectionIcon(hubAngle, hubDist, '#FF2E88', true)}
                <span className="truncate">
                  枢纽行动终端 ({completedMissionIds.length}/{MISSION_DEFINITIONS.length})
                </span>
              </button>
              <span className="flex shrink-0 items-center gap-0.5 font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                <MapPin className="h-3 w-3 text-[#FFD166]" />
                {formatMeters(hubDist)}
              </span>
            </div>
            {!collapsed && (
              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                前往霓虹广场终端按 E 或按 L 接取赛博委托
              </p>
            )}
          </div>
        )}
      </div>

      {/* CARD 2: 支线任务 (Cyan Star) */}
      {!collapsed && sideQuest && (
        <div
          className="w-full border border-[#00F5FF]/55 bg-[#070B18]/88 px-2.5 py-1.5"
          style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.88), 0 0 14px rgba(0, 245, 255, 0.12)' }}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-[#00F5FF] text-[#070B18]">
                <Star className="h-2.5 w-2.5 fill-current" />
              </span>
              <span className="text-[11px] font-extrabold tracking-wide text-[#00F5FF]">
                支线任务
              </span>
            </div>
            {sideQuest.canClearWaypoint && (
              <button
                type="button"
                onClick={() => gameEvents.emit(GAME_EVENT.SET_CUSTOM_WAYPOINT, null)}
                title="取消自定义航标"
                className="pointer-events-auto cursor-pointer text-slate-400 hover:text-[#FF4545]"
              >
                <XCircle className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="mt-1 flex items-center justify-between gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={toggleMap}
              className="pointer-events-auto flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left font-bold text-slate-100 hover:text-[#00F5FF]"
              title="点击查看全图探索标记 (M)"
            >
              {renderDirectionIcon(
                (Math.atan2(sideQuest.y - playerY, sideQuest.x - playerX) * 180) / Math.PI + 90,
                sideQuest.distPx,
                '#00F5FF',
                true
              )}
              <span className="truncate">{sideQuest.title}</span>
            </button>
            <span className="flex shrink-0 items-center gap-0.5 font-mono-tabular text-[10px] font-bold text-[#FFD166]">
              <MapPin className="h-3 w-3 text-[#FFD166]" />
              {formatMeters(sideQuest.distPx)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-[10px] text-slate-300">{sideQuest.subtitle}</p>
        </div>
      )}

      {/* CARD 3: 随机事件 (Gold Alert Badge) */}
      {!collapsed && nearestEvent && (
        <button
          type="button"
          onClick={toggleMap}
          title="点击在战术全图查看随机事件位置 (M)"
          className="pointer-events-auto w-full cursor-pointer border border-[#FFD166]/65 bg-[#070B18]/88 px-2.5 py-1.5 text-left transition-colors hover:border-[#FFD166]"
          style={{ boxShadow: '0 4px 0 rgba(3, 6, 12, 0.88), 0 0 14px rgba(255, 209, 102, 0.12)' }}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center bg-[#FFD166] text-[#070B18]">
                <AlertTriangle className="h-2.5 w-2.5" />
              </span>
              <span className="text-[11px] font-extrabold tracking-wide text-[#FFD166]">
                随机事件
              </span>
            </div>
            <span className="flex items-center gap-0.5 font-mono-tabular text-[10px] font-bold text-[#FFD166]">
              <Clock className="h-2.5 w-2.5" />
              {formatCountdown(nearestEvent.ev.timeRemainingSec)}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between gap-1.5 text-[11px]">
            <span className="flex min-w-0 flex-1 items-center gap-1 font-bold text-slate-100">
              {renderDirectionIcon(
                (Math.atan2(nearestEvent.ev.y - playerY, nearestEvent.ev.x - playerX) * 180) /
                  Math.PI +
                  90,
                nearestEvent.dist,
                nearestEvent.ev.accentColor,
                true
              )}
              <span className="truncate">{nearestEvent.ev.title}</span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5 font-mono-tabular text-[10px] font-bold text-[#FFD166]">
              <Crosshair className="h-2.5 w-2.5" />
              {formatMeters(nearestEvent.dist)}
            </span>
          </div>

          <p className="mt-0.5 truncate text-[10px] text-slate-300">
            {nearestEvent.ev.district} · {nearestEvent.ev.description}
          </p>
        </button>
      )}
    </div>
  );
}
