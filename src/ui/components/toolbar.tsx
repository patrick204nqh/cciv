import { useToolbarStore } from '../stores/toolbar-store';

export function Toolbar() {
  const tools = useToolbarStore((s) => s.tools);
  const activeToolId = useToolbarStore((s) => s.activeToolId);
  const collapsed = useToolbarStore((s) => s.collapsed);
  const activateTool = useToolbarStore((s) => s.activateTool);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 'var(--tb-w, 44px)',
        height: '100vh',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        gap: '2px',
        transition: 'transform var(--ts, 400ms) cubic-bezier(0.16,1,0.3,1)',
        transform: collapsed ? 'translateX(var(--tb-w, 44px))' : 'none',
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.id}
          data-tool={tool.id}
          title={tool.label}
          onClick={() => activateTool(tool.id)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: 'none',
            background: activeToolId === tool.id ? 'oklch(0.25 0.06 260)' : 'transparent',
            color: activeToolId === tool.id ? 'var(--gold)' : 'var(--ink-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            transition: 'background 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (activeToolId !== tool.id) {
              e.currentTarget.style.background = 'var(--surface-hover)';
              e.currentTarget.style.color = 'var(--ink)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeToolId !== tool.id) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--ink-muted)';
            }
          }}
        >
          {tool.icon}
        </button>
      ))}
      <div style={{ flex: 1 }} />
    </div>
  );
}
