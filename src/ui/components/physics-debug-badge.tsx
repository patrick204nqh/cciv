import { usePhysicsDebugStore } from '../stores/physics-debug-store';

export function PhysicsDebugBadge() {
  const visible = usePhysicsDebugStore((s) => s.visible);
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '48px',
        left: '12px',
        zIndex: 1000,
        padding: '3px 10px',
        borderRadius: '3px',
        background: 'oklch(0.15 0.06 50 / 0.9)',
        border: '1px solid oklch(0.50 0.15 55)',
        color: 'oklch(0.80 0.10 55)',
        font: '10px var(--font-mono)',
        letterSpacing: '1px',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      PHYSICS DBG
    </div>
  );
}
