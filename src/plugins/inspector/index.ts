import GUI from 'lil-gui';
import type { ScenePlugin, Kernel } from '../types';

export const inspectorPlugin: ScenePlugin = (() => {
  let kernel: Kernel;
  let gui: GUI;
  let folders: GUI[] = [];

  return {
    id: 'inspector',
    label: 'Inspector',
    modes: new Set(['edit']),
    priority: 10,

    init(k: Kernel) {
      kernel = k;
      gui = new GUI({ title: 'CCIV Inspector' });
      buildEnvironment();
      buildInstances();
    },

    destroy() {
      gui.destroy();
      folders = [];
    },
  };

  function buildEnvironment() {
    const env = kernel.store.get('environment') as any;
    const sky = gui.addFolder('Sky');
    sky.add(env.sky, 'gradientTop').name('Top Color').onChange((v: string) => kernel.store.set('environment.sky.gradientTop', v));
    sky.add(env.sky, 'gradientBottom').name('Bottom Color').onChange((v: string) => kernel.store.set('environment.sky.gradientBottom', v));
    folders.push(sky);

    const fog = gui.addFolder('Fog');
    fog.add(env.fog, 'color').name('Color').onChange((v: string) => kernel.store.set('environment.fog.color', v));
    fog.add(env.fog, 'density', 0, 0.01).name('Density').onChange((v: number) => kernel.store.set('environment.fog.density', v));
    folders.push(fog);

    const sun = gui.addFolder('Sun');
    const l = env.lighting;
    sun.add(l.sun, 'enabled').name('Enabled').onChange((v: boolean) => kernel.store.set('environment.lighting.sun.enabled', v));
    sun.add(l.sun, 'intensity', 0, 10).name('Intensity').onChange((v: number) => kernel.store.set('environment.lighting.sun.intensity', v));
    sun.add(l.sun, 'color').name('Color').onChange((v: string) => kernel.store.set('environment.lighting.sun.color', v));
    sun.add(l.sun, 'azimuth', -Math.PI, Math.PI).name('Azimuth').onChange((v: number) => kernel.store.set('environment.lighting.sun.azimuth', v));
    sun.add(l.sun, 'elevation', 0, Math.PI / 2).name('Elevation').onChange((v: number) => kernel.store.set('environment.lighting.sun.elevation', v));
    folders.push(sun);

    const ocean = gui.addFolder('Ocean');
    ocean.add(env.ocean, 'color').name('Color').onChange((v: string) => kernel.store.set('environment.ocean.color', v));
    ocean.add(env.ocean, 'opacity', 0, 1).name('Opacity').onChange((v: number) => kernel.store.set('environment.ocean.opacity', v));
    folders.push(ocean);
  }

  function buildInstances() {
    const inst = kernel.store.get('instances') as any;
    const ship = gui.addFolder('Ship');
    ship.add(inst.ship, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set('instances.ship.visible', v));

    const mat = ship.addFolder('Materials');
    for (const [group, overrides] of Object.entries(inst.ship.materials)) {
      const g = mat.addFolder(group);
      g.add(overrides, 'color').name('Color').onChange((v: string) => kernel.store.set(`instances.ship.materials.${group}.color`, v));
      g.add(overrides, 'roughness', 0, 1).name('Roughness').onChange((v: number) => kernel.store.set(`instances.ship.materials.${group}.roughness`, v));
      g.add(overrides, 'metalness', 0, 1).name('Metalness').onChange((v: number) => kernel.store.set(`instances.ship.materials.${group}.metalness`, v));
      g.add(overrides, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set(`instances.ship.materials.${group}.visible`, v));
      folders.push(g);
    }
    folders.push(mat, ship);

    const s = { save: () => savePreset(), load: () => loadPreset() };
    mat.add(s, 'save').name('Save Preset');
    mat.add(s, 'load').name('Load Preset');

    function savePreset() {
      const materials = kernel.store.get('instances.ship.materials');
      const data = { format: 'cciv-material-preset', version: 1, materials };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ship-materials-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function loadPreset() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.format !== 'cciv-material-preset' || data.version !== 1) {
            console.warn('Invalid material preset file');
            return;
          }
          kernel.store.set('instances.ship.materials', data.materials);
        } catch {
          console.warn('Failed to load material preset');
        }
      };
      input.click();
    }
  }
})();
