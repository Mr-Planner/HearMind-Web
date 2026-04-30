import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import router from "./router"
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/Toast';
import { useAuthStore } from './store/auth/authStore';

// useQuery, useMutation은 공통된 queryClient 인스턴스를 사용 
const queryClient = new QueryClient(); 

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return
  }
 
  const { worker } = await import('./mocks/browser')
 
  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start({
    onUnhandledRequest: 'bypass', // Ignore unhandled requests (like static assets)
  })
}

// 개발 환경에서 자동 로그인 (MSW 가상 계정)
async function autoLoginForDev() {
  if (import.meta.env.MODE !== 'development') return;

  const { isLoggedIn } = useAuthStore.getState();
  if (isLoggedIn) return; // 이미 로그인 되어 있으면 스킵

  try {
    await useAuthStore.getState().login('test@hearmind.com', 'password');
    console.log('[Dev] 자동 로그인 완료');
  } catch (e) {
    console.error('[Dev] 자동 로그인 실패:', e);
  }
}

enableMocking().then(async () => {
  // MSW가 준비된 후 자동 로그인 시도
  await autoLoginForDev();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ToastProvider />
      </QueryClientProvider>
    </StrictMode>,
  )
})
