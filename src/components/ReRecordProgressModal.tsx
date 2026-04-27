import { FaSpinner } from "react-icons/fa";

interface ReRecordProgressModalProps {
  isOpen: boolean;
  progress: number;
  onClose: () => void;
  title?: string;
  description?: string;
}

const ReRecordProgressModal = ({ isOpen, progress, onClose, title, description }: ReRecordProgressModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-10 w-[500px] flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-full border-4 border-gray-100 flex items-center justify-center">
            <FaSpinner className="text-4xl text-[#4687e1] animate-spin" />
          </div>
          {progress > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-[#4687e1] mt-12">{progress}%</span>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">{title || "처리 중"}</h2>
        
        {description && (
          <p className="text-gray-500 text-center whitespace-pre-wrap leading-relaxed mb-8">
            {description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden">
          <div 
            className="bg-[#4687e1] h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {progress >= 100 && (
           <button 
             onClick={onClose}
             className="w-full py-4 bg-[#7DCC74] hover:bg-[#66BB6A] text-white font-bold rounded-2xl transition-colors shadow-lg"
           >
             확인
           </button>
        )}
      </div>
    </div>
  );
};

export default ReRecordProgressModal;
