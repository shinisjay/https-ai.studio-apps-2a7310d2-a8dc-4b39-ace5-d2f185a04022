import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, RefreshCw, Zap, Award } from 'lucide-react';
import { Piece, TetrominoType } from '../types/game';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINOES,
  createSevenBag,
  createNewPiece,
  rotateMatrixCW,
  rotateMatrixCCW,
  checkCollision,
  calculateGhostY,
  WALL_KICK_TESTS,
} from '../utils/tetrisConstants';
import { sounds } from '../utils/audio';
import { loadBrainStats, saveBrainStats } from '../utils/storage';

export const TetrisGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Board: 20 rows x 10 cols, each cell is color hex or null
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))
  );

  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);
  const [bag, setBag] = useState<TetrominoType[]>([]);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);

  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [combo, setCombo] = useState<number>(-1);
  const [highScore, setHighScore] = useState<number>(0);
  const [brainPoints, setBrainPoints] = useState<number>(0);
  const [brainEnergy, setBrainEnergy] = useState<number>(20); // 0-100%

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [clearingLines, setClearingLines] = useState<number[]>([]);

  // Daily missions
  const [missionProgress, setMissionProgress] = useState({
    doubleLineDone: false,
    comboThreeDone: false,
    tetrisFourDone: false,
  });

  // Reference for game loop tick speed
  const dropIntervalRef = useRef<number>(800);
  const lastDropTimeRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);

  // Keep references to state for RAF loop
  const boardRef = useRef(board);
  boardRef.current = board;
  const currentPieceRef = useRef(currentPiece);
  currentPieceRef.current = currentPiece;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;
  const nextQueueRef = useRef(nextQueue);
  nextQueueRef.current = nextQueue;
  const bagRef = useRef(bag);
  bagRef.current = bag;
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const comboRef = useRef(combo);
  comboRef.current = combo;

  // Load high score
  useEffect(() => {
    const stats = loadBrainStats();
    setHighScore(stats.tetrisHighScore);
    setBrainPoints(stats.brainEnergyPoints);
  }, []);

  // Pop next piece from queue and replenish 7-bag
  const getNextPieceType = useCallback((): TetrominoType => {
    let currentQueue = [...nextQueueRef.current];
    let currentBag = [...bagRef.current];

    while (currentQueue.length < 5) {
      if (currentBag.length === 0) {
        currentBag = createSevenBag();
      }
      currentQueue.push(currentBag.shift()!);
    }

    const nextType = currentQueue.shift()!;
    setBag(currentBag);
    setNextQueue(currentQueue);
    return nextType;
  }, []);

  // Spawn new piece
  const spawnPiece = useCallback(
    (type?: TetrominoType) => {
      const pieceType = type || getNextPieceType();
      const newPiece = createNewPiece(pieceType);

      // Check immediate collision at spawn -> Game Over
      if (checkCollision(newPiece, boardRef.current)) {
        setIsGameOver(true);
        sounds.playGameOver();

        // Save high score and stats
        const stats = loadBrainStats();
        const updatedStats = {
          ...stats,
          tetrisHighScore: Math.max(stats.tetrisHighScore, score),
          totalLinesCleared: stats.totalLinesCleared + linesRef.current,
          totalGamesPlayed: stats.totalGamesPlayed + 1,
          brainEnergyPoints: stats.brainEnergyPoints + Math.floor(score / 50),
        };
        saveBrainStats(updatedStats);
        setHighScore(updatedStats.tetrisHighScore);
        return;
      }

      setCurrentPiece(newPiece);
      setCanHold(true);
    },
    [getNextPieceType, score]
  );

  // Start new game
  const resetGame = useCallback(() => {
    const emptyBoard = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
    setBoard(emptyBoard);
    boardRef.current = emptyBoard;

    const initialBag = createSevenBag();
    const initialQueue: TetrominoType[] = [];
    while (initialQueue.length < 5) {
      initialQueue.push(initialBag.shift()!);
    }

    setBag(initialBag);
    bagRef.current = initialBag;
    setNextQueue(initialQueue);
    nextQueueRef.current = initialQueue;

    const firstPieceType = initialQueue.shift()!;
    const firstPiece = createNewPiece(firstPieceType);
    setCurrentPiece(firstPiece);
    currentPieceRef.current = firstPiece;

    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(1);
    setCombo(-1);
    setIsPaused(false);
    setIsGameOver(false);
    setClearingLines([]);
    dropIntervalRef.current = 800;
  }, []);

  // Initialize game on mount
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Lock piece into board, check cleared lines and calculate score
  const lockPiece = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    sounds.playDrop();

    const newBoard = boardRef.current.map((row) => [...row]);
    const { shape, x, y, color } = piece;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardY = y + r;
          const boardX = x + c;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = color;
          }
        }
      }
    }

    // Check full rows
    const fullRowIndices: number[] = [];
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      if (newBoard[r].every((cell) => cell !== null)) {
        fullRowIndices.push(r);
      }
    }

    if (fullRowIndices.length > 0) {
      setClearingLines(fullRowIndices);
      const isTetris = fullRowIndices.length === 4;
      sounds.playLineClear(fullRowIndices.length, isTetris);

      // Confetti for Tetris (4-line clear)
      if (isTetris) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#10B981', '#F59E0B', '#EC4899'],
        });
      }

      // Combo management
      const nextCombo = comboRef.current + 1;
      setCombo(nextCombo);
      if (nextCombo > 0) {
        sounds.playCombo(nextCombo);
      }

      // Calculate score
      const baseScores = [0, 100, 300, 500, 800];
      const lineScore = (baseScores[fullRowIndices.length] || 100) * level;
      const comboBonus = nextCombo > 0 ? nextCombo * 50 * level : 0;
      const earned = lineScore + comboBonus;

      setScore((prev) => {
        const nextScore = prev + earned;
        if (nextScore > highScore) setHighScore(nextScore);
        return nextScore;
      });

      // Update daily brain mission progress
      if (fullRowIndices.length >= 2) {
        setMissionProgress((prev) => ({ ...prev, doubleLineDone: true }));
      }
      if (nextCombo >= 2) {
        setMissionProgress((prev) => ({ ...prev, comboThreeDone: true }));
      }
      if (isTetris) {
        setMissionProgress((prev) => ({ ...prev, tetrisFourDone: true }));
      }

      // Brain Energy gauge charge
      setBrainEnergy((prev) => {
        const next = Math.min(100, prev + fullRowIndices.length * 15);
        if (next === 100) {
          sounds.playSuccess();
        }
        return next;
      });

      // Update lines and level
      const updatedLines = linesRef.current + fullRowIndices.length;
      setLines(updatedLines);
      const updatedLevel = Math.floor(updatedLines / 10) + 1;
      if (updatedLevel !== level) {
        setLevel(updatedLevel);
        sounds.playSuccess();
        // Speed up drop interval smoothly (minimum 120ms)
        dropIntervalRef.current = Math.max(120, 800 - (updatedLevel - 1) * 65);
      }

      // Delay board row removal for smooth clear animation
      setTimeout(() => {
        const remainingRows = newBoard.filter((_, idx) => !fullRowIndices.includes(idx));
        const emptyRowsToAdd = Array.from({ length: fullRowIndices.length }, () =>
          Array(BOARD_WIDTH).fill(null)
        );
        const updatedBoard = [...emptyRowsToAdd, ...remainingRows];
        setBoard(updatedBoard);
        boardRef.current = updatedBoard;
        setClearingLines([]);
        spawnPiece();
      }, 160);
    } else {
      setCombo(-1);
      setBoard(newBoard);
      boardRef.current = newBoard;
      spawnPiece();
    }
  }, [level, highScore, spawnPiece]);

  // Movement & Rotation Functions
  const moveHorizontal = useCallback((dx: number) => {
    if (!currentPieceRef.current || isPausedRef.current || isGameOverRef.current) return;
    if (!checkCollision(currentPieceRef.current, boardRef.current, { x: dx, y: 0 })) {
      sounds.playMove();
      setCurrentPiece((prev) => (prev ? { ...prev, x: prev.x + dx } : null));
    }
  }, []);

  const moveDown = useCallback(() => {
    if (!currentPieceRef.current || isPausedRef.current || isGameOverRef.current) return;
    if (!checkCollision(currentPieceRef.current, boardRef.current, { x: 0, y: 1 })) {
      setCurrentPiece((prev) => (prev ? { ...prev, y: prev.y + 1 } : null));
      setScore((prev) => prev + 1); // Soft drop bonus
    } else {
      lockPiece();
    }
  }, [lockPiece]);

  const hardDrop = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece || isPausedRef.current || isGameOverRef.current) return;

    const ghostY = calculateGhostY(piece, boardRef.current);
    const dropDistance = ghostY - piece.y;
    setScore((prev) => prev + dropDistance * 2);

    setCurrentPiece({ ...piece, y: ghostY });
    currentPieceRef.current = { ...piece, y: ghostY };
    lockPiece();
  }, [lockPiece]);

  const rotatePiece = useCallback((clockwise: boolean = true) => {
    const piece = currentPieceRef.current;
    if (!piece || isPausedRef.current || isGameOverRef.current) return;
    if (piece.type === 'O') return; // 'O' piece doesn't need rotation

    const rotatedShape = clockwise ? rotateMatrixCW(piece.shape) : rotateMatrixCCW(piece.shape);

    // Test wall kicks
    for (const offset of WALL_KICK_TESTS) {
      if (!checkCollision(piece, boardRef.current, offset, rotatedShape)) {
        sounds.playRotate();
        setCurrentPiece({
          ...piece,
          shape: rotatedShape,
          x: piece.x + offset.x,
          y: piece.y + offset.y,
        });
        return;
      }
    }
  }, []);

  const holdCurrentPiece = useCallback(() => {
    if (!canHold || !currentPieceRef.current || isPausedRef.current || isGameOverRef.current) return;

    sounds.playHold();
    const currentType = currentPieceRef.current.type;

    if (holdPiece === null) {
      setHoldPiece(currentType);
      spawnPiece();
    } else {
      const prevHold = holdPiece;
      setHoldPiece(currentType);
      spawnPiece(prevHold);
    }
    setCanHold(false);
  }, [canHold, holdPiece, spawnPiece]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault(); // Prevent page scrolling
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isGameOverRef.current || isPausedRef.current) {
        if (e.key === 'r' || e.key === 'R') {
          resetGame();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
        case 'x':
        case 'X':
          rotatePiece(true);
          break;
        case 'z':
        case 'Z':
          rotatePiece(false);
          break;
        case ' ':
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          holdCurrentPiece();
          break;
        case 'r':
        case 'R':
          resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, moveDown, hardDrop, rotatePiece, holdCurrentPiece, resetGame]);

  // Main Game Loop
  useEffect(() => {
    const loop = (time: number) => {
      if (!isPausedRef.current && !isGameOverRef.current) {
        if (time - lastDropTimeRef.current > dropIntervalRef.current) {
          lastDropTimeRef.current = time;
          moveDown();
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [moveDown]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockSize = canvas.width / BOARD_WIDTH;

    // Clear background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= BOARD_WIDTH; c++) {
      ctx.beginPath();
      ctx.moveTo(c * blockSize, 0);
      ctx.lineTo(c * blockSize, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= BOARD_HEIGHT; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * blockSize);
      ctx.lineTo(canvas.width, r * blockSize);
      ctx.stroke();
    }

    // Helper to draw a modern glowing block
    const drawBlock = (
      x: number,
      y: number,
      color: string,
      isGhost = false,
      isClearing = false
    ) => {
      const px = x * blockSize;
      const py = y * blockSize;
      const radius = 4;

      if (isGhost) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1.5, py + 1.5, blockSize - 3, blockSize - 3);
        ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
        ctx.fillRect(px + 2, py + 2, blockSize - 4, blockSize - 4);
        return;
      }

      if (isClearing) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px, py, blockSize, blockSize);
        return;
      }

      // Base block
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(px + 1, py + 1, blockSize - 2, blockSize - 2, radius);
      ctx.fill();

      // Top-left bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 2);
      ctx.lineTo(px + blockSize - 2, py + 2);
      ctx.lineTo(px + blockSize - 5, py + 5);
      ctx.lineTo(px + 5, py + 5);
      ctx.lineTo(px + 5, py + blockSize - 5);
      ctx.lineTo(px + 2, py + blockSize - 2);
      ctx.closePath();
      ctx.fill();

      // Bottom-right shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.moveTo(px + blockSize - 2, py + 2);
      ctx.lineTo(px + blockSize - 2, py + blockSize - 2);
      ctx.lineTo(px + 2, py + blockSize - 2);
      ctx.lineTo(px + 5, py + blockSize - 5);
      ctx.lineTo(px + blockSize - 5, py + blockSize - 5);
      ctx.closePath();
      ctx.fill();
    };

    // Render placed board pieces
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      const isClearing = clearingLines.includes(r);
      for (let c = 0; c < BOARD_WIDTH; c++) {
        const color = board[r][c];
        if (color) {
          drawBlock(c, r, color, false, isClearing);
        }
      }
    }

    // Render Ghost Piece
    if (currentPiece && !isPaused && !isGameOver) {
      const ghostY = calculateGhostY(currentPiece, board);
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const gx = currentPiece.x + c;
            const gy = ghostY + r;
            if (gy >= 0) {
              drawBlock(gx, gy, currentPiece.color, true);
            }
          }
        }
      }
    }

    // Render Active Piece
    if (currentPiece && !isPaused && !isGameOver) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const bx = currentPiece.x + c;
            const by = currentPiece.y + r;
            if (by >= 0) {
              drawBlock(bx, by, currentPiece.color);
            }
          }
        }
      }
    }
  }, [board, currentPiece, isPaused, isGameOver, clearingLines]);

  // Mini preview renderer for Hold and Next pieces
  const renderMiniPiece = (type: TetrominoType | null) => {
    if (!type) return <div className="w-16 h-16" />;
    const def = TETROMINOES[type];
    const shape = def.shape;
    return (
      <div className="flex flex-col items-center justify-center w-16 h-16">
        {shape.map((row, rIdx) => (
          <div key={rIdx} className="flex">
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                className="w-3.5 h-3.5 m-0.5 rounded-sm"
                style={{
                  backgroundColor: cell ? def.color : 'transparent',
                  boxShadow: cell ? `0 0 6px ${def.glowColor}` : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 max-w-6xl mx-auto w-full">
      {/* Top Banner / Youth Brain Vitality Status */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              청춘 두뇌 순발력 & 공간회전 트레이닝
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>빠른 회전 판단</span>
              <span aria-hidden="true">·</span>
              <span>전두엽 신경 활성화</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">누적 활력 {brainPoints} PT</span>
            </div>
          </div>
        </div>

        {/* Daily Mission Progress */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Award className={`w-4 h-4 ${missionProgress.doubleLineDone ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span className={missionProgress.doubleLineDone ? 'text-emerald-400 line-through' : ''}>2줄 연속 제거</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Award className={`w-4 h-4 ${missionProgress.comboThreeDone ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span className={missionProgress.comboThreeDone ? 'text-emerald-400 line-through' : ''}>3 콤보 달성</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Award className={`w-4 h-4 ${missionProgress.tetrisFourDone ? 'text-emerald-400' : 'text-slate-600'}`} />
            <span className={missionProgress.tetrisFourDone ? 'text-emerald-400 line-through' : ''}>테트리스(4줄)</span>
          </div>
        </div>
      </div>

      {/* Main Game Arena Container */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full">
        {/* Left Side: Hold Box & Controls Guide */}
        <div className="flex lg:flex-col gap-4 order-2 lg:order-1 w-full lg:w-44">
          {/* Hold Piece Card */}
          <div className="flex-1 lg:flex-initial bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              보관 블록 (HOLD)
            </span>
            <div className="h-20 flex items-center justify-center">
              {renderMiniPiece(holdPiece)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1">단축키: C / Shift</span>
          </div>

          {/* Level & Lines Card */}
          <div className="flex-1 lg:flex-initial bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-slate-400">현재 레벨</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">{level}</p>
            </div>
            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-xs font-medium text-slate-400">제거한 줄</span>
              <p className="text-lg font-bold font-mono text-white tabular-nums">{lines} 줄</p>
            </div>
          </div>
        </div>

        {/* Center: Tetris Game Canvas Screen */}
        <div className="relative order-1 lg:order-2 flex flex-col items-center">
          <div className="relative border-2 border-slate-700/80 rounded-xl overflow-hidden shadow-2xl bg-slate-950 p-1">
            <canvas
              ref={canvasRef}
              width={300}
              height={600}
              className="block rounded-lg touch-none"
            />

            {/* In-Canvas Combo Banner */}
            {combo > 0 && !isGameOver && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 font-black px-3 py-1 rounded-full text-xs shadow-lg animate-bounce pointer-events-none">
                {combo + 1} COMBO!
              </div>
            )}

            {/* Paused Overlay */}
            {isPaused && !isGameOver && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-20">
                <p className="text-xl font-bold text-white mb-3">일시 정지</p>
                <button
                  onClick={() => setIsPaused(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg transition-colors shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  계속하기
                </button>
              </div>
            )}

            {/* Game Over Modal */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">두뇌 트레이닝 완료</h3>
                <p className="text-xs text-slate-400 mb-4">순발력과 공간 인지 능력이 크게 자극되었습니다!</p>

                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2 mb-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>최종 점수</span>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">{score}점</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>제거한 줄</span>
                    <span className="font-mono text-white tabular-nums">{lines} 줄</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>최고 기록</span>
                    <span className="font-mono text-amber-400 tabular-nums">{highScore}점</span>
                  </div>
                </div>

                <button
                  onClick={resetGame}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  다시 시작하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Score, Next Pieces & Brain Energy */}
        <div className="flex lg:flex-col gap-4 order-3 w-full lg:w-44">
          {/* Score & High Score Card */}
          <div className="flex-1 lg:flex-initial bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <span className="text-xs font-medium text-slate-400">현재 점수</span>
              <p className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">{score}</p>
            </div>
            <div className="border-t border-slate-800/80 pt-2">
              <span className="text-xs font-medium text-slate-400">최고 점수</span>
              <p className="text-base font-bold font-mono text-amber-400 tabular-nums">{highScore}</p>
            </div>
          </div>

          {/* Next Pieces Queue */}
          <div className="flex-1 lg:flex-initial bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              다음 블록 (NEXT)
            </span>
            <div className="space-y-1 flex flex-col items-center">
              {nextQueue.slice(0, 3).map((type, idx) => (
                <div key={idx} className="flex items-center justify-center">
                  {renderMiniPiece(type)}
                </div>
              ))}
            </div>
          </div>

          {/* Brain Vitality Energy Gauge */}
          <div className="hidden lg:block bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>청춘 뇌 충전</span>
              <span className="font-mono text-emerald-400 font-bold tabular-nums">{brainEnergy}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full transition-all duration-300"
                style={{ width: `${brainEnergy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ergonomic Touch / Quick Action Button Pad (Mobile & Desktop Accessible) */}
      <div className="mt-4 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <button
            onClick={() => moveHorizontal(-1)}
            aria-label="왼쪽으로 이동"
            className="flex items-center justify-center py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white rounded-lg text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => moveHorizontal(1)}
            aria-label="오른쪽으로 이동"
            className="flex items-center justify-center py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white rounded-lg text-slate-200 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => rotatePiece(false)}
            aria-label="반시계방향 회전"
            className="flex items-center justify-center py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white rounded-lg text-slate-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => rotatePiece(true)}
            aria-label="시계방향 회전"
            className="flex items-center justify-center py-3 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white rounded-lg text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={moveDown}
            aria-label="천천히 내리기"
            className="flex items-center justify-center py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white rounded-lg text-xs font-semibold text-slate-200 transition-colors"
          >
            <ArrowDown className="w-4 h-4 mr-1" /> 하강
          </button>
          <button
            onClick={hardDrop}
            aria-label="즉시 떨어뜨리기"
            className="flex items-center justify-center py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <ArrowUp className="w-4 h-4 mr-1" /> 즉시낙하
          </button>
          <button
            onClick={holdCurrentPiece}
            aria-label="블록 홀드 보관"
            className="flex items-center justify-center py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 active:text-white rounded-lg text-xs font-semibold text-slate-200 transition-colors"
          >
            홀드(C)
          </button>
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label="일시정지"
            className="flex items-center justify-center py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
