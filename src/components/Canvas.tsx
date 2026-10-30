import React, { useRef, useState, useEffect } from 'react';
import { Home, Trash2, Undo, Download, PenTool } from 'lucide-react';
import { BLUE_MARKER_COLOR, MARKER_SIZE } from '../types';
import { sounds } from '../utils/audio';

interface CanvasProps {
  onBack: () => void;
}

export default function Canvas({ onBack }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setupSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const ctx = canvas.getContext('2d');
      let prevData: ImageData | null = null;
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {
          // ignore
        }
      }

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (prevData) {
          ctx.putImageData(prevData, 0, 0);
        }
      }
    };

    setupSize();
    window.addEventListener('resize', setupSize);
    return () => window.removeEventListener('resize', setupSize);
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-25), snapshot]);

    isDrawingRef.current = true;
    const coords = getPos(e);
    lastPointRef.current = coords;

    ctx.beginPath();
    ctx.strokeStyle = BLUE_MARKER_COLOR;
    ctx.lineWidth = MARKER_SIZE;
    ctx.fillStyle = BLUE_MARKER_COLOR;
    ctx.arc(coords.x, coords.y, MARKER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const lastPoint = lastPointRef.current;
    if (!ctx || !lastPoint) return;

    const currentPoint = getPos(e);

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

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    sounds.playClear();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    sounds.playPop();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const lastState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(lastState, 0, 0);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sounds.playChime();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);

      const link = document.createElement('a');
      link.download = `drawing-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex flex-col p-4 md:p-6 select-none overflow-hidden justify-between">
      {/* Minimal Header Toolbar */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto flex-shrink-0 mb-3">
        <button
          onClick={onBack}
          className="p-3 md:p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Home"
        >
          <Home className="w-6 h-6 md:w-7 md:h-7" />
        </button>

        {/* Minimal Blue Marker Status Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl text-blue-700 font-display font-medium text-base shadow-xs">
          <PenTool className="w-5 h-5 text-blue-600" />
          <span>Blue Marker</span>
        </div>

        {/* Actions: Undo, Clear, Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-2.5 md:px-4 md:py-2.5 bg-white rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all cursor-pointer flex items-center gap-2 text-sm font-medium shadow-xs"
            aria-label="Undo"
          >
            <Undo className="w-5 h-5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={clear}
            className="p-2.5 md:px-4 md:py-2.5 bg-white rounded-2xl border border-slate-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer flex items-center gap-2 text-sm font-medium shadow-xs"
            aria-label="Clear Canvas"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            onClick={downloadDrawing}
            className="p-2.5 md:px-4 md:py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl transition-all cursor-pointer flex items-center gap-2 text-sm font-medium shadow-sm"
            aria-label="Save"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </header>

      {/* Main Drawing Area: Scaled for tablet and iPad stylus */}
      <main className="flex-1 w-full max-w-5xl mx-auto min-h-0 relative">
        <div
          ref={containerRef}
          className="w-full h-full bg-white rounded-3xl md:rounded-4xl border-2 border-slate-200 shadow-inner overflow-hidden relative"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </main>
    </div>
  );
}
