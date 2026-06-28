import { useShipHudStore } from '../stores/ship-hud-store';

export function ShipLog() {
  const windSpeed = useShipHudStore((s) => s.windSpeed);
  const swellHeight = useShipHudStore((s) => s.swellHeight);
  const timeString = useShipHudStore((s) => s.timeString);
  const heading = useShipHudStore((s) => s.heading);
  const speed = useShipHudStore((s) => s.speed);
  const visible = useShipHudStore((s) => s.visible);

  if (!visible) return null;

  return (
    <div
      id="sl"
      className="w on"
      style={{
        position: 'fixed',
        top: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 1,
        transition: 'opacity 800ms ease',
      }}
    >
      <div
        className="wi sl-i"
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink)',
          background: 'var(--hud-bg)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '8px 12px',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <span><span className="sl-l" style={{ color: 'var(--ink-muted)' }}>WIND</span> {windSpeed} kn</span>
        <span><span className="sl-l" style={{ color: 'var(--ink-muted)' }}>SWELL</span> {swellHeight} m</span>
        <span><span className="sl-l" style={{ color: 'var(--ink-muted)' }}>TIME</span> {timeString} Z</span>
        <span><span className="sl-l" style={{ color: 'var(--ink-muted)' }}>HDG</span> {heading}°</span>
        <span><span className="sl-l" style={{ color: 'var(--ink-muted)' }}>SPD</span> {speed} kn</span>
      </div>
    </div>
  );
}
