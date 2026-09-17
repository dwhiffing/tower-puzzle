import * as C from '../constants'
import { flashSprite } from '../flash'
import { GameScene } from './Game'

export class Monster {
  scene: GameScene
  x: number
  y: number
  tileIndex: number
  health: number
  damage: number
  sprite: Phaser.GameObjects.Sprite
  healthText: Phaser.GameObjects.BitmapText
  damageText: Phaser.GameObjects.BitmapText
  flashTimer?: Phaser.Time.TimerEvent

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    tileIndex: number,
    health: number,
    damage: number,
  ) {
    this.scene = scene
    this.x = x
    this.y = y
    this.tileIndex = tileIndex
    this.health = health
    this.damage = damage
    this.createSprite()
    this.createText()
  }

  get key() {
    return `${this.x},${this.y}`
  }

  createSprite() {
    const key = `idle${this.tileIndex}`
    if (!this.scene.anims.exists(key)) {
      this.scene.anims.create({
        key,
        frames: [
          { key: 'tilemap', frame: this.tileIndex },
          { key: 'tilemap', frame: this.tileIndex + C.ENEMY_IDLE_OFFSET },
        ],
        frameRate: C.ENEMY_IDLE_FRAMERATE,
        repeat: -1,
      })
    }

    this.sprite = this.scene.add
      .sprite(this.x * C.TILE_SIZE, this.y * C.TILE_SIZE, 'tilemap')
      .setOrigin(0)
      .setDepth(30)
      .play(key)
  }

  createText() {
    const x = this.x * C.TILE_SIZE + C.TILE_SIZE - 5
    const y = this.y * C.TILE_SIZE

    this.healthText = this.scene.add
      .bitmapText(x, y, 'pixel', `${this.health}`)
      .setOrigin(0)
      .setDepth(31)
    this.damageText = this.scene.add
      .bitmapText(x, y + 9, 'pixel-brown', `${this.damage}`)
      .setOrigin(0)
      .setDepth(31)
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount)
    this.refresh()
    return this.health <= 0
  }

  flash(onComplete?: () => void) {
    this.flashTimer = flashSprite(
      this.sprite,
      this.flashTimer,
      onComplete,
      C.COLOURS[3],
    )
  }

  refresh() {
    this.healthText.setText(`${this.health}`)
    this.damageText.setText(`${this.damage}`)
  }

  destroy() {
    this.flashTimer?.remove()
    this.sprite.destroy()
    this.healthText.destroy()
    this.damageText.destroy()
  }
}
