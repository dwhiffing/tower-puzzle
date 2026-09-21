import * as C from './constants'

export function trackViewport(heightFraction = 1) {
  const onResize = () => sizeGameContainer(heightFraction)
  onResize()
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
  return onResize
}

export function flashSprite(
  sprite: Phaser.GameObjects.Sprite,
  timer?: Phaser.Time.TimerEvent,
  onComplete?: () => void,
  color = C.COLOURS[3],
) {
  sprite.setTintFill(color)
  timer?.remove()
  return sprite.scene.time.delayedCall(200, () => {
    sprite.clearTint()
    onComplete?.()
  })
}

function recolorTexture(
  scene: Phaser.Scene,
  sourceKey: string,
  newKey: string,
  swaps: Record<number, number | null>,
) {
  if (scene.textures.exists(newKey)) return newKey

  const source = scene.textures
    .get(sourceKey)
    .getSourceImage() as HTMLImageElement
  const { width, height } = source
  const canvas = scene.textures.createCanvas(newKey, width, height)!
  const ctx = canvas.getContext()

  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const image = ctx.getImageData(0, 0, width, height)
  const px = image.data
  const table = new Map(
    Object.entries(swaps).map(([from, to]) => [
      Number(from),
      to === null
        ? null
        : ([(to >> 16) & 0xff, (to >> 8) & 0xff, to & 0xff, 255] as const),
    ]),
  )

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue
    const rgb = (px[i] << 16) | (px[i + 1] << 8) | px[i + 2]
    if (!table.has(rgb)) continue
    const to = table.get(rgb)
    if (to) [px[i], px[i + 1], px[i + 2], px[i + 3]] = to
    else px[i + 3] = 0
  }

  ctx.putImageData(image, 0, 0)
  canvas.refresh()
  return newKey
}

export function recolorBitmapFont(
  scene: Phaser.Scene,
  sourceKey: string,
  newKey: string,
  swaps: Record<number, number | null>,
) {
  if (scene.cache.bitmapFont.has(newKey)) return newKey

  const font = scene.cache.bitmapFont.get(sourceKey)
  recolorTexture(scene, font.texture ?? sourceKey, newKey, swaps)
  scene.cache.bitmapFont.add(newKey, {
    data: font.data,
    texture: newKey,
    frame: font.frame ?? null,
  })
  return newKey
}

const GAME_W = 160
const GAME_H = 144

function sizeGameContainer(heightFraction = 1) {
  const container = document.getElementById('game-container')
  if (!container) return

  const dpr = window.devicePixelRatio || 1
  const availableW = window.innerWidth * dpr
  const availableH = window.innerHeight * heightFraction * dpr
  const scale = Math.max(
    1,
    Math.floor(Math.min(availableW / GAME_W, availableH / GAME_H)),
  )

  container.style.width = `${(GAME_W * scale) / dpr}px`
  container.style.height = `${(GAME_H * scale) / dpr}px`
}

const VALUE_TILE_FIRST = 16
const VALUE_TILE_COUNT = 8
const VALUE_TILE_BASE = 2
const VALUE_TILE_ACTIVE_FIRST = 24
export const valueForTile = (index: number) =>
  index >= VALUE_TILE_FIRST && index < VALUE_TILE_FIRST + VALUE_TILE_COUNT
    ? index - VALUE_TILE_FIRST + VALUE_TILE_BASE
    : null
export const tileForValue = (value: number, active = false) =>
  (active ? VALUE_TILE_ACTIVE_FIRST : VALUE_TILE_FIRST) +
  value -
  VALUE_TILE_BASE
