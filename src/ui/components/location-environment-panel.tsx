import { useState, useSyncExternalStore, useRef } from 'react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import type { PluginContext } from '../../plugins/types';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Slider } from './ui/slider';
import { applyEnvironment } from '../../plugins/environment-controller';
import { LOCATION_PRESETS } from '../../state/worlds';
import type { WeatherType } from '../../state/types';

function formatLabel(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function envPath(ctx: PluginContext, sub: string): string {
  const loc = ctx.state.get('activeLocation') as string;
  return `locations.${loc}.environment.${sub}`;
}

const WEATHERS: { id: WeatherType; icon: string }[] = [
  { id: 'clear', icon: '☀' },
  { id: 'cloudy', icon: '☁' },
  { id: 'storm', icon: '🌧' },
  { id: 'fog', icon: '🌫' },
];

function formatValue(v: number): string {
  if (Math.abs(v) < 0.01) return v.toExponential(2);
  return v.toFixed(3);
}

function SliderRow({
  path,
  label,
  min,
  max,
  step,
  ctx,
}: {
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
  ctx: PluginContext;
}) {
  const value = useSyncExternalStore(
    (cb) => ctx.state.subscribe(path, () => cb()),
    () => (ctx.state.get as (p: string) => unknown)(path) as number,
  );

  return (
    <div style={{ padding: '4px 8px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2px',
        }}
      >
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
          {label}
        </span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
          {formatValue(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => {
          ctx.state.set(path, v);
          applyEnvironment(ctx);
        }}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function ColorRow({
  path,
  label,
  ctx,
}: {
  path: string;
  label: string;
  ctx: PluginContext;
}) {
  const value = useSyncExternalStore(
    (cb) => ctx.state.subscribe(path, () => cb()),
    () => (ctx.state.get as (p: string) => unknown)(path) as string,
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => {
            ctx.state.set(path, e.target.value);
            applyEnvironment(ctx);
          }}
          style={{ width: '28px', height: '28px', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer', padding: 0 }}
        />
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', width: '64px' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function LocationEnvironmentPanel({ ctx }: { ctx: PluginContext }) {
  const loc = useSyncExternalStore(
    (cb) => ctx.state.subscribe('activeLocation', () => cb()),
    () => (ctx.state.get as (p: string) => unknown)('activeLocation') as string,
  );

  const locKeysRef = useRef<string[]>(Object.keys(ctx.state.get('locations') as Record<string, unknown>));
  const locations = useSyncExternalStore(
    (cb) => ctx.state.subscribe('locations', () => {
      locKeysRef.current = Object.keys(ctx.state.get('locations') as Record<string, unknown>);
      cb();
    }),
    () => locKeysRef.current,
  );

  const weatherPath = `locations.${loc}.environment.weather`;
  const weather = useSyncExternalStore(
    (cb) => ctx.state.subscribe(weatherPath, () => cb()),
    () => (ctx.state.get as (p: string) => unknown)(weatherPath) as WeatherType,
  );

  const [transitioning, setTransitioning] = useState(false);

  function handleLocationSwitch(id: string) {
    if (transitioning || id === loc) return;
    setTransitioning(true);
    const preset = LOCATION_PRESETS[id];
    if (preset) {
      ctx.state.set('activeLocation', id);
      ctx.state.set('instances', structuredClone(preset.instances));
    }
    setTransitioning(false);
  }

  return (
    <div key={loc}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', letterSpacing: '1px', marginBottom: '6px' }}>
          LOCATION
        </div>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <select
            value={loc}
            onChange={(e) => handleLocationSwitch(e.target.value)}
            disabled={transitioning}
            style={{
              width: '100%',
              background: 'var(--bg)',
              color: 'var(--ink)',
              border: transitioning ? '1px solid var(--gold-dim)' : '1px solid var(--border)',
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
            {locations.map((id) => (
              <option key={id} value={id}>{formatLabel(id)}</option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center' }}>
            <ChevronDownIcon width={12} height={12} />
          </div>
        </div>

        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', letterSpacing: '1px', marginBottom: '6px' }}>
          WEATHER
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {WEATHERS.map(({ id, icon }) => (
            <button
              key={id}
              onClick={() => ctx.state.set(weatherPath, id)}
              style={{
                flex: 1,
                background: weather === id ? 'var(--gold-dim)' : 'var(--bg)',
                color: weather === id ? '#000' : 'var(--ink)',
                border: weather === id ? '1px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: '3px',
                padding: '6px 4px',
                font: '13px var(--font-ui)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 150ms ease',
              }}
              title={formatLabel(id)}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={['wind']}>
        <AccordionItem value="wind">
          <AccordionTrigger>Wind</AccordionTrigger>
          <AccordionContent>
            <SliderRow path={envPath(ctx, 'wind.speed')} label="Speed" min={0} max={40} step={0.5} ctx={ctx} />
            <SliderRow path={envPath(ctx, 'wind.direction')} label="Direction" min={0} max={6.283} step={0.05} ctx={ctx} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="waves">
          <AccordionTrigger>Waves</AccordionTrigger>
          <AccordionContent>
            <SliderRow path={envPath(ctx, 'waves.0.amplitude')} label="Primary Amp" min={0} max={4} step={0.05} ctx={ctx} />
            <SliderRow path={envPath(ctx, 'waves.1.amplitude')} label="Secondary Amp" min={0} max={4} step={0.05} ctx={ctx} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fog">
          <AccordionTrigger>Fog</AccordionTrigger>
          <AccordionContent>
            <SliderRow path={envPath(ctx, 'fog.density')} label="Density" min={0} max={0.01} step={0.0001} ctx={ctx} />
            <ColorRow path={envPath(ctx, 'fog.color')} label="Color" ctx={ctx} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="lighting">
          <AccordionTrigger>Lighting</AccordionTrigger>
          <AccordionContent>
            <SliderRow path={envPath(ctx, 'lighting.sun.intensity')} label="Sun" min={0} max={5} step={0.1} ctx={ctx} />
            <SliderRow path={envPath(ctx, 'lighting.hemisphere.intensity')} label="Hemisphere" min={0} max={3} step={0.1} ctx={ctx} />
            <SliderRow path={envPath(ctx, 'lighting.fill.intensity')} label="Fill" min={0} max={3} step={0.1} ctx={ctx} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sky">
          <AccordionTrigger>Sky</AccordionTrigger>
          <AccordionContent>
            <ColorRow path={envPath(ctx, 'sky.gradientTop')} label="Top color" ctx={ctx} />
            <ColorRow path={envPath(ctx, 'sky.gradientBottom')} label="Bottom color" ctx={ctx} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
