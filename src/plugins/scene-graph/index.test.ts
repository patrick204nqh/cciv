// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { sceneGraphPlugin } from './index';
import type { PluginContext } from '../types';
import { useToolbarStore } from '../../ui/stores/toolbar-store';

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
    useToolbarStore.setState({ tools: [], activeToolId: null });
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

  it('registers tool on init', () => {
    sceneGraphPlugin.init(ctx);
    const tools = useToolbarStore.getState().tools;
    expect(tools.some(t => t.id === 'scene-graph')).toBe(true);
    sceneGraphPlugin.destroy();
  });

  it('removes tool on destroy', () => {
    sceneGraphPlugin.init(ctx);
    sceneGraphPlugin.destroy();
    const tools = useToolbarStore.getState().tools;
    expect(tools.some(t => t.id === 'scene-graph')).toBe(false);
  });
});
