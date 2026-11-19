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
  const sandboxSummary = useGameStore((s) => s.sandboxSummary);
  const customWaypoint = useGameStore((s) => s.customWaypoint);
  const randomEvents = useGameStore((s) => s.randomEvents);
  const terraria = useGameStore((s) => s.terraria);

  if (!districtData) return null;

  const viewW = 1680;
  const viewH = 1230;
  const vx = Math.max(0, Math.min(WORLD_CONFIG.WIDTH - viewW, playerX - viewW / 2));
  const vy = Math.max(0, Math.min(WORLD_CONFIG.HEIGHT - viewH, playerY - viewH / 2));

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
        viewBox={`${vx} ${vy} ${viewW} ${viewH}`}
        className="block bg-[#080D18]"
      >
        <MapTerrainSvg districtData={districtData} showLabels={false} />

        {/* Landmarks */}
        {districtData.landmarks.map((lm) => (
          <circle
            key={lm.id}
            cx={lm.x}
            cy={lm.y}
            r={16}
            fill={lm.accentColor}
            fillOpacity={0.9}
          />
        ))}

        {/* Sandbox Exploration Layers */}
        {playMode === 'sandbox' && (
          <>
            {/* Active Gang Outposts */}
            {sandboxSummary.gangOutposts
              .filter((op) => !op.cleared)
              .map((op) => (
                <g key={op.id} transform={`translate(${op.x}, ${op.y})`}>
                  <circle
                    r={68}
                    fill={op.accentHex}
                    fillOpacity={0.14}
                    stroke={op.accentHex}
                    strokeWidth={5}
                    strokeDasharray="12 8"
                  />
                  <polygon
                    points="0,-16 16,0 0,16 -16,0"
                    fill={op.accentHex}
                    stroke="#080D18"
                    strokeWidth={4}
                  />
                </g>
              ))}

            {/* District Signal Towers */}
            {sandboxSummary.signalTowers.map((tw) => (
              <g key={tw.id} transform={`translate(${tw.x}, ${tw.y})`}>
                <circle
                  r={18}
                  fill="none"
                  stroke={tw.synced ? '#4ADE80' : tw.accentHex}
                  strokeWidth={4}
                  strokeOpacity={tw.synced ? 0.7 : 0.95}
                />
                <polygon
                  points="0,-14 11,8 -11,8"
                  fill={tw.synced ? '#4ADE80' : '#FFD166'}
                  stroke="#080D18"
                  strokeWidth={3}
                />
              </g>
            ))}

            {/* Discovered Metro Stations */}
            {sandboxSummary.metroStations
              .filter((ms) => ms.discovered)
              .map((ms) => (
                <g key={ms.id} transform={`translate(${ms.x}, ${ms.y})`}>
                  <rect
                    x={-13}
                    y={-13}
                    width={26}
                    height={26}
                    fill="#080D18"
                    stroke="#00F5FF"
                    strokeWidth={4}
                  />
                  <circle r={5} fill="#00F5FF" />
                </g>
              ))}

            {/* Revealed Secret Vaults */}
            {sandboxSummary.secretVaults
              .filter((sv) => sv.revealed && !sv.opened)
              .map((sv) => (
                <g key={sv.id} transform={`translate(${sv.x}, ${sv.y})`}>
                  <rect
                    x={-12}
                    y={-12}
                    width={24}
                    height={24}
                    fill="#FFD166"
                    stroke="#080D18"
                    strokeWidth={4}
                  />
                </g>
              ))}

            {/* Terraria Personal Pylons */}
            {terraria.pylons.map((py) => (
              <g key={py.id} transform={`translate(${py.x}, ${py.y})`}>
                <circle r={22} fill="#C000FF" fillOpacity={0.2} stroke="#C000FF" strokeWidth={4} />
                <polygon
                  points="0,-16 12,0 0,16 -12,0"
                  fill="#C000FF"
                  stroke="#00F5FF"
                  strokeWidth={3}
                />
              </g>
            ))}

            {/* Active Terraria World Boss */}
            {terraria.activeBoss && (
              <g transform={`translate(${terraria.activeBoss.x}, ${terraria.activeBoss.y})`}>
                <circle
                  r={50}
                  fill={terraria.activeBoss.colorHex}
                  fillOpacity={0.24}
                  stroke={terraria.activeBoss.colorHex}
                  strokeWidth={6}
                  strokeDasharray="14 8"
                />
                <polygon
                  points="0,-24 17,-17 24,0 17,17 0,24 -17,17 -24,0 -17,-17"
                  fill={terraria.activeBoss.colorHex}
                  stroke="#080D18"
                  strokeWidth={5}
                />
              </g>
            )}
          </>
        )}

        {/* Uncollected Data Chips (Sandbox) */}
        {playMode === 'sandbox' &&
          exploration.chipMarkers.map((cm, idx) => (
            <polygon
              key={`chip-${idx}`}
              points={`${cm.x},${cm.y - 16} ${cm.x + 16},${cm.y} ${cm.x},${cm.y + 16} ${cm.x - 16},${cm.y}`}
              fill="#C000FF"
              stroke="#00F5FF"
              strokeWidth={4}
            />
          ))}

        {/* Last Known Search Area */}
        {playMode === 'sandbox' && wantedLevel > 0 && !spotted && lastKnownPos && (
          <circle
            cx={lastKnownPos.x}
            cy={lastKnownPos.y}
            r={64}
            fill="#FF4545"
            fillOpacity={0.14}
            stroke="#FF4545"
            strokeWidth={6}
            strokeDasharray="16 12"
          />
        )}

        {/* Police Units & Vigilante Bounty Target */}
        {playMode === 'sandbox' &&
          policeMarkers.map((pm) => {
            if (pm.id === 'vigilante-target') {
              return (
                <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                  <circle r={34} fill="#FFD166" fillOpacity={0.2} stroke="#FF4545" strokeWidth={6} />
                  <polygon
                    points="0,-20 20,0 0,20 -20,0"
                    fill="#FFD166"
                    stroke="#FF4545"
                    strokeWidth={5}
                  />
                </g>
              );
            }
            const isHostile = pm.state !== 'PATROL';
            return (
              <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                {isHostile && (
                  <circle r={26} fill="none" stroke="#FF4545" strokeWidth={5} strokeOpacity={0.75} />
                )}
                <rect
                  x={-12}
                  y={-12}
                  width={24}
                  height={24}
                  fill={isHostile ? '#FF4545' : '#38BDF8'}
                  stroke="#080D18"
                  strokeWidth={4}
                />
              </g>
            );
          })}

        {/* Horde Enemies */}
        {playMode === 'horde' &&
          horde.enemyMarkers.map((em, idx) => (
            <rect
              key={`em-${idx}`}
              x={em.x - (em.isBoss ? 22 : 12)}
              y={em.y - (em.isBoss ? 22 : 12)}
              width={em.isBoss ? 44 : 24}
              height={em.isBoss ? 44 : 24}
              fill={em.isBoss ? '#FFD166' : '#FF2E88'}
              stroke="#080D18"
              strokeWidth={4}
            />
          ))}

        {/* Sandbox Random Events */}
        {playMode === 'sandbox' &&
          randomEvents.map((ev) => (
            <g key={`minimap-ev-${ev.id}`} transform={`translate(${ev.x}, ${ev.y})`}>
              <circle
                r={40}
                fill={ev.accentColor}
                fillOpacity={0.18}
                stroke={ev.accentColor}
                strokeWidth={5}
              />
              <polygon
                points="0,-20 20,0 0,20 -20,0"
                fill={ev.accentColor}
                stroke="#080D18"
                strokeWidth={5}
              />
            </g>
          ))}

        {/* Active Mission Target Beacon */}
        {playMode === 'sandbox' && activeMission?.targetPos && (
          <g transform={`translate(${activeMission.targetPos.x}, ${activeMission.targetPos.y})`}>
            <circle r={38} fill="#FFD166" fillOpacity={0.22} stroke="#FFD166" strokeWidth={6} />
            <polygon points="0,-20 18,0 0,20 -18,0" fill="#FFD166" stroke="#080D18" strokeWidth={4} />
          </g>
        )}

        {/* Race Checkpoint Beacon */}
        {playMode === 'race' && race.active && race.targetPos && (
          <g transform={`translate(${race.targetPos.x}, ${race.targetPos.y})`}>
            <circle r={48} fill="#FFD166" fillOpacity={0.28} stroke="#00F5FF" strokeWidth={7} />
            <polygon points="0,-22 20,0 0,22 -20,0" fill="#FFD166" stroke="#080D18" strokeWidth={5} />
          </g>
        )}

        {/* Custom GPS Waypoint */}
        {customWaypoint && (
          <g transform={`translate(${customWaypoint.x}, ${customWaypoint.y})`}>
            <circle r={34} fill="#38BDF8" fillOpacity={0.2} stroke="#38BDF8" strokeWidth={5} />
            <line x1={-22} y1={0} x2={22} y2={0} stroke="#00F5FF" strokeWidth={5} />
            <line x1={0} y1={-22} x2={0} y2={22} stroke="#00F5FF" strokeWidth={5} />
            <circle r={8} fill="#FFD166" stroke="#080D18" strokeWidth={3} />
          </g>
        )}

        {/* Player Position & Heading */}
        <g transform={`translate(${playerX}, ${playerY}) rotate(${facingDeg})`}>
          <polygon points="36,0 -22,-22 -11,0 -22,22" fill="#00F5FF" stroke="#080D18" strokeWidth={6} />
        </g>
      </svg>
    </button>
  );
}
