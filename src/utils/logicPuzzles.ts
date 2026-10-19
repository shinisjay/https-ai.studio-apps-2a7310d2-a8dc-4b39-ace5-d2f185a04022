import { LogicStage } from '../types/game';

export const LOGIC_STAGES: LogicStage[] = [
  {
    id: 1,
    title: '두뇌 워밍업: 2×4 직사각형',
    difficulty: '초급',
    description: 'I 블록과 O 블록을 회전하여 8칸의 직사각형 프레임을 빈틈없이 채워보세요.',
    targetGrid: [
      [true, true, true, true],
      [true, true, true, true],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'I',
        shape: [[1, 1, 1, 1]],
        color: '#06B6D4',
      },
      {
        id: 'p2',
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: '#EAB308',
      },
    ],
  },
  {
    id: 2,
    title: '기역(L)과 니은(J)의 대칭 결합',
    difficulty: '초급',
    description: '서로 대칭되는 두 블록을 회전시켜 2×4 공간을 완성하세요.',
    targetGrid: [
      [true, true, true, true],
      [true, true, true, true],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'L',
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
        color: '#F97316',
      },
      {
        id: 'p2',
        type: 'J',
        shape: [
          [0, 1],
          [0, 1],
          [1, 1],
        ],
        color: '#3B82F6',
      },
    ],
  },
  {
    id: 3,
    title: '지그재그 결합 (S + Z)',
    difficulty: '초급',
    description: '경사진 S블록과 Z블록의 요철을 맞물려 계단형 8칸을 채워보세요.',
    targetGrid: [
      [true, true, false, false],
      [true, true, true, true],
      [false, false, true, true],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'S',
        shape: [
          [0, 1, 1],
          [1, 1, 0],
        ],
        color: '#10B981',
      },
      {
        id: 'p2',
        type: 'Z',
        shape: [
          [1, 1, 0],
          [0, 1, 1],
        ],
        color: '#EF4444',
      },
    ],
  },
  {
    id: 4,
    title: 'T-스핀 논리 결합',
    difficulty: '초급',
    description: 'T블록의 돌출부와 L블록의 홈을 추론하여 결합하세요.',
    targetGrid: [
      [true, true, true, false],
      [true, true, true, true],
      [false, false, true, false],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'T',
        shape: [
          [1, 1, 1],
          [0, 1, 0],
        ],
        color: '#A855F7',
      },
      {
        id: 'p2',
        type: 'L',
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
        color: '#F97316',
      },
    ],
  },
  {
    id: 5,
    title: '3×4 직사각형 논리 분할',
    difficulty: '중급',
    description: '3개의 블록(I, O, L)을 조합하여 12칸의 직사각형을 완성하세요.',
    targetGrid: [
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'I',
        shape: [[1, 1, 1, 1]],
        color: '#06B6D4',
      },
      {
        id: 'p2',
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: '#EAB308',
      },
      {
        id: 'p3',
        type: 'L',
        shape: [
          [1, 0, 0, 0],
          [1, 1, 1, 1], // Can be standard L or customized
        ],
        color: '#F97316',
      },
    ],
  },
  {
    id: 6,
    title: '십자(Cross) 대칭 퍼즐',
    difficulty: '중급',
    description: '중앙 집중식 십자형 격자에 3개의 블록을 조화롭게 배치하세요.',
    targetGrid: [
      [false, true, true, false],
      [true, true, true, true],
      [true, true, true, true],
      [false, true, true, false],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'T',
        shape: [
          [1, 1, 1],
          [0, 1, 0],
        ],
        color: '#A855F7',
      },
      {
        id: 'p2',
        type: 'T',
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        color: '#C084FC',
      },
      {
        id: 'p3',
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: '#EAB308',
      },
    ],
  },
  {
    id: 7,
    title: '뇌세포(Brain Frame) 액자 퍼즐',
    difficulty: '중급',
    description: '가운데가 비어있는 4×4 테두리(12칸)를 3개 블록으로 감싸보세요.',
    targetGrid: [
      [true, true, true, true],
      [true, false, false, true],
      [true, false, false, true],
      [true, true, true, true],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'I',
        shape: [[1, 1, 1, 1]],
        color: '#06B6D4',
      },
      {
        id: 'p2',
        type: 'I',
        shape: [
          [1],
          [1],
          [1],
          [1],
        ],
        color: '#22D3EE',
      },
      {
        id: 'p3',
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: '#EAB308',
      },
    ],
  },
  {
    id: 8,
    title: '4×4 완전 정사각형 정복',
    difficulty: '고급',
    description: '4개의 테트로미노 블록을 정밀하게 조합하여 16칸의 정방형을 빈틈없이 채우세요.',
    targetGrid: [
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'O',
        shape: [
          [1, 1],
          [1, 1],
        ],
        color: '#EAB308',
      },
      {
        id: 'p2',
        type: 'I',
        shape: [[1, 1, 1, 1]],
        color: '#06B6D4',
      },
      {
        id: 'p3',
        type: 'L',
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
        color: '#F97316',
      },
      {
        id: 'p4',
        type: 'J',
        shape: [
          [0, 1],
          [0, 1],
          [1, 1],
        ],
        color: '#3B82F6',
      },
    ],
  },
  {
    id: 9,
    title: '두뇌 피라미드 타워',
    difficulty: '고급',
    description: '상단에서 하단으로 넓어지는 16칸 피라미드 구조를 4개 블록으로 완벽하게 완성하세요.',
    targetGrid: [
      [false, false, true, true, false, false],
      [false, true, true, true, true, false],
      [true, true, true, true, true, true],
      [false, true, true, true, true, false],
    ],
    availablePieces: [
      {
        id: 'p1',
        type: 'T',
        shape: [
          [1, 1, 1],
          [0, 1, 0],
        ],
        color: '#A855F7',
      },
      {
        id: 'p2',
        type: 'T',
        shape: [
          [0, 1, 0],
          [1, 1, 1],
        ],
        color: '#C084FC',
      },
      {
        id: 'p3',
        type: 'S',
        shape: [
          [0, 1, 1],
          [1, 1, 0],
        ],
        color: '#10B981',
      },
      {
        id: 'p4',
        type: 'Z',
        shape: [
          [1, 1, 0],
          [0, 1, 1],
        ],
        color: '#EF4444',
      },
    ],
  },
];
