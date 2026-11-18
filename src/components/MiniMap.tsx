import { WORLD_CONFIG } from '../game/config/BalanceConfig';
import { useGameStore } from '../store/gameStore';
import { MapTerrainSvg } from './MapTerrainSvg';

interface MiniMapProps {
  width?: number;
  height?: number;
  onClick?: () => void;
}

export function MiniMap({ width = 156, height = 114, onClick }: MiniMapProps) {
  const playMode = useGameStore((s) => s.playMode);
  const districtData = useGameStore((s) => s.districtData);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const facingDeg = useGameStore((s) => s.facingDeg);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const spotted = useGameStore((s) => s.spotted);
  const lastKnownPos = useGameStore((s) => s.lastKnownPos);
  const policeMarkers = useGameStore((s) => s.policeMarkers);
  const activeMission = useGameStore((s) => s.activeMission);
  const horde = useGameStore((s) => s.horde);
  const race = useGameStore((s) => s.race);
  const exploration = useGameStore((s) => s.exploration);
  const randomEvents = useGameStore((s) => s.randomEvents);

  if (!districtData) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="打开区域地图"
      className="pointer-events-auto block border border-[#00F5FF]/45 bg-[#080D18]/92 p-1 transition-colors hover:border-[#00F5FF] focus-visible:outline-2 focus-visible:outline-[#00F5FF]"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${WORLD_CONFIG.WIDTH} ${WORLD_CONFIG.HEIGHT}`}
        className="block bg-[#080D18]"
      >
        <MapTerrainSvg districtData={districtData} showLabels={false} />

        {/* Landmarks */}
        {districtData.landmarks.map((lm) => (
          <circle
            key={lm.id}
            cx={lm.x}
            cy={lm.y}
            r={24}
            fill={lm.accentColor}
            fillOpacity={0.88}
          />
        ))}

        {/* Uncollected Data Chips (Sandbox) */}
        {playMode === 'sandbox' &&
          exploration.chipMarkers.map((cm, idx) => (
            <polygon
              key={`chip-${idx}`}
              points={`${cm.x},${cm.y - 24} ${cm.x + 24},${cm.y} ${cm.x},${cm.y + 24} ${cm.x - 24},${cm.y}`}
              fill="#C000FF"
              stroke="#00F5FF"
              strokeWidth={6}
            />
          ))}

        {/* Last Known Search Area */}
        {playMode === 'sandbox' && wantedLevel > 0 && !spotted && lastKnownPos && (
          <circle
            cx={lastKnownPos.x}
            cy={lastKnownPos.y}
            r={78}
            fill="#FF4545"
            fillOpacity={0.14}
            stroke="#FF4545"
            strokeWidth={8}
            strokeDasharray="20 14"
          />
        )}

        {/* Police Units & Vigilante Bounty Target */}
        {playMode === 'sandbox' &&
          policeMarkers.map((pm) => {
            if (pm.id === 'vigilante-target') {
              return (
                <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                  <circle r={48} fill="#FFD166" fillOpacity={0.2} stroke="#FF4545" strokeWidth={8} />
                  <polygon
                    points="0,-28 28,0 0,28 -28,0"
                    fill="#FFD166"
                    stroke="#FF4545"
                    strokeWidth={7}
                  />
                </g>
              );
            }
            const isHostile = pm.state !== 'PATROL';
            return (
              <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                {isHostile && (
                  <circle r={38} fill="none" stroke="#FF4545" strokeWidth={6} strokeOpacity={0.75} />
                )}
                <rect
                  x={-18}
                  y={-18}
                  width={36}
                  height={36}
                  fill={isHostile ? '#FF4545' : '#38BDF8'}
                  stroke="#080D18"
                  strokeWidth={6}
                />
              </g>
            );
          })}

        {/* Horde Enemies */}
        {playMode === 'horde' &&
          horde.enemyMarkers.map((em, idx) => (
            <rect
              key={`em-${idx}`}
              x={em.x - (em.isBoss ? 28 : 16)}
              y={em.y - (em.isBoss ? 28 : 16)}
              width={em.isBoss ? 56 : 32}
              height={em.isBoss ? 56 : 32}
              fill={em.isBoss ? '#FFD166' : '#FF2E88'}
              stroke="#080D18"
              strokeWidth={6}
            />
          ))}

        {/* Sandbox Random Events */}
        {playMode === 'sandbox' &&
          randomEvents.map((ev) => (
            <g key={`minimap-ev-${ev.id}`} transform={`translate(${ev.x}, ${ev.y})`}>
              <circle
                r={58}
                fill={ev.accentColor}
                fillOpacity={0.18}
                stroke={ev.accentColor}
                strokeWidth={8}
              />
              <polygon
                points="0,-28 28,0 0,28 -28,0"
                fill={ev.accentColor}
                stroke="#080D18"
                strokeWidth={7}
              />
            </g>
          ))}

        {/* Active Mission Target Beacon */}
        {playMode === 'sandbox' && activeMission?.targetPos && (
          <g transform={`translate(${activeMission.targetPos.x}, ${activeMission.targetPos.y})`}>
            <circle r={54} fill="#FFD166" fillOpacity={0.22} stroke="#FFD166" strokeWidth={8} />
            <polygon points="0,-28 26,0 0,28 -26,0" fill="#FFD166" stroke="#080D18" strokeWidth={6} />
          </g>
        )}

        {/* Race Checkpoint Beacon */}
        {playMode === 'race' && race.active && race.targetPos && (
          <g transform={`translate(${race.targetPos.x}, ${race.targetPos.y})`}>
            <circle r={68} fill="#FFD166" fillOpacity={0.28} stroke="#00F5FF" strokeWidth={10} />
            <polygon points="0,-32 28,0 0,32 -28,0" fill="#FFD166" stroke="#080D18" strokeWidth={6} />
          </g>
        )}

        {/* Player Position & Heading */}
        <g transform={`translate(${playerX}, ${playerY}) rotate(${facingDeg})`}>
          <polygon points="52,0 -30,-30 -16,0 -30,30" fill="#00F5FF" stroke="#080D18" strokeWidth={8} />
        </g>
      </svg>
    </button>
  );
}
