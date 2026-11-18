import Phaser from 'phaser';
import {
  GamePlayMode,
  MechKind,
  VehicleType,
  VehicleUpgradeTrack,
  VehicleWeaponKind,
  WeaponId,
  WeaponUpgradeTrack,
} from '../config/BalanceConfig';
import type {
  CyberwareSlotId,
  RandomEventType,
  ReputationFactionId,
  SkillTrackId,
  TimePhaseId,
  WeatherId,
} from '../config/ExpansionConfig';

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
  armor: number;
  maxArmor: number;
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
  paintColor?: number | null;
}

export interface NearbyPropInfo {
  id: string;
  kind: 'atm' | 'vending';
  title: string;
  actionLabel: string;
}

export interface RadioStationPayload {
  index: number;
  name: string;
  genre: string;
}

export interface ArcadeResultPayload {
  bet: number;
  multiplier: number;
  payout: number;
  reels: [string, string, string];
  message: string;
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
  isFlying?: boolean;
  hasTurret?: boolean;
  weaponKind?: VehicleWeaponKind;
  upgrades?: VehicleUpgradeLevels;
}

export interface MechTelemetryPayload {
  active: boolean;
  kind: MechKind | null;
  name: string | null;
  hp: number;
  maxHp: number;
  abilityLabel: string | null;
  abilityCooldownSec: number;
  abilityMaxCooldownSec: number;
  turretCount: number;
  maxTurrets: number;
}

export interface ActiveHordePerkSummary {
  id: string;
  name: string;
  stacks: number;
  accentColor: string;
}

export interface HordePerkChoice {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  currentStacks: number;
  maxStacks: number;
}

export interface HordePerkOfferPayload {
  waveCleared: number;
  choices: HordePerkChoice[];
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
  mech?: MechTelemetryPayload;
  activePerks?: ActiveHordePerkSummary[];
}

export interface EnvironmentTelemetryPayload {
  timePhase: TimePhaseId;
  timeLabel: string;
  clockText: string;
  weather: WeatherId;
  weatherLabel: string;
  weatherEffectHint: string;
  darknessAlpha: number;
}

export interface RandomEventMarker {
  id: string;
  type: RandomEventType;
  title: string;
  description: string;
  district: string;
  x: number;
  y: number;
  remainingTargets: number;
  totalTargets: number;
  timeRemainingSec: number;
  accentColor: string;
}

export interface ProgressionTelemetryPayload {
  level: number;
  exp: number;
  nextLevelExp: number;
  skillPoints: number;
  skills: Record<SkillTrackId, number>;
  cyberware: Record<CyberwareSlotId, number>;
  reputation: Record<ReputationFactionId, number>;
  jammerUnlocked: boolean;
  jammerCooldownSec: number;
  jammerActiveSec: number;
  damageBonusPct: number;
  critChancePct: number;
  fireRateBonusPct: number;
  moveSpeedBonusPct: number;
  vehicleSpeedBonusPct: number;
  damageReductionPct: number;
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

export type ServiceModalKind =
  | 'missions'
  | 'garage'
  | 'clinic'
  | 'store'
  | 'diner'
  | 'armory'
  | 'safehouse'
  | 'arcade'
  | 'club';

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
  | { serviceType: 'paint'; vehicleId: string; colorNum: number | null; colorName: string }
  | { serviceType: 'heal' }
  | { serviceType: 'snack' }
  | { serviceType: 'ramen' }
  | { serviceType: 'buy_armor' }
  | { serviceType: 'deploy_mech'; mechKind: MechKind }
  | { serviceType: 'deploy_turret' }
  | { serviceType: 'orbital_strike' }
  | { serviceType: 'airdrop_tank' }
  | { serviceType: 'buy_weapon'; weaponId: WeaponId }
  | { serviceType: 'equip_weapon'; weaponId: WeaponId }
  | { serviceType: 'buy_ammo'; weaponId: WeaponId }
  | { serviceType: 'upgrade_weapon'; weaponId: WeaponId; track: WeaponUpgradeTrack }
  | { serviceType: 'buy_safehouse' }
  | { serviceType: 'safehouse_rest' }
  | { serviceType: 'rob_store' }
  | { serviceType: 'arcade_spin'; bet: number }
  | { serviceType: 'club_cocktail' }
  | { serviceType: 'club_bribe' };

export interface AimFirePayload {
  x: number;
  y: number;
  firing: boolean;
}

export interface WeaponUpgradeLevels {
  damage: number;
  firerate: number;
  capacity: number;
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
  maxAmmoByWeapon: Record<WeaponId, number>;
  upgradesByWeapon: Record<WeaponId, WeaponUpgradeLevels>;
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
  driveX: number;
  driveY: number;
  nitro?: boolean;
  handbrake?: boolean;
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
  CYCLE_RADIO: 'audio:cycle_radio',
  RADIO_CHANGED: 'audio:radio_changed',
  JOYSTICK_MOVE: 'input:joystick_move',
  AIM_FIRE: 'input:aim_fire',
  SWITCH_WEAPON: 'input:switch_weapon',
  DRIVING_INPUT: 'input:driving_input',
  TRIGGER_INTERACT: 'input:trigger_interact',
  TRIGGER_ENTER_EXIT: 'input:trigger_enter_exit',
  TRIGGER_MECH_ABILITY: 'input:trigger_mech_ability',
  OPEN_QUICK_ARMORY: 'ui:open_quick_armory',
  TOGGLE_CHARACTER_MODAL: 'ui:toggle_character_modal',
  TOGGLE_MAP: 'ui:toggle_map',
  SERVICE_MODAL_OPEN: 'ui:service_modal_open',
  ACCEPT_MISSION: 'mission:accept',
  ABANDON_MISSION: 'mission:abandon',
  MISSION_UPDATED: 'mission:updated',
  PURCHASE_SERVICE: 'economy:purchase_service',
  UPGRADE_SKILL: 'progression:upgrade_skill',
  BUY_CYBERWARE: 'progression:buy_cyberware',
  TRIGGER_HACK_JAM: 'progression:trigger_hack_jam',
  SELECT_HORDE_PERK: 'horde:select_perk',
  HORDE_PERK_OFFER: 'horde:perk_offer',
  ENVIRONMENT_UPDATED: 'world:environment_updated',
  RANDOM_EVENTS_UPDATED: 'world:random_events_updated',
  PROGRESSION_UPDATED: 'progression:updated',
  SCENE_READY: 'scene:ready',
  PLAYER_MOVED: 'player:moved',
  PLAYER_STATS: 'player:stats',
  SAFEHOUSE_STATUS: 'player:safehouse_status',
  ARCADE_RESULT: 'arcade:result',
  WEAPON_TELEMETRY: 'weapon:telemetry',
  HORDE_UPDATED: 'horde:updated',
  RACE_UPDATED: 'race:updated',
  EXPLORATION_UPDATED: 'exploration:updated',
  LANDMARK_NEARBY: 'landmark:nearby',
  PROP_NEARBY: 'prop:nearby',
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


