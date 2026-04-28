import { useQuery } from "@tanstack/react-query";
import {
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
import { useEffect, useMemo, useRef, useState } from "react";
import { Line } from 'react-chartjs-2';
import { FaPlay } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSpeechDetail } from "../../service/speechApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

dayjs.extend(utc);

type EmotionKey = 'neutral' | 'happiness' | 'anger' | 'sadness';

const EMOTION_CONFIG: Record<EmotionKey, { label: string; color: string; bgColor: string }> = {
  neutral: { label: '중립', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.1)' },
  happiness: { label: '행복', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.1)' },
  anger: { label: '분노', color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.1)' },
  sadness: { label: '슬픔', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.1)' },
};

const EMOTION_KEYS: EmotionKey[] = ['neutral', 'happiness', 'anger', 'sadness'];

// 보간 함수: 1초 간격 데이터를 부드러운 곡선으로 변환
function interpolateData(raw: number[], factor: number = 3): number[] {
  if (raw.length < 2) return raw;
  const result: number[] = [];
  for (let i = 0; i < raw.length - 1; i++) {
    for (let j = 0; j < factor; j++) {
      const t = j / factor;
      // Cubic interpolation (Catmull-Rom)
      const p0 = raw[Math.max(0, i - 1)];
      const p1 = raw[i];
      const p2 = raw[Math.min(raw.length - 1, i + 1)];
      const p3 = raw[Math.min(raw.length - 1, i + 2)];
      const val = 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
      result.push(Math.max(0, Math.min(100, val)));
    }
  }
  result.push(raw[raw.length - 1]);
  return result;
}

const AnalysisPage = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey>('neutral');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const isAutoPlayingRef = useRef(false);

  const { data: speech, isLoading, isError, error } = useQuery({
    queryKey: ["speech", speechId],
    queryFn: () => fetchSpeechDetail(speechId!),
    enabled: !!speechId,
  });

  const allSegments = useMemo(() => (speech?.scripts || []).flatMap((script: any) => 
    (script.segments || []).map((seg: any) => ({
      ...seg,
      part: script.part
    }))
  ), [speech]);

  const segments = allSegments; 
  const currentSegment = segments[currentSegmentIndex];

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formattedDate = speech ? dayjs.utc(speech.voice_created_at).local().format('M.D (ddd) h:mm A') : '';
  const durationMin = speech ? Math.floor(speech.voice_duration / 60) : 0;
  const durationSec = speech ? Math.round(speech.voice_duration % 60) : 0;
  const formattedDuration = `${durationMin}분 ${durationSec}초`;

  const scripts = speech?.scripts || [];
  const emotionTimeline = speech?.emotionTimeline;
  const analysis = speech?.analysis;

  // 보간된 감정 차트 데이터
  const emotionChartData = useMemo(() => {
    if (!emotionTimeline || !speech) return null;
    const rawData = emotionTimeline[selectedEmotion] || [];
    const interpolated = interpolateData(rawData, 3);
    const config = EMOTION_CONFIG[selectedEmotion];
    const totalDuration = speech.voice_duration; // 실제 녹음 시간 (초)
    const totalPoints = interpolated.length;

    return {
      labels: interpolated.map((_, i) => {
        const totalSec = (i / Math.max(1, totalPoints - 1)) * totalDuration;
        const m = Math.floor(totalSec / 60);
        const s = Math.floor(totalSec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
      }),
      datasets: [{
        label: config.label,
        data: interpolated,
        borderColor: config.color,
        backgroundColor: config.bgColor,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2.5,
        fill: true,
      }]
    };
  }, [emotionTimeline, selectedEmotion, speech]);

  const emotionChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (ctx: any) => ctx[0]?.label || '',
          label: (ctx: any) => `${EMOTION_CONFIG[selectedEmotion].label}: ${ctx.parsed.y.toFixed(1)}%`,
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          color: '#9CA3AF',
          maxTicksLimit: 8,
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          color: '#9CA3AF',
          stepSize: 25,
          font: { size: 11 },
        },
      },
    },
    animation: { duration: 400, easing: 'easeInOutQuart' },
  };

  const playAudio = (url: string, playingIndex: number, isContinuous = false) => {
    if (!url) return;
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    const audio = new Audio(url);
    audioRef.current = audio;

    if (isContinuous && typeof playingIndex === 'number') {
        audio.onended = () => playNextSegment(playingIndex + 1);
    }
    audio.play().catch(e => console.error("Audio playback error:", e));
  };

  const playNextSegment = (nextIndex: number) => {
      if (nextIndex >= 0 && nextIndex < allSegments.length) {
          isAutoPlayingRef.current = true;
          const nextSeg = allSegments[nextIndex];
          setCurrentSegmentIndex(nextIndex);
          playAudio(nextSeg.segment_url, nextIndex, true);
      }
  };

  if (isLoading) return (
    <div className="flex flex-col h-full bg-background animate-pulse p-8">
      <div className="h-8 bg-muted rounded w-1/3 mb-4" />
      <div className="h-4 bg-muted rounded w-1/4 mb-8" />
      <div className="flex flex-1 gap-4">
        <div className="w-1/2 bg-muted rounded" />
        <div className="w-1/2 bg-muted rounded" />
      </div>
    </div>
  );
  if (isError) return <div className="p-8 text-red-500">에러 발생: {error?.message}</div>;
  if (!speech) return <div className="p-8">데이터가 없습니다.</div>;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <header className="px-8 py-6 border-b border-border flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">{speech.voice_name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground font-medium">
              {speech.category_name || "미분류"}
            </span>
            <span>{formattedDate}</span>
            <span>{formattedDuration}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg font-bold transition-colors cursor-pointer"
          >
            목록으로
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 스크립트 */}
        <section className="w-1/2 border-r border-border overflow-y-auto p-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold">상담 대화 내용</h2>
                 <button 
                     onClick={() => {
                        playAudio(currentSegment.segment_url, currentSegmentIndex, true);
                     }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-bold text-sm transition-colors cursor-pointer"
                 >
                     <FaPlay size={12} />
                     <span>전체 재생</span>
                 </button>
            </div>
            {scripts.map((script: any, scriptIdx: number) => (
              <div key={scriptIdx} className="flex flex-col">
                <div className="flex justify-center mb-8">
                    <span className="px-5 py-1.5 bg-muted text-muted-foreground text-sm font-medium rounded-full">
                        {script.part}
                    </span>
                </div>
                <div className="space-y-6">
                  {script.segments.map((seg: any) => {
                    const isCurrent = currentSegment?.segment_id === seg.segment_id;
                    const isCounselor = seg.speaker === '상담사';
                    const isPeak = seg.isPeak;

                    return (
                      <div 
                        key={seg.segment_id} 
                        className={`flex flex-col ${isCounselor ? 'items-start' : 'items-end'}`}
                      >
                        <span className="text-xs text-muted-foreground mb-1.5 px-1">
                            {seg.speaker}
                        </span>
                        <div 
                            className={`relative max-w-[85%] p-4 rounded-xl cursor-pointer transition-all duration-200
                              ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-90'}
                              ${isPeak 
                                ? 'bg-destructive/5 border border-destructive/20 rounded-tr-sm shadow-sm' 
                                : (isCounselor ? 'bg-muted/50 rounded-tl-sm' : 'bg-primary/10 rounded-tr-sm')
                              }
                            `}
                            onClick={() => {
                                const idx = segments.findIndex((s: any) => s.segment_id === seg.segment_id);
                                if (idx !== -1) {
                                  isAutoPlayingRef.current = true;
                                  setCurrentSegmentIndex(idx);
                                  playAudio(seg.segment_url, idx, false);
                                }
                            }}
                        >
                            {isPeak && (
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                                    </div>
                                    <span className="text-xs font-bold text-destructive tracking-wide">감정 피크 구간</span>
                                </div>
                            )}
                            <p className={`leading-relaxed text-[15px] ${isPeak ? 'text-foreground font-medium' : 'text-foreground'}`}>
                                {seg.text}
                            </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 오른쪽: 감정 분석 */}
        <section className="w-1/2 flex flex-col bg-muted/30 h-full overflow-y-auto">
          <div className="p-8 space-y-6">
            
            {/* 감정 변화 분석 차트 */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">감정 변화 분석</h3>

              {/* 차트 */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="h-[200px]">
                  {emotionChartData ? (
                    <Line data={emotionChartData} options={emotionChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      감정 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 감정 선택 탭 (차트 아래) */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {EMOTION_KEYS.map((key) => {
                  const config = EMOTION_CONFIG[key];
                  const isActive = selectedEmotion === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedEmotion(key)}
                      className={`py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border
                        ${isActive
                          ? 'border-transparent shadow-sm text-white'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                      style={isActive ? { backgroundColor: config.color } : undefined}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 상세 분석 (3 섹션 고정) */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4">상세 분석</h3>
              <div className="space-y-4">

                {/* 1. 종합 분석 */}
                {analysis?.summary && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border bg-primary/5">
                      <h4 className="font-bold text-foreground">
                        {analysis.summary.title}
                      </h4>
                    </div>
                    <div className="p-5">
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {analysis.summary.content}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. 감정 피크 구간 */}
                {analysis?.emotionPeaks && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border bg-destructive/5">
                      <h4 className="font-bold text-foreground">
                        {analysis.emotionPeaks.title}
                      </h4>
                    </div>
                    <div className="p-5 space-y-4">
                      {analysis.emotionPeaks.peaks.map((peak: any, i: number) => (
                        <div key={i} className={`border rounded-xl p-4 ${
                          peak.emotion === '분노' ? 'border-red-200 bg-red-50/50' : 'border-blue-200 bg-blue-50/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${peak.emotion === '분노' ? 'bg-red-400' : 'bg-blue-400'}`} />
                            <span className="font-bold text-foreground">{peak.emotion} 반응</span>
                            <span className="text-xs text-muted-foreground ml-auto">({peak.timeRange})</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {peak.trigger} 시점에서 {peak.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">음성 특징:</span> {peak.voiceFeatures}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. 상담 제안 */}
                {analysis?.suggestions && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border bg-amber-50">
                      <h4 className="font-bold text-foreground">
                        {analysis.suggestions.title}
                      </h4>
                    </div>
                    <div className="p-5">
                      <ul className="space-y-2.5">
                        {analysis.suggestions.items.map((item: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5">
                            <span className="text-primary mt-0.5 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalysisPage;
