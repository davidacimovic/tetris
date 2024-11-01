export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Position = {
  x: number;
  y: number;
};

export type Tetromino = {
  shape: number[][];
  color: string;
  type: TetrominoType;
};

export type GameState = {
  grid: Cell[][];
  currentPiece: {
    tetromino: Tetromino;
    position: Position;
    rotation: number;
  } | null;
  nextPiece: Tetromino | null;
  score: number;
  level: number;
  linesCleared: number;
  isGameOver: boolean;
  isPaused: boolean;
};

export interface Cell {
  filled: boolean;
  color?: string;
}
