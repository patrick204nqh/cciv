import { createRoot } from 'react-dom/client';
import { ReactShell } from './shell';

export function mountReactShell() {
  const host = document.createElement('div');
  host.id = '__react';
  host.style.display = 'none';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<ReactShell />);
  return root;
}
