import { Scene } from 'phaser'
import { COLOURS } from '../constants'
import { play } from '../Sfx'

export class MenuScene extends Scene {
  bgGraphics: Phaser.GameObjects.TileSprite
  constructor() {
    super('Menu')
  }

  create() {
    const { width, height } = this.cameras.main
    this.add.rectangle(0, 0, width, height, COLOURS[0]).setOrigin(0)
    this.add.image(width / 2, 40, 'title')
    this.add.sprite(width / 2, 88, 'title-gem').play('title-gem')
    this.add
      .bitmapText(80, 120, 'wayfarer', 'PRESS START')
      .setTintFill(COLOURS[1])
      .setOrigin(0.5)

    const start = () => {
      this.input.keyboard?.off('keydown-X', start)
      this.input.keyboard?.off('keydown-ENTER', start)
      play(this, 'game-start')
      this.scene.launch('Transition', { from: 'Menu', to: 'Game' })
    }
    this.input.keyboard?.on('keydown-X', start)
    this.input.keyboard?.on('keydown-ENTER', start)
  }

  update() {}
}
