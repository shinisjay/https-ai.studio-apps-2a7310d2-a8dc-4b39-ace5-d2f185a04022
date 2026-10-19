export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z' | 'BRAIN';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  type: TetrominoType;
  shape: number[][];
  color: string;
  glowColor: string;
  x: number;
  y: number;
}

export type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface BrainStats {
  tetrisHighScore: number;
  totalLinesCleared: number;
  totalGamesPlayed: number;
  memoryHighScore: number;
  memoryMaxLevel: number;
  logicCompletedLevels: number[];
  brainEnergyPoints: number;
  lastTrainedDate: string;
}

export type ActiveTab = 'TETRIS' | 'MEMORY' | 'LOGIC' | 'REPORT';

export interface LogicStage {
  id: number;
  title: string;
  difficulty: '초급' | '중급' | '고급';
  targetGrid: boolean[][]; // true = cell must be filled
  availablePieces: {
    id: string;
    type: TetrominoType;
    shape: number[][];
    color: string;
  }[];
  description: string;
}

export interface MemoryChallenge {
  gridSize: number; // 3 = 3x3, 4 = 4x4, 5 = 5x5
  patternLength: number;
  displayDurationMs: number;
  mode: 'SEQUENCE' | 'MATRIX';
}
