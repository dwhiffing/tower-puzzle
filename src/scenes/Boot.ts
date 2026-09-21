import { Scene } from 'phaser'
import * as C from '../constants'
import { recolorBitmapFont } from '../utils'

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
    this.load.image('title', 'assets/title.png')
    this.load.spritesheet('title-gem', 'assets/title-gem.png', {
      frameWidth: 36,
      frameHeight: 25,
    })
    this.load.spritesheet('tilemap', 'assets/tilemap.png', {
      frameWidth: C.TILE_SIZE,
      frameHeight: C.TILE_SIZE,
    })
    for (let i = 1; i <= C.LEVEL_COUNT; i++) {
      this.load.tilemapTiledJSON(`level${i}`, `assets/level${i}.json`)
    }

    this.load.audio('enemy-dead', 'assets/sounds/enemy-dead.mp3')
    this.load.audio('enemy-hit', 'assets/sounds/enemy-hit.mp3')
    this.load.audio('game-start', 'assets/sounds/game-start.mp3')
    this.load.audio('pickup-item', 'assets/sounds/pickup-item.mp3')
    this.load.audio('player-dead', 'assets/sounds/player-dead.mp3')
    this.load.audio('player-hit', 'assets/sounds/player-hit.mp3')
    this.load.audio('player-step', 'assets/sounds/player-step.mp3')
    this.load.audio('undo', 'assets/sounds/undo.mp3')
    this.load.audio('use-boots', 'assets/sounds/use-boots.mp3')
    this.load.audio('use-key', 'assets/sounds/use-key.mp3')
    this.load.audio('use-pickaxe', 'assets/sounds/use-pickaxe.mp3')
    this.load.audio('use-potion', 'assets/sounds/use-potion.mp3')
    this.load.audio('use-ring', 'assets/sounds/use-ring.mp3')
    this.load.audio('use-shield', 'assets/sounds/use-shield.mp3')
    this.load.audio('win-level', 'assets/sounds/win-level.mp3')
    this.load.audio('music', `assets/sounds/music.mp3`)
  }

  create() {
    recolorBitmapFont(this, 'pixel', 'pixel-brown', {
      [C.COLOURS[3]]: C.COLOURS[2],
      [C.COLOURS[0]]: C.COLOURS[0],
    })
    recolorBitmapFont(this, 'pixel', 'pixel-blue', {
      [C.COLOURS[3]]: C.COLOURS[1],
      [C.COLOURS[0]]: C.COLOURS[0],
    })
    recolorBitmapFont(this, 'pixel', 'pixel-door', {
      [C.COLOURS[0]]: null,
      [C.COLOURS[3]]: C.COLOURS[0],
    })
    this.anims.create({
      key: 'title-gem',
      frames: this.anims.generateFrameNumbers('title-gem', {}),
      frameRate: 6,
      repeat: -1,
    })
    this.scene.launch('Transition', { from: 'Boot', to: 'Menu' })
  }
}
