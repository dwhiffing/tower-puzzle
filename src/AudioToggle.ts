export class AudioToggle {
  static audioState: number = 0

  static startMusic(scene: Phaser.Scene) {
    if (scene.sound.get('music')) return
    scene.sound.add('music', { loop: true, volume: 0.4 }).play()
    this.applyState(scene)
  }

  static toggle(scene: Phaser.Scene) {
    this.audioState = (this.audioState + 1) % 3
    this.applyState(scene)
    localStorage.setItem('audioState', this.audioState.toString())
  }

  static applyState(scene: Phaser.Scene) {
    const muted = this.audioState === 2
    const musicOff = this.audioState !== 0
    scene.sound.volume = muted ? 0 : 1
    if (musicOff) scene.sound.get('music').pause()
    else scene.sound.get('music').play()
  }

  static loadState(scene: Phaser.Scene) {
    try {
      const saved = localStorage.getItem('audioState')
      const parsed = parseInt(saved || '0', 10)
      if (parsed >= 0 && parsed <= 2) {
        this.audioState = parsed
      }
    } catch (e) {}
    this.applyState(scene)
  }
}
