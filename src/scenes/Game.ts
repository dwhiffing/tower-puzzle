import * as C from '../constants'
import { flashSprite } from '../flash'
import { GameState } from './GameState'
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
  playerFlashTimer?: Phaser.Time.TimerEvent
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  xKey: Phaser.Input.Keyboard.Key

  constructor() {
    super('Game')
  }

  create() {
    const lastLevel = this.registry.get('lastLevel') ?? null
    const isNewRun = !lastLevel
    this.state = new GameState(this, isNewRun)
    this.map = new GameMap(this)
    if (isNewRun) {
      const values = this.map.spawn?.abilityValues
      this.state.set(
        'abilityValues',
        values?.length ? values : C.STARTING_ABILITY_VALUES,
      )
      this.state.set('abilityValueIndex', 0)
    }
    this.hud = new Hud(this)
    this.createPlayer()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.moveTimer = 0
  }

  update(_time: number, delta: number) {
    if (this.scene.isActive('Transition') || this.isAttacking) return

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
    const start = arriveAt
      ? this.map.findTile(arriveAt)
      : (this.map.spawn ?? this.map.findTile(C.PLAYER_ID + 1))
    const spawnTile = this.map.findTile(C.PLAYER_ID + 1)
    if (spawnTile) this.map.removeTile(spawnTile.x, spawnTile.y)

    this.player = this.add
      .sprite(0, 0, 'tilemap', C.PLAYER_ID)
      .setOrigin(0)
      .setDepth(10)
      .setPosition((start?.x ?? 0) * C.TILE_SIZE, (start?.y ?? 0) * C.TILE_SIZE)
  }

  move(dx: number, dy: number) {
    const { width, height } = this.map.tilemap
    const x = this.player.x / C.TILE_SIZE + dx
    const y = this.player.y / C.TILE_SIZE + dy

    if (x < 0 || y < 0 || x >= width || y >= height) return

    const index = (this.map.getTile(x, y)?.index ?? 0) - 1

    if (C.WALL_IDS.includes(index)) return

    if (C.STAIR_IDS.includes(index)) {
      if (!C.GEM_IDS.includes(this.state.heldItem)) return
      this.player.setPosition(x * C.TILE_SIZE, y * C.TILE_SIZE)
      this.nextLevel(index)
      return
    }

    if (C.DOOR_IDS.includes(index)) {
      if (!C.KEY_IDS.includes(this.state.heldItem)) return

      const { abilityValues, abilityValueIndex } = this.state
      const door = this.map.getDoor(x, y)
      if (door && !door.accepts(abilityValues[abilityValueIndex] ?? 0)) return

      this.state.set('heldItem', C.NULL_ITEM_ID)
      this.state.nextAbilityValue()
    } else if (C.HELD_ITEM_IDS.includes(index)) {
      this.swapHeldItem(index)
    } else if (C.ENEMY_IDS.includes(index)) {
      this.attack(x, y)
      return
    } else if (C.POTION_IDS.includes(index)) {
      const { abilityValues, abilityValueIndex } = this.state
      this.state.set(
        'hp',
        this.state.hp + (abilityValues[abilityValueIndex] ?? 0),
      )
      this.state.nextAbilityValue()
    } else if (C.CURRENCY_IDS.includes(index)) {
      // this.state.inc('currency', C.CURRENCY_TILES[index] ?? 0)
    }

    this.player.setPosition(x * C.TILE_SIZE, y * C.TILE_SIZE)
    this.map.removeTile(x, y)
  }

  swapHeldItem(index: number) {
    const dropped = this.state.heldItem
    this.state.set('heldItem', index)
    if (dropped === C.NULL_ITEM_ID) return

    const from = {
      x: this.player.x / C.TILE_SIZE,
      y: this.player.y / C.TILE_SIZE,
    }
    this.map.setTile(this.map.layers[1], dropped + 1, from.x, from.y)
  }

  attack(x: number, y: number) {
    const monster = this.map.getMonster(x, y)
    if (!monster) return

    const { abilityValues, abilityValueIndex, heldItem } = this.state
    const hasSword = C.SWORD_IDS.includes(heldItem)
    const hasShield = C.SHIELD_IDS.includes(heldItem)
    const damage =
      (abilityValues[abilityValueIndex] ?? 0) *
      (hasSword ? C.SWORD_DAMAGE_MULTIPLIER : 1)
    const died = monster.takeDamage(damage)

    if (hasSword) this.state.set('heldItem', C.NULL_ITEM_ID)
    this.state.nextAbilityValue()

    this.isAttacking = true
    monster.flash(() => {
      if (died) {
        this.isAttacking = false
        this.map.removeTile(x, y)
        return
      }

      if (hasShield) {
        this.state.set('heldItem', C.NULL_ITEM_ID)
        this.isAttacking = false
        return
      }

      const hp = Math.max(0, this.state.hp - monster.damage)
      this.state.set('hp', hp)
      this.playerFlashTimer = flashSprite(
        this.player,
        this.playerFlashTimer,
        () => {
          this.isAttacking = false
          if (hp <= 0) this.gameOver()
        },
      )
    })
  }

  gameOver() {
    this.player.setVisible(false)
    this.registry.events.removeAllListeners()
    this.scene.launch('Transition', { from: 'Game', to: 'Menu' })
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
