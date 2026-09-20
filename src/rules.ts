import * as C from './constants'

export type Dir = { dx: number; dy: number }

export interface Tile {
  layer: number
  index: number
}

export interface MonsterState {
  x: number
  y: number
  tileIndex: number
  health: number
  damage: number
}

export interface DoorState {
  x: number
  y: number
  operator: '>' | '<' | '='
  value: number
}

export interface State {
  width: number
  height: number
  /** Tile index per layer, -1 for empty. Indexed [layer][y * width + x]. */
  tiles: number[][]
  player: { x: number; y: number }
  hp: number
  heldItem: number
  abilityValues: number[]
  abilityValueIndex: number
  monsters: MonsterState[]
  doors: DoorState[]
  dead: boolean
  won: boolean
}

export type Effect =
  | { type: 'move'; x: number; y: number }
  | { type: 'attack'; x: number; y: number; damage: number; killed: boolean }
  | { type: 'hurt'; amount: number }
  | { type: 'swap'; x: number; y: number }
  | { type: 'dig'; x: number; y: number }
  | { type: 'ring' }
  | { type: 'pickup'; item: number; dropped: number }
  | { type: 'potion'; amount: number }
  | { type: 'door'; x: number; y: number }
  | { type: 'exit'; x: number; y: number; stairs: number }
  | { type: 'died' }

export interface StepResult {
  state: State
  effects: Effect[]
}

const at = (state: State, x: number, y: number) => {
  for (const layer of state.tiles) {
    const index = layer[y * state.width + x] ?? -1
    if (index !== -1) return index
  }
  return -1
}

const setTile = (state: State, x: number, y: number, index: number) => {
  for (let i = 0; i < state.tiles.length; i++) {
    if (state.tiles[i][y * state.width + x] !== -1) {
      state.tiles[i][y * state.width + x] = index
      return
    }
  }
  const layer = state.tiles.length - 1
  state.tiles[layer][y * state.width + x] = index
}

const clearTile = (state: State, x: number, y: number) => {
  for (const layer of state.tiles) layer[y * state.width + x] = -1
}

export const liveValue = (state: State) =>
  state.abilityValues[state.abilityValueIndex] ?? 0

export const clone = (state: State): State => ({
  ...state,
  tiles: state.tiles.map((layer) => [...layer]),
  player: { ...state.player },
  abilityValues: [...state.abilityValues],
  monsters: state.monsters.map((m) => ({ ...m })),
  doors: state.doors.map((d) => ({ ...d })),
})

const advance = (state: State) => {
  if (state.abilityValues.length === 0) return
  state.abilityValueIndex =
    (state.abilityValueIndex + 1) % state.abilityValues.length
}

const doorAccepts = (door: DoorState, value: number) =>
  door.operator === '>'
    ? value > door.value
    : door.operator === '<'
      ? value < door.value
      : value === door.value

/** Drops the held item on the player's current tile, then takes `item`. */
const swapHeldItem = (state: State, item: number) => {
  const dropped = state.heldItem
  state.heldItem = item
  if (dropped !== C.NULL_ITEM_ID) {
    setTile(state, state.player.x, state.player.y, dropped)
  }
  return dropped
}

/**
 * Applies one move. Returns null if the move is rejected, so callers can
 * distinguish "nothing happened" from "the state advanced".
 */
export function step(input: State, dir: Dir): StepResult | null {
  if (input.dead || input.won) return null

  const x = input.player.x + dir.dx
  const y = input.player.y + dir.dy
  if (x < 0 || y < 0 || x >= input.width || y >= input.height) return null

  const index = at(input, x, y)
  const effects: Effect[] = []
  const state = clone(input)

  if (C.WALL_IDS.includes(index)) {
    if (!C.PICKAXE_IDS.includes(state.heldItem)) return null
    state.heldItem = C.NULL_ITEM_ID
    clearTile(state, x, y)
    effects.push({ type: 'dig', x, y })
    return { state, effects }
  }

  if (C.STAIR_IDS.includes(index)) {
    // without the gem the stairs are just floor, not a wall
    if (!C.GEM_IDS.includes(state.heldItem)) {
      state.player = { x, y }
      effects.push({ type: 'move', x, y })
      return { state, effects }
    }
    state.heldItem = C.NULL_ITEM_ID
    state.player = { x, y }
    state.won = true
    effects.push({ type: 'move', x, y }, { type: 'exit', x, y, stairs: index })
    return { state, effects }
  }

  if (C.ENEMY_IDS.includes(index)) {
    const monster = state.monsters.find((m) => m.x === x && m.y === y)
    if (!monster) return null

    if (C.BOOTS_IDS.includes(state.heldItem)) {
      state.heldItem = C.NULL_ITEM_ID
      monster.x = state.player.x
      monster.y = state.player.y
      clearTile(state, x, y)
      setTile(state, state.player.x, state.player.y, monster.tileIndex)
      state.player = { x, y }
      effects.push({ type: 'swap', x, y })
      return { state, effects }
    }

    const hasSword = C.SWORD_IDS.includes(state.heldItem)
    const hasShield = C.SHIELD_IDS.includes(state.heldItem)
    const damage = liveValue(state) * (hasSword ? C.SWORD_DAMAGE_MULTIPLIER : 1)

    monster.health = Math.max(0, monster.health - damage)
    const killed = monster.health <= 0
    if (hasSword) state.heldItem = C.NULL_ITEM_ID
    advance(state)
    effects.push({ type: 'attack', x, y, damage, killed })

    if (killed) {
      state.monsters = state.monsters.filter((m) => m !== monster)
      clearTile(state, x, y)
    } else if (hasShield) {
      state.heldItem = C.NULL_ITEM_ID
    } else {
      state.hp = Math.max(0, state.hp - monster.damage)
      effects.push({ type: 'hurt', amount: monster.damage })
      if (state.hp <= 0) {
        state.dead = true
        effects.push({ type: 'died' })
      }
    }
    return { state, effects }
  }

  if (C.DOOR_IDS.includes(index)) {
    if (!C.KEY_IDS.includes(state.heldItem)) return null
    const door = state.doors.find((d) => d.x === x && d.y === y)
    if (door && !doorAccepts(door, liveValue(state))) return null

    state.heldItem = C.NULL_ITEM_ID
    state.doors = state.doors.filter((d) => d !== door)
    advance(state)
    effects.push({ type: 'door', x, y })
  } else if (C.RING_IDS.includes(index)) {
    state.abilityValues.reverse()
    swapHeldItem(state, C.NULL_ITEM_ID)
    effects.push({ type: 'ring' })
  } else if (C.HELD_ITEM_IDS.includes(index)) {
    const dropped = swapHeldItem(state, index)
    effects.push({ type: 'pickup', item: index, dropped })
  } else if (C.POTION_IDS.includes(index)) {
    const amount = liveValue(state)
    state.hp += amount
    advance(state)
    effects.push({ type: 'potion', amount })
  }

  state.player = { x, y }
  clearTile(state, x, y)
  effects.push({ type: 'move', x, y })
  return { state, effects }
}
