import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useAuthStore } from "../../store/auth/authStore";

dayjs.extend(utc);
dayjs.extend(timezone);

import { useNavigate, useParams } from "react-router-dom";
import SpeechItem from "../../components/CounselingItem";
import { deleteSpeech, fetchSpeeches } from "../../service/speechApi";

function HomePage() {

    const navigate = useNavigate();
    
    const isLoggedIn = useAuthStore((state: any) => state.isLoggedIn);
    
    const { folderId } = useParams(); // /speech, /speech/:folderId
    const realFolderId = folderId ?? "all"; // 없을 경우 '모든 내담자'라고 가정

    const queryClient = useQueryClient();

    // function
    const handleUploadClick = () => {
        if (!isLoggedIn) {
        navigate("/login");
        } else {
        navigate("/upload");
        }
    };

    // 서버에서 SpeechList가져오기
    // useQuery : GET(읽기) 전용
    const userId = useAuthStore((state: any) => state.userId);

    const {
        data: speeches,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["speeches", realFolderId, userId],       // 캐시 key (폴더별, 유저별로 캐시 분리)
        queryFn: () => fetchSpeeches(realFolderId), // 실제 fetch 함수  
        staleTime: 1000 * 60, // 1분까지는 fresh 데이터
    })

    // useMutation : DELETE / POST / PUT 등의 데이터 변경 
    const deleteMutation = useMutation({
        mutationFn: (speechId: string | number) => deleteSpeech(speechId),
        onSuccess: () => {
            // 이 폴더의 스피치 리스트만 다시 가져오기
            queryClient.invalidateQueries({
                queryKey: ["speeches"],
            });
        },
        onError: (error) => {
            console.error("삭제 실패:", error);
            alert("스피치 삭제에 실패했습니다. 다시 시도해주세요.");
        }
    }); 

    const handleDeleteSpeech = (speechId: string | number) => {
        if (window.confirm("정말로 이 스피치를 삭제하시겠습니까?")) {
            deleteMutation.mutate(speechId);
        }
    };

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

            {isLoading && <p>로딩 중...</p>}

            {isError && (
                <p className="text-destructive">에러: {error.message}</p>
            )}

            {speeches && (
                <section className="mt-4 space-y-4">
                    {speeches.map((speech: any) => (
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
                    ))}
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
            
        </main>
    )   
}

export default HomePage;