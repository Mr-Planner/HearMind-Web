import { useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaFileAudio, FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import ClientSelectModal from '../../components/ClientSelectModal';
import SavePopup from '../../components/SavePopup';
import { toast } from '../../components/Toast';
import { uploadSpeech, BASE_URL } from '../../service/speechApi';
import { useAuthStore } from '../../store/auth/authStore';
import type { Folder } from '../../store/folder/folderStore';

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSavePopupOpen, setIsSavePopupOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 내담자 선택 상태
  const [showClientModal, setShowClientModal] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Folder | null>(null);

  // 진입 시 항상 팝업 열기
  useEffect(() => {
    setShowClientModal(true);
  }, []);

  const handleClientSelect = (client: Folder) => {
    setSelectedClient(client);
    setShowClientModal(false);
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(webm|wav|mp3|ogg|m4a)$/i)) {
      toast.error('지원되는 음성 파일 형식: WAV, MP3, WebM, OGG, M4A');
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartAnalysis = () => {
    if (!selectedFile) return;
    setIsSavePopupOpen(true);
  };

  const onSave = async (title: string, folderId: string | number) => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", title);
      formData.append("category_id", folderId.toString());

      const userId = useAuthStore.getState().userId;
      if (!userId) {
        toast.error("로그인이 필요합니다.");
        return;
      }

      setUploadProgress(10);

      const eventSource = new EventSource(`${BASE_URL}/voice/progress/${userId}`);

      const waitForConnection = new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => { resolve(); }, 5000);
        eventSource.onopen = () => { clearTimeout(timeoutId); resolve(); };
        eventSource.onerror = () => { clearTimeout(timeoutId); resolve(); };
      });

      eventSource.onmessage = (event) => {
        const progress = parseInt(event.data, 10);
        if (!isNaN(progress)) {
          /* 
            [Back-end Coordination]
            서버에서는 다음 작업 단계에 맞춰 진행률(0~100)을 전송해 주세요.
            1~20: 파일 업로드 완료 및 서버 수신
            21~50: STT 및 음성 특징 추출 분석
            51~80: 감정 분석 및 타임라인 데이터 생성
            81~99: 분석 요약 및 제안 데이터(GPT) 생성
            100: 모든 처리 완료
          */
          setUploadProgress(Math.max(1, progress));
          if (progress === 100) eventSource.close();
        }
      };

      eventSource.onerror = () => { eventSource.close(); };

      await waitForConnection;
      const response = await uploadSpeech(formData);

      setUploadProgress(100);
      eventSource.close();

      setTimeout(() => {
        const newSpeechId = response.voice_id || response.id;
        toast.success("성공적으로 저장되었습니다.");
        setSelectedFile(null);
        setUploadProgress(0);
        navigate(`/${folderId}/${newSpeechId}`);
      }, 500);

    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background relative">
      {/* 내담자 선택 모달 */}
      {showClientModal && (
        <ClientSelectModal onSelect={handleClientSelect} />
      )}

      {/* 헤더 */}
      <div className="absolute top-8 left-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          ← 돌아가기
        </button>
        {selectedClient && (
          <>
            <span className="text-muted-foreground/40">|</span>
            <button
              onClick={() => setShowClientModal(true)}
              className="flex items-center gap-2 text-sm cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-[#8b5cf6] font-bold text-xs">{selectedClient.name.charAt(0)}</span>
              </div>
              <span className="font-semibold text-foreground">{selectedClient.name}</span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">(변경)</span>
            </button>
          </>
        )}
      </div>

      <div className="w-full max-w-[520px] px-6">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">음성 파일 업로드</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {selectedClient
            ? <><span className="font-semibold text-[#8b5cf6]">{selectedClient.name}</span> 님의 상담 녹음 파일을 업로드하세요.</>
            : '상담 녹음 파일을 업로드하면 AI가 자동으로 분석합니다.'
          }
        </p>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center
            transition-all duration-200 cursor-pointer min-h-[240px]
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : selectedFile
                ? 'border-border bg-card'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }
          `}
        >
          {!selectedFile ? (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FaCloudUploadAlt size={28} className="text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">파일을 드래그하여 놓으세요</p>
              <p className="text-sm text-muted-foreground mb-4">또는 클릭하여 파일 선택</p>
              <p className="text-xs text-muted-foreground">지원 형식: WAV, MP3, WebM, OGG, M4A</p>
            </>
          ) : (
            <div className="flex items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FaFileAudio size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatFileSize(selectedFile.size)} · {selectedFile.type.split('/')[1]?.toUpperCase() || '음성'}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
              >
                <FaTrash size={14} />
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Action Button */}
        <button
          onClick={handleStartAnalysis}
          disabled={!selectedFile || !selectedClient}
          className={`
            w-full mt-6 py-3.5 rounded-xl font-semibold text-base transition-all
            ${selectedFile && selectedClient
              ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-[0_4px_12px_rgba(196,181,253,0.4)]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {!selectedClient ? '내담자를 먼저 선택해주세요' : !selectedFile ? '파일을 선택해주세요' : '분석 시작'}
        </button>
      </div>

      <SavePopup
        isOpen={isSavePopupOpen}
        onClose={() => setIsSavePopupOpen(false)}
        onSave={onSave}
        uploadProgress={uploadProgress}
        defaultFolderId={selectedClient?.id}
        defaultTitle=""
      />
    </div>
  );
};

export default UploadPage;
