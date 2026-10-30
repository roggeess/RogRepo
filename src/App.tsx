import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Home from './components/Home';
import SightWords from './components/SightWords';
import Canvas from './components/Canvas';
import { AppState } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');

  return (
    <div className="min-h-screen w-full font-sans select-none">
      <AnimatePresence mode="wait">
        {appState === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Home onModuleSelect={setAppState} />
          </motion.div>
        )}

        {appState === 'sight-words' && (
          <motion.div
            key="sight-words"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <SightWords onBack={() => setAppState('home')} />
          </motion.div>
        )}

        {appState === 'canvas' && (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          >
            <Canvas onBack={() => setAppState('home')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

