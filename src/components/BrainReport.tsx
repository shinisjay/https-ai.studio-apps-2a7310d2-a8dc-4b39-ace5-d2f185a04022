import React, { useState, useEffect } from 'react';
import { Activity, Brain, Layers, Zap, Award, BookOpen, RotateCcw } from 'lucide-react';
import { loadBrainStats, calculateBrainAge, BRAIN_HEALTH_TIPS, saveBrainStats, INITIAL_BRAIN_STATS } from '../utils/storage';
import { BrainStats } from '../types/game';

interface BrainReportProps {
  onGoToGame: (tab: 'TETRIS' | 'MEMORY' | 'LOGIC') => void;
}

export const BrainReport: React.FC<BrainReportProps> = ({ onGoToGame }) => {
  const [stats, setStats] = useState<BrainStats>(INITIAL_BRAIN_STATS);

  useEffect(() => {
    setStats(loadBrainStats());
  }, []);

  const ageData = calculateBrainAge(stats);

  const handleResetData = () => {
    if (window.confirm('모든 두뇌 트레이닝 기록을 초기화하시겠습니까?')) {
      saveBrainStats(INITIAL_BRAIN_STATS);
      setStats(INITIAL_BRAIN_STATS);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto w-full p-4">
      {/* Top Header Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
              <Brain className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">청춘 두뇌 인지 검사</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">종합 분석 리포트</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-0.5">
                나의 청춘 뇌 나이: <span className="text-emerald-400 font-mono">{ageData.estimatedAge}세</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-medium">{ageData.grade}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-xs text-slate-400">청춘 활력 지수</span>
            <span className="text-3xl font-black font-mono text-cyan-400 tabular-nums">
              {ageData.overallVitality} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Cognitive Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
        {/* Domain 1: 순발력 / 공간회전 (테트리스) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> 순발력 & 공간회전
              </span>
              <span className="text-xs font-mono font-bold text-white">{ageData.agilityScore}점</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-cyan-500 h-full transition-all duration-500"
                style={{ width: `${ageData.agilityScore}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>테트리스 최고점</span>
                <span className="font-mono text-white tabular-nums">{stats.tetrisHighScore}점</span>
              </div>
              <div className="flex justify-between">
                <span>총 제거 라인</span>
                <span className="font-mono text-white tabular-nums">{stats.totalLinesCleared}줄</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToGame('TETRIS')}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
          >
            테트리스로 훈련하기
          </button>
        </div>

        {/* Domain 2: 작업 기억력 (패턴 기억) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> 작업 기억 용량
              </span>
              <span className="text-xs font-mono font-bold text-white">{ageData.memoryScore}점</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${ageData.memoryScore}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>기억력 최고 레벨</span>
                <span className="font-mono text-white tabular-nums">Lv.{stats.memoryMaxLevel}</span>
              </div>
              <div className="flex justify-between">
                <span>패턴 최고 점수</span>
                <span className="font-mono text-white tabular-nums">{stats.memoryHighScore}점</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToGame('MEMORY')}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
          >
            기억력 훈련하기
          </button>
        </div>

        {/* Domain 3: 공간 논리력 (블록 핏) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> 기하 논리 추론
              </span>
              <span className="text-xs font-mono font-bold text-white">{ageData.logicScore}점</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${ageData.logicScore}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>해결한 퍼즐 수</span>
                <span className="font-mono text-white tabular-nums">
                  {stats.logicCompletedLevels.length} / 9단계
                </span>
              </div>
              <div className="flex justify-between">
                <span>공간 추론 달성률</span>
                <span className="font-mono text-white tabular-nums">{ageData.logicScore}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onGoToGame('LOGIC')}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
          >
            논리 퍼즐 도전하기
          </button>
        </div>
      </div>

      {/* Brain Science Health Tips */}
      <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>청춘 두뇌 건강 생활 수칙</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BRAIN_HEALTH_TIPS.map((tip, idx) => (
            <div key={idx} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-200 mb-1">{tip.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{tip.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Data Button */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          두뇌 기록 초기화
        </button>
      </div>
    </div>
  );
};
