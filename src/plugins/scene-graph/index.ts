import type { ScenePlugin, PluginContext } from '../types';
import type { ISceneObject } from '../../scene/types';
import { registerTool, destroyTool } from '../sidebar';
import { useSceneGraphStore, type TreeNode } from '../../ui/stores/scene-graph-store';
import { SceneGraphPanel } from '../../ui/components/scene-graph';

function getLabel(obj: ISceneObject): string {
  return obj.name || obj.type;
}

function buildTreeData(ctx: PluginContext): { tree: TreeNode[]; nodeMap: Map<string, ISceneObject> } {
  const nodeMap = new Map<string, ISceneObject>();
  const tree: TreeNode[] = [];

  function addChildren(parents: readonly ISceneObject[], depth: number, out: TreeNode[]) {
    for (const child of parents) {
      nodeMap.set(child.id, child);
      const children: TreeNode[] = [];
      const node: TreeNode = {
        id: child.id,
        name: getLabel(child),
        type: child.type,
        depth,
        children,
      };
      out.push(node);
      addChildren(child.children, depth + 1, children);
    }
  }

  const processed = new Set<string>();
  ctx.scene.traverse((child) => {
    if (processed.has(child.id)) return;
    if (!child.parent || !processed.has(child.parent.id)) {
      nodeMap.set(child.id, child);
      const children: TreeNode[] = [];
      tree.push({
        id: child.id,
        name: getLabel(child),
        type: child.type,
        depth: 0,
        children,
      });
      addChildren(child.children, 1, children);
    }
    processed.add(child.id);
  });

  return { tree, nodeMap };
}

export const sceneGraphPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;

  return {
    id: 'scene-graph',
    label: 'Scene Graph',
    modes: new Set(['edit']),
    priority: 15,

    init(k: PluginContext) {
      ctx = k;
      const { tree, nodeMap } = buildTreeData(ctx);
      useSceneGraphStore.getState().setTree(tree, nodeMap);
      registerTool({
        id: 'scene-graph',
        label: 'Scene Graph',
        icon: '▤',
        component: SceneGraphPanel,
      });
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      if (to === 'edit') {
        useSceneGraphStore.getState().clear();
        if (ctx) {
          const { tree, nodeMap } = buildTreeData(ctx);
          useSceneGraphStore.getState().setTree(tree, nodeMap);
        }
      }
    },

    destroy() {
      destroyTool('scene-graph');
    },
  };
})();
