import { useQuery } from "@tanstack/react-query";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useState } from "react";
import { Bar, Line } from 'react-chartjs-2';
import { FaChevronLeft } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { fetchClientReport } from "../../service/speechApi";

dayjs.extend(utc);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Tab = 'analysis' | 'history';

function ClientReportPage() {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('analysis');

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['clientReport', clientId],
    queryFn: () => fetchClientReport(clientId!),
    enabled: !!clientId,
  });

  if (isLoading) return (
    <div className="flex flex-col h-full bg-background overflow-y-auto px-8 py-8">
      <div className="max-w-[900px] mx-auto w-full space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 mt-6">
          <div className="h-5 bg-muted rounded w-1/5" />
          <div className="grid grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="space-y-2"><div className="h-3 bg-muted rounded w-12" /><div className="h-5 bg-muted rounded w-20" /></div>)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6"><div className="h-[200px] bg-muted rounded" /></div>
        <div className="bg-card border border-border rounded-xl p-6"><div className="h-[280px] bg-muted rounded" /></div>
      </div>
    </div>
  );

  if (isError || !report) return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">리포트를 불러올 수 없습니다</h3>
      <p className="text-sm text-muted-foreground mb-4">데이터를 가져오는 중 오류가 발생했습니다.</p>
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
      >
        돌아가기
      </button>
    </div>
  );

  const { summary, topicChart, emotionTrend, analysisText, positiveChanges, attentionAreas, topicPatterns, sessions } = report;

  // --- Bar Chart ---
  const barData = {
    labels: topicChart.labels,
    datasets: [{
      data: topicChart.data,
      backgroundColor: 'rgba(196, 181, 253, 0.6)',
      borderColor: '#c4b5fd',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  // --- Line Chart ---
  const lineData = {
    labels: emotionTrend.labels,
    datasets: [
      {
        label: '중립',
        data: emotionTrend.neutral,
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: '분노',
        data: emotionTrend.anger,
        borderColor: '#f87171',
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: '슬픔',
        data: emotionTrend.sadness,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: '행복',
        data: emotionTrend.happiness,
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 20 } } },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors">
              <FaChevronLeft size={16} className="text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">내담자 감정 분석 리포트</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{summary.name} · {summary.age}세 · 총 {summary.totalSessions}회 상담</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
          >
            새 상담 시작
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-5">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-2 text-sm font-medium cursor-pointer transition-colors
              ${activeTab === 'analysis'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            종합 분석
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-sm font-medium cursor-pointer transition-colors
              ${activeTab === 'history'
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            상담 기록
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-8 py-8 max-w-[900px] mx-auto w-full">
        {activeTab === 'analysis' ? (
          <div className="space-y-8">
            {/* 내담자 요약 */}
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">내담자 요약</h2>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">이름</p>
                  <p className="text-base font-semibold text-foreground">{summary.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">나이</p>
                  <p className="text-base font-semibold text-foreground">{summary.age}세</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">총 상담 횟수</p>
                  <p className="text-base font-semibold text-foreground">{summary.totalSessions}회</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">최근 상담일</p>
                  <p className="text-base font-semibold text-foreground">{summary.lastSession}</p>
                </div>
              </div>
            </section>

            {/* 주요 상담 주제 */}
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">주요 상담 주제</h2>
              <div className="h-[200px]">
                <Bar data={barData} options={barOptions} />
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                분석: 내담자는 <span className="font-bold text-foreground">{topicChart.labels[0]} 관련 주제</span>에서 가장 많은 상담을 진행했습니다 ({topicChart.data[0]}회). 특히 시험 기간이나 성적 발표 전후로 상담 빈도가 증가하는 경향을 보입니다.
              </p>
            </section>

            {/* 감정 변화 추이 */}
            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">감정 변화 추이</h2>
              <div className="h-[280px]">
                <Line data={lineData} options={lineOptions} />
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                {analysisText}
              </p>
            </section>

            {/* 긍정적 변화 / 주의 필요 영역 */}
            <div className="grid grid-cols-2 gap-6">
              <section className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">😊</span>
                  <h3 className="font-bold text-foreground">긍정적 변화</h3>
                </div>
                <ul className="space-y-2">
                  {positiveChanges.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">⊙</span>
                  <h3 className="font-bold text-foreground">주의 필요 영역</h3>
                </div>
                <ul className="space-y-2">
                  {attentionAreas.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-destructive mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* 대화 주제별 감정 반응 패턴 */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-4">대화 주제별 감정 반응 패턴</h2>
              <div className="space-y-4">
                {topicPatterns.map((pattern: any, i: number) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-5 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: pattern.color }} />
                    <div className="pl-4">
                      <h4 className="font-bold text-foreground mb-1">{pattern.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">주요 감정: {pattern.emotions}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{pattern.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* 상담 기록 탭 */
          <section className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-6">전체 상담 기록</h2>
            <div className="space-y-3">
              {sessions.map((session: any) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/${clientId}/${session.id}`)}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-[15px]">{session.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>📅 {dayjs.utc(session.created_at).format('YYYY.MM.DD')}</span>
                        <span>{Math.floor(session.duration_sec / 60)}분</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-primary/10 text-[#8b5cf6] text-[12px] font-semibold rounded-md">
                    {session.category_name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ClientReportPage;
