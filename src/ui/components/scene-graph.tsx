import { useCallback } from 'react';
import type { PluginContext } from '../../plugins/types';
import { useSceneGraphStore, type TreeNode, type PropField } from '../stores/scene-graph-store';
import { CubeIcon, GroupIcon, DotFilledIcon } from '@radix-ui/react-icons';

function TypeIcon({ type }: { type: string }) {
  const size = 12;
  const color = 'var(--gold-dim)';
  switch (type) {
    case 'Mesh': return <CubeIcon width={size} height={size} color={color} />;
    case 'Group': return <GroupIcon width={size} height={size} color={color} />;
    case 'Points': return <DotFilledIcon width={size} height={size} color={color} />;
    default: return <DotFilledIcon width={size} height={size} color={color} />;
  }
}

function TreeNodeRow({ node, depth, onSelect, selectedId, ctx }: {
  node: TreeNode
  depth: number
  onSelect: (id: string) => void
  selectedId: string | null
  ctx: PluginContext
}) {
  const isSelected = node.id === selectedId;

  return (
    <>
      <button
        onClick={() => onSelect(node.id)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          paddingLeft: `${depth * 16 + 8}px`,
          textAlign: 'left',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink)',
          borderRadius: '2px',
          border: 'none',
          background: isSelected ? 'oklch(0.25 0.06 260)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent';
        }}
      >
        <TypeIcon type={node.type} />
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.name || '(unnamed)'}
        </span>
        <span
          style={{
            fontSize: '9px',
            color: 'var(--ink-muted)',
            flexShrink: 0,
          }}
        >
          {node.type}
        </span>
      </button>
      {node.children.map((child) => (
        <TreeNodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          selectedId={selectedId}
          ctx={ctx}
        />
      ))}
    </>
  );
}

function PropsPanel({ props }: { props: PropField[] }) {
  if (props.length === 0) return null;
  return (
    <>
      <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
      <div style={{ padding: '0 8px' }}>
        {props.map(({ key, value }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '1px 0',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span style={{ color: 'var(--ink-muted)', minWidth: '60px', flexShrink: 0 }}>
              {key}:
            </span>
            <span style={{ color: 'var(--ink)' }}>{value}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function SceneGraphPanel({ ctx }: { ctx: PluginContext }) {
  const tree = useSceneGraphStore((s) => s.tree);
  const selectedId = useSceneGraphStore((s) => s.selectedId);
  const props = useSceneGraphStore((s) => s.props);
  const nodeMap = useSceneGraphStore((s) => s.nodeMap);
  const select = useSceneGraphStore((s) => s.select);
  const setProps = useSceneGraphStore((s) => s.setProps);

  const handleSelect = useCallback((id: string) => {
    select(id);
    const obj = nodeMap.get(id);
    if (obj) {
      ctx.selectedObject = obj;
      const p = obj.position;
      setProps([
        { key: 'Name', value: obj.name || '(unnamed)' },
        { key: 'Type', value: obj.type },
        { key: 'Position', value: `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}` },
        { key: 'Visible', value: String(obj.visible) },
        { key: 'Children', value: String(obj.children.length) },
      ]);
    }
  }, [select, nodeMap, ctx, setProps]);

  return (
    <div>
      <div>
        {tree.map((root) => (
          <TreeNodeRow
            key={root.id}
            node={root}
            depth={0}
            onSelect={handleSelect}
            selectedId={selectedId}
            ctx={ctx}
          />
        ))}
      </div>
      <PropsPanel props={props} />
    </div>
  );
}
