import { LOCK_TYPES } from '../constants'
import { GameScene } from './Game'

interface TileEdit {
  layer: number
  x: number
  y: number
  index: number
}

export class GameState {
  scene: GameScene
  constructor(scene: GameScene, reset = false) {
    this.scene = scene
    if (reset) this.reset()
  }

  get registry() {
    return this.scene.registry
  }

  get lastLevel(): number {
    return this.registry.get('lastLevel')
  }

  get level(): number {
    return this.registry.get('level') ?? 1
  }

  get potions(): number {
    return this.registry.get('potions') ?? 0
  }

  get enemies(): number {
    return this.registry.get('enemies') ?? 0
  }

  get currency(): number {
    return this.registry.get('currency') ?? 0
  }

  get tileEdits(): Record<number, TileEdit[]> {
    return this.registry.get('tileEdits') ?? {}
  }

  get(key: string) {
    return this.registry.get(key)
  }

  set(key: string, value: number) {
    return this.registry.set(key, value)
  }

  inc(key: string, value: number) {
    return this.registry.inc(key, value)
  }

  reset() {
    this.registry.set({ currency: 0, enemies: 0, potions: 0, tileEdits: {} })
    for (const type of Object.keys(LOCK_TYPES)) {
      this.registry.set(`keys.${type}`, 0)
    }
  }
}
