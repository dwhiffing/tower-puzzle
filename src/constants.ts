export const COLOURS = [0x120a19, 0x5e4069, 0x6e1f22, 0xc4181f]

export const STARTING_LEVEL = 1
export const LEVEL_COUNT = 6
export const TILE_SIZE = 16
export const WALL_ID = 1
export const STAIR_ID = 3
export const DOOR_ID = 4

export const NULL_ITEM_ID = 7
export const SWORD_ID = 8
export const SHIELD_ID = 9
export const PICKAXE_ID = 10
export const RING_ID = 11
export const BOOTS_ID = 12
export const POTION_ID = 13
export const KEY_ID = 14
export const GEM_ID = 15

export const ENEMY_IDS = [40, 41, 42, 43, 44, 45]
export const PLAYER_ID = 56
export const HELD_ITEM_IDS = [
  KEY_ID,
  SWORD_ID,
  SHIELD_ID,
  GEM_ID,
  PICKAXE_ID,
  BOOTS_ID,
]

export const ENEMY_STATS: Record<number, [number, number]> = {
  40: [3, 2],
  41: [4, 2],
  42: [6, 3],
  43: [8, 3],
  44: [9, 4],
  45: [9, 4],
}
