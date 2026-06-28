import type { ScenePlugin, PluginContext } from '../types';
import type { ISceneObject } from '../../scene/types';
import { registerTool, destroyTool } from '../sidebar';

export const sceneGraphPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let treeEl: HTMLElement | null = null;
  let propsEl: HTMLElement | null = null;
  let nodeMap = new Map<string, ISceneObject>();
  let selectedRow: HTMLElement | null = null;

  function getLabel(obj: ISceneObject): string {
    return obj.name || obj.type;
  }

  function selectObject(obj: ISceneObject) {
    if (selectedRow) selectedRow.classList.remove('s');
    ctx.selectedObject = obj;
    updateProps(obj);
  }

  function addNode(obj: ISceneObject, depth: number, container: HTMLElement) {
    for (const child of obj.children) {
      nodeMap.set(child.id, child);

      const row = document.createElement('div');
      row.className = 'sg-r';
      row.style.paddingLeft = `${depth * 16 + 8}px`;

      const icon = document.createElement('span');
      icon.className = 'sg-i';
      switch (child.type) {
        case 'Mesh': icon.textContent = '◇'; break;
        case 'Group': icon.textContent = '▤'; break;
        case 'Points': icon.textContent = '•'; break;
        default: icon.textContent = '○'; break;
      }
      row.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'sg-l';
      label.textContent = getLabel(child);
      row.appendChild(label);

      const badge = document.createElement('span');
      badge.className = 'sg-b';
      badge.textContent = child.type;
      row.appendChild(badge);

      row.addEventListener('click', () => {
        selectObject(child);
        row.classList.add('s');
        selectedRow = row;
      });
      container.appendChild(row);
      addNode(child, depth + 1, container);
    }
  }

  function buildTree(container: HTMLElement) {
    nodeMap.clear();
    container.innerHTML = '';
    const processed = new Set<string>();
    ctx.scene.traverse(child => {
      if (processed.has(child.id)) return;
      if (!child.parent || !processed.has(child.parent.id)) {
        addNode(child, 0, container);
      }
      processed.add(child.id);
    });
  }

  function updateProps(obj: ISceneObject) {
    if (!propsEl) return;
    propsEl.innerHTML = '';
    const p = obj.position;
    const fields: [string, string][] = [
      ['Name', obj.name || '(unnamed)'],
      ['Type', obj.type],
      ['Position', `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`],
      ['Visible', String(obj.visible)],
      ['Children', String(obj.children.length)],
    ];
    for (const [k, v] of fields) {
      const row = document.createElement('div');
      row.className = 'pr';
      const key = document.createElement('span');
      key.className = 'pk';
      key.textContent = k + ':';
      const val = document.createElement('span');
      val.className = 'pv';
      val.textContent = v;
      row.appendChild(key);
      row.appendChild(val);
      propsEl.appendChild(row);
    }
  }

  function initPanel(container: HTMLElement) {
    treeEl = document.createElement('div');
    container.appendChild(treeEl);

    const divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:var(--border);margin:6px 0;';
    container.appendChild(divider);

    propsEl = document.createElement('div');
    container.appendChild(propsEl);

    buildTree(treeEl);
  }

  function destroyPanel() {
    treeEl = null;
    propsEl = null;
    nodeMap.clear();
    selectedRow = null;
  }

  return {
    id: 'scene-graph',
    label: 'Scene Graph',
    modes: new Set(['edit']),
    priority: 15,

    init(k: PluginContext) {
      ctx = k;
      registerTool({
        id: 'scene-graph',
        label: 'Scene Graph',
        icon: '▤',
        init: initPanel,
        destroy: destroyPanel,
      });
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      if (to === 'edit') {
        selectedRow = null;
        ctx.selectedObject = null;
        if (treeEl) buildTree(treeEl);
        if (propsEl) propsEl.innerHTML = '';
      }
    },

    destroy() {
      destroyPanel();
      destroyTool('scene-graph');
    },
  };
})();
