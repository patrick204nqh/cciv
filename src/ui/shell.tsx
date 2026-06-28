import { useRef, useEffect } from 'react';
import { bridgeStore } from './bridge';
import { TitleHeader } from './components/title-header';
import { Toolbar } from './components/toolbar';
import { ToolPanel } from './components/tool-panel';
import { ModeBadge } from './components/mode-badge';
import { ControlHint } from './components/control-hint';
import { PerfHud } from './components/perf-hud';
import { ShipLog } from './components/ship-log';
import { GizmoToolbar } from './components/gizmo-toolbar';
import { ToastContainer } from './components/toast-container';
import { PhysicsDebugBadge } from './components/physics-debug-badge';

export function MainShell() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      bridgeStore.getState().setCanvasContainer(canvasRef.current);
    }
  }, []);

  return (
    <>
      <div
        ref={canvasRef}
        id="canvas-container"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      <TitleHeader />
      <Toolbar />
      <ToolPanel />
      <ModeBadge />
      <ControlHint />
      <PerfHud />
      <ShipLog />
      <GizmoToolbar />
      <ToastContainer />
      <PhysicsDebugBadge />
    </>
  );
}
