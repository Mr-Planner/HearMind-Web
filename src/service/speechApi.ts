import axios from 'axios';
import { useAuthStore } from "../store/auth/authStore";

// todo 실제 서버 주소료 교체 
export const BASE_URL = "http://localhost:8080"; 

// 스피치 삭제 (서버)
export async function deleteSpeech(speechId: string | number): Promise<boolean> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/voice/${speechId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to delete speech");
  }

  return true;
}

// 스피치 업로드 (분석 요청)
export async function uploadSpeech(formData: FormData, onUploadProgress?: (progress: number) => void): Promise<any> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await axios.post(`${BASE_URL}/voice/analyze`, formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data", // axios는 자동 설정되지만 명시적으로
    },
    onUploadProgress: (progressEvent: any) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      }
    },
    withCredentials: true,
  });

  return res.data;
}

// 세그먼트 재녹음
export async function reRecordSegment(segmentId: string | number, formData: FormData): Promise<any> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await axios.post(`${BASE_URL}/voice/segment/${segmentId}/re_record`, formData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
  });

  return res.data;
}

// 스피치 상세 조회
export async function fetchSpeechDetail(speechId: string | number): Promise<any> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await fetch(`${BASE_URL}/voice/${speechId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch speech detail");
  }

  return await res.json();
}

// 스피치 목록 조회
export async function fetchSpeeches(folderId?: string | number | null): Promise<any> {
  const accessToken = useAuthStore.getState().accessToken;

  // folderId가 0, 'all', null, undefined이면 전체 조회 (쿼리 파라미터 생략)
  const query = folderId && folderId !== 0 && folderId !== 'all' 
    ? `?category_id=${folderId}` 
    : '';

  const res = await fetch(`${BASE_URL}/voice/list${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch speeches");
  }

  const data = await res.json();
  return data.voices; // { voices: [...] } 형태에서 배열만 반환
}

// 스피치 합성 요청 (최종 제출)
// 스피치 합성 요청 (최종 제출)
export async function submitSpeechSynthesis(voiceId: string | number, selections: any): Promise<any> {
  const accessToken = useAuthStore.getState().accessToken;

  const res = await axios.post(`${BASE_URL}/voice/synthesize/${voiceId}`, selections, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    withCredentials: true,
  });

  return res.data;
}

// 결과 비교 조회
export async function fetchCompareFeedback(voiceId: string | number): Promise<any> {
  const accessToken = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/voice/${voiceId}/compare-feedback`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch comparison");
  }

  return await res.json();
}