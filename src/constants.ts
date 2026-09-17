export const COLOURS = [0x120a19, 0x5e4069, 0x6e1f22, 0xc4181f]
// export const COLOURS = [0x300030, 0x602878, 0xf89020, 0xf8f088]

export const LEVEL_COUNT = 3
export const TILE_SIZE = 16
export const PLAYER_ID = 56
export const WALL_IDS = [1]
export const POTION_IDS = [32]
export const ENEMY_IDS = [40, 41, 42]
export const STAIRS_DOWN_ID = 2
export const STAIRS_UP_ID = 3
export const NULL_ITEM_ID = 7
export const CURRENCY_TILES: Record<number, number> = { 24: 1, 25: 5, 26: 10 }
export const DOOR_IDS = [4]
export const KEY_IDS = [16]
export const CURRENCY_IDS = Object.keys(CURRENCY_TILES).map(Number)
export const STAIR_IDS = [STAIRS_UP_ID, STAIRS_DOWN_ID]
