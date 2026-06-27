import * as THREE from 'three';
import type { ScenePlugin, PluginContext } from '../types';

export const sceneGraphPlugin: ScenePlugin = (() => {
  let ctx: PluginContext;
  let panel: HTMLElement;
  let treeEl: HTMLElement;
  let propsEl: HTMLElement;
  let nodeMap = new Map<string, THREE.Object3D>();
  let selectedRow: HTMLElement | null = null;

  function getLabel(obj: THREE.Object3D): string {
    return obj.name || obj.type;
  }

  function selectObject(obj: THREE.Object3D) {
    if (selectedRow) selectedRow.style.background = 'transparent';
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
      row.style.background = '#335';
      selectedRow = row;
    };
  }

  function addNode(obj: THREE.Object3D, depth: number, container: HTMLElement) {
    for (const child of obj.children) {
      if ((child as any).isTransformControls) continue;
      nodeMap.set(child.id.toString(), child);

      const row = document.createElement('div');
      const indent = depth * 16;
      row.style.cssText = `padding-left:${indent}px;cursor:pointer;padding:2px 4px;font:12px monospace;display:flex;align-items:center;gap:4px;border-radius:2px;`;

      const icon = document.createElement('span');
      if (child instanceof THREE.Mesh) icon.textContent = '◇';
      else if (child instanceof THREE.Light) icon.textContent = '☀';
      else if (child instanceof THREE.Points) icon.textContent = '•';
      else if (child instanceof THREE.Group) icon.textContent = '▤';
      else icon.textContent = '○';
      row.appendChild(icon);

      const label = document.createElement('span');
      label.textContent = getLabel(child);
      row.appendChild(label);

      const badge = document.createElement('span');
      badge.textContent = child.type;
      badge.style.cssText = 'margin-left:auto;font-size:10px;color:#888;';
      row.appendChild(badge);

      row.addEventListener('click', onRowClick(child, row));
      container.appendChild(row);
      addNode(child, depth + 1, container);
    }
  }

  function buildTree() {
    nodeMap.clear();
    treeEl.innerHTML = '';
    addNode(ctx.scene, 0, treeEl);
  }

  function updateProps(obj: THREE.Object3D) {
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
      row.style.cssText = 'display:flex;gap:8px;padding:2px 4px;font:11px monospace;';
      const key = document.createElement('span');
      key.textContent = k + ':';
      key.style.cssText = 'color:#888;min-width:60px;';
      const val = document.createElement('span');
      val.textContent = v;
      row.appendChild(key);
      row.appendChild(val);
      propsEl.appendChild(row);
    }
  }

  return {
    id: 'scene-graph',
    label: 'Scene Graph',
    modes: new Set(['edit']),
    priority: 15,

    init(k: PluginContext) {
      ctx = k;

      panel = document.createElement('div');
      panel.id = 'scene-graph-panel';
      Object.assign(panel.style, {
        position: 'fixed',
        top: '12px',
        left: '12px',
        width: '280px',
        maxHeight: '70vh',
        background: 'rgba(20,20,30,0.92)',
        border: '1px solid #446',
        borderRadius: '6px',
        padding: '8px',
        overflow: 'auto',
        zIndex: '999',
        fontFamily: 'monospace',
        color: '#ccc',
        fontSize: '12px',
      });

      const title = document.createElement('div');
      title.textContent = 'Scene Graph';
      title.style.cssText = 'font-weight:bold;margin-bottom:6px;color:#aac;';
      panel.appendChild(title);

      treeEl = document.createElement('div');
      panel.appendChild(treeEl);

      const divider = document.createElement('div');
      divider.style.cssText = 'height:1px;background:#446;margin:8px 0;';
      panel.appendChild(divider);

      const propsTitle = document.createElement('div');
      propsTitle.textContent = 'Properties';
      propsTitle.style.cssText = 'font-weight:bold;margin-bottom:4px;color:#aac;';
      panel.appendChild(propsTitle);

      propsEl = document.createElement('div');
      panel.appendChild(propsEl);

      document.body.appendChild(panel);
      buildTree();
    },

    onModeSwitch(_from: 'edit' | 'play', to: 'edit' | 'play') {
      if (to === 'edit') {
        selectedRow = null;
        ctx.selectedObject = null;
        buildTree();
        propsEl.innerHTML = '';
      }
    },

    destroy() {
      panel?.remove();
      nodeMap.clear();
      selectedRow = null;
    },
  };
})();
