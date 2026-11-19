import { type MouseEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Car,
  Compass,
  Cpu,
  Crosshair,
  Flame,
  Hammer,
  Heart,
  MapPin,
  Pickaxe,
  RotateCcw,
  Settings,
  Shield,
  ShieldCheck,
  Skull,
  Sparkles,
  Swords,
  Train,
  User,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ECONOMY_CONFIG,
  HORDE_GEAR_COSTS,
  MECH_SPECS,
  MISSION_DEFINITIONS,
  VEHICLE_BUY_COSTS,
  VEHICLE_CATALOG_ORDER,
  VEHICLE_PAINT_OPTIONS,
  VEHICLE_SPECS,
  VEHICLE_UPGRADE_CONFIG,
  VehicleType,
  VehicleUpgradeTrack,
  WEAPON_ORDER,
  WEAPON_SPECS,
  WEAPON_UPGRADE_CONFIG,
  WORLD_CONFIG,
  WeaponUpgradeTrack,
} from '../game/config/BalanceConfig';
import {
  CYBERWARE_SLOT_ORDER,
  CYBERWARE_SPECS,
  REPUTATION_ORDER,
  REPUTATION_SPECS,
  SKILL_TREE_ORDER,
  SKILL_TREE_SPECS,
} from '../game/config/ExpansionConfig';
import {
  TERRARIA_ACCESSORY_META,
  TERRARIA_LIMITS,
  TERRARIA_RECIPES,
  TERRARIA_RESOURCE_ORDER,
  TERRARIA_RESOURCES,
  TerrariaAccessoryId,
  TerrariaCraftCategory,
  TerrariaPotionId,
  TerrariaResourceId,
} from '../game/config/TerrariaConfig';
import { GAME_EVENT, HubTabId, gameEvents } from '../game/ui/GameEvents';
import { CITY_DISTRICTS } from '../game/world/DistrictManager';
import { useGameStore } from '../store/gameStore';
import { MapTerrainSvg } from './MapTerrainSvg';
import { CityPreviewImg, FixerAvatarImg, HeroAvatarImg, HeroFullBodyImg } from './PixelPortrait';
import { VehiclePixelArt } from './VehiclePixelArt';
import { MedkitPixelIcon, WeaponPixelArt } from './WeaponPixelArt';

const ALL_HUB_TABS: Array<{ id: HubTabId; label: string; shortcut: string; titleAllowed: boolean }> = [
  { id: 'map', label: '世界地图', shortcut: 'M', titleAllowed: false },
  { id: 'missions', label: '任务日志', shortcut: 'L', titleAllowed: false },
  { id: 'character', label: '角色', shortcut: 'C', titleAllowed: true },
  { id: 'vehicles', label: '载具', shortcut: '', titleAllowed: true },
  { id: 'armory', label: '军械库', shortcut: 'B', titleAllowed: false },
  { id: 'craft', label: '造物台', shortcut: 'K', titleAllowed: false },
  { id: 'settings', label: '设置', shortcut: '', titleAllowed: true },
];

type MissionSubTab = 'main' | 'explore' | 'events';
type CharacterSubTab = 'skills' | 'cyberware' | 'reputation';
type SettingsCategory = 'game' | 'graphics' | 'audio' | 'controls' | 'language';

function formatDistanceLabel(dx: number, dy: number): string {
  const meters = Math.max(0, Math.round(Math.hypot(dx, dy) / 8));
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

export function TacticalHubModal() {
  const mode = useGameStore((s) => s.mode);
  const playMode = useGameStore((s) => s.playMode);
  const activeHubTab = useGameStore((s) => s.activeHubTab);
  const titleSubModal = useGameStore((s) => s.titleSubModal);
  const openHubTab = useGameStore((s) => s.openHubTab);
  const closeHub = useGameStore((s) => s.closeHub);

  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const armor = useGameStore((s) => s.armor);
  const maxArmor = useGameStore((s) => s.maxArmor);
  const cash = useGameStore((s) => s.cash);
  const wantedLevel = useGameStore((s) => s.wantedLevel);
  const spotted = useGameStore((s) => s.spotted);
  const lastKnownPos = useGameStore((s) => s.lastKnownPos);
  const policeMarkers = useGameStore((s) => s.policeMarkers);
  const districtData = useGameStore((s) => s.districtData);
  const districtName = useGameStore((s) => s.districtName);
  const playerX = useGameStore((s) => s.playerX);
  const playerY = useGameStore((s) => s.playerY);
  const facingDeg = useGameStore((s) => s.facingDeg);
  const progression = useGameStore((s) => s.progression);
  const activeMission = useGameStore((s) => s.activeMission);
  const completedMissionIds = useGameStore((s) => s.completedMissionIds);
  const totalMissionEarnings = useGameStore((s) => s.totalMissionEarnings);
  const exploration = useGameStore((s) => s.exploration);
  const sandboxSummary = useGameStore((s) => s.sandboxSummary);
  const customWaypoint = useGameStore((s) => s.customWaypoint);
  const environment = useGameStore((s) => s.environment);
  const randomEvents = useGameStore((s) => s.randomEvents);
  const horde = useGameStore((s) => s.horde);
  const race = useGameStore((s) => s.race);
  const terraria = useGameStore((s) => s.terraria);
  const weapon = useGameStore((s) => s.weapon);

  const inVehicle = useGameStore((s) => s.inVehicle);
  const vehicleId = useGameStore((s) => s.vehicleId);
  const vehicleName = useGameStore((s) => s.vehicleName);
  const vehicleType = useGameStore((s) => s.vehicleType);
  const vehicleHealth = useGameStore((s) => s.vehicleHealth);
  const vehicleMaxHealth = useGameStore((s) => s.vehicleMaxHealth);
  const vehicleUpgrades = useGameStore((s) => s.vehicleUpgrades);
  const vehiclePaintColor = useGameStore((s) => s.vehiclePaintColor);
  const nearbyVehicle = useGameStore((s) => s.nearbyVehicle);

  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetSettings = useGameStore((s) => s.resetSettings);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const touchControlsMode = useGameStore((s) => s.touchControlsMode);
  const cycleTouchControlsMode = useGameStore((s) => s.cycleTouchControlsMode);
  const hudCompact = useGameStore((s) => s.hudCompact);
  const toggleHudCompact = useGameStore((s) => s.toggleHudCompact);
  const saveStatus = useGameStore((s) => s.saveStatus);

  // Local UI sub-tab states
  const [missionSubTab, setMissionSubTab] = useState<MissionSubTab>('main');
  const [charSubTab, setCharSubTab] = useState<CharacterSubTab>('skills');
  const [craftSubTab, setCraftSubTab] = useState<TerrariaCraftCategory>('build');
  const [settingsCat, setSettingsCat] = useState<SettingsCategory>('graphics');
  const [confirmResetSave, setConfirmResetSave] = useState(false);

  // Map pan & zoom state
  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({
    x: WORLD_CONFIG.WIDTH / 2,
    y: WORLD_CONFIG.HEIGHT / 2,
  });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<{
    dragging: boolean;
    startClientX: number;
    startClientY: number;
    startCenterX: number;
    startCenterY: number;
    movedPx: number;
  }>({
    dragging: false,
    startClientX: 0,
    startClientY: 0,
    startCenterX: WORLD_CONFIG.WIDTH / 2,
    startCenterY: WORLD_CONFIG.HEIGHT / 2,
    movedPx: 0,
  });

  useEffect(() => {
    setConfirmResetSave(false);
  }, [activeHubTab, mode]);

  const isTitleMode = mode === 'TITLE';
  const isOpen =
    (mode === 'PLAYING' && activeHubTab !== null) ||
    (isTitleMode && (titleSubModal === 'garage' || titleSubModal === 'settings'));

  const currentTab: HubTabId = useMemo(() => {
    if (isTitleMode) {
      if (activeHubTab === 'character' || activeHubTab === 'vehicles' || activeHubTab === 'settings') {
        return activeHubTab;
      }
      return titleSubModal === 'settings' ? 'settings' : 'vehicles';
    }
    return activeHubTab ?? 'map';
  }, [isTitleMode, activeHubTab, titleSubModal]);

  const visibleTabs = useMemo(
    () => ALL_HUB_TABS.filter((t) => (isTitleMode ? t.titleAllowed : true)),
    [isTitleMode]
  );

  // Compute district control % and prosperity stars from live world exploration telemetry
  const districtStats = useMemo(() => {
    const map: Record<string, { controlPct: number; stars: number; center: { x: number; y: number } }> = {};
    for (const d of CITY_DISTRICTS) {
      const zone = districtData?.zones.find((z) => z.id === d.id || z.name === d.name);
      const center = zone
        ? { x: Math.round(zone.x + zone.w / 2), y: Math.round(zone.y + zone.h / 2) }
        : { x: WORLD_CONFIG.WIDTH / 2, y: WORLD_CONFIG.HEIGHT / 2 };

      const towers = sandboxSummary.signalTowers.filter(
        (t) => t.districtId === d.id || t.districtName === d.name
      );
      const syncedCount = towers.filter((t) => t.synced).length;
      const outposts = sandboxSummary.gangOutposts.filter((o) => o.districtId === d.id);
      const clearedCount = outposts.filter((o) => o.cleared).length;
      const vaults = sandboxSummary.secretVaults.filter((v) => v.districtId === d.id);
      const openedCount = vaults.filter((v) => v.opened).length;

      const totalObj = towers.length + outposts.length + vaults.length;
      const doneObj = syncedCount + clearedCount + openedCount;
      const basePct = d.id === 'neon-plaza' ? 72 : d.id === 'riverside-park' ? 60 : 45;
      const bonusPct = totalObj > 0 ? Math.round((doneObj / totalObj) * (100 - basePct)) : 0;
      const controlPct = Math.min(100, basePct + bonusPct);
      const stars =
        controlPct >= 90 ? 5 : controlPct >= 70 ? 4 : controlPct >= 52 ? 3 : 2;

      map[d.id] = { controlPct, stars, center };
    }
    return map;
  }, [districtData, sandboxSummary]);

  if (!isOpen) return null;

  const expPct =
    progression.nextLevelExp > 0
      ? Math.min(100, Math.round((progression.exp / progression.nextLevelExp) * 100))
      : 0;

  // Map viewBox calculation
  const viewW = WORLD_CONFIG.WIDTH / mapZoom;
  const viewH = WORLD_CONFIG.HEIGHT / mapZoom;
  const clampedCenterX = Math.max(viewW / 2, Math.min(WORLD_CONFIG.WIDTH - viewW / 2, mapCenter.x));
  const clampedCenterY = Math.max(viewH / 2, Math.min(WORLD_CONFIG.HEIGHT - viewH / 2, mapCenter.y));
  const viewX = clampedCenterX - viewW / 2;
  const viewY = clampedCenterY - viewH / 2;

  const panToWorldPoint = (wx: number, wy: number, nextZoom = Math.max(mapZoom, 1.75)) => {
    setMapZoom(nextZoom);
    setMapCenter({ x: wx, y: wy });
  };

  const handleSvgPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    dragStateRef.current = {
      dragging: true,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCenterX: clampedCenterX,
      startCenterY: clampedCenterY,
      movedPx: 0,
    };
  };

  const handleSvgPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragStateRef.current.dragging || !svgRef.current) return;
    const dxClient = e.clientX - dragStateRef.current.startClientX;
    const dyClient = e.clientY - dragStateRef.current.startClientY;
    dragStateRef.current.movedPx = Math.max(
      dragStateRef.current.movedPx,
      Math.hypot(dxClient, dyClient)
    );
    if (mapZoom <= 1.01) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const worldDx = (dxClient / rect.width) * viewW;
    const worldDy = (dyClient / rect.height) * viewH;
    setMapCenter({
      x: dragStateRef.current.startCenterX - worldDx,
      y: dragStateRef.current.startCenterY - worldDy,
    });
  };

  const handleSvgPointerUp = () => {
    dragStateRef.current.dragging = false;
  };

  const handleSvgClick = (e: MouseEvent<SVGSVGElement>) => {
    if (dragStateRef.current.movedPx > 6) return;
    const svg = svgRef.current;
    if (!svg || !districtData) return;

    let worldX = WORLD_CONFIG.WIDTH / 2;
    let worldY = WORLD_CONFIG.HEIGHT / 2;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const transformed = pt.matrixTransform(ctm.inverse());
      worldX = transformed.x;
      worldY = transformed.y;
    } else {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        worldX = viewX + ((e.clientX - rect.left) / rect.width) * viewW;
        worldY = viewY + ((e.clientY - rect.top) / rect.height) * viewH;
      }
    }

    const cx = Math.round(Math.max(40, Math.min(WORLD_CONFIG.WIDTH - 40, worldX)));
    const cy = Math.round(Math.max(40, Math.min(WORLD_CONFIG.HEIGHT - 40, worldY)));
    const zone = districtData.zones.find(
      (z) => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h
    );
    gameEvents.emit(GAME_EVENT.SET_CUSTOM_WAYPOINT, {
      x: cx,
      y: cy,
      label: `自定义航标 · ${zone?.name ?? '霓虹特区'}`,
    });
  };

  const handleFastTravel = (metroId: string) => {
    if (playMode !== 'sandbox' || wantedLevel > 0) return;
    gameEvents.emit(GAME_EVENT.FAST_TRAVEL_METRO, metroId);
    closeHub();
  };

  const handleRecallPylon = (pylonId: string) => {
    if (playMode !== 'sandbox' || wantedLevel > 0) return;
    gameEvents.emit(GAME_EVENT.TERRARIA_RECALL_PYLON, pylonId);
    closeHub();
  };

  // Active or nearby vehicle target for live garage tuning
  const activeVehTarget = inVehicle && vehicleId && vehicleType
    ? {
        id: vehicleId,
        type: vehicleType,
        name: vehicleName ?? VEHICLE_SPECS[vehicleType].name,
        health: vehicleHealth,
        maxHealth: vehicleMaxHealth,
        upgrades: vehicleUpgrades ?? { engine: 0, handling: 0, armor: 0 },
        paintColor: vehiclePaintColor,
      }
    : nearbyVehicle
      ? {
          id: nearbyVehicle.id,
          type: nearbyVehicle.type,
          name: nearbyVehicle.name,
          health: nearbyVehicle.health,
          maxHealth: nearbyVehicle.maxHealth,
          upgrades: nearbyVehicle.upgrades ?? { engine: 0, handling: 0, armor: 0 },
          paintColor: nearbyVehicle.paintColor ?? null,
        }
      : null;

  const fixerQuote =
    wantedLevel >= 3
      ? '警用无人机正全城封锁你的信号，甩脱通缉或去车库隐匿喷漆！'
      : activeMission
        ? `当前行动「${activeMission.title}」已锁定目标，按指引迅速推进。`
        : completedMissionIds.length >= 4
          ? '你的名号已经在七大城区传开，继续清剿据点掌控这座城市吧！'
          : '这座城市，需要真正的英雄……挑选你的下一个赛博委托。';

  const canAffordOre = (cost: Partial<Record<TerrariaResourceId, number>>): boolean => {
    for (const [id, req] of Object.entries(cost) as Array<[TerrariaResourceId, number]>) {
      if ((terraria.resources[id] ?? 0) < req) return false;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#060913]/92 p-2 sm:p-3.5">
      <div className="flex h-[94vh] w-full max-w-[1380px] flex-col overflow-hidden border-2 border-[#00F5FF]/70 bg-[#080D18]">
        {/* Top Command Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#C000FF]/45 bg-[#0C1324] px-3 py-2 sm:px-4">
          {/* Left: Hero Avatar, Level, EXP, HP, Armor, Cash */}
          <div className="flex items-center gap-2.5">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden border-2 border-[#00F5FF] bg-[#080D18]">
              <HeroAvatarImg className="h-full w-full" />
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono-tabular text-xs font-bold text-[#00F5FF]">
                  Lv.{progression.level}
                </span>
                <div className="h-1.5 w-20 bg-[#151C2B] sm:w-24">
                  <div
                    className="h-full bg-[#C000FF] transition-all duration-150"
                    style={{ width: `${expPct}%` }}
                  />
                </div>
                <span className="hidden font-mono-tabular text-[10px] text-slate-400 sm:inline">
                  {progression.exp}/{progression.nextLevelExp}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono-tabular text-[11px]">
                <span className="flex items-center gap-1 font-bold text-[#FF4545]">
                  <Heart className="h-3 w-3 fill-[#FF4545]" />
                  {health}/{maxHealth}
                </span>
                <span className="flex items-center gap-1 font-bold text-[#38BDF8]">
                  <Shield className="h-3 w-3 fill-[#38BDF8]" />
                  {armor}/{maxArmor}
                </span>
                <span className="font-bold text-[#FFD166]">${cash.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Center: Unified Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1" aria-label="战术指挥中心标签页">
            {visibleTabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => openHubTab(tab.id)}
                  className={`flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-xs font-bold tracking-wider transition-colors sm:px-3 ${
                    active
                      ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                      : 'border-slate-700/80 bg-[#0D1424] text-slate-300 hover:border-[#C000FF]/70 hover:text-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.shortcut && (
                    <span className="hidden font-mono-tabular text-[9px] text-slate-400 md:inline">
                      [{tab.shortcut}]
                    </span>
                  )}
                  {tab.id === 'character' && progression.skillPoints > 0 && (
                    <span className="bg-[#FFD166] px-1 font-mono-tabular text-[9px] font-bold text-[#080D18]">
                      +{progression.skillPoints}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: 5★ Wanted Stars & Close */}
          <div className="flex items-center gap-3">
            {!isTitleMode && (
              <div className="hidden items-center gap-1.5 border border-slate-700/80 bg-[#080D18] px-2.5 py-1 sm:flex">
                <span className="text-[10px] font-bold text-slate-400">通缉</span>
                <div className="flex items-center gap-0.5" aria-label={`通缉等级 ${wantedLevel}/5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      className={star <= wantedLevel && spotted ? 'animate-pulse' : ''}
                      fill={star <= wantedLevel ? '#FF2E88' : 'none'}
                      stroke={star <= wantedLevel ? '#FF2E88' : '#475569'}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={closeHub}
              aria-label="关闭战术面板"
              className="flex h-9 w-9 cursor-pointer items-center justify-center border border-slate-700 bg-[#151C2B] text-slate-200 transition-colors hover:border-[#FF2E88] hover:text-[#FF2E88]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Scrollable Content Area */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {/* ================= TAB 1: WORLD MAP ================= */}
          {currentTab === 'map' && districtData && (
            <div className="flex h-full flex-col gap-3">
              <div className="grid min-h-[420px] flex-1 grid-cols-1 gap-3 lg:grid-cols-[224px_1fr_248px]">
                {/* Left Sidebar: 7 City Districts with Control & Prosperity */}
                <div className="flex flex-col gap-2 border border-[#00F5FF]/35 bg-[#0C1324] p-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#00F5FF]">
                      <Compass className="h-3.5 w-3.5" />
                      七大城区一览
                    </span>
                    <span className="font-mono-tabular text-[10px] text-slate-400">点击定位</span>
                  </div>

                  <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                    {CITY_DISTRICTS.map((d) => {
                      const st = districtStats[d.id];
                      const isCurrent = d.name === districtName;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => panToWorldPoint(st.center.x, st.center.y, 1.7)}
                          className={`flex cursor-pointer flex-col gap-1 border p-2 text-left transition-colors ${
                            isCurrent
                              ? 'border-[#00F5FF] bg-[#00F5FF]/12'
                              : 'border-slate-800 bg-[#080D18] hover:border-[#C000FF]/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent ? 'text-[#00F5FF]' : 'text-slate-100'
                              }`}
                            >
                              {d.name}
                            </span>
                            <span className="font-mono-tabular text-[10px] font-bold text-[#FFD166]">
                              {st.controlPct}%
                            </span>
                          </div>
                          <div className="h-1 w-full bg-[#151C2B]">
                            <div
                              className="h-full bg-[#00F5FF]"
                              style={{ width: `${st.controlPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate">{d.direction.split(' · ')[0]}</span>
                            <span className="font-mono-tabular text-[#FFD166]">
                              {'★'.repeat(st.stars)}
                              <span className="text-slate-600">{'★'.repeat(5 - st.stars)}</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Center: Interactive Zoomable/Pannable SVG Map */}
                <div className="relative flex flex-col justify-between overflow-hidden border-2 border-[#00F5FF]/45 bg-[#060B16]">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-[#0C1324]/90 px-3 py-1.5 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Crosshair className="h-3.5 w-3.5 text-[#00F5FF]" />
                      点击放置航标 · 拖拽平移 · 点击地铁站/晶塔快传
                    </span>
                    <span className="font-mono-tabular text-[#00F5FF]">
                      X: {playerX} &nbsp; Y: {playerY} · {Math.round(mapZoom * 100)}%
                    </span>
                  </div>

                  <div className="relative flex-1 overflow-hidden">
                    <svg
                      ref={svgRef}
                      onPointerDown={handleSvgPointerDown}
                      onPointerMove={handleSvgPointerMove}
                      onPointerUp={handleSvgPointerUp}
                      onPointerLeave={handleSvgPointerUp}
                      onClick={handleSvgClick}
                      viewBox={`${viewX} ${viewY} ${viewW} ${viewH}`}
                      className={`h-full max-h-[470px] w-full select-none ${
                        mapZoom > 1.01 ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
                      }`}
                    >
                      <MapTerrainSvg districtData={districtData} showLabels={true} />

                      {/* Landmarks */}
                      {districtData.landmarks.map((lm) => (
                        <g key={lm.id}>
                          <circle cx={lm.x} cy={lm.y} r={20} fill={lm.accentColor} fillOpacity={0.9} />
                          <circle cx={lm.x} cy={lm.y} r={32} fill="none" stroke={lm.accentColor} strokeWidth={3} />
                        </g>
                      ))}

                      {playMode === 'sandbox' && (
                        <>
                          {sandboxSummary.gangOutposts.map((op) => (
                            <g key={op.id} transform={`translate(${op.x}, ${op.y})`} opacity={op.cleared ? 0.35 : 1}>
                              <circle
                                r={125}
                                fill={op.accentHex}
                                fillOpacity={op.cleared ? 0.04 : 0.14}
                                stroke={op.accentHex}
                                strokeWidth={5}
                                strokeDasharray="18 12"
                              />
                              <polygon
                                points="0,-24 24,0 0,24 -24,0"
                                fill={op.cleared ? '#4ADE80' : op.accentHex}
                                stroke="#080D18"
                                strokeWidth={5}
                              />
                            </g>
                          ))}

                          {sandboxSummary.signalTowers.map((tw) => (
                            <g key={tw.id} transform={`translate(${tw.x}, ${tw.y})`}>
                              <circle
                                r={34}
                                fill="none"
                                stroke={tw.synced ? '#4ADE80' : tw.accentHex}
                                strokeWidth={4}
                              />
                              <polygon
                                points="0,-24 18,14 -18,14"
                                fill={tw.synced ? '#4ADE80' : '#FFD166'}
                                stroke="#080D18"
                                strokeWidth={4}
                              />
                            </g>
                          ))}

                          {sandboxSummary.secretVaults
                            .filter((sv) => sv.revealed && !sv.opened)
                            .map((sv) => (
                              <g key={sv.id} transform={`translate(${sv.x}, ${sv.y})`}>
                                <rect
                                  x={-18}
                                  y={-18}
                                  width={36}
                                  height={36}
                                  fill="#FFD166"
                                  stroke="#080D18"
                                  strokeWidth={5}
                                />
                              </g>
                            ))}

                          {sandboxSummary.metroStations.map((ms) => {
                            const canTravel = ms.discovered && wantedLevel === 0;
                            return (
                              <g
                                key={ms.id}
                                transform={`translate(${ms.x}, ${ms.y})`}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  if (canTravel) handleFastTravel(ms.id);
                                }}
                                className={canTravel ? 'cursor-pointer' : ''}
                                opacity={ms.discovered ? 1 : 0.45}
                              >
                                <rect
                                  x={-24}
                                  y={-24}
                                  width={48}
                                  height={48}
                                  fill="#080D18"
                                  stroke={ms.discovered ? '#00F5FF' : '#64748B'}
                                  strokeWidth={5}
                                />
                                <text
                                  x={0}
                                  y={10}
                                  textAnchor="middle"
                                  fill={ms.discovered ? '#00F5FF' : '#94A3B8'}
                                  fontSize="28"
                                  fontWeight="bold"
                                  fontFamily="monospace"
                                >
                                  M
                                </text>
                              </g>
                            );
                          })}

                          {terraria.pylons.map((py) => {
                            const canRecall = wantedLevel === 0;
                            return (
                              <g
                                key={py.id}
                                transform={`translate(${py.x}, ${py.y})`}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  if (canRecall) handleRecallPylon(py.id);
                                }}
                                className={canRecall ? 'cursor-pointer' : ''}
                              >
                                <circle
                                  r={34}
                                  fill="#C000FF"
                                  fillOpacity={0.18}
                                  stroke="#C000FF"
                                  strokeWidth={4}
                                />
                                <polygon
                                  points="0,-24 18,0 0,24 -18,0"
                                  fill="#C000FF"
                                  stroke="#00F5FF"
                                  strokeWidth={4}
                                />
                              </g>
                            );
                          })}

                          {terraria.activeBoss && (
                            <g transform={`translate(${terraria.activeBoss.x}, ${terraria.activeBoss.y})`}>
                              <circle
                                r={76}
                                fill={terraria.activeBoss.colorHex}
                                fillOpacity={0.22}
                                stroke={terraria.activeBoss.colorHex}
                                strokeWidth={7}
                                strokeDasharray="16 10"
                              />
                              <polygon
                                points="0,-36 26,-26 36,0 26,26 0,36 -26,26 -36,0 -26,-26"
                                fill={terraria.activeBoss.colorHex}
                                stroke="#080D18"
                                strokeWidth={6}
                              />
                            </g>
                          )}

                          {exploration.chipMarkers.map((cm, idx) => (
                            <polygon
                              key={`chip-${idx}`}
                              points={`${cm.x},${cm.y - 24} ${cm.x + 24},${cm.y} ${cm.x},${cm.y + 24} ${cm.x - 24},${cm.y}`}
                              fill="#C000FF"
                              stroke="#00F5FF"
                              strokeWidth={5}
                            />
                          ))}

                          {wantedLevel > 0 && !spotted && lastKnownPos && (
                            <circle
                              cx={lastKnownPos.x}
                              cy={lastKnownPos.y}
                              r={88}
                              fill="#FF4545"
                              fillOpacity={0.14}
                              stroke="#FF4545"
                              strokeWidth={6}
                              strokeDasharray="18 14"
                            />
                          )}

                          {policeMarkers.map((pm) => {
                            if (pm.id === 'vigilante-target') {
                              return (
                                <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                                  <circle r={48} fill="#FFD166" fillOpacity={0.22} stroke="#FF4545" strokeWidth={6} />
                                  <polygon points="0,-26 26,0 0,26 -26,0" fill="#FFD166" stroke="#FF4545" strokeWidth={5} />
                                </g>
                              );
                            }
                            const isHostile = pm.state !== 'PATROL';
                            return (
                              <g key={pm.id} transform={`translate(${pm.x}, ${pm.y})`}>
                                {isHostile && <circle r={34} fill="none" stroke="#FF4545" strokeWidth={5} />}
                                <rect
                                  x={-16}
                                  y={-16}
                                  width={32}
                                  height={32}
                                  fill={isHostile ? '#FF4545' : '#38BDF8'}
                                  stroke="#080D18"
                                  strokeWidth={5}
                                />
                              </g>
                            );
                          })}

                          {randomEvents.map((ev) => (
                            <g key={`map-ev-${ev.id}`} transform={`translate(${ev.x}, ${ev.y})`}>
                              <circle
                                r={60}
                                fill={ev.accentColor}
                                fillOpacity={0.2}
                                stroke={ev.accentColor}
                                strokeWidth={6}
                              />
                              <polygon
                                points="0,-28 28,0 0,28 -28,0"
                                fill={ev.accentColor}
                                stroke="#080D18"
                                strokeWidth={5}
                              />
                            </g>
                          ))}

                          {activeMission?.targetPos && (
                            <g transform={`translate(${activeMission.targetPos.x}, ${activeMission.targetPos.y})`}>
                              <circle r={54} fill="#FFD166" fillOpacity={0.22} stroke="#FFD166" strokeWidth={6} />
                              <polygon points="0,-28 26,0 0,28 -26,0" fill="#FFD166" stroke="#080D18" strokeWidth={5} />
                            </g>
                          )}
                        </>
                      )}

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
                            strokeWidth={5}
                          />
                        ))}

                      {playMode === 'race' && race.active && race.targetPos && (
                        <g transform={`translate(${race.targetPos.x}, ${race.targetPos.y})`}>
                          <circle r={66} fill="#FFD166" fillOpacity={0.28} stroke="#00F5FF" strokeWidth={8} />
                          <polygon points="0,-32 28,0 0,32 -28,0" fill="#FFD166" stroke="#080D18" strokeWidth={6} />
                        </g>
                      )}

                      {customWaypoint && (
                        <g transform={`translate(${customWaypoint.x}, ${customWaypoint.y})`}>
                          <circle r={56} fill="#38BDF8" fillOpacity={0.2} stroke="#38BDF8" strokeWidth={6} />
                          <line x1={-38} y1={0} x2={38} y2={0} stroke="#00F5FF" strokeWidth={6} />
                          <line x1={0} y1={-38} x2={0} y2={38} stroke="#00F5FF" strokeWidth={6} />
                          <circle r={12} fill="#FFD166" stroke="#080D18" strokeWidth={4} />
                        </g>
                      )}

                      <g transform={`translate(${playerX}, ${playerY}) rotate(${facingDeg})`}>
                        <polygon points="48,0 -28,-28 -14,0 -28,28" fill="#00F5FF" stroke="#080D18" strokeWidth={6} />
                      </g>
                    </svg>
                  </div>

                  {/* Map Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#0C1324] px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMapZoom((z) => Math.min(2.8, Number((z + 0.35).toFixed(2))))}
                        className="flex cursor-pointer items-center gap-1 border border-slate-700 bg-[#080D18] px-2.5 py-1 text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF]"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        放大
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapZoom((z) => Math.max(1, Number((z - 0.35).toFixed(2))))}
                        className="flex cursor-pointer items-center gap-1 border border-slate-700 bg-[#080D18] px-2.5 py-1 text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF]"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                        缩小
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMapZoom(1);
                          setMapCenter({ x: WORLD_CONFIG.WIDTH / 2, y: WORLD_CONFIG.HEIGHT / 2 });
                        }}
                        className="flex cursor-pointer items-center gap-1 border border-slate-700 bg-[#080D18] px-2.5 py-1 text-slate-200 hover:border-[#FFD166] hover:text-[#FFD166]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        全景复位
                      </button>
                      <button
                        type="button"
                        onClick={() => panToWorldPoint(playerX, playerY, 2.0)}
                        className="flex cursor-pointer items-center gap-1 border border-[#00F5FF]/60 bg-[#00F5FF]/15 px-2.5 py-1 font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        定位玩家
                      </button>
                    </div>
                    {customWaypoint && (
                      <button
                        type="button"
                        onClick={() => gameEvents.emit(GAME_EVENT.SET_CUSTOM_WAYPOINT, null)}
                        className="cursor-pointer border border-[#FF4545]/60 bg-[#FF4545]/15 px-2.5 py-1 font-bold text-[#FF4545] hover:bg-[#FF4545] hover:text-[#080D18]"
                      >
                        清除航标
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Sidebar: Legend + Current District + World Dynamics */}
                <div className="flex flex-col gap-2.5 border border-slate-800 bg-[#0C1324] p-2.5">
                  {/* Legend */}
                  <div className="border border-slate-800 bg-[#080D18] p-2">
                    <div className="mb-1.5 text-xs font-bold tracking-wider text-[#00F5FF]">图例</div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#00F5FF]" /> 玩家位置
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#FFD166]" /> 任务/金库
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#FF2E88]" /> 敌对据点
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#4ADE80]" /> 同步信号塔
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 border border-[#00F5FF] bg-[#080D18]" /> 地铁快传
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#C000FF]" /> 芯片/晶塔
                      </span>
                    </div>
                  </div>

                  {/* Current Region */}
                  <div className="border border-[#C000FF]/45 bg-[#080D18] p-2">
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#C000FF]">
                      <span>当前区域</span>
                      <span className="font-mono-tabular text-[10px] text-[#FFD166]">
                        {environment.clockText} {environment.weatherLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-16 shrink-0 overflow-hidden border border-[#00F5FF]/50">
                        <CityPreviewImg className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100">{districtName}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          信号塔 {sandboxSummary.signalTowers.filter((t) => t.synced).length}/
                          {sandboxSummary.signalTowers.length} · 据点{' '}
                          {sandboxSummary.gangOutposts.filter((o) => o.cleared).length}/
                          {sandboxSummary.gangOutposts.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* World Dynamics */}
                  <div className="flex-1 overflow-y-auto border border-slate-800 bg-[#080D18] p-2">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#FF2E88]">
                      <span>世界动态</span>
                      <span className="font-mono-tabular text-[10px] text-slate-400">
                        {playMode === 'sandbox' ? `${randomEvents.length} 项进行中` : playMode}
                      </span>
                    </div>
                    {playMode === 'sandbox' && randomEvents.length > 0 ? (
                      <div className="space-y-1.5">
                        {randomEvents.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => panToWorldPoint(ev.x, ev.y, 1.9)}
                            className="w-full cursor-pointer border-l-2 bg-[#111827] px-2 py-1 text-left text-[11px] hover:bg-[#192338]"
                            style={{ borderColor: ev.accentColor }}
                          >
                            <div className="flex items-center justify-between gap-1 font-bold">
                              <span className="truncate" style={{ color: ev.accentColor }}>
                                {ev.title}
                              </span>
                              <span className="font-mono-tabular text-[10px] text-slate-400">
                                {ev.timeRemainingSec}s
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{ev.district}</span>
                              <span className="font-mono-tabular">
                                目标 {ev.remainingTargets}/{ev.totalTargets}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : playMode === 'race' && race.active ? (
                      <div className="text-xs text-slate-300">
                        环城竞速进行中：检查点 {race.checkpointIndex + 1}/{race.totalCheckpoints}
                      </div>
                    ) : playMode === 'horde' ? (
                      <div className="text-xs text-slate-300">
                        第 {horde.wave} 波防卫战 · 剩余敌军 {horde.enemiesRemaining}
                      </div>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        当前城区治安暂稳，随时留意广播警报与黑帮火拼信号。
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Bar: Current Mission Banner + Quick Teleport Cards */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[340px_1fr]">
                {/* Current Mission */}
                <div className="flex flex-col justify-between border border-[#FFD166]/65 bg-[#0C1324] p-2.5">
                  {activeMission ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-[#FFD166]">
                          当前任务 · {activeMission.title}
                        </span>
                        {activeMission.targetPos && (
                          <span className="shrink-0 font-mono-tabular text-[11px] font-bold text-[#00F5FF]">
                            {formatDistanceLabel(
                              activeMission.targetPos.x - playerX,
                              activeMission.targetPos.y - playerY
                            )}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                        {activeMission.instruction}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="font-mono-tabular text-[11px] font-bold text-[#FFD166]">
                          赏金 ${activeMission.reward}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {activeMission.targetPos && (
                            <button
                              type="button"
                              onClick={() =>
                                panToWorldPoint(
                                  activeMission.targetPos!.x,
                                  activeMission.targetPos!.y,
                                  2.0
                                )
                              }
                              className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/20 px-2.5 py-1 text-[11px] font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                            >
                              追踪目标
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => gameEvents.emit(GAME_EVENT.ABANDON_MISSION)}
                            className="cursor-pointer border border-slate-700 bg-[#080D18] px-2 py-1 text-[11px] text-slate-300 hover:border-[#FF4545] hover:text-[#FF4545]"
                          >
                            放弃
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-200">当前无进行中委托</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          已完成 {completedMissionIds.length}/{MISSION_DEFINITIONS.length} 项委托
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openHubTab('missions')}
                        className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-3 py-1.5 text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                      >
                        接取任务
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Teleport Horizontal Card Strip */}
                <div className="flex flex-col justify-between border border-[#00F5FF]/40 bg-[#0C1324] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#00F5FF]">
                    <span className="flex items-center gap-1.5">
                      <Train className="h-3.5 w-3.5" />
                      快速传送枢纽（磁悬浮站 & 个人晶塔）
                    </span>
                    {wantedLevel > 0 && (
                      <span className="text-[11px] text-[#FF4545]">通缉状态下传送锁定</span>
                    )}
                  </div>

                  {playMode !== 'sandbox' ? (
                    <div className="text-xs text-slate-400">仅自由沙盒模式开放全区快速传送。</div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {sandboxSummary.metroStations.map((ms) => {
                        const canTravel = ms.discovered && wantedLevel === 0;
                        return (
                          <button
                            key={ms.id}
                            type="button"
                            disabled={!canTravel}
                            onClick={() => handleFastTravel(ms.id)}
                            className={`flex min-w-[136px] shrink-0 flex-col justify-between border px-2.5 py-1.5 text-left transition-colors ${
                              canTravel
                                ? 'cursor-pointer border-[#00F5FF]/60 bg-[#080D18] hover:border-[#00F5FF] hover:bg-[#00F5FF]/15'
                                : 'cursor-not-allowed border-slate-800 bg-[#080D18]/60 opacity-55'
                            }`}
                          >
                            <span className="truncate text-[11px] font-bold text-slate-100">
                              {ms.name}
                            </span>
                            <span
                              className={`mt-0.5 font-mono-tabular text-[10px] font-bold ${
                                canTravel ? 'text-[#00F5FF]' : 'text-slate-500'
                              }`}
                            >
                              {ms.discovered ? (wantedLevel > 0 ? '通缉锁定' : '点击快传') : '未发现站点'}
                            </span>
                          </button>
                        );
                      })}

                      {terraria.pylons.map((py) => {
                        const canRecall = wantedLevel === 0;
                        return (
                          <button
                            key={py.id}
                            type="button"
                            disabled={!canRecall}
                            onClick={() => handleRecallPylon(py.id)}
                            className={`flex min-w-[136px] shrink-0 flex-col justify-between border px-2.5 py-1.5 text-left transition-colors ${
                              canRecall
                                ? 'cursor-pointer border-[#C000FF]/70 bg-[#C000FF]/12 hover:bg-[#C000FF]/25'
                                : 'cursor-not-allowed border-slate-800 bg-[#080D18]/60 opacity-55'
                            }`}
                          >
                            <span className="truncate text-[11px] font-bold text-[#E9D5FF]">
                              ⚡ {py.label}
                            </span>
                            <span className="mt-0.5 font-mono-tabular text-[10px] font-bold text-[#C000FF]">
                              {canRecall ? '折跃晶塔' : '通缉锁定'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: MISSIONS LOG ================= */}
          {currentTab === 'missions' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[270px_1fr]">
              {/* Left: Fixer Portrait Card */}
              <div className="flex flex-col justify-between gap-3 border border-[#C000FF]/55 bg-[#0C1324] p-3.5">
                <div>
                  <div className="overflow-hidden border-2 border-[#FF2E88]/70 bg-[#080D18]">
                    <FixerAvatarImg className="aspect-square w-full" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold tracking-wider text-[#FF2E88]">
                      情报联络官 · 艾拉
                    </span>
                    <span className="border border-[#00F5FF]/50 bg-[#00F5FF]/10 px-1.5 py-0.5 font-mono-tabular text-[10px] text-[#00F5FF]">
                      加密频道
                    </span>
                  </div>
                  <div className="mt-2 border-l-2 border-[#00F5FF] bg-[#080D18] p-2.5 text-xs leading-relaxed text-slate-200">
                    “{fixerQuote}”
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-800 pt-2.5 font-mono-tabular text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>已完成委托</span>
                    <span className="font-bold text-[#4ADE80]">
                      {completedMissionIds.length} / {MISSION_DEFINITIONS.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>委托累计赏金</span>
                    <span className="font-bold text-[#FFD166]">
                      ${totalMissionEarnings.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>数据芯片解析</span>
                    <span className="font-bold text-[#C000FF]">
                      {exploration.chipsCollected} / {exploration.totalChips}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Mission Lists */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
                  {(
                    [
                      { id: 'main', label: `主线委托 (${MISSION_DEFINITIONS.length})` },
                      { id: 'explore', label: '探索与据点清剿' },
                      { id: 'events', label: `城市动态事件 (${randomEvents.length})` },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setMissionSubTab(t.id)}
                      className={`cursor-pointer border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors ${
                        missionSubTab === t.id
                          ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166]'
                          : 'border-slate-700 bg-[#0C1324] text-slate-300 hover:border-[#00F5FF]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {missionSubTab === 'main' && (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {MISSION_DEFINITIONS.map((m) => {
                      const isActive = activeMission?.id === m.id;
                      const isDone = completedMissionIds.includes(m.id);
                      const firstPos = m.steps[0]?.targetPos ?? null;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col justify-between gap-2.5 border p-3.5 ${
                            isActive
                              ? 'border-[#FFD166] bg-[#FFD166]/10'
                              : isDone
                                ? 'border-emerald-600/45 bg-[#0C1324]'
                                : 'border-slate-800 bg-[#0C1324]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-slate-100">{m.title}</span>
                              <span
                                className={`border px-1.5 py-0.5 text-[10px] font-bold ${
                                  isActive
                                    ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166]'
                                    : isDone
                                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                                      : 'border-slate-700 bg-[#080D18] text-slate-300'
                                }`}
                              >
                                {isActive ? '追踪中' : isDone ? '已完成' : m.category}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                              {m.summary}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
                            <div className="font-mono-tabular text-xs">
                              <span className="font-bold text-[#FFD166]">+${m.reward}</span>
                              <span className="mx-1.5 text-slate-600">·</span>
                              <span className="text-[#00F5FF]">+95 EXP</span>
                              {m.timeLimitSec && (
                                <>
                                  <span className="mx-1.5 text-slate-600">·</span>
                                  <span className="text-slate-400">限时 {m.timeLimitSec}s</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isActive ? (
                                <>
                                  {activeMission.targetPos && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        openHubTab('map');
                                        panToWorldPoint(
                                          activeMission.targetPos!.x,
                                          activeMission.targetPos!.y,
                                          2.0
                                        );
                                      }}
                                      className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/20 px-2.5 py-1 text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                                    >
                                      定位
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => gameEvents.emit(GAME_EVENT.ABANDON_MISSION)}
                                    className="cursor-pointer border border-[#FF4545]/70 bg-[#FF4545]/15 px-2.5 py-1 text-xs font-bold text-[#FF4545] hover:bg-[#FF4545] hover:text-[#080D18]"
                                  >
                                    放弃
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  disabled={playMode !== 'sandbox'}
                                  onClick={() => {
                                    gameEvents.emit(GAME_EVENT.ACCEPT_MISSION, m.id);
                                    if (firstPos) {
                                      setMapCenter(firstPos);
                                    }
                                    closeHub();
                                  }}
                                  className="cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-3 py-1 text-xs font-bold text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {isDone ? '重新挑战' : '接取追踪'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {missionSubTab === 'explore' && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="border border-[#00F5FF]/45 bg-[#0C1324] p-3.5">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#00F5FF]">
                        <span>信号塔与磁悬浮网络</span>
                        <span className="font-mono-tabular">
                          {sandboxSummary.signalTowers.filter((t) => t.synced).length}/
                          {sandboxSummary.signalTowers.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {sandboxSummary.signalTowers.map((tw) => (
                          <div
                            key={tw.id}
                            className="flex items-center justify-between border border-slate-800 bg-[#080D18] px-2.5 py-1.5 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-100">{tw.name}</div>
                              <div className="text-[10px] text-slate-400">{tw.districtName}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                openHubTab('map');
                                panToWorldPoint(tw.x, tw.y, 2.0);
                              }}
                              className={`cursor-pointer border px-2 py-0.5 text-[11px] font-bold ${
                                tw.synced
                                  ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300'
                                  : 'border-[#FFD166]/60 bg-[#FFD166]/15 text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]'
                              }`}
                            >
                              {tw.synced ? '已同步 · 查看' : '地图定位'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-[#FF2E88]/45 bg-[#0C1324] p-3.5">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#FF2E88]">
                        <span>黑帮武装据点清剿</span>
                        <span className="font-mono-tabular">
                          {sandboxSummary.gangOutposts.filter((o) => o.cleared).length}/
                          {sandboxSummary.gangOutposts.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {sandboxSummary.gangOutposts.map((op) => (
                          <div
                            key={op.id}
                            className="flex items-center justify-between border border-slate-800 bg-[#080D18] px-2.5 py-1.5 text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-100">{op.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {op.faction} · 守卫 {op.guardsAlive}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                openHubTab('map');
                                panToWorldPoint(op.x, op.y, 2.0);
                              }}
                              className={`cursor-pointer border px-2 py-0.5 text-[11px] font-bold ${
                                op.cleared
                                  ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300'
                                  : 'border-[#FF2E88]/60 bg-[#FF2E88]/15 text-[#FF2E88] hover:bg-[#FF2E88] hover:text-[#080D18]'
                              }`}
                            >
                              {op.cleared ? '已解放' : '前往清剿'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {missionSubTab === 'events' && (
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {randomEvents.length === 0 ? (
                      <div className="col-span-full border border-slate-800 bg-[#0C1324] p-6 text-center text-sm text-slate-400">
                        当前城区暂无突发动态事件，在街区自由巡游时系统将自动推送武装押运、街头抢劫与赛博疯子讨伐！
                      </div>
                    ) : (
                      randomEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex flex-col justify-between gap-2 border bg-[#0C1324] p-3.5"
                          style={{ borderColor: `${ev.accentColor}88` }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold" style={{ color: ev.accentColor }}>
                                {ev.title}
                              </span>
                              <span className="font-mono-tabular text-xs text-slate-400">
                                剩余 {ev.timeRemainingSec}s
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-300">{ev.description}</p>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
                            <span className="font-mono-tabular text-slate-300">
                              {ev.district} · 目标 {ev.remainingTargets}/{ev.totalTargets}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                openHubTab('map');
                                panToWorldPoint(ev.x, ev.y, 2.0);
                              }}
                              className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-2.5 py-1 text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                            >
                              地图定位
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: CHARACTER ================= */}
          {currentTab === 'character' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[290px_1fr]">
              {/* Left: Full-Body Hero Pedestal + Core Combat Stats */}
              <div className="flex flex-col justify-between gap-3 border border-[#C000FF]/55 bg-[#0C1324] p-3.5">
                <div>
                  <div className="relative overflow-hidden border-2 border-[#00F5FF]/60 bg-[#060913]">
                    <HeroFullBodyImg className="aspect-[3/4] w-full" />
                    <div className="border-t border-[#C000FF]/60 bg-[#080D18]/92 px-3 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-slate-100">
                          <User className="h-3.5 w-3.5 text-[#00F5FF]" />
                          特区行动员
                        </span>
                        <span className="font-mono-tabular text-xs font-bold text-[#FFD166]">
                          可用技能点 {progression.skillPoints}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 font-mono-tabular text-[11px]">
                    <div className="border border-slate-800 bg-[#080D18] px-2 py-1 text-slate-300">
                      伤害 <span className="font-bold text-[#FF2E88]">+{progression.damageBonusPct}%</span>
                    </div>
                    <div className="border border-slate-800 bg-[#080D18] px-2 py-1 text-slate-300">
                      暴击 <span className="font-bold text-[#FFD166]">{progression.critChancePct}%</span>
                    </div>
                    <div className="border border-slate-800 bg-[#080D18] px-2 py-1 text-slate-300">
                      射速 <span className="font-bold text-[#00F5FF]">+{progression.fireRateBonusPct}%</span>
                    </div>
                    <div className="border border-slate-800 bg-[#080D18] px-2 py-1 text-slate-300">
                      移速 <span className="font-bold text-[#38BDF8]">+{progression.moveSpeedBonusPct}%</span>
                    </div>
                    <div className="border border-slate-800 bg-[#080D18] px-2 py-1 text-slate-300">
                      车速 <span className="font-bold text-[#FACC15]">+{progression.vehicleSpeedBonusPct}%</span>
                    </div>
                    <div className="border border-slate-800 bg-[#080D18] px-2 py-1 text-slate-300">
                      减伤 <span className="font-bold text-[#4ADE80]">{progression.damageReductionPct}%</span>
                    </div>
                  </div>
                </div>

                {terraria.equippedAccessories.length > 0 && (
                  <div className="border-t border-slate-800 pt-2">
                    <div className="mb-1 text-[10px] font-bold text-[#4ADE80]">已佩戴泰拉饰品</div>
                    <div className="flex flex-wrap gap-1">
                      {terraria.equippedAccessories.map((accId) => (
                        <span
                          key={accId}
                          className="border border-[#FFD166]/55 bg-[#FFD166]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#FFD166]"
                        >
                          {TERRARIA_ACCESSORY_META[accId].name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Skills, Cyberware, Reputation */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCharSubTab('skills')}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
                      charSubTab === 'skills'
                        ? 'border-[#FFD166] bg-[#FFD166]/18 text-[#FFD166]'
                        : 'border-slate-700 bg-[#0C1324] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>能力技能树</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharSubTab('cyberware')}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
                      charSubTab === 'cyberware'
                        ? 'border-[#00F5FF] bg-[#00F5FF]/18 text-[#00F5FF]'
                        : 'border-slate-700 bg-[#0C1324] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>赛博义体植入</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharSubTab('reputation')}
                    className={`flex cursor-pointer items-center justify-center gap-1.5 border px-3 py-2 text-xs font-bold tracking-wider transition-colors sm:text-sm ${
                      charSubTab === 'reputation'
                        ? 'border-[#FF2E88] bg-[#FF2E88]/18 text-[#FF2E88]'
                        : 'border-slate-700 bg-[#0C1324] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>三方声望档案</span>
                  </button>
                </div>

                {charSubTab === 'skills' && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {SKILL_TREE_ORDER.map((trackId) => {
                      const spec = SKILL_TREE_SPECS[trackId];
                      const curLv = progression.skills[trackId] ?? 0;
                      const isMax = curLv >= spec.maxLevel;
                      const canUpgrade = !isTitleMode && !isMax && progression.skillPoints > 0;

                      return (
                        <div
                          key={trackId}
                          className="flex flex-col justify-between gap-2.5 border bg-[#0C1324] p-3.5"
                          style={{ borderColor: `${spec.accentColor}66` }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold" style={{ color: spec.accentColor }}>
                                {spec.name}
                              </span>
                              <span className="border border-slate-700 bg-[#080D18] px-2 py-0.5 font-mono-tabular text-xs font-bold text-slate-100">
                                Lv.{curLv}/{spec.maxLevel}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">{spec.subtitle}</p>

                            <div className="mt-2 space-y-1">
                              {spec.levelEffects.map((effect, idx) => {
                                const tierLv = idx + 1;
                                const unlocked = curLv >= tierLv;
                                const isNext = curLv + 1 === tierLv;
                                return (
                                  <div
                                    key={`${trackId}-lv-${tierLv}`}
                                    className={`flex items-start gap-2 border px-2 py-1 text-[11px] ${
                                      unlocked
                                        ? 'border-emerald-500/45 bg-emerald-950/25 text-slate-100'
                                        : isNext
                                          ? 'border-slate-600 bg-[#080D18] text-slate-200'
                                          : 'border-slate-800/80 bg-[#080D18]/50 text-slate-500'
                                    }`}
                                  >
                                    <span
                                      className="shrink-0 font-mono-tabular text-[10px] font-bold"
                                      style={{ color: unlocked ? '#4ADE80' : spec.accentColor }}
                                    >
                                      Lv.{tierLv}
                                    </span>
                                    <span>{effect}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!canUpgrade}
                            onClick={() => gameEvents.emit(GAME_EVENT.UPGRADE_SKILL, trackId)}
                            className={`flex min-h-[36px] w-full items-center justify-center border px-3 py-1 text-xs font-bold transition-colors ${
                              isMax
                                ? 'cursor-default border-emerald-600/50 bg-emerald-950/30 text-emerald-300'
                                : canUpgrade
                                  ? 'cursor-pointer border-[#FFD166] bg-[#FFD166]/18 text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]'
                                  : 'cursor-not-allowed border-slate-700 bg-[#080D18] text-slate-500'
                            }`}
                          >
                            {isTitleMode
                              ? '进入游戏后加点升级'
                              : isMax
                                ? '已达满级专精'
                                : canUpgrade
                                  ? '消耗 1 技能点升级'
                                  : '技能点不足'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {charSubTab === 'cyberware' && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {CYBERWARE_SLOT_ORDER.map((slotId) => {
                      const spec = CYBERWARE_SPECS[slotId];
                      const installedTier = progression.cyberware[slotId] ?? 0;
                      const currentSpec = installedTier > 0 ? spec.tiers[installedTier - 1] : null;
                      const nextSpec =
                        installedTier < spec.tiers.length ? spec.tiers[installedTier] : null;
                      const reqFaction = nextSpec?.requiredFaction;
                      const reqRep = nextSpec?.requiredRep ?? 0;
                      const currentRep = reqFaction ? progression.reputation[reqFaction] ?? 0 : 0;
                      const repMet = !reqFaction || currentRep >= reqRep;
                      const cashMet = nextSpec ? cash >= nextSpec.cost : false;
                      const canInstall = Boolean(!isTitleMode && nextSpec && repMet && cashMet);

                      return (
                        <div
                          key={slotId}
                          className="flex flex-col justify-between gap-2.5 border bg-[#0C1324] p-3.5"
                          style={{ borderColor: `${spec.accentColor}66` }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold" style={{ color: spec.accentColor }}>
                                {spec.slotLabel}
                              </span>
                              <span className="border border-slate-700 bg-[#080D18] px-2 py-0.5 font-mono-tabular text-xs font-bold text-slate-100">
                                {installedTier > 0 ? `已装 MK.${installedTier}` : '未安装'}
                              </span>
                            </div>

                            <div className="mt-2 border border-slate-800 bg-[#080D18] p-2 text-xs">
                              {currentSpec ? (
                                <>
                                  <div className="font-bold text-slate-100">{currentSpec.name}</div>
                                  <div className="mt-0.5 text-[11px] text-emerald-300">
                                    {currentSpec.effectText}
                                  </div>
                                </>
                              ) : (
                                <div className="text-[11px] text-slate-500">
                                  原生人体组织（尚未植入军用义体）
                                </div>
                              )}
                            </div>

                            {nextSpec && (
                              <div className="mt-2 border border-slate-700/80 bg-[#080D18] p-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-[#00F5FF]">
                                    下一阶：MK.{nextSpec.tier}
                                  </span>
                                  <span className="font-mono-tabular text-xs font-bold text-[#FFD166]">
                                    ${nextSpec.cost}
                                  </span>
                                </div>
                                <div className="mt-0.5 font-bold text-slate-100">{nextSpec.name}</div>
                                <div className="mt-0.5 text-[11px] text-slate-300">
                                  {nextSpec.effectText}
                                </div>
                                {reqFaction && (
                                  <div
                                    className={`mt-1 inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-bold ${
                                      repMet
                                        ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-300'
                                        : 'border-[#FF4545]/60 bg-[#FF4545]/10 text-[#FF4545]'
                                    }`}
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                    需求 {REPUTATION_SPECS[reqFaction].name} {currentRep}/{reqRep}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {nextSpec ? (
                            <button
                              type="button"
                              disabled={!canInstall}
                              onClick={() => gameEvents.emit(GAME_EVENT.BUY_CYBERWARE, slotId)}
                              className={`flex min-h-[36px] w-full items-center justify-center border px-3 py-1 text-xs font-bold transition-colors ${
                                canInstall
                                  ? 'cursor-pointer border-[#00F5FF] bg-[#00F5FF]/18 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                                  : 'cursor-not-allowed border-slate-700 bg-[#080D18] text-slate-500'
                              }`}
                            >
                              {isTitleMode
                                ? '进入游戏后植入'
                                : !repMet
                                  ? `需要${REPUTATION_SPECS[reqFaction!].name} ≥ ${reqRep}`
                                  : !cashMet
                                    ? `现金不足 ($${nextSpec.cost})`
                                    : `植入安装 $${nextSpec.cost}`}
                            </button>
                          ) : (
                            <div className="flex min-h-[36px] items-center justify-center border border-emerald-600/50 bg-emerald-950/30 text-xs font-bold text-emerald-300">
                              终极义体已满阶
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {charSubTab === 'reputation' && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {REPUTATION_ORDER.map((factionId) => {
                      const spec = REPUTATION_SPECS[factionId];
                      const rep = progression.reputation[factionId] ?? 0;
                      let currentTitle = spec.ranks[0].title;
                      for (const rk of spec.ranks) {
                        if (rep >= rk.minRep) currentTitle = rk.title;
                      }
                      const maxMilestone = spec.ranks[spec.ranks.length - 1].minRep;
                      const barPct = Math.min(100, Math.round((rep / maxMilestone) * 100));

                      return (
                        <div
                          key={factionId}
                          className="flex flex-col justify-between gap-2.5 border bg-[#0C1324] p-3.5"
                          style={{ borderColor: `${spec.accentColor}70` }}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold" style={{ color: spec.accentColor }}>
                                {spec.name}
                              </span>
                              <span className="font-mono-tabular text-xs font-bold text-slate-100">
                                {rep} 声望
                              </span>
                            </div>
                            <div className="mt-1.5 inline-flex items-center gap-1 border border-slate-700 bg-[#080D18] px-2 py-0.5 text-xs font-bold text-slate-100">
                              <Sparkles className="h-3 w-3" style={{ color: spec.accentColor }} />
                              <span>{currentTitle}</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                              {spec.description}
                            </p>
                            <div className="mt-2.5 h-2 w-full bg-[#151C2B]">
                              <div
                                className="h-full"
                                style={{ width: `${barPct}%`, backgroundColor: spec.accentColor }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1 border-t border-slate-800 pt-2">
                            {spec.ranks.map((rk) => (
                              <div
                                key={`${factionId}-${rk.minRep}`}
                                className={`flex justify-between px-2 py-0.5 text-[11px] ${
                                  rep >= rk.minRep ? 'bg-[#080D18] font-bold text-slate-100' : 'text-slate-500'
                                }`}
                              >
                                <span>{rk.title}</span>
                                <span className="font-mono-tabular">
                                  {rk.minRep === 0 ? '初始' : `${rk.minRep}+`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: VEHICLES & GARAGE ================= */}
          {currentTab === 'vehicles' && (
            <div className="flex flex-col gap-3.5">
              {/* Active or Nearby Vehicle Tuning Deck */}
              {!isTitleMode && (
                <div className="border border-[#00F5FF]/55 bg-[#0C1324] p-3.5">
                  {activeVehTarget ? (
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[230px_1fr]">
                      <div className="flex flex-col justify-between border border-slate-800 bg-[#080D18] p-2.5">
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#00F5FF]">
                              {inVehicle ? '当前驾驶载具' : '附近待命载具'}
                            </span>
                            <span className="font-mono-tabular text-[#FFD166]">
                              {activeVehTarget.health}/{activeVehTarget.maxHealth}
                            </span>
                          </div>
                          <VehiclePixelArt
                            type={activeVehTarget.type}
                            paintHex={
                              activeVehTarget.paintColor !== null && activeVehTarget.paintColor !== undefined
                                ? `#${activeVehTarget.paintColor.toString(16).padStart(6, '0')}`
                                : null
                            }
                            className="my-1.5 h-20 w-full"
                          />
                          <div className="text-center text-sm font-bold text-slate-100">
                            {activeVehTarget.name}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-col gap-1.5">
                          <button
                            type="button"
                            disabled={
                              activeVehTarget.health >= activeVehTarget.maxHealth ||
                              cash < ECONOMY_CONFIG.VEHICLE_REPAIR_COST
                            }
                            onClick={() =>
                              gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                serviceType: 'repair',
                                vehicleId: activeVehTarget.id,
                                fromHub: true,
                              })
                            }
                            className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 py-1.5 text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {activeVehTarget.health >= activeVehTarget.maxHealth
                              ? '车身完好无需修复'
                              : `全面修复 $${ECONOMY_CONFIG.VEHICLE_REPAIR_COST}`}
                          </button>

                          {wantedLevel > 0 && (
                            <button
                              type="button"
                              disabled={cash < ECONOMY_CONFIG.STEALTH_RESPRAY_COST}
                              onClick={() =>
                                gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                  serviceType: 'respray',
                                })
                              }
                              className="cursor-pointer border border-[#FF2E88] bg-[#FF2E88]/20 py-1.5 text-xs font-bold text-[#FF2E88] hover:bg-[#FF2E88] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              隐匿喷漆消星 ${ECONOMY_CONFIG.STEALTH_RESPRAY_COST}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between gap-2.5">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {(['engine', 'handling', 'armor'] as VehicleUpgradeTrack[]).map((track) => {
                            const cfg = VEHICLE_UPGRADE_CONFIG[track];
                            const lvl = activeVehTarget.upgrades[track] ?? 0;
                            const isMax = lvl >= cfg.maxLevel;
                            const cost = cfg.costs[lvl] ?? 0;
                            return (
                              <div
                                key={track}
                                className="flex flex-col justify-between border border-slate-800 bg-[#080D18] p-2.5"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className="text-slate-100">{cfg.label}</span>
                                    <span className="font-mono-tabular text-[#FFD166]">
                                      Lv.{lvl}/{cfg.maxLevel}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-400">{cfg.description}</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={isMax || cash < cost}
                                  onClick={() =>
                                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                      serviceType: 'upgrade',
                                      vehicleId: activeVehTarget.id,
                                      track,
                                      fromHub: true,
                                    })
                                  }
                                  className="mt-2 cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 py-1 text-xs font-bold text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  {isMax ? '已满级' : `改装升级 $${cost}`}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080D18] px-3 py-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <Wrench className="h-3.5 w-3.5 text-[#C000FF]" />
                            喷漆涂装方案（${ECONOMY_CONFIG.PAINT_JOB_COST}）
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {VEHICLE_PAINT_OPTIONS.map((p) => {
                              const selected = activeVehTarget.paintColor === p.colorNum;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() =>
                                    gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                      serviceType: 'paint',
                                      vehicleId: activeVehTarget.id,
                                      colorNum: p.colorNum,
                                      colorName: p.name,
                                      fromHub: true,
                                    })
                                  }
                                  className={`flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-[11px] font-bold transition-colors ${
                                    selected
                                      ? 'border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF]'
                                      : 'border-slate-700 bg-[#111827] text-slate-300 hover:border-slate-500'
                                  }`}
                                >
                                  <span
                                    className="inline-block h-2.5 w-2.5 border border-white/40"
                                    style={{ backgroundColor: p.swatchHex }}
                                  />
                                  {p.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                      <span className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-[#00F5FF]" />
                        <span>
                          当前未驾驶且身旁无载具：可在下方选购任意全特区载具直接<strong>空投到身旁</strong>，或靠近街头载具后打开本面板进行改装涂装。
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Full 10-Vehicle Catalog */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {VEHICLE_CATALOG_ORDER.map((vType: VehicleType) => {
                  const spec = VEHICLE_SPECS[vType];
                  const cost = VEHICLE_BUY_COSTS[vType];
                  const canOrder =
                    !isTitleMode &&
                    (playMode === 'sandbox' || playMode === 'horde') &&
                    cash >= cost;
                  const catLabel =
                    spec.category === 'air'
                      ? '武装航空器'
                      : spec.category === 'tank'
                        ? '重装主战坦克'
                        : spec.category === 'armor'
                          ? '重型装甲车'
                          : spec.category === 'moto'
                            ? '赛博摩托'
                            : '街头竞速车';

                  return (
                    <div
                      key={vType}
                      className="flex flex-col justify-between gap-2 border bg-[#0C1324] p-3 transition-colors hover:border-[#00F5FF]"
                      style={{ borderColor: `${spec.accentHex}66` }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold" style={{ color: spec.accentHex }}>
                            {catLabel}
                          </span>
                          <span className="font-mono-tabular text-xs font-bold text-[#FFD166]">
                            ${cost.toLocaleString()}
                          </span>
                        </div>

                        <div className="my-2 flex h-24 items-center justify-center border border-slate-800/80 bg-[#080D18] p-2">
                          <VehiclePixelArt type={vType} className="h-full w-full" />
                        </div>

                        <h3 className="text-sm font-bold text-slate-100">{spec.name}</h3>

                        <div className="mt-1.5 grid grid-cols-2 gap-1 font-mono-tabular text-[10px] text-slate-300">
                          <div className="bg-[#080D18] px-1.5 py-0.5">
                            极速 <span className="font-bold text-[#00F5FF]">{Math.round(spec.maxSpeed * 0.42)} km/h</span>
                          </div>
                          <div className="bg-[#080D18] px-1.5 py-0.5">
                            耐久 <span className="font-bold text-[#4ADE80]">{spec.maxHealth}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          武装：
                          {spec.weaponKind === 'tank_cannon'
                            ? '120mm 爆破主炮'
                            : spec.weaponKind === 'autocannon'
                              ? '双联高射机炮 · 低空飞行'
                              : '车载手枪/步枪扫射'}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canOrder}
                        onClick={() => {
                          gameEvents.emit(GAME_EVENT.SPAWN_GARAGE_VEHICLE, vType);
                          closeHub();
                        }}
                        className="mt-1 cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 py-1.5 text-xs font-bold text-[#00F5FF] transition-colors hover:bg-[#00F5FF] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-[#080D18] disabled:text-slate-500"
                      >
                        {isTitleMode
                          ? '进入游戏后呼叫空投'
                          : playMode === 'race'
                            ? '竞速模式不可更换'
                            : cash < cost
                              ? `现金不足 ($${cost.toLocaleString()})`
                              : `购买并空投 $${cost.toLocaleString()}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 5: ARMORY ================= */}
          {currentTab === 'armory' && (
            <div className="flex flex-col gap-3.5">
              {/* Field Medical & Armor Quick Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border border-[#00F5FF]/45 bg-[#0C1324] p-3">
                <div className="flex items-center gap-2.5">
                  <MedkitPixelIcon className="h-7 w-7" />
                  <div>
                    <div className="text-xs font-bold text-slate-100">战地快速补给与护甲</div>
                    <div className="text-[11px] text-slate-400">
                      急救包恢复全满生命值 · 防弹护甲可抵消 75% 所受伤害
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={health >= maxHealth || cash < ECONOMY_CONFIG.CLINIC_HEAL_COST}
                    onClick={() =>
                      gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'heal' })
                    }
                    className="cursor-pointer border border-[#FF2E88] bg-[#FF2E88]/15 px-3 py-1.5 text-xs font-bold text-[#FF2E88] hover:bg-[#FF2E88] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    纳米急救 ${ECONOMY_CONFIG.CLINIC_HEAL_COST}
                  </button>
                  <button
                    type="button"
                    disabled={armor >= maxArmor || cash < HORDE_GEAR_COSTS.ARMOR_PACK_COST}
                    onClick={() =>
                      gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'buy_armor' })
                    }
                    className="cursor-pointer border border-[#38BDF8] bg-[#38BDF8]/15 px-3 py-1.5 text-xs font-bold text-[#38BDF8] hover:bg-[#38BDF8] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    防弹战术甲 +{HORDE_GEAR_COSTS.ARMOR_PACK_AMOUNT} (${HORDE_GEAR_COSTS.ARMOR_PACK_COST})
                  </button>
                </div>
              </div>

              {/* Horde Mode Mech & Heavy Support */}
              {playMode === 'horde' && (
                <div className="border border-[#FFD166]/65 bg-[#0C1324] p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#FFD166]">
                    <span className="flex items-center gap-1.5">
                      <Swords className="h-4 w-4" />
                      无尽挑战重装空降支援
                    </span>
                    <span className="font-mono-tabular text-slate-300">
                      炮塔 {horde.mech?.turretCount ?? 0}/{horde.mech?.maxTurrets ?? 2}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {(['titan', 'phantom'] as const).map((mk) => {
                      const ms = MECH_SPECS[mk];
                      return (
                        <button
                          key={mk}
                          type="button"
                          disabled={cash < ms.cost}
                          onClick={() => {
                            gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                              serviceType: 'deploy_mech',
                              mechKind: mk,
                            });
                            closeHub();
                          }}
                          className="flex cursor-pointer flex-col justify-between border bg-[#080D18] p-2.5 text-left hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                          style={{ borderColor: ms.accentHex }}
                        >
                          <div className="text-xs font-bold" style={{ color: ms.accentHex }}>
                            {ms.shortName}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">{ms.abilityLabel}</div>
                          <div className="mt-1.5 font-mono-tabular text-xs font-bold text-[#FFD166]">
                            空降 ${ms.cost}
                          </div>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={cash < HORDE_GEAR_COSTS.TURRET_COST}
                      onClick={() => {
                        gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'deploy_turret' });
                        closeHub();
                      }}
                      className="flex cursor-pointer flex-col justify-between border border-[#00F5FF]/70 bg-[#080D18] p-2.5 text-left hover:bg-[#00F5FF]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#00F5FF]">自动激光哨戒炮</div>
                      <div className="mt-1 text-[10px] text-slate-400">自动索敌 {HORDE_GEAR_COSTS.TURRET_DURATION_SEC}s</div>
                      <div className="mt-1.5 font-mono-tabular text-xs font-bold text-[#FFD166]">
                        部署 ${HORDE_GEAR_COSTS.TURRET_COST}
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={cash < HORDE_GEAR_COSTS.ORBITAL_STRIKE_COST}
                      onClick={() => {
                        gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'orbital_strike' });
                        closeHub();
                      }}
                      className="flex cursor-pointer flex-col justify-between border border-[#FF2E88]/70 bg-[#080D18] p-2.5 text-left hover:bg-[#FF2E88]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#FF2E88]">轨道离子轰炸</div>
                      <div className="mt-1 text-[10px] text-slate-400">召唤 4 道清场天基光束</div>
                      <div className="mt-1.5 font-mono-tabular text-xs font-bold text-[#FFD166]">
                        呼叫 ${HORDE_GEAR_COSTS.ORBITAL_STRIKE_COST}
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={cash < HORDE_GEAR_COSTS.AIRDROP_TANK_COST}
                      onClick={() => {
                        gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, { serviceType: 'airdrop_tank' });
                        closeHub();
                      }}
                      className="flex cursor-pointer flex-col justify-between border border-[#4ADE80]/70 bg-[#080D18] p-2.5 text-left hover:bg-[#4ADE80]/15 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <div className="text-xs font-bold text-[#4ADE80]">空投泰坦坦克</div>
                      <div className="mt-1 text-[10px] text-slate-400">120mm 爆破主炮碾压</div>
                      <div className="mt-1.5 font-mono-tabular text-xs font-bold text-[#FFD166]">
                        空投 ${HORDE_GEAR_COSTS.AIRDROP_TANK_COST}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* 7 Weapons Full Shop & Upgrades */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {WEAPON_ORDER.map((wId, idx) => {
                  const spec = WEAPON_SPECS[wId];
                  const owned = weapon.ownedIds.includes(wId);
                  const equipped = weapon.equippedId === wId;
                  const ammo = weapon.ammoByWeapon[wId] ?? 0;
                  const maxAmmo = weapon.maxAmmoByWeapon[wId] ?? spec.maxAmmo;
                  const upg = weapon.upgradesByWeapon[wId] ?? { damage: 0, firerate: 0, capacity: 0 };

                  return (
                    <div
                      key={wId}
                      className={`flex flex-col justify-between gap-2.5 border p-3.5 ${
                        equipped ? 'bg-[#101A32]' : 'bg-[#0C1324]'
                      }`}
                      style={{ borderColor: equipped ? spec.colorHex : `${spec.colorHex}55` }}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-14 items-center justify-center border border-slate-700 bg-[#080D18] p-1">
                              <WeaponPixelArt weaponId={wId} owned={owned} className="h-full w-full" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono-tabular text-[11px] font-bold text-slate-400">
                                  [{idx + 1}]
                                </span>
                                <span className="text-sm font-bold" style={{ color: spec.colorHex }}>
                                  {spec.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {spec.tag} · 基础伤害 {spec.damage}
                                {spec.pellets > 1 ? `×${spec.pellets}` : ''} · 弹药{' '}
                                <span className="font-mono-tabular text-slate-200">
                                  {spec.infiniteAmmo ? '∞' : `${ammo}/${maxAmmo}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            {owned ? (
                              <button
                                type="button"
                                disabled={equipped}
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                    serviceType: 'equip_weapon',
                                    weaponId: wId,
                                  })
                                }
                                className={`cursor-pointer border px-2.5 py-1 text-xs font-bold ${
                                  equipped
                                    ? 'cursor-default border-[#4ADE80] bg-[#4ADE80]/20 text-[#4ADE80]'
                                    : 'border-[#00F5FF] bg-[#00F5FF]/15 text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]'
                                }`}
                              >
                                {equipped ? '已装备' : '装备'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={cash < spec.buyCost}
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                    serviceType: 'buy_weapon',
                                    weaponId: wId,
                                  })
                                }
                                className="cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-2.5 py-1 text-xs font-bold text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                购买 ${spec.buyCost}
                              </button>
                            )}

                            {owned && !spec.infiniteAmmo && (
                              <button
                                type="button"
                                disabled={ammo >= maxAmmo || cash < spec.ammoPackCost}
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                    serviceType: 'buy_ammo',
                                    weaponId: wId,
                                  })
                                }
                                className="cursor-pointer border border-slate-600 bg-[#080D18] px-2 py-1 text-[11px] font-bold text-slate-200 hover:border-[#00F5FF] hover:text-[#00F5FF] disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                +{spec.ammoPackSize}发 ${spec.ammoPackCost}
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">{spec.description}</p>
                      </div>

                      {owned && (
                        <div className="grid grid-cols-3 gap-1.5 border-t border-slate-800 pt-2">
                          {(['damage', 'firerate', 'capacity'] as WeaponUpgradeTrack[]).map((tr) => {
                            const cfg = WEAPON_UPGRADE_CONFIG[tr];
                            const lv = upg[tr] ?? 0;
                            const isMax = lv >= cfg.maxLevel;
                            const upgCost = isMax
                              ? 0
                              : Math.round(spec.upgradeBaseCost * cfg.costMultipliers[lv]);
                            return (
                              <button
                                key={tr}
                                type="button"
                                disabled={isMax || cash < upgCost}
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.PURCHASE_SERVICE, {
                                    serviceType: 'upgrade_weapon',
                                    weaponId: wId,
                                    track: tr,
                                  })
                                }
                                className={`flex cursor-pointer flex-col items-center border px-1.5 py-1 text-[10px] font-bold transition-colors ${
                                  isMax
                                    ? 'cursor-default border-emerald-600/50 bg-emerald-950/25 text-emerald-300'
                                    : cash >= upgCost
                                      ? 'border-slate-700 bg-[#080D18] text-slate-200 hover:border-[#FFD166] hover:text-[#FFD166]'
                                      : 'cursor-not-allowed border-slate-800 bg-[#080D18]/60 text-slate-500'
                                }`}
                              >
                                <span>
                                  {cfg.shortLabel} Lv.{lv}/{cfg.maxLevel}
                                </span>
                                <span className="font-mono-tabular text-[#FFD166]">
                                  {isMax ? '满级' : `升级 $${upgCost}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 6: TERRARIA CRAFT BENCH ================= */}
          {currentTab === 'craft' && (
            <div className="flex flex-col gap-3">
              {playMode !== 'sandbox' ? (
                <div className="border border-[#FF4545]/60 bg-[#0C1324] p-6 text-center text-sm text-slate-200">
                  赛博造物台、七区采矿建造与世界 Boss 祭坛仅在【自由沙盒模式】中开放使用。
                </div>
              ) : (
                <>
                  {/* 7-Biome Ore Inventory Strip */}
                  <div className="border border-slate-800 bg-[#0C1324] p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Pickaxe className="h-3.5 w-3.5 text-[#00F5FF]" />
                        <span>七大城区生态矿物储备（按 E 挥镐或开火采集）</span>
                        {terraria.hasPlasmaPickaxe && (
                          <span className="border border-[#FFD166]/70 bg-[#FFD166]/15 px-1.5 py-0.5 text-[10px] text-[#FFD166]">
                            聚能矿镐 ×2
                          </span>
                        )}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-slate-400">
                        营火 {terraria.structureCounts.campfire}/{TERRARIA_LIMITS.MAX_CAMPFIRES} · 壁垒{' '}
                        {terraria.structureCounts.barricade}/{TERRARIA_LIMITS.MAX_BARRICADES} · 炮台{' '}
                        {terraria.structureCounts.turret}/{TERRARIA_LIMITS.MAX_TURRETS} · 晶塔{' '}
                        {terraria.structureCounts.pylon}/{TERRARIA_LIMITS.MAX_PYLONS}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
                      {TERRARIA_RESOURCE_ORDER.map((id) => {
                        const spec = TERRARIA_RESOURCES[id];
                        return (
                          <div
                            key={id}
                            className="border border-slate-800 bg-[#080D18] px-2 py-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span style={{ color: spec.colorHex }}>{spec.name}</span>
                              <span className="font-mono-tabular text-slate-100">
                                {terraria.resources[id] ?? 0}
                              </span>
                            </div>
                            <div className="mt-0.5 truncate text-[9px] text-slate-400">
                              {spec.districtHint}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accessories & Potions */}
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="border border-slate-800 bg-[#0C1324] p-3">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#00F5FF]">
                        <span>
                          饰品栏位（{terraria.equippedAccessories.length}/
                          {TERRARIA_LIMITS.MAX_EQUIPPED_ACCESSORIES}）
                        </span>
                        <span className="text-[10px] text-slate-400">点击切换佩戴</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(TERRARIA_ACCESSORY_META) as TerrariaAccessoryId[]).map(
                          (accId) => {
                            const meta = TERRARIA_ACCESSORY_META[accId];
                            const unlocked = terraria.unlockedAccessories.includes(accId);
                            const equipped = terraria.equippedAccessories.includes(accId);
                            return (
                              <button
                                key={accId}
                                type="button"
                                disabled={!unlocked}
                                onClick={() =>
                                  gameEvents.emit(GAME_EVENT.TERRARIA_TOGGLE_ACCESSORY, accId)
                                }
                                className={`flex flex-col items-start border px-2 py-1.5 text-left ${
                                  equipped
                                    ? 'cursor-pointer border-[#FFD166] bg-[#FFD166]/15'
                                    : unlocked
                                      ? 'cursor-pointer border-slate-700 bg-[#080D18] hover:border-[#00F5FF]'
                                      : 'cursor-not-allowed border-slate-800 bg-[#080D18]/60 opacity-50'
                                }`}
                              >
                                <div className="flex w-full justify-between text-[11px] font-bold">
                                  <span style={{ color: unlocked ? meta.accentHex : '#64748B' }}>
                                    {meta.name}
                                  </span>
                                  <span className="text-[9px] text-slate-300">
                                    {equipped ? '已佩戴' : unlocked ? '备用' : '未锻造'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">{meta.bonusText}</span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-2 border border-slate-800 bg-[#0C1324] p-3">
                      <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#34D399]">
                        <span>炼金合剂快捷饮用</span>
                        <span className="font-mono-tabular text-[10px] text-slate-300">
                          {terraria.ironskinBuffSec > 0 ? `铁皮 ${terraria.ironskinBuffSec}s ` : ''}
                          {terraria.miningBuffSec > 0 ? `探矿 ${terraria.miningBuffSec}s` : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: 'ironskin', name: '铁皮合剂', hint: '减伤+18%', color: '#FBBF24' },
                            { id: 'mining', name: '探矿合剂', hint: '双矿+速15%', color: '#34D399' },
                            { id: 'recall', name: '折跃回城', hint: '回安全屋-1★', color: '#38BDF8' },
                          ] as const
                        ).map((p) => {
                          const count = terraria.potions[p.id as TerrariaPotionId] ?? 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={count <= 0}
                              onClick={() => {
                                gameEvents.emit(GAME_EVENT.TERRARIA_USE_POTION, p.id);
                                if (p.id === 'recall') closeHub();
                              }}
                              className={`flex flex-col items-start border px-2 py-1.5 text-left ${
                                count > 0
                                  ? 'cursor-pointer border-slate-700 bg-[#080D18] hover:border-[#00F5FF]'
                                  : 'cursor-not-allowed border-slate-800 bg-[#080D18]/60 opacity-50'
                              }`}
                            >
                              <div className="flex w-full justify-between text-[11px] font-bold">
                                <span style={{ color: p.color }}>{p.name}</span>
                                <span className="font-mono-tabular text-slate-100">×{count}</span>
                              </div>
                              <span className="text-[9px] text-slate-400">{p.hint}</span>
                            </button>
                          );
                        })}
                      </div>
                      {terraria.pylons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-1.5">
                          {terraria.pylons.map((py) => (
                            <button
                              key={py.id}
                              type="button"
                              onClick={() => {
                                gameEvents.emit(GAME_EVENT.TERRARIA_RECALL_PYLON, py.id);
                                closeHub();
                              }}
                              className="cursor-pointer border border-[#C000FF]/70 bg-[#C000FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#E9D5FF] hover:bg-[#C000FF] hover:text-[#080D18]"
                            >
                              ⚡ 折跃 {py.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
                    {(
                      [
                        { id: 'build', label: '基地造物与工具' },
                        { id: 'gear', label: '饰品与合剂' },
                        { id: 'boss', label: '世界 Boss 召唤' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCraftSubTab(t.id)}
                        className={`cursor-pointer border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors ${
                          craftSubTab === t.id
                            ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166]'
                            : 'border-slate-700 bg-[#0C1324] text-slate-300 hover:border-[#00F5FF]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Recipe Grid */}
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {TERRARIA_RECIPES.filter((r) => r.category === craftSubTab).map((recipe) => {
                      const affordable = canAffordOre(recipe.cost);
                      const alreadyOwned =
                        (recipe.kind.type === 'pickaxe' && terraria.hasPlasmaPickaxe) ||
                        (recipe.kind.type === 'accessory' &&
                          terraria.unlockedAccessories.includes(recipe.kind.accessoryId));
                      const bossActive = recipe.kind.type === 'boss' && terraria.activeBoss !== null;
                      const bossDefeated =
                        recipe.kind.type === 'boss' &&
                        terraria.defeatedBossIds.includes(recipe.kind.bossId);

                      return (
                        <div
                          key={recipe.id}
                          className="flex flex-col justify-between gap-2 border border-slate-800 bg-[#0C1324] p-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="flex items-center gap-1.5 text-sm font-bold"
                                style={{ color: recipe.accentHex }}
                              >
                                {recipe.kind.type === 'boss' ? (
                                  <Skull className="h-4 w-4" />
                                ) : recipe.kind.type === 'structure' &&
                                  recipe.kind.structureType === 'campfire' ? (
                                  <Flame className="h-4 w-4" />
                                ) : (
                                  <Hammer className="h-3.5 w-3.5" />
                                )}
                                {recipe.name}
                              </span>
                              {alreadyOwned && (
                                <span className="border border-[#34D399]/60 bg-[#34D399]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#34D399]">
                                  已持有
                                </span>
                              )}
                              {bossDefeated && (
                                <span className="border border-[#FFD166]/60 bg-[#FFD166]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#FFD166]">
                                  已首通
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-300">{recipe.description}</p>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
                            <div className="flex flex-wrap gap-1 font-mono-tabular text-[10px]">
                              {(Object.entries(recipe.cost) as Array<[TerrariaResourceId, number]>).map(
                                ([resId, req]) => {
                                  const spec = TERRARIA_RESOURCES[resId];
                                  const have = terraria.resources[resId] ?? 0;
                                  return (
                                    <span
                                      key={resId}
                                      className={`border px-1.5 py-0.5 ${
                                        have >= req
                                          ? 'border-slate-700 bg-[#080D18] text-slate-200'
                                          : 'border-[#FF4545]/60 bg-[#FF4545]/10 text-[#FF4545]'
                                      }`}
                                    >
                                      {spec.name} {have}/{req}
                                    </span>
                                  );
                                }
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={!affordable || alreadyOwned || bossActive}
                              onClick={() => {
                                gameEvents.emit(GAME_EVENT.TERRARIA_CRAFT, recipe.id);
                                if (recipe.kind.type === 'boss') closeHub();
                              }}
                              className="shrink-0 cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-3 py-1 text-xs font-bold text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-[#080D18] disabled:text-slate-500"
                            >
                              {alreadyOwned
                                ? '已拥有'
                                : recipe.kind.type === 'boss'
                                  ? bossActive
                                    ? '激战中'
                                    : '召唤 Boss'
                                  : recipe.kind.type === 'structure'
                                    ? '建造放置'
                                    : '立即锻造'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 7: SETTINGS ================= */}
          {currentTab === 'settings' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr_270px]">
              {/* Left Category Rail */}
              <div className="flex flex-col gap-1.5 border border-[#00F5FF]/40 bg-[#0C1324] p-2.5">
                {(
                  [
                    { id: 'game', label: '游戏设置' },
                    { id: 'graphics', label: '画面设置' },
                    { id: 'audio', label: '音频设置' },
                    { id: 'controls', label: '控制设置' },
                    { id: 'language', label: '语言与存档' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSettingsCat(c.id)}
                    className={`cursor-pointer border px-3 py-2 text-left text-xs font-bold tracking-wider transition-colors ${
                      settingsCat === c.id
                        ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                        : 'border-slate-800 bg-[#080D18] text-slate-300 hover:border-[#C000FF]/60'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Center Controls */}
              <div className="flex flex-col justify-between gap-4 border border-slate-800 bg-[#0C1324] p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Settings className="h-4 w-4 text-[#00F5FF]" />
                    <h3 className="text-sm font-bold tracking-wider text-slate-100">
                      {settingsCat === 'game'
                        ? '游戏玩法设置'
                        : settingsCat === 'graphics'
                          ? '画面与赛博光影设置'
                          : settingsCat === 'audio'
                            ? '音频与电台音量'
                            : settingsCat === 'controls'
                              ? '键位与触控设置'
                              : '语言偏好与存档管理'}
                    </h3>
                  </div>

                  {settingsCat === 'game' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">自动拾取街头补给与矿石</div>
                          <div className="text-[11px] text-slate-400">靠近地面现金、弹药与晶体时自动吸取</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSettings({ autoPickup: !settings.autoPickup })}
                          className={`cursor-pointer border px-3 py-1 font-bold ${
                            settings.autoPickup
                              ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                              : 'border-slate-700 bg-[#111827] text-slate-400'
                          }`}
                        >
                          {settings.autoPickup ? '开启' : '关闭'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">战斗与碰撞震屏反馈</div>
                          <div className="text-[11px] text-slate-400">重武器射击、爆炸与剧烈撞车时触发镜头震动</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSettings({ screenShake: !settings.screenShake })}
                          className={`cursor-pointer border px-3 py-1 font-bold ${
                            settings.screenShake
                              ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                              : 'border-slate-700 bg-[#111827] text-slate-400'
                          }`}
                        >
                          {settings.screenShake ? '开启' : '关闭'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">精简视野 HUD（快捷键 V）</div>
                          <div className="text-[11px] text-slate-400">隐藏部分次要卡片，获得更大街区视野</div>
                        </div>
                        <button
                          type="button"
                          onClick={toggleHudCompact}
                          className={`cursor-pointer border px-3 py-1 font-bold ${
                            hudCompact
                              ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166]'
                              : 'border-slate-700 bg-[#111827] text-slate-300'
                          }`}
                        >
                          {hudCompact ? '精简模式' : '完整 HUD'}
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsCat === 'graphics' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">画质等级（粒子与后处理精度）</div>
                          <div className="text-[11px] text-slate-400">高画质启用全量雨雾粒子与霓虹滤镜；低画质更省电</div>
                        </div>
                        <div className="flex gap-1.5">
                          {(
                            [
                              { id: 'high', label: '高' },
                              { id: 'medium', label: '中' },
                              { id: 'low', label: '低' },
                            ] as const
                          ).map((q) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => updateSettings({ quality: q.id })}
                              className={`cursor-pointer border px-3 py-1 font-bold ${
                                settings.quality === q.id
                                  ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                                  : 'border-slate-700 bg-[#111827] text-slate-300'
                              }`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">画面亮度基调</div>
                          <div className="text-[11px] text-slate-400">霓虹明亮高对比街景 vs 经典深沉夜色</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateSettings({ brightness: 'bright' })}
                            className={`cursor-pointer border px-3 py-1 font-bold ${
                              settings.brightness === 'bright'
                                ? 'border-[#FFD166] bg-[#FFD166]/20 text-[#FFD166]'
                                : 'border-slate-700 bg-[#111827] text-slate-300'
                            }`}
                          >
                            霓虹明亮
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSettings({ brightness: 'classic' })}
                            className={`cursor-pointer border px-3 py-1 font-bold ${
                              settings.brightness === 'classic'
                                ? 'border-[#C000FF] bg-[#C000FF]/20 text-[#C000FF]'
                                : 'border-slate-700 bg-[#111827] text-slate-300'
                            }`}
                          >
                            经典深邃
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">动态天气与氛围粒子特效</div>
                          <div className="text-[11px] text-slate-400">霓虹暴雨、赛博酸雨、浓雾与沙暴后期滤镜</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSettings({ weatherFx: !settings.weatherFx })}
                          className={`cursor-pointer border px-3 py-1 font-bold ${
                            settings.weatherFx
                              ? 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                              : 'border-slate-700 bg-[#111827] text-slate-400'
                          }`}
                        >
                          {settings.weatherFx ? '开启' : '关闭'}
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsCat === 'audio' && (
                    <div className="space-y-3 text-xs">
                      <div className="border border-slate-800 bg-[#080D18] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-bold text-slate-100">音乐与车载电台音量</span>
                          <span className="font-mono-tabular font-bold text-[#00F5FF]">
                            {settings.musicVolume}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={settings.musicVolume}
                          onChange={(e) => updateSettings({ musicVolume: Number(e.target.value) })}
                          aria-label="音乐音量"
                          className="h-2 w-full cursor-pointer accent-[#00F5FF]"
                        />
                      </div>

                      <div className="border border-slate-800 bg-[#080D18] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-bold text-slate-100">枪械与载具音效音量</span>
                          <span className="font-mono-tabular font-bold text-[#FF2E88]">
                            {settings.sfxVolume}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={settings.sfxVolume}
                          onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) })}
                          aria-label="音效音量"
                          className="h-2 w-full cursor-pointer accent-[#FF2E88]"
                        />
                      </div>

                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <span className="font-bold text-slate-100">全局总静音开关</span>
                        <button
                          type="button"
                          onClick={toggleMute}
                          className={`flex cursor-pointer items-center gap-1.5 border px-3 py-1 font-bold ${
                            muted
                              ? 'border-[#FF4545] bg-[#FF4545]/20 text-[#FF4545]'
                              : 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF]'
                          }`}
                        >
                          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                          {muted ? '已静音' : '声音开启'}
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsCat === 'controls' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">虚拟触控摇杆显示模式</div>
                          <div className="text-[11px] text-slate-400">适配移动端/平板或桌面鼠标键盘</div>
                        </div>
                        <button
                          type="button"
                          onClick={cycleTouchControlsMode}
                          className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/15 px-3 py-1 font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                        >
                          {touchControlsMode === 'auto'
                            ? '自动识别'
                            : touchControlsMode === 'on'
                              ? '始终开启'
                              : '关闭触控'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 border border-slate-800 bg-[#080D18] p-3 font-mono-tabular text-[11px] text-slate-300">
                        <div>WASD / 方向键：移动 / 驾驶</div>
                        <div>左键 / J：瞄准开火</div>
                        <div>1-7 / Q：武器快捷切换</div>
                        <div>F：上车 / 劫车 / 降落</div>
                        <div>Shift / 空格：氮气 / 手刹</div>
                        <div>E：场景交互 / 挥镐挖矿</div>
                        <div>M / L / C / B / K：战术面板</div>
                        <div>T / H / R / V：天气/干扰/电台/精简</div>
                      </div>
                    </div>
                  )}

                  {settingsCat === 'language' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between border border-slate-800 bg-[#080D18] p-3">
                        <span className="font-bold text-slate-100">界面与字幕语言</span>
                        <span className="border border-[#00F5FF]/60 bg-[#00F5FF]/15 px-3 py-1 font-bold text-[#00F5FF]">
                          简体中文 (zh-CN)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-800 bg-[#080D18] p-3">
                        <div>
                          <div className="font-bold text-slate-100">本地沙盒存档管理</div>
                          <div className="text-[11px] text-slate-400">
                            {saveStatus.hasSave
                              ? `当前已存：$${(saveStatus.cash ?? 0).toLocaleString()} · 完成 ${saveStatus.completedCount} 项委托`
                              : '暂无本地沙盒存档'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!isTitleMode && playMode === 'sandbox' && (
                            <button
                              type="button"
                              onClick={() => gameEvents.emit(GAME_EVENT.SAVE_GAME)}
                              className="cursor-pointer border border-[#FFD166] bg-[#FFD166]/15 px-3 py-1 font-bold text-[#FFD166] hover:bg-[#FFD166] hover:text-[#080D18]"
                            >
                              立即手动保存
                            </button>
                          )}
                          {saveStatus.hasSave && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirmResetSave) {
                                  setConfirmResetSave(true);
                                } else {
                                  gameEvents.emit(GAME_EVENT.DELETE_SAVE);
                                  setConfirmResetSave(false);
                                }
                              }}
                              className="cursor-pointer border border-[#FF4545]/70 bg-[#FF4545]/15 px-3 py-1 font-bold text-[#FF4545] hover:bg-[#FF4545] hover:text-[#080D18]"
                            >
                              {confirmResetSave ? '再次点击确认清除' : '清除本地存档'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Apply / Reset */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={resetSettings}
                    className="cursor-pointer border border-slate-700 bg-[#080D18] px-4 py-2 text-xs font-bold text-slate-300 hover:border-[#FFD166] hover:text-[#FFD166]"
                  >
                    恢复默认
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameEvents.emit(GAME_EVENT.APPLY_SETTINGS, settings);
                      closeHub();
                    }}
                    className="cursor-pointer border border-[#00F5FF] bg-[#00F5FF]/20 px-5 py-2 text-xs font-bold text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#080D18]"
                  >
                    应用设置
                  </button>
                </div>
              </div>

              {/* Right Preview Card */}
              <div className="flex flex-col justify-between gap-2.5 border border-[#C000FF]/45 bg-[#0C1324] p-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#C000FF]">
                    <span>霓虹街区画质实时预览</span>
                    <span className="font-mono-tabular text-[10px] text-[#00F5FF]">
                      {settings.quality.toUpperCase()}
                    </span>
                  </div>
                  <div
                    className="overflow-hidden border border-[#00F5FF]/50 bg-[#080D18]"
                    style={{
                      filter: `brightness(${settings.brightness === 'bright' ? 1.12 : 0.88}) saturate(${
                        settings.quality === 'high' ? 1.15 : settings.quality === 'medium' ? 1.0 : 0.85
                      })`,
                    }}
                  >
                    <CityPreviewImg className="aspect-[4/3] w-full" />
                  </div>
                </div>
                <div className="space-y-1 border border-slate-800 bg-[#080D18] p-2.5 text-[11px] text-slate-300">
                  <div>
                    当前亮度：<strong className="text-[#FFD166]">{settings.brightness === 'bright' ? '霓虹明亮' : '经典深邃'}</strong>
                  </div>
                  <div>
                    天气滤镜：<strong className="text-[#00F5FF]">{settings.weatherFx ? '已启用' : '已关闭'}</strong>
                  </div>
                  <div>
                    音频输出：<strong className="text-[#FF2E88]">{muted ? '全局静音' : `音乐 ${settings.musicVolume}% · 音效 ${settings.sfxVolume}%`}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
