import { create } from 'zustand';
import type { ISceneObject } from '../../scene/types';

export interface TreeNode {
  id: string
  name: string
  type: string
  depth: number
  children: TreeNode[]
}

export interface PropField {
  key: string
  value: string
}

interface SceneGraphState {
  tree: TreeNode[]
  selectedId: string | null
  props: PropField[]
  nodeMap: Map<string, ISceneObject>
  setTree: (tree: TreeNode[], map: Map<string, ISceneObject>) => void
  select: (id: string | null) => void
  setProps: (props: PropField[]) => void
  clear: () => void
}

export const useSceneGraphStore = create<SceneGraphState>((set) => ({
  tree: [],
  selectedId: null,
  props: [],
  nodeMap: new Map(),

  setTree: (tree, nodeMap) => set({ tree, nodeMap, selectedId: null, props: [] }),

  select: (id) => set({ selectedId: id }),

  setProps: (props) => set({ props }),

  clear: () => set({ tree: [], nodeMap: new Map(), selectedId: null, props: [] }),
}));
