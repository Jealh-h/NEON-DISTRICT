import { useEffect } from 'react';
import { GameContainer } from './app/GameContainer';
import { CharacterModal } from './components/CharacterModal';
import { GameHUD } from './components/GameHUD';
import { HordePerkModal } from './components/HordePerkModal';
import { MapModal } from './components/MapModal';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { ServiceModal } from './components/ServiceModal';
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

      if (e.code === 'KeyC') {
        if (!state.serviceModal && !state.hordePerkOffer) {
          state.toggleCharacterModal();
        }
      } else if (e.code === 'KeyH') {
        if (
          !state.serviceModal &&
          !state.showCharacterModal &&
          !state.hordePerkOffer &&
          !state.showMap
        ) {
          gameEvents.emit(GAME_EVENT.TRIGGER_HACK_JAM);
        }
      } else if (e.code === 'KeyV') {
        if (
          !state.serviceModal &&
          !state.showCharacterModal &&
          !state.hordePerkOffer &&
          !state.showMap
        ) {
          state.toggleHudCompact();
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
          <MapModal />
          <ServiceModal />
          <CharacterModal />
          <HordePerkModal />
        </>
      )}

      {mode === 'PAUSED' && <PauseMenu />}
    </main>
  );
}
