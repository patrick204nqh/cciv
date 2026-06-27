// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { sceneGraphPlugin } from './index';
import type { Kernel } from '../types';

function mockKernel(): Kernel {
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
    renderer: {} as any,
    camera: {} as any,
    controls: {} as any,
    store: {} as any,
    container: document.body,
    mode: 'edit',
    selectedObject: null,
  };
}

describe('sceneGraphPlugin', () => {
  let kernel: Kernel;

  beforeEach(() => {
    document.body.innerHTML = '';
    kernel = mockKernel();
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

  it('creates panel with tree on init', () => {
    sceneGraphPlugin.init(kernel);
    const panel = document.getElementById('scene-graph-panel');
    expect(panel).toBeTruthy();
    expect(panel!.textContent).toContain('test-group');
    expect(panel!.textContent).toContain('test-mesh');
    sceneGraphPlugin.destroy();
  });

  it('removes panel on destroy', () => {
    sceneGraphPlugin.init(kernel);
    sceneGraphPlugin.destroy();
    expect(document.getElementById('scene-graph-panel')).toBeNull();
  });
});
