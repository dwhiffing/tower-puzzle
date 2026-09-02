import { Scene } from 'phaser'
import { COLOURS } from '../constants'

export class MenuScene extends Scene {
  bgGraphics: Phaser.GameObjects.TileSprite
  constructor() {
    super('Menu')
  }

  create() {
    const { width, height } = this.cameras.main
    this.add.rectangle(0, 0, width, height, COLOURS[1]).setOrigin(0)
    this.add
      .bitmapText(80, 120, 'wayfarer', 'PRESS Z TO START')
      .setTintFill(COLOURS[0])
      .setOrigin(0.5)

    this.input.keyboard?.once('keydown-Z', () => {
      this.scene.launch('Transition', { from: 'Menu', to: 'Game' })
    })
  }

  update() {}
}
