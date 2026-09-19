import { Game, Types } from 'phaser'
import { AudioToggle } from './AudioToggle'
import { COLOURS } from './constants'
import { BootScene } from './scenes/Boot'
import { GameScene } from './scenes/Game'
import { MenuScene } from './scenes/Menu'
import { TransitionScene } from './scenes/Transition'

const config: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 160,
  height: 144,
  parent: 'game-container',
  backgroundColor: COLOURS[0],
  pixelArt: true,
  zoom: 6,
  scene: [BootScene, MenuScene, GameScene, TransitionScene],
}

const game = new Game(config)
document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm') {
    AudioToggle.toggle(game.scene.getScenes(true)[0])
  }
})

;(window as any).__game = game

export default game
