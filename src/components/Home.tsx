import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Palette } from 'lucide-react';
import { AppState } from '../types';

interface HomeProps {
  onModuleSelect: (state: AppState) => void;
}

export default function Home({ onModuleSelect }: HomeProps) {
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 md:p-12 text-center bg-gradient-to-b from-slate-50 to-blue-50/40 select-none overflow-hidden">
      {/* Title - Clean, bold and minimal */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-8 md:mb-12"
      >
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-display text-slate-800 tracking-tight">
          Learn, Play and Write
        </h1>
      </motion.div>

      {/* Buttons - Minimal, no subheaders, optimized for iPad touch targets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full max-w-2xl px-4">
        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2 }}
          onClick={() => onModuleSelect('sight-words')}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-8 md:p-12 rounded-3xl md:rounded-4xl flex flex-col items-center justify-center gap-5 shadow-lg hover:shadow-xl transition-all cursor-pointer min-h-[180px] md:min-h-[240px]"
        >
          <BookOpen className="w-16 h-16 md:w-20 md:h-20" />
          <h2 className="text-3xl md:text-5xl font-display">Words</h2>
        </motion.button>

        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          onClick={() => onModuleSelect('canvas')}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white p-8 md:p-12 rounded-3xl md:rounded-4xl flex flex-col items-center justify-center gap-5 shadow-lg hover:shadow-xl transition-all cursor-pointer min-h-[180px] md:min-h-[240px]"
        >
          <Palette className="w-16 h-16 md:w-20 md:h-20" />
          <h2 className="text-3xl md:text-5xl font-display">Draw</h2>
        </motion.button>
      </div>
    </div>
  );
}
