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
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // 메뉴 바깥 클릭 시 닫기 로직
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // 클릭된 요소가 메뉴 컨테이너 내부가 아니면 닫음
            if (!target.closest('.overflow-menu-container')) {
                setEditingId(null);
            }
        };

        if (editingId !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingId]);

    // function
    const handleNavigation = (path: string) => {
        if (isLoggedIn) {
            navigate(path);
        } else {
            navigate("/login");
        }
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
                                <button className="hover:bg-sidebar-accent rounded cursor-pointer p-1 w-7 h-7 flex items-center justify-center" onClick={() => setIsFolderOpen(!isFolderOpen)}>
                                    <img src={isFolderOpen ? angleUp : angleRight} alt="폴더 열기/닫기"></img>
                                </button> 
                            </div>
                            
                        </div>       
                        
                        <ul className="flex flex-col gap-2 pl-6">
                            {isFolderOpen && (
                                <>
                                    {folders.map((folder) => {
                                        const isMenuOpen = editingId === folder.id;
                                        
                                        return (
                                            <li
                                                key={folder.id}
                                                className="flex items-center w-full px-0.5 py-1 min-h-8 cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                                onClick={() => {
                                                    if (!isMenuOpen) {
                                                        navigate(`/${folder.id}`); // 폴더 이동 
                                                    }
                                                }}
                                                >
                                                <img src={folderIcon} className="shrink-0 mr-2" alt = "폴더"/>

                                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                    <span  className="truncate max-w-[150px] ">
                                                        {folder.name}
                                                    </span>
                                                </div>

                                                <div className="relative shrink-0 flex items-center h-full overflow-menu-container">
                                                    <button
                                                        className="hover:bg-sidebar-accent rounded cursor-pointer px-2 flex items-center justify-center h-[75%]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingId(editingId === folder.id ? null : folder.id);
                                                        }}
                                                    >
                                                        <img src={overflowMenu} className="pointer-events-none w-3 h-3 " alt = "폴더 수정"/>
                                                    </button>

                                                    {isMenuOpen && (
                                                    <div
                                                        className="absolute top-full right-0 mt-1 z-50 flex flex-col translate-x-[55px] -translate-y-0.5
                                                                bg-popover text-popover-foreground border border-border shadow-sm rounded text-sm w-[60px]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
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