import { useToolbarStore } from '../stores/toolbar-store';
import { PluginContextProvider } from '../context/plugin-context';
import { bridgeStore } from '../bridge';

export function ToolPanel() {
  const activeToolId = useToolbarStore((s) => s.activeToolId);
  const tools = useToolbarStore((s) => s.tools);
  const closePanel = useToolbarStore((s) => s.closePanel);
  const ctx = bridgeStore((s) => s.pluginCtx);

  const activeTool = tools.find((t) => t.id === activeToolId);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 'var(--tb-w, 44px)',
        width: 'var(--pn-w, 280px)',
        height: '100vh',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 299,
        transform: activeTool ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform var(--ts, 400ms) cubic-bezier(0.16,1,0.3,1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {activeTool && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '12px',
                letterSpacing: '2px',
                fontWeight: 400,
                color: 'var(--gold)',
                margin: 0,
              }}
            >
              {activeTool.label}
            </h3>
            <button
              onClick={closePanel}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                font: '14px var(--font-ui)',
                padding: '2px 6px',
                borderRadius: '2px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-muted)'; }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {activeTool.component && ctx ? (
              <PluginContextProvider value={ctx}>
                <activeTool.component ctx={ctx} />
              </PluginContextProvider>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
