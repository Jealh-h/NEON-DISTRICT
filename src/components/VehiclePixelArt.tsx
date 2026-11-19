import { VEHICLE_SPECS, VehicleType } from '../game/config/BalanceConfig';

interface VehiclePixelArtProps {
  type: VehicleType;
  paintHex?: string | null;
  className?: string;
}

export function VehiclePixelArt({ type, paintHex, className = '' }: VehiclePixelArtProps) {
  const spec = VEHICLE_SPECS[type];
  const bodyHex = paintHex || spec.accentHex;
  const trimHex = spec.accentHex;

  return (
    <svg
      viewBox="0 0 96 56"
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={spec.name}
    >
      {/* Neon Pedestal Ring */}
      <ellipse
        cx="48"
        cy="47"
        rx="34"
        ry="5.5"
        fill={trimHex}
        fillOpacity="0.16"
        stroke={trimHex}
        strokeWidth="1.5"
      />
      <ellipse cx="48" cy="47" rx="22" ry="2.8" fill={trimHex} fillOpacity="0.22" />

      {type === 'compact' && (
        <g>
          <rect x="20" y="27" width="56" height="14" fill="#1E293B" stroke="#080D18" strokeWidth="2" />
          <rect x="28" y="19" width="34" height="10" fill={bodyHex} stroke="#080D18" strokeWidth="2" />
          <rect x="33" y="21" width="11" height="6" fill="#0EA5E9" />
          <rect x="46" y="21" width="12" height="6" fill="#38BDF8" />
          <rect x="21" y="30" width="54" height="5" fill={bodyHex} />
          <rect x="72" y="29" width="4" height="4" fill="#FFD166" />
          <rect x="19" y="29" width="3" height="4" fill="#FF2E88" />
          <rect x="25" y="38" width="11" height="8" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
          <rect x="60" y="38" width="11" height="8" fill="#0F172A" stroke="#64748B" strokeWidth="1.5" />
        </g>
      )}

      {type === 'racer' && (
        <g>
          <polygon
            points="16,38 22,26 42,20 66,22 79,32 79,39 16,39"
            fill={bodyHex}
            stroke="#080D18"
            strokeWidth="2"
          />
          <polygon points="36,22 57,23 63,29 33,29" fill="#0EA5E9" />
          <rect x="14" y="22" width="8" height="4" fill="#0F172A" stroke={trimHex} strokeWidth="1" />
          <rect x="19" y="33" width="56" height="3" fill="#080D18" />
          <rect x="74" y="32" width="5" height="3" fill="#00F5FF" />
          <rect x="24" y="37" width="11" height="8" fill="#0F172A" stroke={trimHex} strokeWidth="1.5" />
          <rect x="61" y="37" width="11" height="8" fill="#0F172A" stroke={trimHex} strokeWidth="1.5" />
        </g>
      )}

      {type === 'supercar' && (
        <g>
          <polygon
            points="14,38 20,27 40,19 64,20 82,31 82,38"
            fill={paintHex || '#312E81'}
            stroke="#080D18"
            strokeWidth="2"
          />
          <polygon points="37,21 59,21 67,29 32,29" fill="#00F5FF" />
          <rect x="13" y="21" width="9" height="3" fill="#FFD166" />
          <rect x="22" y="32" width="54" height="3" fill={bodyHex} />
          <rect x="76" y="31" width="5" height="3" fill="#FFFBEB" />
          <rect x="16" y="31" width="4" height="4" fill="#FF2E88" />
          <rect x="23" y="36" width="12" height="9" fill="#080D18" stroke="#FFD166" strokeWidth="1.5" />
          <rect x="61" y="36" width="12" height="9" fill="#080D18" stroke="#FFD166" strokeWidth="1.5" />
        </g>
      )}

      {type === 'cruiser' && (
        <g>
          <rect x="18" y="26" width="60" height="14" fill="#0F172A" stroke="#080D18" strokeWidth="2" />
          <rect x="33" y="26" width="26" height="14" fill="#E2E8F0" />
          <rect x="28" y="18" width="35" height="9" fill="#1E293B" stroke="#080D18" strokeWidth="2" />
          <rect x="33" y="20" width="24" height="6" fill="#38BDF8" />
          <rect x="39" y="14" width="7" height="4" fill="#FF4545" />
          <rect x="46" y="14" width="7" height="4" fill="#00F5FF" />
          <rect x="74" y="29" width="4" height="4" fill="#FFD166" />
          <rect x="24" y="37" width="11" height="8" fill="#080D18" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="61" y="37" width="11" height="8" fill="#080D18" stroke="#94A3B8" strokeWidth="1.5" />
        </g>
      )}

      {type === 'buggy' && (
        <g>
          <rect x="21" y="25" width="52" height="13" fill={bodyHex} stroke="#080D18" strokeWidth="2" />
          <polygon points="30,25 38,16 56,16 62,25" fill="none" stroke="#CBD5E1" strokeWidth="2.5" />
          <rect x="41" y="13" width="10" height="3" fill="#FFD166" />
          <rect x="70" y="27" width="5" height="4" fill="#FEF08A" />
          <rect x="21" y="34" width="14" height="11" fill="#0F172A" stroke="#F97316" strokeWidth="2" />
          <rect x="59" y="34" width="14" height="11" fill="#0F172A" stroke="#F97316" strokeWidth="2" />
        </g>
      )}

      {type === 'moto' && (
        <g>
          <rect x="27" y="33" width="13" height="11" fill="#0F172A" stroke={trimHex} strokeWidth="2" />
          <rect x="56" y="33" width="13" height="11" fill="#0F172A" stroke={trimHex} strokeWidth="2" />
          <polygon
            points="25,35 38,24 58,23 70,30 62,36 32,37"
            fill={bodyHex}
            stroke="#080D18"
            strokeWidth="2"
          />
          <rect x="55" y="19" width="6" height="5" fill="#00F5FF" />
          <rect x="68" y="27" width="4" height="4" fill="#FFD166" />
        </g>
      )}

      {type === 'superbike' && (
        <g>
          <rect x="24" y="33" width="14" height="11" fill="#080D18" stroke="#00F5FF" strokeWidth="2" />
          <rect x="58" y="33" width="14" height="11" fill="#080D18" stroke="#00F5FF" strokeWidth="2" />
          <polygon
            points="21,34 36,22 61,20 75,29 66,36 30,36"
            fill={bodyHex}
            stroke="#080D18"
            strokeWidth="2"
          />
          <polygon points="55,21 68,24 61,27 52,25" fill="#00F5FF" />
          <rect x="33" y="30" width="28" height="3" fill="#FF2E88" />
          <rect x="73" y="27" width="4" height="3" fill="#FFFFFF" />
        </g>
      )}

      {type === 'swat' && (
        <g>
          <rect x="15" y="21" width="64" height="20" fill="#1E293B" stroke="#080D18" strokeWidth="2" />
          <rect x="17" y="23" width="58" height="4" fill={paintHex || '#38BDF8'} />
          <rect x="54" y="24" width="17" height="7" fill="#0EA5E9" />
          <rect x="44" y="16" width="8" height="5" fill="#FF4545" />
          <rect x="52" y="16" width="8" height="5" fill="#00F5FF" />
          <rect x="21" y="36" width="13" height="10" fill="#080D18" stroke="#64748B" strokeWidth="2" />
          <rect x="42" y="36" width="13" height="10" fill="#080D18" stroke="#64748B" strokeWidth="2" />
          <rect x="63" y="36" width="13" height="10" fill="#080D18" stroke="#64748B" strokeWidth="2" />
        </g>
      )}

      {type === 'heli' && (
        <g>
          <rect x="12" y="12" width="72" height="3" fill="#CBD5E1" />
          <rect x="45" y="14" width="6" height="6" fill="#64748B" />
          <rect x="16" y="25" width="24" height="5" fill="#334155" stroke="#080D18" strokeWidth="1.5" />
          <rect x="13" y="20" width="4" height="14" fill={trimHex} />
          <polygon
            points="34,21 63,20 77,28 73,36 38,36"
            fill={paintHex || '#334155'}
            stroke="#080D18"
            strokeWidth="2"
          />
          <polygon points="56,22 72,27 68,33 52,33" fill="#38BDF8" />
          <rect x="40" y="39" width="32" height="3" fill="#94A3B8" />
          <rect x="45" y="36" width="3" height="4" fill="#94A3B8" />
          <rect x="63" y="36" width="3" height="4" fill="#94A3B8" />
          <rect x="46" y="32" width="12" height="4" fill="#FFD166" />
        </g>
      )}

      {type === 'tank' && (
        <g>
          <rect x="52" y="18" width="32" height="5" fill="#4ADE80" stroke="#080D18" strokeWidth="1.5" />
          <rect x="81" y="17" width="5" height="7" fill="#166534" />
          <rect x="29" y="15" width="30" height="12" fill={paintHex || '#166534'} stroke="#080D18" strokeWidth="2" />
          <rect x="16" y="26" width="60" height="12" fill={paintHex || '#15803D'} stroke="#080D18" strokeWidth="2" />
          <rect x="14" y="36" width="64" height="10" fill="#0F172A" stroke="#4ADE80" strokeWidth="1.5" />
          <rect x="19" y="38" width="8" height="6" fill="#334155" />
          <rect x="31" y="38" width="8" height="6" fill="#334155" />
          <rect x="43" y="38" width="8" height="6" fill="#334155" />
          <rect x="55" y="38" width="8" height="6" fill="#334155" />
          <rect x="66" y="38" width="8" height="6" fill="#334155" />
        </g>
      )}
    </svg>
  );
}
