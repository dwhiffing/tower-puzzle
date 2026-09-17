import { Scene } from 'phaser'
import { LEVEL_COUNT, TILE_SIZE } from '../constants'

export class BootScene extends Scene {
  constructor() {
    super('Boot')
  }

  preload() {
    this.load.bitmapFont('wayfarer', 'assets/font.png', 'assets/font.xml')
    this.load.bitmapFont(
      'pixel',
      'assets/pixel-dan.png',
      'assets/pixel-dan.xml',
    )
    this.load.spritesheet('tilemap', 'assets/tilemap.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    })
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      this.load.tilemapTiledJSON(`level${i}`, `assets/level${i}.tmj`)
    }
    // this.load.audio('music', 'assets/music.mp3')
  }

  create() {
    this.scene.start('Game')
    // this.scene.launch('Transition', { from: 'Boot', to: 'Menu' })
  }
}
