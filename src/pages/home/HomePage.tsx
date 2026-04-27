import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useAuthStore } from "../../store/auth/authStore";
import { toast } from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";

dayjs.extend(utc);
dayjs.extend(timezone);

import { useNavigate, useParams } from "react-router-dom";
import SpeechItem from "../../components/CounselingItem";
import { deleteSpeech, fetchSpeeches } from "../../service/speechApi";

// 스켈레톤 카드 컴포넌트
const SkeletonCard = () => (
  <div className="flex w-full p-5 bg-card border border-border rounded-xl animate-pulse">
    <div className="w-12 h-12 rounded-full bg-muted shrink-0 mr-4" />
    <div className="flex flex-col flex-1 gap-3">
      <div className="h-5 bg-muted rounded w-1/3" />
      <div className="h-3 bg-muted rounded w-1/4" />
      <div className="flex gap-3 mt-2">
        <div className="h-6 bg-muted rounded w-16" />
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-4 bg-muted rounded w-16" />
      </div>
      <div className="flex gap-3 mt-2">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </div>
    </div>
  </div>
);

function HomePage() {

    const navigate = useNavigate();
    
    const isLoggedIn = useAuthStore((state: any) => state.isLoggedIn);
    
    const { folderId } = useParams();
    const realFolderId = folderId ?? "all";

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
    
    const queryClient = useQueryClient();

    const handleUploadClick = () => {
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            navigate("/upload");
        }
    };

    const userId = useAuthStore((state: any) => state.userId);

    const {
        data: speeches,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["speeches", realFolderId, userId],
        queryFn: () => fetchSpeeches(realFolderId),
        staleTime: 1000 * 60,
        enabled: isLoggedIn, // 로그인 시에만 데이터 fetch
    })

    const deleteMutation = useMutation({
        mutationFn: (speechId: string | number) => deleteSpeech(speechId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["speeches"],
            });
            toast.success("상담 기록이 삭제되었습니다.");
        },
        onError: (error) => {
            console.error("삭제 실패:", error);
            toast.error("삭제에 실패했습니다. 다시 시도해주세요.");
        }
    }); 

    const handleDeleteSpeech = (speechId: string | number) => {
        setDeleteConfirmId(speechId);
    };

    const confirmDeleteSpeech = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    // 비로그인 상태 → 스켈레톤 UI
    if (!isLoggedIn) {
        return (
            <main className="flex-1 overflow-y-auto px-16 py-10">
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-foreground mb-2">HearMind에 오신 것을 환영합니다</h2>
                    <p className="text-muted-foreground mb-8">로그인 후 상담 기록을 확인하세요.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                        로그인하기
                    </button>
                </div>
                <section className="mt-8 space-y-4 opacity-50 pointer-events-none">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </section>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto px-16 py-10">
            {/* 내담자 선택 시 리포트 링크 */}
            {folderId && folderId !== 'all' && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">상담 기록</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">내담자의 상담 기록을 확인하세요.</p>
                    </div>
                    <button
                        onClick={() => navigate(`/client/${folderId}`)}
                        className="px-4 py-2 bg-primary/10 text-[#8b5cf6] text-sm font-semibold rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                        분석 리포트 보기 →
                    </button>
                </div>
            )}

            {/* 로딩 중 스켈레톤 */}
            {isLoading && (
                <section className="mt-4 space-y-4">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </section>
            )}

            {/* 에러 상태 */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <span className="text-2xl">⚠</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">데이터를 불러올 수 없습니다</h3>
                    <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["speeches"] })}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                        다시 시도
                    </button>
                </div>
            )}

            {/* 데이터 표시 */}
            {speeches && (
                <section className="mt-4 space-y-4">
                    {speeches.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-muted-foreground">
                            <span className="text-4xl mb-4">📋</span>
                            <p className="text-lg font-medium">아직 상담 기록이 없습니다</p>
                            <p className="text-sm mt-1">+ 버튼을 눌러 첫 상담을 시작해보세요.</p>
                        </div>
                    ) : (
                        speeches.map((speech: any) => (
                            <SpeechItem
                                key={speech.id}
                                id={speech.id}
                                title={speech.name}
                                category={speech.category_name || "미분류"}
                                date={dayjs.utc(speech.created_at).local().locale('ko').format('M.D (ddd) h:mm A')}
                                duration={`${Math.floor(speech.duration_sec / 60)}분 ${Math.round(speech.duration_sec % 60)}초`}
                                description={speech.preview_text}
                                folderId={speech.category_id}
                                clientName={speech.client_name}
                                sessionNumber={speech.session_number}
                                onDelete={handleDeleteSpeech}
                            />
                        ))
                    )}
                </section>
            )}

            <button 
                className="fixed bottom-8 right-8 z-50 cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-primary/90
                           w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(196,181,253,0.5)]" 
                onClick={handleUploadClick}
                aria-label="파일 업로드"
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>

            <ConfirmModal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDeleteSpeech}
                title="상담 기록 삭제"
                message="정말로 이 상담 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다."
                confirmText="삭제하기"
                cancelText="취소"
                type="danger"
            />
            
        </main>
    )   
}

export default HomePage;