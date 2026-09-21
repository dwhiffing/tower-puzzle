import * as C from './constants'
import { GameScene } from './scenes/Game'

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

  get hp(): number {
    return this.registry.get('hp') ?? 1
  }

  get heldItem(): number {
    return this.registry.get('heldItem') ?? C.NULL_ITEM_ID
  }

  get level(): number {
    return this.registry.get('level') ?? 1
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
      heldItem: C.NULL_ITEM_ID,
      hp: 1,
      abilityValues: [],
      level: C.STARTING_LEVEL,
      lastLevel: null,
      won: false,
    })
  }
}
