import { GameContainer } from './app/GameContainer';
import { GameHUD } from './components/GameHUD';
import { MapModal } from './components/MapModal';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { ServiceModal } from './components/ServiceModal';
import { TitleOverlay } from './components/TitleOverlay';
import { useGameStore } from './store/gameStore';

export default function App() {
  const mode = useGameStore((s) => s.mode);

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
        </>
      )}

      {mode === 'PAUSED' && <PauseMenu />}
    </main>
  );
}
