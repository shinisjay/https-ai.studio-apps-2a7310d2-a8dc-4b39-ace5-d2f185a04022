import { BrainStats } from '../types/game';

const STORAGE_KEY = 'youth_brain_tetris_stats_v1';

export const INITIAL_BRAIN_STATS: BrainStats = {
  tetrisHighScore: 0,
  totalLinesCleared: 0,
  totalGamesPlayed: 0,
  memoryHighScore: 0,
  memoryMaxLevel: 1,
  logicCompletedLevels: [],
  brainEnergyPoints: 100,
  lastTrainedDate: new Date().toISOString().split('T')[0],
};

export function loadBrainStats(): BrainStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_BRAIN_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_BRAIN_STATS,
      ...parsed,
    };
  } catch {
    return INITIAL_BRAIN_STATS;
  }
}

export function saveBrainStats(stats: BrainStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save brain stats', err);
  }
}

// Calculate Estimated Youth Brain Age (청춘 두뇌 나이)
// Based on cognitive performance in Tetris, Memory, and Spatial Logic
export function calculateBrainAge(stats: BrainStats): {
  estimatedAge: number;
  grade: string;
  agilityScore: number; // 0-100 (Tetris)
  memoryScore: number;  // 0-100 (Flash pattern)
  logicScore: number;   // 0-100 (Fit puzzles)
  overallVitality: number; // 0-100
} {
  // Tetris Agility: up to 100 based on score and lines
  const agilityScore = Math.min(
    100,
    Math.round((Math.min(stats.tetrisHighScore, 15000) / 15000) * 60 + (Math.min(stats.totalLinesCleared, 100) / 100) * 40)
  );

  // Memory Score: based on max level achieved and high score in pattern memory
  const memoryScore = Math.min(
    100,
    Math.round((Math.min(stats.memoryMaxLevel, 12) / 12) * 60 + (Math.min(stats.memoryHighScore, 3000) / 3000) * 40)
  );

  // Logic Score: based on completed logic puzzle levels (15 total)
  const logicScore = Math.min(
    100,
    Math.round((Math.min(stats.logicCompletedLevels.length, 15) / 15) * 100)
  );

  const overallVitality = Math.round(agilityScore * 0.35 + memoryScore * 0.35 + logicScore * 0.3);

  // Age curve: 0 vitality -> ~68 yrs, 50 vitality -> ~38 yrs, 100 vitality -> 20 yrs
  const estimatedAge = Math.max(20, Math.min(68, Math.round(68 - (overallVitality * 0.48))));

  let grade = '청춘 두뇌 꿈나무';
  if (estimatedAge <= 24) {
    grade = '천재적 청춘 두뇌 (상위 1%)';
  } else if (estimatedAge <= 29) {
    grade = '활력 넘치는 청춘 두뇌 (상위 5%)';
  } else if (estimatedAge <= 35) {
    grade = '민첩하고 총명한 두뇌 (상위 20%)';
  } else if (estimatedAge <= 45) {
    grade = '건강하게 유지되는 두뇌';
  } else {
    grade = '두뇌 스트레칭이 필요한 상태';
  }

  return {
    estimatedAge,
    grade,
    agilityScore,
    memoryScore,
    logicScore,
    overallVitality,
  };
}

export const BRAIN_HEALTH_TIPS = [
  {
    title: '테트리스 효과 (Tetris Effect)',
    content: '테트리스처럼 시공간 회전과 빠른 결정을 반복하면 대뇌 피질의 효율성이 높아지고 신경 가소성이 자극됩니다.',
  },
  {
    title: '작업 기억(Working Memory)의 힘',
    content: '정보를 머릿속에 잠시 담아두고 조작하는 작업 기억력 훈련은 나이에 상관없이 집중력과 문제해결력을 20% 이상 향상시킵니다.',
  },
  {
    title: '공간 추론과 치매 예방',
    content: '블록을 머릿속으로 회전시키고 맞추는 공간 논리 퍼즐은 뇌의 두정엽과 전두엽을 활성화하여 뇌 노화를 늦춥니다.',
  },
  {
    title: '매일 10분의 두뇌 청춘 습관',
    content: '짧고 집중적인 두뇌 게임은 뇌 혈류량을 늘리고 도파민 분비를 촉진해 일상의 활력과 두뇌 명료함을 지켜줍니다.',
  },
];
