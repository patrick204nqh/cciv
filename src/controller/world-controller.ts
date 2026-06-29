import { entityManager } from '../entity/manager';
import { WorldLoader } from '../model/world-loader';
import { buildEnvironment } from './environment-builder';
import type { IScene } from '../graphics/types';
import type { StateStore } from '../state/store';
import type { ModelLoader } from '../model/types';
import type { WorldConfig } from '../state/types';
import type { SceneEntity } from '../entity/types';

export interface CommitProgress {
  phase: 'loading-models' | 'detaching' | 'building-entities' | 'attaching'
  loaded?: number
  total?: number
}

export interface CommitResult {
  success: boolean
  errors: unknown[]
  duration: number
}

export class WorldController {
  private worldLoader = new WorldLoader()
  private _modelLoader: ModelLoader | null = null
  private lastConfig: WorldConfig | null = null

  constructor(
    private scene: IScene,
    private store: StateStore,
  ) {}

  setModelLoader(loader: ModelLoader): void {
    this._modelLoader = loader
  }

  async commit(
    config?: WorldConfig,
    onProgress?: (p: CommitProgress) => void,
  ): Promise<CommitResult> {
    const start = Date.now()
    const target = config ?? this.resolveConfig()
    const current = this.lastConfig

    const envChanged = current ? !shallowEqual(current.environment, target.environment) : true
    const instChanged = current ? !shallowEqual(current.instances, target.instances) : true

    if (!envChanged && !instChanged) {
      return { success: true, errors: [], duration: 0 }
    }

    if (instChanged) {
      return this.fullReload(target, onProgress)
    }

    return this.envOnlyReload(target, onProgress)
  }

  private async fullReload(
    config: WorldConfig,
    onProgress?: (p: CommitProgress) => void,
  ): Promise<CommitResult> {
    const start = Date.now()
    const loader = this._modelLoader
    if (!loader) throw new Error('WorldController: modelLoader not set')

    const refs = this.collectModelRefs(config)
    onProgress?.({ phase: 'loading-models', loaded: 0, total: refs.size })
    let loaded = 0
    for (const ref of refs) {
      try {
        await loader.load(ref)
      } catch (e) {
        return { success: false, errors: [e], duration: Date.now() - start }
      }
      loaded++
      onProgress?.({ phase: 'loading-models', loaded, total: refs.size })
    }

    onProgress?.({ phase: 'detaching' })
    entityManager.setPaused(true)
    for (const e of entityManager.getEntities()) {
      if (e.id === 'instance-manager') continue;
      entityManager.detach(e);
    }

    const allEntities: SceneEntity[] = []
    this.store.set('instances', structuredClone(config.instances))

    onProgress?.({ phase: 'building-entities' })
    const envResult = buildEnvironment(config.environment)
    this.scene.fog = envResult.fog
    this.scene.background = envResult.background
    this.scene.environment = envResult.environmentColor
    allEntities.push(envResult.entity)

    const loadResult = await this.worldLoader.load(config, loader, this.store)
    allEntities.push(...loadResult.entities)

    onProgress?.({ phase: 'attaching' })
    for (const e of allEntities) {
      entityManager.attach(e, this.scene)
    }
    entityManager.setPaused(false)

    this.lastConfig = config
    return { success: true, errors: [], duration: Date.now() - start }
  }

  private async envOnlyReload(
    config: WorldConfig,
    onProgress?: (p: CommitProgress) => void,
  ): Promise<CommitResult> {
    const start = Date.now()
    onProgress?.({ phase: 'detaching' })
    entityManager.setPaused(true)
    for (const e of entityManager.getEntities()) {
      if (e.id === 'environment' || e.id === 'rain' || e.id === 'mist') {
        entityManager.detach(e)
      }
    }

    onProgress?.({ phase: 'building-entities' })
    const envResult = buildEnvironment(config.environment)
    this.scene.fog = envResult.fog
    this.scene.background = envResult.background
    this.scene.environment = envResult.environmentColor

    onProgress?.({ phase: 'attaching' })
    entityManager.attach(envResult.entity, this.scene)
    entityManager.setPaused(false)

    this.lastConfig = config
    return { success: true, errors: [], duration: Date.now() - start }
  }

  private resolveConfig(): WorldConfig {
    const active = this.store.get('activeLocation') as string
    const locations = this.store.get('locations') as Record<string, WorldConfig>
    return locations[active]
  }

  private collectModelRefs(config: WorldConfig): Set<string> {
    const refs = new Set<string>()
    for (const def of Object.values(config.instances)) {
      refs.add(def.ref)
    }
    return refs
  }
}

function shallowEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
