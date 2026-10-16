import Phaser from 'phaser'

export class Pathfinding {
  private static grid: number[][] = []
  private static initialized = false

  static init(map: Phaser.Tilemaps.Tilemap) {
    const width = map.width // 40
    const height = map.height // 30
    this.grid = Array.from({ length: height }, () => Array(width).fill(0))

    // 1. Camada de chão com colisão de paredes/bordas
    const groundLayer = map.getLayer('Ground')?.tilemapLayer
    if (groundLayer) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tile = groundLayer.getTileAt(x, y)
          if (!tile || tile.collides || (tile.properties as any)?.collides) {
            this.grid[y][x] = 1
          }
        }
      }
    }

    // 2. Camadas de objetos que possuem colisão física
    const collidableLayers = [
      'ObjectsOnCollide',
      'GenericObjectsOnCollide',
      'Basement',
      'VendingMachine',
      'Computer',
    ]

    collidableLayers.forEach((layerName) => {
      const layer = map.getObjectLayer(layerName)
      if (layer && layer.objects) {
        layer.objects.forEach((obj) => {
          const startX = Math.floor(obj.x! / 32)
          const startY = Math.floor((obj.y! - (obj.height || 32)) / 32)
          const endX = Math.floor((obj.x! + (obj.width || 32) - 1) / 32)
          const endY = Math.floor((obj.y! - 1) / 32)
          for (let y = Math.max(0, startY); y <= Math.min(height - 1, endY); y++) {
            for (let x = Math.max(0, startX); x <= Math.min(width - 1, endX); x++) {
              this.grid[y][x] = 1
            }
          }
        })
      }
    })

    this.initialized = true
  }

  static findPath(
    startWorldX: number,
    startWorldY: number,
    targetWorldX: number,
    targetWorldY: number
  ): Array<{ x: number; y: number }> {
    if (!this.initialized || this.grid.length === 0) {
      return [{ x: targetWorldX, y: targetWorldY }]
    }

    const start = {
      x: Phaser.Math.Clamp(Math.floor(startWorldX / 32), 0, 39),
      y: Phaser.Math.Clamp(Math.floor(startWorldY / 32), 0, 29),
    }
    const end = {
      x: Phaser.Math.Clamp(Math.floor(targetWorldX / 32), 0, 39),
      y: Phaser.Math.Clamp(Math.floor(targetWorldY / 32), 0, 29),
    }

    // Algoritmo A* (A-Star) para encontrar a rota mais curta desviando dos obstáculos
    const h = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

    interface Node {
      x: number
      y: number
      g: number
      f: number
      parent: Node | null
    }

    const openSet: Node[] = [{ ...start, g: 0, f: h(start, end), parent: null }]
    const closedSet = new Set<string>()
    const key = (p: { x: number; y: number }) => `${p.x},${p.y}`
    let closest: Node = openSet[0]

    let foundNode: Node | null = null

    while (openSet.length > 0) {
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()!
      if (h(current, end) < h(closest, end)) closest = current

      if (current.x === end.x && current.y === end.y) {
        foundNode = current
        break
      }
      closedSet.add(key(current))

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ]

      for (const n of neighbors) {
        if (n.x < 0 || n.x >= 40 || n.y < 0 || n.y >= 30) continue
        // Permite o destino mesmo que o centro da cadeira toque a borda da mesa
        if (this.grid[n.y][n.x] === 1 && !(n.x === end.x && n.y === end.y)) continue
        if (closedSet.has(key(n))) continue

        const g = current.g + 1
        const existing = openSet.find((item) => item.x === n.x && item.y === n.y)
        if (!existing) {
          openSet.push({ ...n, g, f: g + h(n, end), parent: current })
        } else if (g < existing.g) {
          existing.g = g
          existing.f = g + h(n, end);
          existing.parent = current
        }
      }
    }

    const rawPath: Array<{ x: number; y: number }> = []
    let curr: Node | null = foundNode || closest
    while (curr) {
      rawPath.unshift({ x: curr.x, y: curr.y })
      curr = curr.parent
    }

    if (rawPath.length === 0) {
      return [{ x: targetWorldX, y: targetWorldY }]
    }

    // Suaviza a rota pulando waypoints intermediários desnecessários em linha reta
    const smoothed = this.smoothPath(rawPath)

    // Converte os pontos para coordenadas de mundo em pixels
    const worldWaypoints = smoothed.map((p) => ({
      x: p.x * 32 + 16,
      y: p.y * 32 + 16,
    }))

    // Adiciona o ponto exato da cadeira no final
    worldWaypoints.push({ x: targetWorldX, y: targetWorldY })

    return worldWaypoints
  }

  private static hasLineOfSight(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): boolean {
    const x0 = p1.x
    const y0 = p1.y
    const x1 = p2.x
    const y1 = p2.y
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let x = x0
    let y = y0

    while (true) {
      if (this.grid[y]?.[x] === 1 && !(x === x1 && y === y1)) return false
      // Evita cortar quinas de paredes na diagonal
      if (x !== x1 || y !== y1) {
        if (
          sx > 0 &&
          x + 1 < 40 &&
          this.grid[y][x + 1] === 1 &&
          sy > 0 &&
          y + 1 < 30 &&
          this.grid[y + 1][x] === 1
        )
          return false
        if (
          sx < 0 &&
          x - 1 >= 0 &&
          this.grid[y][x - 1] === 1 &&
          sy > 0 &&
          y + 1 < 30 &&
          this.grid[y + 1][x] === 1
        )
          return false
        if (
          sx > 0 &&
          x + 1 < 40 &&
          this.grid[y][x + 1] === 1 &&
          sy < 0 &&
          y - 1 >= 0 &&
          this.grid[y - 1][x] === 1
        )
          return false
        if (
          sx < 0 &&
          x - 1 >= 0 &&
          this.grid[y][x - 1] === 1 &&
          sy < 0 &&
          y - 1 >= 0 &&
          this.grid[y - 1][x] === 1
        )
          return false
      }
      if (x === x1 && y === y1) break
      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x += sx
      }
      if (e2 < dx) {
        err += dx
        y += sy
      }
    }
    return true
  }

  private static smoothPath(
    path: Array<{ x: number; y: number }>
  ): Array<{ x: number; y: number }> {
    if (path.length <= 2) return path
    const smoothed = [path[0]]
    let currIdx = 0
    while (currIdx < path.length - 1) {
      let furthest = currIdx + 1
      for (let i = path.length - 1; i > currIdx + 1; i--) {
        if (this.hasLineOfSight(path[currIdx], path[i])) {
          furthest = i
          break
        }
      }
      smoothed.push(path[furthest])
      currIdx = furthest
    }
    return smoothed
  }
}
