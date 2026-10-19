import React from 'react';
import { X, Keyboard, Smartphone, Brain, Layers, Zap } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-sm font-black">
              가이드
            </span>
            <h2 className="text-lg font-bold text-white">청춘 두뇌 게임 플레이 가이드</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: 테트리스 조작법 */}
        <div className="space-y-6 text-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
              <Zap className="w-4 h-4" />
              <span>1. 테트리스 게임 조작법</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Keyboard className="w-3.5 h-3.5 text-cyan-400" /> 키보드 단축키
                </span>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li><strong className="text-white font-mono">← / →</strong> : 좌우 이동</li>
                  <li><strong className="text-white font-mono">↓</strong> : 천천히 내리기 (소프트 드롭)</li>
                  <li><strong className="text-white font-mono">스페이스바</strong> : 즉시 낙하 (하드 드롭)</li>
                  <li><strong className="text-white font-mono">↑ 또는 X</strong> : 시계방향 회전</li>
                  <li><strong className="text-white font-mono">Z</strong> : 반시계방향 회전</li>
                  <li><strong className="text-white font-mono">C 또는 Shift</strong> : 블록 보관 (홀드)</li>
                  <li><strong className="text-white font-mono">P 또는 ESC</strong> : 일시정지</li>
                  <li><strong className="text-white font-mono">R</strong> : 재도전</li>
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> 모바일 & 마우스 터치
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  화면 하단에 배치된 인체공학적 조작 패드를 눌러 터치스크린이나 마우스 클릭만으로 모든 동작을 직관적으로 제어할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: 기억력 트레이닝 */}
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
              <Brain className="w-4 h-4" />
              <span>2. 기억력 트레이닝 (순간 패턴 기억)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              타일이 반짝이는 순서나 위치를 눈과 뇌에 순간적으로 각인한 뒤, 정확히 재현하는 훈련입니다.
            </p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li><strong className="text-slate-200">순서 기억 모드</strong>: 빛난 순서(1번, 2번, 3번...)대로 타일을 누릅니다.</li>
              <li><strong className="text-slate-200">공간 매트릭스 모드</strong>: 동시에 깜빡인 모든 타일의 위치를 기억하여 터치합니다.</li>
              <li>단계가 오를수록 격자 크기가 3x3에서 4x4, 5x5로 확장되며 작업 기억 용량이 단련됩니다.</li>
            </ul>
          </div>

          {/* Section 3: 공간 논리 퍼즐 */}
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
              <Layers className="w-4 h-4" />
              <span>3. 공간 논리 퍼즐 (블록 핏)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-2">
              주어진 타겟 실루엣 프레임에 제공된 테트리스 블록들을 90도 회전시켜 빈틈없이 100% 채우는 기하 추론 퍼즐입니다.
            </p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li>블록을 선택한 후 <strong className="text-slate-200">90° 회전</strong> 버튼으로 방향을 변경합니다.</li>
              <li>배치하고자 하는 판의 칸을 클릭하면 조각이 맞춰집니다.</li>
              <li>이미 놓인 조각을 클릭하면 언제든 다시 손으로 회수할 수 있습니다.</li>
            </ul>
          </div>

          {/* Section 4: 청춘 두뇌 나이 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs font-bold text-white block mb-1">
              청춘 두뇌 나이(Brain Age Index)란?
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              신경심리학적 인지 평가 기준에 따라 테트리스의 순발력, 패턴 기억의 단기 작업 기억 스팬, 공간 논리 퍼즐의 기하 추론 완료율을 종합하여 20세~68세 사이의 두뇌 활력 나이로 정량화합니다. 매일 5~10분간 플레이하여 두뇌를 20대로 유지해 보세요!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
          >
            확인 및 게임 시작
          </button>
        </div>
      </div>
    </div>
  );
};
