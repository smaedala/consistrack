import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastItem = {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
};

type ToastStackProps = {
  items: ToastItem[];
  theme: 'dark' | 'light';
  onDismiss: (id: number) => void;
};

export function ToastStack({ items, theme, onDismiss }: ToastStackProps) {
  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((toast) =>
      window.setTimeout(() => onDismiss(toast.id), 3200)
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [items, onDismiss]);

  const c =
    theme === 'dark'
      ? { bg: '#1E2025', border: '#2A2D35', text: '#F4F7FB', sub: '#9CA3AF' }
      : { bg: '#FFFFFF', border: '#E5E7EB', text: '#0F172A', sub: '#64748B' };

  return (
    <div className="fixed top-20 right-4 z-[140] space-y-2 w-[min(92vw,360px)]">
      {items.map((toast) => {
        const color =
          toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#00F2FE';
        const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertTriangle : Info;

        return (
          <div
            key={toast.id}
            className="rounded-xl border shadow-lg px-3 py-2 flex items-start gap-2"
            style={{ backgroundColor: c.bg, borderColor: c.border }}
          >
            <Icon className="w-4 h-4 mt-0.5" style={{ color }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm" style={{ color: c.text }}>{toast.message}</p>
            </div>
            <button
              className="text-xs"
              style={{ color: c.sub }}
              onClick={() => onDismiss(toast.id)}
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}

