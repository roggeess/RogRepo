export type AppState = 'home' | 'sight-words' | 'canvas';

export interface SightWord {
  word: string;
  category: string;
  emoji?: string;
}

export const SIGHT_WORDS: SightWord[] = [
  { word: 'APPLE', category: 'Fruit', emoji: '🍎' },
  { word: 'CAT', category: 'Animal', emoji: '🐱' },
  { word: 'DOG', category: 'Animal', emoji: '🐶' },
  { word: 'BALL', category: 'Toy', emoji: '⚽' },
  { word: 'SUN', category: 'Nature', emoji: '☀️' },
  { word: 'STAR', category: 'Sky', emoji: '⭐' },
  { word: 'TREE', category: 'Nature', emoji: '🌳' },
  { word: 'FISH', category: 'Animal', emoji: '🐟' },
  { word: 'HAPPY', category: 'Feelings', emoji: '😊' },
  { word: 'BOOK', category: 'School', emoji: '📚' },
];

// Single Blue colour pen & marker configuration
export const BLUE_MARKER_COLOR = '#2563EB'; // Royal Blue
export const MARKER_SIZE = 14; // Bold, smooth marker stroke for iPad stylus/finger

// Backwards compatibility if needed
export const COLORS = [BLUE_MARKER_COLOR];
export const BRUSH_SIZES = [MARKER_SIZE];
