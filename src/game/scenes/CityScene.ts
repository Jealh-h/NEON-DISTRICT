import Phaser from 'phaser';
import {
  CAMERA_CONFIG,
  ECONOMY_CONFIG,
  GamePlayMode,
  PLAYER_CONFIG,
  RADIO_STATIONS,
  VEHICLE_UPGRADE_CONFIG,
  WANTED_CONFIG,
  WEAPON_SPECS,
  WEAPON_UPGRADE_CONFIG,
  WORLD_CONFIG,
} from '../config/BalanceConfig';
import { Player } from '../entities/Player';
import { AudioManager } from '../systems/AudioManager';
import { HordeManager } from '../systems/HordeManager';
import { InputManager } from '../systems/InputManager';
import { InteractivePropManager } from '../systems/InteractivePropManager';
import { MissionManager } from '../systems/MissionManager';
import { NPCManager } from '../systems/NPCManager';
import { PickupManager } from '../systems/PickupManager';
import { PoliceManager } from '../systems/PoliceManager';
import { RaceManager } from '../systems/RaceManager';
import { SaveManager } from '../systems/SaveManager';
import { TrafficManager } from '../systems/TrafficManager';
import { VehicleManager } from '../systems/VehicleManager';
import { WantedManager } from '../systems/WantedManager';
import { WeaponManager } from '../systems/WeaponManager';
import {
  AimFirePayload,
  DrivingInputPayload,
  GAME_EVENT,
  gameEvents,
  GameMode,
  LandmarkInfo,
  PurchaseServicePayload,
  ServiceModalKind,
} from '../ui/GameEvents';
import { CollisionManager } from '../world/CollisionManager';
import { DistrictData, DistrictManager } from '../world/DistrictManager';
import { WorldManager } from '../world/WorldManager';

const SERVICE_LANDMARK_IDS = new Set([
  'nexus-ops',
  'plaza-garage',
  'plaza-tech',
  'cyber-clinic',
  'byte-mart',
  'kitsune-noodles',
  'harbor-market',
  'chrome-workshop',
  'skyline-apts',
  'arcade-lounge',
  'synth-club',
]);

export class CityScene extends Phaser.Scene {
  private districtManager!: DistrictManager;
  private worldManager!: WorldManager;
  private collisionManager!: CollisionManager;
  private inputManager!: InputManager;
  private audioManager!: AudioManager;
  private vehicleManager!: VehicleManager;
  private npcManager!: NPCManager;
  private trafficManager!: TrafficManager;
  private wantedManager!: WantedManager;
  private policeManager!: PoliceManager;
  private missionManager!: MissionManager;
  private weaponManager!: WeaponManager;
  private pickupManager!: PickupManager;
  private interactivePropManager!: InteractivePropManager;
  private hordeManager!: HordeManager;
  private raceManager!: RaceManager;
  private saveManager!: SaveManager;
  private player!: Player;
  private districtData!: DistrictData;

  private mode: GameMode = 'TITLE';
  private playMode: GamePlayMode = 'sandbox';
  private modalPaused = false;
  private hitstopTimer = 0;
  private titlePanAngle = 0;
  private lastTelemetryEmit = 0;
  private autoSaveTimer = 0;
  private activeLandmark: LandmarkInfo | null = null;
  private lastNearbyPropId: string | null = null;
  private currentGarageId = 'plaza-garage';
  private ownsSafehouse = false;
  private lastStoreRobberyAt = -999999;
  private clubOverdriveTimer = 0;
  private playerHealth: number = PLAYER_CONFIG.INITIAL_HEALTH;
  private playerMaxHealth: number = PLAYER_CONFIG.MAX_HEALTH;
  private playerCash: number = PLAYER_CONFIG.INITIAL_CASH;
  private lastDamageAt = 0;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super({ key: 'CityScene' });
  }

  public create(): void {
    this.districtManager = new DistrictManager();
    this.districtData = this.districtManager.getNeonPlaza();

    this.physics.world.setBounds(16, 16, WORLD_CONFIG.WIDTH - 32, WORLD_CONFIG.HEIGHT - 32);

    this.collisionManager = new CollisionManager(this);
    this.worldManager = new WorldManager(this);
    this.worldManager.buildDistrict(this.districtData, this.collisionManager);

    this.player = new Player(this, WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
    this.collisionManager.registerPlayerCollider(this.player.sprite, () => {
      if (this.mode === 'PLAYING' && !this.player.isInVehicle()) {
        this.player.triggerBumpFeedback(this.time.now);
        this.audioManager.playBump(this.time.now);
      }
    });

    this.inputManager = new InputManager(this);
    this.audioManager = new AudioManager();

    this.vehicleManager = new VehicleManager(this, this.collisionManager, this.audioManager);
    this.vehicleManager.spawnInitialVehicles(this.player);

    this.wantedManager = new WantedManager(this.audioManager);
    this.policeManager = new PoliceManager(
      this,
      this.collisionManager,
      this.audioManager,
      this.wantedManager
    );
    this.missionManager = new MissionManager(this, this.audioManager, this.wantedManager);
    this.weaponManager = new WeaponManager(this, this.collisionManager, this.audioManager);
    this.pickupManager = new PickupManager(this, this.audioManager);
    this.pickupManager.initializeWorldPickups();
    this.interactivePropManager = new InteractivePropManager(
      this,
      this.audioManager,
      this.pickupManager,
      this.districtData
    );
    this.hordeManager = new HordeManager(
      this,
      this.collisionManager,
      this.audioManager,
      this.pickupManager
    );
    this.raceManager = new RaceManager(this, this.audioManager);
    this.saveManager = new SaveManager();

    this.npcManager = new NPCManager(this, this.collisionManager, this.audioManager);
    this.npcManager.spawnInitialNpcs(this.player);
    this.npcManager.registerVehicleColliders(
      this.vehicleManager.getVehicleSprites(),
      (vehSprite, _npc, speed) => {
        const activeVeh = this.vehicleManager.getActiveVehicle();
        if (this.playMode === 'sandbox' && activeVeh && activeVeh.sprite === vehSprite && speed > 55) {
          this.wantedManager.reportCrime('hit_pedestrian', { x: vehSprite.x, y: vehSprite.y }, true);
        }
      }
    );

    this.trafficManager = new TrafficManager(this, this.audioManager);
    this.trafficManager.spawnTraffic(
      this.player,
      this.vehicleManager.getVehicleSprites(),
      this.npcManager,
      (vehSprite, speed) => {
        const activeVeh = this.vehicleManager.getActiveVehicle();
        if (this.playMode === 'sandbox' && activeVeh && activeVeh.sprite === vehSprite && speed > 150) {
          const nearbyPolice = this.policeManager.isPoliceNearby(vehSprite.x, vehSprite.y, 420);
          this.wantedManager.reportCrime('reckless_crash', { x: vehSprite.x, y: vehSprite.y }, nearbyPolice);
        }
      }
    );

    this.policeManager.spawnPoliceUnits(
      this.player,
      this.vehicleManager.getVehicles(),
      (amount) => this.applyPlayerDamage(amount)
    );

    this.configureCamera();
    this.bindEvents();

    this.setMode('TITLE');
    gameEvents.emit(GAME_EVENT.SCENE_READY, { district: this.districtData });
    gameEvents.emit(GAME_EVENT.PLAY_MODE_CHANGED, this.playMode);
    this.emitPlayerStats();
    this.emitRadioStation();
    gameEvents.emit(GAME_EVENT.SAFEHOUSE_STATUS, this.ownsSafehouse);
    this.weaponManager.emitTelemetry();
    this.missionManager.emitSync(true);
    this.hordeManager.emitTelemetry(true);
    this.raceManager.emitTelemetry(true);
    this.pickupManager.emitExploration();
    this.emitSaveStatus();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
  }

  private getTargetZoom(isDriving: boolean): number {
    const isCompactViewport = this.scale.width < 900 || this.scale.height < 520;
    if (isDriving) {
      return isCompactViewport ? CAMERA_CONFIG.ZOOM_MOBILE_DRIVING : CAMERA_CONFIG.ZOOM_DESKTOP_DRIVING;
    }
    return isCompactViewport ? CAMERA_CONFIG.ZOOM_MOBILE : CAMERA_CONFIG.ZOOM_DESKTOP;
  }

  private configureCamera(): void {
    const cam = this.cameras.main;
    cam.setZoom(this.getTargetZoom(false));
    cam.setBounds(0, 0, WORLD_CONFIG.WIDTH, WORLD_CONFIG.HEIGHT);
    cam.centerOn(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);

    const onResize = () => {
      if (!this.cameras || !this.cameras.main) return;
      const isDriving = Boolean(this.vehicleManager?.getActiveVehicle());
      this.cameras.main.setZoom(this.getTargetZoom(isDriving));
    };
    this.scale.on('resize', onResize);
    this.unsubscribers.push(() => {
      this.scale.off('resize', onResize);
    });
  }

  private bindEvents(): void {
    const onStart = () => {
      this.audioManager.playUiConfirm();
      this.startPlayMode('sandbox', false);
    };
    const onStartPlayMode = (nextPlayMode: GamePlayMode) => {
      this.audioManager.playUiConfirm();
      this.startPlayMode(nextPlayMode, false);
    };
    const onContinueGame = () => {
      this.audioManager.playUiConfirm();
      this.startPlayMode('sandbox', true);
    };
    const onStartNewGame = () => {
      this.audioManager.playUiConfirm();
      this.startPlayMode('sandbox', false);
    };
    const onSaveGame = () => {
      if (this.playMode !== 'sandbox') {
        gameEvents.emit(
          GAME_EVENT.STATUS_TOAST,
          '仅自由沙盒模式支持手动存档，无尽/竞速模式纪录会自动保存！'
        );
        return;
      }
      this.performSave(false);
      this.audioManager.playPurchase();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '当前进度已保存至本地存档！');
    };
    const onDeleteSave = () => {
      this.saveManager.clearSave();
      this.emitSaveStatus();
      this.audioManager.playUiConfirm();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '本地存档已清除。');
    };
    const onPause = () => {
      if (this.mode === 'PLAYING') {
        this.setMode('PAUSED');
      }
    };
    const onResume = () => {
      this.audioManager.playUiConfirm();
      this.setMode('PLAYING');
    };
    const onReturnTitle = () => {
      if (this.playMode === 'sandbox') {
        this.performSave(true);
      }
      this.hordeManager.stop();
      this.raceManager.stop();
      this.pickupManager.clearTemporaryDrops();
      this.setMode('TITLE');
    };
    const onResetPos = () => {
      if (this.vehicleManager.getActiveVehicle()) {
        this.vehicleManager.forceEject(this.player, WORLD_CONFIG.PLAYER_SPAWN);
      }
      this.player.resetPosition(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
      this.cameras.main.startFollow(this.player.sprite, true, CAMERA_CONFIG.LERP_X, CAMERA_CONFIG.LERP_Y);
      this.cameras.main.setZoom(this.getTargetZoom(false));
      this.cameras.main.centerOn(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
      this.emitVehicleTelemetry(null);
      this.emitTelemetry(true);
    };
    const onSetMuted = (muted: boolean) => {
      this.audioManager.setMuted(muted);
    };
    const onCycleRadio = () => {
      if (this.mode === 'PLAYING' && this.vehicleManager.getActiveVehicle()) {
        this.cycleCarRadio();
      }
    };
    const onJoystick = (vec: { x: number; y: number }) => {
      this.inputManager.setVirtualJoystick(vec.x, vec.y);
    };
    const onAimFire = (payload: AimFirePayload) => {
      this.inputManager.setVirtualAimFire(payload);
    };
    const onSwitchWeapon = (slot?: 'next' | number) => {
      if (this.mode === 'PLAYING' && !this.modalPaused && !this.player.isInVehicle()) {
        this.weaponManager.switchWeapon(slot ?? 'next', this.player);
      }
    };
    const onOpenQuickArmory = () => {
      if (this.mode === 'PLAYING') {
        this.openQuickArmoryModal();
      }
    };
    const onDrivingInput = (payload: DrivingInputPayload) => {
      this.inputManager.setVirtualDriving(payload);
    };
    const onVirtualInteract = () => {
      this.inputManager.queueVirtualInteract();
    };
    const onVirtualEnterExit = () => {
      this.inputManager.queueVirtualEnterExit();
    };
    const onAcceptMission = (missionId: string) => {
      this.missionManager.acceptMission(missionId);
    };
    const onAbandonMission = () => {
      this.missionManager.abandonMission(false);
    };
    const onPurchaseService = (payload: PurchaseServicePayload) => {
      this.handlePurchaseService(payload);
    };
    const onSetModalPaused = (paused: boolean) => {
      this.modalPaused = paused;
      this.hitstopTimer = 0;
      if (this.mode !== 'PLAYING') return;
      if (paused) {
        this.player.freeze();
        this.vehicleManager.freezeAll();
        this.npcManager.freezeAll();
        this.trafficManager.freezeAll();
        this.policeManager.freezeAll();
        this.hordeManager.freezeAll();
        this.weaponManager.clearProjectiles();
        this.audioManager.stopSirenSound();
        this.audioManager.setRadioPlaying(false);
        this.inputManager.resetAllHeldInputs();
        this.physics.world.pause();
      } else {
        this.physics.world.resume();
        this.audioManager.setRadioPlaying(Boolean(this.vehicleManager.getActiveVehicle()));
      }
    };

    gameEvents.on(GAME_EVENT.START_GAME, onStart);
    gameEvents.on(GAME_EVENT.START_PLAY_MODE, onStartPlayMode);
    gameEvents.on(GAME_EVENT.CONTINUE_GAME, onContinueGame);
    gameEvents.on(GAME_EVENT.START_NEW_GAME, onStartNewGame);
    gameEvents.on(GAME_EVENT.SAVE_GAME, onSaveGame);
    gameEvents.on(GAME_EVENT.DELETE_SAVE, onDeleteSave);
    gameEvents.on(GAME_EVENT.PAUSE_GAME, onPause);
    gameEvents.on(GAME_EVENT.RESUME_GAME, onResume);
    gameEvents.on(GAME_EVENT.RETURN_TITLE, onReturnTitle);
    gameEvents.on(GAME_EVENT.RESET_POSITION, onResetPos);
    gameEvents.on(GAME_EVENT.SET_MUTED, onSetMuted);
    gameEvents.on(GAME_EVENT.CYCLE_RADIO, onCycleRadio);
    gameEvents.on(GAME_EVENT.JOYSTICK_MOVE, onJoystick);
    gameEvents.on(GAME_EVENT.AIM_FIRE, onAimFire);
    gameEvents.on(GAME_EVENT.SWITCH_WEAPON, onSwitchWeapon);
    gameEvents.on(GAME_EVENT.OPEN_QUICK_ARMORY, onOpenQuickArmory);
    gameEvents.on(GAME_EVENT.DRIVING_INPUT, onDrivingInput);
    gameEvents.on(GAME_EVENT.TRIGGER_INTERACT, onVirtualInteract);
    gameEvents.on(GAME_EVENT.TRIGGER_ENTER_EXIT, onVirtualEnterExit);
    gameEvents.on(GAME_EVENT.ACCEPT_MISSION, onAcceptMission);
    gameEvents.on(GAME_EVENT.ABANDON_MISSION, onAbandonMission);
    gameEvents.on(GAME_EVENT.PURCHASE_SERVICE, onPurchaseService);
    gameEvents.on(GAME_EVENT.SET_MODAL_PAUSED, onSetModalPaused);

    this.unsubscribers.push(() => {
      gameEvents.off(GAME_EVENT.START_GAME, onStart);
      gameEvents.off(GAME_EVENT.START_PLAY_MODE, onStartPlayMode);
      gameEvents.off(GAME_EVENT.CONTINUE_GAME, onContinueGame);
      gameEvents.off(GAME_EVENT.START_NEW_GAME, onStartNewGame);
      gameEvents.off(GAME_EVENT.SAVE_GAME, onSaveGame);
      gameEvents.off(GAME_EVENT.DELETE_SAVE, onDeleteSave);
      gameEvents.off(GAME_EVENT.PAUSE_GAME, onPause);
      gameEvents.off(GAME_EVENT.RESUME_GAME, onResume);
      gameEvents.off(GAME_EVENT.RETURN_TITLE, onReturnTitle);
      gameEvents.off(GAME_EVENT.RESET_POSITION, onResetPos);
      gameEvents.off(GAME_EVENT.SET_MUTED, onSetMuted);
      gameEvents.off(GAME_EVENT.CYCLE_RADIO, onCycleRadio);
      gameEvents.off(GAME_EVENT.JOYSTICK_MOVE, onJoystick);
      gameEvents.off(GAME_EVENT.AIM_FIRE, onAimFire);
      gameEvents.off(GAME_EVENT.SWITCH_WEAPON, onSwitchWeapon);
      gameEvents.off(GAME_EVENT.OPEN_QUICK_ARMORY, onOpenQuickArmory);
      gameEvents.off(GAME_EVENT.DRIVING_INPUT, onDrivingInput);
      gameEvents.off(GAME_EVENT.TRIGGER_INTERACT, onVirtualInteract);
      gameEvents.off(GAME_EVENT.TRIGGER_ENTER_EXIT, onVirtualEnterExit);
      gameEvents.off(GAME_EVENT.ACCEPT_MISSION, onAcceptMission);
      gameEvents.off(GAME_EVENT.ABANDON_MISSION, onAbandonMission);
      gameEvents.off(GAME_EVENT.PURCHASE_SERVICE, onPurchaseService);
      gameEvents.off(GAME_EVENT.SET_MODAL_PAUSED, onSetModalPaused);
    });
  }

  private startPlayMode(nextPlayMode: GamePlayMode, useSave = false): void {
    this.playMode = nextPlayMode;
    this.hitstopTimer = 0;
    this.modalPaused = false;
    this.clubOverdriveTimer = 0;
    this.activeLandmark = null;
    this.lastNearbyPropId = null;
    gameEvents.emit(GAME_EVENT.LANDMARK_NEARBY, null);
    gameEvents.emit(GAME_EVENT.PROP_NEARBY, null);
    gameEvents.emit(GAME_EVENT.NPC_NEARBY, null);
    gameEvents.emit(GAME_EVENT.VEHICLE_NEARBY, null);
    gameEvents.emit(GAME_EVENT.PLAY_MODE_CHANGED, nextPlayMode);

    this.weaponManager.clearProjectiles();
    this.pickupManager.clearTemporaryDrops();

    if (nextPlayMode === 'sandbox') {
      this.hordeManager.stop();
      this.raceManager.stop();
      this.policeManager.setPursuitEnabled(true);
      this.pickupManager.setChipsVisible(true);
      if (useSave) {
        this.loadFromSave();
      } else {
        this.resetToNewGame();
      }
    } else if (nextPlayMode === 'horde') {
      this.raceManager.stop();
      this.policeManager.setPursuitEnabled(false);
      this.pickupManager.setChipsVisible(false);
      this.missionManager.abandonMission(true);
      this.vehicleManager.resetAllToInitial(this.player);
      this.weaponManager.resetToDefault(this.player);
      this.player.resetPosition(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
      this.playerHealth = this.playerMaxHealth;
      this.playerCash = 800;
      this.cameras.main.centerOn(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
      this.emitVehicleTelemetry(null);
      this.emitPlayerStats();
      this.hordeManager.start();
    } else if (nextPlayMode === 'race') {
      this.hordeManager.stop();
      this.policeManager.setPursuitEnabled(false);
      this.pickupManager.setChipsVisible(false);
      this.missionManager.abandonMission(true);
      this.vehicleManager.resetAllToInitial(this.player);
      this.weaponManager.resetToDefault(this.player);
      const raceVeh = this.vehicleManager.enterRaceVehicle(this.player);
      this.playerHealth = this.playerMaxHealth;
      this.playerCash = PLAYER_CONFIG.INITIAL_CASH;
      this.emitPlayerStats();
      this.emitVehicleTelemetry(raceVeh);
      if (raceVeh) {
        this.cameras.main.centerOn(raceVeh.sprite.x, raceVeh.sprite.y);
      }
      this.raceManager.start();
    }

    this.setMode('PLAYING');
  }

  private setMode(nextMode: GameMode): void {
    this.mode = nextMode;
    this.modalPaused = false;
    this.hitstopTimer = 0;
    const cam = this.cameras.main;

    if (nextMode === 'TITLE') {
      this.player.freeze();
      this.vehicleManager.freezeAll();
      this.npcManager.freezeAll();
      this.trafficManager.freezeAll();
      this.policeManager.freezeAll();
      this.hordeManager.freezeAll();
      this.weaponManager.clearProjectiles();
      this.audioManager.stopSirenSound();
      this.audioManager.setRadioPlaying(false);
      this.inputManager.resetAllHeldInputs();
      cam.stopFollow();
      this.physics.world.pause();
    } else if (nextMode === 'PLAYING') {
      this.audioManager.unlock();
      this.physics.world.resume();
      const activeVehicle = this.vehicleManager.getActiveVehicle();
      const targetSprite = activeVehicle ? activeVehicle.sprite : this.player.sprite;
      cam.startFollow(targetSprite, true, CAMERA_CONFIG.LERP_X, CAMERA_CONFIG.LERP_Y);
      cam.setZoom(this.getTargetZoom(Boolean(activeVehicle)));
      this.audioManager.setRadioPlaying(Boolean(activeVehicle));
      this.emitTelemetry(true);
    } else if (nextMode === 'PAUSED') {
      this.player.freeze();
      this.vehicleManager.freezeAll();
      this.npcManager.freezeAll();
      this.trafficManager.freezeAll();
      this.policeManager.freezeAll();
      this.hordeManager.freezeAll();
      this.weaponManager.clearProjectiles();
      this.audioManager.stopSirenSound();
      this.audioManager.setRadioPlaying(false);
      this.inputManager.resetAllHeldInputs();
      this.physics.world.pause();
    }

    gameEvents.emit(GAME_EVENT.MODE_CHANGED, nextMode);
  }

  public update(time: number, rawDeltaMs: number): void {
    const dt = Math.min(rawDeltaMs / 1000, 0.05);
    const timeSec = time / 1000;
    const activeVehicle = this.vehicleManager.getActiveVehicle();

    this.worldManager.update(
      timeSec,
      dt,
      activeVehicle ? null : this.player.getPosition()
    );

    if (this.mode === 'TITLE') {
      this.titlePanAngle += dt * CAMERA_CONFIG.TITLE_PAN_SPEED;
      const panX = 1140 + Math.cos(this.titlePanAngle) * 480;
      const panY = 780 + Math.sin(this.titlePanAngle * 0.85) * 340;
      this.cameras.main.centerOn(panX, panY);
      return;
    }

    if (this.modalPaused) {
      this.inputManager.consumePauseJustPressed();
      return;
    }

    if (this.inputManager.consumePauseJustPressed()) {
      if (this.mode === 'PLAYING') {
        this.setMode('PAUSED');
        return;
      } else if (this.mode === 'PAUSED') {
        this.setMode('PLAYING');
        return;
      }
    }

    if (this.mode !== 'PLAYING') return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      if (this.hitstopTimer <= 0) {
        this.hitstopTimer = 0;
        this.physics.world.resume();
      } else {
        return;
      }
    }

    if (this.inputManager.consumeMapJustPressed()) {
      gameEvents.emit(GAME_EVENT.TOGGLE_MAP);
    }

    if (this.inputManager.consumeQuickArmoryJustPressed()) {
      this.openQuickArmoryModal();
    }

    if (this.inputManager.consumeEnterExitJustPressed()) {
      const result = this.vehicleManager.tryToggleEnterExit(this.player);
      const cam = this.cameras.main;

      if (result.action === 'entered' && result.vehicle) {
        cam.startFollow(result.vehicle.sprite, true, CAMERA_CONFIG.LERP_X, CAMERA_CONFIG.LERP_Y);
        cam.zoomTo(this.getTargetZoom(true), 260, 'Sine.easeOut');
        if (this.activeLandmark) {
          this.activeLandmark = null;
          gameEvents.emit(GAME_EVENT.LANDMARK_NEARBY, null);
        }
        this.lastNearbyPropId = null;
        gameEvents.emit(GAME_EVENT.PROP_NEARBY, null);
        gameEvents.emit(GAME_EVENT.NPC_NEARBY, null);
        gameEvents.emit(GAME_EVENT.VEHICLE_NEARBY, null);
        this.emitVehicleTelemetry(result.vehicle);
        this.audioManager.setRadioPlaying(true);

        if (this.playMode === 'sandbox' && result.vehicle.spec.type === 'cruiser') {
          this.wantedManager.reportCrime('steal_police_car', result.vehicle.getPosition(), true);
        }
      } else if (result.action === 'exited') {
        cam.startFollow(this.player.sprite, true, CAMERA_CONFIG.LERP_X, CAMERA_CONFIG.LERP_Y);
        cam.zoomTo(this.getTargetZoom(false), 260, 'Sine.easeOut');
        this.audioManager.setRadioPlaying(false);
        this.emitVehicleTelemetry(null);
      } else if (result.action === 'blocked' && result.reason) {
        this.audioManager.playBump(time);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, result.reason);
      }
    }

    if (this.clubOverdriveTimer > 0) {
      this.clubOverdriveTimer = Math.max(0, this.clubOverdriveTimer - dt);
    }

    const currentVehicle = this.vehicleManager.getActiveVehicle();
    const rawDrivingControls = this.inputManager.getDrivingControls();
    const drivingControls =
      this.playMode === 'race' && this.raceManager.isCountingDown()
        ? { driveX: 0, driveY: 0, handbrake: true, nitro: false }
        : rawDrivingControls;

    this.vehicleManager.update(dt, drivingControls, this.districtData, (bonus) => {
      this.playerCash += bonus;
      this.emitPlayerStats();
    });

    this.interactivePropManager.update(dt, time);

    // Update living city traffic, police patrol/pursuit & pedestrian NPCs
    const vehiclePositions = this.vehicleManager.getVehiclePositions();
    const trafficObstacles: Array<{ x: number; y: number }> = [
      ...vehiclePositions.map((v) => ({ x: v.x, y: v.y })),
    ];
    if (!currentVehicle) {
      trafficObstacles.push(this.player.getPosition());
    }
    this.trafficManager.update(dt, timeSec, trafficObstacles);

    const targetPos = currentVehicle ? currentVehicle.getPosition() : this.player.getPosition();
    this.policeManager.update(dt, time, targetPos, Boolean(currentVehicle));

    this.pickupManager.update(dt, time, targetPos, {
      onCash: (amount) => {
        this.playerCash += amount;
        this.emitPlayerStats();
      },
      onHeal: (amount) => {
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
        this.emitPlayerStats();
      },
      onOverdrive: (durationSec) => {
        this.hordeManager.activateOverdrive(durationSec);
      },
      weaponManager: this.weaponManager,
    });

    if (this.playMode === 'sandbox') {
      this.missionManager.update(dt, time, targetPos, Boolean(currentVehicle), (reward) => {
        this.playerCash += reward;
        this.emitPlayerStats();
        this.performSave(true);
      });

      this.autoSaveTimer += dt;
      if (this.autoSaveTimer >= 20) {
        this.autoSaveTimer = 0;
        this.performSave(true);
      }
    } else if (this.playMode === 'horde') {
      this.hordeManager.update(
        dt,
        time,
        targetPos,
        (damage) => this.applyPlayerDamage(damage),
        (healAmount) => {
          this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
          this.emitPlayerStats();
        }
      );
    } else if (this.playMode === 'race') {
      this.raceManager.update(dt, time, targetPos, currentVehicle, (reward) => {
        this.playerCash += reward;
        this.emitPlayerStats();
      });
    }

    const fastVehicles = [
      ...this.vehicleManager.getFastVehicleData(),
      ...this.trafficManager.getFastVehicleData(),
    ];
    this.npcManager.update(dt, fastVehicles);

    let isMoving = false;
    if (currentVehicle) {
      isMoving = currentVehicle.getSpeedPxPerSec() > 4;
      this.emitVehicleTelemetry(currentVehicle);

      if (this.inputManager.consumeRadioJustPressed()) {
        this.cycleCarRadio();
      }

      if (!currentVehicle.isAirborne()) {
        this.interactivePropManager.checkVehicleRam(
          currentVehicle.sprite.x,
          currentVehicle.sprite.y,
          currentVehicle.getSpeedPxPerSec(),
          {
            npcManager: this.npcManager,
            policeManager: this.policeManager,
            hordeManager: this.hordeManager,
            onCrime: (crimeType, cPos, hasWitness) => {
              if (this.playMode === 'sandbox') {
                this.wantedManager.reportCrime(crimeType, cPos, hasWitness);
              }
            },
            onDamagePlayer: (dmg) => this.applyPlayerDamage(dmg),
            onCashBonus: (bonus) => {
              this.playerCash += bonus;
              this.emitPlayerStats();
            },
          }
        );
      }

      // Drive-in garage bay detection across both garages
      this.checkNearbyLandmarks(currentVehicle.getPosition(), 112, ['plaza-garage', 'chrome-workshop']);
      if (
        this.inputManager.consumeInteractJustPressed() &&
        (this.activeLandmark?.id === 'plaza-garage' || this.activeLandmark?.id === 'chrome-workshop')
      ) {
        this.openLandmarkService(this.activeLandmark);
      }
    } else {
      const switchSlot = this.inputManager.consumeSwitchWeaponSlot();
      if (switchSlot !== null) {
        this.weaponManager.switchWeapon(switchSlot, this.player);
      }

      const fireInput = this.inputManager.getFireInput(
        this.player.getPosition(),
        this.player.getFacingRadians()
      );
      const moveVec = this.inputManager.getMovementVector();
      isMoving = this.player.update(
        dt,
        moveVec,
        () => {
          this.audioManager.playFootstep(time);
        },
        fireInput.aiming ? fireInput.aimAngleRad : undefined
      );

      if (fireInput.firing) {
        this.weaponManager.tryFire(
          time,
          this.player,
          fireInput.aimAngleRad,
          this.npcManager,
          this.policeManager,
          (crimeType, cPos, hasWitness) => {
            if (this.playMode === 'sandbox') {
              this.wantedManager.reportCrime(crimeType, cPos, hasWitness);
            }
          },
          this.hordeManager.isOverdriveActive() || this.clubOverdriveTimer > 0
        );
      }

      const pos = this.player.getPosition();
      const nearbyVeh = this.vehicleManager.checkNearbyVehicleChange(pos.x, pos.y);
      if (nearbyVeh.changed) {
        gameEvents.emit(GAME_EVENT.VEHICLE_NEARBY, nearbyVeh.vehicle);
      }

      this.checkNearbyLandmarks(pos, PLAYER_CONFIG.INTERACT_RADIUS);

      const nearbyProp = this.interactivePropManager.getNearbyInteractable(pos.x, pos.y);
      if ((nearbyProp?.id ?? null) !== this.lastNearbyPropId) {
        this.lastNearbyPropId = nearbyProp?.id ?? null;
        gameEvents.emit(GAME_EVENT.PROP_NEARBY, nearbyProp);
      }

      const isAtServiceTerminal =
        this.activeLandmark !== null && SERVICE_LANDMARK_IDS.has(this.activeLandmark.id);
      if (isAtServiceTerminal || nearbyProp) {
        this.npcManager.checkNearbyNpcChange(-9999, -9999);
        gameEvents.emit(GAME_EVENT.NPC_NEARBY, null);
      } else {
        const nearbyNpc = this.npcManager.checkNearbyNpcChange(pos.x, pos.y);
        if (nearbyNpc.changed) {
          gameEvents.emit(GAME_EVENT.NPC_NEARBY, nearbyNpc.npc);
        }
      }

      if (this.inputManager.consumeInteractJustPressed()) {
        if (isAtServiceTerminal && this.activeLandmark) {
          this.openLandmarkService(this.activeLandmark);
        } else if (nearbyProp) {
          this.interactivePropManager.interactNearest(pos.x, pos.y, {
            nowMs: time,
            isHealthFull: () => this.playerHealth >= this.playerMaxHealth,
            tryDeduct: (cost) => {
              if (this.playerCash < cost) {
                this.audioManager.playBump(time);
                gameEvents.emit(GAME_EVENT.STATUS_TOAST, `现金不足，需要 $${cost}！`);
                return false;
              }
              this.playerCash -= cost;
              this.emitPlayerStats();
              return true;
            },
            onHeal: (amount) => {
              this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
              this.emitPlayerStats();
            },
            onCash: (amount) => {
              this.playerCash += amount;
              this.emitPlayerStats();
            },
            onAtmAlarm: (atmPos) => {
              if (this.playMode === 'sandbox') {
                this.wantedManager.reportCrime('hit_pedestrian', atmPos, true);
              }
            },
          });
        } else {
          const npcDialogue = this.npcManager.interactNearest(pos.x, pos.y);
          if (npcDialogue) {
            gameEvents.emit(GAME_EVENT.STATUS_TOAST, npcDialogue);
          } else if (this.activeLandmark) {
            this.audioManager.playInteract();
            gameEvents.emit(GAME_EVENT.INTERACTION_RESULT, {
              landmark: this.activeLandmark,
              message: `${this.activeLandmark.name}：${this.activeLandmark.description}`,
            });
          }
        }
      }
    }

    this.weaponManager.update(
      dt,
      this.player,
      this.npcManager,
      this.policeManager,
      this.vehicleManager,
      this.trafficManager,
      (crimeType, cPos, hasWitness) => {
        if (this.playMode === 'sandbox') {
          this.wantedManager.reportCrime(crimeType, cPos, hasWitness);
        }
      },
      (bonus) => {
        this.playerCash += bonus;
        this.emitPlayerStats();
      },
      (durationSec) => {
        if (this.hitstopTimer <= 0) {
          this.hitstopTimer = Math.max(this.hitstopTimer, durationSec);
          this.physics.world.pause();
        }
      },
      this.hordeManager,
      this.interactivePropManager,
      (dmg) => this.applyPlayerDamage(dmg)
    );

    if (isMoving || time - this.lastTelemetryEmit > 150) {
      this.emitTelemetry(false);
    }
  }

  private checkNearbyLandmarks(
    pos: { x: number; y: number },
    radius: number,
    onlyIds?: string[]
  ): void {
    let closest: LandmarkInfo | null = null;
    let closestDist: number = radius;

    for (const lm of this.districtData.landmarks) {
      if (onlyIds && !onlyIds.includes(lm.id)) continue;
      const dist = Phaser.Math.Distance.Between(pos.x, pos.y, lm.x, lm.y);
      if (dist <= closestDist) {
        closestDist = dist;
        closest = lm;
      }
    }

    if ((closest?.id ?? null) !== (this.activeLandmark?.id ?? null)) {
      this.activeLandmark = closest;
      gameEvents.emit(GAME_EVENT.LANDMARK_NEARBY, closest);
    }
  }

  private openQuickArmoryModal(): void {
    this.audioManager.playInteract();
    gameEvents.emit(GAME_EVENT.SERVICE_MODAL_OPEN, {
      kind: 'armory',
      title: '战术随身军械终端',
      subtitle: '购买 7 款高能枪械、强化武器火力/射速/弹容，或使用战地纳米急救！',
      targetVehicle: null,
    });
  }

  private openLandmarkService(landmark: LandmarkInfo): void {
    this.audioManager.playInteract();
    const kindMap: Record<string, ServiceModalKind> = {
      'nexus-ops': 'missions',
      'plaza-garage': 'garage',
      'chrome-workshop': 'garage',
      'plaza-tech': 'armory',
      'harbor-market': 'armory',
      'cyber-clinic': 'clinic',
      'byte-mart': 'store',
      'kitsune-noodles': 'diner',
      'skyline-apts': 'safehouse',
      'arcade-lounge': 'arcade',
      'synth-club': 'club',
    };
    const kind = kindMap[landmark.id];
    if (!kind) return;

    if (kind === 'garage') {
      this.currentGarageId = landmark.id;
    }

    const pos = this.vehicleManager.getActiveVehicle()?.getPosition() ?? this.player.getPosition();
    const garageTarget =
      kind === 'garage' ? this.vehicleManager.findGarageTargetVehicle(pos.x, pos.y) : null;

    gameEvents.emit(GAME_EVENT.SERVICE_MODAL_OPEN, {
      kind,
      title: landmark.name,
      subtitle: landmark.description,
      targetVehicle: garageTarget ? garageTarget.getSummary() : null,
    });
  }

  private emitGarageModalRefresh(veh: NonNullable<ReturnType<VehicleManager['getVehicleById']>>): void {
    const lm = this.districtData.landmarks.find((l) => l.id === this.currentGarageId);
    gameEvents.emit(GAME_EVENT.SERVICE_MODAL_OPEN, {
      kind: 'garage',
      title: lm?.name ?? '广场改装车库',
      subtitle: lm?.description ?? '提供车身修复、引擎与悬挂改装、个性涂装及隐匿喷漆消星服务。',
      targetVehicle: veh.getSummary(),
    });
  }

  private handlePurchaseService(payload: PurchaseServicePayload): void {
    const deduct = (cost: number): boolean => {
      if (this.playerCash < cost) {
        this.audioManager.playBump(this.time.now);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `现金不足，需要 $${cost}！`);
        return false;
      }
      this.playerCash -= cost;
      return true;
    };

    if (payload.serviceType === 'heal') {
      if (this.playerHealth >= this.playerMaxHealth) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '生命值已满，无需医疗修复。');
        return;
      }
      if (!deduct(ECONOMY_CONFIG.CLINIC_HEAL_COST)) return;
      this.playerHealth = this.playerMaxHealth;
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '纳米急救完成，生命值已全面恢复！');
      return;
    }

    if (payload.serviceType === 'snack') {
      if (this.playerHealth >= this.playerMaxHealth) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '生命值已满，暂时不需要补给。');
        return;
      }
      if (!deduct(ECONOMY_CONFIG.SNACK_COST)) return;
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + ECONOMY_CONFIG.SNACK_HEAL);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `饮用合成能量饮，恢复 +${ECONOMY_CONFIG.SNACK_HEAL} 生命值！`
      );
      return;
    }

    if (payload.serviceType === 'ramen') {
      if (this.playerHealth >= this.playerMaxHealth) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '体力充沛，无需加餐。');
        return;
      }
      if (!deduct(ECONOMY_CONFIG.RAMEN_COST)) return;
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + ECONOMY_CONFIG.RAMEN_HEAL);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `享用热腾腾的合成豚骨拉面，恢复 +${ECONOMY_CONFIG.RAMEN_HEAL} 生命值！`
      );
      return;
    }

    if (payload.serviceType === 'rob_store') {
      if (this.playMode !== 'sandbox') {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '当前模式无法抢劫便利店收银台。');
        return;
      }
      const now = this.time.now;
      const elapsed = now - this.lastStoreRobberyAt;
      if (elapsed < 90000) {
        const waitSec = Math.ceil((90000 - elapsed) / 1000);
        this.audioManager.playBump(now);
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `便利店防盗柜锁定中，请 ${waitSec} 秒后再尝试！`);
        return;
      }
      this.lastStoreRobberyAt = now;
      const loot = 220 + Math.floor(Math.random() * 121);
      this.playerCash += loot;
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.wantedManager.reportCrime('assault_police', this.player.getPosition(), true);
      this.performSave(true);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `洗劫收银台得手 +$${loot}！警铃响起，快驾车撤离！`);
      return;
    }

    if (payload.serviceType === 'buy_safehouse') {
      if (this.ownsSafehouse) return;
      if (!deduct(ECONOMY_CONFIG.SAFEHOUSE_PRICE)) return;
      this.ownsSafehouse = true;
      this.audioManager.playMissionComplete();
      gameEvents.emit(GAME_EVENT.SAFEHOUSE_STATUS, true);
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        '恭喜购入【天际公寓】私人安全屋！可随时免费恢复生命、消除通缉与存档。'
      );
      return;
    }

    if (payload.serviceType === 'safehouse_rest') {
      if (!this.ownsSafehouse) return;
      this.playerHealth = this.playerMaxHealth;
      this.wantedManager.clearWanted(false);
      this.audioManager.playEscapedChime();
      this.emitPlayerStats();
      this.performSave(false);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        '已在安全屋休整：生命值恢复满格、通缉已消除且进度已存档！'
      );
      return;
    }

    if (payload.serviceType === 'arcade_spin') {
      const bet = Math.max(25, payload.bet);
      if (!deduct(bet)) return;
      const symbols = ['777', 'NEON', 'GOLD', 'CHIP', 'ZERO'] as const;
      const roll = Math.random();
      let mult = 0;
      let reels: [string, string, string] = ['NEON', 'CHIP', 'ZERO'];

      if (roll < 0.05) {
        mult = 4;
        reels = ['777', '777', '777'];
      } else if (roll < 0.16) {
        mult = 2.5;
        reels = ['GOLD', 'GOLD', 'GOLD'];
      } else if (roll < 0.36) {
        mult = 1.6;
        reels = ['NEON', 'NEON', 'NEON'];
      } else if (roll < 0.52) {
        mult = 0.8;
        reels = ['CHIP', 'CHIP', 'GOLD'];
      } else {
        const a = symbols[Math.floor(Math.random() * 4)];
        const b = symbols[(symbols.indexOf(a) + 1) % 4];
        const c = symbols[(symbols.indexOf(a) + 2) % 5];
        reels = [a, b, c];
      }

      const payout = Math.round(bet * mult);
      this.playerCash += payout;
      this.emitPlayerStats();
      this.performSave(true);

      let message = '未中奖，再接再厉！';
      if (mult >= 4) {
        this.audioManager.playMissionComplete();
        message = `超级头奖 4×！暴赚 $${payout}！`;
      } else if (mult >= 1.5) {
        this.audioManager.playPurchase();
        message = `霓虹连线 ${mult}×！赢得 $${payout}！`;
      } else if (mult > 0) {
        this.audioManager.playInteract();
        message = `保底回血返还 $${payout}。`;
      } else {
        this.audioManager.playBump(this.time.now);
      }

      gameEvents.emit(GAME_EVENT.ARCADE_RESULT, {
        bet,
        multiplier: mult,
        payout,
        reels,
        message,
      });
      return;
    }

    if (payload.serviceType === 'club_cocktail') {
      if (!deduct(ECONOMY_CONFIG.CLUB_COCKTAIL_COST)) return;
      this.playerHealth = Math.min(
        this.playerMaxHealth,
        this.playerHealth + ECONOMY_CONFIG.CLUB_COCKTAIL_HEAL
      );
      this.clubOverdriveTimer = Math.max(this.clubOverdriveTimer, ECONOMY_CONFIG.CLUB_OVERDRIVE_SEC);
      this.audioManager.playMissionComplete();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `饮用合成霓虹特调！生命 +${ECONOMY_CONFIG.CLUB_COCKTAIL_HEAL}，火力过载持续 ${ECONOMY_CONFIG.CLUB_OVERDRIVE_SEC} 秒！`
      );
      return;
    }

    if (payload.serviceType === 'club_bribe') {
      if (this.wantedManager.getWantedLevel() === 0) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '当前未被通缉，无需买通地下线人。');
        return;
      }
      if (!deduct(ECONOMY_CONFIG.CLUB_BRIBE_COST)) return;
      this.wantedManager.reduceWanted(1);
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '已买通脉冲夜店地下线人，通缉等级降低 1 级！');
      return;
    }

    if (payload.serviceType === 'respray') {
      if (this.wantedManager.getWantedLevel() === 0) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '当前未被通缉，无需隐匿喷漆。');
        return;
      }
      if (!deduct(ECONOMY_CONFIG.STEALTH_RESPRAY_COST)) return;
      this.wantedManager.clearWanted(false);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '隐匿喷漆完成，特区警队已丢失车辆追踪特征！');
      return;
    }

    if (payload.serviceType === 'paint') {
      const veh = this.vehicleManager.getVehicleById(payload.vehicleId);
      if (!veh) return;
      if (veh.getPaintColor() === payload.colorNum) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${veh.spec.name} 当前已是【${payload.colorName}】。`);
        return;
      }
      const cost = payload.colorNum === null ? 0 : ECONOMY_CONFIG.PAINT_JOB_COST;
      if (cost > 0 && !deduct(cost)) return;
      veh.setPaintColor(payload.colorNum);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      this.emitGarageModalRefresh(veh);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${veh.spec.name} 已更换【${payload.colorName}】喷漆！`);
      return;
    }

    if (payload.serviceType === 'repair') {
      const veh = this.vehicleManager.getVehicleById(payload.vehicleId);
      if (!veh) return;
      if (veh.getHealth() >= veh.getEffectiveMaxHealth()) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, '该载具耐久已满，无需修复。');
        return;
      }
      if (!deduct(ECONOMY_CONFIG.VEHICLE_REPAIR_COST)) return;
      veh.repairFull();
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      if (this.vehicleManager.getActiveVehicle()?.id === veh.id) {
        this.emitVehicleTelemetry(veh);
      }
      this.emitGarageModalRefresh(veh);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${veh.spec.name} 已修复至最佳状态！`);
      return;
    }

    if (payload.serviceType === 'upgrade') {
      const veh = this.vehicleManager.getVehicleById(payload.vehicleId);
      if (!veh) return;
      const trackCfg = VEHICLE_UPGRADE_CONFIG[payload.track];
      const currentLvl = veh.getUpgrades()[payload.track];
      if (currentLvl >= trackCfg.maxLevel) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${trackCfg.label}已升至最高等级！`);
        return;
      }
      const cost = trackCfg.costs[currentLvl];
      if (!deduct(cost)) return;
      veh.applyUpgrade(payload.track);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      if (this.vehicleManager.getActiveVehicle()?.id === veh.id) {
        this.emitVehicleTelemetry(veh);
      }
      this.emitGarageModalRefresh(veh);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `${veh.spec.name} 完成【${trackCfg.label} Lv.${currentLvl + 1}】改装！`
      );
      return;
    }

    if (payload.serviceType === 'buy_weapon') {
      const spec = WEAPON_SPECS[payload.weaponId];
      if (!spec) return;
      if (this.weaponManager.isOwned(payload.weaponId)) {
        this.weaponManager.equipWeapon(payload.weaponId, this.player, true);
        return;
      }
      if (!deduct(spec.buyCost)) return;
      this.weaponManager.unlockAndEquipWeapon(payload.weaponId, this.player);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, `已购买并装备【${spec.name}】！`);
      return;
    }

    if (payload.serviceType === 'equip_weapon') {
      const spec = WEAPON_SPECS[payload.weaponId];
      if (!spec) return;
      if (!this.weaponManager.isOwned(payload.weaponId)) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `尚未解锁【${spec.shortName}】。`);
        return;
      }
      this.weaponManager.equipWeapon(payload.weaponId, this.player, true);
      this.performSave(true);
      return;
    }

    if (payload.serviceType === 'buy_ammo') {
      const spec = WEAPON_SPECS[payload.weaponId];
      if (!spec || spec.infiniteAmmo) return;
      if (!this.weaponManager.isOwned(payload.weaponId)) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `请先解锁武器【${spec.shortName}】。`);
        return;
      }
      const maxAmmo = this.weaponManager.getEffectiveMaxAmmo(payload.weaponId);
      if (this.weaponManager.getAmmo(payload.weaponId) >= maxAmmo) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${spec.shortName} 备弹已满！`);
        return;
      }
      if (!deduct(spec.ammoPackCost)) return;
      this.weaponManager.addAmmo(payload.weaponId, spec.ammoPackSize);
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `已为【${spec.shortName}】补充 +${spec.ammoPackSize} 发高能弹药！`
      );
      return;
    }

    if (payload.serviceType === 'upgrade_weapon') {
      const spec = WEAPON_SPECS[payload.weaponId];
      const trackCfg = WEAPON_UPGRADE_CONFIG[payload.track];
      if (!spec || !trackCfg) return;
      if (!this.weaponManager.isOwned(payload.weaponId)) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `请先购买解锁【${spec.shortName}】再进行升级。`);
        return;
      }
      const currentLvl = this.weaponManager.getUpgrades(payload.weaponId)[payload.track];
      if (currentLvl >= trackCfg.maxLevel) {
        gameEvents.emit(GAME_EVENT.STATUS_TOAST, `${spec.shortName} 的【${trackCfg.label}】已达满级！`);
        return;
      }
      const cost = this.weaponManager.getUpgradeCost(payload.weaponId, payload.track);
      if (!deduct(cost)) return;
      const result = this.weaponManager.upgradeWeapon(payload.weaponId, payload.track);
      if (!result.upgraded) return;
      this.audioManager.playPurchase();
      this.emitPlayerStats();
      this.performSave(true);
      gameEvents.emit(
        GAME_EVENT.STATUS_TOAST,
        `【${spec.shortName}】完成 ${trackCfg.label} Lv.${result.newLevel} 强化！`
      );
    }
  }

  private cycleCarRadio(): void {
    const idx = this.audioManager.cycleRadioStation();
    const st = RADIO_STATIONS[idx] ?? RADIO_STATIONS[0];
    this.emitRadioStation();
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, `车载电台切换：${st.name}`);
  }

  private emitRadioStation(): void {
    const idx = this.audioManager.getRadioStationIndex();
    const st = RADIO_STATIONS[idx] ?? RADIO_STATIONS[0];
    gameEvents.emit(GAME_EVENT.RADIO_CHANGED, {
      index: st.index,
      name: st.name,
      genre: st.genre,
    });
  }

  private emitVehicleTelemetry(vehicle: ReturnType<VehicleManager['getActiveVehicle']>): void {
    if (!vehicle) {
      gameEvents.emit(GAME_EVENT.VEHICLE_TELEMETRY, {
        inVehicle: false,
        id: null,
        type: null,
        name: null,
        speedKmh: 0,
        health: 0,
        maxHealth: 0,
        nitro: 100,
        isBoosting: false,
      });
      return;
    }
    gameEvents.emit(GAME_EVENT.VEHICLE_TELEMETRY, {
      inVehicle: true,
      id: vehicle.id,
      type: vehicle.spec.type,
      name: vehicle.spec.name,
      speedKmh: vehicle.getSpeedKmh(),
      health: vehicle.getHealth(),
      maxHealth: vehicle.getEffectiveMaxHealth(),
      nitro: vehicle.getNitro(),
      isBoosting: vehicle.isNitroBoosting(),
      upgrades: vehicle.getUpgrades(),
    });
  }

  private emitTelemetry(force: boolean): void {
    const now = this.time.now;
    if (!force && now - this.lastTelemetryEmit < 60) return;
    this.lastTelemetryEmit = now;

    const activeVehicle = this.vehicleManager.getActiveVehicle();
    const pos = activeVehicle ? activeVehicle.getPosition() : this.player.getPosition();
    const facingDeg = activeVehicle ? activeVehicle.getRotationDeg() : this.player.getFacingDegrees();
    const districtName = this.districtManager.getDistrictNameAt(pos.x, pos.y, this.districtData);

    gameEvents.emit(GAME_EVENT.PLAYER_MOVED, {
      x: pos.x,
      y: pos.y,
      facingDeg,
      isMoving: true,
      district: districtName,
    });
  }

  private applyPlayerDamage(amount: number): void {
    const now = this.time.now;
    const invulnMs = this.playMode === 'horde' ? 600 : 1100;
    if (now - this.lastDamageAt < invulnMs || this.mode !== 'PLAYING') return;
    this.lastDamageAt = now;

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.audioManager.playCrash(now, 0.75);
    this.cameras.main.shake(130, 0.0045);
    this.cameras.main.flash(180, 255, 69, 69, false);

    if (this.playerHealth <= 0) {
      this.handlePlayerWasted();
      return;
    }

    this.emitPlayerStats();
  }

  private handlePlayerWasted(): void {
    this.hitstopTimer = 0;
    this.weaponManager.clearProjectiles();

    if (this.playMode === 'horde') {
      this.audioManager.playMissionFail();
      this.pickupManager.clearTemporaryDrops();
      this.player.resetPosition(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
      this.playerHealth = this.playerMaxHealth;
      this.playerCash = Math.max(800, this.playerCash);
      this.cameras.main.centerOn(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
      this.emitPlayerStats();
      this.emitTelemetry(true);
      this.hordeManager.start();
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '体能耗尽！已重新部署至霓虹广场第 1 波挑战！');
      return;
    }

    const clinicPos = WANTED_CONFIG.CLINIC_RESPAWN;
    if (this.vehicleManager.getActiveVehicle()) {
      this.vehicleManager.forceEject(this.player, clinicPos);
    } else {
      this.player.resetPosition(clinicPos.x, clinicPos.y);
    }

    this.wantedManager.clearWanted(false);
    if (this.missionManager.hasActiveMission()) {
      this.missionManager.failActiveMission('行动被特区警队中断');
    }
    this.playerHealth = this.playerMaxHealth;
    this.playerCash = Math.max(0, this.playerCash - WANTED_CONFIG.RESPAWN_PENALTY);

    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, CAMERA_CONFIG.LERP_X, CAMERA_CONFIG.LERP_Y);
    cam.setZoom(this.getTargetZoom(false));
    cam.centerOn(clinicPos.x, clinicPos.y);

    this.emitVehicleTelemetry(null);
    this.emitPlayerStats();
    this.emitTelemetry(true);
    this.performSave(true);
    gameEvents.emit(
      GAME_EVENT.STATUS_TOAST,
      `被特区警队拦截！已送往义体诊所急救，扣除医疗费 $${WANTED_CONFIG.RESPAWN_PENALTY}。`
    );
  }

  private performSave(silent: boolean): void {
    if (this.playMode !== 'sandbox') return;
    const activeVeh = this.vehicleManager.getActiveVehicle();
    const playerPos = activeVeh ? activeVeh.getPosition() : this.player.getPosition();
    const progress = this.missionManager.getProgress();

    const ok = this.saveManager.writeSave({
      version: 1,
      savedAt: Date.now(),
      district: this.districtManager.getDistrictNameAt(playerPos.x, playerPos.y, this.districtData),
      player: {
        x: playerPos.x,
        y: playerPos.y,
        health: this.playerHealth,
        cash: this.playerCash,
      },
      ownsSafehouse: this.ownsSafehouse,
      completedMissionIds: progress.completedIds,
      totalMissionEarnings: progress.totalEarnings,
      vehicles: this.vehicleManager.serializeAll(),
      weapons: this.weaponManager.serialize(),
      collectedChipIds: this.pickupManager.serializeCollectedChips(),
      settings: {
        muted: this.audioManager.isMuted(),
      },
    });

    if (ok) {
      this.emitSaveStatus();
    } else if (!silent) {
      gameEvents.emit(GAME_EVENT.STATUS_TOAST, '本地存储不可用，保存失败。');
    }
  }

  private loadFromSave(): void {
    const save = this.saveManager.loadSave();
    if (!save) {
      this.resetToNewGame();
      return;
    }

    this.wantedManager.clearWanted(false);
    this.vehicleManager.restoreAll(save.vehicles, this.player);
    this.weaponManager.restore(save.weapons, this.player);
    this.pickupManager.restoreCollectedChips(save.collectedChipIds);

    const spawnPos = this.collisionManager.isPointClearForEntity(save.player.x, save.player.y, 12)
      ? { x: save.player.x, y: save.player.y }
      : { x: WORLD_CONFIG.PLAYER_SPAWN.x, y: WORLD_CONFIG.PLAYER_SPAWN.y };
    this.player.resetPosition(spawnPos.x, spawnPos.y);

    this.ownsSafehouse = Boolean(save.ownsSafehouse);
    gameEvents.emit(GAME_EVENT.SAFEHOUSE_STATUS, this.ownsSafehouse);
    this.playerHealth = Phaser.Math.Clamp(Math.round(save.player.health), 20, this.playerMaxHealth);
    this.playerCash = Math.max(0, Math.round(save.player.cash));
    this.missionManager.restoreProgress(save.completedMissionIds, save.totalMissionEarnings);

    this.cameras.main.centerOn(spawnPos.x, spawnPos.y);
    this.emitVehicleTelemetry(null);
    this.emitPlayerStats();
    this.emitTelemetry(true);
    this.emitSaveStatus();
    gameEvents.emit(GAME_EVENT.STATUS_TOAST, '已读取本地存档，欢迎回到霓虹特区！');
  }

  private resetToNewGame(): void {
    this.wantedManager.clearWanted(false);
    this.vehicleManager.resetAllToInitial(this.player);
    this.weaponManager.resetToDefault(this.player);
    this.pickupManager.resetAllChips();
    this.player.resetPosition(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
    this.ownsSafehouse = false;
    gameEvents.emit(GAME_EVENT.SAFEHOUSE_STATUS, false);
    this.playerHealth = PLAYER_CONFIG.INITIAL_HEALTH;
    this.playerCash = PLAYER_CONFIG.INITIAL_CASH;
    this.missionManager.resetProgress();
    this.autoSaveTimer = 0;

    this.cameras.main.centerOn(WORLD_CONFIG.PLAYER_SPAWN.x, WORLD_CONFIG.PLAYER_SPAWN.y);
    this.emitVehicleTelemetry(null);
    this.emitPlayerStats();
    this.emitTelemetry(true);
  }

  private emitSaveStatus(): void {
    gameEvents.emit(GAME_EVENT.SAVE_STATUS_CHANGED, this.saveManager.getSummary());
  }

  private emitPlayerStats(): void {
    gameEvents.emit(GAME_EVENT.PLAYER_STATS, {
      health: this.playerHealth,
      maxHealth: this.playerMaxHealth,
      cash: this.playerCash,
    });
  }

  private cleanup(): void {
    this.audioManager.setRadioPlaying(false);
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.inputManager.destroy();
    this.interactivePropManager.destroy();
    this.weaponManager.destroy();
    this.pickupManager.destroy();
    this.hordeManager.destroy();
    this.raceManager.destroy();
    this.missionManager.destroy();
    this.policeManager.destroy();
    this.wantedManager.destroy();
    this.trafficManager.destroy();
    this.npcManager.destroy();
    this.vehicleManager.destroy();
    this.collisionManager.destroy();
    this.worldManager.destroy();
    this.player.destroy();
  }
}
