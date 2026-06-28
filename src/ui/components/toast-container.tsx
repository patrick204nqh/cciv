import { useToastStore } from '../stores/toast-store';

const TYPE_COLORS = {
  info: 'var(--gold)',
  success: 'oklch(0.60 0.15 150)',
  error: 'oklch(0.60 0.20 30)',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '48px',
        right: 'calc(var(--tb-w) + 12px)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'auto',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => dismiss(toast.id)}
          style={{
            padding: '6px 12px',
            borderRadius: '3px',
            background: 'var(--surface)',
            border: `1px solid ${TYPE_COLORS[toast.type]}`,
            color: 'var(--ink)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            opacity: 0.95,
            transition: 'opacity 200ms ease',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
