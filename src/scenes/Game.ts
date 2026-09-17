import * as C from '../constants'
import { GameState } from './GameState'
import { Hud } from './Hud'
import { Map } from './Map'

export class GameScene extends Phaser.Scene {
  map: Map
  hud: Hud
  state: GameState
  player: Phaser.GameObjects.Sprite
  moveTimer = 0
  isMoveHeld = false
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  zKey: Phaser.Input.Keyboard.Key
  xKey: Phaser.Input.Keyboard.Key

  constructor() {
    super('Game')
  }

  create() {
    const lastLevel = this.registry.get('lastLevel') ?? null
    this.state = new GameState(this, !lastLevel)
    this.map = new Map(this)
    this.hud = new Hud(this)
    this.createPlayer()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.moveTimer = 0
    this.state.set('abilityValues', [1, 4, 3])
    this.state.set('abilityValueIndex', 0)
  }

  update(_time: number, delta: number) {
    if (this.scene.isActive('Transition')) return

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
    const tile = this.map.findTile(arriveAt ?? C.PLAYER_ID + 1)!
    const spawnTile = this.map.findTile(C.PLAYER_ID + 1)
    if (spawnTile) this.map.removeTile(spawnTile.x, spawnTile.y)

    this.player = this.add
      .sprite(0, 0, 'tilemap', C.PLAYER_ID)
      .setOrigin(0)
      .setPosition(tile.x * C.TILE_SIZE, tile.y * C.TILE_SIZE)
  }

  move(dx: number, dy: number) {
    const { width, height } = this.map.tilemap
    const x = this.player.x / C.TILE_SIZE + dx
    const y = this.player.y / C.TILE_SIZE + dy

    if (x < 0 || y < 0 || x >= width || y >= height) return

    const index = (this.map.getTile(x, y)?.index ?? 0) - 1

    if (C.WALL_IDS.includes(index)) return

    if (C.STAIR_IDS.includes(index)) {
      this.player.setPosition(x * C.TILE_SIZE, y * C.TILE_SIZE)
      this.nextLevel(index)
      return
    }

    if (C.DOOR_IDS.includes(index)) {
      // const keyCount = this.state.get(`keys.${C.DOOR_TYPES[index]}`) ?? 0
      // if (keyCount < 1) return
      // this.state.inc(`keys.${C.DOOR_TYPES[index]}`, -1)
    } else if (C.KEY_IDS.includes(index)) {
      this.state.set('heldItem', C.KEY_IDS[0])
    } else if (C.ENEMY_IDS.includes(index)) {
      // this.state.inc('enemies', 1)
    } else if (C.POTION_IDS.includes(index)) {
      this.state.set('heldItem', C.POTION_IDS[0])
    } else if (C.CURRENCY_IDS.includes(index)) {
      // this.state.inc('currency', C.CURRENCY_TILES[index] ?? 0)
    }

    this.player.setPosition(x * C.TILE_SIZE, y * C.TILE_SIZE)
    this.map.removeTile(x, y)
  }

  nextLevel = (index: number) => {
    const isUp = index === C.STAIRS_UP_ID
    const newLevel = this.state.level + (isUp ? 1 : -1)
    if (newLevel > C.LEVEL_COUNT) return

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
