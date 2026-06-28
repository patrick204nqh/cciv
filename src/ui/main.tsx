import { createRoot } from 'react-dom/client';
import { ReactShell } from './shell';

export function mountReactShell() {
  const host = document.createElement('div');
  host.id = '__react';
  host.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<ReactShell />);
  return root;
}
