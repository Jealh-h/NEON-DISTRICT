import { useState } from 'react';
import titleSkylineImg from '../assets/images/title_cyber_skyline_1795087192579.jpg';
import heroAvatarImg from '../assets/images/hero_avatar_pixel_1795087191785.jpg';
import heroFullBodyImg from '../assets/images/hero_fullbody_pixel_1795087192123.jpg';
import fixerPortraitImg from '../assets/images/fixer_portrait_pixel_1795087190973.jpg';
import cityPreviewImg from '../assets/images/cyber_city_preview_1795087192933.jpg';

interface PortraitProps {
  className?: string;
}

export function TitleSkylineImg({ className = '' }: PortraitProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`relative overflow-hidden bg-[#080D18] ${className}`}
        aria-label="霓虹特区天际线背景"
      >
        <svg viewBox="0 0 1600 900" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="skyFb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#080D18" />
              <stop offset="60%" stopColor="#1B1035" />
              <stop offset="100%" stopColor="#0B1B36" />
            </linearGradient>
          </defs>
          <rect width="1600" height="900" fill="url(#skyFb)" />
          <rect x="80" y="280" width="120" height="620" fill="#111936" stroke="#00F5FF" strokeWidth="2" />
          <rect x="240" y="200" width="150" height="700" fill="#171238" stroke="#C000FF" strokeWidth="2" />
          <rect x="440" y="320" width="110" height="580" fill="#0E1C36" stroke="#FF2E88" strokeWidth="2" />
          <rect x="610" y="160" width="170" height="740" fill="#12183A" stroke="#00F5FF" strokeWidth="2" />
          <rect x="860" y="240" width="130" height="660" fill="#191138" stroke="#FF2E88" strokeWidth="2" />
          <rect x="1060" y="180" width="160" height="720" fill="#0F1936" stroke="#00F5FF" strokeWidth="2" />
          <rect x="1280" y="260" width="180" height="640" fill="#171234" stroke="#C000FF" strokeWidth="2" />
          <line x1="0" y1="740" x2="1600" y2="740" stroke="#00F5FF" strokeWidth="3" strokeOpacity="0.6" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={titleSkylineImg}
      alt="霓虹特区赛博朋克像素天际线"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function HeroAvatarImg({ className = '' }: PortraitProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-[#0D1424] ${className}`}
        aria-label="主角像素头像"
      >
        <svg viewBox="0 0 24 24" shapeRendering="crispEdges" className="h-full w-full p-1">
          <rect width="24" height="24" fill="#0B1324" />
          <rect x="6" y="4" width="12" height="5" fill="#1E293B" />
          <rect x="7" y="9" width="10" height="8" fill="#F1C27D" />
          <rect x="6" y="10" width="5" height="3" fill="#00F5FF" />
          <rect x="13" y="10" width="5" height="3" fill="#FF2E88" />
          <rect x="11" y="11" width="2" height="1" fill="#080D18" />
          <rect x="5" y="17" width="14" height="7" fill="#1E293B" />
          <rect x="7" y="17" width="2" height="7" fill="#00F5FF" />
          <rect x="15" y="17" width="2" height="7" fill="#FF2E88" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={heroAvatarImg}
      alt="主角夜影像素头像"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function HeroFullBodyImg({ className = '' }: PortraitProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-[#080D18] ${className}`}
        aria-label="主角全身立绘"
      >
        <svg viewBox="0 0 36 48" shapeRendering="crispEdges" className="h-full w-full p-2">
          <rect width="36" height="48" fill="#080D18" />
          <ellipse cx="18" cy="43" rx="12" ry="3" fill="#C000FF" fillOpacity="0.45" />
          <rect x="13" y="6" width="10" height="4" fill="#1E293B" />
          <rect x="14" y="10" width="8" height="6" fill="#F1C27D" />
          <rect x="14" y="11" width="8" height="2" fill="#00F5FF" />
          <rect x="11" y="16" width="14" height="14" fill="#1E293B" />
          <rect x="11" y="16" width="2" height="14" fill="#00F5FF" />
          <rect x="23" y="16" width="2" height="14" fill="#FF2E88" />
          <rect x="12" y="30" width="5" height="12" fill="#334155" />
          <rect x="19" y="30" width="5" height="12" fill="#334155" />
          <rect x="24" y="18" width="9" height="3" fill="#38BDF8" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={heroFullBodyImg}
      alt="主角全身战甲立绘"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`object-cover object-top ${className}`}
    />
  );
}

export function FixerAvatarImg({ className = '' }: PortraitProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-[#140C28] ${className}`}
        aria-label="联络官头像"
      >
        <svg viewBox="0 0 24 24" shapeRendering="crispEdges" className="h-full w-full p-1">
          <rect width="24" height="24" fill="#140C28" />
          <rect x="5" y="4" width="14" height="9" fill="#C000FF" />
          <rect x="7" y="8" width="10" height="8" fill="#F8D2BA" />
          <rect x="8" y="11" width="2" height="2" fill="#00F5FF" />
          <rect x="14" y="11" width="2" height="2" fill="#00F5FF" />
          <rect x="5" y="17" width="14" height="7" fill="#1E293B" />
          <rect x="6" y="18" width="12" height="2" fill="#FF2E88" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={fixerPortraitImg}
      alt="赛博情报联络官头像"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  );
}

export function CityPreviewImg({ className = '' }: PortraitProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-[#091224] ${className}`}
        aria-label="画质预览图"
      >
        <svg viewBox="0 0 160 120" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <rect width="160" height="120" fill="#091224" />
          <rect x="16" y="34" width="26" height="86" fill="#151D3B" stroke="#00F5FF" strokeWidth="1.5" />
          <rect x="52" y="20" width="32" height="100" fill="#1E1442" stroke="#C000FF" strokeWidth="1.5" />
          <rect x="94" y="40" width="24" height="80" fill="#131E3C" stroke="#FF2E88" strokeWidth="1.5" />
          <rect x="124" y="28" width="24" height="92" fill="#1A153E" stroke="#FFD166" strokeWidth="1.5" />
          <line x1="0" y1="102" x2="160" y2="102" stroke="#00F5FF" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={cityPreviewImg}
      alt="霓虹街区画质实时预览"
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  );
}
