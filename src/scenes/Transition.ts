import * as C from '../constants'
import { Scene } from 'phaser'

interface TransitionConfig {
  from: string
  to: string
  data?: object
  restart?: boolean
  duration?: number
}

const TEXTURE = 'wipe'

export class TransitionScene extends Scene {
  config: TransitionConfig
  texture: Phaser.Textures.CanvasTexture

  constructor() {
    super('Transition')
  }

  init(config: TransitionConfig) {
    this.config = { ...config }
  }

  create() {
    const { width: w, height: h } = this.cameras.main

    this.texture = this.textures.exists(TEXTURE)
      ? (this.textures.get(TEXTURE) as Phaser.Textures.CanvasTexture)
      : this.textures.createCanvas(TEXTURE, w, h)!
    this.add.image(0, 0, TEXTURE).setOrigin(0).setDepth(1000)

    const { data, restart } = this.config
    const duration = this.config.duration ?? 500
    const isBoot = this.config.from === 'Boot'

    if (isBoot) {
      this.scene.launch(this.config.to, data)
      this.scene.stop(this.config.from)
      drawWipe(this.texture, 1)
      this.sweep(1, 0, duration, true, () => this.scene.stop())
      return
    }

    this.sweep(0, 1, duration, false, () => {
      if (restart) {
        this.scene.get(this.config.to).scene.restart(data)
      } else {
        this.scene.launch(this.config.to, data)
        this.scene.stop(this.config.from)
      }
      this.sweep(1, 0, duration, true, () => this.scene.stop())
    })
  }

  sweep(
    from: number,
    to: number,
    duration: number,
    reverse: boolean,
    onComplete: () => void,
  ) {
    const state = { progress: from }
    drawWipe(this.texture, from, reverse)
    this.tweens.add({
      targets: state,
      progress: to,
      duration,
      ease: 'Linear',
      onUpdate: () => drawWipe(this.texture, state.progress, reverse),
      onComplete,
    })
  }
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
const LEVELS = 16
const BAND = 0.35

function drawWipe(
  texture: Phaser.Textures.CanvasTexture,
  progress: number,
  reverse = false,
) {
  const { width, height } = texture
  const ctx = texture.getContext()
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = Phaser.Display.Color.IntegerToColor(C.COLOURS[0]).rgba

  const span = width + height
  const edge = progress * (1 + BAND) * span

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = reverse ? span - (x + y) : x + y
      const t = (edge - d) / (BAND * span)
      if (t >= 1) {
        ctx.fillRect(x, y, 1, 1)
      } else if (t > 0) {
        if (BAYER[y & 3][x & 3] < t * LEVELS) ctx.fillRect(x, y, 1, 1)
      }
    }
  }
  texture.refresh()
}
