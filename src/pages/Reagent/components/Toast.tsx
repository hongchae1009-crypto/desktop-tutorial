import { createContext, useCallback, useContext, useRef, useState } from 'react';

// ── Context ────────────────────────────────────────────────────
interface ToastCtx {
  showToast: (msg: string, duration?: number) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, duration = 2400) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(message);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: visible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(60px)',
          background: '#1A1D23',
          color: '#fff',
          padding: '9px 18px',
          borderRadius: '20px',
          fontSize: '12px',
          opacity: visible ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s, transform 0.2s',
          zIndex: 300,
          whiteSpace: 'nowrap',
        }}
      >
        {msg}
      </div>
    </ToastContext.Provider>
  );
}
