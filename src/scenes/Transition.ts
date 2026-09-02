import { Scene } from 'phaser'
import { COLOURS } from '../constants'

interface TransitionConfig {
  from: string
  to: string
  data?: object
  restart?: boolean
  duration?: number
}

export class TransitionScene extends Scene {
  config: TransitionConfig

  constructor() {
    super('Transition')
  }

  init(config: TransitionConfig) {
    this.config = { ...config }
  }

  create() {
    const { width: w, height: h } = this.cameras.main
    const targets = this.add.rectangle(w / 2, h / 2, w, h, COLOURS[0])
    const { data, restart } = this.config
    const duration = this.config.duration ?? 400
    const isBoot = this.config.from === 'Boot'

    if (isBoot) {
      targets.setScale(1)
      this.scene.launch(this.config.to, data)
      this.scene.stop(this.config.from)
      this.tweens.add({
        delay: duration / 2,
        targets,
        duration,
        ease: 'Sine.easeIn',
        scale: 0,
      })
    } else {
      targets.setScale(0)
      this.tweens.add({
        targets,
        duration,
        scale: 1,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          if (restart) {
            this.scene.get(this.config.to).scene.restart(data)
          } else {
            this.scene.launch(this.config.to, data)
            this.scene.stop(this.config.from)
          }
          this.tweens.add({
            targets,
            delay: duration / 4,
            duration,
            scale: 0,
            ease: 'Sine.easeInOut',
            onComplete: () => this.scene.stop(),
          })
        },
      })
    }
  }
}
