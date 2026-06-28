import { ChevronDownIcon } from '@radix-ui/react-icons';
import { useLocationStore, switchLocation } from '../stores/location-store';

function formatLabel(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LocationSwitcherPanel() {
  const locations = useLocationStore((s) => s.locations);
  const activeLocation = useLocationStore((s) => s.activeLocation);
  const transitioning = useLocationStore((s) => s.transitioning);

  return (
    <div style={{ padding: '8px 12px' }}>
      <div
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink-muted)',
          letterSpacing: '1px',
          marginBottom: '6px',
        }}
      >
        CURRENT LOCATION
      </div>
      <div style={{ position: 'relative' }}>
        <select
          value={activeLocation}
          onChange={(e) => switchLocation(e.target.value)}
          disabled={transitioning}
          style={{
            width: '100%',
            background: 'var(--bg)',
            color: 'var(--ink)',
            border: transitioning
              ? '1px solid var(--gold-dim)'
              : '1px solid var(--border)',
            borderRadius: '3px',
            padding: '6px 24px 6px 8px',
            font: '11px var(--font-mono)',
            cursor: transitioning ? 'not-allowed' : 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            opacity: transitioning ? 0.6 : 1,
            transition: 'border-color 200ms ease, opacity 200ms ease',
          }}
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {formatLabel(loc)}
            </option>
          ))}
        </select>
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--ink-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDownIcon width={12} height={12} />
        </div>
        {transitioning && (
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--gold-dim)',
              marginTop: '6px',
            }}
          >
            transitioning...
          </div>
        )}
      </div>
    </div>
  );
}
