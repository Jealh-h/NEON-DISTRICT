import { useEffect } from 'react';
import { GameContainer } from './app/GameContainer';
import { GameHUD } from './components/GameHUD';
import { HordePerkModal } from './components/HordePerkModal';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { ServiceModal } from './components/ServiceModal';
import { TacticalHubModal } from './components/TacticalHubModal';
import { TitleOverlay } from './components/TitleOverlay';
import { GAME_EVENT, gameEvents } from './game/ui/GameEvents';
import { useGameStore } from './store/gameStore';

export default function App() {
  const mode = useGameStore((s) => s.mode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const state = useGameStore.getState();
      if (state.mode !== 'PLAYING') return;

      if (state.serviceModal || state.hordePerkOffer) return;

      if (e.code === 'Escape' && state.activeHubTab !== null) {
        e.preventDefault();
        state.closeHub();
        return;
      }

      if (e.code === 'KeyM') {
        e.preventDefault();
        state.toggleHubTab('map');
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        state.toggleHubTab('missions');
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        state.toggleHubTab('character');
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        state.toggleHubTab('armory');
      } else if (e.code === 'KeyK') {
        if (state.playMode === 'sandbox') {
          e.preventDefault();
          state.toggleHubTab('craft');
        }
      } else if (e.code === 'KeyH') {
        if (state.activeHubTab === null) {
          gameEvents.emit(GAME_EVENT.TRIGGER_HACK_JAM);
        }
      } else if (e.code === 'KeyV') {
        if (state.activeHubTab === null) {
          state.toggleHudCompact();
        }
      } else if (e.code === 'KeyT') {
        if (state.activeHubTab === null) {
          gameEvents.emit(GAME_EVENT.CYCLE_WEATHER);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#080D18]">
      <GameContainer />

      {mode === 'TITLE' && <TitleOverlay />}

      {mode === 'PLAYING' && (
        <>
          <GameHUD />
          <MobileControls />
          <ServiceModal />
          <HordePerkModal />
        </>
      )}

      {mode === 'PAUSED' && <PauseMenu />}

      <TacticalHubModal />
    </main>
  );
}
