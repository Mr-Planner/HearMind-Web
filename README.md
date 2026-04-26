# 🎙️ HearMind

> AI 기반 심리 상담 보조 플랫폼 — 상담사가 내담자의 감정을 더 깊이 이해할 수 있도록 돕습니다.


## 서비스 소개

**HearMind**는 심리 상담사를 위한 AI 상담 보조 웹 서비스입니다.  
상담 세션을 녹음·분석하여 대화 중 감정 변화, 음성 특성, 반복되는 감정 패턴을 시각화하고,  
내담자별 장기 리포트를 통해 상담의 효과와 방향성을 확인합니다.


## 주요 기능

### 1. 내담자 관리
- 내담자 목록 조회 및 등록
- 상담 주제·감정 태그 기반 빠른 파악

### 2. 상담 세션 기록
- 상담 내용 텍스트 변환 (STT)
- 상담사 / 내담자 발화 구분 대화 뷰
- 감정 피크 구간 자동 감지 및 하이라이트
- 상담 제안 자동 생성

### 3. 감정 분석
- 시간별 감정(불안, 분노, 슬픔, 중립) 변화 그래프
- 음성 특성 분석
- 구간별 상세 분석 및 음성 특징 설명

### 4. 내담자 감정 분석 리포트
- 전체 상담 기록 목록 및 감정 태그 조회
- 주요 상담 주제 빈도 차트
- 회차별 감정 변화 추이 그래프
- 긍정적 변화 / 주의 필요 영역 요약
- 대화 주제별 감정 반응 패턴 분석


## 화면 구성

| 화면 | 설명 |
|------|------|
| 메인 대시보드 | 전체 내담자 목록 및 상담 세션 카드 |
| 상담 상세 | 대화 내용 + 시간별 감정 변화 그래프 |
| 내담자 리포트 - 상담 기록 | 전체 상담 이력 및 감정 태그 |
| 내담자 리포트 - 종합 분석 | 감정 추이, 주제 분석, 패턴 요약 |


## 기술 스택

### Frontend
| 구분 | 기술 |
|------|------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM v7 |
| 상태 관리 | Zustand |
| 서버 상태 | TanStack Query (React Query) |
| API 통신 | Axios |
| 유효성 검증 | Zod |
| 스타일링 | Tailwind CSS v4 |
| 애니메이션 | Framer Motion |
| 차트 | Chart.js + react-chartjs-2 |
| 아이콘 | React Icons |
| 날짜 처리 | Day.js |
| 알림 | React Hot Toast |
| API Mocking | MSW (Mock Service Worker) |

## 프로젝트 구조

```
src/
├── assets/          # 이미지, 폰트 등 정적 파일
├── components/      # 공통 컴포넌트
├── pages/           # 페이지 컴포넌트
│   ├── Dashboard/   # 메인 대시보드
│   ├── Session/     # 상담 세션 상세
│   └── Report/      # 내담자 리포트
├── hooks/           # 커스텀 훅
├── store/           # Zustand 전역 상태
├── api/             # API 요청 함수
├── types/           # TypeScript 타입 정의
└── utils/           # 유틸리티 함수
```


## 시작하기

### 사전 요구사항
- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/Mr-Planner/HearMind-Web.git
cd HearMind-Web

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

