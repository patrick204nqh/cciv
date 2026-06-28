import { useState, useEffect } from 'react';
import { bridgeStore } from '../bridge';

export function useStateValue<T>(path: string): T {
  const pluginCtx = bridgeStore((s) => s.pluginCtx);
  const [value, setValue] = useState(() => {
    if (!pluginCtx) return undefined as T;
    return (pluginCtx.state.get as (p: string) => unknown)(path) as T;
  });

  useEffect(() => {
    if (!pluginCtx) return;
    return (pluginCtx.state.subscribe as (p: string, fn: (v: unknown) => void) => () => void)(path, (val) => setValue(val as T));
  }, [path, pluginCtx]);

  return value;
}
