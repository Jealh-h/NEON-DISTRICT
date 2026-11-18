import { useEffect, useRef, useState } from 'react';
import { Radio, Zap } from 'lucide-react';
import { GAME_EVENT, gameEvents } from '../game/ui/GameEvents';
import { useGameStore } from '../store/gameStore';

function useShouldShowTouchControls(): boolean {
  const mode = useGameStore((s) => s.touchControlsMode);
  const [autoTouch, setAutoTouch] = useState(false);

  useEffect(() => {
    const evaluate = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const compact = window.innerWidth < 960;
      setAutoTouch(coarse || (hasTouch && compact) || window.innerWidth < 768);
    };
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return autoTouch;
}

export function MobileControls() {
  const visible = useShouldShowTouchControls();
  const playMode = useGameStore((s) => s.playMode);
  const inVehicle = useGameStore((s) => s.inVehicle);
  const vehicleType = useGameStore((s) => s.vehicleType);
  const vehicleWeaponKind = useGameStore((s) => s.vehicleWeaponKind);
  const vehicleNitro = useGameStore((s) => s.vehicleNitro);
  const horde = useGameStore((s) => s.horde);
  const nearbyLandmark = useGameStore((s) => s.nearbyLandmark);
  const nearbyProp = useGameStore((s) => s.nearbyProp);
  const nearbyNpc = useGameStore((s) => s.nearbyNpc);
  const nearbyVehicle = useGameStore((s) => s.nearbyVehicle);
  const radioStation = useGameStore((s) => s.radioStation);
  const weapon = useGameStore((s) => s.weapon);

  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const joystickPointerId = useRef<number | null>(null);
  const driveStickRef = useRef({ x: 0, y: 0 });

  const fireBaseRef = useRef<HTMLDivElement | null>(null);
  const [fireKnobOffset, setFireKnobOffset] = useState({ x: 0, y: 0 });
  const [isFiringStick, setIsFiringStick] = useState(false);
  const firePointerId = useRef<number | null>(null);

  const [brakeDown, setBrakeDown] = useState(false);
  const [nitroDown, setNitroDown] = useState(false);

  useEffect(() => {
    setKnobOffset({ x: 0, y: 0 });
    joystickPointerId.current = null;
    driveStickRef.current = { x: 0, y: 0 };
    setFireKnobOffset({ x: 0, y: 0 });
    setIsFiringStick(false);
    firePointerId.current = null;
    setBrakeDown(false);
    setNitroDown(false);
    gameEvents.emit(GAME_EVENT.JOYSTICK_MOVE, { x: 0, y: 0 });
    gameEvents.emit(GAME_EVENT.AIM_FIRE, { x: 0, y: 0, firing: false });
    gameEvents.emit(GAME_EVENT.DRIVING_INPUT, {
      driveX: 0,
      driveY: 0,
      handbrake: false,
      nitro: false,
    });
  }, [inVehicle, visible]);

  useEffect(() => {
    if (!inVehicle) return;
    gameEvents.emit(GAME_EVENT.DRIVING_INPUT, {
      driveX: driveStickRef.current.x,
      driveY: driveStickRef.current.y,
      handbrake: brakeDown,
      nitro: nitroDown,
    });
  }, [inVehicle, brakeDown, nitroDown]);

  if (!visible) return null;

  const maxRadius = 36;

  const updateStick = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    const nx = dx / maxRadius;
    const ny = dy / maxRadius;
    setKnobOffset({ x: dx, y: dy });

    if (inVehicle) {
      driveStickRef.current = { x: nx, y: ny };
      gameEvents.emit(GAME_EVENT.DRIVING_INPUT, {
        driveX: nx,
        driveY: ny,
        handbrake: brakeDown,
        nitro: nitroDown,
      });
    } else {
      gameEvents.emit(GAME_EVENT.JOYSTICK_MOVE, { x: nx, y: ny });
    }
  };

  const resetStick = () => {
    joystickPointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    driveStickRef.current = { x: 0, y: 0 };
    if (inVehicle) {
      gameEvents.emit(GAME_EVENT.DRIVING_INPUT, {
        driveX: 0,
        driveY: 0,
        handbrake: brakeDown,
        nitro: nitroDown,
      });
    } else {
      gameEvents.emit(GAME_EVENT.JOYSTICK_MOVE, { x: 0, y: 0 });
    }
  };

  const updateFireStick = (clientX: number, clientY: number) => {
    const el = fireBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    const firing = Math.hypot(dx, dy) / maxRadius > 0.22;
    setFireKnobOffset({ x: dx, y: dy });
    setIsFiringStick(firing);
    gameEvents.emit(GAME_EVENT.AIM_FIRE, {
      x: dx / maxRadius,
      y: dy / maxRadius,
      firing,
    });
  };

  const resetFireStick = () => {
    firePointerId.current = null;
    setFireKnobOffset({ x: 0, y: 0 });
    setIsFiringStick(false);
    gameEvents.emit(GAME_EVENT.AIM_FIRE, { x: 0, y: 0, firing: false });
  };

  if (inVehicle) {
    const isPoliceVehicle = vehicleType === 'cruiser' || vehicleType === 'swat';
    const fireLabel =
      vehicleWeaponKind === 'tank_cannon'
        ? '主炮'
        : vehicleWeaponKind === 'autocannon'
          ? '机炮'
          : '开火';

    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between p-3 sm:p-4">
        <div
          ref={baseRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            joystickPointerId.current = e.pointerId;
            updateStick(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (joystickPointerId.current === e.pointerId) {
              updateStick(e.clientX, e.clientY);
            }
          }}
          onPointerUp={(e) => {
            if (joystickPointerId.current === e.pointerId) {
              resetStick();
            }
          }}
          onPointerCancel={resetStick}
          className="pointer-events-auto relative flex h-24 w-24 touch-none items-center justify-center rounded-full border-2 border-[#FFD166]/60 bg-[#080D18]/55 sm:h-26 sm:w-26"
          aria-label="全向驾驶摇杆"
        >
          <span className="pointer-events-none absolute top-1.5 text-[9px] font-bold tracking-widest text-[#FFD166]/85">
            驾驶
          </span>
          <div
            className="h-11 w-11 rounded-full border-2 border-[#FFD166] bg-[#FFD166]/22"
            style={{
              transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
            }}
          />
        </div>

        <div className="pointer-events-auto flex items-end gap-2.5">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              {nearbyLandmark && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    gameEvents.emit(GAME_EVENT.TRIGGER_INTERACT);
                  }}
                  className="flex h-11 min-w-[78px] touch-none items-center justify-center border-2 border-[#00F5FF] bg-[#080D18]/90 px-2.5 text-xs font-bold tracking-wider text-[#00F5FF] active:bg-[#00F5FF] active:text-[#080D18]"
                >
                  改装车库
                </button>
              )}

              {!nearbyLandmark && isPoliceVehicle && playMode === 'sandbox' && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    gameEvents.emit(GAME_EVENT.TRIGGER_INTERACT);
                  }}
                  className="flex h-11 min-w-[78px] touch-none items-center justify-center border-2 border-[#38BDF8] bg-[#080D18]/90 px-2.5 text-xs font-bold tracking-wider text-[#38BDF8] active:bg-[#38BDF8] active:text-[#080D18]"
                >
                  治安追缉
                </button>
              )}

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  gameEvents.emit(GAME_EVENT.CYCLE_RADIO);
                }}
                aria-label="切换车载电台"
                className={`flex h-11 min-w-[58px] touch-none items-center justify-center gap-1 border-2 px-2 text-xs font-bold tracking-wider transition-colors ${
                  radioStation.index > 0
                    ? 'border-[#C000FF] bg-[#C000FF]/20 text-[#E08BFF]'
                    : 'border-slate-700 bg-[#080D18]/90 text-slate-400'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                电台
              </button>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  gameEvents.emit(GAME_EVENT.TRIGGER_ENTER_EXIT);
                }}
                className="flex h-11 min-w-[58px] touch-none items-center justify-center border-2 border-[#FF2E88]/80 bg-[#080D18]/90 px-2.5 text-xs font-bold tracking-wider text-[#FF2E88] active:bg-[#FF2E88] active:text-[#080D18]"
              >
                下车
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setBrakeDown(true);
                }}
                onPointerUp={() => setBrakeDown(false)}
                onPointerCancel={() => setBrakeDown(false)}
                className={`flex h-12 min-w-[66px] touch-none items-center justify-center border-2 px-2.5 text-xs font-bold transition-colors ${
                  brakeDown
                    ? 'border-[#FF4545] bg-[#FF4545]/30 text-[#FF4545]'
                    : 'border-[#FF4545]/60 bg-[#080D18]/85 text-slate-200'
                }`}
              >
                刹车
              </button>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setNitroDown(true);
                }}
                onPointerUp={() => setNitroDown(false)}
                onPointerCancel={() => setNitroDown(false)}
                className={`flex h-12 min-w-[92px] touch-none items-center justify-center gap-1 border-2 px-3 text-xs font-bold tracking-wider transition-colors ${
                  nitroDown
                    ? 'border-[#FFD166] bg-[#FFD166] text-[#080D18]'
                    : 'border-[#FFD166]/85 bg-[#080D18]/90 text-[#FFD166]'
                }`}
                aria-label="氮气加速"
              >
                <Zap className="h-3.5 w-3.5" />
                氮气 {vehicleNitro}%
              </button>
            </div>
          </div>

          <div
            ref={fireBaseRef}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              firePointerId.current = e.pointerId;
              updateFireStick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (firePointerId.current === e.pointerId) {
                updateFireStick(e.clientX, e.clientY);
              }
            }}
            onPointerUp={(e) => {
              if (firePointerId.current === e.pointerId) {
                resetFireStick();
              }
            }}
            onPointerCancel={resetFireStick}
            className={`relative flex h-24 w-24 touch-none items-center justify-center rounded-full border-2 bg-[#080D18]/85 transition-colors sm:h-28 sm:w-28 ${
              isFiringStick ? 'border-[#FF2E88]' : 'border-[#FF2E88]/60'
            }`}
            aria-label="车载瞄准与开火摇杆"
          >
            <span className="pointer-events-none absolute top-1.5 text-[9px] font-bold tracking-widest text-[#FF2E88]/90">
              {fireLabel}
            </span>
            <div
              className={`h-10 w-10 rounded-full border-2 sm:h-12 sm:w-12 ${
                isFiringStick
                  ? 'border-[#FFD166] bg-[#FF2E88]/45'
                  : 'border-[#FF2E88] bg-[#FF2E88]/25'
              }`}
              style={{
                transform: `translate(${fireKnobOffset.x}px, ${fireKnobOffset.y}px)`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }


  const canInteract = Boolean(nearbyProp || nearbyNpc || nearbyLandmark);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between p-3 sm:p-4">
      <div
        ref={baseRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          joystickPointerId.current = e.pointerId;
          updateStick(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (joystickPointerId.current === e.pointerId) {
            updateStick(e.clientX, e.clientY);
          }
        }}
        onPointerUp={(e) => {
          if (joystickPointerId.current === e.pointerId) {
            resetStick();
          }
        }}
        onPointerCancel={resetStick}
        className="pointer-events-auto relative flex h-24 w-24 touch-none items-center justify-center rounded-full border-2 border-[#00F5FF]/55 bg-[#080D18]/55 sm:h-26 sm:w-26"
        aria-label="移动摇杆"
      >
        <div
          className="h-11 w-11 rounded-full border-2 border-[#00F5FF] bg-[#00F5FF]/22"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      <div className="pointer-events-auto flex items-end gap-3">
        <div className="flex flex-col items-end gap-2">
          {playMode === 'horde' && horde.mech?.active && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                gameEvents.emit(GAME_EVENT.TRIGGER_MECH_ABILITY);
              }}
              className={`flex h-11 min-w-[92px] touch-none items-center justify-center border-2 px-2.5 text-[11px] font-bold tracking-wider transition-colors ${
                (horde.mech.abilityCooldownSec ?? 0) > 0
                  ? 'border-slate-700 bg-[#080D18]/90 text-slate-400'
                  : 'border-[#00F5FF] bg-[#00F5FF]/20 text-[#00F5FF] active:bg-[#00F5FF] active:text-[#080D18]'
              }`}
              aria-label="机甲技能"
            >
              {horde.mech.abilityLabel ?? '机甲技能'}
              {(horde.mech.abilityCooldownSec ?? 0) > 0
                ? ` (${horde.mech.abilityCooldownSec}s)`
                : ''}
            </button>
          )}

          {playMode === 'horde' && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                gameEvents.emit(GAME_EVENT.OPEN_QUICK_ARMORY);
              }}
              className="flex h-11 min-w-[82px] touch-none items-center justify-center border-2 border-[#FFD166]/80 bg-[#080D18]/90 px-2.5 text-[11px] font-bold tracking-wider text-[#FFD166] active:bg-[#FFD166] active:text-[#080D18]"
              aria-label="随身军械库"
            >
              军械/机甲
            </button>
          )}

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              gameEvents.emit(GAME_EVENT.SWITCH_WEAPON, 'next');
            }}
            className="flex h-11 min-w-[78px] touch-none items-center justify-center border-2 border-[#C000FF]/70 bg-[#080D18]/85 px-2.5 text-[11px] font-bold tracking-wider text-slate-100 active:bg-[#C000FF]/30"
            aria-label="切换武器"
          >
            {weapon.shortName}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                gameEvents.emit(GAME_EVENT.TRIGGER_INTERACT);
              }}
              className={`flex h-11 min-w-[58px] touch-none items-center justify-center border-2 px-2.5 text-xs font-bold transition-colors ${
                canInteract
                  ? 'border-[#FFD166] bg-[#FFD166]/25 text-[#FFD166]'
                  : 'border-slate-700 bg-[#080D18]/80 text-slate-400'
              }`}
              aria-label="交互"
            >
              交互
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                gameEvents.emit(GAME_EVENT.TRIGGER_ENTER_EXIT);
              }}
              className={`flex h-11 min-w-[58px] touch-none items-center justify-center border-2 px-2.5 text-xs font-bold transition-colors ${
                nearbyVehicle
                  ? 'border-[#00F5FF] bg-[#00F5FF]/25 text-[#00F5FF]'
                  : 'border-slate-700 bg-[#080D18]/80 text-slate-400'
              }`}
              aria-label="上车"
            >
              上车
            </button>
          </div>
        </div>

        {/* Twin-Stick Aim & Fire Joystick */}
        <div
          ref={fireBaseRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            firePointerId.current = e.pointerId;
            updateFireStick(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (firePointerId.current === e.pointerId) {
              updateFireStick(e.clientX, e.clientY);
            }
          }}
          onPointerUp={(e) => {
            if (firePointerId.current === e.pointerId) {
              resetFireStick();
            }
          }}
          onPointerCancel={resetFireStick}
          className={`relative flex h-24 w-24 touch-none items-center justify-center rounded-full border-2 bg-[#080D18]/58 transition-colors sm:h-26 sm:w-26 ${
            isFiringStick ? 'border-[#FF2E88]' : 'border-[#FF2E88]/60'
          }`}
          aria-label="瞄准与开火摇杆"
        >
          <span className="pointer-events-none absolute top-1.5 text-[9px] font-bold tracking-widest text-[#FF2E88]/80">
            开火
          </span>
          <div
            className={`h-11 w-11 rounded-full border-2 ${
              isFiringStick
                ? 'border-[#FFD166] bg-[#FF2E88]/40'
                : 'border-[#FF2E88] bg-[#FF2E88]/22'
            }`}
            style={{
              transform: `translate(${fireKnobOffset.x}px, ${fireKnobOffset.y}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
