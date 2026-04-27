import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

type ToastType = 'success' | 'error' | 'loading' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let addToastFn: ((toast: Omit<Toast, 'id'>) => string) | null = null;
let removeToastFn: ((id: string) => void) | null = null;

// 전역에서 toast를 호출할 수 있는 함수
export const toast = {
  success: (message: string, duration = 3000) => addToastFn?.({ message, type: 'success', duration }) || '',
  error: (message: string, duration = 4000) => addToastFn?.({ message, type: 'error', duration }) || '',
  loading: (message: string) => addToastFn?.({ message, type: 'loading', duration: 0 }) || '',
  info: (message: string, duration = 3000) => addToastFn?.({ message, type: 'info', duration }) || '',
  dismiss: (id: string) => removeToastFn?.(id),
};

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  loading: '◌',
  info: 'ℹ',
};

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  loading: 'bg-white border-border text-foreground',
  info: 'bg-primary/5 border-primary/20 text-foreground',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500 bg-green-100',
  error: 'text-red-500 bg-red-100',
  loading: 'text-primary bg-primary/10 animate-spin',
  info: 'text-primary bg-primary/10',
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);

    if (t.duration && t.duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, t.duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    removeToastFn = removeToast;
    return () => {
      addToastFn = null;
      removeToastFn = null;
    };
  }, [addToast, removeToast]);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
            animate-[slideIn_0.3s_ease-out] min-w-[280px] max-w-[400px]
            ${bgColors[t.type]}
          `}
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${iconColors[t.type]}`}>
            {icons[t.type]}
          </div>
          <p className="text-sm font-medium flex-1">{t.message}</p>
          {t.type !== 'loading' && (
            <button
              onClick={() => removeToast(t.id)}
              className="text-current opacity-40 hover:opacity-80 cursor-pointer text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body
  );
}
