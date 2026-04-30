import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { toast } from './Toast';
import { useFolderStore, type Folder, type NewClientPayload } from '../store/folder/folderStore';

interface ClientSelectModalProps {
  onSelect: (client: Folder) => void;
}

type Step = 'select' | 'create';
type Gender = '남성' | '여성' | '기타';

export default function ClientSelectModal({ onSelect }: ClientSelectModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select');

  // 폼 상태
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { folders, fetchFolders, addFolder } = useFolderStore(
    useShallow((state) => ({
      folders: state.folders,
      fetchFolders: state.fetchFolders,
      addFolder: state.addFolder,
    }))
  );

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.info('이름을 입력해주세요.');
      return;
    }
    if (!age || parseInt(age, 10) <= 0) {
      toast.info('올바른 나이를 입력해주세요.');
      return;
    }
    if (!gender) {
      toast.info('성별을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: NewClientPayload = {
        name: name.trim(),
        age: parseInt(age, 10),
        gender: gender,
      };
      const newClient = await addFolder(payload);
      toast.success(`${name} 님이 등록되었습니다.`);
      onSelect(newClient);
    } catch (e) {
      toast.error('내담자 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitial = (n: string) => n.charAt(0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            {step === 'create' && (
              <button
                onClick={() => setStep('select')}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                ←
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">
              {step === 'select' ? '내담자 선택' : '새 내담자 등록'}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Step 1: 기존 내담자 선택 */}
        {step === 'select' && (
          <div className="flex flex-col">
            <div className="px-6 pt-4 pb-2">
              <p className="text-sm text-muted-foreground">상담 기록을 추가할 내담자를 선택하세요.</p>
            </div>

            <div className="px-6 py-3 max-h-[320px] overflow-y-auto space-y-2">
              {folders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  등록된 내담자가 없습니다.
                </div>
              ) : (
                folders.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => onSelect(client)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer text-left group"
                  >
                    {/* 아바타 */}
                    <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-[#8b5cf6] font-bold text-base">
                        {getInitial(client.name)}
                      </span>
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-[15px]">{client.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[
                          client.age ? `${client.age}세` : null,
                          client.gender || null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* 배지 */}
                    <div className="text-right shrink-0">
                      {client.totalSessions !== undefined && client.totalSessions > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-[#8b5cf6] rounded-full font-medium">
                          {client.totalSessions}회 상담
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* 새 내담자 등록 버튼 */}
            <div className="px-6 py-4 border-t border-border">
              <button
                onClick={() => setStep('create')}
                className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-[#8b5cf6] font-semibold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer"
              >
                + 새 내담자 등록
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 새 내담자 등록 */}
        {step === 'create' && (
          <div className="px-6 py-5 space-y-5">
            {/* 이름 */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">
                이름 <span className="text-destructive">*</span>
              </label>
              <input
                autoFocus
                type="text"
                placeholder="내담자 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* 나이 + 성별 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  나이 <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  placeholder="예: 23"
                  value={age}
                  min={1}
                  max={120}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full border border-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">
                  성별 <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  {(['남성', '여성', '기타'] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(gender === g ? '' : g)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                        gender === g
                          ? 'bg-primary text-white border-primary'
                          : 'border-input text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 등록 버튼 */}
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
