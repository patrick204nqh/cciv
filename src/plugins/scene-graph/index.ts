import * as THREE from 'three';
import type { ScenePlugin, PluginContext } from '../types';
import { registerTool, destroyTool } from '../sidebar';

export const sceneGraphPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let treeEl: HTMLElement | null = null;
  let propsEl: HTMLElement | null = null;
  let nodeMap = new Map<string, THREE.Object3D>();
  let selectedRow: HTMLElement | null = null;

  function getLabel(obj: THREE.Object3D): string {
    return obj.name || obj.type;
  }

  function selectObject(obj: THREE.Object3D) {
    if (selectedRow) selectedRow.classList.remove('s');
    ctx.selectedObject = obj;

    ctx.scene.traverse(child => {
      if ((child as any).isTransformControls) {
        (child as any).attach(obj);
        (child as any).visible = true;
      }
    });

    updateProps(obj);
  }

  function onRowClick(obj: THREE.Object3D, row: HTMLElement) {
    return () => {
      selectObject(obj);
      row.classList.add('s');
      selectedRow = row;
    };
  }

  function addNode(obj: THREE.Object3D, depth: number, container: HTMLElement) {
    for (const child of obj.children) {
      if ((child as any).isTransformControls) continue;
      nodeMap.set(child.id.toString(), child);

      const row = document.createElement('div');
      row.className = 'sg-r';
      row.style.paddingLeft = `${depth * 16 + 8}px`;

      const icon = document.createElement('span');
      icon.className = 'sg-i';
      if (child instanceof THREE.Mesh) icon.textContent = '◇';
      else if (child instanceof THREE.Light) icon.textContent = '☀';
      else if (child instanceof THREE.Points) icon.textContent = '•';
      else if (child instanceof THREE.Group) icon.textContent = '▤';
      else icon.textContent = '○';
      row.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'sg-l';
      label.textContent = getLabel(child);
      row.appendChild(label);

      const badge = document.createElement('span');
      badge.className = 'sg-b';
      badge.textContent = child.type;
      row.appendChild(badge);

      row.addEventListener('click', onRowClick(child, row));
      container.appendChild(row);
      addNode(child, depth + 1, container);
    }
  }

  function buildTree(container: HTMLElement) {
    nodeMap.clear();
    container.innerHTML = '';
    addNode(ctx.scene, 0, container);
  }

  function updateProps(obj: THREE.Object3D) {
    if (!propsEl) return;
    propsEl.innerHTML = '';
    const fields: [string, string][] = [
      ['Name', obj.name || '(unnamed)'],
      ['Type', obj.type],
      ['Position', `${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)}`],
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
