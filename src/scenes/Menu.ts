import { Scene } from 'phaser'
import { COLOURS } from '../constants'
import { AudioToggle } from '../AudioToggle'

export class MenuScene extends Scene {
  bgGraphics: Phaser.GameObjects.TileSprite
  constructor() {
    super('Menu')
  }

  create() {
    AudioToggle.startMusic(this)
    AudioToggle.loadState(this)

    const { width, height } = this.cameras.main
    this.add.rectangle(0, 0, width, height, COLOURS[0]).setOrigin(0)
    this.add.image(width / 2, 40, 'title')
    this.add.sprite(width / 2, 88, 'title-gem').play('title-gem')
    const won = this.registry.get('won') === true
    this.add
      .bitmapText(80, 120, 'wayfarer', won ? 'YOU WIN!' : 'PRESS SPACE')
      .setTintFill(COLOURS[1])
      .setOrigin(0.5)

    const start = () => {
      this.input.keyboard?.off('keydown-SPACE', start)
      this.sound.play('game-start', { volume: 0.5 })
      this.scene.launch('Transition', { from: 'Menu', to: 'Game' })
    }
    this.input.keyboard?.on('keydown-SPACE', start)
  }

  update() {}
}
