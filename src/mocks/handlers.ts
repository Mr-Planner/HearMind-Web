import { http, HttpResponse } from 'msw';

// --- API 응답 타입 정의 ---

interface LoginResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  access_token: string;
}

interface VoiceListItem {
  id: number;
  name: string;
  category_id: number;
  category_name: string;
  created_at: string;
  duration_sec: number;
  preview_text: string;
}

interface VoiceListResponse {
  voices: VoiceListItem[];
}

interface VoiceSegment {
  segment_id: number;
  text: string;
  start: number;
  segment_url: string;
  dB_list: number[];
  metrics: {
    dB: number;
    pitch_mean_hz: number;
    rate_wpm: number;
  } | null;
  feedback: string;
}

interface VoiceDetailResponse {
  id: number;
  voice_name: string;
  category_name: string;
  voice_created_at: string;
  voice_duration: number;
  scripts: {
    part: string;
    segments: VoiceSegment[];
  }[];
}

// --- 핸들러 정의 ---

export const handlers = [
  // 1. 로그인 API
  http.post('http://localhost:8080/login', () => {
    return HttpResponse.json<LoginResponse>({
      message: 'Login successful',
      user: {
        id: 1,
        name: '김민수 상담사',
        email: 'test@hearmind.com',
      },
      access_token: 'mock-access-token',
    });
  }),

  // 2. 회원가입 API
  http.post('http://localhost:8080/register', () => {
    return HttpResponse.json({
      message: 'Registration successful',
    });
  }),

  // 3. 상담 기록 목록 조회 API (/voice/list)
  http.get('http://localhost:8080/voice/list', () => {
    return HttpResponse.json<VoiceListResponse>({
      voices: [
        {
          id: 1,
          name: '학업 스트레스',
          category_id: 1,
          category_name: '긴장, 불안',
          created_at: '2024-12-15T05:00:00.000Z',
          duration_sec: 45 * 60,
          preview_text: '모의고사 성적이 계속 안 나와서...',
        },
        {
          id: 2,
          name: '대인관계 고민',
          category_id: 1,
          category_name: '우울, 침착',
          created_at: '2024-12-08T05:00:00.000Z',
          duration_sec: 50 * 60,
          preview_text: '친구들이 다 저를 피하는 것 같아요...',
        },
        {
          id: 3,
          name: '진로 고민',
          category_id: 1,
          category_name: '혼란, 불안',
          created_at: '2024-12-01T05:00:00.000Z',
          duration_sec: 40 * 60,
          preview_text: '앞으로 뭘 해야 할지 전혀 모르겠어요.',
        },
        {
          id: 4,
          name: '학업 성적 상담',
          category_id: 1,
          category_name: '긴장, 분노',
          created_at: '2024-11-24T05:00:00.000Z',
          duration_sec: 42 * 60,
          preview_text: '노력해도 결과가 안 나오니까 화가 나요.',
        },
        {
          id: 5,
          name: '가족 갈등',
          category_id: 1,
          category_name: '슬픔, 분노',
          created_at: '2024-11-17T05:00:00.000Z',
          duration_sec: 55 * 60,
          preview_text: '부모님과 말이 너무 안 통해요.',
        },
      ]
    });
  }),

  // 4. 상담 상세 분석 조회 API (/voice/:speechId)
  http.get('http://localhost:8080/voice/:speechId', ({ params }) => {
    const { speechId } = params;
    
    const generateMockDbList = (length: number, base: number) => {
        return Array.from({ length }, (_, i) => base + Math.sin(i * 0.5) * 10 + (Math.random() * 5));
    };

    return HttpResponse.json<VoiceDetailResponse>({
      id: Number(speechId),
      voice_name: '학업 스트레스 및 불안감',
      category_name: '김민수 · 5회차 상담',
      voice_created_at: '2024-12-17T05:30:00.000Z',
      voice_duration: 45 * 60,
      scripts: [
        {
          part: '상담 시작',
          segments: [
            {
              segment_id: 101,
              speaker: '상담사',
              text: '안녕하세요 민수님. 오늘은 어떤 이야기를 나눠볼까요?',
              start: 0,
              segment_url: '',
              dB_list: generateMockDbList(30, -30),
              metrics: null,
              feedback: '',
            },
            {
              segment_id: 102,
              speaker: '내담자',
              text: '안녕하세요... 요즘 학교 다니는 게 너무 힘들어요.',
              start: 10,
              segment_url: '',
              dB_list: generateMockDbList(40, -25),
              metrics: { dB: 45.2, pitch_mean_hz: 220.1, rate_wpm: 150.5 },
              feedback: '<일반 반응>\n내담자가 학교 생활에 대한 전반적인 어려움을 토로하고 있습니다.',
            },
            {
              segment_id: 103,
              speaker: '상담사',
              text: '많이 힘드신가 보네요. 어떤 부분이 가장 힘드신가요?',
              start: 25,
              segment_url: '',
              dB_list: generateMockDbList(20, -30),
              metrics: null,
              feedback: '',
            },
            {
              segment_id: 104,
              speaker: '내담자',
              isPeak: true,
              text: '모의고사 성적이 계속 안 나와서... 부모님도 계속 성적 얘기만 하시고...',
              start: 35,
              segment_url: '',
              dB_list: generateMockDbList(50, -15),
              metrics: { dB: 55.8, pitch_mean_hz: 245.8, rate_wpm: 168.5 },
              feedback: '<감정 피크 구간>\n"모의고사 성적" 키워드 언급 시점에서 불안 지수가 80%까지 급등했습니다. 목소리 톤이 높아지고 발화 속도가 평소보다 40% 증가했습니다.\n\n음성 특징: 목소리 떨림 증가, 호흡 불규칙, 말 끊김 빈번',
            },
            {
              segment_id: 105,
              speaker: '상담사',
              text: '성적 때문에 많이 스트레스를 받으시는군요.',
              start: 45,
              segment_url: '',
              dB_list: generateMockDbList(20, -30),
              metrics: null,
              feedback: '',
            },
            {
              segment_id: 106,
              speaker: '내담자',
              isPeak: true,
              text: '네... 친구들은 다 잘하는 것 같은데 저만 뒤처지는 것 같아요. 매일 공부해도 성적이 안 오르니까 제가 뭘 하든 안 될 것 같아요.',
              start: 55,
              segment_url: '',
              dB_list: generateMockDbList(60, -10),
              metrics: { dB: 58.0, pitch_mean_hz: 250.0, rate_wpm: 170.2 },
              feedback: '<감정 피크 구간>\n"저만 뒤처지는 것 같아요" 발언 시 슬픔과 무기력감이 동시에 나타났습니다. 자기 효능감 저하 및 학습된 무기력 패턴이 관찰됩니다.\n\n<상담 제안>\n- 성적보다 학습 과정에 초점을 맞추는 인지 재구성 필요\n- 작은 성취 경험을 통한 자기 효능감 회복\n- 부모님과의 의사소통 개선 전략 논의',
            },
            {
              segment_id: 107,
              speaker: '상담사',
              text: '노력해도 결과가 보이지 않으면 더 힘들 수 있어요. 그런 마음 충분히 이해해요.',
              start: 70,
              segment_url: '',
              dB_list: generateMockDbList(30, -30),
              metrics: null,
              feedback: '',
            },
            {
              segment_id: 108,
              speaker: '내담자',
              text: '감사합니다... 선생님이 이해해주시니까 조금 나은 것 같아요.',
              start: 85,
              segment_url: '',
              dB_list: generateMockDbList(30, -25),
              metrics: { dB: 42.0, pitch_mean_hz: 200.0, rate_wpm: 130.2 },
              feedback: '<일반 반응>\n내담자가 상담사의 공감에 긍정적으로 반응하며 안정을 찾고 있습니다.',
            }
          ]
        }
      ]
    });
  }),
];
