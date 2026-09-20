import { Game, Types } from 'phaser'
import { AudioToggle } from './AudioToggle'
import { COLOURS } from './constants'
import { BootScene } from './scenes/Boot'
import { GameScene } from './scenes/Game'
import { MenuScene } from './scenes/Menu'
import { setupTouchControls } from './touch'
import { TransitionScene } from './scenes/Transition'

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 160,
  height: 144,
  parent: 'game-container',
  backgroundColor: COLOURS[0],
  pixelArt: true,
  scale: {
    // FIT keeps the 160x144 aspect while filling whatever space the
    // layout gives it, which on mobile is the area above the controls
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, GameScene, TransitionScene],
}

// before the game boots: the touch layout reshapes #game-container, and
// Phaser measures its parent on creation
setupTouchControls()

const game = new Game(config)
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm') {
    AudioToggle.toggle(game.scene.getScenes(true)[0])
  }
})

;(window as any).__game = game

export default game
