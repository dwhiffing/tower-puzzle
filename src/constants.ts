export const COLOURS = [0x120a19, 0x5e4069, 0x6e1f22, 0xc4181f]
// export const COLOURS = [0x300030, 0x602878, 0xf89020, 0xf8f088]

export const LEVEL_COUNT = 9
export const STARTING_ABILITY_VALUES = [4, 1, 3]
export const STARTING_HP = 10
export const TILE_SIZE = 16
export const PLAYER_ID = 56
export const WALL_IDS = [1]
export const POTION_IDS = [32]
export const ENEMY_IDS = [40, 41, 42, 43, 44, 45]
export const ENEMY_IDLE_OFFSET = 8
export const ENEMY_IDLE_FRAMERATE = 2
export const TITLE_GEM_FRAMERATE = 6
export const STAIRS_DOWN_ID = 2
export const STAIRS_UP_ID = 3
export const NULL_ITEM_ID = 7
export const GEM_IDS = [24]
export const CURRENCY_TILES: Record<number, number> = { 25: 5, 26: 10 }
export const DOOR_IDS = [4]
export const KEY_IDS = [16]
export const SWORD_IDS = [8]
export const SHIELD_IDS = [9]
export const PICKAXE_IDS = [10]
export const RING_IDS = [11]
export const BOOTS_IDS = [12]
export const SWORD_DAMAGE_MULTIPLIER = 2
export const CURRENCY_IDS = Object.keys(CURRENCY_TILES).map(Number)
export const STAIR_IDS = [STAIRS_UP_ID, STAIRS_DOWN_ID]
export const HELD_ITEM_IDS = [
  ...KEY_IDS,
  ...SWORD_IDS,
  ...SHIELD_IDS,
  ...GEM_IDS,
  ...PICKAXE_IDS,
  ...BOOTS_IDS,
]

export const PIXEL_FONT_BODY = 0xc4181f
export const PIXEL_FONT_OUTLINE = 0x120a19

export const ENEMY_STATS: Record<number, [number, number]> = {
  40: [3, 2],
  41: [4, 2],
  42: [6, 3],
  43: [8, 3],
  44: [9, 4],
  45: [12, 4],
}
