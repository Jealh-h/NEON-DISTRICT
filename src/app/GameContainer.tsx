import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../game/config/GameConfig';
import {
  ArcadeResultPayload,
  CustomWaypoint,
  EnvironmentTelemetryPayload,
  ExplorationPayload,
  GAME_EVENT,
  gameEvents,
  GameMode,
  GamePlayMode,
  HordePerkOfferPayload,
  HordeTelemetryPayload,
  InteractionPayload,
  LandmarkInfo,
  MissionSyncPayload,
  NearbyNpcInfo,
  NearbyPropInfo,
  NearbyVehicleInfo,
  PlayerStatsPayload,
  PlayerTelemetryPayload,
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
import { useGameStore } from '../store/gameStore';

export function GameContainer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const districtBannerTimerRef = useRef<number | null>(null);
  const lastDistrictRef = useRef<string | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const game = new Phaser.Game(createPhaserConfig(host));

    const showToast = (message: string) => {
      useGameStore.getState().setInteractionToast(message);
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        useGameStore.getState().setInteractionToast(null);
      }, 3600);
    };

    const showDistrictBanner = (name: string) => {
      useGameStore.getState().setDistrictBanner(name);
      if (districtBannerTimerRef.current !== null) {
        window.clearTimeout(districtBannerTimerRef.current);
      }
      districtBannerTimerRef.current = window.setTimeout(() => {
        useGameStore.getState().setDistrictBanner(null);
      }, 2800);
    };

    const handleSceneReady = (payload: { district: DistrictData }) => {
      const store = useGameStore.getState();
      store.setDistrictData(payload.district);
      lastDistrictRef.current = payload.district.name;
      gameEvents.emit(GAME_EVENT.APPLY_SETTINGS, store.settings);
    };

    const handleModeChanged = (mode: GameMode) => {
      useGameStore.getState().setMode(mode);
      if (mode !== 'PLAYING') {
        useGameStore.getState().setDistrictBanner(null);
      }
    };

    const handlePlayModeChanged = (playMode: GamePlayMode) => {
      useGameStore.getState().setPlayMode(playMode);
    };

    const handlePlayerMoved = (payload: PlayerTelemetryPayload) => {
      const store = useGameStore.getState();
      if (lastDistrictRef.current && lastDistrictRef.current !== payload.district && store.mode === 'PLAYING') {
        showDistrictBanner(payload.district);
      }
      lastDistrictRef.current = payload.district;
      store.updatePlayerPosition(
        payload.x,
        payload.y,
        payload.facingDeg,
        payload.district
      );
    };

    const handleLandmarkNearby = (landmark: LandmarkInfo | null) => {
      useGameStore.getState().setNearbyLandmark(landmark);
    };

    const handlePropNearby = (prop: NearbyPropInfo | null) => {
      useGameStore.getState().setNearbyProp(prop);
    };

    const handleNpcNearby = (npc: NearbyNpcInfo | null) => {
      useGameStore.getState().setNearbyNpc(npc);
    };

    const handleVehicleNearby = (vehicle: NearbyVehicleInfo | null) => {
      useGameStore.getState().setNearbyVehicle(vehicle);
    };

    const handleVehicleTelemetry = (payload: VehicleTelemetryPayload) => {
      useGameStore.getState().setVehicleTelemetry(payload);
    };

    const handleRadioChanged = (payload: RadioStationPayload) => {
      useGameStore.getState().setRadioStation(payload);
    };

    const handleSafehouseStatus = (owns: boolean) => {
      useGameStore.getState().setOwnsSafehouse(owns);
    };

    const handleArcadeResult = (result: ArcadeResultPayload) => {
      useGameStore.getState().setArcadeResult(result);
    };

    const handleWantedChanged = (payload: WantedTelemetryPayload) => {
      useGameStore.getState().setWantedTelemetry(payload);
    };

    const handlePlayerStats = (payload: PlayerStatsPayload) => {
      useGameStore.getState().setPlayerStats(payload);
    };

    const handleWeaponTelemetry = (payload: WeaponTelemetryPayload) => {
      useGameStore.getState().setWeaponTelemetry(payload);
    };

    const handleHordeUpdated = (payload: HordeTelemetryPayload) => {
      useGameStore.getState().setHordeTelemetry(payload);
    };

    const handleRaceUpdated = (payload: RaceTelemetryPayload) => {
      useGameStore.getState().setRaceTelemetry(payload);
    };

    const handleExplorationUpdated = (payload: ExplorationPayload) => {
      useGameStore.getState().setExploration(payload);
    };

    const handleMissionUpdated = (payload: MissionSyncPayload) => {
      useGameStore.getState().setMissionSync(payload);
    };

    const handleServiceModalOpen = (payload: ServiceModalPayload) => {
      useGameStore.getState().setServiceModal(payload);
    };

    const handleSaveStatusChanged = (payload: SaveStatusPayload) => {
      useGameStore.getState().setSaveStatus(payload);
    };

    const handleInteractionResult = (payload: InteractionPayload) => {
      showToast(payload.message);
    };

    const handleStatusToast = (message: string) => {
      showToast(message);
    };

    const handleToggleMap = () => {
      useGameStore.getState().toggleMap();
    };

    const handleEnvironmentUpdated = (payload: EnvironmentTelemetryPayload) => {
      useGameStore.getState().setEnvironment(payload);
    };

    const handleRandomEventsUpdated = (events: RandomEventMarker[]) => {
      useGameStore.getState().setRandomEvents(events);
    };

    const handleProgressionUpdated = (payload: ProgressionTelemetryPayload) => {
      useGameStore.getState().setProgression(payload);
    };

    const handleHordePerkOffer = (offer: HordePerkOfferPayload | null) => {
      useGameStore.getState().setHordePerkOffer(offer);
    };

    const handleToggleCharacterModal = () => {
      useGameStore.getState().toggleCharacterModal();
    };

    const handleSandboxHint = (hint: SandboxInteractableHint | null) => {
      useGameStore.getState().setSandboxHint(hint);
    };

    const handleSandboxUpdated = (summary: SandboxSummaryPayload) => {
      useGameStore.getState().setSandboxSummary(summary);
    };

    const handleSetCustomWaypoint = (wp: CustomWaypoint | null) => {
      useGameStore.getState().setCustomWaypoint(wp);
    };

    const handleTerrariaUpdated = (payload: TerrariaTelemetryPayload) => {
      useGameStore.getState().setTerraria(payload);
    };

    const handleToggleCraftModal = () => {
      useGameStore.getState().toggleCraftModal();
    };

    const handleOpenQuickArmory = () => {
      useGameStore.getState().toggleHubTab('armory');
    };

    const handleSandboxComboChanged = (combo: number) => {
      useGameStore.getState().setSandboxCombo(combo);
    };

    gameEvents.on(GAME_EVENT.SCENE_READY, handleSceneReady);
    gameEvents.on(GAME_EVENT.MODE_CHANGED, handleModeChanged);
    gameEvents.on(GAME_EVENT.PLAY_MODE_CHANGED, handlePlayModeChanged);
    gameEvents.on(GAME_EVENT.PLAYER_MOVED, handlePlayerMoved);
    gameEvents.on(GAME_EVENT.LANDMARK_NEARBY, handleLandmarkNearby);
    gameEvents.on(GAME_EVENT.PROP_NEARBY, handlePropNearby);
    gameEvents.on(GAME_EVENT.NPC_NEARBY, handleNpcNearby);
    gameEvents.on(GAME_EVENT.VEHICLE_NEARBY, handleVehicleNearby);
    gameEvents.on(GAME_EVENT.VEHICLE_TELEMETRY, handleVehicleTelemetry);
    gameEvents.on(GAME_EVENT.RADIO_CHANGED, handleRadioChanged);
    gameEvents.on(GAME_EVENT.SAFEHOUSE_STATUS, handleSafehouseStatus);
    gameEvents.on(GAME_EVENT.ARCADE_RESULT, handleArcadeResult);
    gameEvents.on(GAME_EVENT.WANTED_CHANGED, handleWantedChanged);
    gameEvents.on(GAME_EVENT.PLAYER_STATS, handlePlayerStats);
    gameEvents.on(GAME_EVENT.WEAPON_TELEMETRY, handleWeaponTelemetry);
    gameEvents.on(GAME_EVENT.HORDE_UPDATED, handleHordeUpdated);
    gameEvents.on(GAME_EVENT.HORDE_PERK_OFFER, handleHordePerkOffer);
    gameEvents.on(GAME_EVENT.RACE_UPDATED, handleRaceUpdated);
    gameEvents.on(GAME_EVENT.EXPLORATION_UPDATED, handleExplorationUpdated);
    gameEvents.on(GAME_EVENT.SANDBOX_HINT, handleSandboxHint);
    gameEvents.on(GAME_EVENT.SANDBOX_UPDATED, handleSandboxUpdated);
    gameEvents.on(GAME_EVENT.SANDBOX_COMBO_CHANGED, handleSandboxComboChanged);
    gameEvents.on(GAME_EVENT.SET_CUSTOM_WAYPOINT, handleSetCustomWaypoint);
    gameEvents.on(GAME_EVENT.ENVIRONMENT_UPDATED, handleEnvironmentUpdated);
    gameEvents.on(GAME_EVENT.RANDOM_EVENTS_UPDATED, handleRandomEventsUpdated);
    gameEvents.on(GAME_EVENT.PROGRESSION_UPDATED, handleProgressionUpdated);
    gameEvents.on(GAME_EVENT.MISSION_UPDATED, handleMissionUpdated);
    gameEvents.on(GAME_EVENT.SERVICE_MODAL_OPEN, handleServiceModalOpen);
    gameEvents.on(GAME_EVENT.SAVE_STATUS_CHANGED, handleSaveStatusChanged);
    gameEvents.on(GAME_EVENT.INTERACTION_RESULT, handleInteractionResult);
    gameEvents.on(GAME_EVENT.STATUS_TOAST, handleStatusToast);
    gameEvents.on(GAME_EVENT.TOGGLE_MAP, handleToggleMap);
    gameEvents.on(GAME_EVENT.TOGGLE_CHARACTER_MODAL, handleToggleCharacterModal);
    gameEvents.on(GAME_EVENT.TERRARIA_UPDATED, handleTerrariaUpdated);
    gameEvents.on(GAME_EVENT.TOGGLE_CRAFT_MODAL, handleToggleCraftModal);
    gameEvents.on(GAME_EVENT.OPEN_QUICK_ARMORY, handleOpenQuickArmory);

    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (districtBannerTimerRef.current !== null) {
        window.clearTimeout(districtBannerTimerRef.current);
      }
      gameEvents.off(GAME_EVENT.SCENE_READY, handleSceneReady);
      gameEvents.off(GAME_EVENT.MODE_CHANGED, handleModeChanged);
      gameEvents.off(GAME_EVENT.PLAY_MODE_CHANGED, handlePlayModeChanged);
      gameEvents.off(GAME_EVENT.PLAYER_MOVED, handlePlayerMoved);
      gameEvents.off(GAME_EVENT.LANDMARK_NEARBY, handleLandmarkNearby);
      gameEvents.off(GAME_EVENT.PROP_NEARBY, handlePropNearby);
      gameEvents.off(GAME_EVENT.NPC_NEARBY, handleNpcNearby);
      gameEvents.off(GAME_EVENT.VEHICLE_NEARBY, handleVehicleNearby);
      gameEvents.off(GAME_EVENT.VEHICLE_TELEMETRY, handleVehicleTelemetry);
      gameEvents.off(GAME_EVENT.RADIO_CHANGED, handleRadioChanged);
      gameEvents.off(GAME_EVENT.SAFEHOUSE_STATUS, handleSafehouseStatus);
      gameEvents.off(GAME_EVENT.ARCADE_RESULT, handleArcadeResult);
      gameEvents.off(GAME_EVENT.WANTED_CHANGED, handleWantedChanged);
      gameEvents.off(GAME_EVENT.PLAYER_STATS, handlePlayerStats);
      gameEvents.off(GAME_EVENT.WEAPON_TELEMETRY, handleWeaponTelemetry);
      gameEvents.off(GAME_EVENT.HORDE_UPDATED, handleHordeUpdated);
      gameEvents.off(GAME_EVENT.HORDE_PERK_OFFER, handleHordePerkOffer);
      gameEvents.off(GAME_EVENT.RACE_UPDATED, handleRaceUpdated);
      gameEvents.off(GAME_EVENT.EXPLORATION_UPDATED, handleExplorationUpdated);
      gameEvents.off(GAME_EVENT.SANDBOX_HINT, handleSandboxHint);
      gameEvents.off(GAME_EVENT.SANDBOX_UPDATED, handleSandboxUpdated);
      gameEvents.off(GAME_EVENT.SANDBOX_COMBO_CHANGED, handleSandboxComboChanged);
      gameEvents.off(GAME_EVENT.SET_CUSTOM_WAYPOINT, handleSetCustomWaypoint);
      gameEvents.off(GAME_EVENT.ENVIRONMENT_UPDATED, handleEnvironmentUpdated);
      gameEvents.off(GAME_EVENT.RANDOM_EVENTS_UPDATED, handleRandomEventsUpdated);
      gameEvents.off(GAME_EVENT.PROGRESSION_UPDATED, handleProgressionUpdated);
      gameEvents.off(GAME_EVENT.MISSION_UPDATED, handleMissionUpdated);
      gameEvents.off(GAME_EVENT.SERVICE_MODAL_OPEN, handleServiceModalOpen);
      gameEvents.off(GAME_EVENT.SAVE_STATUS_CHANGED, handleSaveStatusChanged);
      gameEvents.off(GAME_EVENT.INTERACTION_RESULT, handleInteractionResult);
      gameEvents.off(GAME_EVENT.STATUS_TOAST, handleStatusToast);
      gameEvents.off(GAME_EVENT.TOGGLE_MAP, handleToggleMap);
      gameEvents.off(GAME_EVENT.TOGGLE_CHARACTER_MODAL, handleToggleCharacterModal);
      gameEvents.off(GAME_EVENT.TERRARIA_UPDATED, handleTerrariaUpdated);
      gameEvents.off(GAME_EVENT.TOGGLE_CRAFT_MODAL, handleToggleCraftModal);
      gameEvents.off(GAME_EVENT.OPEN_QUICK_ARMORY, handleOpenQuickArmory);
      game.destroy(true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phaser-game-container"
      className="fixed inset-0 h-full w-full bg-[#080D18]"
    />
  );
}
