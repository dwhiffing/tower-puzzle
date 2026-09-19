import * as C from '../constants'
import { Door } from './Door'
import { GameScene } from './Game'
import { Snapshot } from './GameState'
import { Monster } from './Monster'

export class GameMap {
  scene: GameScene
  tilemap: Phaser.Tilemaps.Tilemap
  layers: Phaser.Tilemaps.TilemapLayer[] = []
  monsters = new Map<string, Monster>()
  doors = new Map<string, Door>()
  spawn?: { x: number; y: number; abilityValues: number[] }
  baseTiles: number[][] = []

  constructor(scene: GameScene) {
    this.scene = scene
    this.tilemap = scene.make.tilemap({ key: `level${scene.state.level}` })
    const tileset = this.tilemap.addTilesetImage('tilemap', 'tilemap')!
    const edits = scene.state.tileEdits[scene.state.level] ?? []

    this.layers = this.tilemap.layers.map((layer) =>
      this.tilemap.createLayer(layer.name, tileset, 0, 0)!,
    )

    this.baseTiles = this.layers.map((layer) => {
      const indices: number[] = []
      layer.forEachTile((tile) => {
        indices[tile.y * this.tilemap.width + tile.x] = tile.index
      })
      return indices
    })

    for (const e of edits) {
      this.layers[e.layer]?.putTileAt(e.index, e.x, e.y)
    }

    this.spawnMonsters()
    this.spawnDoors()
    this.findSpawn()
  }

  restore(snapshot: Snapshot) {
    const { width, height } = this.tilemap
    this.layers.forEach((layer, i) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          layer.putTileAt(this.baseTiles[i][y * width + x] ?? -1, x, y)
        }
      }
    })
    for (const e of snapshot.tileEdits[this.scene.state.level] ?? []) {
      this.layers[e.layer]?.putTileAt(e.index, e.x, e.y)
    }

    // Reuse monsters that are still present so their idle animation keeps
    // playing; only the difference is created or destroyed.
    const wanted = new Map(snapshot.monsters.map((m) => [`${m.x},${m.y}`, m]))

    for (const [key, monster] of [...this.monsters]) {
      const m = wanted.get(key)
      if (m && m.tileIndex === monster.tileIndex) continue
      monster.destroy()
      this.monsters.delete(key)
    }

    for (const [key, m] of wanted) {
      const existing = this.monsters.get(key)
      if (existing) existing.setStats(m.health, m.damage)
      else {
        const monster = new Monster(
          this.scene,
          m.x,
          m.y,
          m.tileIndex,
          m.health,
          m.damage,
        )
        this.monsters.set(key, monster)
      }
      this.getTileAt(m.x, m.y)?.setVisible(false)
    }

    for (const def of this.doorDefs()) {
      const key = `${def.x},${def.y}`
      const shouldExist = snapshot.doors.includes(key)

      if (!shouldExist) {
        this.removeDoor(def.x, def.y)
        for (const layer of this.layers) layer.putTileAt(-1, def.x, def.y)
        continue
      }

      this.layers[0].putTileAt(def.gid, def.x, def.y)
      if (this.doors.has(key)) continue
      const door = new Door(this.scene, def.x, def.y, def.operator, def.value)
      this.doors.set(key, door)
    }
  }

  getTileAt(x: number, y: number) {
    for (const layer of this.layers) {
      const tile = layer.getTileAt(x, y)
      if (tile) return tile
    }
    return null
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

  // Tiled anchors tile objects at their bottom-left corner.
  objectTile(object: Phaser.Types.Tilemaps.TiledObject) {
    return {
      x: Math.floor((object.x ?? 0) / C.TILE_SIZE),
      y: Math.floor(((object.y ?? 0) - C.TILE_SIZE) / C.TILE_SIZE),
    }
  }

  findSpawn() {
    for (const layer of this.tilemap.objects) {
      for (const object of layer.objects) {
        if (object.gid === undefined) continue
        if (object.gid - 1 !== C.PLAYER_ID) continue

        const abilityValues = (object.name ?? '')
          .split(',')
          .map((part) => Number(part.trim()))
          .filter((value) => Number.isFinite(value))

        this.spawn = { ...this.objectTile(object), abilityValues }
        return this.spawn
      }
    }
  }

  getDoor(x: number, y: number) {
    return this.doors.get(`${x},${y}`) ?? null
  }

  removeDoor(x: number, y: number) {
    const key = `${x},${y}`
    this.doors.get(key)?.destroy()
    this.doors.delete(key)
  }

  addMonster(x: number, y: number, tileIndex: number) {
    const stats = C.ENEMY_STATS[tileIndex]
    if (!stats) return
    const [health, damage] = stats
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

  getTile(x: number, y: number, indices: number[] = []) {
    for (const layer of this.layers) {
      const tile = layer.getTileAt(x, y)
      if (tile && indices.length === 0) return tile
      if (tile && indices.includes(tile.index)) return tile
    }
    return null
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
    if (monster) layer.getTileAt(x, y)?.setVisible(false)

    const edits = (this.scene.state.tileEdits[this.scene.state.level] ??= [])
    const existing = edits.find(
      (e) => e.x === x && e.y === y && e.layer === layer.layerIndex,
    )
    if (existing) existing.index = index
    else edits.push({ layer: layer.layerIndex, x, y, index })
  }

  removeTile(x: number, y: number) {
    this.removeDoor(x, y)
    for (const layer of this.layers) this.setTile(layer, -1, x, y)
  }

  findTile(indices?: number[] | number | null) {
    for (const layer of this.layers) {
      const tile = layer.findTile((t) =>
        Array.isArray(indices)
          ? indices.includes(t.index)
          : t.index === indices,
      )
      if (tile) return tile
    }
    return null
  }
}
