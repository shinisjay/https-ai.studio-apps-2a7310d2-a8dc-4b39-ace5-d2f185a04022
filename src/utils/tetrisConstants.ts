import { TetrominoType, Piece } from '../types/game';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export interface TetrominoDef {
  shape: number[][];
  color: string;
  glowColor: string;
  borderColor: string;
}

export const TETROMINOES: Record<TetrominoType, TetrominoDef> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06B6D4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.4)',
    borderColor: '#22D3EE',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3B82F6', // Blue
    glowColor: 'rgba(59, 130, 246, 0.4)',
    borderColor: '#60A5FA',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#F97316', // Orange
    glowColor: 'rgba(249, 115, 22, 0.4)',
    borderColor: '#FB923C',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#EAB308', // Amber / Gold
    glowColor: 'rgba(234, 179, 8, 0.4)',
    borderColor: '#FACC15',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#10B981', // Emerald / Youth Green
    glowColor: 'rgba(16, 185, 129, 0.4)',
    borderColor: '#34D399',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#A855F7', // Purple
    glowColor: 'rgba(168, 85, 247, 0.4)',
    borderColor: '#C084FC',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#EF4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.4)',
    borderColor: '#F87171',
  },
  BRAIN: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#EC4899', // Bright Brain Pink
    glowColor: 'rgba(236, 72, 153, 0.7)',
    borderColor: '#F472B6',
  },
};

// 7-Bag generator for fair modern Tetris distribution
export function createSevenBag(): TetrominoType[] {
  const pieces: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

export function createNewPiece(type: TetrominoType): Piece {
  const def = TETROMINOES[type];
  const shape = def.shape.map((row) => [...row]);
  const width = shape[0].length;
  // Center horizontally at top
  const x = Math.floor((BOARD_WIDTH - width) / 2);
  const y = type === 'I' ? -1 : 0;

  return {
    type,
    shape,
    color: def.color,
    glowColor: def.glowColor,
    x,
    y,
  };
}

// Matrix clockwise rotation
export function rotateMatrixCW(matrix: number[][]): number[][] {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

// Matrix counter-clockwise rotation
export function rotateMatrixCCW(matrix: number[][]): number[][] {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[N - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
}

// Wall-kick test offsets
export const WALL_KICK_TESTS = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
];

// Check collision
export function checkCollision(
  piece: Piece,
  board: (string | null)[][],
  offset: { x: number; y: number } = { x: 0, y: 0 },
  testShape?: number[][]
): boolean {
  const shape = testShape || piece.shape;
  const targetX = piece.x + offset.x;
  const targetY = piece.y + offset.y;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] !== 0) {
        const boardX = targetX + c;
        const boardY = targetY + r;

        // Wall boundary checks
        if (boardX < 0 || boardX >= BOARD_WIDTH) return true;
        // Floor boundary check
        if (boardY >= BOARD_HEIGHT) return true;
        // Occupied cell check (allow negative Y before entering board)
        if (boardY >= 0 && board[boardY][boardX] !== null) return true;
      }
    }
  }
  return false;
}

// Calculate ghost piece position (where it will land)
export function calculateGhostY(piece: Piece, board: (string | null)[][]): number {
  let ghostY = piece.y;
  while (!checkCollision(piece, board, { x: 0, y: ghostY - piece.y + 1 })) {
    ghostY++;
  }
  return ghostY;
}
