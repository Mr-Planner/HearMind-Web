import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import angleRight from "../assets/sidebar/angle-right.svg";
import angleUp from "../assets/sidebar/angle-up.svg";
import archive from "../assets/sidebar/archive.svg";
import folderIcon from "../assets/sidebar/folder.svg";
import hideside from "../assets/sidebar/hideside.svg";
import overflowMenu from "../assets/sidebar/overflow-menu.svg";




import { useShallow } from 'zustand/react/shallow';
import ConfirmModal from "./ConfirmModal";
import { toast } from "../components/Toast";
import { useAuthStore } from "../store/auth/authStore";
import { useFolderStore } from "../store/folder/folderStore";

// todo 폴더 선택별 SpeechItem 컴포넌드들 선택 
function SideBar({ handleToggleSideBar }: { handleToggleSideBar: () => void }) {
    const navigate = useNavigate();

    const isLoggedIn = useAuthStore((state: any) => state.isLoggedIn);
    const { folders, fetchFolders,
        updateFolder: storeUpdateFolder, deleteFolder: storeDeleteFolder } = useFolderStore(
        useShallow((state) => ({
            folders: state.folders,
            fetchFolders: state.fetchFolders,
            updateFolder: state.updateFolder,
            deleteFolder: state.deleteFolder,
        }))
    );

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);
    
    // state
    const [isFolderOpen, setIsFolderOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [tempFolderName, setTempFolderName] = useState("");
    // 기존 폴더 수정, 삭제용 state
    const [renamingId, setRenamingId] = useState<number | null>(null); 
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // function
    const handleNavigation = (path: string) => {
        if (isLoggedIn) {
            navigate(path);
        } else {
            navigate("/login");
        }
    };

    const toggleFolders = async() => {
        setIsFolderOpen(prev => !prev);
        setEditingId(null);
        setRenamingId(null);
        setTempFolderName("");
    }

    const modifyFolder = (targetId: string | number) => {
        // 한번 더 클릭하면 안보이도록
        setEditingId(prev => prev===targetId ? null : targetId);
        
    }

    const startRename = (targetId: string | number, currentName: string) => {
        setRenamingId(Number(targetId));          
        setEditingId(null);         
        setTempFolderName(currentName); // 기존 이름 input에 넣음
    }

    const saveRename = async (id: string | number) => {
        const trimmed = tempFolderName.trim();
        if (!trimmed) return toast.info("폴더 이름을 입력하세요");

        if (folders.some(folder => folder.name === trimmed && folder.id !== id))
            return toast.error("중복된 이름입니다");

        try {
            await storeUpdateFolder(Number(id), trimmed);
            setRenamingId(null);
            setTempFolderName("");
        } catch (e) {
            console.error(e);
            toast.error("폴더 수정 실패");
        }
    };

    const cancelRename = () => {
        setRenamingId(null); 
        setTempFolderName("");
    };

    const deleteFolder = (id: string | number) => {
        setDeleteConfirmId(Number(id));
    };

    const confirmDeleteFolder = async () => {
        if (!deleteConfirmId) return;
        try {
            await storeDeleteFolder(deleteConfirmId);
            setEditingId(null);
            toast.success("내담자 정보가 삭제되었습니다.");
        } catch (e) {
            console.error(e);
            toast.error("삭제 실패");
        } finally {
            setDeleteConfirmId(null);
        }
    };


    // 상태 적용
    return (
        <aside className="flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-[250px] h-full relative">
            <div className="flex justify-end p-2">
            <button className = "hover:bg-gray-300 rounded cursor-pointer" onClick={handleToggleSideBar}>
                    <img src = {hideside} alt = "사이드바 닫기"></img>
            </button>
            </div>

            <nav>
                <ul className="flex flex-col gap-2 px-4">
                    <li className="flex flex-col gap-2 ">
                        <div className="grid grid-cols-[1fr_auto_auto] items-center w-full h-9 pl-2 pr-0.5">
                            <div 
                                className="flex gap-1.5 items-center cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded px-1 py-0.5"
                                onClick={() => handleNavigation("/")}
                            >
                                <img src = {archive}></img>
                                <span>모든 내담자</span>
                            </div>
                            <div className="flex justify-center gap-0.5">
                                <button className="hover:bg-sidebar-accent rounded cursor-pointer p-1 w-7 h-7 flex items-center justify-center" onClick={toggleFolders}>
                                    <img src={isFolderOpen ? angleUp : angleRight} alt="폴더 열기/닫기"></img>
                                </button> 
                            </div>
                            
                        </div>       
                        
                        <ul className="flex flex-col gap-2 pl-6">
                            {isFolderOpen && (
                                <>
                                    {folders.map((folder) => {
                                        const isRenaming = renamingId === folder.id;  
                                        const isMenuOpen = editingId === folder.id;

                                        let content;

                                        // 기존 폴더 이름 수정 
                                        if (isRenaming) {
                                            content = (
                                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <input
                                                    autoFocus
                                                    className="appearance-none shadow-none border border-sidebar-border bg-background text-foreground rounded px-2 py-0.5 text-sm min-w-[100px] max-w-[150px] shrink focus:outline-none focus:border-primary transition-colors"
                                                    value={tempFolderName}
                                                    onChange={(e) => setTempFolderName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveRename(folder.id);
                                                    if (e.key === "Escape") cancelRename();
                                                    }}
                                                />
                                                <div className="flex gap-1 shrink-0">
                                                    <button
                                                    className="text-primary text-xs hover:bg-sidebar-accent rounded px-1"
                                                    onClick={() => saveRename(folder.id)}
                                                    >
                                                    저장
                                                    </button>
                                                    <button
                                                    className="text-muted-foreground text-xs hover:bg-sidebar-accent rounded px-1"
                                                    onClick={cancelRename}
                                                    >
                                                    취소
                                                    </button>
                                                </div>
                                                </div>
                                            );
                                        }
                                        // 기본 폴더명
                                        else {
                                            content = (
                                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                    <span  className="truncate max-w-[150px] ">
                                                        {folder.name}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <li
                                                key={folder.id}
                                                className="flex items-center w-full px-0.5 py-1 min-h-8 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                onClick={() => {
                                                    if (!isRenaming && !isMenuOpen) {
                                                        navigate(`/${folder.id}`); // 폴더 이동 
                                                    }
                                                }}
                                                >
                                                <img src={folderIcon} className="shrink-0 mr-2" alt = "폴더"/>

                                                {content}

                                                <div className="relative shrink-0 flex items-center h-full">

                                                    {!isRenaming && (
                                                    <button
                                                        className="hover:bg-sidebar-accent rounded cursor-pointer px-2 flex items-center justify-center h-[75%]"

                                                        onClick={(e) => {
                                                        e.stopPropagation();   // 해당 폴더이름으로 이동 방지
                                                        modifyFolder(folder.id);
                                                        }}
                                                    >
                                                        <img src={overflowMenu} className="pointer-events-none w-3 h-3 " alt = "폴더 수정"/>
                                                    </button>
                                                    )}

                                                    {isMenuOpen && (
                                                    <div
                                                        className="absolute top-full right-0 mt-1 z-50 flex flex-col translate-x-[55px] -translate-y-0.5
                                                                bg-popover text-popover-foreground border border-border shadow-sm rounded text-sm w-[60px]"
                                                        onClick={(e) => e.stopPropagation()} //  해당 폴더이름으로 이동 방지
                                                    >
                                                        <button
                                                            className="px-2 py-1 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                            onClick={() => startRename(folder.id, folder.name)}
                                                        >
                                                        수정
                                                        </button>
                                                        <button
                                                            className="px-2 py-1 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
                                                            onClick={() => deleteFolder(folder.id)}
                                                        >
                                                        삭제
                                                        </button>
                                                    </div>
                                                    )}

                                                </div>
                                            </li>
                                            );
                                    })}
                                </>
                            )}
                        </ul>
                    </li>
                        

                </ul>


            </nav>

            <ConfirmModal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={confirmDeleteFolder}
                title="내담자 삭제"
                message="정말로 이 내담자 정보를 삭제하시겠습니까? 삭제된 정보는 복구할 수 없으며 관련된 모든 상담 기록이 삭제될 수 있습니다."
                confirmText="삭제하기"
                cancelText="취소"
                type="danger"
            />
        </aside>
    )
}

export default SideBar;