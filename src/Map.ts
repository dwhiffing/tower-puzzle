import * as C from './constants'
import type { State } from './rules'
import { Door } from './Door'
import { GameScene } from './scenes/Game'
import { Monster } from './Monster'

export class GameMap {
  scene: GameScene
  tilemap: Phaser.Tilemaps.Tilemap
  layers: Phaser.Tilemaps.TilemapLayer[] = []
  monsters = new Map<string, Monster>()
  doors = new Map<string, Door>()
  spawn?: { x: number; y: number; hp: number }
  monsterStats = new Map<string, [number, number]>()

  constructor(scene: GameScene) {
    this.scene = scene
    this.tilemap = scene.make.tilemap({ key: `level${scene.state.level}` })
    const tileset = this.tilemap.addTilesetImage('tilemap', 'tilemap')!

    this.layers = this.tilemap.layers.map(
      (layer) => this.tilemap.createLayer(layer.name, tileset, 0, 0)!,
    )

    if (this.layers.length < 2) {
      const blank = this.tilemap.createBlankLayer('objects', tileset, 0, 0)!
      this.layers.push(blank)
    }
    this.paintObjects()

    this.spawnMonsters()
    this.spawnDoors()
  }

  restore(state: State) {
    this.monsterStats = new Map(
      state.monsters.map((m) => [`${m.x},${m.y}`, [m.health, m.damage]]),
    )
    this.scene.syncTiles(state)

    const wanted = new Map(state.monsters.map((m) => [`${m.x},${m.y}`, m]))
    for (const [key, monster] of [...this.monsters]) {
      if (wanted.get(key)?.tileIndex === monster.tileIndex) continue
      monster.destroy()
      this.monsters.delete(key)
    }
    for (const [key, m] of wanted) {
      const existing = this.monsters.get(key)
      if (existing) existing.setStats(m.health, m.damage)
      else
        this.monsters.set(
          key,
          new Monster(this.scene, m.x, m.y, m.tileIndex, m.health, m.damage),
        )
      this.getTileAt(m.x, m.y)?.setVisible(false)
    }

    const live = new Set(state.doors.map((d) => `${d.x},${d.y}`))
    for (const def of this.doorDefs()) {
      const key = `${def.x},${def.y}`
      if (!live.has(key)) {
        this.removeDoor(def.x, def.y)
        for (const layer of this.layers) layer.putTileAt(-1, def.x, def.y)
        continue
      }
      this.layers[0].putTileAt(def.gid, def.x, def.y)
      if (!this.doors.has(key)) {
        this.doors.set(
          key,
          new Door(this.scene, def.x, def.y, def.operator, def.value),
        )
      }
    }
  }

  getTileAt(x: number, y: number) {
    for (const layer of this.layers) {
      const tile = layer.getTileAt(x, y)
      if (tile) return tile
    }
    return null
  }

  paintObjects() {
    for (const layer of this.tilemap.objects) {
      for (const object of layer.objects) {
        if (object.gid === undefined) continue
        const index = object.gid - 1
        const { x, y } = this.objectTile(object)
        if (index === C.PLAYER_ID) {
          this.spawn = { x, y, hp: Number(object.name) }
          continue
        }
        if (Door.parse(object.name ?? '')) continue
        const match = /^(\d+)?\s*(?:\/\s*(\d+))?$/.exec(
          (object.name ?? '').trim(),
        )

        this.monsterStats.set(`${x},${y}`, [
          Number(match![1]),
          Number(match![2]),
        ])
        const terrain = index === C.STAIR_ID
        this.layers[terrain ? 0 : 1].putTileAt(object.gid, x, y)
      }
    }
  }

  spawnMonsters() {
    for (const monster of this.monsters.values()) monster.destroy()
    this.monsters.clear()

    for (const layer of this.layers) {
      layer.forEachTile((tile) => {
        const monster = this.addMonster(tile.x, tile.y, tile.index - 1)
        if (monster) tile.setVisible(false)
      })
    }
  }

  doorDefs() {
    const defs = []
    for (const layer of this.tilemap.objects) {
      for (const object of layer.objects) {
        const lock = Door.parse(object.name ?? '')
        if (!lock || object.gid === undefined) continue
        defs.push({ ...this.objectTile(object), ...lock, gid: object.gid })
      }
    }
    return defs
  }

  spawnDoors() {
    for (const door of this.doors.values()) door.destroy()
    this.doors.clear()

    for (const def of this.doorDefs()) {
      const door = new Door(this.scene, def.x, def.y, def.operator, def.value)
      this.setTile(this.layers[0], def.gid, def.x, def.y)
      this.doors.set(door.key, door)
    }
  }

  objectTile(object: Phaser.Types.Tilemaps.TiledObject) {
    return {
      x: Math.floor((object.x ?? 0) / C.TILE_SIZE),
      y: Math.floor(((object.y ?? 0) - C.TILE_SIZE) / C.TILE_SIZE),
    }
  }

  removeDoor(x: number, y: number) {
    const key = `${x},${y}`
    this.doors.get(key)?.destroy()
    this.doors.delete(key)
  }

  addMonster(x: number, y: number, tileIndex: number) {
    const defaults = C.ENEMY_STATS[tileIndex]
    if (!defaults) return
    const [health, damage] = this.monsterStats.get(`${x},${y}`) ?? defaults
    const monster = new Monster(this.scene, x, y, tileIndex, health, damage)
    this.monsters.set(monster.key, monster)
    return monster
  }

  getMonster(x: number, y: number) {
    return this.monsters.get(`${x},${y}`) ?? null
  }

  removeMonster(x: number, y: number) {
    const key = `${x},${y}`
    this.monsters.get(key)?.destroy()
    this.monsters.delete(key)
  }

  setTile(
    layer: Phaser.Tilemaps.TilemapLayer,
    index: number,
    x: number,
    y: number,
  ) {
    if (layer.getTileAt(x, y)?.index === index) return
    layer.putTileAt(index, x, y)

    this.removeMonster(x, y)
    const monster = this.addMonster(x, y, index - 1)
    layer.getTileAt(x, y)?.setVisible(!monster)
  }

  removeTile(x: number, y: number) {
    this.removeDoor(x, y)
    for (const layer of this.layers) this.setTile(layer, -1, x, y)
  }
}
