import { useCallback } from 'react';
import { useModeStore } from '../stores/mode-store';
import { bridgeStore } from '../bridge';

export function ModeBadge() {
  const mode = useModeStore((s) => s.mode);
  const setMode = useModeStore((s) => s.setMode);

  const handleClick = useCallback(() => {
    const ctx = bridgeStore.getState().pluginCtx;
    if (!ctx) return;
    const next = mode === 'edit' ? 'play' : 'edit';
    ctx.setMode(next);
    setMode(next);
  }, [mode, setMode]);

  const isEdit = mode === 'edit';

  return (
    <button
      id="mb"
      className={isEdit ? 'e' : 'p'}
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '12px',
        zIndex: 1000,
        padding: '5px 12px',
        borderRadius: '3px',
        color: 'var(--ink)',
        font: '11px var(--font-mono)',
        letterSpacing: '1.5px',
        cursor: 'pointer',
        userSelect: 'none',
        background: isEdit ? 'oklch(0.25 0.06 260)' : 'var(--surface)',
        border: isEdit ? '1px solid var(--accent-dim)' : '1px solid var(--ink-muted)',
        transition: 'background 300ms ease, border-color 300ms ease',
        pointerEvents: 'auto',
      }}
    >
      {isEdit ? 'EDIT' : 'PLAY'}
    </button>
  );
}
