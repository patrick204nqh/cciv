import { ChevronDownIcon } from '@radix-ui/react-icons';
import { useLocationStore, switchLocation, setWeather } from '../stores/location-store';
import type { WeatherType } from '../../state/types';

function formatLabel(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const WEATHERS: { id: WeatherType; icon: string }[] = [
  { id: 'clear', icon: '☀' },
  { id: 'cloudy', icon: '☁' },
  { id: 'storm', icon: '🌧' },
  { id: 'fog', icon: '🌫' },
];

export function LocationSwitcherPanel() {
  const locations = useLocationStore((s) => s.locations);
  const activeLocation = useLocationStore((s) => s.activeLocation);
  const weather = useLocationStore((s) => s.weather);
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
      <div style={{ position: 'relative', marginBottom: '16px' }}>
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

      <div
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink-muted)',
          letterSpacing: '1px',
          marginBottom: '6px',
        }}
      >
        WEATHER
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {WEATHERS.map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => setWeather(id)}
            style={{
              flex: 1,
              background: weather === id ? 'var(--gold-dim)' : 'var(--bg)',
              color: weather === id ? '#000' : 'var(--ink)',
              border: weather === id
                ? '1px solid var(--gold)'
                : '1px solid var(--border)',
              borderRadius: '3px',
              padding: '6px 4px',
              font: '13px var(--font-ui)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 150ms ease',
              opacity: transitioning ? 0.5 : 1,
            }}
            title={formatLabel(id)}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
