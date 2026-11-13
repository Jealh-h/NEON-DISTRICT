import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
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
  const vehicleNitro = useGameStore((s) => s.vehicleNitro);
  const nearbyLandmark = useGameStore((s) => s.nearbyLandmark);
  const nearbyNpc = useGameStore((s) => s.nearbyNpc);
  const nearbyVehicle = useGameStore((s) => s.nearbyVehicle);
  const weapon = useGameStore((s) => s.weapon);

  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const joystickPointerId = useRef<number | null>(null);

  const fireBaseRef = useRef<HTMLDivElement | null>(null);
  const [fireKnobOffset, setFireKnobOffset] = useState({ x: 0, y: 0 });
  const [isFiringStick, setIsFiringStick] = useState(false);
  const firePointerId = useRef<number | null>(null);

  const [steerLeft, setSteerLeft] = useState(false);
  const [steerRight, setSteerRight] = useState(false);
  const [throttleDown, setThrottleDown] = useState(false);
  const [brakeDown, setBrakeDown] = useState(false);
  const [nitroDown, setNitroDown] = useState(false);

  useEffect(() => {
    setKnobOffset({ x: 0, y: 0 });
    joystickPointerId.current = null;
    setFireKnobOffset({ x: 0, y: 0 });
    setIsFiringStick(false);
    firePointerId.current = null;
    setSteerLeft(false);
    setSteerRight(false);
    setThrottleDown(false);
    setBrakeDown(false);
    setNitroDown(false);
    gameEvents.emit(GAME_EVENT.JOYSTICK_MOVE, { x: 0, y: 0 });
    gameEvents.emit(GAME_EVENT.AIM_FIRE, { x: 0, y: 0, firing: false });
    gameEvents.emit(GAME_EVENT.DRIVING_INPUT, { throttle: 0, brake: 0, steer: 0, nitro: false });
  }, [inVehicle, visible]);

  useEffect(() => {
    if (!inVehicle) return;
    const steer = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);
    gameEvents.emit(GAME_EVENT.DRIVING_INPUT, {
      throttle: throttleDown ? 1 : 0,
      brake: brakeDown ? 1 : 0,
      steer,
      nitro: nitroDown,
    });
  }, [inVehicle, steerLeft, steerRight, throttleDown, brakeDown, nitroDown]);

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

    setKnobOffset({ x: dx, y: dy });
    gameEvents.emit(GAME_EVENT.JOYSTICK_MOVE, {
      x: dx / maxRadius,
      y: dy / maxRadius,
    });
  };

  const resetStick = () => {
    joystickPointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    gameEvents.emit(GAME_EVENT.JOYSTICK_MOVE, { x: 0, y: 0 });
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
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between p-4 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setSteerLeft(true);
            }}
            onPointerUp={() => setSteerLeft(false)}
            onPointerCancel={() => setSteerLeft(false)}
            aria-label="左转"
            className={`flex h-14 w-16 touch-none items-center justify-center border-2 transition-colors ${
              steerLeft
                ? 'border-[#00F5FF] bg-[#00F5FF]/30 text-[#00F5FF]'
                : 'border-[#00F5FF]/55 bg-[#080D18]/85 text-slate-200'
            }`}
          >
            <ChevronLeft className="h-7 w-7" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setSteerRight(true);
            }}
            onPointerUp={() => setSteerRight(false)}
            onPointerCancel={() => setSteerRight(false)}
            aria-label="右转"
            className={`flex h-14 w-16 touch-none items-center justify-center border-2 transition-colors ${
              steerRight
                ? 'border-[#00F5FF] bg-[#00F5FF]/30 text-[#00F5FF]'
                : 'border-[#00F5FF]/55 bg-[#080D18]/85 text-slate-200'
            }`}
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2">
            {nearbyLandmark && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  gameEvents.emit(GAME_EVENT.TRIGGER_INTERACT);
                }}
                className="flex h-11 min-w-[84px] touch-none items-center justify-center border-2 border-[#00F5FF] bg-[#080D18]/90 px-3 text-xs font-bold tracking-wider text-[#00F5FF] active:bg-[#00F5FF] active:text-[#080D18]"
              >
                改装车库
              </button>
            )}

            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setNitroDown(true);
              }}
              onPointerUp={() => setNitroDown(false)}
              onPointerCancel={() => setNitroDown(false)}
              className={`flex h-11 min-w-[80px] touch-none items-center justify-center gap-1 border-2 px-3 text-xs font-bold tracking-wider transition-colors ${
                nitroDown
                  ? 'border-[#FFD166] bg-[#FFD166] text-[#080D18]'
                  : 'border-[#FFD166]/80 bg-[#080D18]/90 text-[#FFD166]'
              }`}
              aria-label="氮气加速"
            >
              <Zap className="h-3.5 w-3.5" />
              氮气 {vehicleNitro}%
            </button>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                gameEvents.emit(GAME_EVENT.TRIGGER_ENTER_EXIT);
              }}
              className="flex h-11 min-w-[68px] touch-none items-center justify-center border-2 border-[#FF2E88]/80 bg-[#080D18]/90 px-3 text-xs font-bold tracking-wider text-[#FF2E88] active:bg-[#FF2E88] active:text-[#080D18]"
            >
              下车
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setBrakeDown(true);
              }}
              onPointerUp={() => setBrakeDown(false)}
              onPointerCancel={() => setBrakeDown(false)}
              className={`flex h-14 w-16 touch-none items-center justify-center border-2 text-xs font-bold transition-colors ${
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
                setThrottleDown(true);
              }}
              onPointerUp={() => setThrottleDown(false)}
              onPointerCancel={() => setThrottleDown(false)}
              className={`flex h-14 w-20 touch-none items-center justify-center border-2 text-xs font-bold transition-colors ${
                throttleDown
                  ? 'border-[#00F5FF] bg-[#00F5FF]/35 text-[#00F5FF]'
                  : 'border-[#00F5FF]/65 bg-[#080D18]/85 text-[#00F5FF]'
              }`}
            >
              油门
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canInteract = Boolean(nearbyNpc || nearbyLandmark);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between p-4 sm:p-5">
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
        className="pointer-events-auto relative flex h-28 w-28 touch-none items-center justify-center rounded-full border-2 border-[#00F5FF]/55 bg-[#080D18]/80"
        aria-label="移动摇杆"
      >
        <div
          className="h-12 w-12 rounded-full border-2 border-[#00F5FF] bg-[#00F5FF]/25"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        />
      </div>

      <div className="pointer-events-auto flex items-end gap-3">
        <div className="flex flex-col items-end gap-2">
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
              军械补给
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
          className={`relative flex h-28 w-28 touch-none items-center justify-center rounded-full border-2 bg-[#080D18]/85 transition-colors ${
            isFiringStick ? 'border-[#FF2E88]' : 'border-[#FF2E88]/60'
          }`}
          aria-label="瞄准与开火摇杆"
        >
          <span className="pointer-events-none absolute top-2 text-[9px] font-bold tracking-widest text-[#FF2E88]/80">
            开火
          </span>
          <div
            className={`h-12 w-12 rounded-full border-2 ${
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
