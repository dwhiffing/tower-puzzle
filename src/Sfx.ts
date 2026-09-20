import { Scene } from 'phaser'

/**
 * Every sound in public/assets/sounds, keyed by file name. Files with
 * "backup" in the name are unused alternates and are deliberately absent.
 */
export const SOUNDS = [
  'enemy-dead',
  'enemy-hit',
  'game-start',
  'invalid-move',
  'pickup-item',
  'player-dead',
  'player-hit',
  'player-step',
  'undo',
  'use-boots',
  'use-key',
  'use-pickaxe',
  'use-potion',
  'use-ring',
  'use-shield',
  'win-level',
] as const

export type SoundKey = (typeof SOUNDS)[number]

/** undo.wav is the one sound that is not an mp3. */
const EXTENSION: Partial<Record<SoundKey, string>> = {
  undo: 'wav',
  'player-step': 'wav',
}

export const SFX_VOLUME = 0.5

/**
 * Gap between a blow and the answering blow. The longest attack sound is
 * ~235ms, so this leaves the first one room to finish before the second
 * starts -- two distinct hits rather than one muddled noise.
 */
export const RETALIATION_DELAY = 260

export function preloadSounds(scene: Scene) {
  for (const key of SOUNDS) {
    scene.load.audio(key, `assets/sounds/${key}.${EXTENSION[key] ?? 'mp3'}`)
  }
}

/**
 * Plays a one-shot effect. Failures are swallowed: a missing or still-loading
 * sound should never take the game down mid-move.
 */
export function play(scene: Scene, key: SoundKey, volume = SFX_VOLUME) {
  try {
    scene.sound.play(key, { volume })
  } catch {}
}
