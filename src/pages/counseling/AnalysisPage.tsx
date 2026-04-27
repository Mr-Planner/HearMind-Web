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
import { FaChevronLeft, FaChevronRight, FaPlay } from "react-icons/fa6";
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

const AnalysisPage = () => {
  const { speechId } = useParams();
  const navigate = useNavigate();
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  
  const validSegments = useMemo(() => segments.filter((seg: any) => seg.feedback && seg.feedback.trim() !== ""), [segments]);
  const totalValidSegments = validSegments.length;

  const currentValidIndex = useMemo(() => {
    if (!currentSegment) return -1;
    const idx = validSegments.findIndex((s: any) => s.segment_id === currentSegment.segment_id);
    if (idx !== -1) return idx;
    const currentIdxInAll = segments.findIndex((s: any) => s.segment_id === currentSegment.segment_id);
    const validBeforeCount = validSegments.filter((s: any) => {
       const sIdx = segments.findIndex((seg: any) => seg.segment_id === s.segment_id);
       return sIdx < currentIdxInAll;
    }).length;
    return validBeforeCount - 1; 
  }, [currentSegment, validSegments, segments]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePrev = () => {
    if (currentValidIndex > 0) {
        const prevValidSeg = validSegments[currentValidIndex - 1];
        const originalIndex = segments.findIndex((s: any) => s.segment_id === prevValidSeg.segment_id);
        if (originalIndex !== -1) setCurrentSegmentIndex(originalIndex);
    }
  };
  const handleNext = () => {
      if (currentValidIndex < totalValidSegments - 1) {
          const nextValidSeg = validSegments[currentValidIndex + 1];
          const originalIndex = segments.findIndex((s: any) => s.segment_id === nextValidSeg.segment_id);
          if (originalIndex !== -1) setCurrentSegmentIndex(originalIndex);
      }
  };

  const formattedDate = speech ? dayjs.utc(speech.voice_created_at).local().format('M.D (ddd) h:mm A') : '';
  const durationMin = speech ? Math.floor(speech.voice_duration / 60) : 0;
  const durationSec = speech ? Math.round(speech.voice_duration % 60) : 0;
  const formattedDuration = `${durationMin}분 ${durationSec}초`;

  const scripts = speech?.scripts || [];
  const dBList = currentSegment?.dB_list || [];
  const startTime = currentSegment?.start || 0;
  
  const displayMetrics = currentSegment?.metrics;
  const displayFeedback = currentSegment?.feedback;

  const originalInterval = 0.1;
  const displayDuration = dBList.length * 0.1;

  const avgDb = displayMetrics?.dB ? Number(displayMetrics.dB) : null;
  const upperDbLimit = avgDb !== null ? avgDb + 1.9 : null;
  const lowerDbLimit = avgDb !== null ? avgDb - 2.5 : null;

  const rangeDataUpper = upperDbLimit !== null ? [
      { x: 0, y: upperDbLimit },
      { x: displayDuration, y: upperDbLimit }
  ] : [];
  
  const rangeDataLower = lowerDbLimit !== null ? [
      { x: 0, y: lowerDbLimit },
      { x: displayDuration, y: lowerDbLimit }
  ] : [];

  const chartData = {
    datasets: [
      {
        label: 'Original dB',
        data: dBList.map((val: any, i: number) => ({ x: i * originalInterval, y: val })),
        borderColor: '#7DCC74',
        backgroundColor: 'rgba(125, 204, 116, 0.1)',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: false,
        order: 1,
        yAxisID: 'y',
      },
      {
        label: 'Optimal Range Upper',
        data: rangeDataUpper,
        borderColor: 'rgba(251, 191, 36, 0.8)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        order: 3,
        yAxisID: 'y',
      },
      {
        label: 'Optimal Range',
        data: rangeDataLower,
        borderColor: 'rgba(251, 191, 36, 0.8)',
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: '-1',
        order: 4,
        yAxisID: 'y',
      }
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Volume: ${context.parsed.y} dB`
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        grid: { display: false },
        min: 0,
        max: displayDuration,
        ticks: {
            maxTicksLimit: 8,
            color: '#9CA3AF',
            callback: function(value: any) {
                const min = Math.floor((startTime + value) / 60);
                const sec = Math.floor((startTime + value) % 60);
                return `${min}:${sec.toString().padStart(2, '0')}`;
            }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: '#F3F4F6' },
        ticks: { color: '#9CA3AF' },
      },
    },
    animation: { duration: 0 }
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

  if (isLoading) return <div className="p-8">로딩 중...</div>;
  if (isError) return <div className="p-8 text-red-500">에러 발생: {error?.message}</div>;
  if (!speech) return <div className="p-8">데이터가 없습니다.</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-8 py-6 border-b border-gray-200 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{speech.voice_name}</h1>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">
              {speech.category_name || "미분류"}
            </span>
            <span>{formattedDate}</span>
            <span>{formattedDuration}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors cursor-pointer"
          >
            목록으로
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="w-1/2 border-r border-gray-200 overflow-y-auto p-8">
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold text-gray-800">Script</h2>
                 <button 
                     onClick={() => {
                        playAudio(currentSegment.segment_url, currentSegmentIndex, true);
                     }}
                     className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                 >
                     <FaPlay size={12} />
                     <span>전체 재생</span>
                 </button>
            </div>
            {scripts.map((script: any, scriptIdx: number) => (
              <div key={scriptIdx}>
                <h3 className="text-lg font-bold text-gray-800 mb-3">{script.part}</h3>
                <div className="space-y-2">
                  {script.segments.map((seg: any) => {
                    const isCurrent = currentSegment?.segment_id === seg.segment_id;
                    return (
                      <p 
                        key={seg.segment_id} 
                        className={`text-gray-700 leading-relaxed p-2 rounded cursor-pointer transition-colors
                          ${isCurrent ? 'bg-red-50 border-l-4 border-red-400 font-medium' : 'hover:bg-gray-50'}
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
                        {seg.text}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-1/2 flex flex-col bg-gray-50 h-full">
          {totalValidSegments === 0 ? (
             <div className="flex items-center justify-center h-full text-gray-500 text-lg font-medium p-8">
                 분석 결과가 없습니다.
             </div>
          ) : (
             <>
                <div className="flex items-center justify-between mb-6 px-8 pt-8">
            <button 
              onClick={handlePrev} 
              disabled={currentValidIndex <= 0}
              className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaChevronLeft size={20} />
            </button>
            <span className="text-2xl font-bold text-gray-800">
              {currentValidIndex !== -1 ? currentValidIndex + 1 : "0"} / {totalValidSegments}
            </span>
            <button 
              onClick={handleNext} 
              disabled={currentValidIndex === -1 || currentValidIndex >= totalValidSegments - 1}
              className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <FaChevronRight size={20} />
            </button>
          </div>

          {currentSegment ? (
            <>
              <div className="flex-1 flex flex-col overflow-hidden px-8">
              <div className="bg-white border border-gray-200 rounded-xl h-48 mb-4 p-4 shadow-sm relative w-full shrink-0">
                {dBList.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        데이터가 없습니다.
                    </div>
                )}
              </div>

              <div className="mb-4 shrink-0">
                <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-gray-900">분석 결과</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">목소리 크기</p>
                    <p className="text-xl font-bold text-gray-900">
                        {displayMetrics?.dB ? Number(displayMetrics.dB).toFixed(2) : 0} 
                        <span className="text-sm font-normal">dB</span>
                    </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">목소리 높낮이</p>
                    <p className="text-xl font-bold text-gray-900">
                        {displayMetrics?.pitch_mean_hz ? Number(displayMetrics.pitch_mean_hz).toFixed(2) : 0}
                        <span className="text-sm font-normal">Hz</span>
                    </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">말하기 속도</p>
                    <p className="text-xl font-bold text-gray-900">
                        {displayMetrics?.rate_wpm ? Number(displayMetrics.rate_wpm).toFixed(2) : 0}
                        <span className="text-sm font-normal">WPM</span>
                    </p>
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 flex-1 flex flex-col min-h-0">
                <div className="px-6 py-4 border-b border-gray-100 flex-none bg-white rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-900">상세 분석</h3>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="text-gray-700 leading-relaxed text-sm">
                    {(() => {
                        const text = displayFeedback || "분석 내용이 없습니다.";
                        if (!text) return null;
                        return text.split('\n').map((line: string, index: number) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
                            const isFirst = index === 0;
                            return (
                                <h4 key={index} className={`font-bold text-gray-900 mb-2 text-base ${isFirst ? 'mt-0' : 'mt-4'}`}>
                                    {trimmed.replace(/[<>]/g, '')}
                               </h4>
                            );
                        }
                        if (trimmed === '') return <div key={index} className="h-2" />;
                        return <p key={index} className="mb-1">{line}</p>;
                        });
                    })()}
                    </div>
                </div>
              </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-lg font-medium p-8">
              선택된 문장이 없습니다.
            </div>
          )}
        </>
      )}
        </section>
      </main>
    </div>
  );
};

export default AnalysisPage;
