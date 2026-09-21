import * as C from './constants'
import { GameScene } from './scenes/Game'
import { tileForValue } from './utils'

const x = 145
const t = 16
const HUD_DEPTH = 20

export class Hud {
  scene: GameScene
  borderGraphics: Phaser.GameObjects.Graphics
  abilityValueSprites: Phaser.GameObjects.Sprite[]
  itemSprite: Phaser.GameObjects.Sprite
  hpText: Phaser.GameObjects.BitmapText

  constructor(scene: GameScene) {
    this.scene = scene
    this.borderGraphics = this.scene.add.graphics().setDepth(HUD_DEPTH)
    this.abilityValueSprites = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
      this.scene.add
        .sprite(x - 1, t * 2 + i * t, 'tilemap', 0)
        .setOrigin(0, 0)
        .setDepth(HUD_DEPTH)
        .setVisible(false),
    )
    this.borderGraphics.fillStyle(C.COLOURS[0]).fillRect(x - 1, 0, 160, 145)
    this.hpText = this.scene.add
      .bitmapText(152, 0, 'wayfarer', `${this.scene.state.hp}`)
      .setTintFill(C.COLOURS[3])
      .setOrigin(0.5, 0)
      .setLetterSpacing(-1)
      .setDepth(HUD_DEPTH)
    this.scene.add
      .bitmapText(160, 8, 'wayfarer', 'hp')
      .setTintFill(C.COLOURS[1])
      .setOrigin(1, 0)
      .setDepth(HUD_DEPTH)

    this.itemSprite = this.scene.add
      .sprite(x - 1, t, 'tilemap', C.NULL_ITEM_ID)
      .setOrigin(0, 0)
      .setDepth(HUD_DEPTH)

    const onChange = () => this.refresh()
    this.scene.registry.events.on('changedata', onChange)
    this.scene.events.once('shutdown', () =>
      this.scene.registry.events.off('changedata', onChange),
    )

    // left
    this.drawDottedLine(x, 0, x, x + 1)
    // right
    this.drawDottedLine(x + t - 1, t + 3, x + t - 1, t * 2)
    // top
    this.drawDottedLine(x, t + 2, x + t, t + 1)
    // bottom
    this.drawDottedLine(x, t * 2, x + t, t * 2 - 1)

    this.refresh()
  }

  refresh() {
    const { hp, heldItem, abilityValues } = this.scene.state
    this.hpText.setText(`${hp}`).setLetterSpacing(hp > 19 ? -1 : 0)
    this.itemSprite.setFrame(heldItem)

    this.abilityValueSprites.forEach((sprite, i) => {
      const value = abilityValues[i]
      if (typeof value !== 'number') {
        sprite.setVisible(false)
        return
      }
      sprite.setVisible(true).setFrame(tileForValue(value, i === 0))
    })
  }

  drawDottedLine(ax = 0, ay = 0, bx = 0, by = 0) {
    this.borderGraphics.fillStyle(C.COLOURS[2])
    if (ax === bx) {
      for (let i = ay; i < by; i += 2) {
        this.borderGraphics.fillRect(ax - 1, i - 1, 1, 1)
      }
    } else {
      for (let i = ax; i < bx; i += 2) {
        this.borderGraphics.fillRect(i - 1, ay - 1, 1, 1)
      }
    }
  }
}
