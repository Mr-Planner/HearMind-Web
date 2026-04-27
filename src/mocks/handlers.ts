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
  client_name: string;
  session_number: number;
}

interface VoiceListResponse {
  voices: VoiceListItem[];
}

interface VoiceSegment {
  segment_id: number;
  speaker?: string;
  isPeak?: boolean;
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

// --- 내담자(폴더) 데이터 ---
const mockClients = [
  { id: 1, name: '김민수', age: 19, totalSessions: 12, lastSession: '2024.12.15' },
  { id: 2, name: '이지은', age: 22, totalSessions: 8, lastSession: '2024.12.12' },
  { id: 3, name: '박준영', age: 25, totalSessions: 6, lastSession: '2024.12.10' },
];

// --- 상담 기록 데이터 (내담자별) ---
const allVoices: VoiceListItem[] = [
  // 김민수 (category_id: 1)
  {
    id: 1, name: '학업 스트레스', category_id: 1, category_name: '긴장, 불안',
    created_at: '2024-12-15T05:00:00.000Z', duration_sec: 45 * 60,
    preview_text: '모의고사 성적이 계속 안 나와서...', client_name: '김민수', session_number: 12,
  },
  {
    id: 2, name: '대인관계 고민', category_id: 1, category_name: '우울, 침착',
    created_at: '2024-12-08T05:00:00.000Z', duration_sec: 50 * 60,
    preview_text: '친구들이 다 저를 피하는 것 같아요...', client_name: '김민수', session_number: 11,
  },
  {
    id: 3, name: '진로 고민', category_id: 1, category_name: '혼란, 불안',
    created_at: '2024-12-01T05:00:00.000Z', duration_sec: 40 * 60,
    preview_text: '앞으로 뭘 해야 할지 전혀 모르겠어요.', client_name: '김민수', session_number: 10,
  },
  {
    id: 4, name: '학업 성적 상담', category_id: 1, category_name: '긴장, 분노',
    created_at: '2024-11-24T05:00:00.000Z', duration_sec: 42 * 60,
    preview_text: '노력해도 결과가 안 나오니까 화가 나요.', client_name: '김민수', session_number: 9,
  },
  {
    id: 5, name: '가족 갈등', category_id: 1, category_name: '슬픔, 분노',
    created_at: '2024-11-17T05:00:00.000Z', duration_sec: 55 * 60,
    preview_text: '부모님과 말이 너무 안 통해요.', client_name: '김민수', session_number: 8,
  },
  // 이지은 (category_id: 2)
  {
    id: 6, name: '직장 적응 어려움', category_id: 2, category_name: '불안, 긴장',
    created_at: '2024-12-12T05:00:00.000Z', duration_sec: 48 * 60,
    preview_text: '새 직장에 적응이 너무 어려워요...', client_name: '이지은', session_number: 8,
  },
  {
    id: 7, name: '상사와의 갈등', category_id: 2, category_name: '분노, 억울함',
    created_at: '2024-12-05T05:00:00.000Z', duration_sec: 52 * 60,
    preview_text: '상사가 계속 제 의견을 무시해요.', client_name: '이지은', session_number: 7,
  },
  {
    id: 8, name: '자존감 회복', category_id: 2, category_name: '슬픔, 무기력',
    created_at: '2024-11-28T05:00:00.000Z', duration_sec: 44 * 60,
    preview_text: '제가 정말 이 일에 맞는 건지 모르겠어요.', client_name: '이지은', session_number: 6,
  },
  // 박준영 (category_id: 3)
  {
    id: 9, name: '취업 준비 불안', category_id: 3, category_name: '혼란, 불안',
    created_at: '2024-12-10T05:00:00.000Z', duration_sec: 46 * 60,
    preview_text: '취업 준비가 끝이 안 보여요...', client_name: '박준영', session_number: 6,
  },
  {
    id: 10, name: '면접 스트레스', category_id: 3, category_name: '긴장, 공포',
    created_at: '2024-12-03T05:00:00.000Z', duration_sec: 38 * 60,
    preview_text: '면접만 생각하면 손이 떨려요.', client_name: '박준영', session_number: 5,
  },
  {
    id: 11, name: '진로 관련 대화', category_id: 3, category_name: '혼란, 불안',
    created_at: '2024-11-26T05:00:00.000Z', duration_sec: 40 * 60,
    preview_text: '미래에 대한 불확실성으로 감정 기복이 큼.', client_name: '박준영', session_number: 4,
  },
];

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

  // 3. 폴더(내담자) 목록 조회 API
  http.get('http://localhost:8080/category', () => {
    return HttpResponse.json(
      mockClients.map(c => ({ id: c.id, name: c.name }))
    );
  }),

  // 4. 폴더(내담자) 추가 API
  http.post('http://localhost:8080/category', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const name = params.get('name') || '새 내담자';
    const newId = Math.max(...mockClients.map(c => c.id)) + 1;
    const newClient = { id: newId, name, age: 0, totalSessions: 0, lastSession: '-' };
    mockClients.push(newClient);
    return HttpResponse.json({ id: newId, name });
  }),

  // 5. 폴더(내담자) 수정 API
  http.put('http://localhost:8080/category/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.text();
    const urlParams = new URLSearchParams(body);
    const name = urlParams.get('name') || '';
    const client = mockClients.find(c => c.id === Number(id));
    if (client) client.name = name;
    return HttpResponse.json({ id: Number(id), name });
  }),

  // 6. 폴더(내담자) 삭제 API
  http.delete('http://localhost:8080/category/:id', ({ params }) => {
    const { id } = params;
    const idx = mockClients.findIndex(c => c.id === Number(id));
    if (idx !== -1) mockClients.splice(idx, 1);
    return HttpResponse.json({ message: 'Deleted' });
  }),

  // 7. 상담 기록 목록 조회 API (/voice/list)
  http.get('http://localhost:8080/voice/list', ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');

    let filtered = allVoices;
    if (categoryId) {
      filtered = allVoices.filter(v => v.category_id === Number(categoryId));
    }

    return HttpResponse.json<VoiceListResponse>({
      voices: filtered,
    });
  }),

  // 8. 상담 상세 분석 조회 API (/voice/:speechId)
  http.get('http://localhost:8080/voice/:speechId', ({ params }) => {
    const { speechId } = params;

    const generateMockDbList = (length: number, base: number) => {
      return Array.from({ length }, (_, i) => base + Math.sin(i * 0.5) * 10 + (Math.random() * 5));
    };

    // Find voice to get context
    const voice = allVoices.find(v => v.id === Number(speechId));
    const clientName = voice?.client_name || '김민수';
    const sessionNum = voice?.session_number || 5;

    return HttpResponse.json<VoiceDetailResponse>({
      id: Number(speechId),
      voice_name: voice?.name || '학업 스트레스 및 불안감',
      category_name: `${clientName} · ${sessionNum}회차 상담`,
      voice_created_at: voice?.created_at || '2024-12-17T05:30:00.000Z',
      voice_duration: voice?.duration_sec || 45 * 60,
      scripts: [
        {
          part: '상담 시작',
          segments: [
            {
              segment_id: 101,
              speaker: '상담사',
              text: `안녕하세요 ${clientName}님. 오늘은 어떤 이야기를 나눠볼까요?`,
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

  // 9. 내담자 분석 리포트 API (/client/:clientId/report)
  http.get('http://localhost:8080/client/:clientId/report', ({ params }) => {
    const { clientId } = params;
    const client = mockClients.find(c => c.id === Number(clientId));
    const clientVoices = allVoices.filter(v => v.category_id === Number(clientId));

    if (!client) {
      return HttpResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 리포트 데이터 (내담자별 다르게)
    const reportDataMap: Record<number, any> = {
      1: {
        summary: {
          name: '김민수', age: 19, totalSessions: 12, lastSession: '2024.12.15',
        },
        topicChart: {
          labels: ['학업', '대인관계', '진로', '가족'],
          data: [5, 3, 2, 2],
        },
        emotionTrend: {
          labels: ['1회', '3회', '5회', '7회', '9회', '11회'],
          anxiety: [70, 65, 55, 45, 35, 30],
          anger: [20, 25, 30, 25, 30, 20],
          sadness: [30, 25, 20, 25, 20, 15],
          joy: [10, 15, 25, 30, 40, 50],
        },
        analysisText: '분석: 전반적으로 불안 수치가 감소하고 긍정적 감정(기쁨)이 증가하는 추세를 보입니다. 상담이 진행될수록 내담자의 심리적 안정도가 향상되고 있음을 나타냅니다.',
        positiveChanges: [
          '불안 수치 33% 감소',
          '자기 표현 능력 향상',
          '감정 조절 능력 개선',
        ],
        attentionAreas: [
          '학업 스트레스 관리',
          '시험 불안 대처 방법',
          '완벽주의 성향 완화',
        ],
        topicPatterns: [
          {
            color: '#c4b5fd',
            title: '학업 관련 대화',
            emotions: '긴장, 불안, 분노',
            description: '특히 "모의고사 성적", "대학 입시" 키워드에서 목소리 톤이 높아지고 발화 속도가 빨라지는 경향. 심호흡을 유도하거나 주제 전환이 필요한 시점.',
          },
          {
            color: '#a78bfa',
            title: '대인관계 대화',
            emotions: '우울, 슬픔',
            description: '친구 관계 이야기에서 목소리 톤이 낮아지고 말의 속도가 느려짐. 공감적 경청과 긍정적 피드백이 효과적.',
          },
          {
            color: '#8b5cf6',
            title: '진로 관련 대화',
            emotions: '혼란, 불안, 피로',
            description: '미래에 대한 불확실성으로 감정 기복이 큼. 구체적인 실행 계획 수립 시 안정감을 보임.',
          },
        ],
      },
      2: {
        summary: {
          name: '이지은', age: 22, totalSessions: 8, lastSession: '2024.12.12',
        },
        topicChart: {
          labels: ['직장', '대인관계', '자존감', '미래'],
          data: [4, 2, 1, 1],
        },
        emotionTrend: {
          labels: ['1회', '2회', '3회', '4회', '5회', '6회', '7회', '8회'],
          anxiety: [60, 55, 50, 45, 40, 38, 35, 30],
          anger: [40, 45, 50, 40, 35, 30, 25, 20],
          sadness: [35, 30, 25, 30, 25, 20, 20, 15],
          joy: [15, 20, 20, 25, 30, 35, 40, 45],
        },
        analysisText: '분석: 직장 내 갈등 상황에서 분노 수치가 초반에 높았으나 점진적으로 감소하고 있습니다. 감정 조절 기술 습득에 긍정적인 반응을 보이고 있습니다.',
        positiveChanges: [
          '분노 수치 50% 감소',
          '갈등 상황 대처 능력 향상',
          '자기 표현력 개선',
        ],
        attentionAreas: [
          '직장 내 경계 설정',
          '자존감 회복 프로그램',
          '스트레스 관리 기법',
        ],
        topicPatterns: [
          {
            color: '#c4b5fd',
            title: '직장 관련 대화',
            emotions: '분노, 억울함',
            description: '상사와의 갈등 이야기에서 감정이 격앙되는 경향. 감정 분리 기법이 효과적.',
          },
          {
            color: '#a78bfa',
            title: '자존감 관련 대화',
            emotions: '슬픔, 무기력',
            description: '자기 가치에 대한 의문이 반복적으로 나타남. 긍정 경험 회상 기법 활용 권장.',
          },
        ],
      },
      3: {
        summary: {
          name: '박준영', age: 25, totalSessions: 6, lastSession: '2024.12.10',
        },
        topicChart: {
          labels: ['취업', '진로', '자존감', '가족'],
          data: [3, 2, 1, 0],
        },
        emotionTrend: {
          labels: ['1회', '2회', '3회', '4회', '5회', '6회'],
          anxiety: [75, 70, 60, 55, 45, 40],
          anger: [15, 20, 15, 10, 10, 5],
          sadness: [25, 20, 25, 20, 15, 10],
          joy: [5, 10, 15, 25, 35, 45],
        },
        analysisText: '분석: 취업 준비 과정에서의 불안이 주요 이슈이나 상담 진행에 따라 불안 수치가 꾸준히 감소하고 있습니다. 구체적인 계획 수립 후 자신감이 회복되는 추세입니다.',
        positiveChanges: [
          '불안 수치 47% 감소',
          '구체적 계획 수립 능력 향상',
          '면접 자신감 회복',
        ],
        attentionAreas: [
          '면접 불안 관리',
          '거절에 대한 내성 키우기',
          '장기적 진로 탐색',
        ],
        topicPatterns: [
          {
            color: '#c4b5fd',
            title: '취업 관련 대화',
            emotions: '혼란, 불안, 긴장',
            description: '면접, 이력서 관련 키워드에서 긴장감이 급격히 상승. 호흡 조절과 시뮬레이션 훈련이 효과적.',
          },
          {
            color: '#a78bfa',
            title: '진로 관련 대화',
            emotions: '혼란, 불안, 피로',
            description: '미래에 대한 불확실성으로 감정 기복이 큼. 구체적인 실행 계획 수립 시 안정감을 보임.',
          },
        ],
      },
    };

    const reportData = reportDataMap[Number(clientId)] || reportDataMap[1];

    return HttpResponse.json({
      ...reportData,
      sessions: clientVoices.map(v => ({
        id: v.id,
        name: v.name,
        category_name: v.category_name,
        created_at: v.created_at,
        duration_sec: v.duration_sec,
        session_number: v.session_number,
      })),
    });
  }),
];
