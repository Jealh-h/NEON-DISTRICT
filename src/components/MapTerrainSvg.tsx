import { WORLD_CONFIG } from '../game/config/BalanceConfig';
import type { DistrictData, MountainDef } from '../game/world/DistrictManager';

interface MapTerrainSvgProps {
  districtData: DistrictData;
  showLabels?: boolean;
}

function renderMountainPeaks(mt: MountainDef, showLabels: boolean) {
  // Special centerpiece: Obsidian Active Volcano with glowing caldera & branching lava rivers
  if (mt.biome === 'volcano') {
    const cx = mt.x + mt.w / 2;
    const cy = mt.y + mt.h / 2;
    const left = mt.x + 12;
    const right = mt.x + mt.w - 12;
    const bottom = mt.y + mt.h - 14;
    const top = mt.y + 42;
    return (
      <g key={mt.id}>
        {/* Obsidian Volcano Cone */}
        <polygon
          points={`${left},${bottom} ${cx - 48},${top} ${cx + 48},${top} ${right},${bottom}`}
          fill="#261A29"
          stroke="#0B0812"
          strokeWidth={6}
        />
        {/* Sunlit Left Slope */}
        <polygon
          points={`${left + 8},${bottom - 4} ${cx - 46},${top + 4} ${cx},${top + 4} ${cx - 20},${bottom - 4}`}
          fill="#3E2A3D"
        />
        {/* 3 Branching Lava Rivers */}
        <polyline
          points={`${cx},${top + 14} ${cx - 18},${cy - 28} ${cx - 42},${cy + 40} ${cx - 66},${bottom - 18}`}
          fill="none"
          stroke="#F97316"
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`${cx},${top + 14} ${cx + 10},${cy - 10} ${cx - 6},${cy + 64} ${cx + 12},${bottom - 14}`}
          fill="none"
          stroke="#FACC15"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`${cx + 18},${top + 18} ${cx + 58},${cy + 14} ${cx + 84},${cy + 88} ${cx + 108},${bottom - 20}`}
          fill="none"
          stroke="#F97316"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glowing Caldera Rim */}
        <ellipse cx={cx} cy={top + 8} rx={52} ry={20} fill="#DC2626" stroke="#F97316" strokeWidth={6} />
        <ellipse cx={cx} cy={top + 8} rx={30} ry={10} fill="#FEF08A" />
        {showLabels && (
          <text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FEF08A"
            stroke="#080D18"
            strokeWidth={6}
            paintOrder="stroke"
            fontSize="26"
            fontFamily="'Noto Sans SC', sans-serif"
            fontWeight="700"
          >
            {mt.name}
          </text>
        )}
      </g>
    );
  }

  // Subdivide larger ranges into packed multi-peak silhouettes
  const cols = Math.max(1, Math.round(mt.w / 140));
  const rows = Math.max(1, Math.round(mt.h / 160));
  const cellW = mt.w / cols;
  const cellH = mt.h / rows;
  const peaks: Array<{ x: number; y: number; w: number; h: number }> = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const stagger = r % 2 === 1 && cols > 1 ? 10 : -8;
      peaks.push({
        x: mt.x + c * cellW + (c === 0 ? 4 : stagger),
        y: mt.y + r * cellH + 6,
        w: cellW - 4,
        h: cellH - 8,
      });
    }
  }

  return (
    <g key={mt.id}>
      {peaks.map((pk, idx) => {
        const px0 = pk.x;
        const px1 = pk.x + pk.w;
        const pcx = pk.x + pk.w * 0.5;
        const pyTop = pk.y + 4;
        const pyBot = pk.y + pk.h;

        if (mt.biome === 'desert') {
          // Terraced Red-Rock Canyon Mesa (Flat-Topped)
          const topInset = pk.w * 0.24;
          const midInset = pk.w * 0.12;
          const pyMid = pk.y + pk.h * 0.52;
          return (
            <g key={`${mt.id}-p-${idx}`}>
              <polygon
                points={`${px0},${pyBot} ${px0 + midInset},${pyMid} ${px1 - midInset},${pyMid} ${px1},${pyBot}`}
                fill="#9A3412"
                stroke="#291208"
                strokeWidth={4}
              />
              <polygon
                points={`${px0 + midInset * 0.8},${pyMid + 4} ${px0 + topInset},${pyTop + 14} ${px1 - topInset},${pyTop + 14} ${px1 - midInset * 0.8},${pyMid + 4}`}
                fill="#D97706"
                stroke="#451A03"
                strokeWidth={4}
              />
              <polygon
                points={`${px0 + topInset},${pyTop + 14} ${px0 + topInset + 10},${pyTop} ${px1 - topInset - 10},${pyTop} ${px1 - topInset},${pyTop + 14}`}
                fill="#FCD34D"
              />
            </g>
          );
        }

        if (mt.biome === 'volcano') {
          // Dark volcanic coastal crag with glowing lava vein
          return (
            <g key={`${mt.id}-p-${idx}`}>
              <polygon
                points={`${px0},${pyBot} ${pcx},${pyTop} ${px1},${pyBot}`}
                fill="#291B2C"
                stroke="#0F0914"
                strokeWidth={4}
              />
              <polygon
                points={`${px0 + 4},${pyBot - 4} ${pcx},${pyTop + 4} ${pcx - 4},${pyBot - 4}`}
                fill="#402944"
              />
              <polyline
                points={`${pcx},${pyTop + 18} ${pcx - 10},${pyTop + pk.h * 0.52} ${pcx + 8},${pyBot - 12}`}
                fill="none"
                stroke="#F97316"
                strokeWidth={6}
                strokeLinecap="round"
              />
            </g>
          );
        }

        if (mt.biome === 'forest') {
          // Deep Emerald Highland Ridge
          return (
            <g key={`${mt.id}-p-${idx}`}>
              <polygon
                points={`${px0},${pyBot} ${pcx},${pyTop} ${px1},${pyBot}`}
                fill="#14532D"
                stroke="#072617"
                strokeWidth={4}
              />
              <polygon
                points={`${px0 + 4},${pyBot - 4} ${pcx},${pyTop + 4} ${pcx},${pyBot - 4}`}
                fill="#228B57"
              />
              <polygon
                points={`${pcx - pk.w * 0.18},${pyTop + pk.h * 0.35} ${pcx},${pyTop} ${pcx + pk.w * 0.18},${pyTop + pk.h * 0.35}`}
                fill="#4ADE80"
              />
            </g>
          );
        }

        // Alpine Snow Peak with jagged glacial snowcap
        const snowY = pyTop + pk.h * 0.42;
        return (
          <g key={`${mt.id}-p-${idx}`}>
            <polygon
              points={`${px0},${pyBot} ${pcx},${pyTop} ${px1},${pyBot}`}
              fill="#334155"
              stroke="#0F172A"
              strokeWidth={4}
            />
            <polygon
              points={`${px0 + 4},${pyBot - 4} ${pcx},${pyTop + 4} ${pcx},${pyBot - 4}`}
              fill="#64748B"
            />
            <polygon
              points={`${pcx - pk.w * 0.24},${snowY} ${pcx},${pyTop} ${pcx + pk.w * 0.24},${snowY} ${pcx + pk.w * 0.08},${snowY - 12} ${pcx},${snowY + 6} ${pcx - pk.w * 0.08},${snowY - 10}`}
              fill="#F1F5F9"
            />
          </g>
        );
      })}

      {showLabels && (
        <text
          x={mt.x + mt.w / 2}
          y={mt.y + mt.h / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#F8FAFC"
          stroke="#080D18"
          strokeWidth={6}
          paintOrder="stroke"
          fontSize="24"
          fontFamily="'Noto Sans SC', sans-serif"
          fontWeight="700"
        >
          {mt.name}
        </text>
      )}
    </g>
  );
}

export function MapTerrainSvg({ districtData, showLabels = false }: MapTerrainSvgProps) {
  return (
    <>
      {/* Base Lush Backdrop */}
      <rect x={0} y={0} width={WORLD_CONFIG.WIDTH} height={WORLD_CONFIG.HEIGHT} fill="#101828" />

      {/* Snow Alps */}
      {districtData.snowZones.map((zn, idx) => (
        <rect
          key={`sn-${idx}`}
          x={zn.x}
          y={zn.y}
          width={zn.w}
          height={zn.h}
          fill="#25436B"
          stroke="#93C5FD"
          strokeOpacity={0.25}
          strokeWidth={4}
        />
      ))}

      {/* Desert Canyons */}
      {districtData.desertZones.map((zn, idx) => (
        <rect
          key={`ds-${idx}`}
          x={zn.x}
          y={zn.y}
          width={zn.w}
          height={zn.h}
          fill="#854D0E"
          stroke="#F59E0B"
          strokeOpacity={0.25}
          strokeWidth={4}
        />
      ))}

      {/* Volcanic Obsidian Valley & Glowing Magma Rivers */}
      {districtData.volcanoZones.map((zn, idx) => (
        <rect
          key={`vl-${idx}`}
          x={zn.x}
          y={zn.y}
          width={zn.w}
          height={zn.h}
          fill="#1B1322"
        />
      ))}
      {districtData.lavaZones.map((lv, idx) => (
        <rect
          key={`lv-${idx}`}
          x={lv.x}
          y={lv.y}
          width={lv.w}
          height={lv.h}
          fill="#F97316"
          stroke="#FEF08A"
          strokeWidth={4}
          strokeOpacity={0.75}
        />
      ))}

      {/* Harbor Docks */}
      {districtData.docks.map((dk, idx) => (
        <rect
          key={`dk-${idx}`}
          x={dk.x}
          y={dk.y}
          width={dk.w}
          height={dk.h}
          fill="#1E293B"
        />
      ))}

      {/* Riverside Parks & Emerald Forests */}
      {districtData.parks.map((pk, idx) => (
        <rect
          key={`pk-${idx}`}
          x={pk.x}
          y={pk.y}
          width={pk.w}
          height={pk.h}
          fill="#14532D"
          stroke="#22C55E"
          strokeOpacity={0.25}
          strokeWidth={4}
        />
      ))}

      {/* Golden Sandy Beaches */}
      {districtData.sandZones.map((sd, idx) => (
        <rect
          key={`sd-${idx}`}
          x={sd.x}
          y={sd.y}
          width={sd.w}
          height={sd.h}
          fill="#E5A93B"
          stroke="#FDE68A"
          strokeWidth={4}
          strokeOpacity={0.7}
        />
      ))}

      {/* Sidewalks (Urban Districts) */}
      {districtData.sidewalks.map((sw, idx) => (
        <rect
          key={`sw-${idx}`}
          x={sw.x}
          y={sw.y}
          width={sw.w}
          height={sw.h}
          fill="#192236"
        />
      ))}

      {/* Skyport Runways & Helipads */}
      {districtData.runways.map((rw, idx) => (
        <g key={`rw-${idx}`}>
          <rect
            x={rw.x}
            y={rw.y}
            width={rw.w}
            height={rw.h}
            fill="#1E293B"
            stroke="#00F5FF"
            strokeWidth={5}
            strokeOpacity={0.65}
          />
          <line
            x1={rw.x + 28}
            y1={rw.y + rw.h / 2}
            x2={rw.x + rw.w - 28}
            y2={rw.y + rw.h / 2}
            stroke="#E2E8F0"
            strokeWidth={6}
            strokeDasharray="28 18"
            strokeOpacity={0.75}
          />
        </g>
      ))}
      {districtData.helipads.map((hp, idx) => (
        <g key={`hp-${idx}`} transform={`translate(${hp.x}, ${hp.y})`}>
          <circle r={24} fill="#141A26" stroke="#FFD166" strokeWidth={4} />
          <text
            x={0}
            y={7}
            textAnchor="middle"
            fill="#FFD166"
            fontSize="22"
            fontWeight="800"
            fontFamily="monospace"
          >
            H
          </text>
        </g>
      ))}

      {/* Central Neon Plaza Holographic Mandala */}
      <g transform={`translate(${districtData.plazaCenter.x}, ${districtData.plazaCenter.y})`}>
        <circle r={60} fill="#1E1B4B" stroke="#00F5FF" strokeWidth={5} />
        <circle r={38} fill="none" stroke="#FF2E88" strokeWidth={4} strokeDasharray="14 8" />
        <circle r={16} fill="#38BDF8" />
      </g>

      {/* Vibrant Coastal Shallow Halos + Deep Cobalt Rivers & Ocean */}
      {districtData.rivers.map((rv, idx) => (
        <rect
          key={`rv-halo-${idx}`}
          x={rv.x - 10}
          y={rv.y - 10}
          width={rv.w + 20}
          height={rv.h + 20}
          fill="none"
          stroke="#06B6D4"
          strokeWidth={18}
          strokeOpacity={0.38}
        />
      ))}
      {districtData.rivers.map((rv, idx) => (
        <rect
          key={`rv-${idx}`}
          x={rv.x}
          y={rv.y}
          width={rv.w}
          height={rv.h}
          fill="#074B83"
          stroke="#38BDF8"
          strokeWidth={6}
          strokeOpacity={0.75}
        />
      ))}

      {/* Cascading Waterfalls */}
      {districtData.waterfalls.map((wf, idx) => (
        <g key={`wf-${idx}`}>
          <rect
            x={wf.x}
            y={wf.y}
            width={wf.w}
            height={wf.h}
            fill="#67E8F9"
            stroke="#FFFFFF"
            strokeWidth={5}
          />
        </g>
      ))}

      {/* Asphalt Roads */}
      {districtData.roads.map((road, idx) => (
        <rect
          key={`rd-${idx}`}
          x={road.x}
          y={road.y}
          width={road.w}
          height={road.h}
          fill="#111827"
          stroke="#334155"
          strokeWidth={3}
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
          fillOpacity={0.7}
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
          fill="#FACC15"
          fillOpacity={0.85}
        />
      ))}

      {/* Bridges with Suspension Cables & Golden Rails */}
      {districtData.bridges.map((br, idx) => (
        <g key={`br-${idx}`}>
          <rect
            x={br.x}
            y={br.y}
            width={br.w}
            height={br.h}
            fill="#334155"
            stroke="#FACC15"
            strokeWidth={7}
          />
          <line
            x1={br.x + 12}
            y1={br.y + br.h / 2}
            x2={br.x + br.w - 12}
            y2={br.y + br.h / 2}
            stroke="#00F5FF"
            strokeWidth={4}
            strokeDasharray="16 10"
          />
        </g>
      ))}

      {/* Multi-Peak Pixel Mountains & Volcano */}
      {districtData.mountains.map((mt) => renderMountainPeaks(mt, showLabels))}

      {/* Dense Canopy Dots across Tree Props */}
      {districtData.props
        .filter((p) => p.type.startsWith('tree_'))
        .map((tree, idx) => {
          const fill =
            tree.type === 'tree_sakura'
              ? '#F472B6'
              : tree.type === 'tree_snow'
                ? '#E0F2FE'
                : tree.type === 'tree_autumn'
                  ? '#F59E0B'
                  : tree.type === 'tree_palm'
                    ? '#4ADE80'
                    : '#22C55E';
          return (
            <circle
              key={`tr-${idx}`}
              cx={tree.x}
              cy={tree.y}
              r={tree.type === 'tree_palm' ? 14 : 16}
              fill={fill}
              stroke="#052E16"
              strokeWidth={4}
            />
          );
        })}

      {/* Parking Lot */}
      <rect
        x={districtData.parkingLot.x}
        y={districtData.parkingLot.y}
        width={districtData.parkingLot.w}
        height={districtData.parkingLot.h}
        fill="#0F172A"
        stroke="#FACC15"
        strokeWidth={6}
      />

      {/* Distinct 2.5D Buildings */}
      {districtData.buildings.map((b) => (
        <g key={b.id}>
          {b.roofStyle === 'stadium' ? (
            <g>
              <ellipse
                cx={b.x + b.w / 2}
                cy={b.y + b.h / 2}
                rx={b.w / 2}
                ry={b.h / 2}
                fill="#1E293B"
                stroke={b.accentHex}
                strokeWidth={7}
              />
              <ellipse
                cx={b.x + b.w / 2}
                cy={b.y + b.h / 2}
                rx={b.w / 3}
                ry={b.h / 3}
                fill="#15803D"
                stroke="#00F5FF"
                strokeWidth={4}
              />
            </g>
          ) : b.roofStyle === 'lighthouse' ? (
            <g>
              <circle
                cx={b.x + b.w / 2}
                cy={b.y + b.h / 2}
                r={44}
                fill="#FACC15"
                fillOpacity={0.22}
              />
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="#F8FAFC"
                stroke="#EF4444"
                strokeWidth={7}
              />
            </g>
          ) : b.roofStyle === 'police' ? (
            <g>
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                fill="#1E3A8A"
                stroke="#38BDF8"
                strokeWidth={6}
              />
              <rect x={b.x + 12} y={b.y + 8} width={22} height={14} fill="#EF4444" />
              <rect x={b.x + b.w - 34} y={b.y + 8} width={22} height={14} fill="#38BDF8" />
            </g>
          ) : (
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="#1E293B"
              stroke={b.accentHex}
              strokeWidth={6}
            />
          )}

          {showLabels && (
            <text
              x={b.x + b.w / 2}
              y={b.y + b.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#F1F5F9"
              stroke="#080D18"
              strokeWidth={5}
              paintOrder="stroke"
              fontSize="21"
              fontFamily="'Noto Sans SC', sans-serif"
              fontWeight="700"
            >
              {b.label}
            </text>
          )}
        </g>
      ))}
    </>
  );
}
