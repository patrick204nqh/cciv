import { usePerfStore } from '../stores/perf-store';

export function PerfHud() {
  const fps = usePerfStore((s) => s.fps);
  const drawCalls = usePerfStore((s) => s.drawCalls);
  const triangles = usePerfStore((s) => s.triangles);

  return (
    <div
      style={{
        position: 'fixed',
        top: '8px',
        right: 'calc(var(--tb-w, 44px) + 8px)',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        background: 'var(--hud-bg)',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '6px 10px',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        font: '11px var(--font-mono)',
        color: 'oklch(0.60 0.10 150)',
      }}
    >
      {fps} FPS · {drawCalls} DC · {triangles} tri
    </div>
  );
}
