import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TetrisGame } from './components/TetrisGame';
import { MemoryTrainer } from './components/MemoryTrainer';
import { LogicPuzzle } from './components/LogicPuzzle';
import { BrainReport } from './components/BrainReport';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ActiveTab } from './types/game';
import { loadBrainStats, calculateBrainAge } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('TETRIS');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [brainAge, setBrainAge] = useState<number>(35);

  const refreshBrainAge = () => {
    const stats = loadBrainStats();
    const calculated = calculateBrainAge(stats);
    setBrainAge(calculated.estimatedAge);
  };

  useEffect(() => {
    refreshBrainAge();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar (Strict 3-Zone Contract) */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenGuide={() => setIsGuideOpen(true)}
        brainAge={brainAge}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start py-6 px-4">
        {activeTab === 'TETRIS' && <TetrisGame />}
        {activeTab === 'MEMORY' && <MemoryTrainer />}
        {activeTab === 'LOGIC' && <LogicPuzzle />}
        {activeTab === 'REPORT' && (
          <BrainReport
            onGoToGame={(tab) => {
              setActiveTab(tab);
            }}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>청춘 두뇌 테트리스 · Youth Brain Training Project</span>
          <span className="text-slate-400">
            순발력, 기억력, 논리력의 균형 잡힌 인지 향상을 돕습니다.
          </span>
        </div>
      </footer>

      {/* Guide & Rules Modal */}
      <HowToPlayModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
