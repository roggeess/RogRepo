import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Volume2,
  RotateCcw,
  Trash2,
  PenTool,
} from 'lucide-react';
import { SIGHT_WORDS, BLUE_MARKER_COLOR, MARKER_SIZE } from '../types';
import { sounds, speakWord } from '../utils/audio';

interface SightWordsProps {
  onBack: () => void;
}

export default function SightWords({ onBack }: SightWordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [hasTraced, setHasTraced] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokeHistoryRef = useRef<ImageData[]>([]);

  const currentWord = SIGHT_WORDS[currentIndex];

  // Configure Retina canvas resolution
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  // Clear tracing when word changes
  const clearTracing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    strokeHistoryRef.current = [];
    setHasTraced(false);
  }, []);

  // Automatically clear canvas when navigating to another word
  useEffect(() => {
    clearTracing();
  }, [currentIndex, clearTracing]);

  // Set up ResizeObserver to ensure canvas size is always exact on tablet/iPad
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setupCanvas();

    const observer = new ResizeObserver(() => {
      setupCanvas();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [setupCanvas]);

  const nextWord = () => {
    sounds.playPop();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SIGHT_WORDS.length);
  };

  const prevWord = () => {
    sounds.playPop();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SIGHT_WORDS.length) % SIGHT_WORDS.length);
  };

  const handleListen = () => {
    sounds.playPop();
    speakWord(currentWord.word);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    strokeHistoryRef.current.push(snapshot);
    if (strokeHistoryRef.current.length > 25) {
      strokeHistoryRef.current.shift();
    }
  };

  // Pointer drawing with Blue Marker
  const startTracing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    saveState();
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = BLUE_MARKER_COLOR;
      ctx.lineWidth = MARKER_SIZE;
      ctx.fillStyle = BLUE_MARKER_COLOR;
      ctx.arc(coords.x, coords.y, MARKER_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
    setHasTraced(true);
  };

  const traceMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const lastPoint = lastPointRef.current;
    if (!ctx || !lastPoint) return;

    const currentPoint = getCanvasCoords(e);

    const midX = (lastPoint.x + currentPoint.x) / 2;
    const midY = (lastPoint.y + currentPoint.y) / 2;

    ctx.strokeStyle = BLUE_MARKER_COLOR;
    ctx.lineWidth = MARKER_SIZE;
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(midX, midY);
    lastPointRef.current = currentPoint;
  };

  const stopTracing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleManualClear = () => {
    sounds.playClear();
    clearTracing();
  };

  const undoTracing = () => {
    if (strokeHistoryRef.current.length === 0) return;
    sounds.playPop();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const previousSnapshot = strokeHistoryRef.current.pop();
    if (previousSnapshot) {
      ctx.putImageData(previousSnapshot, 0, 0);
    } else {
      clearTracing();
    }
    if (strokeHistoryRef.current.length === 0) {
      setHasTraced(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex flex-col p-4 md:p-6 select-none overflow-hidden justify-between">
      {/* Minimal Header */}
      <header className="flex items-center justify-between w-full max-w-4xl mx-auto flex-shrink-0 mb-3">
        <button
          onClick={onBack}
          className="p-3 md:p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Home"
        >
          <Home className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        <div className="px-5 py-2 bg-white rounded-2xl border border-slate-200 text-slate-700 font-display font-medium text-lg md:text-xl shadow-xs">
          {currentIndex + 1} / {SIGHT_WORDS.length}
        </div>

        <button
          onClick={handleListen}
          className="flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-display font-medium text-base md:text-lg shadow-sm transition-all cursor-pointer"
        >
          <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
          <span>Listen</span>
        </button>
      </header>

      {/* Main Content Area: Persistent Card and Persistent Canvas */}
      <main className="flex-1 flex items-center justify-center relative w-full max-w-4xl mx-auto min-h-0">
        {/* Previous Button */}
        <button
          onClick={prevWord}
          className="absolute -left-2 md:-left-6 z-20 p-3 md:p-4 bg-white text-slate-700 rounded-full shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Previous Word"
        >
          <ChevronLeft className="w-7 h-7 md:w-8 md:h-8" />
        </button>

        {/* Stable Main Card: Never destroyed during word changes */}
        <div className="bg-white rounded-3xl md:rounded-4xl shadow-sm border border-slate-200/90 h-full w-full flex flex-col overflow-hidden">
          {/* TOP: Word Presentation with Smooth Transition */}
          <div className="flex-1 flex items-center justify-center p-4 border-b border-slate-100 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentWord.word}
                initial={{ opacity: 0, y: direction * 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -direction * 15 }}
                transition={{ duration: 0.18 }}
                className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-slate-800 tracking-wider"
              >
                {currentWord.word}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* BOTTOM: Space to trace the letters in the words with lighter dotted highlight */}
          <div className="flex-1 flex flex-col p-3 md:p-5 bg-slate-50/60 min-h-0 relative">
            {/* Tracing Canvas Container with Dotted Highlight Letters */}
            <div
              ref={containerRef}
              className="relative flex-1 w-full bg-white rounded-2xl md:rounded-3xl border-2 border-slate-200 shadow-inner overflow-hidden select-none"
              style={{ touchAction: 'none' }}
            >
              {/* Subtle Handwriting Guide Lines */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-4 px-3 opacity-30">
                <div className="w-full border-b border-slate-400" />
                <div className="w-full border-b border-dashed border-slate-400" />
                <div className="w-full border-b border-slate-400" />
              </div>

              {/* Lighter highlight (dotted highlight) for every letter */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentWord.word}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="w-full h-full flex items-center justify-center gap-2 sm:gap-4 md:gap-6"
                  >
                    {currentWord.word.split('').map((letter, idx) => (
                      <div
                        key={idx}
                        className="relative flex-1 max-w-[120px] h-full flex items-center justify-center"
                      >
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 100 120"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          {/* Lighter highlight background */}
                          <text
                            x="50"
                            y="86"
                            textAnchor="middle"
                            fontFamily="Fredoka, sans-serif"
                            fontSize="80"
                            fontWeight="bold"
                            fill="rgba(226, 232, 240, 0.7)"
                            stroke="rgba(203, 213, 225, 0.4)"
                            strokeWidth="6"
                          >
                            {letter}
                          </text>

                          {/* Dotted highlight stroke */}
                          <text
                            x="50"
                            y="86"
                            textAnchor="middle"
                            fontFamily="Fredoka, sans-serif"
                            fontSize="80"
                            fontWeight="bold"
                            fill="transparent"
                            stroke="#94a3b8"
                            strokeWidth="3.5"
                            strokeDasharray="4 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            {letter}
                          </text>
                        </svg>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Persistent Blue Marker Canvas Overlay - Never unmounted */}
              <canvas
                ref={canvasRef}
                onPointerDown={startTracing}
                onPointerMove={traceMove}
                onPointerUp={stopTracing}
                onPointerCancel={stopTracing}
                className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
              />
            </div>

            {/* Minimal Tracing Actions: Blue Marker indicator, Undo, Clear */}
            <div className="flex items-center justify-between mt-2.5 pt-1 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span className="font-display font-medium text-xs md:text-sm">Blue Marker</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={undoTracing}
                  disabled={!hasTraced}
                  className="p-2 md:px-3 md:py-2 bg-white rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs md:text-sm font-medium shadow-2xs"
                  aria-label="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Undo</span>
                </button>

                <button
                  onClick={handleManualClear}
                  disabled={!hasTraced}
                  className="p-2 md:px-3 md:py-2 bg-white rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 text-xs md:text-sm font-medium shadow-2xs"
                  aria-label="Clear"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={nextWord}
          className="absolute -right-2 md:-right-6 z-20 p-3 md:p-4 bg-white text-slate-700 rounded-full shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label="Next Word"
        >
          <ChevronRight className="w-7 h-7 md:w-8 md:h-8" />
        </button>
      </main>

      {/* Minimal Footer: Dot Progress */}
      <footer className="flex items-center justify-center gap-2 py-2 flex-shrink-0">
        {SIGHT_WORDS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              sounds.playPop();
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
              idx === currentIndex ? 'w-7 bg-blue-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Go to word ${idx + 1}`}
          />
        ))}
      </footer>
    </div>
  );
}
