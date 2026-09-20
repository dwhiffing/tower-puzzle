import * as C from './constants'
import { GameScene } from './scenes/Game'

export type DoorOperator = '>' | '<' | '='

export class Door {
  scene: GameScene
  x: number
  y: number
  operator: DoorOperator
  value: number
  text: Phaser.GameObjects.BitmapText

  static parse(name: string) {
    const match = /^([><=])\s*(\d+)$/.exec(name.trim())
    if (!match) return null
    return { operator: match[1] as DoorOperator, value: Number(match[2]) }
  }

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    operator: DoorOperator,
    value: number,
  ) {
    this.scene = scene
    this.x = x
    this.y = y
    this.operator = operator
    this.value = value
    this.createText()
  }

  get key() {
    return `${this.x},${this.y}`
  }

  createText() {
    this.text = this.scene.add
      .bitmapText(
        this.x * C.TILE_SIZE + 4,
        this.y * C.TILE_SIZE + 6,
        'pixel-door',
        `${this.operator}${this.value}`,
      )
      .setOrigin(0)
      .setDepth(31)
  }

  accepts(value: number) {
    if (this.operator === '>') return value > this.value
    if (this.operator === '<') return value < this.value
    return value === this.value
  }

  destroy() {
    this.text.destroy()
  }
}
