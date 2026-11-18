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
import type { WeaponUpgradeLevels } from '../game/ui/GameEvents';
import {
  ActiveMissionState,
  ArcadeResultPayload,
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
  SaveStatusPayload,
  ServiceModalPayload,
  VehicleTelemetryPayload,
  WantedTelemetryPayload,
  WeaponTelemetryPayload,
} from '../game/ui/GameEvents';
import { DistrictData } from '../game/world/DistrictManager';

export type TouchControlsMode = 'auto' | 'on' | 'off';

function emitModalPauseState(
  serviceModal: ServiceModalPayload | null,
  showCharacterModal: boolean,
  hordePerkOffer: HordePerkOfferPayload | null
): void {
  gameEvents.emit(
    GAME_EVENT.SET_MODAL_PAUSED,
    Boolean(serviceModal || showCharacterModal || hordePerkOffer)
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
  radioStation: RadioStationPayload;
  horde: HordeTelemetryPayload;
  hordePerkOffer: HordePerkOfferPayload | null;
  race: RaceTelemetryPayload;
  exploration: ExplorationPayload;
  environment: EnvironmentTelemetryPayload;
  randomEvents: RandomEventMarker[];
  progression: ProgressionTelemetryPayload;
  showCharacterModal: boolean;
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
  setEnvironment: (payload: EnvironmentTelemetryPayload) => void;
  setRandomEvents: (events: RandomEventMarker[]) => void;
  setProgression: (payload: ProgressionTelemetryPayload) => void;
  setShowCharacterModal: (open: boolean) => void;
  toggleCharacterModal: () => void;
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
    totalCheckpoints: 14,
    targetPos: null,
    targetLabel: null,
    timeRemainingSec: 0,
    elapsedSec: 0,
    bestTimeSec: null,
    countdownSec: 0,
  },
  exploration: {
    chipsCollected: 0,
    totalChips: 10,
    chipMarkers: [],
  },
  environment: {
    timePhase: 'night',
    timeLabel: '霓虹深夜',
    clockText: '22:00',
    weather: 'clear',
    weatherLabel: '晴朗夜空',
    weatherEffectHint: '视野与路面抓地力最佳',
    darknessAlpha: 0.28,
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
      showMap: mode === 'PLAYING' ? get().showMap : false,
      serviceModal: mode === 'PLAYING' ? get().serviceModal : null,
      arcadeResult: mode === 'PLAYING' ? get().arcadeResult : null,
      showCharacterModal: mode === 'PLAYING' ? get().showCharacterModal : false,
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
    emitModalPauseState(get().serviceModal, get().showCharacterModal, hordePerkOffer);
    set({ hordePerkOffer });
  },
  setRaceTelemetry: (race) => set({ race }),
  setExploration: (exploration) => set({ exploration }),
  setEnvironment: (environment) => set({ environment }),
  setRandomEvents: (randomEvents) => set({ randomEvents }),
  setProgression: (progression) => set({ progression }),
  setShowCharacterModal: (showCharacterModal) => {
    const nextOpen = get().mode === 'PLAYING' ? showCharacterModal : false;
    emitModalPauseState(get().serviceModal, nextOpen, get().hordePerkOffer);
    set({ showCharacterModal: nextOpen });
  },
  toggleCharacterModal: () => {
    const state = get();
    if (state.mode !== 'PLAYING') return;
    if (state.serviceModal || state.hordePerkOffer) return;
    const nextOpen = !state.showCharacterModal;
    emitModalPauseState(state.serviceModal, nextOpen, state.hordePerkOffer);
    set({ showCharacterModal: nextOpen, showMap: nextOpen ? false : state.showMap });
  },
  setMissionSync: (payload) =>
    set({
      activeMission: payload.activeMission,
      completedMissionIds: payload.completedIds,
      totalMissionEarnings: payload.totalEarnings,
    }),
  setServiceModal: (serviceModal) => {
    emitModalPauseState(serviceModal, get().showCharacterModal, get().hordePerkOffer);
    set({ serviceModal, arcadeResult: serviceModal ? get().arcadeResult : null });
  },
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setInteractionToast: (interactionToast) => set({ interactionToast }),
  toggleMute: () => {
    const nextMuted = !get().muted;
    gameEvents.emit(GAME_EVENT.SET_MUTED, nextMuted);
    set({ muted: nextMuted });
  },
  toggleMap: () => set((s) => ({ showMap: !s.showMap })),
  setShowMap: (showMap) => set({ showMap }),
  toggleHudCompact: () => set((s) => ({ hudCompact: !s.hudCompact })),
  cycleTouchControlsMode: () => {
    const current = get().touchControlsMode;
    const next: TouchControlsMode =
      current === 'auto' ? 'on' : current === 'on' ? 'off' : 'auto';
    set({ touchControlsMode: next });
  },
}));
