import { useId } from 'react';
import { WORLD_CONFIG } from '../game/config/BalanceConfig';
import type { BuildingDef, DistrictData, MountainDef } from '../game/world/DistrictManager';

interface MapTerrainSvgProps {
  districtData: DistrictData;
  showLabels?: boolean;
}

const COMIC_INK = '#05070E';

function renderMountainPeaks(mt: MountainDef, showLabels: boolean, hatchPatternId: string) {
  // Special centerpiece: Obsidian Active Volcano with glowing caldera, halftone smoke & branching lava rivers
  if (mt.biome === 'volcano') {
    const cx = mt.x + mt.w / 2;
    const cy = mt.y + mt.h / 2;
    const left = mt.x + 10;
    const right = mt.x + mt.w - 10;
    const bottom = mt.y + mt.h - 14;
    const top = mt.y + 40;
    return (
      <g key={mt.id}>
        {/* Hard comic cast shadow */}
        <polygon
          points={`${left + 18},${bottom + 14} ${cx - 34},${top + 16} ${cx + 62},${top + 16} ${right + 18},${bottom + 14}`}
          fill={COMIC_INK}
          fillOpacity={0.78}
        />
        {/* Obsidian Volcano Cone */}
        <polygon
          points={`${left},${bottom} ${cx - 50},${top} ${cx + 50},${top} ${right},${bottom}`}
          fill="#26172E"
          stroke={COMIC_INK}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        {/* Cel-shaded sunlit left slope */}
        <polygon
          points={`${left + 8},${bottom - 5} ${cx - 46},${top + 5} ${cx},${top + 5} ${cx - 18},${bottom - 5}`}
          fill="#4A2B52"
        />
        {/* Comic crosshatch right shadow slope */}
        <polygon
          points={`${cx},${top + 5} ${cx + 46},${top + 5} ${right - 8},${bottom - 5} ${cx - 18},${bottom - 5}`}
          fill={`url(#${hatchPatternId})`}
          fillOpacity={0.65}
        />
        {/* 3 Branching Molten Lava Rivers with bold ink borders */}
        <polyline
          points={`${cx},${top + 14} ${cx - 18},${cy - 28} ${cx - 42},${cy + 40} ${cx - 66},${bottom - 18}`}
          fill="none"
          stroke={COMIC_INK}
          strokeWidth={20}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`${cx},${top + 14} ${cx - 18},${cy - 28} ${cx - 42},${cy + 40} ${cx - 66},${bottom - 18}`}
          fill="none"
          stroke="#F97316"
          strokeWidth={13}
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
          stroke={COMIC_INK}
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={`${cx + 18},${top + 18} ${cx + 58},${cy + 14} ${cx + 84},${cy + 88} ${cx + 108},${bottom - 20}`}
          fill="none"
          stroke="#F97316"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glowing Caldera Rim */}
        <ellipse cx={cx} cy={top + 8} rx={54} ry={22} fill="#DC2626" stroke={COMIC_INK} strokeWidth={7} />
        <ellipse cx={cx} cy={top + 8} rx={38} ry={14} fill="#F97316" />
        <ellipse cx={cx} cy={top + 8} rx={24} ry={8} fill="#FEF08A" />
        {/* Comic Smoke Puffs */}
        <circle cx={cx - 16} cy={top - 22} r={16} fill="#475569" stroke={COMIC_INK} strokeWidth={5} />
        <circle cx={cx + 10} cy={top - 32} r={20} fill="#64748B" stroke={COMIC_INK} strokeWidth={5} />
        {showLabels && (
          <text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FEF08A"
            stroke={COMIC_INK}
            strokeWidth={7}
            paintOrder="stroke"
            fontSize="26"
            fontFamily="'Noto Sans SC', sans-serif"
            fontWeight="900"
          >
            {mt.name}
          </text>
        )}
      </g>
    );
  }

  // Subdivide larger ranges into packed multi-peak comic-inked silhouettes
  const cols = Math.max(1, Math.round(mt.w / 136));
  const rows = Math.max(1, Math.round(mt.h / 150));
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
          // Terraced Red-Rock Canyon Mesa with bold comic ink lines
          const topInset = pk.w * 0.24;
          const midInset = pk.w * 0.12;
          const pyMid = pk.y + pk.h * 0.52;
          return (
            <g key={`${mt.id}-p-${idx}`}>
              <polygon
                points={`${px0 + 10},${pyBot + 8} ${px0 + midInset + 10},${pyMid + 8} ${px1 - midInset + 10},${pyMid + 8} ${px1 + 10},${pyBot + 8}`}
                fill={COMIC_INK}
                fillOpacity={0.55}
              />
              <polygon
                points={`${px0},${pyBot} ${px0 + midInset},${pyMid} ${px1 - midInset},${pyMid} ${px1},${pyBot}`}
                fill="#9A3412"
                stroke={COMIC_INK}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <polygon
                points={`${px0 + midInset * 0.8},${pyMid + 4} ${px0 + topInset},${pyTop + 14} ${px1 - topInset},${pyTop + 14} ${px1 - midInset * 0.8},${pyMid + 4}`}
                fill="#EA580C"
                stroke={COMIC_INK}
                strokeWidth={5}
                strokeLinejoin="round"
              />
              <polygon
                points={`${px0 + topInset},${pyTop + 14} ${px0 + topInset + 10},${pyTop} ${px1 - topInset - 10},${pyTop} ${px1 - topInset},${pyTop + 14}`}
                fill="#FCD34D"
                stroke={COMIC_INK}
                strokeWidth={4}
              />
            </g>
          );
        }

        if (mt.biome === 'forest') {
          return (
            <g key={`${mt.id}-p-${idx}`}>
              <polygon
                points={`${px0},${pyBot} ${pcx},${pyTop} ${px1},${pyBot}`}
                fill="#14532D"
                stroke={COMIC_INK}
                strokeWidth={6}
                strokeLinejoin="round"
              />
              <polygon
                points={`${px0 + 4},${pyBot - 4} ${pcx},${pyTop + 5} ${pcx},${pyBot - 4}`}
                fill="#228B57"
              />
              <polygon
                points={`${pcx},${pyTop + 5} ${px1 - 4},${pyBot - 4} ${pcx},${pyBot - 4}`}
                fill={`url(#${hatchPatternId})`}
                fillOpacity={0.55}
              />
              <polygon
                points={`${pcx - pk.w * 0.18},${pyTop + pk.h * 0.35} ${pcx},${pyTop + 2} ${pcx + pk.w * 0.18},${pyTop + pk.h * 0.35}`}
                fill="#4ADE80"
                stroke={COMIC_INK}
                strokeWidth={4}
              />
            </g>
          );
        }

        // Alpine Snow Peak with jagged glacial snowcap & bold comic shading
        const snowY = pyTop + pk.h * 0.44;
        return (
          <g key={`${mt.id}-p-${idx}`}>
            <polygon
              points={`${px0 + 10},${pyBot + 8} ${pcx + 10},${pyTop + 8} ${px1 + 10},${pyBot + 8}`}
              fill={COMIC_INK}
              fillOpacity={0.55}
            />
            <polygon
              points={`${px0},${pyBot} ${pcx},${pyTop} ${px1},${pyBot}`}
              fill="#1E293B"
              stroke={COMIC_INK}
              strokeWidth={6}
              strokeLinejoin="round"
            />
            <polygon
              points={`${px0 + 4},${pyBot - 4} ${pcx},${pyTop + 5} ${pcx},${pyBot - 4}`}
              fill="#64748B"
            />
            <polygon
              points={`${pcx},${pyTop + 5} ${px1 - 4},${pyBot - 4} ${pcx},${pyBot - 4}`}
              fill={`url(#${hatchPatternId})`}
              fillOpacity={0.55}
            />
            <polygon
              points={`${pcx - pk.w * 0.25},${snowY} ${pcx},${pyTop + 2} ${pcx + pk.w * 0.25},${snowY} ${pcx + pk.w * 0.08},${snowY - 12} ${pcx},${snowY + 6} ${pcx - pk.w * 0.08},${snowY - 10}`}
              fill="#F8FAFC"
              stroke={COMIC_INK}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            {/* Sunlit blue shadow facet on right half of snowcap */}
            <polygon
              points={`${pcx},${pyTop + 4} ${pcx + pk.w * 0.23},${snowY - 2} ${pcx + pk.w * 0.08},${snowY - 11} ${pcx},${snowY + 5}`}
              fill="#93C5FD"
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
          stroke={COMIC_INK}
          strokeWidth={7}
          paintOrder="stroke"
          fontSize="24"
          fontFamily="'Noto Sans SC', sans-serif"
          fontWeight="900"
        >
          {mt.name}
        </text>
      )}
    </g>
  );
}

function renderComicBuilding(
  b: BuildingDef,
  showLabels: boolean,
  hatchId: string,
  cyanDotId: string
) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;

  if (b.roofStyle === 'stadium') {
    return (
      <g key={b.id}>
        <ellipse cx={cx + 16} cy={cy + 18} rx={b.w / 2} ry={b.h / 2} fill={COMIC_INK} fillOpacity={0.78} />
        <ellipse
          cx={cx}
          cy={cy + 10}
          rx={b.w / 2}
          ry={b.h / 2}
          fill="#0F172A"
          stroke={COMIC_INK}
          strokeWidth={7}
        />
        <ellipse
          cx={cx}
          cy={cy - 8}
          rx={b.w / 2}
          ry={b.h / 2}
          fill="#1E2B4A"
          stroke={b.accentHex}
          strokeWidth={7}
        />
        <ellipse
          cx={cx}
          cy={cy - 8}
          rx={b.w * 0.41}
          ry={b.h * 0.4}
          fill="#2D3D63"
          stroke={COMIC_INK}
          strokeWidth={4}
        />
        <ellipse
          cx={cx}
          cy={cy - 8}
          rx={b.w / 3}
          ry={b.h / 3}
          fill="#15803D"
          stroke="#4ADE80"
          strokeWidth={5}
        />
        <line
          x1={cx}
          y1={cy - 8 - b.h / 3}
          x2={cx}
          y2={cy - 8 + b.h / 3}
          stroke="#DCFCE7"
          strokeWidth={3}
        />
        <circle cx={cx} cy={cy - 8} r={16} fill="none" stroke="#DCFCE7" strokeWidth={3} />
        {showLabels && (
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#F8FAFC"
            stroke={COMIC_INK}
            strokeWidth={6}
            paintOrder="stroke"
            fontSize="22"
            fontFamily="'Noto Sans SC', sans-serif"
            fontWeight="900"
          >
            {b.label}
          </text>
        )}
      </g>
    );
  }

  if (b.roofStyle === 'lighthouse') {
    return (
      <g key={b.id}>
        {/* Comic searchlight cone */}
        <polygon
          points={`${cx},${cy - 10} ${cx + 120},${cy - 65} ${cx + 140},${cy + 20}`}
          fill="#FACC15"
          fillOpacity={0.22}
        />
        <rect
          x={b.x + 10}
          y={b.y + 10}
          width={b.w}
          height={b.h}
          fill={COMIC_INK}
          fillOpacity={0.75}
        />
        <rect
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="#F8FAFC"
          stroke={COMIC_INK}
          strokeWidth={6}
        />
        <rect x={b.x + 4} y={b.y + 8} width={b.w - 8} height={12} fill="#EF4444" />
        <circle cx={cx} cy={cy - 6} r={18} fill="#FACC15" stroke={COMIC_INK} strokeWidth={5} />
        {showLabels && (
          <text
            x={cx}
            y={b.y + b.h + 18}
            textAnchor="middle"
            fill="#FEF08A"
            stroke={COMIC_INK}
            strokeWidth={5}
            paintOrder="stroke"
            fontSize="19"
            fontFamily="'Noto Sans SC', sans-serif"
            fontWeight="900"
          >
            {b.label}
          </text>
        )}
      </g>
    );
  }

  // Standard 2.5D Comic-Inked Extruded Building
  const extrude =
    b.roofStyle === 'tech' || b.roofStyle === 'police'
      ? 34
      : b.roofStyle === 'factory' || b.roofStyle === 'club' || b.roofStyle === 'arcade' || b.roofStyle === 'residential'
        ? 24
        : 16;
  const eastW = b.h >= 80 ? 14 : 10;
  const roofTopY = b.y - extrude;
  const roofDeckH = Math.max(24, b.h - 12);
  const roofBotY = roofTopY + roofDeckH;
  const facadeH = b.y + b.h - roofBotY;
  const isCommercial =
    b.roofStyle === 'store' ||
    b.roofStyle === 'diner' ||
    b.roofStyle === 'arcade' ||
    b.roofStyle === 'club' ||
    b.roofStyle === 'booth' ||
    b.roofStyle === 'residential';

  const roofColor =
    b.roofStyle === 'police'
      ? '#1E3A8A'
      : b.roofStyle === 'factory'
        ? '#2B2420'
        : b.roofStyle === 'club' || b.roofStyle === 'arcade'
          ? '#24143B'
          : b.roofStyle === 'tech'
            ? '#132145'
            : b.roofStyle === 'container'
              ? '#0E7490'
              : '#192647';

  const frontWallColor =
    b.roofStyle === 'police' ? '#172554' : isCommercial ? '#1C1B33' : '#111A33';

  return (
    <g key={b.id}>
      {/* 1. Hard Offset Comic Drop Shadow */}
      <rect
        x={b.x + 14}
        y={b.y + 12}
        width={b.w + eastW}
        height={b.h + 4}
        fill={COMIC_INK}
        fillOpacity={0.72}
      />

      {/* 2. 2.5D Oblique East Flank Wall with comic crosshatch */}
      <polygon
        points={`${b.x + b.w},${roofTopY} ${b.x + b.w + eastW},${roofTopY + 10} ${b.x + b.w + eastW},${b.y + b.h} ${b.x + b.w},${b.y + b.h}`}
        fill="#0B1122"
        stroke={COMIC_INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <polygon
        points={`${b.x + b.w},${roofTopY} ${b.x + b.w + eastW},${roofTopY + 10} ${b.x + b.w + eastW},${b.y + b.h} ${b.x + b.w},${b.y + b.h}`}
        fill={`url(#${hatchId})`}
        fillOpacity={0.7}
      />

      {/* 3. Vertical South Front Facade */}
      <rect
        x={b.x}
        y={roofBotY}
        width={b.w}
        height={Math.max(10, facadeH)}
        fill={frontWallColor}
        stroke={COMIC_INK}
        strokeWidth={5}
      />

      {/* Facade Window Glows (warm golden-orange for storefronts, cyan for towers) */}
      {b.w >= 56 && facadeH >= 14 && (
        <g>
          <rect
            x={b.x + 10}
            y={roofBotY + 4}
            width={Math.max(10, b.w * 0.25)}
            height={Math.max(5, facadeH - 9)}
            fill={isCommercial ? '#F59E0B' : '#38BDF8'}
            stroke={COMIC_INK}
            strokeWidth={2}
          />
          <rect
            x={b.x + b.w * 0.42}
            y={roofBotY + 4}
            width={Math.max(10, b.w * 0.18)}
            height={Math.max(5, facadeH - 8)}
            fill={isCommercial ? '#FEF08A' : '#00F5FF'}
            stroke={COMIC_INK}
            strokeWidth={2}
          />
          <rect
            x={b.x + b.w - 10 - Math.max(10, b.w * 0.22)}
            y={roofBotY + 4}
            width={Math.max(10, b.w * 0.22)}
            height={Math.max(5, facadeH - 9)}
            fill={isCommercial ? '#F97316' : '#38BDF8'}
            stroke={COMIC_INK}
            strokeWidth={2}
          />
        </g>
      )}

      {/* 4. Elevated Rooftop Slab */}
      <rect
        x={b.x}
        y={roofTopY}
        width={b.w}
        height={roofDeckH}
        fill={roofColor}
        stroke={COMIC_INK}
        strokeWidth={6}
      />
      {/* Crisp Neon Roof Edge Trim */}
      <rect
        x={b.x + 4}
        y={roofTopY + 4}
        width={Math.max(8, b.w - 8)}
        height={Math.max(8, roofDeckH - 8)}
        fill="none"
        stroke={b.accentHex}
        strokeWidth={3.5}
      />
      {/* Diagonal Cel-Shaded Specular Glint Slash on Roof */}
      <polygon
        points={`${b.x + 8},${roofTopY + 8} ${b.x + Math.min(34, b.w * 0.35)},${roofTopY + 8} ${b.x + 8},${roofTopY + Math.min(28, roofDeckH * 0.6)}`}
        fill="#FFFFFF"
        fillOpacity={0.14}
      />

      {/* 5. Style-Specific Architectural Rooftop Props */}
      {b.roofStyle === 'tech' && (
        <g>
          <rect
            x={b.x + 16}
            y={roofTopY + 10}
            width={Math.max(20, b.w - 32)}
            height={Math.max(12, roofDeckH - 20)}
            fill={`url(#${cyanDotId})`}
            stroke={b.accentHex}
            strokeWidth={3}
          />
          <circle cx={cx} cy={roofTopY + roofDeckH / 2} r={8} fill="#00F5FF" stroke={COMIC_INK} strokeWidth={3} />
        </g>
      )}

      {b.roofStyle === 'factory' && (
        <g>
          <circle cx={b.x + 22} cy={roofTopY + 16} r={9} fill="#475569" stroke={COMIC_INK} strokeWidth={4} />
          <circle cx={b.x + 22} cy={roofTopY + 16} r={4} fill="#F97316" />
          <circle cx={b.x + b.w - 22} cy={roofTopY + 16} r={9} fill="#475569" stroke={COMIC_INK} strokeWidth={4} />
          <circle cx={b.x + b.w - 22} cy={roofTopY + 16} r={4} fill="#F97316" />
          <circle cx={b.x + 30} cy={roofTopY + 2} r={8} fill="#94A3B8" fillOpacity={0.7} stroke={COMIC_INK} strokeWidth={3} />
        </g>
      )}

      {b.roofStyle === 'police' && (
        <g>
          <rect x={b.x + 12} y={roofTopY + 8} width={22} height={10} fill="#EF4444" stroke={COMIC_INK} strokeWidth={3} />
          <rect x={b.x + b.w - 34} y={roofTopY + 8} width={22} height={10} fill="#38BDF8" stroke={COMIC_INK} strokeWidth={3} />
          <circle cx={cx} cy={roofTopY + roofDeckH / 2} r={14} fill="#0F172A" stroke="#38BDF8" strokeWidth={3} />
        </g>
      )}

      {(b.roofStyle === 'store' || b.roofStyle === 'diner') && (
        <g>
          <rect
            x={b.x + 6}
            y={roofBotY - 6}
            width={b.w - 12}
            height={10}
            fill={b.accentHex}
            stroke={COMIC_INK}
            strokeWidth={3}
          />
          <line
            x1={b.x + 12}
            y1={roofBotY - 1}
            x2={b.x + b.w - 12}
            y2={roofBotY - 1}
            stroke="#FFFFFF"
            strokeWidth={4}
            strokeDasharray="10 10"
          />
        </g>
      )}

      {(b.roofStyle === 'club' || b.roofStyle === 'arcade') && (
        <g>
          <rect x={b.x + 12} y={roofTopY + 12} width={Math.max(12, b.w - 24)} height={6} fill="#FF2E88" />
          <rect x={b.x + 12} y={roofBotY - 18} width={Math.max(12, b.w - 24)} height={6} fill="#00F5FF" />
        </g>
      )}

      {(b.roofStyle === 'warehouse' || b.roofStyle === 'container') && (
        <g>
          <line x1={b.x + 14} y1={roofTopY + 8} x2={b.x + 14} y2={roofBotY - 8} stroke={COMIC_INK} strokeWidth={3} />
          <line x1={cx} y1={roofTopY + 8} x2={cx} y2={roofBotY - 8} stroke={COMIC_INK} strokeWidth={3} />
          <line x1={b.x + b.w - 14} y1={roofTopY + 8} x2={b.x + b.w - 14} y2={roofBotY - 8} stroke={COMIC_INK} strokeWidth={3} />
        </g>
      )}

      {/* 6. Bold Comic Label */}
      {showLabels && (
        <text
          x={cx}
          y={roofTopY + roofDeckH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#F8FAFC"
          stroke={COMIC_INK}
          strokeWidth={6}
          paintOrder="stroke"
          fontSize="20"
          fontFamily="'Noto Sans SC', sans-serif"
          fontWeight="900"
        >
          {b.label}
        </text>
      )}
    </g>
  );
}

export function MapTerrainSvg({ districtData, showLabels = false }: MapTerrainSvgProps) {
  const rawId = useId().replace(/:/g, '');
  const hatchId = `comic-hatch-${rawId}`;
  const darkDotId = `comic-dot-dark-${rawId}`;
  const cyanDotId = `comic-dot-cyan-${rawId}`;
  const greenDotId = `comic-dot-green-${rawId}`;
  const oceanWaveId = `comic-ocean-${rawId}`;

  const boats = districtData.props.filter((p) => p.type === 'barge' || p.type === 'speedboat');
  const trees = districtData.props.filter((p) => p.type.startsWith('tree_'));

  return (
    <>
      <defs>
        {/* American Comic Ben-Day Halftone Dot & Crosshatch Patterns */}
        <pattern id={hatchId} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="16" stroke={COMIC_INK} strokeWidth="5" strokeOpacity="0.6" />
        </pattern>
        <pattern id={darkDotId} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="3" fill={COMIC_INK} fillOpacity="0.32" />
          <circle cx="15" cy="15" r="3" fill={COMIC_INK} fillOpacity="0.32" />
        </pattern>
        <pattern id={cyanDotId} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#0D1938" />
          <circle cx="6" cy="6" r="3" fill="#00F5FF" fillOpacity="0.36" />
          <circle cx="16" cy="16" r="3" fill="#C000FF" fillOpacity="0.3" />
        </pattern>
        <pattern id={greenDotId} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="3.5" fill="#4ADE80" fillOpacity="0.22" />
          <circle cx="18" cy="18" r="3.5" fill="#052E16" fillOpacity="0.35" />
        </pattern>
        <pattern id={oceanWaveId} width="96" height="48" patternUnits="userSpaceOnUse">
          <rect width="96" height="48" fill="#062958" />
          <path d="M 8 14 Q 24 6 40 14 T 72 14" fill="none" stroke="#0EA5E9" strokeWidth="3" strokeOpacity="0.34" />
          <path d="M 24 36 Q 40 28 56 36 T 88 36" fill="none" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.28" />
        </pattern>
      </defs>

      {/* Base Midnight-Indigo Comic Backdrop */}
      <rect x={0} y={0} width={WORLD_CONFIG.WIDTH} height={WORLD_CONFIG.HEIGHT} fill="#081024" />
      <rect x={0} y={0} width={WORLD_CONFIG.WIDTH} height={WORLD_CONFIG.HEIGHT} fill={`url(#${darkDotId})`} />

      {/* Snow Alps */}
      {districtData.snowZones.map((zn, idx) => (
        <g key={`sn-${idx}`}>
          <rect
            x={zn.x}
            y={zn.y}
            width={zn.w}
            height={zn.h}
            fill="#1E3F6E"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <rect x={zn.x + 12} y={zn.y + 12} width={zn.w - 24} height={zn.h - 24} fill={`url(#${darkDotId})`} />
        </g>
      ))}

      {/* Desert Canyons */}
      {districtData.desertZones.map((zn, idx) => (
        <g key={`ds-${idx}`}>
          <rect
            x={zn.x}
            y={zn.y}
            width={zn.w}
            height={zn.h}
            fill="#9A3412"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <rect
            x={zn.x + 20}
            y={zn.y + 20}
            width={zn.w - 40}
            height={zn.h - 40}
            fill="#B45309"
            stroke="#F59E0B"
            strokeOpacity={0.45}
            strokeWidth={4}
          />
          <rect x={zn.x + 20} y={zn.y + 20} width={zn.w - 40} height={zn.h - 40} fill={`url(#${darkDotId})`} />
        </g>
      ))}

      {/* Volcanic Obsidian Valley & Glowing Magma Rivers */}
      {districtData.volcanoZones.map((zn, idx) => (
        <g key={`vl-${idx}`}>
          <rect x={zn.x} y={zn.y} width={zn.w} height={zn.h} fill="#191021" stroke={COMIC_INK} strokeWidth={6} />
          <rect x={zn.x} y={zn.y} width={zn.w} height={zn.h} fill={`url(#${hatchId})`} fillOpacity={0.5} />
        </g>
      ))}
      {districtData.lavaZones.map((lv, idx) => (
        <g key={`lv-${idx}`}>
          <rect
            x={lv.x}
            y={lv.y}
            width={lv.w}
            height={lv.h}
            fill="#F97316"
            stroke={COMIC_INK}
            strokeWidth={7}
          />
          <rect x={lv.x + 8} y={lv.y + 8} width={Math.max(4, lv.w - 16)} height={Math.max(4, lv.h - 16)} fill="#FEF08A" fillOpacity={0.65} />
        </g>
      ))}

      {/* Harbor Docks with Industrial Comic Hatching */}
      {districtData.docks.map((dk, idx) => (
        <g key={`dk-${idx}`}>
          <rect
            x={dk.x}
            y={dk.y}
            width={dk.w}
            height={dk.h}
            fill="#1D263B"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <rect x={dk.x + 6} y={dk.y + 6} width={dk.w - 12} height={dk.h - 12} fill={`url(#${darkDotId})`} />
          <line
            x1={dk.x}
            y1={dk.y + dk.h - 6}
            x2={dk.x + dk.w}
            y2={dk.y + dk.h - 6}
            stroke="#FACC15"
            strokeWidth={6}
            strokeDasharray="18 14"
          />
        </g>
      ))}

      {/* Riverside Parks & Emerald Forests */}
      {districtData.parks.map((pk, idx) => (
        <g key={`pk-${idx}`}>
          <rect
            x={pk.x}
            y={pk.y}
            width={pk.w}
            height={pk.h}
            fill="#145C36"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <rect x={pk.x} y={pk.y} width={pk.w} height={pk.h} fill={`url(#${greenDotId})`} />
          {/* Park Cobblestone Path */}
          <path
            d={`M ${pk.x + 28} ${pk.y + pk.h * 0.5} Q ${pk.x + pk.w * 0.5} ${pk.y + pk.h * 0.25}, ${pk.x + pk.w - 28} ${pk.y + pk.h * 0.55}`}
            fill="none"
            stroke="#475569"
            strokeWidth={18}
            strokeLinecap="round"
          />
          <path
            d={`M ${pk.x + 28} ${pk.y + pk.h * 0.5} Q ${pk.x + pk.w * 0.5} ${pk.y + pk.h * 0.25}, ${pk.x + pk.w - 28} ${pk.y + pk.h * 0.55}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={6}
            strokeDasharray="16 14"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* Golden Sandy Beaches with Comic Parasols */}
      {districtData.sandZones.map((sd, idx) => (
        <g key={`sd-${idx}`}>
          <rect
            x={sd.x}
            y={sd.y}
            width={sd.w}
            height={sd.h}
            fill="#E5A93B"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <rect x={sd.x} y={sd.y} width={sd.w} height={18} fill="#FDE68A" fillOpacity={0.65} />
          {sd.w > 200 && (
            <g>
              <circle cx={sd.x + 90} cy={sd.y + sd.h * 0.52} r={16} fill="#FF2E88" stroke={COMIC_INK} strokeWidth={4} />
              <circle cx={sd.x + 210} cy={sd.y + sd.h * 0.45} r={16} fill="#00F5FF" stroke={COMIC_INK} strokeWidth={4} />
              <circle cx={sd.x + sd.w - 110} cy={sd.y + sd.h * 0.52} r={16} fill="#FACC15" stroke={COMIC_INK} strokeWidth={4} />
            </g>
          )}
        </g>
      ))}

      {/* Sidewalks (Urban Districts) with Halftone & Crisp Comic Block Outlines */}
      {districtData.sidewalks.map((sw, idx) => (
        <g key={`sw-${idx}`}>
          <rect
            x={sw.x}
            y={sw.y}
            width={sw.w}
            height={sw.h}
            fill="#121D3A"
            stroke={COMIC_INK}
            strokeWidth={5}
          />
          <rect
            x={sw.x + 4}
            y={sw.y + 4}
            width={Math.max(4, sw.w - 8)}
            height={Math.max(4, sw.h - 8)}
            fill={`url(#${darkDotId})`}
          />
        </g>
      ))}

      {/* Skyport Runways & Helipads */}
      {districtData.runways.map((rw, idx) => (
        <g key={`rw-${idx}`}>
          <rect
            x={rw.x}
            y={rw.y}
            width={rw.w}
            height={rw.h}
            fill="#16213E"
            stroke={COMIC_INK}
            strokeWidth={7}
          />
          <rect
            x={rw.x + 5}
            y={rw.y + 5}
            width={rw.w - 10}
            height={rw.h - 10}
            fill="none"
            stroke="#00F5FF"
            strokeWidth={4}
          />
          <line
            x1={rw.x + 28}
            y1={rw.y + rw.h / 2}
            x2={rw.x + rw.w - 28}
            y2={rw.y + rw.h / 2}
            stroke="#F8FAFC"
            strokeWidth={7}
            strokeDasharray="28 18"
          />
        </g>
      ))}
      {districtData.helipads.map((hp, idx) => (
        <g key={`hp-${idx}`} transform={`translate(${hp.x}, ${hp.y})`}>
          <circle r={26} fill="#0F172A" stroke={COMIC_INK} strokeWidth={6} />
          <circle r={21} fill="none" stroke="#FFD166" strokeWidth={4} />
          <text
            x={0}
            y={8}
            textAnchor="middle"
            fill="#FFD166"
            fontSize="24"
            fontWeight="900"
            fontFamily="monospace"
          >
            H
          </text>
        </g>
      ))}

      {/* Central Neon Plaza Holographic Mandala */}
      <g transform={`translate(${districtData.plazaCenter.x}, ${districtData.plazaCenter.y})`}>
        <circle r={66} fill="#1E1B4B" stroke={COMIC_INK} strokeWidth={6} />
        <circle r={56} fill="none" stroke="#00F5FF" strokeWidth={5} />
        <circle r={36} fill="none" stroke="#FF2E88" strokeWidth={5} strokeDasharray="16 10" />
        <circle r={16} fill="#38BDF8" stroke={COMIC_INK} strokeWidth={4} />
      </g>

      {/* Vibrant Coastal Shallow Halos + Comic Wave Rivers & Ocean */}
      {districtData.rivers.map((rv, idx) => (
        <rect
          key={`rv-halo-${idx}`}
          x={rv.x - 10}
          y={rv.y - 10}
          width={rv.w + 20}
          height={rv.h + 20}
          fill="none"
          stroke="#22D3EE"
          strokeWidth={18}
          strokeOpacity={0.44}
        />
      ))}
      {districtData.rivers.map((rv, idx) => (
        <g key={`rv-${idx}`}>
          <rect
            x={rv.x}
            y={rv.y}
            width={rv.w}
            height={rv.h}
            fill={`url(#${oceanWaveId})`}
            stroke={COMIC_INK}
            strokeWidth={7}
          />
          <rect
            x={rv.x + 5}
            y={rv.y + 5}
            width={Math.max(4, rv.w - 10)}
            height={Math.max(4, rv.h - 10)}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={4}
            strokeOpacity={0.8}
          />
        </g>
      ))}

      {/* Waterfront Neon Ferris Wheel Icon */}
      <g transform="translate(2424, 1624)">
        <circle r={42} fill="#0F172A" fillOpacity={0.7} stroke={COMIC_INK} strokeWidth={6} />
        <circle r={36} fill="none" stroke="#FF2E88" strokeWidth={5} />
        <circle r={22} fill="none" stroke="#00F5FF" strokeWidth={3} />
        <circle r={8} fill="#FFD166" stroke={COMIC_INK} strokeWidth={3} />
      </g>

      {/* Moored Cargo Barges & Speedboats on Rivers/Harbor */}
      {boats.map((bt, idx) => (
        <g key={`bt-${idx}`} transform={`translate(${bt.x}, ${bt.y})`}>
          {bt.type === 'barge' ? (
            <>
              <polygon points="-74,0 -44,-14 -44,14" fill="#BAE6FD" fillOpacity={0.55} />
              <rect x={-56} y={-20} width={112} height={40} rx={6} fill="#1E293B" stroke={COMIC_INK} strokeWidth={5} />
              <rect x={-44} y={-12} width={30} height={11} fill="#0284C7" stroke={COMIC_INK} strokeWidth={3} />
              <rect x={-10} y={-12} width={30} height={11} fill="#F59E0B" stroke={COMIC_INK} strokeWidth={3} />
              <rect x={-44} y={2} width={30} height={11} fill="#EF4444" stroke={COMIC_INK} strokeWidth={3} />
              <rect x={-10} y={2} width={30} height={11} fill="#10B981" stroke={COMIC_INK} strokeWidth={3} />
              <rect x={28} y={-13} width={20} height={26} fill="#F8FAFC" stroke={COMIC_INK} strokeWidth={3} />
            </>
          ) : (
            <>
              <polygon points="-42,0 -18,-9 -18,9" fill="#E0F2FE" fillOpacity={0.65} />
              <polygon points="-20,-9 16,-9 24,0 16,9 -20,9" fill="#F8FAFC" stroke={COMIC_INK} strokeWidth={4} />
              <rect x={2} y={-5} width={10} height={10} fill="#00F5FF" />
            </>
          )}
        </g>
      ))}

      {/* Cascading Waterfalls */}
      {districtData.waterfalls.map((wf, idx) => (
        <g key={`wf-${idx}`}>
          <rect
            x={wf.x}
            y={wf.y}
            width={wf.w}
            height={wf.h}
            fill="#38BDF8"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <line x1={wf.x + wf.w * 0.3} y1={wf.y + 4} x2={wf.x + wf.w * 0.3} y2={wf.y + wf.h - 4} stroke="#FFFFFF" strokeWidth={5} />
          <line x1={wf.x + wf.w * 0.65} y1={wf.y + 4} x2={wf.x + wf.w * 0.65} y2={wf.y + wf.h - 4} stroke="#E0F2FE" strokeWidth={5} />
        </g>
      ))}

      {/* Multi-Lane Comic Roads with Ink Curbs & Dashed Yellow Centerlines */}
      {districtData.roads.map((road, idx) => {
        const horiz = road.w >= road.h;
        return (
          <g key={`rd-${idx}`}>
            <rect
              x={road.x}
              y={road.y}
              width={road.w}
              height={road.h}
              fill="#0B1328"
              stroke={COMIC_INK}
              strokeWidth={5}
            />
            <rect
              x={road.x + 3}
              y={road.y + 3}
              width={Math.max(2, road.w - 6)}
              height={Math.max(2, road.h - 6)}
              fill="none"
              stroke="#1E3A8A"
              strokeWidth={2.5}
            />
            {horiz ? (
              <line
                x1={road.x + 14}
                y1={road.y + road.h / 2}
                x2={road.x + road.w - 14}
                y2={road.y + road.h / 2}
                stroke="#FACC15"
                strokeOpacity={0.55}
                strokeWidth={4}
                strokeDasharray="24 20"
              />
            ) : (
              <line
                x1={road.x + road.w / 2}
                y1={road.y + 14}
                x2={road.x + road.w / 2}
                y2={road.y + road.h - 14}
                stroke="#FACC15"
                strokeOpacity={0.55}
                strokeWidth={4}
                strokeDasharray="24 20"
              />
            )}
          </g>
        );
      })}

      {/* Intersection Crosswalk Stripes */}
      {districtData.trafficSignals.map((sig, idx) => (
        <g key={`cw-${idx}`} transform={`translate(${sig.x}, ${sig.y})`}>
          <circle r={12} fill="#0F172A" stroke="#00F5FF" strokeWidth={3} />
          <line x1={-46} y1={-66} x2={46} y2={-66} stroke="#E2E8F0" strokeOpacity={0.65} strokeWidth={10} strokeDasharray="10 8" />
          <line x1={-46} y1={66} x2={46} y2={66} stroke="#E2E8F0" strokeOpacity={0.65} strokeWidth={10} strokeDasharray="10 8" />
        </g>
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
          fillOpacity={0.78}
          stroke={COMIC_INK}
          strokeWidth={4}
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
          stroke={COMIC_INK}
          strokeWidth={4}
        />
      ))}

      {/* Bridges with Suspension Pylons & Golden Cables */}
      {districtData.bridges.map((br, idx) => (
        <g key={`br-${idx}`}>
          <rect
            x={br.x + 10}
            y={br.y + 10}
            width={br.w}
            height={br.h}
            fill={COMIC_INK}
            fillOpacity={0.65}
          />
          <rect
            x={br.x}
            y={br.y}
            width={br.w}
            height={br.h}
            fill="#293856"
            stroke={COMIC_INK}
            strokeWidth={6}
          />
          <rect
            x={br.x + 4}
            y={br.y + 4}
            width={Math.max(4, br.w - 8)}
            height={Math.max(4, br.h - 8)}
            fill="none"
            stroke="#FACC15"
            strokeWidth={4}
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

      {/* Multi-Peak Comic-Inked Mountains & Volcano */}
      {districtData.mountains.map((mt) => renderMountainPeaks(mt, showLabels, hatchId))}

      {/* Cel-Shaded Comic Tree Canopy Clusters */}
      {trees.map((tree, idx) => {
        const fill =
          tree.type === 'tree_sakura'
            ? '#EC4899'
            : tree.type === 'tree_snow'
              ? '#E0F2FE'
              : tree.type === 'tree_autumn'
                ? '#F59E0B'
                : tree.type === 'tree_palm'
                  ? '#22C55E'
                  : '#16A34A';
        const hi =
          tree.type === 'tree_sakura'
            ? '#FBCFE8'
            : tree.type === 'tree_snow'
              ? '#FFFFFF'
              : tree.type === 'tree_autumn'
                ? '#FEF08A'
                : '#86EFAC';
        const r = tree.type === 'tree_palm' ? 16 : 18;
        return (
          <g key={`tr-${idx}`}>
            <circle cx={tree.x + 5} cy={tree.y + 5} r={r} fill={COMIC_INK} fillOpacity={0.55} />
            <circle cx={tree.x} cy={tree.y} r={r} fill={fill} stroke={COMIC_INK} strokeWidth={5} />
            <circle cx={tree.x - 4} cy={tree.y - 4} r={Math.round(r * 0.45)} fill={hi} />
          </g>
        );
      })}

      {/* Parking Lot */}
      <g>
        <rect
          x={districtData.parkingLot.x}
          y={districtData.parkingLot.y}
          width={districtData.parkingLot.w}
          height={districtData.parkingLot.h}
          fill="#0F172A"
          stroke={COMIC_INK}
          strokeWidth={6}
        />
        <rect
          x={districtData.parkingLot.x + 5}
          y={districtData.parkingLot.y + 5}
          width={districtData.parkingLot.w - 10}
          height={districtData.parkingLot.h - 10}
          fill="none"
          stroke="#FACC15"
          strokeWidth={4}
          strokeDasharray="16 12"
        />
      </g>

      {/* Distinct 2.5D Comic-Inked Extruded Buildings */}
      {districtData.buildings.map((b) => renderComicBuilding(b, showLabels, hatchId, cyanDotId))}
    </>
  );
}
