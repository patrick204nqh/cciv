import { createPortal } from 'react-dom';
import { PluginContextProvider } from './context/plugin-context';
import { PerfHud } from './components/perf-hud';
import { bridgeStore } from './bridge';

export function ReactShell() {
  const pluginCtx = bridgeStore((s) => s.pluginCtx);
  if (!pluginCtx) return null;

  const phEl = document.getElementById('ph');
  if (!phEl) return null;

  return (
    <PluginContextProvider value={pluginCtx}>
      {createPortal(<PerfHud />, phEl)}
    </PluginContextProvider>
  );
}
