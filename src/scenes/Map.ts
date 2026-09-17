import * as C from '../constants'
import { Door } from './Door'
import { GameScene } from './Game'
import { Monster } from './Monster'

export class GameMap {
  scene: GameScene
  tilemap: Phaser.Tilemaps.Tilemap
  layers: Phaser.Tilemaps.TilemapLayer[] = []
  monsters = new Map<string, Monster>()
  doors = new Map<string, Door>()
  spawn?: { x: number; y: number; abilityValues: number[] }

  constructor(scene: GameScene) {
    this.scene = scene
    this.tilemap = scene.make.tilemap({ key: `level${scene.state.level}` })
    const tileset = this.tilemap.addTilesetImage('tilemap', 'tilemap')!
    const edits = scene.state.tileEdits[scene.state.level] ?? []

    this.layers = this.tilemap.layers.map((layer) =>
      this.tilemap.createLayer(layer.name, tileset, 0, 0)!,
    )

    for (const e of edits) {
      this.layers[e.layer]?.putTileAt(e.index, e.x, e.y)
    }

    this.spawnMonsters()
    this.spawnDoors()
    this.findSpawn()
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

  spawnDoors() {
    for (const door of this.doors.values()) door.destroy()
    this.doors.clear()

    for (const layer of this.tilemap.objects) {
      for (const object of layer.objects) {
        const lock = Door.parse(object.name ?? '')
        if (!lock || object.gid === undefined) continue

        const { x, y } = this.objectTile(object)
        const door = new Door(this.scene, x, y, lock.operator, lock.value)

        this.setTile(this.layers[0], object.gid, x, y)
        this.doors.set(door.key, door)
      }
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
