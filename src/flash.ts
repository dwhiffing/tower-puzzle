import * as C from './constants'

export const FLASH_DURATION = 200

export function flashSprite(
  sprite: Phaser.GameObjects.Sprite,
  timer?: Phaser.Time.TimerEvent,
  onComplete?: () => void,
  color = C.COLOURS[3],
) {
  sprite.setTintFill(color)
  timer?.remove()
  return sprite.scene.time.delayedCall(FLASH_DURATION, () => {
    sprite.clearTint()
    onComplete?.()
  })
}
