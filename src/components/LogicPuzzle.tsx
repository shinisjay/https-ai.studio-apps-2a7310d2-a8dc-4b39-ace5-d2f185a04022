import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Layers, RotateCw, CheckCircle2, RotateCcw, Lightbulb, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { LOGIC_STAGES } from '../utils/logicPuzzles';
import { LogicStage } from '../types/game';
import { rotateMatrixCW } from '../utils/tetrisConstants';
import { sounds } from '../utils/audio';
import { loadBrainStats, saveBrainStats } from '../utils/storage';

interface PlacedPieceInfo {
  pieceId: string;
  shape: number[][];
  color: string;
  gridRow: number;
  gridCol: number;
}

export const LogicPuzzle: React.FC = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const stage: LogicStage = LOGIC_STAGES[currentStageIndex];

  // Pieces available to place in this stage
  const [availablePieces, setAvailablePieces] = useState(stage.availablePieces);
  // Selected piece in hand
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [selectedPieceShape, setSelectedPieceShape] = useState<number[][]>([]);
  const [selectedPieceColor, setSelectedPieceColor] = useState<string>('');

  // Placed pieces on the board
  const [placedPieces, setPlacedPieces] = useState<PlacedPieceInfo[]>([]);
  // Completed stages tracker
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  // Is current stage completed?
  const [isStageSolved, setIsStageSolved] = useState<boolean>(false);
  // Hint mode
  const [showHint, setShowHint] = useState<boolean>(false);

  // Load saved completed stages
  useEffect(() => {
    const stats = loadBrainStats();
    setCompletedStages(stats.logicCompletedLevels || []);
  }, []);

  // Reset stage when switching stages
  useEffect(() => {
    setAvailablePieces(stage.availablePieces);
    setSelectedPieceId(stage.availablePieces[0]?.id || null);
    setSelectedPieceShape(stage.availablePieces[0]?.shape || []);
    setSelectedPieceColor(stage.availablePieces[0]?.color || '');
    setPlacedPieces([]);
    setIsStageSolved(false);
    setShowHint(false);
  }, [currentStageIndex, stage]);

  // Rotate selected piece in hand
  const handleRotatePiece = () => {
    if (!selectedPieceShape.length) return;
    sounds.playRotate();
    setSelectedPieceShape(rotateMatrixCW(selectedPieceShape));
  };

  // Select a piece from the tray
  const handleSelectPiece = (piece: typeof stage.availablePieces[0]) => {
    sounds.playMove();
    setSelectedPieceId(piece.id);
    setSelectedPieceShape(piece.shape);
    setSelectedPieceColor(piece.color);
  };

  // Remove a piece that is already on the board
  const handleRemovePlacedPiece = (pieceId: string) => {
    sounds.playSnap();
    const removed = placedPieces.find((p) => p.pieceId === pieceId);
    if (!removed) return;

    setPlacedPieces((prev) => prev.filter((p) => p.pieceId !== pieceId));

    const originalDef = stage.availablePieces.find((p) => p.id === pieceId);
    if (originalDef) {
      setAvailablePieces((prev) => [...prev, originalDef]);
      setSelectedPieceId(originalDef.id);
      setSelectedPieceShape(removed.shape);
      setSelectedPieceColor(originalDef.color);
    }
    setIsStageSolved(false);
  };

  // Place active piece at grid (row, col)
  const handleGridCellClick = (targetRow: number, targetCol: number) => {
    if (!selectedPieceId || !selectedPieceShape.length || isStageSolved) return;

    // Check bounds & target validity
    const numRows = stage.targetGrid.length;
    const numCols = stage.targetGrid[0].length;
    const shapeRows = selectedPieceShape.length;
    const shapeCols = selectedPieceShape[0].length;

    // Build current occupied board map
    const occupiedMap: Record<string, string> = {};
    placedPieces.forEach((p) => {
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c] !== 0) {
            occupiedMap[`${p.gridRow + r},${p.gridCol + c}`] = p.pieceId;
          }
        }
      }
    });

    // Check if new placement is valid
    let canPlace = true;
    for (let r = 0; r < shapeRows; r++) {
      for (let c = 0; c < shapeCols; c++) {
        if (selectedPieceShape[r][c] !== 0) {
          const checkR = targetRow + r;
          const checkC = targetCol + c;

          // Out of grid boundary
          if (checkR < 0 || checkR >= numRows || checkC < 0 || checkC >= numCols) {
            canPlace = false;
            break;
          }

          // Not a valid target silhouette cell
          if (!stage.targetGrid[checkR][checkC]) {
            canPlace = false;
            break;
          }

          // Already occupied by another piece
          if (occupiedMap[`${checkR},${checkC}`]) {
            canPlace = false;
            break;
          }
        }
      }
      if (!canPlace) break;
    }

    if (!canPlace) {
      sounds.playError();
      return;
    }

    // Place piece
    sounds.playSnap();
    const newPlaced: PlacedPieceInfo = {
      pieceId: selectedPieceId,
      shape: selectedPieceShape,
      color: selectedPieceColor,
      gridRow: targetRow,
      gridCol: targetCol,
    };

    const nextPlaced = [...placedPieces, newPlaced];
    setPlacedPieces(nextPlaced);

    // Remove from available tray
    const remainingAvailable = availablePieces.filter((p) => p.id !== selectedPieceId);
    setAvailablePieces(remainingAvailable);

    // Auto-select next available piece
    if (remainingAvailable.length > 0) {
      setSelectedPieceId(remainingAvailable[0].id);
      setSelectedPieceShape(remainingAvailable[0].shape);
      setSelectedPieceColor(remainingAvailable[0].color);
    } else {
      setSelectedPieceId(null);
      setSelectedPieceShape([]);
    }

    // Check if whole puzzle is solved!
    checkIfSolved(nextPlaced);
  };

  const checkIfSolved = (currentPlaced: PlacedPieceInfo[]) => {
    const numRows = stage.targetGrid.length;
    const numCols = stage.targetGrid[0].length;

    // Check if all available pieces are placed
    if (currentPlaced.length !== stage.availablePieces.length) return;

    // Create coverage map
    const covered: boolean[][] = Array.from({ length: numRows }, () =>
      Array(numCols).fill(false)
    );

    for (const p of currentPlaced) {
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c] !== 0) {
            covered[p.gridRow + r][p.gridCol + c] = true;
          }
        }
      }
    }

    // Check if every target cell is covered
    let allMatched = true;
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (stage.targetGrid[r][c] !== covered[r][c]) {
          allMatched = false;
          break;
        }
      }
      if (!allMatched) break;
    }

    if (allMatched) {
      setIsStageSolved(true);
      sounds.playSuccess();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#10B981', '#38BDF8', '#F59E0B'],
      });

      // Update storage
      const stats = loadBrainStats();
      const updatedLevels = Array.from(new Set([...(stats.logicCompletedLevels || []), stage.id]));
      const updatedStats = {
        ...stats,
        logicCompletedLevels: updatedLevels,
        brainEnergyPoints: stats.brainEnergyPoints + 50,
      };
      saveBrainStats(updatedStats);
      setCompletedStages(updatedLevels);
    }
  };

  const resetStage = () => {
    sounds.playMove();
    setAvailablePieces(stage.availablePieces);
    setSelectedPieceId(stage.availablePieces[0]?.id || null);
    setSelectedPieceShape(stage.availablePieces[0]?.shape || []);
    setSelectedPieceColor(stage.availablePieces[0]?.color || '');
    setPlacedPieces([]);
    setIsStageSolved(false);
    setShowHint(false);
  };

  // Find which piece occupies (r, c)
  const getOccupantAt = (r: number, c: number) => {
    for (const p of placedPieces) {
      const relR = r - p.gridRow;
      const relC = c - p.gridCol;
      if (
        relR >= 0 &&
        relR < p.shape.length &&
        relC >= 0 &&
        relC < p.shape[relR].length &&
        p.shape[relR][relC] !== 0
      ) {
        return p;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full p-4">
      {/* Header Info */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              공간 기하 & 테트로미노 논리 핏
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>공간지각력 추론</span>
              <span aria-hidden="true">·</span>
              <span>두정엽(Parietal Lobe) 활성</span>
              <span aria-hidden="true">·</span>
              <span className="text-purple-400 font-mono">
                완료 {completedStages.length}/{LOGIC_STAGES.length}
              </span>
            </div>
          </div>
        </div>

        {/* Stage Navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentStageIndex === 0}
            onClick={() => setCurrentStageIndex((prev) => Math.max(0, prev - 1))}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
            aria-label="이전 단계"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-white px-3 font-mono">
            {stage.id} / {LOGIC_STAGES.length} 단계
          </span>
          <button
            disabled={currentStageIndex === LOGIC_STAGES.length - 1}
            onClick={() =>
              setCurrentStageIndex((prev) => Math.min(LOGIC_STAGES.length - 1, prev + 1))
            }
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
            aria-label="다음 단계"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Puzzle Card */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
        {/* Stage Meta */}
        <div className="w-full max-w-xl text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-semibold text-purple-400">{stage.difficulty}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <h3 className="text-base font-bold text-white">{stage.title}</h3>
          </div>
          <p className="text-xs text-slate-400">{stage.description}</p>
        </div>

        {/* Puzzle Board Canvas / Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6 flex flex-col items-center">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${stage.targetGrid[0].length}, minmax(0, 1fr))`,
            }}
          >
            {stage.targetGrid.map((row, rIdx) =>
              row.map((isTarget, cIdx) => {
                if (!isTarget) {
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className="w-12 h-12 rounded-lg bg-transparent border border-slate-900/40"
                    />
                  );
                }

                const occupant = getOccupantAt(rIdx, cIdx);

                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => {
                      if (occupant) {
                        handleRemovePlacedPiece(occupant.pieceId);
                      } else {
                        handleGridCellClick(rIdx, cIdx);
                      }
                    }}
                    title={occupant ? '클릭하여 블록 회수' : '클릭하여 블록 배치'}
                    className={`w-12 h-12 rounded-lg border-2 transition-all flex items-center justify-center font-bold text-xs ${
                      occupant
                        ? 'border-white/40 cursor-pointer shadow-md'
                        : 'border-dashed border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:border-purple-400'
                    }`}
                    style={{
                      backgroundColor: occupant ? occupant.color : undefined,
                    }}
                  >
                    {occupant && <span className="opacity-0 hover:opacity-100 text-white text-[10px]">✕</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Success Banner */}
        {isStageSolved && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center max-w-md animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">공간 논리 퍼즐 해결 성공!</p>
            <p className="text-xs text-emerald-300 mt-1">
              두정엽의 공간 추론 및 기하 감각이 활성화되었습니다. (+50 두뇌 활력)
            </p>
            {currentStageIndex < LOGIC_STAGES.length - 1 && (
              <button
                onClick={() => setCurrentStageIndex((prev) => prev + 1)}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
              >
                다음 단계로 이동하기
              </button>
            )}
          </div>
        )}

        {/* Available Pieces Tray & Rotation Controls */}
        <div className="w-full max-w-xl bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              배치할 블록 선택 ({availablePieces.length}개 남음)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!selectedPieceId || isStageSolved}
                onClick={handleRotatePiece}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                90° 회전
              </button>
              <button
                onClick={resetStage}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            </div>
          </div>

          {/* Piece Cards */}
          <div className="flex flex-wrap items-center justify-center gap-4 min-h-[80px]">
            {availablePieces.length === 0 && !isStageSolved && (
              <p className="text-xs text-slate-400">모든 블록이 배치되었습니다. 프레임이 일치하는지 확인하세요.</p>
            )}
            {availablePieces.map((p) => {
              const isSelected = selectedPieceId === p.id;
              const displayShape = isSelected ? selectedPieceShape : p.shape;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPiece(p)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-purple-400 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-105'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {displayShape.map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-1">
                        {row.map((cell, cIdx) => (
                          <div
                            key={cIdx}
                            className="w-4 h-4 rounded-xs"
                            style={{
                              backgroundColor: cell ? p.color : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono">{p.type} 블록</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip / Instruction */}
        <div className="mt-6 flex items-center justify-between w-full max-w-xl text-xs text-slate-400">
          <span>※ 배치된 블록을 클릭하면 다시 손으로 회수할 수 있습니다.</span>
          <button
            onClick={() => setShowHint((prev) => !prev)}
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showHint ? '힌트 숨기기' : '힌트 보기'}
          </button>
        </div>

        {showHint && (
          <div className="mt-3 w-full max-w-xl bg-purple-950/30 border border-purple-800/40 rounded-lg p-3 text-xs text-purple-300 animate-fade-in">
            <span className="font-bold">두뇌 추론 힌트: </span>
            {stage.id === 1 && 'I 블록(4칸)을 가로로 눕혀 아래쪽에 두고, O 블록(2x2)을 위쪽에 맞춰보세요.'}
            {stage.id === 2 && 'L블록과 J블록을 서로 반대 방향으로 180도 맞물리면 깔끔한 2x4 직사각형이 완성됩니다.'}
            {stage.id === 3 && 'S블록의 오목한 부분과 Z블록의 볼록한 경사를 지퍼처럼 맞물려 보세요.'}
            {stage.id >= 4 && '가장 긴 블록(I 또는 L)의 가장자리를 먼저 프레임 외곽에 고정하면 내부 빈틈을 쉽게 채울 수 있습니다.'}
          </div>
        )}
      </div>
    </div>
  );
};
