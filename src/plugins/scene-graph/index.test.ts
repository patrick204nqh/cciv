// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { sceneGraphPlugin } from './index';
import type { PluginContext } from '../types';

function mockPluginContext(): PluginContext {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  group.name = 'test-group';
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  mesh.name = 'test-mesh';
  group.add(mesh);
  scene.add(group);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial()));

  return {
    scene,
    store: {} as any,
    mode: 'edit',
    selectedObject: null,
    setMode: () => {},
  };
}

describe('sceneGraphPlugin', () => {
  let ctx: PluginContext;

  beforeEach(() => {
    document.body.innerHTML = '<div id="tb"></div><div id="pn"><div id="pn-b"></div><div id="pn-t"></div><div id="pn-x"></div></div>';
    ctx = mockPluginContext();
  });

  it('has correct identity', () => {
    expect(sceneGraphPlugin.id).toBe('scene-graph');
    expect(sceneGraphPlugin.label).toBe('Scene Graph');
  });

  it('is active only in edit mode', () => {
    expect(sceneGraphPlugin.modes.has('edit')).toBe(true);
    expect(sceneGraphPlugin.modes.has('play')).toBe(false);
  });

  it('has priority 15', () => {
    expect(sceneGraphPlugin.priority).toBe(15);
  });

  it('creates toolbar button on init', () => {
    sceneGraphPlugin.init(ctx);
    const btn = document.querySelector('.tb-b');
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute('data-tool')).toBe('scene-graph');
    sceneGraphPlugin.destroy();
  });

  it('removes toolbar button on destroy', () => {
    sceneGraphPlugin.init(ctx);
    sceneGraphPlugin.destroy();
    expect(document.querySelector('.tb-b')).toBeNull();
  });
});
