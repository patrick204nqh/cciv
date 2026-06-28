import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MainShell } from './shell';
import { bridgeStore } from './bridge';

export function mountReactShell(): HTMLElement {
  const host = document.getElementById('root')!;
  const root = createRoot(host);
  flushSync(() => root.render(<MainShell />));
  return bridgeStore.getState().canvasContainer!;
}
