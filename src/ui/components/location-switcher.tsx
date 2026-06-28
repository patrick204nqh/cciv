import { useLocationStore, switchLocation } from '../stores/location-store';

function formatLabel(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LocationSwitcherPanel() {
  const locations = useLocationStore((s) => s.locations);
  const activeLocation = useLocationStore((s) => s.activeLocation);
  const transitioning = useLocationStore((s) => s.transitioning);

  return (
    <div className="px-3 py-2">
      <select
        value={activeLocation}
        onChange={(e) => switchLocation(e.target.value)}
        disabled={transitioning}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
      >
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {formatLabel(loc)}
          </option>
        ))}
      </select>
    </div>
  );
}
