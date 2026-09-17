import * as C from '../constants'
import { GameScene } from './Game'

const x = 145
const t = 16

export class Hud {
  scene: GameScene
  borderGraphics: Phaser.GameObjects.Graphics
  abilityValueGraphics: Phaser.GameObjects.Graphics
  abilityValueTexts: Phaser.GameObjects.BitmapText[]
  itemSprite: Phaser.GameObjects.Sprite
  hpText: Phaser.GameObjects.BitmapText

  constructor(scene: GameScene) {
    this.scene = scene
    this.borderGraphics = this.scene.add.graphics()
    this.abilityValueGraphics = this.scene.add.graphics()
    this.abilityValueTexts = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      const y = 34 + i * 12
      this.abilityValueGraphics.strokeRect(x + 3, y, 10, 10)
      return this.scene.add
        .bitmapText(x + 7, y + 1, 'wayfarer', `${i}`)
        .setTintFill(C.COLOURS[1])
        .setOrigin(0.5, 0)
    })
    this.borderGraphics.fillStyle(C.COLOURS[0]).fillRect(x - 1, 0, 160, 145)
    this.hpText = this.scene.add
      .bitmapText(152, 0, 'wayfarer', `${this.scene.state.hp}`)
      .setTintFill(C.COLOURS[3])
      .setOrigin(0.5, 0)
      .setLetterSpacing(-1)
    this.scene.add
      .bitmapText(160, 8, 'wayfarer', 'hp')
      .setTintFill(C.COLOURS[1])
      .setOrigin(1, 0)

    this.itemSprite = this.scene.add
      .sprite(x - 1, t, 'tilemap', C.NULL_ITEM_ID)
      .setOrigin(0, 0)

    this.scene.registry.events.on('changedata', () => {
      const { hp, heldItem, abilityValues, abilityValueIndex } =
        this.scene.state
      this.hpText.setText(`${hp}`).setLetterSpacing(hp > 19 ? -1 : 0)
      this.itemSprite.setFrame(heldItem)

      this.abilityValueGraphics.clear()
      for (let i = 0; i < 9; i++) {
        if (typeof abilityValues[i] === 'number') {
          this.abilityValueTexts[i]
            .setTintFill(C.COLOURS[1])
            .setText(`${abilityValues[i]}`)
          this.abilityValueGraphics.lineStyle(
            1,
            C.COLOURS[i === abilityValueIndex ? 3 : 1],
          )
          const y = 34 + i * 12
          this.abilityValueGraphics.strokeRect(x + 3, y, 10, 10)
        } else {
          this.abilityValueTexts[i].setText('')
        }
      }
      this.abilityValueTexts[abilityValueIndex].setTintFill(C.COLOURS[3])
    })

    // left
    this.drawDottedLine(x, 0, x, x + 1)
    // right
    this.drawDottedLine(x + t - 1, t + 3, x + t - 1, t * 2)
    // top
    this.drawDottedLine(x, t + 1, x + t, t + 1)
    // bottom
    this.drawDottedLine(x, t * 2 - 1, x + t, t * 2 - 1)
  }

  drawDottedLine(ax = 0, ay = 0, bx = 0, by = 0) {
    this.borderGraphics.lineStyle(1, C.COLOURS[2])
    if (ax === bx) {
      for (let i = ay; i < by; i += 2) {
        this.borderGraphics
          .moveTo(ax, i - 1)
          .lineTo(ax, i)
          .stroke()
      }
    } else {
      for (let i = ax; i < bx; i += 2) {
        this.borderGraphics
          .moveTo(i - 1, ay)
          .lineTo(i, ay)
          .stroke()
      }
    }
  }
}
