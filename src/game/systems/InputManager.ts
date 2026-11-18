import Phaser from 'phaser';
import { AimFirePayload, DrivingInputPayload } from '../ui/GameEvents';

export interface MovementVector {
  x: number;
  y: number;
}

export interface DrivingControlsState {
  driveX: number;
  driveY: number;
  handbrake: boolean;
  nitro: boolean;
}

export interface FireInputState {
  firing: boolean;
  aiming: boolean;
  aimAngleRad: number;
}

export class InputManager {
  private scene: Phaser.Scene;
  private keys: {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    interact: Phaser.Input.Keyboard.Key;
    enterExit: Phaser.Input.Keyboard.Key;
    fire: Phaser.Input.Keyboard.Key;
    switchWeapon: Phaser.Input.Keyboard.Key;
    slot1: Phaser.Input.Keyboard.Key;
    slot2: Phaser.Input.Keyboard.Key;
    slot3: Phaser.Input.Keyboard.Key;
    slot4: Phaser.Input.Keyboard.Key;
    slot5: Phaser.Input.Keyboard.Key;
    slot6: Phaser.Input.Keyboard.Key;
    slot7: Phaser.Input.Keyboard.Key;
    handbrake: Phaser.Input.Keyboard.Key;
    nitro: Phaser.Input.Keyboard.Key;
    radio: Phaser.Input.Keyboard.Key;
    quickArmory: Phaser.Input.Keyboard.Key;
    map: Phaser.Input.Keyboard.Key;
    pause: Phaser.Input.Keyboard.Key;
  } | null = null;

  private joystickVector: MovementVector = { x: 0, y: 0 };
  private aimFireStick: AimFirePayload = { x: 0, y: 0, firing: false };
  private virtualDriving: DrivingInputPayload = { driveX: 0, driveY: 0, nitro: false, handbrake: false };
  private virtualInteractQueued = false;
  private virtualEnterExitQueued = false;
  private virtualSwitchWeaponQueued = false;
  private virtualSpecialQueued = false;

  private canvasPointerDown = false;
  private blurHandler: () => void;
  private visibilityHandler: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    if (scene.input.keyboard) {
      this.keys = {
        w: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        interact: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        enterExit: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
        fire: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
        switchWeapon: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        slot1: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        slot2: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        slot3: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
        slot4: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
        slot5: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE),
        slot6: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SIX),
        slot7: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SEVEN),
        handbrake: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        nitro: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
        radio: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
        quickArmory: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B),
        map: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
        pause: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      };
    }

    // Track left mouse button on Phaser canvas for desktop twin-stick aiming & firing
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !pointer.wasTouch) {
        this.canvasPointerDown = true;
      }
    });
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) {
        this.canvasPointerDown = false;
      }
    });

    this.blurHandler = () => this.resetAllHeldInputs();
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.resetAllHeldInputs();
      }
    };

    window.addEventListener('blur', this.blurHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  public setVirtualJoystick(x: number, y: number): void {
    this.joystickVector.x = Phaser.Math.Clamp(x, -1, 1);
    this.joystickVector.y = Phaser.Math.Clamp(y, -1, 1);
  }

  public setVirtualAimFire(payload: AimFirePayload): void {
    this.aimFireStick.x = Phaser.Math.Clamp(payload.x, -1, 1);
    this.aimFireStick.y = Phaser.Math.Clamp(payload.y, -1, 1);
    this.aimFireStick.firing = payload.firing;
  }

  public queueVirtualSwitchWeapon(): void {
    this.virtualSwitchWeaponQueued = true;
  }

  public setVirtualDriving(payload: DrivingInputPayload): void {
    this.virtualDriving.driveX = Phaser.Math.Clamp(payload.driveX, -1, 1);
    this.virtualDriving.driveY = Phaser.Math.Clamp(payload.driveY, -1, 1);
    this.virtualDriving.nitro = Boolean(payload.nitro);
    this.virtualDriving.handbrake = Boolean(payload.handbrake);
  }

  public queueVirtualInteract(): void {
    this.virtualInteractQueued = true;
  }

  public queueVirtualEnterExit(): void {
    this.virtualEnterExitQueued = true;
  }

  public queueVirtualSpecial(): void {
    this.virtualSpecialQueued = true;
  }

  public getMovementVector(): MovementVector {
    let vx = 0;
    let vy = 0;

    if (this.keys) {
      if (this.keys.a.isDown || this.keys.left.isDown) vx -= 1;
      if (this.keys.d.isDown || this.keys.right.isDown) vx += 1;
      if (this.keys.w.isDown || this.keys.up.isDown) vy -= 1;
      if (this.keys.s.isDown || this.keys.down.isDown) vy += 1;
    }

    if (vx === 0 && vy === 0 && (Math.abs(this.joystickVector.x) > 0.12 || Math.abs(this.joystickVector.y) > 0.12)) {
      vx = this.joystickVector.x;
      vy = this.joystickVector.y;
    }

    const length = Math.hypot(vx, vy);
    if (length > 1) {
      vx /= length;
      vy /= length;
    } else if (vx !== 0 && vy !== 0 && length > 0 && length !== 1) {
      if (Math.abs(vx) === 1 && Math.abs(vy) === 1) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
      }
    }

    return { x: vx, y: vy };
  }

  public getFireInput(
    playerPos: { x: number; y: number },
    currentFacingRad: number
  ): FireInputState {
    // 1. Mobile twin-stick aim & fire takes priority when active
    const stickMag = Math.hypot(this.aimFireStick.x, this.aimFireStick.y);
    if (stickMag > 0.16) {
      const stickAngle = Math.atan2(this.aimFireStick.y, this.aimFireStick.x);
      return {
        firing: this.aimFireStick.firing,
        aiming: true,
        aimAngleRad: stickAngle,
      };
    }

    // 2. Desktop mouse aim & fire on canvas
    const pointer = this.scene.input.activePointer;
    if (this.canvasPointerDown && pointer && pointer.leftButtonDown() && !pointer.wasTouch) {
      const cam = this.scene.cameras.main;
      const worldPt = cam.getWorldPoint(pointer.x, pointer.y);
      const dx = worldPt.x - playerPos.x;
      const dy = worldPt.y - playerPos.y;
      const angle = Math.hypot(dx, dy) > 4 ? Math.atan2(dy, dx) : currentFacingRad;
      return {
        firing: true,
        aiming: true,
        aimAngleRad: angle,
      };
    } else if (!pointer?.leftButtonDown()) {
      this.canvasPointerDown = false;
    }

    // 3. Keyboard J fire along player facing
    if (this.keys && this.keys.fire.isDown) {
      return {
        firing: true,
        aiming: true,
        aimAngleRad: currentFacingRad,
      };
    }

    return {
      firing: false,
      aiming: false,
      aimAngleRad: currentFacingRad,
    };
  }

  public getAimAngleAlways(originPos: { x: number; y: number }, fallbackRad: number): number {
    const stickMag = Math.hypot(this.aimFireStick.x, this.aimFireStick.y);
    if (stickMag > 0.16) {
      return Math.atan2(this.aimFireStick.y, this.aimFireStick.x);
    }
    const pointer = this.scene.input.activePointer;
    if (pointer && !pointer.wasTouch && (pointer.x !== 0 || pointer.y !== 0)) {
      const cam = this.scene.cameras.main;
      const worldPt = cam.getWorldPoint(pointer.x, pointer.y);
      const dx = worldPt.x - originPos.x;
      const dy = worldPt.y - originPos.y;
      if (Math.hypot(dx, dy) > 8) {
        return Math.atan2(dy, dx);
      }
    }
    return fallbackRad;
  }

  public consumeSwitchWeaponSlot(): 'next' | number | null {
    if (this.virtualSwitchWeaponQueued) {
      this.virtualSwitchWeaponQueued = false;
      return 'next';
    }
    if (this.keys) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.switchWeapon)) return 'next';
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot1)) return 0;
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot2)) return 1;
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot3)) return 2;
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot4)) return 3;
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot5)) return 4;
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot6)) return 5;
      if (Phaser.Input.Keyboard.JustDown(this.keys.slot7)) return 6;
    }
    return null;
  }

  public getDrivingControls(): DrivingControlsState {
    let driveX = 0;
    let driveY = 0;
    let handbrake = false;
    let nitro = false;

    if (this.keys) {
      if (this.keys.a.isDown || this.keys.left.isDown) driveX -= 1;
      if (this.keys.d.isDown || this.keys.right.isDown) driveX += 1;
      if (this.keys.w.isDown || this.keys.up.isDown) driveY -= 1;
      if (this.keys.s.isDown || this.keys.down.isDown) driveY += 1;
      if (this.keys.handbrake.isDown) handbrake = true;
      if (this.keys.nitro.isDown) nitro = true;
    }

    if (
      driveX === 0 &&
      driveY === 0 &&
      (Math.abs(this.virtualDriving.driveX) > 0.1 || Math.abs(this.virtualDriving.driveY) > 0.1)
    ) {
      driveX = this.virtualDriving.driveX;
      driveY = this.virtualDriving.driveY;
    }

    const len = Math.hypot(driveX, driveY);
    if (len > 1) {
      driveX /= len;
      driveY /= len;
    }

    if (!handbrake && this.virtualDriving.handbrake) {
      handbrake = true;
    }
    if (!nitro && this.virtualDriving.nitro) {
      nitro = true;
    }

    return { driveX, driveY, handbrake, nitro };
  }

  public consumeInteractJustPressed(): boolean {
    let pressed = false;
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      pressed = true;
    }
    if (this.virtualInteractQueued) {
      this.virtualInteractQueued = false;
      pressed = true;
    }
    return pressed;
  }

  public consumeEnterExitJustPressed(): boolean {
    let pressed = false;
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.enterExit)) {
      pressed = true;
    }
    if (this.virtualEnterExitQueued) {
      this.virtualEnterExitQueued = false;
      pressed = true;
    }
    return pressed;
  }

  public consumeRadioJustPressed(): boolean {
    return Boolean(this.keys && Phaser.Input.Keyboard.JustDown(this.keys.radio));
  }

  public consumeQuickArmoryJustPressed(): boolean {
    return Boolean(this.keys && Phaser.Input.Keyboard.JustDown(this.keys.quickArmory));
  }

  public consumeMapJustPressed(): boolean {
    return Boolean(this.keys && Phaser.Input.Keyboard.JustDown(this.keys.map));
  }

  public consumePauseJustPressed(): boolean {
    return Boolean(this.keys && Phaser.Input.Keyboard.JustDown(this.keys.pause));
  }

  public consumeSpecialJustPressed(): boolean {
    let pressed = false;
    if (this.keys && Phaser.Input.Keyboard.JustDown(this.keys.handbrake)) {
      pressed = true;
    }
    if (this.virtualSpecialQueued) {
      this.virtualSpecialQueued = false;
      pressed = true;
    }
    return pressed;
  }

  public resetAllHeldInputs(): void {
    this.joystickVector.x = 0;
    this.joystickVector.y = 0;
    this.aimFireStick = { x: 0, y: 0, firing: false };
    this.canvasPointerDown = false;
    this.virtualDriving = { driveX: 0, driveY: 0, nitro: false, handbrake: false };
    this.virtualInteractQueued = false;
    this.virtualEnterExitQueued = false;
    this.virtualSwitchWeaponQueued = false;
    this.virtualSpecialQueued = false;

    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.resetKeys();
    }
  }

  public destroy(): void {
    window.removeEventListener('blur', this.blurHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }
}
