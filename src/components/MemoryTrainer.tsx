import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Brain, Play, RotateCcw, CheckCircle2, Award, Sparkles, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/audio';
import { loadBrainStats, saveBrainStats } from '../utils/storage';

type MemoryMode = 'SEQUENCE' | 'MATRIX';
type GamePhase = 'IDLE' | 'WATCHING' | 'RECALL' | 'SUCCESS' | 'FAILURE';

export const MemoryTrainer: React.FC = () => {
  const [mode, setMode] = useState<MemoryMode>('SEQUENCE');
  const [phase, setPhase] = useState<GamePhase>('IDLE');
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [maxLevelAchieved, setMaxLevelAchieved] = useState<number>(1);

  // Pattern data
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeFlashingTile, setActiveFlashingTile] = useState<number | null>(null);
  const [matrixActiveTiles, setMatrixActiveTiles] = useState<number[]>([]);

  const timeoutIdsRef = useRef<number[]>([]);

  // Load existing stats
  useEffect(() => {
    const stats = loadBrainStats();
    setHighScore(stats.memoryHighScore);
    setMaxLevelAchieved(stats.memoryMaxLevel);
  }, []);

  const clearAllTimeouts = () => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Determine grid size based on level
  // Level 1-2: 3x3 (9 tiles)
  // Level 3-5: 4x4 (16 tiles)
  // Level 6+: 5x5 (25 tiles)
  const getGridDimension = (lvl: number) => {
    if (lvl <= 2) return 3;
    if (lvl <= 5) return 4;
    return 5;
  };

  const getTileCount = (lvl: number) => {
    const dim = getGridDimension(lvl);
    return dim * dim;
  };

  const getPatternLength = (lvl: number) => {
    // Starts with 3 items, increases as level goes up
    return Math.min(10, 2 + lvl);
  };

  // Start next round
  const startRound = useCallback((targetLevel: number) => {
    clearAllTimeouts();
    setLevel(targetLevel);
    setPlayerInput([]);
    setPhase('WATCHING');
    setActiveFlashingTile(null);
    setMatrixActiveTiles([]);

    const totalTiles = getTileCount(targetLevel);
    const length = getPatternLength(targetLevel);

    if (mode === 'SEQUENCE') {
      // Generate sequence of random tiles
      const newPattern: number[] = [];
      for (let i = 0; i < length; i++) {
        // Avoid identical consecutive tiles
        let nextTile = Math.floor(Math.random() * totalTiles);
        while (newPattern.length > 0 && nextTile === newPattern[newPattern.length - 1]) {
          nextTile = Math.floor(Math.random() * totalTiles);
        }
        newPattern.push(nextTile);
      }
      setPattern(newPattern);

      // Flash sequence
      newPattern.forEach((tileIdx, step) => {
        const showTimeout = window.setTimeout(() => {
          setActiveFlashingTile(tileIdx);
          sounds.playMemoryTone(tileIdx);
        }, 600 + step * 650);

        const hideTimeout = window.setTimeout(() => {
          setActiveFlashingTile(null);
        }, 600 + step * 650 + 400);

        timeoutIdsRef.current.push(showTimeout, hideTimeout);
      });

      // Enable player input after sequence finishes
      const readyTimeout = window.setTimeout(() => {
        setActiveFlashingTile(null);
        setPhase('RECALL');
      }, 600 + newPattern.length * 650 + 200);

      timeoutIdsRef.current.push(readyTimeout);
    } else {
      // MATRIX MODE: select unique tiles to flash simultaneously
      const selected = new Set<number>();
      while (selected.size < length) {
        selected.add(Math.floor(Math.random() * totalTiles));
      }
      const newPattern = Array.from(selected);
      setPattern(newPattern);

      const showTimeout = window.setTimeout(() => {
        setMatrixActiveTiles(newPattern);
        sounds.playMemoryTone(newPattern[0] || 0);
      }, 600);

      const duration = Math.max(1200, 2200 - targetLevel * 100);
      const hideTimeout = window.setTimeout(() => {
        setMatrixActiveTiles([]);
        setPhase('RECALL');
      }, 600 + duration);

      timeoutIdsRef.current.push(showTimeout, hideTimeout);
    }
  }, [mode]);

  // Handle tile click by player
  const handleTileClick = (index: number) => {
    if (phase !== 'RECALL') return;

    sounds.playMemoryTone(index);

    if (mode === 'SEQUENCE') {
      const nextStep = playerInput.length;
      const expected = pattern[nextStep];

      if (index === expected) {
        const nextInput = [...playerInput, index];
        setPlayerInput(nextInput);

        // Check if finished sequence successfully
        if (nextInput.length === pattern.length) {
          handleSuccess();
        }
      } else {
        handleFailure();
      }
    } else {
      // Matrix Mode
      if (playerInput.includes(index)) return; // already clicked

      if (pattern.includes(index)) {
        const nextInput = [...playerInput, index];
        setPlayerInput(nextInput);

        if (nextInput.length === pattern.length) {
          handleSuccess();
        }
      } else {
        handleFailure();
      }
    }
  };

  const handleSuccess = () => {
    setPhase('SUCCESS');
    sounds.playSuccess();

    const pointsEarned = level * 100 + streak * 20;
    const nextScore = score + pointsEarned;
    const nextStreak = streak + 1;
    const nextLevel = level + 1;

    setScore(nextScore);
    setStreak(nextStreak);

    // Save stats
    const stats = loadBrainStats();
    const updatedStats = {
      ...stats,
      memoryHighScore: Math.max(stats.memoryHighScore, nextScore),
      memoryMaxLevel: Math.max(stats.memoryMaxLevel, nextLevel),
      brainEnergyPoints: stats.brainEnergyPoints + 30,
    };
    saveBrainStats(updatedStats);
    setHighScore(updatedStats.memoryHighScore);
    setMaxLevelAchieved(updatedStats.memoryMaxLevel);

    if (nextLevel % 3 === 0) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#38BDF8', '#F59E0B'],
      });
    }

    // Advance to next level after brief delay
    const advanceTimeout = window.setTimeout(() => {
      startRound(nextLevel);
    }, 1200);
    timeoutIdsRef.current.push(advanceTimeout);
  };

  const handleFailure = () => {
    setPhase('FAILURE');
    sounds.playError();
    setStreak(0);
  };

  const resetGame = () => {
    clearAllTimeouts();
    setScore(0);
    setStreak(0);
    setLevel(1);
    setPhase('IDLE');
    setPattern([]);
    setPlayerInput([]);
    setActiveFlashingTile(null);
    setMatrixActiveTiles([]);
  };

  const gridDimension = getGridDimension(level);
  const totalTiles = gridDimension * gridDimension;

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full p-4">
      {/* Header Info */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              순간 패턴 기억력 트레이닝
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>작업 기억 용량 강화</span>
              <span aria-hidden="true">·</span>
              <span>해마(Hippocampus) 활성</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono">최고 레벨 {maxLevelAchieved}</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs (Clean segmented button controls) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={() => {
              setMode('SEQUENCE');
              resetGame();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'SEQUENCE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            순서 기억 모드
          </button>
          <button
            onClick={() => {
              setMode('MATRIX');
              resetGame();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              mode === 'MATRIX'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            공간 매트릭스 모드
          </button>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
        {/* Metric Bar */}
        <div className="grid grid-cols-4 gap-3 w-full max-w-lg mb-6 text-center">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">현재 단계</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">Lv.{level}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">기억 점수</span>
            <span className="text-xl font-bold font-mono text-cyan-400 tabular-nums">{score}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">연속 성공</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">{streak}회</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <span className="text-[11px] text-slate-400 block">최고 점수</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">{highScore}</span>
          </div>
        </div>

        {/* Phase Status Banner */}
        <div className="mb-6 h-8 flex items-center justify-center">
          {phase === 'IDLE' && (
            <span className="text-sm font-medium text-slate-400">
              시작 버튼을 눌러 패턴 기억 훈련을 시작하세요.
            </span>
          )}
          {phase === 'WATCHING' && (
            <span className="text-sm font-semibold text-emerald-400 animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              반짝이는 타일의 {mode === 'SEQUENCE' ? '순서를' : '위치를'} 집중해서 기억하세요!
            </span>
          )}
          {phase === 'RECALL' && (
            <span className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {mode === 'SEQUENCE'
                ? `기억한 순서대로 타일을 누르세요 (${playerInput.length}/${pattern.length})`
                : `기억한 타일을 모두 찾으세요 (${playerInput.length}/${pattern.length})`}
            </span>
          )}
          {phase === 'SUCCESS' && (
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5" />
              완벽합니다! 기억력 신경망이 한 단계 강화되었습니다!
            </span>
          )}
          {phase === 'FAILURE' && (
            <span className="text-sm font-bold text-rose-400">
              아쉽습니다! 다시 도전하여 작업 기억 용량을 넓혀보세요.
            </span>
          )}
        </div>

        {/* Interactive Tile Grid */}
        <div
          className="grid gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl transition-all"
          style={{
            gridTemplateColumns: `repeat(${gridDimension}, minmax(0, 1fr))`,
            width: gridDimension === 3 ? '320px' : gridDimension === 4 ? '360px' : '400px',
            maxWidth: '100%',
          }}
        >
          {Array.from({ length: totalTiles }).map((_, idx) => {
            const isFlashingInSeq = activeFlashingTile === idx;
            const isFlashingInMatrix = matrixActiveTiles.includes(idx);
            const isClickedByPlayer = playerInput.includes(idx);

            let bgClass = 'bg-slate-800 hover:bg-slate-700 border-slate-700/60';
            if (isFlashingInSeq || isFlashingInMatrix) {
              bgClass = 'bg-emerald-400 border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-95';
            } else if (isClickedByPlayer) {
              bgClass = 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]';
            }

            return (
              <button
                key={idx}
                disabled={phase !== 'RECALL'}
                onClick={() => handleTileClick(idx)}
                aria-label={`기억 타일 ${idx + 1}`}
                className={`aspect-square rounded-xl border-2 transition-all duration-150 flex items-center justify-center font-bold text-lg cursor-pointer disabled:cursor-default ${bgClass}`}
              >
                {isClickedByPlayer && mode === 'SEQUENCE' && (
                  <span className="text-slate-950 font-black text-sm">
                    {playerInput.indexOf(idx) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex items-center gap-3">
          {phase === 'IDLE' && (
            <button
              onClick={() => startRound(1)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950"
            >
              <Play className="w-4 h-4" />
              트레이닝 시작
            </button>
          )}

          {phase === 'FAILURE' && (
            <button
              onClick={() => startRound(Math.max(1, level - 1))}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              이전 단계부터 재도전
            </button>
          )}

          {phase !== 'IDLE' && (
            <button
              onClick={resetGame}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              처음으로
            </button>
          )}
        </div>

        {/* Scientific Brain Tip for Memory */}
        <div className="mt-8 max-w-xl text-center bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5 text-xs text-slate-400">
          <p className="font-semibold text-slate-300 mb-1 flex items-center justify-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            인지과학 기반 작업 기억력 효과
          </p>
          <p className="leading-relaxed">
            순간 시공간 패턴 기억 훈련은 뇌의 해마(기억 저장소)와 전두엽(작업대) 사이의 시냅스 연결을 강화하여 일상에서의 건망증 예방 및 정보 처리 속도 향상에 도움을 줍니다.
          </p>
        </div>
      </div>
    </div>
  );
};
