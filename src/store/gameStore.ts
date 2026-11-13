import { create } from 'zustand';
import { GamePlayMode, PLAYER_CONFIG, VehicleType, WEAPON_SPECS, WORLD_CONFIG } from '../game/config/BalanceConfig';
import {
  ActiveMissionState,
  ExplorationPayload,
  GAME_EVENT,
  gameEvents,
  GameMode,
  HordeTelemetryPayload,
  LandmarkInfo,
  MissionSyncPayload,
  NearbyNpcInfo,
  NearbyVehicleInfo,
  PlayerStatsPayload,
  PoliceMapMarker,
  RaceTelemetryPayload,
  SaveStatusPayload,
  ServiceModalPayload,
  VehicleTelemetryPayload,
  WantedTelemetryPayload,
  WeaponTelemetryPayload,
} from '../game/ui/GameEvents';
import { DistrictData } from '../game/world/DistrictManager';

export type TouchControlsMode = 'auto' | 'on' | 'off';

interface GameUIState {
  mode: GameMode;
  playMode: GamePlayMode;
  health: number;
  maxHealth: number;
  cash: number;
  wantedLevel: number;
  spotted: boolean;
  escapeProgress: number;
  lastKnownPos: { x: number; y: number } | null;
  policeMarkers: PoliceMapMarker[];
  activeMission: ActiveMissionState | null;
  completedMissionIds: string[];
  totalMissionEarnings: number;
  serviceModal: ServiceModalPayload | null;
  saveStatus: SaveStatusPayload;
  districtName: string;
  playerX: number;
  playerY: number;
  facingDeg: number;
  districtData: DistrictData | null;
  nearbyLandmark: LandmarkInfo | null;
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
  horde: HordeTelemetryPayload;
  race: RaceTelemetryPayload;
  exploration: ExplorationPayload;
  interactionToast: string | null;
  weapon: WeaponTelemetryPayload;
  muted: boolean;
  showMap: boolean;
  touchControlsMode: TouchControlsMode;

  setMode: (mode: GameMode) => void;
  setPlayMode: (playMode: GamePlayMode) => void;
  setDistrictData: (data: DistrictData) => void;
  updatePlayerPosition: (x: number, y: number, facingDeg: number, district: string) => void;
  setNearbyLandmark: (landmark: LandmarkInfo | null) => void;
  setNearbyNpc: (npc: NearbyNpcInfo | null) => void;
  setNearbyVehicle: (vehicle: NearbyVehicleInfo | null) => void;
  setVehicleTelemetry: (payload: VehicleTelemetryPayload) => void;
  setWantedTelemetry: (payload: WantedTelemetryPayload) => void;
  setPlayerStats: (payload: PlayerStatsPayload) => void;
  setWeaponTelemetry: (payload: WeaponTelemetryPayload) => void;
  setHordeTelemetry: (payload: HordeTelemetryPayload) => void;
  setRaceTelemetry: (payload: RaceTelemetryPayload) => void;
  setExploration: (payload: ExplorationPayload) => void;
  setMissionSync: (payload: MissionSyncPayload) => void;
  setServiceModal: (modal: ServiceModalPayload | null) => void;
  setSaveStatus: (status: SaveStatusPayload) => void;
  setInteractionToast: (message: string | null) => void;
  toggleMute: () => void;
  toggleMap: () => void;
  setShowMap: (open: boolean) => void;
  cycleTouchControlsMode: () => void;
}

export const useGameStore = create<GameUIState>((set, get) => ({
  mode: 'TITLE',
  playMode: 'sandbox',
  health: PLAYER_CONFIG.INITIAL_HEALTH,
  maxHealth: PLAYER_CONFIG.MAX_HEALTH,
  cash: PLAYER_CONFIG.INITIAL_CASH,
  wantedLevel: 0,
  spotted: false,
  escapeProgress: 0,
  lastKnownPos: null,
  policeMarkers: [],
  activeMission: null,
  completedMissionIds: [],
  totalMissionEarnings: 0,
  serviceModal: null,
  saveStatus: { hasSave: false, savedAt: null, cash: null, completedCount: 0 },
  districtName: WORLD_CONFIG.STARTING_DISTRICT,
  playerX: WORLD_CONFIG.PLAYER_SPAWN.x,
  playerY: WORLD_CONFIG.PLAYER_SPAWN.y,
  facingDeg: -90,
  districtData: null,
  nearbyLandmark: null,
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
  },
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
  interactionToast: null,
  weapon: {
    equippedId: 'pistol',
    name: WEAPON_SPECS.pistol.name,
    shortName: WEAPON_SPECS.pistol.shortName,
    colorHex: WEAPON_SPECS.pistol.colorHex,
    ammo: 999,
    infiniteAmmo: true,
    ownedIds: ['pistol'],
    ammoByWeapon: { pistol: 999, smg: 0, shotgun: 0 },
  },
  muted: false,
  showMap: false,
  touchControlsMode: 'auto',

  setMode: (mode) =>
    set({
      mode,
      showMap: mode === 'PLAYING' ? get().showMap : false,
      serviceModal: mode === 'PLAYING' ? get().serviceModal : null,
    }),
  setPlayMode: (playMode) => set({ playMode }),
  setDistrictData: (districtData) => set({ districtData, districtName: districtData.name }),
  updatePlayerPosition: (playerX, playerY, facingDeg, districtName) =>
    set({ playerX, playerY, facingDeg, districtName }),
  setNearbyLandmark: (nearbyLandmark) => set({ nearbyLandmark }),
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
    }),
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
      cash: payload.cash,
    }),
  setWeaponTelemetry: (weapon) => set({ weapon }),
  setHordeTelemetry: (horde) => set({ horde }),
  setRaceTelemetry: (race) => set({ race }),
  setExploration: (exploration) => set({ exploration }),
  setMissionSync: (payload) =>
    set({
      activeMission: payload.activeMission,
      completedMissionIds: payload.completedIds,
      totalMissionEarnings: payload.totalEarnings,
    }),
  setServiceModal: (serviceModal) => {
    gameEvents.emit(GAME_EVENT.SET_MODAL_PAUSED, Boolean(serviceModal));
    set({ serviceModal });
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
  cycleTouchControlsMode: () => {
    const current = get().touchControlsMode;
    const next: TouchControlsMode =
      current === 'auto' ? 'on' : current === 'on' ? 'off' : 'auto';
    set({ touchControlsMode: next });
  },
}));
