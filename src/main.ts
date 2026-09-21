import { Game, Types } from 'phaser'
import { AudioToggle } from './AudioToggle'
import { COLOURS } from './constants'
import { BootScene } from './scenes/Boot'
import { GameScene } from './scenes/Game'
import { MenuScene } from './scenes/Menu'
import { TransitionScene } from './scenes/Transition'
import { setupTouchControls } from './touch'
import { trackViewport } from './utils'

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 160,
  height: 144,
  parent: 'game-container',
  backgroundColor: COLOURS[0],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, TransitionScene],
}

const isTouch = setupTouchControls()
if (!isTouch) trackViewport()

const game = new Game(config)
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm') {
    AudioToggle.toggle(game.scene.getScenes(true)[0])
  }
})

export default game
