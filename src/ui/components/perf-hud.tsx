import { usePerfStore } from '../stores/perf-store';

export function PerfHud() {
  const fps = usePerfStore((s) => s.fps);
  const drawCalls = usePerfStore((s) => s.drawCalls);
  const triangles = usePerfStore((s) => s.triangles);

  return (
    <div id="ph" className="w wi">
      {fps} FPS · {drawCalls} DC · {triangles} tri
    </div>
  );
}
