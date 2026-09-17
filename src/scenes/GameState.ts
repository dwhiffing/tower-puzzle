import { NULL_ITEM_ID } from '../constants'
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

  get abilityValues(): number[] {
    return this.registry.get('abilityValues') ?? []
  }

  get abilityValueIndex(): number {
    return this.registry.get('abilityValueIndex') ?? []
  }

  get hp(): number {
    return this.registry.get('hp') ?? 1
  }

  get heldItem(): number {
    return this.registry.get('heldItem') ?? NULL_ITEM_ID
  }

  get level(): number {
    return this.registry.get('level') ?? 1
  }

  get tileEdits(): Record<number, TileEdit[]> {
    return this.registry.get('tileEdits') ?? {}
  }

  get(key: string) {
    return this.registry.get(key)
  }

  set(key: string, value: number | number[]) {
    return this.registry.set(key, value)
  }

  inc(key: string, value: number) {
    return this.registry.inc(key, value)
  }

  reset() {
    this.registry.set({
      heldItem: NULL_ITEM_ID,
      hp: 1,
      tileEdits: {},
      abilityValues: [],
      abilityValueIndex: 0,
    })
  }
}
