import * as C from '../constants'
import { flashSprite } from '../flash'
import { State, step } from '../rules'
import { GameState, Snapshot } from './GameState'
import { Hud } from './Hud'
import { GameMap } from './Map'

export class GameScene extends Phaser.Scene {
  map: GameMap
  hud: Hud
  state: GameState
  player: Phaser.GameObjects.Sprite
  moveTimer = 0
  isMoveHeld = false
  isAttacking = false
  isDead = false
  playerFlashTimer?: Phaser.Time.TimerEvent
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  zKey: Phaser.Input.Keyboard.Key
  xKey: Phaser.Input.Keyboard.Key
  undoStack: Snapshot[] = []
  redoStack: Snapshot[] = []
  historyTimer = 0
  isHistoryHeld = false

  constructor() {
    super('Game')
  }

  create() {
    const lastLevel = this.registry.get('lastLevel') ?? null
    const isNewRun = !lastLevel
    this.state = new GameState(this, isNewRun)
    this.map = new GameMap(this)
    const values = this.map.spawn?.abilityValues
    if (isNewRun || values?.length) {
      this.state.set(
        'abilityValues',
        values?.length ? values : C.STARTING_ABILITY_VALUES,
      )
      this.state.set('abilityValueIndex', 0)
    }
    // each level is balanced on its own hp, so arriving never carries damage
    this.state.set('hp', this.map.spawn?.hp ?? C.STARTING_HP)
    this.hud = new Hud(this)
    this.createPlayer()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.zKey = this.input.keyboard!.addKey('Z')
    this.xKey = this.input.keyboard!.addKey('X')
    this.moveTimer = 0
    this.undoStack = []
    this.redoStack = []
  }

  update(_time: number, delta: number) {
    if (this.scene.isActive('Transition') || this.isAttacking) return

    if (this.updateHistory(delta)) return
    if (this.isDead) return

    const { left, right, up, down } = this.cursors
    const dx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0)
    const dy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0)

    if (dx === 0 && dy === 0) {
      this.isMoveHeld = false
      this.moveTimer = 0
      return
    }

    this.moveTimer -= delta
    if (this.isMoveHeld && this.moveTimer > 0) return

    this.moveTimer = this.isMoveHeld ? 100 : 200
    this.isMoveHeld = true
    this.move(dx !== 0 ? dx : 0, dx !== 0 ? 0 : dy)
  }

  createPlayer() {
    const arriveAt = this.state.lastLevel
      ? this.state.lastLevel < this.state.level
        ? C.STAIRS_DOWN_ID
        : C.STAIRS_UP_ID
      : undefined
    const start =
      (arriveAt ? this.map.findTile(arriveAt) : undefined) ??
      this.map.spawn ??
      this.map.findTile(C.PLAYER_ID)
    const spawnTile = this.map.findTile(C.PLAYER_ID)
    if (spawnTile) this.map.removeTile(spawnTile.x, spawnTile.y)

    this.player = this.add
      .sprite(0, 0, 'tilemap', C.PLAYER_ID)
      .setOrigin(0)
      .setDepth(10)
      .setPosition((start?.x ?? 0) * C.TILE_SIZE, (start?.y ?? 0) * C.TILE_SIZE)
  }

  updateHistory(delta: number) {
    const undo = this.zKey.isDown
    const redo = this.xKey.isDown

    if (undo === redo) {
      this.isHistoryHeld = false
      this.historyTimer = 0
      return false
    }

    this.historyTimer -= delta
    if (this.isHistoryHeld && this.historyTimer > 0) return true

    this.historyTimer = this.isHistoryHeld ? 100 : 200
    this.isHistoryHeld = true

    if (undo) this.undo()
    else this.redo()
    return true
  }

  toRulesState(): State {
    const { width, height } = this.map.tilemap
    const tiles = this.map.layers.map((layer) => {
      const indices: number[] = new Array(width * height).fill(-1)
      layer.forEachTile((tile) => {
        indices[tile.y * width + tile.x] =
          tile.index === -1 ? -1 : tile.index - 1
      })
      return indices
    })

    return {
      width,
      height,
      tiles,
      player: {
        x: this.player.x / C.TILE_SIZE,
        y: this.player.y / C.TILE_SIZE,
      },
      hp: this.state.hp,
      heldItem: this.state.heldItem,
      abilityValues: [...this.state.abilityValues],
      abilityValueIndex: this.state.abilityValueIndex,
      monsters: [...this.map.monsters.values()].map((m) => ({
        x: m.x,
        y: m.y,
        tileIndex: m.tileIndex,
        health: m.health,
        damage: m.damage,
      })),
      doors: [...this.map.doors.values()].map((d) => ({
        x: d.x,
        y: d.y,
        operator: d.operator,
        value: d.value,
      })),
      dead: this.isDead,
      won: false,
    }
  }

  pushHistory() {
    this.undoStack.push(this.state.snapshot())
    this.redoStack = []
  }

  undo() {
    const snapshot = this.undoStack.pop()
    if (!snapshot) return
    this.redoStack.push(this.state.snapshot())
    this.state.restore(snapshot)
    this.revive()
  }

  revive() {
    this.isDead = false
    this.isAttacking = false
    this.player.setVisible(true)
  }

  redo() {
    const snapshot = this.redoStack.pop()
    if (!snapshot) return
    this.undoStack.push(this.state.snapshot())
    this.state.restore(snapshot)
    this.revive()
  }

  move(dx: number, dy: number) {
    const result = step(this.toRulesState(), { dx, dy })
    if (!result) return

    this.pushHistory()
    this.applyEffects(result)
  }

  /** Mirrors the rules' new state onto the scene, animating as it goes. */
  applyEffects(result: ReturnType<typeof step> & {}) {
    const { state, effects } = result
    const attack = effects.find((e) => e.type === 'attack')

    this.state.set('hp', state.hp)
    this.state.set('heldItem', state.heldItem)
    this.state.set('abilityValues', state.abilityValues)
    this.state.set('abilityValueIndex', state.abilityValueIndex)

    for (const effect of effects) {
      if (effect.type === 'move' || effect.type === 'swap') {
        this.player.setPosition(effect.x * C.TILE_SIZE, effect.y * C.TILE_SIZE)
      } else if (effect.type === 'dig') {
        this.map.removeTile(effect.x, effect.y)
      } else if (effect.type === 'door') {
        this.map.removeDoor(effect.x, effect.y)
      } else if (effect.type === 'exit') {
        this.nextLevel(effect.stairs)
      }
    }

    this.syncTiles(state)
    this.syncMonsters(state)

    if (!attack) return

    // Combat is the one case with timing: flash the monster, then resolve.
    const monster = this.map.getMonster(attack.x, attack.y)
    const hurt = effects.find((e) => e.type === 'hurt')
    const died = effects.some((e) => e.type === 'died')
    if (!monster) return

    monster.setStats(
      state.monsters.find((m) => m.x === attack.x && m.y === attack.y)
        ?.health ?? 0,
      monster.damage,
    )

    this.isAttacking = true
    monster.flash(() => {
      if (attack.killed) {
        this.isAttacking = false
        this.map.removeMonster(attack.x, attack.y)
        this.map.removeTile(attack.x, attack.y)
        return
      }
      if (!hurt) {
        this.isAttacking = false
        return
      }
      this.playerFlashTimer = flashSprite(
        this.player,
        this.playerFlashTimer,
        () => {
          this.isAttacking = false
          if (died) this.gameOver()
        },
      )
    })
  }

  /** Repositions monster objects to match the rules state. */
  syncMonsters(state: State) {
    const byTile = new Map(
      [...this.map.monsters.values()].map((m) => [m, `${m.x},${m.y}`]),
    )
    for (const want of state.monsters) {
      const key = `${want.x},${want.y}`
      if ([...byTile.values()].includes(key)) continue
      // A monster the rules moved: find the one that is no longer where it was.
      const stale = [...this.map.monsters.values()].find(
        (m) =>
          !state.monsters.some((w) => w.x === m.x && w.y === m.y) &&
          m.tileIndex === want.tileIndex,
      )
      if (!stale) continue
      this.map.monsters.delete(`${stale.x},${stale.y}`)
      stale.moveTo(want.x, want.y)
      this.map.monsters.set(stale.key, stale)
    }
  }

  /** Writes the rules' tile grid back onto the tilemap layers. */
  syncTiles(state: State) {
    const { width } = this.map.tilemap
    this.map.layers.forEach((layer, i) => {
      for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < width; x++) {
          const want = state.tiles[i][y * width + x] ?? -1
          const have = layer.getTileAt(x, y)
          const current = have && have.index !== -1 ? have.index - 1 : -1
          if (want === current) continue
          this.map.setTile(layer, want === -1 ? -1 : want + 1, x, y)
        }
      }
    })
  }

  gameOver() {
    this.isDead = true
    this.player.setVisible(false)
  }

  nextLevel = (index: number) => {
    const isUp = index === C.STAIRS_UP_ID
    const newLevel = this.state.level + (isUp ? 1 : -1)
    if (newLevel > C.LEVEL_COUNT) return

    this.state.set('heldItem', C.NULL_ITEM_ID)
    this.state.set('lastLevel', this.state.level)
    this.state.set('level', newLevel)
    this.scene.launch('Transition', {
      from: 'Game',
      to: 'Game',
      restart: true,
      duration: 300,
    })
  }
}
