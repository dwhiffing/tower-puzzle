import { GameScene } from './Game'

export class Map {
  scene: GameScene
  tilemap: Phaser.Tilemaps.Tilemap
  layers: Phaser.Tilemaps.TilemapLayer[] = []

  constructor(scene: GameScene) {
    this.scene = scene
    this.tilemap = scene.make.tilemap({ key: `level${scene.state.level}` })
    const tileset = this.tilemap.addTilesetImage('tilemap', 'tilemap')!
    const edits = scene.state.tileEdits[scene.state.level] ?? []

    this.layers = this.tilemap.layers.map(
      (layer) => this.tilemap.createLayer(layer.name, tileset, 0, 0)!,
    )

    for (const e of edits) {
      this.layers[e.layer]?.putTileAt(e.index, e.x, e.y)
    }
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

    const edits = (this.scene.state.tileEdits[this.scene.state.level] ??= [])
    const existing = edits.find(
      (e) => e.x === x && e.y === y && e.layer === layer.layerIndex,
    )
    if (existing) existing.index = index
    else edits.push({ layer: layer.layerIndex, x, y, index })
  }

  removeTile(x: number, y: number) {
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
