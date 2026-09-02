export const COLOURS = [0x120a19, 0x5e4069, 0x6e1f22, 0xc4181f]
// export const COLOURS = [0x300030, 0x602878, 0xf89020, 0xf8f088]

export const LEVEL_COUNT = 3
export const TILE_SIZE = 16
export const PLAYER_ID = 48
export const WALL_IDS = [2]
export const POTION_IDS = [33]
export const ENEMY_IDS = [41, 42, 43]
export const STAIRS_DOWN_ID = 3
export const STAIRS_UP_ID = 4
export const CURRENCY_TILES: Record<number, number> = { 25: 1, 26: 5, 27: 10 }
export const LOCK_TYPES: Record<number, number> = { 17: 5 }
export const DOOR_TYPES = Object.entries(LOCK_TYPES).reduce(
  (acc, [k, v]) => {
    acc[v] = +k
    return acc
  },
  {} as Record<number, number>,
)
export const DOOR_IDS = Object.values(LOCK_TYPES)
export const KEY_IDS = Object.keys(LOCK_TYPES).map(Number)
export const CURRENCY_IDS = Object.keys(CURRENCY_TILES).map(Number)
export const STAIR_IDS = [STAIRS_UP_ID, STAIRS_DOWN_ID]
