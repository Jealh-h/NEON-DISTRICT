import Phaser from 'phaser';
import { GamePlayMode, VehicleType, VehicleUpgradeTrack, WeaponId } from '../config/BalanceConfig';

export type GameMode = 'TITLE' | 'PLAYING' | 'PAUSED';

export interface LandmarkInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  x: number;
  y: number;
  accentColor: string;
}

export interface NearbyVehicleInfo {
  id: string;
  type: VehicleType;
  name: string;
  health: number;
  maxHealth: number;
  accentColor: string;
}

export interface NearbyNpcInfo {
  id: string;
  name: string;
  role: string;
}

export interface PoliceMapMarker {
  id: string;
  x: number;
  y: number;
  state: 'PATROL' | 'PURSUE' | 'SEARCH';
}

export interface WantedTelemetryPayload {
  wantedLevel: number;
  spotted: boolean;
  escapeProgress: number; // 0..100 when escaping
  lastKnownPos: { x: number; y: number } | null;
  policeMarkers: PoliceMapMarker[];
}

export interface PlayerStatsPayload {
  health: number;
  maxHealth: number;
  cash: number;
}

export interface VehicleUpgradeLevels {
  engine: number;
  handling: number;
  armor: number;
}

export interface VehicleSummary {
  id: string;
  type: VehicleType;
  name: string;
  health: number;
  maxHealth: number;
  upgrades: VehicleUpgradeLevels;
  accentColor: string;
}

export interface VehicleTelemetryPayload {
  inVehicle: boolean;
  id: string | null;
  type: VehicleType | null;
  name: string | null;
  speedKmh: number;
  health: number;
  maxHealth: number;
  nitro?: number;
  isBoosting?: boolean;
  upgrades?: VehicleUpgradeLevels;
}

export interface HordeTelemetryPayload {
  active: boolean;
  wave: number;
  enemiesRemaining: number;
  kills: number;
  combo: number;
  score: number;
  overdriveSec: number;
  restSec: number;
  bossName: string | null;
  bossHp: number;
  bossMaxHp: number;
  bestWave: number;
  bestScore: number;
  enemyMarkers: Array<{ x: number; y: number; isBoss: boolean }>;
}

export interface RaceTelemetryPayload {
  active: boolean;
  checkpointIndex: number;
  totalCheckpoints: number;
  targetPos: { x: number; y: number } | null;
  targetLabel: string | null;
  timeRemainingSec: number;
  elapsedSec: number;
  bestTimeSec: number | null;
  countdownSec: number;
}

export interface ExplorationPayload {
  chipsCollected: number;
  totalChips: number;
  chipMarkers: Array<{ x: number; y: number }>;
}

export interface ActiveMissionState {
  id: string;
  title: string;
  category: string;
  reward: number;
  stepIndex: number;
  totalSteps: number;
  instruction: string;
  objectiveType: 'reach' | 'escape_wanted';
  targetPos: { x: number; y: number } | null;
  targetLabel?: string;
  timeRemainingSec: number | null;
}

export interface MissionSyncPayload {
  activeMission: ActiveMissionState | null;
  completedIds: string[];
  totalEarnings: number;
}

export type ServiceModalKind = 'missions' | 'garage' | 'clinic' | 'store' | 'diner' | 'armory';

export interface ServiceModalPayload {
  kind: ServiceModalKind;
  title: string;
  subtitle: string;
  targetVehicle: VehicleSummary | null;
}

export type PurchaseServicePayload =
  | { serviceType: 'repair'; vehicleId: string }
  | { serviceType: 'respray' }
  | { serviceType: 'upgrade'; vehicleId: string; track: VehicleUpgradeTrack }
  | { serviceType: 'heal' }
  | { serviceType: 'snack' }
  | { serviceType: 'ramen' }
  | { serviceType: 'buy_weapon'; weaponId: WeaponId }
  | { serviceType: 'buy_ammo'; weaponId: WeaponId };

export interface AimFirePayload {
  x: number;
  y: number;
  firing: boolean;
}

export interface WeaponTelemetryPayload {
  equippedId: WeaponId;
  name: string;
  shortName: string;
  colorHex: string;
  ammo: number;
  infiniteAmmo: boolean;
  ownedIds: WeaponId[];
  ammoByWeapon: Record<WeaponId, number>;
}

export interface PlayerTelemetryPayload {
  x: number;
  y: number;
  facingDeg: number;
  isMoving: boolean;
  district: string;
}

export interface InteractionPayload {
  landmark: LandmarkInfo;
  message: string;
}

export interface DrivingInputPayload {
  throttle: number;
  brake: number;
  steer: number;
  nitro?: boolean;
}

export interface SaveStatusPayload {
  hasSave: boolean;
  savedAt: number | null;
  cash: number | null;
  completedCount: number;
}

export const GAME_EVENT = {
  START_GAME: 'game:start',
  START_PLAY_MODE: 'game:start_play_mode',
  CONTINUE_GAME: 'game:continue',
  START_NEW_GAME: 'game:start_new',
  PLAY_MODE_CHANGED: 'game:play_mode_changed',
  SAVE_GAME: 'game:save',
  DELETE_SAVE: 'game:delete_save',
  SAVE_STATUS_CHANGED: 'game:save_status_changed',
  PAUSE_GAME: 'game:pause',
  RESUME_GAME: 'game:resume',
  RETURN_TITLE: 'game:return_title',
  RESET_POSITION: 'game:reset_position',
  SET_MODAL_PAUSED: 'game:set_modal_paused',
  SET_MUTED: 'audio:set_muted',
  JOYSTICK_MOVE: 'input:joystick_move',
  AIM_FIRE: 'input:aim_fire',
  SWITCH_WEAPON: 'input:switch_weapon',
  DRIVING_INPUT: 'input:driving_input',
  TRIGGER_INTERACT: 'input:trigger_interact',
  TRIGGER_ENTER_EXIT: 'input:trigger_enter_exit',
  OPEN_QUICK_ARMORY: 'ui:open_quick_armory',
  TOGGLE_MAP: 'ui:toggle_map',
  SERVICE_MODAL_OPEN: 'ui:service_modal_open',
  ACCEPT_MISSION: 'mission:accept',
  ABANDON_MISSION: 'mission:abandon',
  MISSION_UPDATED: 'mission:updated',
  PURCHASE_SERVICE: 'economy:purchase_service',
  SCENE_READY: 'scene:ready',
  PLAYER_MOVED: 'player:moved',
  PLAYER_STATS: 'player:stats',
  WEAPON_TELEMETRY: 'weapon:telemetry',
  HORDE_UPDATED: 'horde:updated',
  RACE_UPDATED: 'race:updated',
  EXPLORATION_UPDATED: 'exploration:updated',
  LANDMARK_NEARBY: 'landmark:nearby',
  NPC_NEARBY: 'npc:nearby',
  VEHICLE_NEARBY: 'vehicle:nearby',
  VEHICLE_TELEMETRY: 'vehicle:telemetry',
  WANTED_CHANGED: 'wanted:changed',
  INTERACTION_RESULT: 'interaction:result',
  STATUS_TOAST: 'ui:status_toast',
  MODE_CHANGED: 'game:mode_changed',
} as const;

export type { GamePlayMode };

class TypedGameEventBus extends Phaser.Events.EventEmitter {}

export const gameEvents = new TypedGameEventBus();


