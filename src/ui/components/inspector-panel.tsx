import { useCallback, useRef } from 'react';
import type { PluginContext } from '../../plugins/types';
import { useInspectorStore } from '../stores/inspector-store';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Button } from './ui/button';

function FieldRow({ path, ctx }: { path: string; ctx: PluginContext }) {
  const value = (ctx.state.get as (p: string) => unknown)(path);

  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs font-mono text-muted-foreground truncate mr-2">
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
      <div className="py-1.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            {path.split('.').pop()}
          </span>
          <span className="text-xs font-mono text-foreground">{Number(value).toFixed(4)}</span>
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
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs font-mono text-muted-foreground truncate mr-2">
          {path.split('.').pop()}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => ctx.state.set(path, e.target.value)}
            className="h-7 w-10 rounded border border-border bg-background cursor-pointer"
          />
          <span className="text-[10px] font-mono text-ink-muted w-16">{value}</span>
        </div>
      </div>
    );
  }

  return null;
}

function SectionContent({ section, ctx }: { section: { label: string; fields: { path: string; label: string; type: string }[] }; ctx: PluginContext }) {
  return (
    <div className="space-y-0.5">
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
        console.warn('Invalid material preset file');
        return;
      }
      ctx.state.set('instances.ship.materials', data.materials);
    } catch {
      console.warn('Failed to load material preset');
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

      <div className="border-t border-border mt-2 pt-2 px-3 flex gap-2">
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
