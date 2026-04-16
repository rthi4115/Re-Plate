import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
let _addToast: ((msg: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = 'success') {
  _addToast?.(message, type);
}

// ── Provider / Renderer ───────────────────────────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  _addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const icons: Record<ToastType, string> = {
    success: '✅',
    info: '🔔',
    error: '❌',
  };

  const colors: Record<ToastType, string> = {
    success: 'border-[#22C55E] bg-[rgba(34,197,94,0.1)]',
    info: 'border-blue-500 bg-blue-500/10',
    error: 'border-red-500 bg-red-500/10',
  };

  const textColors: Record<ToastType, string> = {
    success: 'text-[#22C55E]',
    info: 'text-blue-400',
    error: 'text-red-400',
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90%] max-w-[380px] pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-sm ${colors[t.type]}`}
          style={{ animation: 'toastIn 0.3s ease-out' }}
        >
          <span className="text-lg shrink-0">{icons[t.type]}</span>
          <span className={`text-sm font-bold ${textColors[t.type]}`}>{t.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>
    </div>
  );
}
