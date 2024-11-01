import { Cell, GameState, Position } from './types';
import { getRandomTetromino } from './tetrominoes';
import { playSound } from './soundManager';

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const LINES_PER_LEVEL = 10;
const GAME_STATE_KEY = 'tetris-game-state';
const HIGH_SCORE_KEY = 'tetris-high-score';

// Use bag randomization for fair piece distribution
class TetrominoBag {
  private bag: string[] = [];

  getNextPiece() {
    if (this.bag.length === 0) {
      this.bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      // Fisher-Yates shuffle
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return getRandomTetromino(this.bag.pop() as 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L');
  }
}

const tetrominoBag = new TetrominoBag();

export const createEmptyGrid = (): Cell[][] =>
  Array(GRID_HEIGHT).fill(null).map(() =>
    Array(GRID_WIDTH).fill({ filled: false })
  );

export const checkCollision = (
  grid: Cell[][],
  tetromino: number[][],
  position: Position
): boolean => {
  for (let y = 0; y < tetromino.length; y++) {
    for (let x = 0; x < tetromino[y].length; x++) {
      if (tetromino[y][x]) {
        const newX = position.x + x;
        const newY = position.y + y;

        if (
          newX < 0 ||
          newX >= GRID_WIDTH ||
          newY >= GRID_HEIGHT ||
          (newY >= 0 && grid[newY][newX].filled)
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

export const mergePieceWithGrid = (
  grid: Cell[][],
  tetromino: number[][],
  position: Position,
  color: string
): Cell[][] => {
  const newGrid = grid.map(row => [...row]);

  for (let y = 0; y < tetromino.length; y++) {
    for (let x = 0; x < tetromino[y].length; x++) {
      if (tetromino[y][x]) {
        const newY = position.y + y;
        if (newY >= 0) {
          newGrid[newY][position.x + x] = { filled: true, color };
        }
      }
    }
  }

  return newGrid;
};

export const clearLines = (grid: Cell[][]): { newGrid: Cell[][], linesCleared: number } => {
  let linesCleared = 0;
  const newGrid = grid.filter(row => {
    const isLineFull = row.every(cell => cell.filled);
    if (isLineFull) {
      linesCleared++;
      playSound('clear');
      return false;
    }
    return true;
  });

  while (newGrid.length < GRID_HEIGHT) {
    newGrid.unshift(Array(GRID_WIDTH).fill({ filled: false }));
  }

  return { newGrid, linesCleared };
};

export const calculateScore = (linesCleared: number, level: number): number => {
  const basePoints = [0, 40, 100, 300, 1200];
  return basePoints[linesCleared] * (level + 1);
};

export const calculateLevel = (clearedLines: number): number => {
  return Math.floor(clearedLines / LINES_PER_LEVEL);
};

export const getDropInterval = (level: number): number => {
  return Math.max(100, 1000 - (level * 100));
};

export const getNextGamePiece = () => ({
  tetromino: tetrominoBag.getNextPiece(),
  position: { x: 3, y: -2 },
  rotation: 0
});

export const createInitialGameState = (): GameState => {
  const savedState = loadGameState();
  if (savedState && !savedState.isGameOver) {
    return savedState;
  }

  const firstPiece = tetrominoBag.getNextPiece();
  const nextPiece = tetrominoBag.getNextPiece();
  
  return {
    grid: createEmptyGrid(),
    currentPiece: {
      tetromino: firstPiece,
      position: { x: 3, y: -2 },
      rotation: 0
    },
    nextPiece: nextPiece,
    score: 0,
    level: 0,
    linesCleared: 0,
    isGameOver: false,
    isPaused: false
  };
};

export const updateGameStateAfterLineClear = (
  state: GameState,
  linesCleared: number
): GameState => {
  const newLinesCleared = state.linesCleared + linesCleared;
  const newLevel = calculateLevel(newLinesCleared);
  const levelUp = newLevel > state.level;
  
  if (levelUp) {
    playSound('levelUp');
  }
  
  return {
    ...state,
    linesCleared: newLinesCleared,
    level: newLevel
  };
};

export const getHighScore = (): number => {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
};

export const updateHighScore = (score: number): number => {
  if (typeof window === 'undefined') return score;
  const currentHighScore = getHighScore();
  if (score > currentHighScore) {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    return score;
  }
  return currentHighScore;
};

export const saveGameState = (state: GameState): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
};

export const loadGameState = (): GameState | null => {
  if (typeof window === 'undefined') return null;
  const savedState = localStorage.getItem(GAME_STATE_KEY);
  if (!savedState) return null;
  try {
    return JSON.parse(savedState);
  } catch {
    return null;
  }
};

export const clearGameState = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GAME_STATE_KEY);
};
