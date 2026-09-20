import * as C from '../constants'
import { GameScene } from './Game'

interface TileEdit {
  layer: number
  x: number
  y: number
  index: number
}

export interface Snapshot {
  hp: number
  heldItem: number
  abilityValues: number[]
  abilityValueIndex: number
  tileEdits: Record<number, TileEdit[]>
  player: { x: number; y: number }
  monsters: {
    x: number
    y: number
    tileIndex: number
    health: number
    damage: number
  }[]
  doors: string[]
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
    return this.registry.get('hp') ?? C.STARTING_HP
  }

  get heldItem(): number {
    return this.registry.get('heldItem') ?? C.NULL_ITEM_ID
  }

  get level(): number {
    return this.registry.get('level') ?? 1
  }

  get tileEdits(): Record<number, TileEdit[]> {
    return this.registry.get('tileEdits') ?? {}
  }

  snapshot(): Snapshot {
    const { x, y } = this.scene.player
    return {
      hp: this.hp,
      heldItem: this.heldItem,
      abilityValues: [...this.abilityValues],
      abilityValueIndex: this.abilityValueIndex,
      tileEdits: structuredClone(this.tileEdits),
      player: { x, y },
      monsters: [...this.scene.map.monsters.values()].map((m) => ({
        x: m.x,
        y: m.y,
        tileIndex: m.tileIndex,
        health: m.health,
        damage: m.damage,
      })),
      doors: [...this.scene.map.doors.keys()],
    }
  }

  restore(snapshot: Snapshot) {
    this.registry.set({
      hp: snapshot.hp,
      heldItem: snapshot.heldItem,
      abilityValues: [...snapshot.abilityValues],
      abilityValueIndex: snapshot.abilityValueIndex,
      tileEdits: structuredClone(snapshot.tileEdits),
    })
    this.scene.player.setPosition(snapshot.player.x, snapshot.player.y)
    this.scene.map.restore(snapshot)
  }

  get(key: string) {
    return this.registry.get(key)
  }

  set(key: string, value: number | number[]) {
    return this.registry.set(key, value)
  }

  nextAbilityValue() {
    const { abilityValues, abilityValueIndex } = this
    if (abilityValues.length === 0) return
    this.set(
      'abilityValueIndex',
      (abilityValueIndex + 1) % abilityValues.length,
    )
  }

  inc(key: string, value: number) {
    return this.registry.inc(key, value)
  }

  reset() {
    this.registry.set({
      heldItem: C.NULL_ITEM_ID,
      hp: C.STARTING_HP,
      tileEdits: {},
      abilityValues: [],
      abilityValueIndex: 0,
      level: 1,
      lastLevel: null,
    })
  }
}
