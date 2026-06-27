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
    for (const [group, overrides] of Object.entries(inst.ship.material)) {
      const g = mat.addFolder(group);
      g.add(overrides, 'color').name('Color').onChange((v: string) => kernel.store.set(`instances.ship.material.${group}.color`, v));
      g.add(overrides, 'roughness', 0, 1).name('Roughness').onChange((v: number) => kernel.store.set(`instances.ship.material.${group}.roughness`, v));
      g.add(overrides, 'metalness', 0, 1).name('Metalness').onChange((v: number) => kernel.store.set(`instances.ship.material.${group}.metalness`, v));
      g.add(overrides, 'visible').name('Visible').onChange((v: boolean) => kernel.store.set(`instances.ship.material.${group}.visible`, v));
      folders.push(g);
    }
    folders.push(mat, ship);
  }
})();
