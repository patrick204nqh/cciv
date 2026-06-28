import { createContext, useContext } from 'react';
import type { PluginContext } from '../../plugins/types';

const PluginCtx = createContext<PluginContext | null>(null);

export const PluginContextProvider = PluginCtx.Provider;

export function usePluginContext(): PluginContext {
  const ctx = useContext(PluginCtx);
  if (!ctx) throw new Error('usePluginContext must be used within PluginContextProvider');
  return ctx;
}
