import * as C from './constants'
import { DoorState, MonsterState, State } from './rules'

interface TiledLayer {
  name: string
  type: string
  data?: number[]
  objects?: { name?: string; gid?: number; x?: number; y?: number }[]
}

export interface TiledLevel {
  width: number
  height: number
  layers: TiledLayer[]
}

export interface Spawn {
  x: number
  y: number
  abilityValues: number[]
  hp: number
}

const DEFAULT_HP = C.STARTING_HP

/** Parses a spawn object name like "4,1,3" or "4,1,3|hp:8". */
export function parseSpawnName(name: string) {
  const [valuePart, ...rest] = name.split('|')
  const abilityValues = valuePart
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value))

  let hp = DEFAULT_HP
  for (const option of rest) {
    const match = /^hp:\s*(\d+)$/i.exec(option.trim())
    if (match) hp = Number(match[1])
  }
  return { abilityValues, hp }
}

export function parseDoorName(name: string) {
  const match = /^([><=])\s*(\d+)$/.exec(name.trim())
  if (!match) return null
  return {
    operator: match[1] as DoorState['operator'],
    value: Number(match[2]),
  }
}

/** Tiled anchors tile objects at their bottom-left corner. */
const objectTile = (object: { x?: number; y?: number }) => ({
  x: Math.floor((object.x ?? 0) / C.TILE_SIZE),
  y: Math.floor(((object.y ?? 0) - C.TILE_SIZE) / C.TILE_SIZE),
})

export function loadLevel(level: TiledLevel): State {
  const { width, height } = level
  const tileLayers = level.layers.filter((l) => l.type === 'tilelayer')

  /* Levels carry one tile layer of walls; everything else — stairs, doors,
     items, keys, enemies, the spawn — is an object. The rules still work on
     a two-layer grid, so objects are painted back onto it here: terrain on
     layer 0, pickups and enemies on layer 1. */
  const blank = () => new Array(width * height).fill(-1)
  const tiles = [
    tileLayers[0]
      ? (tileLayers[0].data ?? []).map((gid) => (gid === 0 ? -1 : gid - 1))
      : blank(),
    blank(),
  ]

  const monsters: MonsterState[] = []
  const doors: DoorState[] = []
  let spawn: Spawn | undefined

  for (const layer of level.layers) {
    if (layer.type !== 'objectgroup') continue
    for (const object of layer.objects ?? []) {
      if (object.gid === undefined) continue
      const { x, y } = objectTile(object)
      const index = object.gid - 1
      const at = y * width + x

      const lock = parseDoorName(object.name ?? '')
      if (lock) {
        doors.push({ x, y, ...lock })
        tiles[0][at] = index
        continue
      }

      if (index === C.PLAYER_ID) {
        const { abilityValues, hp } = parseSpawnName(object.name ?? '')
        spawn = { x, y, abilityValues, hp }
        continue
      }

      const stats = C.ENEMY_STATS[index]
      if (stats) {
        monsters.push({
          x, y, tileIndex: index, health: stats[0], damage: stats[1],
        })
        tiles[1][at] = index
        continue
      }

      // stairs sit on the terrain layer; pickups on the layer above
      const terrain =
        C.STAIR_IDS.includes(index) || C.WALL_IDS.includes(index)
      tiles[terrain ? 0 : 1][at] = index
    }
  }

  if (!spawn) throw new Error('level has no spawn object')

  return {
    width,
    height,
    tiles,
    player: { x: spawn.x, y: spawn.y },
    hp: spawn.hp,
    heldItem: C.NULL_ITEM_ID,
    abilityValues: spawn.abilityValues.length
      ? spawn.abilityValues
      : [...C.STARTING_ABILITY_VALUES],
    abilityValueIndex: 0,
    monsters,
    doors,
    dead: false,
    won: false,
  }
}
