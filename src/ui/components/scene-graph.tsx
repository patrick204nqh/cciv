import { useCallback } from 'react';
import type { PluginContext } from '../../plugins/types';
import { useSceneGraphStore, type TreeNode, type PropField } from '../stores/scene-graph-store';

const TYPE_ICONS: Record<string, string> = {
  Mesh: '◇',
  Group: '▤',
  Points: '•',
};

function TypeIcon({ type }: { type: string }) {
  return <span className="sg-i w-4 text-center shrink-0">{TYPE_ICONS[type] ?? '○'}</span>;
}

function TreeNodeRow({ node, depth, onSelect, selectedId, ctx }: {
  node: TreeNode
  depth: number
  onSelect: (id: string, obj: unknown) => void
  selectedId: string | null
  ctx: PluginContext
}) {
  const isSelected = node.id === selectedId;

  return (
    <>
      <button
        className={`sg-r flex w-full items-center gap-1 px-2 py-0.5 text-left text-xs font-mono text-ink rounded-sm transition-colors hover:bg-surface-hover ${isSelected ? 'bg-[oklch(0.25_0.06_260)]' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id, ctx)}
      >
        <TypeIcon type={node.type} />
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {node.name || '(unnamed)'}
        </span>
        <span className="sg-b text-[9px] text-ink-muted shrink-0">{node.type}</span>
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
      <div className="h-px bg-border mx-0 my-1.5" />
      <div className="px-2">
        {props.map(({ key, value }) => (
          <div key={key} className="flex gap-2 py-0.5 text-[10px] font-mono">
            <span className="text-ink-muted min-w-[60px] shrink-0">{key}:</span>
            <span className="text-ink">{value}</span>
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
