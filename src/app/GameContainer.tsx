import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from '../game/config/GameConfig';
import {
  ExplorationPayload,
  GAME_EVENT,
  gameEvents,
  GameMode,
  GamePlayMode,
  HordeTelemetryPayload,
  InteractionPayload,
  LandmarkInfo,
  MissionSyncPayload,
  NearbyNpcInfo,
  NearbyVehicleInfo,
  PlayerStatsPayload,
  PlayerTelemetryPayload,
  RaceTelemetryPayload,
  SaveStatusPayload,
  ServiceModalPayload,
  VehicleTelemetryPayload,
  WantedTelemetryPayload,
  WeaponTelemetryPayload,
} from '../game/ui/GameEvents';
import { DistrictData } from '../game/world/DistrictManager';
import { useGameStore } from '../store/gameStore';

export function GameContainer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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

    const handleSceneReady = (payload: { district: DistrictData }) => {
      useGameStore.getState().setDistrictData(payload.district);
    };

    const handleModeChanged = (mode: GameMode) => {
      useGameStore.getState().setMode(mode);
    };

    const handlePlayModeChanged = (playMode: GamePlayMode) => {
      useGameStore.getState().setPlayMode(playMode);
    };

    const handlePlayerMoved = (payload: PlayerTelemetryPayload) => {
      useGameStore.getState().updatePlayerPosition(
        payload.x,
        payload.y,
        payload.facingDeg,
        payload.district
      );
    };

    const handleLandmarkNearby = (landmark: LandmarkInfo | null) => {
      useGameStore.getState().setNearbyLandmark(landmark);
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

    gameEvents.on(GAME_EVENT.SCENE_READY, handleSceneReady);
    gameEvents.on(GAME_EVENT.MODE_CHANGED, handleModeChanged);
    gameEvents.on(GAME_EVENT.PLAY_MODE_CHANGED, handlePlayModeChanged);
    gameEvents.on(GAME_EVENT.PLAYER_MOVED, handlePlayerMoved);
    gameEvents.on(GAME_EVENT.LANDMARK_NEARBY, handleLandmarkNearby);
    gameEvents.on(GAME_EVENT.NPC_NEARBY, handleNpcNearby);
    gameEvents.on(GAME_EVENT.VEHICLE_NEARBY, handleVehicleNearby);
    gameEvents.on(GAME_EVENT.VEHICLE_TELEMETRY, handleVehicleTelemetry);
    gameEvents.on(GAME_EVENT.WANTED_CHANGED, handleWantedChanged);
    gameEvents.on(GAME_EVENT.PLAYER_STATS, handlePlayerStats);
    gameEvents.on(GAME_EVENT.WEAPON_TELEMETRY, handleWeaponTelemetry);
    gameEvents.on(GAME_EVENT.HORDE_UPDATED, handleHordeUpdated);
    gameEvents.on(GAME_EVENT.RACE_UPDATED, handleRaceUpdated);
    gameEvents.on(GAME_EVENT.EXPLORATION_UPDATED, handleExplorationUpdated);
    gameEvents.on(GAME_EVENT.MISSION_UPDATED, handleMissionUpdated);
    gameEvents.on(GAME_EVENT.SERVICE_MODAL_OPEN, handleServiceModalOpen);
    gameEvents.on(GAME_EVENT.SAVE_STATUS_CHANGED, handleSaveStatusChanged);
    gameEvents.on(GAME_EVENT.INTERACTION_RESULT, handleInteractionResult);
    gameEvents.on(GAME_EVENT.STATUS_TOAST, handleStatusToast);
    gameEvents.on(GAME_EVENT.TOGGLE_MAP, handleToggleMap);

    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      gameEvents.off(GAME_EVENT.SCENE_READY, handleSceneReady);
      gameEvents.off(GAME_EVENT.MODE_CHANGED, handleModeChanged);
      gameEvents.off(GAME_EVENT.PLAY_MODE_CHANGED, handlePlayModeChanged);
      gameEvents.off(GAME_EVENT.PLAYER_MOVED, handlePlayerMoved);
      gameEvents.off(GAME_EVENT.LANDMARK_NEARBY, handleLandmarkNearby);
      gameEvents.off(GAME_EVENT.NPC_NEARBY, handleNpcNearby);
      gameEvents.off(GAME_EVENT.VEHICLE_NEARBY, handleVehicleNearby);
      gameEvents.off(GAME_EVENT.VEHICLE_TELEMETRY, handleVehicleTelemetry);
      gameEvents.off(GAME_EVENT.WANTED_CHANGED, handleWantedChanged);
      gameEvents.off(GAME_EVENT.PLAYER_STATS, handlePlayerStats);
      gameEvents.off(GAME_EVENT.WEAPON_TELEMETRY, handleWeaponTelemetry);
      gameEvents.off(GAME_EVENT.HORDE_UPDATED, handleHordeUpdated);
      gameEvents.off(GAME_EVENT.RACE_UPDATED, handleRaceUpdated);
      gameEvents.off(GAME_EVENT.EXPLORATION_UPDATED, handleExplorationUpdated);
      gameEvents.off(GAME_EVENT.MISSION_UPDATED, handleMissionUpdated);
      gameEvents.off(GAME_EVENT.SERVICE_MODAL_OPEN, handleServiceModalOpen);
      gameEvents.off(GAME_EVENT.SAVE_STATUS_CHANGED, handleSaveStatusChanged);
      gameEvents.off(GAME_EVENT.INTERACTION_RESULT, handleInteractionResult);
      gameEvents.off(GAME_EVENT.STATUS_TOAST, handleStatusToast);
      gameEvents.off(GAME_EVENT.TOGGLE_MAP, handleToggleMap);
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
