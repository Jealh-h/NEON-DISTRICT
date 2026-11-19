import { WeaponId } from '../game/config/BalanceConfig';

interface WeaponPixelArtProps {
  weaponId: WeaponId;
  owned?: boolean;
  className?: string;
}

export function WeaponPixelArt({ weaponId, owned = true, className = '' }: WeaponPixelArtProps) {
  const opacity = owned ? 1 : 0.48;

  return (
    <svg
      viewBox="0 0 36 22"
      shapeRendering="crispEdges"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {weaponId === 'pistol' && (
        <g>
          <rect x="8" y="6" width="19" height="5" fill="#00F5FF" stroke="#080D18" strokeWidth="1.2" />
          <rect x="10" y="7" width="14" height="2" fill="#E0F2FE" />
          <rect x="9" y="11" width="6" height="7" fill="#334155" stroke="#080D18" strokeWidth="1.2" />
          <rect x="27" y="7" width="3" height="2" fill="#FFD166" />
        </g>
      )}

      {weaponId === 'smg' && (
        <g>
          <rect x="5" y="7" width="22" height="5" fill="#FF2E88" stroke="#080D18" strokeWidth="1.2" />
          <rect x="27" y="8" width="5" height="3" fill="#94A3B8" />
          <rect x="9" y="12" width="4" height="6" fill="#1E293B" stroke="#080D18" strokeWidth="1" />
          <rect x="17" y="12" width="4" height="7" fill="#F472B6" stroke="#080D18" strokeWidth="1" />
          <rect x="11" y="5" width="9" height="2" fill="#00F5FF" />
        </g>
      )}

      {weaponId === 'shotgun' && (
        <g>
          <rect x="4" y="9" width="8" height="5" fill="#B45309" stroke="#080D18" strokeWidth="1.2" />
          <rect x="12" y="7" width="19" height="4" fill="#FFD166" stroke="#080D18" strokeWidth="1.2" />
          <rect x="14" y="11" width="11" height="3" fill="#475569" stroke="#080D18" strokeWidth="1" />
          <rect x="29" y="7" width="3" height="3" fill="#F97316" />
        </g>
      )}

      {weaponId === 'rifle' && (
        <g>
          <rect x="3" y="8" width="7" height="5" fill="#334155" stroke="#080D18" strokeWidth="1.1" />
          <rect x="10" y="7" width="17" height="5" fill="#C000FF" stroke="#080D18" strokeWidth="1.2" />
          <rect x="27" y="8" width="7" height="2" fill="#E2E8F0" />
          <rect x="13" y="4" width="8" height="3" fill="#00F5FF" />
          <rect x="18" y="12" width="4" height="7" fill="#1E293B" stroke="#080D18" strokeWidth="1" />
        </g>
      )}

      {weaponId === 'flamethrower' && (
        <g>
          <rect x="4" y="6" width="8" height="10" fill="#FB923C" stroke="#080D18" strokeWidth="1.2" />
          <rect x="12" y="8" width="16" height="5" fill="#475569" stroke="#080D18" strokeWidth="1.2" />
          <rect x="28" y="7" width="4" height="7" fill="#F97316" />
          <rect x="32" y="8" width="3" height="4" fill="#FACC15" />
          <rect x="14" y="13" width="5" height="5" fill="#1E293B" />
        </g>
      )}

      {weaponId === 'railgun' && (
        <g>
          <rect x="3" y="8" width="9" height="5" fill="#1E293B" stroke="#080D18" strokeWidth="1.1" />
          <rect x="12" y="6" width="21" height="3" fill="#38BDF8" stroke="#080D18" strokeWidth="1" />
          <rect x="12" y="11" width="21" height="3" fill="#38BDF8" stroke="#080D18" strokeWidth="1" />
          <rect x="13" y="9" width="19" height="2" fill="#E0F2FE" />
          <rect x="13" y="3" width="8" height="3" fill="#00F5FF" />
        </g>
      )}

      {weaponId === 'launcher' && (
        <g>
          <rect x="4" y="6" width="23" height="8" fill="#EF4444" stroke="#080D18" strokeWidth="1.2" />
          <rect x="27" y="5" width="5" height="10" fill="#991B1B" stroke="#080D18" strokeWidth="1.1" />
          <rect x="11" y="14" width="5" height="5" fill="#334155" />
          <rect x="18" y="14" width="4" height="4" fill="#334155" />
          <rect x="8" y="8" width="14" height="3" fill="#FFD166" />
        </g>
      )}
    </svg>
  );
}

export function MedkitPixelIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" shapeRendering="crispEdges" className={className} aria-hidden="true">
      <rect x="3" y="6" width="18" height="14" fill="#F8FAFC" stroke="#080D18" strokeWidth="2" />
      <rect x="8" y="3" width="8" height="3" fill="#94A3B8" stroke="#080D18" strokeWidth="1.5" />
      <rect x="10" y="8" width="4" height="10" fill="#FF2E88" />
      <rect x="7" y="11" width="10" height="4" fill="#FF2E88" />
    </svg>
  );
}
