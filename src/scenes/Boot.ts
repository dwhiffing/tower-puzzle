import { Scene } from 'phaser'
import * as C from '../constants'
import { recolorBitmapFont } from '../recolor'

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
      frameWidth: C.TILE_SIZE,
      frameHeight: C.TILE_SIZE,
    })
    for (let i = 1; i <= C.LEVEL_COUNT; i++) {
      this.load.tilemapTiledJSON(`level${i}`, `assets/level${i}.json`)
    }
    // this.load.audio('music', 'assets/music.mp3')
  }

  create() {
    recolorBitmapFont(this, 'pixel', 'pixel-brown', {
      [C.PIXEL_FONT_BODY]: C.COLOURS[2],
      [C.PIXEL_FONT_OUTLINE]: C.COLOURS[0],
    })
    recolorBitmapFont(this, 'pixel', 'pixel-door', {
      [C.PIXEL_FONT_OUTLINE]: null,
      [C.PIXEL_FONT_BODY]: C.COLOURS[0],
    })
    this.scene.start('Game')
    // this.scene.launch('Transition', { from: 'Boot', to: 'Menu' })
  }
}
