import { useCallback, useRef } from 'react';
import type { PluginContext } from '../../plugins/types';
import { useInspectorStore } from '../stores/inspector-store';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { useToastStore } from '../stores/toast-store';

function formatValue(value: number): string {
  if (Math.abs(value) < 0.01) return value.toExponential(2);
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(3);
}

function FieldRow({ path, ctx }: { path: string; ctx: PluginContext }) {
  const value = (ctx.state.get as (p: string) => unknown)(path);

  if (typeof value === 'boolean') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-muted)',
            marginRight: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {path.split('.').pop()}
        </span>
        <Switch
          checked={value}
          onCheckedChange={(v) => ctx.state.set(path, v)}
        />
      </div>
    );
  }

  if (typeof value === 'number') {
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
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-muted)',
            }}
          >
            {path.split('.').pop()}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink)',
            }}
          >
            {formatValue(value)}
          </span>
        </div>
        <Slider
          value={[value]}
          onValueChange={([v]) => ctx.state.set(path, v)}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    );
  }

  if (typeof value === 'string' && value.startsWith('#')) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-muted)',
            marginRight: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {path.split('.').pop()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="color"
            value={value}
            onChange={(e) => ctx.state.set(path, e.target.value)}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              cursor: 'pointer',
              padding: 0,
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-muted)',
              width: '64px',
            }}
          >
            {value}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

function SectionContent({ section, ctx }: { section: { label: string; fields: { path: string; label: string; type: string }[] }; ctx: PluginContext }) {
  return (
    <div>
      {section.fields.map((field) => (
        <FieldRow key={field.path} path={field.path} ctx={ctx} />
      ))}
    </div>
  );
}

export function InspectorPanel({ ctx }: { ctx: PluginContext }) {
  const sections = useInspectorStore((s) => s.sections);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savePreset = useCallback(() => {
    const materials = (ctx.state.get as (p: string) => unknown)('instances.ship.materials');
    const data = { format: 'cciv-material-preset', version: 1, materials };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ship-materials-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    useToastStore.getState().show('Preset saved', 'success');
  }, [ctx]);

  const loadPreset = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.format !== 'cciv-material-preset' || data.version !== 1) {
        useToastStore.getState().show('Invalid preset file', 'error');
        return;
      }
      ctx.state.set('instances.ship.materials', data.materials);
      useToastStore.getState().show('Preset loaded', 'success');
    } catch {
      useToastStore.getState().show('Failed to load preset', 'error');
    }
    e.target.value = '';
  }, [ctx]);

  return (
    <div>
      <Accordion type="multiple" className="w-full">
        {sections.map((section) => (
          <AccordionItem key={section.label} value={section.label}>
            <AccordionTrigger>{section.label}</AccordionTrigger>
            <AccordionContent>
              <SectionContent section={section} ctx={ctx} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          marginTop: '8px',
          padding: '8px 12px',
          display: 'flex',
          gap: '8px',
        }}
      >
        <Button variant="outline" size="sm" onClick={savePreset} className="flex-1 text-xs">
          Save Preset
        </Button>
        <Button variant="outline" size="sm" onClick={loadPreset} className="flex-1 text-xs">
          Load Preset
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
