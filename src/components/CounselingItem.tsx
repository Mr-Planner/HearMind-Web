import { Link } from "react-router-dom";
import mic from "../assets/counselingitem/mic.svg";
import trash from "../assets/counselingitem/trash.svg";

// todo 스피치 삭제시에 alert 띄우기 (완성도)
// todo 반응형으로 Speech정보 UI 약간 조절하기
interface SpeechItemProps {
  id: string | number;
  title: string;
  category: string;
  date: string;
  duration: string;
  description: string;
  folderId: string | number;
  clientName?: string;
  sessionNumber?: number;
  onDelete: (id: string | number) => void;
}

const SpeechItem = ({ id, title, category, date, duration, description, folderId, clientName, sessionNumber, onDelete }: SpeechItemProps) => {

  const detailPath = `/${folderId}/${id}`;
  
  const displayName = clientName || '내담자';
  const initial = displayName.charAt(0);
  const subtitle = `${displayName} · ${sessionNumber || '-'}회차 상담`;

  return (
    <Link to={detailPath} className="block mb-4">
      <article className="flex w-full p-5 bg-card border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative group">
        
        {/* Left icon */}
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mr-4">
          <img src={mic} alt="마이크" className="w-5 h-5 opacity-80" />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          
          <div className="flex items-start justify-between w-full mb-1">
            <div>
              <h3 className="text-[17px] font-bold text-foreground truncate">{title}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 mb-4">
            <span className="px-2.5 py-1 bg-primary/20 text-[#8b5cf6] text-[12px] font-bold rounded-md">
              {category}
            </span>
            <span className="text-[13px] text-muted-foreground">{date}</span>
            <span className="text-[13px] text-muted-foreground">{duration}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/25 text-[#8b5cf6] flex items-center justify-center font-bold text-sm shrink-0">
              {initial}
            </div>
            <p className="text-[14px] text-muted-foreground leading-relaxed flex-1 line-clamp-2">
              본 상담은 {category} 관련 스트레스 상담입니다.<br/>
              {description}
            </p>
          </div>
        </div>

        {/* Delete Button (Top Right) */}
        <button 
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id)
          }}>
            <img src={trash} alt="스피치 삭제" className="w-4 h-4 opacity-60" />
        </button>

      </article>
    </Link>
  );
};

export default SpeechItem;