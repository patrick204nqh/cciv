import { useSelectionStore, type GizmoMode } from '../stores/selection-store';

const MODES: { mode: GizmoMode; label: string; icon: string }[] = [
  { mode: 'translate', label: 'Translate', icon: '↕' },
  { mode: 'rotate', label: 'Rotate', icon: '↻' },
  { mode: 'scale', label: 'Scale', icon: '⇔' },
];

export function GizmoToolbar() {
  const gizmoMode = useSelectionStore((s) => s.gizmoMode);
  const selectedId = useSelectionStore((s) => s.selectedId);
  const setGizmoMode = useSelectionStore((s) => s.setGizmoMode);
  const snapEnabled = useSelectionStore((s) => s.snapEnabled);
  const toggleSnap = useSelectionStore((s) => s.toggleSnap);

  if (!selectedId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        display: 'flex',
        gap: '2px',
        padding: '4px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        pointerEvents: 'auto',
      }}
    >
      {MODES.map(({ mode, label, icon }) => (
        <button
          key={mode}
          title={label}
          onClick={() => setGizmoMode(mode)}
          style={{
            width: '30px',
            height: '30px',
            border: 'none',
            borderRadius: '3px',
            background: gizmoMode === mode ? 'oklch(0.25 0.06 260)' : 'transparent',
            color: gizmoMode === mode ? 'var(--accent)' : 'var(--ink-muted)',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 150ms ease, color 150ms ease',
          }}
        >
          {icon}
        </button>
      ))}
      <div style={{ width: '1px', background: 'var(--border)', margin: '4px 0' }} />
      <button
        title={`Snap ${snapEnabled ? 'ON' : 'OFF'}`}
        onClick={toggleSnap}
        style={{
          width: '30px',
          height: '30px',
          border: 'none',
          borderRadius: '3px',
          background: snapEnabled ? 'oklch(0.25 0.06 260)' : 'transparent',
          color: snapEnabled ? 'var(--accent)' : 'var(--ink-muted)',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 150ms ease, color 150ms ease',
        }}
      >
        ⊞
      </button>
    </div>
  );
}
