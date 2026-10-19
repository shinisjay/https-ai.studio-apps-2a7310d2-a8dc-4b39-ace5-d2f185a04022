import React from 'react';
import { Volume2, VolumeX, HelpCircle, Activity } from 'lucide-react';
import { ActiveTab } from '../types/game';
import { sounds } from '../utils/audio';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenGuide: () => void;
  brainAge: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenGuide,
  brainAge,
}) => {
  const [isMuted, setIsMuted] = React.useState(sounds.getMuted());

  const toggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onTabChange('TETRIS')}
          className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-black">
            뇌
          </span>
          <span>청춘 두뇌 테트리스</span>
        </button>
      </div>

      {/* Zone 2: Navigation Links (Single-line, 4 items) */}
      <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium text-slate-400 overflow-x-auto">
        <button
          onClick={() => onTabChange('TETRIS')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'TETRIS'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent'
          }`}
        >
          테트리스 메인
        </button>
        <button
          onClick={() => onTabChange('MEMORY')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'MEMORY'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent'
          }`}
        >
          기억력 훈련
        </button>
        <button
          onClick={() => onTabChange('LOGIC')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'LOGIC'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent'
          }`}
        >
          공간 논리 퍼즐
        </button>
        <button
          onClick={() => onTabChange('REPORT')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'REPORT'
              ? 'border-emerald-400 text-white font-semibold'
              : 'border-transparent'
          }`}
        >
          두뇌 분석 리포트
        </button>
      </nav>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-400 font-mono tabular-nums bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded">
          <Activity className="w-3.5 h-3.5" />
          <span>청춘 뇌 나이 {brainAge}세</span>
        </div>

        <button
          onClick={toggleSound}
          title={isMuted ? '소리 켜기' : '소리 끄기'}
          aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
          className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-emerald-950"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>도움말</span>
        </button>
      </div>
    </header>
  );
};
