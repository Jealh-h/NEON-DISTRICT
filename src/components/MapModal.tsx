import { X } from 'lucide-react';
import { WORLD_CONFIG } from '../game/config/BalanceConfig';
import { CITY_DISTRICTS } from '../game/world/DistrictManager';
import { useGameStore } from '../store/gameStore';

export function MapModal() {
  const showMap = useGameStore((s) => s.showMap);
  const setShowMap = useGameStore((s) => s.setShowMap);
  const playMode = useGameStore((s) => s.playMode);
  const districtData = useGameStore((s) => s.districtData);
  const districtName = useGameStore((s) => s.districtName);
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

  if (!showMap || !districtData) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#080D18]/88 p-3 sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-4 overflow-y-auto border border-[#00F5FF]/60 bg-[#0D1424] p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <p className="font-mono-tabular text-xs tracking-widest text-[#00F5FF]">
              全特区开放沙盒 · {WORLD_CONFIG.WIDTH} × {WORLD_CONFIG.HEIGHT} · 当前所在：{districtName}
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-wider text-slate-100">
              霓虹特区 战术全图
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowMap(false)}
            aria-label="关闭地图"
            className="flex h-11 w-11 cursor-pointer items-center justify-center border border-slate-700 bg-[#151C2B] text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <div className="border border-slate-700 bg-[#080D18] p-2">
            <svg
              viewBox={`0 0 ${WORLD_CONFIG.WIDTH} ${WORLD_CONFIG.HEIGHT}`}
              className="h-auto w-full"
            >
              {districtData.docks.map((dk, idx) => (
                <rect
                  key={`dk-${idx}`}
                  x={dk.x}
                  y={dk.y}
                  width={dk.w}
                  height={dk.h}
                  fill="#192234"
                />
              ))}

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

              {districtData.sidewalks.map((sw, idx) => (
                <rect
                  key={`sw-${idx}`}
                  x={sw.x}
                  y={sw.y}
                  width={sw.w}
                  height={sw.h}
                  fill="#182032"
                />
              ))}

              {districtData.roads.map((road, idx) => (
                <rect
                  key={`rd-${idx}`}
                  x={road.x}
                  y={road.y}
                  width={road.w}
                  height={road.h}
                  fill="#101726"
                />
              ))}

              {districtData.turboStrips.map((ts) => (
                <rect
                  key={ts.id}
                  x={ts.x}
                  y={ts.y}
                  width={ts.w}
                  height={ts.h}
                  fill="#00F5FF"
                  fillOpacity={0.55}
                />
              ))}

              {districtData.stuntRamps.map((rm) => (
                <rect
                  key={rm.id}
                  x={rm.x}
                  y={rm.y}
                  width={rm.w}
                  height={rm.h}
                  fill="#FFD166"
                  fillOpacity={0.75}
                />
              ))}

              {districtData.rivers.map((rv, idx) => (
                <rect
                  key={`rv-${idx}`}
                  x={rv.x}
                  y={rv.y}
                  width={rv.w}
                  height={rv.h}
                  fill="#0B3B60"
                  stroke="#00F5FF"
                  strokeWidth={4}
                  strokeOpacity={0.4}
                />
              ))}

              {districtData.bridges.map((br, idx) => (
                <rect
                  key={`br-${idx}`}
                  x={br.x}
                  y={br.y}
                  width={br.w}
                  height={br.h}
                  fill="#28354C"
                  stroke="#FFD166"
                  strokeWidth={5}
                  strokeOpacity={0.85}
                />
              ))}

              {districtData.mountains.map((mt) => (
                <g key={mt.id}>
                  <rect
                    x={mt.x}
                    y={mt.y}
                    width={mt.w}
                    height={mt.h}
                    fill="#263147"
                    stroke="#52658A"
                    strokeWidth={5}
                  />
                  <rect
                    x={mt.x + 24}
                    y={mt.y + 24}
                    width={Math.max(20, mt.w - 48)}
                    height={Math.max(20, mt.h - 48)}
                    fill="#394B6D"
                  />
                  <text
                    x={mt.x + mt.w / 2}
                    y={mt.y + mt.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#E2E8F0"
                    fontSize="24"
                    fontFamily="'Noto Sans SC', sans-serif"
                    fontWeight="700"
                  >
                    {mt.name}
                  </text>
                </g>
              ))}

              <rect
                x={districtData.parkingLot.x}
                y={districtData.parkingLot.y}
                width={districtData.parkingLot.w}
                height={districtData.parkingLot.h}
                fill="#0D1320"
                stroke="#FFD166"
                strokeWidth={4}
              />

              {districtData.buildings.map((b) => (
                <g key={b.id}>
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill="#20283A"
                    stroke={b.accentHex}
                    strokeWidth={4}
                  />
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#CBD5E1"
                    fontSize="22"
                    fontFamily="'Noto Sans SC', sans-serif"
                    fontWeight="700"
                  >
                    {b.label}
                  </text>
                </g>
              ))}

              {districtData.landmarks.map((lm) => (
                <g key={lm.id}>
                  <circle cx={lm.x} cy={lm.y} r={18} fill={lm.accentColor} fillOpacity={0.9} />
                  <circle cx={lm.x} cy={lm.y} r={28} fill="none" stroke={lm.accentColor} strokeWidth={3} />
                </g>
              ))}

              {playMode === 'sandbox' &&
                exploration.chipMarkers.map((cm, idx) => (
                  <polygon
                    key={`chip-${idx}`}
                    points={`${cm.x},${cm.y - 22} ${cm.x + 22},${cm.y} ${cm.x},${cm.y + 22} ${cm.x - 22},${cm.y}`}
                    fill="#C000FF"
                    stroke="#00F5FF"
                    strokeWidth={5}
                  />
                ))}

              {playMode === 'sandbox' && wantedLevel > 0 && !spotted && lastKnownPos && (
                <circle
                  cx={lastKnownPos.x}
                  cy={lastKnownPos.y}
                  r={72}
                  fill="#FF4545"
                  fillOpacity={0.14}
                  stroke="#FF4545"
                  strokeWidth={5}
                  strokeDasharray="16 12"
                />
              )}

              {playMode === 'sandbox' &&
                policeMarkers.map((pm) => {
                  const isHostile = pm.state !== 'PATROL';
                  return (
                    <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                      {isHostile && (
                        <circle r={30} fill="none" stroke="#FF4545" strokeWidth={4} />
                      )}
                      <rect
                        x={-14}
                        y={-14}
                        width={28}
                        height={28}
                        fill={isHostile ? '#FF4545' : '#38BDF8'}
                        stroke="#080D18"
                        strokeWidth={4}
                      />
                    </g>
                  );
                })}

              {playMode === 'horde' &&
                horde.enemyMarkers.map((em, idx) => (
                  <rect
                    key={`em-${idx}`}
                    x={em.x - (em.isBoss ? 24 : 14)}
                    y={em.y - (em.isBoss ? 24 : 14)}
                    width={em.isBoss ? 48 : 28}
                    height={em.isBoss ? 48 : 28}
                    fill={em.isBoss ? '#FFD166' : '#FF2E88'}
                    stroke="#080D18"
                    strokeWidth={4}
                  />
                ))}

              {playMode === 'sandbox' && activeMission?.targetPos && (
                <g transform={`translate(${activeMission.targetPos.x}, ${activeMission.targetPos.y})`}>
                  <circle r={44} fill="#FFD166" fillOpacity={0.22} stroke="#FFD166" strokeWidth={5} />
                  <polygon points="0,-24 22,0 0,24 -22,0" fill="#FFD166" stroke="#080D18" strokeWidth={4} />
                </g>
              )}

              {playMode === 'race' && race.active && race.targetPos && (
                <g transform={`translate(${race.targetPos.x}, ${race.targetPos.y})`}>
                  <circle r={58} fill="#FFD166" fillOpacity={0.28} stroke="#00F5FF" strokeWidth={7} />
                  <polygon points="0,-28 24,0 0,28 -24,0" fill="#FFD166" stroke="#080D18" strokeWidth={5} />
                </g>
              )}

              <g transform={`translate(${playerX}, ${playerY}) rotate(${facingDeg})`}>
                <polygon points="40,0 -24,-24 -12,0 -24,24" fill="#00F5FF" stroke="#080D18" strokeWidth={5} />
              </g>
            </svg>
          </div>

          <div className="flex flex-col justify-between gap-4 border border-slate-800 bg-[#111827] p-3.5">
            <div className="space-y-2.5">
              {playMode === 'sandbox' && (
                <div className="border border-[#C000FF]/50 bg-[#080D18] p-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#C000FF]">
                    <span>霓虹数据芯片收集</span>
                    <span className="font-mono-tabular">
                      {exploration.chipsCollected}/{exploration.totalChips}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    地图紫色菱形标记未拾取的数据芯片，集齐 10 枚额外奖 $1,000。
                  </p>
                </div>
              )}

              {playMode === 'sandbox' && activeMission && (
                <div className="border border-[#FFD166]/60 bg-[#080D18] p-2.5 text-xs">
                  <div className="font-bold text-[#FFD166]">当前委托：{activeMission.title}</div>
                  <div className="mt-1 text-[11px] leading-snug text-slate-300">
                    {activeMission.instruction}
                  </div>
                </div>
              )}

              {playMode === 'race' && race.active && race.targetLabel && (
                <div className="border border-[#FFD166]/60 bg-[#080D18] p-2.5 text-xs">
                  <div className="font-bold text-[#FFD166]">
                    下一检查点 ({race.checkpointIndex + 1}/{race.totalCheckpoints})
                  </div>
                  <div className="mt-1 text-[11px] text-slate-200">{race.targetLabel}</div>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-300">
                  核心地标（{districtData.landmarks.length} 处）
                </h3>
                <ul className="max-h-[260px] space-y-2 overflow-y-auto pr-1 text-xs">
                  {districtData.landmarks.map((lm) => (
                    <li key={lm.id} className="border-b border-slate-800/80 pb-1.5 last:border-none">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100">{lm.name}</span>
                        <span
                          className="inline-block h-2.5 w-2.5"
                          style={{ backgroundColor: lm.accentColor }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400">{lm.category}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400">
                五大连通城区
              </h3>
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                {CITY_DISTRICTS.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <span className={d.name === districtName ? 'font-bold text-[#00F5FF]' : ''}>
                      {d.name}
                    </span>
                    <span className="font-mono-tabular text-slate-500">{d.direction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
