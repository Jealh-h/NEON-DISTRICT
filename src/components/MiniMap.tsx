import { WORLD_CONFIG } from '../game/config/BalanceConfig';
import { useGameStore } from '../store/gameStore';

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
        {/* Harbor Docks */}
        {districtData.docks.map((dk, idx) => (
          <rect
            key={`dk-${idx}`}
            x={dk.x}
            y={dk.y}
            width={dk.w}
            height={dk.h}
            fill="#1D273A"
          />
        ))}

        {/* Riverside Parks */}
        {districtData.parks.map((pk, idx) => (
          <rect
            key={`pk-${idx}`}
            x={pk.x}
            y={pk.y}
            width={pk.w}
            height={pk.h}
            fill="#0F2A30"
          />
        ))}

        {/* Roads */}
        {districtData.roads.map((road, idx) => (
          <rect
            key={idx}
            x={road.x}
            y={road.y}
            width={road.w}
            height={road.h}
            fill="#151C2B"
          />
        ))}

        {/* Turbo Strips */}
        {districtData.turboStrips.map((ts) => (
          <rect
            key={ts.id}
            x={ts.x}
            y={ts.y}
            width={ts.w}
            height={ts.h}
            fill="#00F5FF"
            fillOpacity={0.5}
          />
        ))}

        {/* Stunt Ramps */}
        {districtData.stuntRamps.map((rm) => (
          <rect
            key={rm.id}
            x={rm.x}
            y={rm.y}
            width={rm.w}
            height={rm.h}
            fill="#FFD166"
            fillOpacity={0.7}
          />
        ))}

        {/* Rivers & Lagoons */}
        {districtData.rivers.map((rv, idx) => (
          <rect
            key={`rv-${idx}`}
            x={rv.x}
            y={rv.y}
            width={rv.w}
            height={rv.h}
            fill="#0B3B60"
            stroke="#00F5FF"
            strokeWidth={6}
            strokeOpacity={0.35}
          />
        ))}

        {/* Bridges crossing water */}
        {districtData.bridges.map((br, idx) => (
          <rect
            key={`br-${idx}`}
            x={br.x}
            y={br.y}
            width={br.w}
            height={br.h}
            fill="#28354C"
            stroke="#FFD166"
            strokeWidth={7}
            strokeOpacity={0.8}
          />
        ))}

        {/* Highland Mountains */}
        {districtData.mountains.map((mt) => (
          <g key={mt.id}>
            <rect
              x={mt.x}
              y={mt.y}
              width={mt.w}
              height={mt.h}
              fill="#263147"
              stroke="#47597B"
              strokeWidth={8}
            />
            <rect
              x={mt.x + 28}
              y={mt.y + 28}
              width={Math.max(16, mt.w - 56)}
              height={Math.max(16, mt.h - 56)}
              fill="#3A4B6C"
            />
          </g>
        ))}

        {/* Parking Lot */}
        <rect
          x={districtData.parkingLot.x}
          y={districtData.parkingLot.y}
          width={districtData.parkingLot.w}
          height={districtData.parkingLot.h}
          fill="#0F1522"
          stroke="#FFD166"
          strokeWidth={8}
          strokeOpacity={0.5}
        />

        {/* Buildings */}
        {districtData.buildings.map((b) => (
          <rect
            key={b.id}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="#20283A"
            stroke={b.accentHex}
            strokeWidth={8}
            strokeOpacity={0.65}
          />
        ))}

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

        {/* Police Units */}
        {playMode === 'sandbox' &&
          policeMarkers.map((pm) => {
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
