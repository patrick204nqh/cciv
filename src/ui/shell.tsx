import { PluginContextProvider } from './context/plugin-context';
import { PerfHud } from './components/perf-hud';
import { ModeBadge } from './components/mode-badge';
import { ControlHint } from './components/control-hint';
import { ShipLog } from './components/ship-log';
import { GizmoToolbar } from './components/gizmo-toolbar';
import { ToastContainer } from './components/toast-container';
import { bridgeStore } from './bridge';

export function ReactShell() {
  const pluginCtx = bridgeStore((s) => s.pluginCtx);
  if (!pluginCtx) return null;

  return (
    <PluginContextProvider value={pluginCtx}>
      <ModeBadge />
      <ControlHint />
      <PerfHud />
      <ShipLog />
      <GizmoToolbar />
      <ToastContainer />
    </PluginContextProvider>
  );
}
