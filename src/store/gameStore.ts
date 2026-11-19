import { create } from 'zustand';
import {
  GamePlayMode,
  PLAYER_CONFIG,
  RADIO_STATIONS,
  VehicleType,
  VehicleWeaponKind,
  WEAPON_ORDER,
  WEAPON_SPECS,
  WORLD_CONFIG,
  WeaponId,
} from '../game/config/BalanceConfig';
import type {
  GameSettingsPayload,
  HubTabId,
  VehicleUpgradeLevels,
  WeaponUpgradeLevels,
} from '../game/ui/GameEvents';
import {
  ActiveMissionState,
  ArcadeResultPayload,
  CustomWaypoint,
  EnvironmentTelemetryPayload,
  ExplorationPayload,
  GAME_EVENT,
  gameEvents,
  GameMode,
  HordePerkOfferPayload,
  HordeTelemetryPayload,
  LandmarkInfo,
  MissionSyncPayload,
  NearbyNpcInfo,
  NearbyPropInfo,
  NearbyVehicleInfo,
  PlayerStatsPayload,
  PoliceMapMarker,
  ProgressionTelemetryPayload,
  RaceTelemetryPayload,
  RadioStationPayload,
  RandomEventMarker,
  SandboxInteractableHint,
  SandboxSummaryPayload,
  SaveStatusPayload,
  ServiceModalPayload,
  TerrariaTelemetryPayload,
  VehicleTelemetryPayload,
  WantedTelemetryPayload,
  WeaponTelemetryPayload,
} from '../game/ui/GameEvents';
import { DistrictData } from '../game/world/DistrictManager';

export type TouchControlsMode = 'auto' | 'on' | 'off';
export type TitleSubModal = 'modes' | 'garage' | 'settings' | null;

const SETTINGS_STORAGE_KEY = 'neon_district_settings_v1';

export const DEFAULT_SETTINGS: GameSettingsPayload = {
  quality: 'high',
  brightness: 'bright',
  weatherFx: true,
  screenShake: true,
  musicVolume: 80,
  sfxVolume: 90,
  autoPickup: true,
  language: 'zh-CN',
};

function loadSavedSettings(): GameSettingsPayload {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<GameSettingsPayload>;
    return {
      quality:
        parsed.quality === 'high' || parsed.quality === 'medium' || parsed.quality === 'low'
          ? parsed.quality
          : DEFAULT_SETTINGS.quality,
      brightness:
        parsed.brightness === 'bright' || parsed.brightness === 'classic'
          ? parsed.brightness
          : DEFAULT_SETTINGS.brightness,
      weatherFx: typeof parsed.weatherFx === 'boolean' ? parsed.weatherFx : DEFAULT_SETTINGS.weatherFx,
      screenShake:
        typeof parsed.screenShake === 'boolean' ? parsed.screenShake : DEFAULT_SETTINGS.screenShake,
      musicVolume:
        typeof parsed.musicVolume === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.musicVolume)))
          : DEFAULT_SETTINGS.musicVolume,
      sfxVolume:
        typeof parsed.sfxVolume === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.sfxVolume)))
          : DEFAULT_SETTINGS.sfxVolume,
      autoPickup:
        typeof parsed.autoPickup === 'boolean' ? parsed.autoPickup : DEFAULT_SETTINGS.autoPickup,
      language: 'zh-CN',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: GameSettingsPayload): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota / private mode failures
  }
}

function emitModalPauseState(
  serviceModal: ServiceModalPayload | null,
  activeHubTab: HubTabId | null,
  hordePerkOffer: HordePerkOfferPayload | null
): void {
  gameEvents.emit(
    GAME_EVENT.SET_MODAL_PAUSED,
    Boolean(serviceModal || activeHubTab || hordePerkOffer)
  );
}

interface GameUIState {
  mode: GameMode;
  playMode: GamePlayMode;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  cash: number;
  ownsSafehouse: boolean;
  wantedLevel: number;
  spotted: boolean;
  escapeProgress: number;
  lastKnownPos: { x: number; y: number } | null;
  policeMarkers: PoliceMapMarker[];
  activeMission: ActiveMissionState | null;
  completedMissionIds: string[];
  totalMissionEarnings: number;
  serviceModal: ServiceModalPayload | null;
  arcadeResult: ArcadeResultPayload | null;
  saveStatus: SaveStatusPayload;
  districtName: string;
  districtBanner: string | null;
  playerX: number;
  playerY: number;
  facingDeg: number;
  districtData: DistrictData | null;
  nearbyLandmark: LandmarkInfo | null;
  nearbyProp: NearbyPropInfo | null;
  nearbyNpc: NearbyNpcInfo | null;
  nearbyVehicle: NearbyVehicleInfo | null;
  inVehicle: boolean;
  vehicleId: string | null;
  vehicleName: string | null;
  vehicleType: VehicleType | null;
  vehicleSpeedKmh: number;
  vehicleHealth: number;
  vehicleMaxHealth: number;
  vehicleNitro: number;
  vehicleBoosting: boolean;
  vehicleFlying: boolean;
  vehicleHasTurret: boolean;
  vehicleWeaponKind: VehicleWeaponKind | null;
  vehicleUpgrades: VehicleUpgradeLevels | null;
  vehiclePaintColor: number | null;
  radioStation: RadioStationPayload;
  horde: HordeTelemetryPayload;
  hordePerkOffer: HordePerkOfferPayload | null;
  race: RaceTelemetryPayload;
  exploration: ExplorationPayload;
  sandboxSummary: SandboxSummaryPayload;
  sandboxHint: SandboxInteractableHint | null;
  sandboxCombo: number;
  customWaypoint: CustomWaypoint | null;
  environment: EnvironmentTelemetryPayload;
  randomEvents: RandomEventMarker[];
  progression: ProgressionTelemetryPayload;
  showCharacterModal: boolean;
  terraria: TerrariaTelemetryPayload;
  showCraftModal: boolean;
  activeHubTab: HubTabId | null;
  titleSubModal: TitleSubModal;
  settings: GameSettingsPayload;
  interactionToast: string | null;
  weapon: WeaponTelemetryPayload;
  muted: boolean;
  showMap: boolean;
  hudCompact: boolean;
  touchControlsMode: TouchControlsMode;

  setMode: (mode: GameMode) => void;
  setPlayMode: (playMode: GamePlayMode) => void;
  setDistrictData: (data: DistrictData) => void;
  updatePlayerPosition: (x: number, y: number, facingDeg: number, district: string) => void;
  setDistrictBanner: (name: string | null) => void;
  setNearbyLandmark: (landmark: LandmarkInfo | null) => void;
  setNearbyProp: (prop: NearbyPropInfo | null) => void;
  setNearbyNpc: (npc: NearbyNpcInfo | null) => void;
  setNearbyVehicle: (vehicle: NearbyVehicleInfo | null) => void;
  setVehicleTelemetry: (payload: VehicleTelemetryPayload) => void;
  setRadioStation: (payload: RadioStationPayload) => void;
  setOwnsSafehouse: (owns: boolean) => void;
  setArcadeResult: (result: ArcadeResultPayload | null) => void;
  setWantedTelemetry: (payload: WantedTelemetryPayload) => void;
  setPlayerStats: (payload: PlayerStatsPayload) => void;
  setWeaponTelemetry: (payload: WeaponTelemetryPayload) => void;
  setHordeTelemetry: (payload: HordeTelemetryPayload) => void;
  setHordePerkOffer: (offer: HordePerkOfferPayload | null) => void;
  setRaceTelemetry: (payload: RaceTelemetryPayload) => void;
  setExploration: (payload: ExplorationPayload) => void;
  setSandboxSummary: (payload: SandboxSummaryPayload) => void;
  setSandboxHint: (hint: SandboxInteractableHint | null) => void;
  setSandboxCombo: (combo: number) => void;
  setCustomWaypoint: (wp: CustomWaypoint | null) => void;
  setEnvironment: (payload: EnvironmentTelemetryPayload) => void;
  setRandomEvents: (events: RandomEventMarker[]) => void;
  setProgression: (payload: ProgressionTelemetryPayload) => void;
  openHubTab: (tab: HubTabId) => void;
  closeHub: () => void;
  toggleHubTab: (tab: HubTabId) => void;
  setTitleSubModal: (modal: TitleSubModal) => void;
  updateSettings: (partial: Partial<GameSettingsPayload>) => void;
  resetSettings: () => void;
  setShowCharacterModal: (open: boolean) => void;
  toggleCharacterModal: () => void;
  setTerraria: (payload: TerrariaTelemetryPayload) => void;
  setShowCraftModal: (open: boolean) => void;
  toggleCraftModal: () => void;
  setMissionSync: (payload: MissionSyncPayload) => void;
  setServiceModal: (modal: ServiceModalPayload | null) => void;
  setSaveStatus: (status: SaveStatusPayload) => void;
  setInteractionToast: (message: string | null) => void;
  toggleMute: () => void;
  toggleMap: () => void;
  setShowMap: (open: boolean) => void;
  toggleHudCompact: () => void;
  cycleTouchControlsMode: () => void;
}

export const useGameStore = create<GameUIState>((set, get) => ({
  mode: 'TITLE',
  playMode: 'sandbox',
  health: PLAYER_CONFIG.INITIAL_HEALTH,
  maxHealth: PLAYER_CONFIG.MAX_HEALTH,
  armor: 0,
  maxArmor: PLAYER_CONFIG.MAX_ARMOR,
  cash: PLAYER_CONFIG.INITIAL_CASH,
  ownsSafehouse: false,
  wantedLevel: 0,
  spotted: false,
  escapeProgress: 0,
  lastKnownPos: null,
  policeMarkers: [],
  activeMission: null,
  completedMissionIds: [],
  totalMissionEarnings: 0,
  serviceModal: null,
  arcadeResult: null,
  saveStatus: { hasSave: false, savedAt: null, cash: null, completedCount: 0 },
  districtName: WORLD_CONFIG.STARTING_DISTRICT,
  districtBanner: null,
  playerX: WORLD_CONFIG.PLAYER_SPAWN.x,
  playerY: WORLD_CONFIG.PLAYER_SPAWN.y,
  facingDeg: -90,
  districtData: null,
  nearbyLandmark: null,
  nearbyProp: null,
  nearbyNpc: null,
  nearbyVehicle: null,
  inVehicle: false,
  vehicleId: null,
  vehicleName: null,
  vehicleType: null,
  vehicleSpeedKmh: 0,
  vehicleHealth: 0,
  vehicleMaxHealth: 0,
  vehicleNitro: 100,
  vehicleBoosting: false,
  vehicleFlying: false,
  vehicleHasTurret: false,
  vehicleWeaponKind: null,
  vehicleUpgrades: null,
  vehiclePaintColor: null,
  radioStation: {
    index: RADIO_STATIONS[1].index,
    name: RADIO_STATIONS[1].name,
    genre: RADIO_STATIONS[1].genre,
  },
  horde: {
    active: false,
    wave: 0,
    enemiesRemaining: 0,
    kills: 0,
    combo: 0,
    score: 0,
    overdriveSec: 0,
    restSec: 0,
    bossName: null,
    bossHp: 0,
    bossMaxHp: 0,
    bestWave: 0,
    bestScore: 0,
    enemyMarkers: [],
    mech: {
      active: false,
      kind: null,
      name: null,
      hp: 0,
      maxHp: 0,
      abilityLabel: null,
      abilityCooldownSec: 0,
      abilityMaxCooldownSec: 0,
      turretCount: 0,
      maxTurrets: 2,
    },
    activePerks: [],
  },
  hordePerkOffer: null,
  race: {
    active: false,
    checkpointIndex: 0,
    totalCheckpoints: 16,
    targetPos: null,
    targetLabel: null,
    timeRemainingSec: 0,
    elapsedSec: 0,
    bestTimeSec: null,
    countdownSec: 0,
  },
  exploration: {
    chipsCollected: 0,
    totalChips: 14,
    chipMarkers: [],
  },
  sandboxSummary: {
    signalTowers: [],
    metroStations: [],
    secretVaults: [],
    gangOutposts: [],
    bestStuntMeters: 0,
    stuntsCompleted: 0,
  },
  sandboxHint: null,
  sandboxCombo: 0,
  customWaypoint: null,
  environment: {
    timePhase: 'day',
    timeLabel: '霓虹白昼',
    clockText: '10:30',
    weather: 'clear',
    weatherLabel: '晴空霓虹',
    weatherEffectHint: '全城视野极佳 · 昼夜高对比赛博霓虹夜景与晴朗路面',
    darknessAlpha: 0,
  },
  randomEvents: [],
  progression: {
    level: 1,
    exp: 0,
    nextLevelExp: 120,
    skillPoints: 0,
    skills: {
      combat: 0,
      mechanics: 0,
      hacking: 0,
      survival: 0,
    },
    cyberware: {
      optics: 0,
      arms: 0,
      legs: 0,
      spine: 0,
      neural: 0,
    },
    reputation: {
      street: 0,
      hacker: 0,
      law: 0,
    },
    jammerUnlocked: false,
    jammerCooldownSec: 0,
    jammerActiveSec: 0,
    damageBonusPct: 0,
    critChancePct: 0,
    fireRateBonusPct: 0,
    moveSpeedBonusPct: 0,
    vehicleSpeedBonusPct: 0,
    damageReductionPct: 0,
  },
  showCharacterModal: false,
  terraria: {
    resources: {
      scrap_alloy: 2,
      neon_crystal: 1,
      quantum_core: 0,
      frost_ore: 0,
      obsidian_shard: 0,
      abyss_pearl: 0,
      boss_soul: 0,
    },
    hasPlasmaPickaxe: false,
    unlockedAccessories: [],
    equippedAccessories: [],
    potions: { ironskin: 1, mining: 1, recall: 1 },
    ironskinBuffSec: 0,
    miningBuffSec: 0,
    structureCounts: { campfire: 0, barricade: 0, turret: 0, pylon: 0 },
    pylons: [],
    defeatedBossIds: [],
    activeBoss: null,
  },
  showCraftModal: false,
  activeHubTab: null,
  titleSubModal: null,
  settings: loadSavedSettings(),
  interactionToast: null,
  weapon: {
    equippedId: 'pistol',
    name: WEAPON_SPECS.pistol.name,
    shortName: WEAPON_SPECS.pistol.shortName,
    colorHex: WEAPON_SPECS.pistol.colorHex,
    ammo: 999,
    infiniteAmmo: true,
    ownedIds: ['pistol'],
    ammoByWeapon: Object.fromEntries(
      WEAPON_ORDER.map((id) => [id, id === 'pistol' ? WEAPON_SPECS.pistol.initialAmmo : 0])
    ) as Record<WeaponId, number>,
    maxAmmoByWeapon: Object.fromEntries(
      WEAPON_ORDER.map((id) => [id, WEAPON_SPECS[id].maxAmmo])
    ) as Record<WeaponId, number>,
    upgradesByWeapon: Object.fromEntries(
      WEAPON_ORDER.map((id) => [id, { damage: 0, firerate: 0, capacity: 0 }])
    ) as Record<WeaponId, WeaponUpgradeLevels>,
  },
  muted: false,
  showMap: false,
  hudCompact: false,
  touchControlsMode: 'auto',

  setMode: (mode) =>
    set({
      mode,
      activeHubTab: mode === 'PLAYING' ? get().activeHubTab : null,
      titleSubModal: mode === 'TITLE' ? get().titleSubModal : null,
      showMap: mode === 'PLAYING' ? get().showMap : false,
      serviceModal: mode === 'PLAYING' ? get().serviceModal : null,
      arcadeResult: mode === 'PLAYING' ? get().arcadeResult : null,
      showCharacterModal: mode === 'PLAYING' ? get().showCharacterModal : false,
      showCraftModal: mode === 'PLAYING' ? get().showCraftModal : false,
      hordePerkOffer: mode === 'PLAYING' ? get().hordePerkOffer : null,
    }),
  setPlayMode: (playMode) => set({ playMode }),
  setDistrictData: (districtData) => set({ districtData, districtName: districtData.name }),
  updatePlayerPosition: (playerX, playerY, facingDeg, districtName) =>
    set({ playerX, playerY, facingDeg, districtName }),
  setDistrictBanner: (districtBanner) => set({ districtBanner }),
  setNearbyLandmark: (nearbyLandmark) => set({ nearbyLandmark }),
  setNearbyProp: (nearbyProp) => set({ nearbyProp }),
  setNearbyNpc: (nearbyNpc) => set({ nearbyNpc }),
  setNearbyVehicle: (nearbyVehicle) => set({ nearbyVehicle }),
  setVehicleTelemetry: (payload) =>
    set({
      inVehicle: payload.inVehicle,
      vehicleId: payload.id,
      vehicleName: payload.name,
      vehicleType: payload.type,
      vehicleSpeedKmh: payload.speedKmh,
      vehicleHealth: payload.health,
      vehicleMaxHealth: payload.maxHealth,
      vehicleNitro: payload.nitro ?? 100,
      vehicleBoosting: Boolean(payload.isBoosting),
      vehicleFlying: Boolean(payload.isFlying),
      vehicleHasTurret: Boolean(payload.hasTurret),
      vehicleWeaponKind: payload.weaponKind ?? null,
      vehicleUpgrades: payload.upgrades ?? null,
      vehiclePaintColor: payload.paintColor ?? null,
    }),
  setRadioStation: (radioStation) => set({ radioStation }),
  setOwnsSafehouse: (ownsSafehouse) => set({ ownsSafehouse }),
  setArcadeResult: (arcadeResult) => set({ arcadeResult }),
  setWantedTelemetry: (payload) =>
    set({
      wantedLevel: payload.wantedLevel,
      spotted: payload.spotted,
      escapeProgress: payload.escapeProgress,
      lastKnownPos: payload.lastKnownPos,
      policeMarkers: payload.policeMarkers,
    }),
  setPlayerStats: (payload) =>
    set({
      health: payload.health,
      maxHealth: payload.maxHealth,
      armor: payload.armor ?? get().armor,
      maxArmor: payload.maxArmor ?? get().maxArmor,
      cash: payload.cash,
    }),
  setWeaponTelemetry: (weapon) => set({ weapon }),
  setHordeTelemetry: (horde) => set({ horde }),
  setHordePerkOffer: (hordePerkOffer) => {
    emitModalPauseState(get().serviceModal, get().activeHubTab, hordePerkOffer);
    set({ hordePerkOffer });
  },
  setRaceTelemetry: (race) => set({ race }),
  setExploration: (exploration) => set({ exploration }),
  setSandboxSummary: (sandboxSummary) => set({ sandboxSummary }),
  setSandboxHint: (sandboxHint) => set({ sandboxHint }),
  setSandboxCombo: (sandboxCombo) => set({ sandboxCombo }),
  setCustomWaypoint: (customWaypoint) => set({ customWaypoint }),
  setEnvironment: (environment) => set({ environment }),
  setRandomEvents: (randomEvents) => set({ randomEvents }),
  setProgression: (progression) => set({ progression }),
  openHubTab: (tab) => {
    const state = get();
    if (state.mode === 'TITLE') {
      const nextSub: TitleSubModal =
        tab === 'settings' ? 'settings' : 'garage';
      set({
        activeHubTab: tab,
        titleSubModal: nextSub,
        showMap: false,
        showCharacterModal: tab === 'character',
        showCraftModal: false,
      });
      return;
    }
    if (state.mode === 'PAUSED') {
      gameEvents.emit(GAME_EVENT.RESUME_GAME);
    }
    if (state.serviceModal || state.hordePerkOffer) return;
    emitModalPauseState(state.serviceModal, tab, state.hordePerkOffer);
    set({
      activeHubTab: tab,
      showMap: tab === 'map',
      showCharacterModal: tab === 'character',
      showCraftModal: tab === 'craft',
    });
  },
  closeHub: () => {
    const state = get();
    if (state.mode === 'PLAYING') {
      emitModalPauseState(state.serviceModal, null, state.hordePerkOffer);
    }
    set({
      activeHubTab: null,
      titleSubModal: state.mode === 'TITLE' ? null : state.titleSubModal,
      showMap: false,
      showCharacterModal: false,
      showCraftModal: false,
    });
  },
  toggleHubTab: (tab) => {
    const state = get();
    if (state.mode !== 'PLAYING') return;
    if (state.serviceModal || state.hordePerkOffer) return;
    if (state.activeHubTab === tab) {
      state.closeHub();
    } else {
      state.openHubTab(tab);
    }
  },
  setTitleSubModal: (titleSubModal) => {
    if (titleSubModal === 'garage') {
      set({ titleSubModal, activeHubTab: 'vehicles' });
    } else if (titleSubModal === 'settings') {
      set({ titleSubModal, activeHubTab: 'settings' });
    } else {
      set({ titleSubModal, activeHubTab: null });
    }
  },
  updateSettings: (partial) => {
    const next: GameSettingsPayload = {
      ...get().settings,
      ...partial,
      language: 'zh-CN',
    };
    persistSettings(next);
    gameEvents.emit(GAME_EVENT.APPLY_SETTINGS, next);
    set({ settings: next });
  },
  resetSettings: () => {
    persistSettings(DEFAULT_SETTINGS);
    gameEvents.emit(GAME_EVENT.APPLY_SETTINGS, DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
  setShowCharacterModal: (open) => {
    if (open) {
      get().openHubTab('character');
    } else if (get().activeHubTab === 'character') {
      get().closeHub();
    }
  },
  toggleCharacterModal: () => {
    get().toggleHubTab('character');
  },
  setTerraria: (terraria) => set({ terraria }),
  setShowCraftModal: (open) => {
    if (open) {
      get().openHubTab('craft');
    } else if (get().activeHubTab === 'craft') {
      get().closeHub();
    }
  },
  toggleCraftModal: () => {
    get().toggleHubTab('craft');
  },
  setMissionSync: (payload) =>
    set({
      activeMission: payload.activeMission,
      completedMissionIds: payload.completedIds,
      totalMissionEarnings: payload.totalEarnings,
    }),
  setServiceModal: (serviceModal) => {
    emitModalPauseState(serviceModal, get().activeHubTab, get().hordePerkOffer);
    set({ serviceModal, arcadeResult: serviceModal ? get().arcadeResult : null });
  },
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setInteractionToast: (interactionToast) => set({ interactionToast }),
  toggleMute: () => {
    const nextMuted = !get().muted;
    gameEvents.emit(GAME_EVENT.SET_MUTED, nextMuted);
    set({ muted: nextMuted });
  },
  toggleMap: () => get().toggleHubTab('map'),
  setShowMap: (open) => {
    if (open) {
      get().openHubTab('map');
    } else if (get().activeHubTab === 'map') {
      get().closeHub();
    }
  },
  toggleHudCompact: () => set((s) => ({ hudCompact: !s.hudCompact })),
  cycleTouchControlsMode: () => {
    const current = get().touchControlsMode;
    const next: TouchControlsMode =
      current === 'auto' ? 'on' : current === 'on' ? 'off' : 'auto';
    set({ touchControlsMode: next });
  },
}));
