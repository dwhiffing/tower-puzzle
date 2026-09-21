import * as C from '../constants'
import { burstPixels, flashSprite, floatText } from '../utils'
import { step } from '../rules'
import type { State } from '../rules'
import { GameState } from '../GameState'
import { Hud } from '../Hud'
import { GameMap } from '../Map'

let selectHeld = false
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') selectHeld = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') selectHeld = false
  })
  window.addEventListener('blur', () => (selectHeld = false))
}

const isSelectHeld = () => selectHeld

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
  undoKey: Phaser.Input.Keyboard.Key
  undoKey2: Phaser.Input.Keyboard.Key
  undoStack: State[] = []
  undoTimer = 0
  isUndoHeld = false

  constructor() {
    super('Game')
  }

  create() {
    const lastLevel = this.registry.get('lastLevel') ?? null
    const isNewRun = !lastLevel
    this.state = new GameState(this, isNewRun)
    this.map = new GameMap(this)
    this.state.set('abilityValues', [])
    this.state.set('hp', this.map.spawn?.hp ?? 1)
    this.hud = new Hud(this)
    this.createPlayer()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.undoKey = this.input.keyboard!.addKey('SPACE')
    this.undoKey2 = this.input.keyboard!.addKey('X')
    this.input.keyboard!.on('keydown-LEFT', () => {
      if (isSelectHeld()) this.skipLevel(-1)
    })
    this.input.keyboard!.on('keydown-RIGHT', () => {
      if (isSelectHeld()) this.skipLevel(1)
    })
    this.moveTimer = 0
    this.undoStack = []
  }

  update(_time: number, delta: number) {
    if (this.scene.isActive('Transition') || this.isAttacking) return

    if (this.updateHistory(delta)) return
    if (this.isDead) return
    if (isSelectHeld()) {
      this.isMoveHeld = false
      this.moveTimer = 0
      return
    }

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
    const { x = 0, y = 0 } = this.map.spawn ?? {}
    this.player = this.add
      .sprite(0, 0, 'tilemap', C.PLAYER_ID)
      .setOrigin(0)
      .setDepth(10)
      .setPosition(x * C.TILE_SIZE, y * C.TILE_SIZE)
  }

  updateHistory(delta: number) {
    if (!this.undoKey.isDown && !this.undoKey2.isDown) {
      this.isUndoHeld = false
      this.undoTimer = 0
      return false
    }

    this.undoTimer -= delta
    if (this.isUndoHeld && this.undoTimer > 0) return true

    this.undoTimer = this.isUndoHeld ? 100 : 200
    this.isUndoHeld = true

    this.undo()
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

  undo() {
    const prev = this.undoStack.pop()
    if (!prev) return this.sound.play('player-step', { volume: 2, rate: 0.1 })
    this.sound.play('undo', { volume: 1 })
    this.state.set('hp', prev.hp)
    this.state.set('heldItem', prev.heldItem)
    this.state.set('abilityValues', prev.abilityValues)
    this.player.setPosition(
      prev.player.x * C.TILE_SIZE,
      prev.player.y * C.TILE_SIZE,
    )
    this.map.restore(prev)
    this.isDead = false
    this.isAttacking = false
    this.player.setVisible(true)
  }

  move(dx: number, dy: number) {
    const before = this.toRulesState()
    const result = step(before, { dx, dy })
    if (!result) {
      this.sound.play('player-step', { volume: 2, rate: 0.1 })
      return
    }

    this.undoStack.push(before)
    this.applyEffects(result, before.heldItem)
  }

  applyEffects(result: ReturnType<typeof step> & {}, heldBefore?: number) {
    const { state, effects } = result
    const attack = effects.find((e) => e.type === 'attack')
    this.playEffectSounds(result, heldBefore ?? C.NULL_ITEM_ID)

    this.state.set('hp', state.hp)
    this.state.set('heldItem', state.heldItem)
    this.state.set('abilityValues', state.abilityValues)

    for (const effect of effects) {
      if (effect.type === 'move' || effect.type === 'swap') {
        this.player.setPosition(effect.x * C.TILE_SIZE, effect.y * C.TILE_SIZE)
      } else if (effect.type === 'dig') {
        this.map.removeTile(effect.x, effect.y)
      } else if (effect.type === 'door') {
        this.map.removeDoor(effect.x, effect.y)
      } else if (effect.type === 'exit') {
        this.nextLevel()
      }
    }

    const potion = effects.find((e) => e.type === 'potion')
    if (potion) floatText(this, this.player.x, this.player.y, potion.amount)

    this.map.monsterStats = new Map(
      state.monsters.map((m) => [`${m.x},${m.y}`, [m.health, m.damage]]),
    )
    this.syncTiles(state)
    this.syncMonsters(state)

    if (!attack) return

    const monster = this.map.getMonster(attack.x, attack.y)
    const hurt = effects.find((e) => e.type === 'hurt')
    const died = effects.some((e) => e.type === 'died')
    burstPixels(this, attack.x * C.TILE_SIZE - 2, attack.y * C.TILE_SIZE, {
      count: attack.killed ? 20 : 5,
    })
    floatText(
      this,
      attack.x * C.TILE_SIZE,
      attack.y * C.TILE_SIZE,
      -attack.damage,
    )
    if (!monster) return

    monster.setStats(
      state.monsters.find((m) => m.x === attack.x && m.y === attack.y)
        ?.health ?? 0,
      monster.damage,
    )

    this.isAttacking = true
    if (hurt)
      this.time.delayedCall(260, () => {
        const died = result.effects.some((t) => t.type === 'died')
        burstPixels(this, this.player.x, this.player.y, {
          count: died ? 40 : 10,
          lifespan: 800,
        })
        floatText(this, this.player.x, this.player.y, -hurt.amount)
        this.sound.play(died ? 'player-dead' : 'player-hit', { volume: 0.35 })
      })
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

  syncMonsters(state: State) {
    const byTile = new Map(
      [...this.map.monsters.values()].map((m) => [m, `${m.x},${m.y}`]),
    )
    for (const want of state.monsters) {
      const key = `${want.x},${want.y}`
      if ([...byTile.values()].includes(key)) continue
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

  playEffectSounds(result: ReturnType<typeof step> & {}, heldBefore: number) {
    const { effects } = result
    const has = (type: string) => effects.some((e) => e.type === type)

    if (has('exit')) return this.sound.play('win-level', { volume: 0.2 })

    const attack = effects.find((e) => e.type === 'attack')
    if (attack) {
      this.sound.play(attack.killed ? 'enemy-dead' : 'enemy-hit', {
        volume: 0.5,
      })
      if (heldBefore === C.SHIELD_ID)
        this.sound.play('use-shield', { volume: 0.5 })
      return
    }

    if (has('door')) return this.sound.play('use-key', { volume: 0.3 })
    if (has('dig')) return this.sound.play('use-pickaxe', { volume: 0.5 })
    if (has('swap')) return this.sound.play('use-boots', { volume: 0.5 })
    if (has('ring')) return this.sound.play('use-ring', { volume: 0.5 })
    if (has('potion')) return this.sound.play('use-potion', { volume: 0.2 })
    if (has('pickup') || has('value'))
      return this.sound.play('pickup-item', { volume: 0.5 })
    return this.sound.play('player-step', { volume: 0.5 })
  }

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

  skipLevel = (delta: number) => {
    if (this.scene.isActive('Transition')) return
    const newLevel = this.state.level + delta
    if (newLevel < 1 || newLevel > C.LEVEL_COUNT) return

    this.state.set('heldItem', C.NULL_ITEM_ID)
    this.registry.set('lastLevel', this.state.level)
    this.registry.set('level', newLevel)
    this.scene.launch('Transition', {
      from: 'Game',
      to: 'Game',
      restart: true,
      duration: 300,
    })
  }

  nextLevel = () => {
    const newLevel = this.state.level + 1
    if (newLevel > C.LEVEL_COUNT) {
      this.registry.set('won', true)
      this.scene.launch('Transition', { from: 'Game', to: 'Menu' })
      return
    }

    this.state.set('heldItem', C.NULL_ITEM_ID)
    this.state.set('lastLevel', this.state.level)
    this.state.set('level', newLevel)
    this.scene.launch('Transition', {
      from: 'Game',
      to: 'Game',
      restart: true,
    })
  }
}
