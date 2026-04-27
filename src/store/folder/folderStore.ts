import { create } from 'zustand';
import { createFolder, deleteFolderById, fetchFolders, updateFolder } from '../../service/folderApi';

export interface Folder {
  id: number;
  name: string;
  age?: number;
  gender?: string;
  memo?: string;
  totalSessions?: number;
  lastSession?: string;
}

export interface NewClientPayload {
  name: string;
  age?: number;
  gender?: string;
  memo?: string;
}

export interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: () => Promise<void>;
  addFolder: (payload: NewClientPayload) => Promise<Folder>;
  updateFolder: (id: number, name: string) => Promise<Folder>;
  deleteFolder: (id: number) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  isLoading: false,
  error: null,

  // 폴더(내담자) 목록 불러오기
  fetchFolders: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchFolders();
      set({ folders: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 내담자 추가 (이름 + 나이 + 성별 + 메모)
  addFolder: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const newFolder = await createFolder(payload);
      set((state) => ({ 
        folders: [...state.folders, newFolder],
        isLoading: false 
      }));
      return newFolder;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // 폴더 수정
  updateFolder: async (id, name) => {
    set({ isLoading: true, error: null });
    try {
      const updatedFolder = await updateFolder(id, name);
      set((state) => ({
        folders: state.folders.map((f) => (f.id === id ? updatedFolder : f)),
        isLoading: false
      }));
      return updatedFolder;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // 폴더 삭제
  deleteFolder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteFolderById(id);
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
