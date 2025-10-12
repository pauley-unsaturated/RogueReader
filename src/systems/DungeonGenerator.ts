import { GAME_CONFIG } from '@/config/GameConfig'

export interface Room {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  type: 'entrance' | 'combat' | 'treasure' | 'puzzle' | 'shop' | 'boss'
}

export interface DoorData {
  id: string
  gridX: number
  gridY: number
  orientation: 'horizontal' | 'vertical'
  roomIndex: number // Which room this door belongs to (only combat/boss rooms have doors)
}

export interface Dungeon {
  width: number
  height: number
  rooms: Room[]
  tiles: number[][]
  playerStart: { x: number, y: number }
  bossRoom: Room | null
  stairwellPosition: { x: number, y: number } | null
  doors: DoorData[]
}

export class DungeonGenerator {
  private readonly TILE_WALL = 1
  private readonly TILE_FLOOR = 0
  private readonly TILE_DOOR = 2

  generate(floor: number): Dungeon {
    const { ROOM_CONFIG } = GAME_CONFIG

    // Calculate room count with improved scaling
    const numRooms = Math.min(
      ROOM_CONFIG.BASE_ROOMS + Math.floor(floor * ROOM_CONFIG.ROOMS_PER_FLOOR),
      ROOM_CONFIG.MAX_ROOMS
    )

    const dungeonWidth = 30 + Math.floor(floor * 2)
    const dungeonHeight = 24 + Math.floor(floor * 1.5)

    // Regenerate dungeon until all rooms are reachable (max 10 attempts)
    const MAX_GENERATION_ATTEMPTS = 10
    let generationAttempt = 0
    let dungeon: Dungeon | null = null

    while (generationAttempt < MAX_GENERATION_ATTEMPTS && !dungeon) {
      generationAttempt++

      const tiles = this.createEmptyDungeon(dungeonWidth, dungeonHeight)
      const rooms = this.generateRooms(dungeonWidth, dungeonHeight, numRooms, floor)

      // Debug: Log room types before boss assignment
      console.log('🏠 Room types before boss assignment:', rooms.map((r, i) => `${i}:${r.type}`).join(', '))

      // Apply distance-based boss placement
      const bossRoom = this.assignBossRoom(rooms)

      // Debug: Log room types after boss assignment
      console.log('🏠 Room types after boss assignment:', rooms.map((r, i) => `${i}:${r.type}`).join(', '))

      // Carve out rooms
      rooms.forEach(room => this.carveRoom(tiles, room))

      // Connect rooms with corridors and generate door data
      const doors = this.connectRooms(tiles, rooms)

      // Add door tiles (visual markers in tile grid)
      this.addDoors(tiles, rooms)

      // Add 3-tile thick boundary walls (prevents edge visibility issues)
      this.addBoundaryWalls(tiles)

      // Validate that all rooms are reachable from entrance
      const reachableRooms = this.validateRoomReachability(tiles, rooms)

      if (reachableRooms.size === rooms.length) {
        // All rooms reachable! Success!
        console.log(`✅ Dungeon generation successful on attempt ${generationAttempt}: All ${rooms.length} rooms reachable`)

        // Determine stairwell position (in boss room)
        const stairwellPosition = bossRoom ? { x: bossRoom.centerX, y: bossRoom.centerY } : null

        dungeon = {
          width: dungeonWidth,
          height: dungeonHeight,
          rooms,
          tiles,
          playerStart: { x: rooms[0].centerX, y: rooms[0].centerY },
          bossRoom,
          stairwellPosition,
          doors
        }
      } else {
        console.warn(`⚠️ Attempt ${generationAttempt}: Only ${reachableRooms.size}/${rooms.length} rooms reachable - regenerating...`)
      }
    }

    // If we exhausted attempts, use the last generated dungeon anyway (safety fallback)
    if (!dungeon) {
      console.error('❌ Failed to generate fully connected dungeon after 10 attempts - using last attempt')
      const tiles = this.createEmptyDungeon(dungeonWidth, dungeonHeight)
      const rooms = this.generateRooms(dungeonWidth, dungeonHeight, numRooms, floor)
      const bossRoom = this.assignBossRoom(rooms)
      rooms.forEach(room => this.carveRoom(tiles, room))
      const doors = this.connectRooms(tiles, rooms)
      this.addDoors(tiles, rooms)
      this.addBoundaryWalls(tiles)
      const stairwellPosition = bossRoom ? { x: bossRoom.centerX, y: bossRoom.centerY } : null

      dungeon = {
        width: dungeonWidth,
        height: dungeonHeight,
        rooms,
        tiles,
        playerStart: { x: rooms[0].centerX, y: rooms[0].centerY },
        bossRoom,
        stairwellPosition,
        doors
      }
    }

    return dungeon
  }

  private createEmptyDungeon(width: number, height: number): number[][] {
    return Array(height).fill(null).map(() => Array(width).fill(this.TILE_WALL))
  }

  private generateRooms(dungeonWidth: number, dungeonHeight: number, numRooms: number, floor: number): Room[] {
    const rooms: Room[] = []
    const { MIN_ROOM_SIZE, MAX_ROOM_SIZE } = GAME_CONFIG.ROOM_CONFIG
    const maxAttempts = 100
    const BOUNDARY_THICKNESS = 3 // Keep rooms away from boundary walls

    for (let i = 0; i < numRooms; i++) {
      let attempts = 0
      let room: Room | null = null

      while (attempts < maxAttempts && !room) {
        const width = MIN_ROOM_SIZE + Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE))
        const height = MIN_ROOM_SIZE + Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE))
        // Ensure rooms stay within safe zone (away from 3-tile boundary)
        const x = BOUNDARY_THICKNESS + Math.floor(Math.random() * (dungeonWidth - width - BOUNDARY_THICKNESS * 2))
        const y = BOUNDARY_THICKNESS + Math.floor(Math.random() * (dungeonHeight - height - BOUNDARY_THICKNESS * 2))

        const newRoom: Room = {
          x, y, width, height,
          centerX: x + Math.floor(width / 2),
          centerY: y + Math.floor(height / 2),
          type: this.getRoomType(i, numRooms, floor)
        }

        if (!this.roomOverlaps(newRoom, rooms)) {
          room = newRoom
        }
        attempts++
      }

      if (room) {
        rooms.push(room)
      }
    }

    return rooms
  }

  private getRoomType(roomIndex: number, _totalRooms: number, _floor: number): Room['type'] {
    // First room is always safe entrance (no enemies, no doors)
    if (roomIndex === 0) return 'entrance'

    // Boss room will be assigned later via distance-based algorithm

    // Item #21: Adjusted room distribution for more combat focus
    // 80% combat, 10% treasure, 10% shop (was 50/20/15/15)
    const rand = Math.random()
    if (rand < 0.80) return 'combat'  // 80% combat rooms
    if (rand < 0.90) return 'treasure' // 10% treasure rooms
    return 'shop'                       // 10% shop rooms
  }

  /**
   * Assigns boss room using distance-based probability decay algorithm.
   * Guaranteed to place exactly one boss on every level.
   * @returns The room that was assigned as the boss room
   */
  private assignBossRoom(rooms: Room[]): Room | null {
    if (rooms.length < 2) {
      console.warn('Not enough rooms to place boss away from player')
      if (rooms.length === 1) {
        rooms[0].type = 'boss' // Edge case: only one room
        return rooms[0]
      }
      return null
    }

    const playerRoom = rooms[0] // First room is always player start

    // Calculate Manhattan distance from player room to all other rooms
    const roomDistances = rooms.slice(1).map((room, index) => ({
      room,
      originalIndex: index + 1,
      distance: Math.abs(room.centerX - playerRoom.centerX) + Math.abs(room.centerY - playerRoom.centerY)
    }))

    // Sort by distance (farthest first) - distance is the PRIMARY concern
    // Then by room type (prefer non-combat to preserve combat encounters)
    roomDistances.sort((a, b) => {
      // Primary sort: Distance (farthest first)
      const distanceDiff = b.distance - a.distance
      if (Math.abs(distanceDiff) > 1) { // If distance differs significantly, use that
        return distanceDiff
      }

      // Secondary sort (for rooms at similar distance): Prefer non-combat for boss conversion
      const aIsCombat = a.room.type === 'combat' ? 1 : 0
      const bIsCombat = b.room.type === 'combat' ? 1 : 0
      return aIsCombat - bIsCombat
    })

    // Apply 90% probability decay algorithm
    let bossPlaced = false
    const PLACEMENT_PROBABILITY = 0.9

    for (let i = 0; i < roomDistances.length - 1; i++) { // -1 to never place in closest room
      const currentProbability = Math.pow(PLACEMENT_PROBABILITY, i)

      if (Math.random() < currentProbability) {
        const oldType = roomDistances[i].room.type
        roomDistances[i].room.type = 'boss'
        bossPlaced = true
        console.log(`Boss placed in room ${roomDistances[i].originalIndex} (was: ${oldType}, distance: ${roomDistances[i].distance}, probability: ${(currentProbability * 100).toFixed(1)}%)`)
        return roomDistances[i].room
      }
    }

    // Guarantee: If no boss placed yet, force placement in second-farthest room
    if (!bossPlaced) {
      const secondFarthest = roomDistances[Math.min(1, roomDistances.length - 1)]
      const oldType = secondFarthest.room.type
      secondFarthest.room.type = 'boss'
      console.log(`Boss force-placed in second-farthest room ${secondFarthest.originalIndex} (was: ${oldType}, distance: ${secondFarthest.distance})`)
      return secondFarthest.room
    }

    return null // Should never reach here
  }

  private roomOverlaps(newRoom: Room, existingRooms: Room[]): boolean {
    const buffer = 2
    return existingRooms.some(room => 
      newRoom.x - buffer < room.x + room.width &&
      newRoom.x + newRoom.width + buffer > room.x &&
      newRoom.y - buffer < room.y + room.height &&
      newRoom.y + newRoom.height + buffer > room.y
    )
  }

  private carveRoom(tiles: number[][], room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
          tiles[y][x] = this.TILE_FLOOR
        }
      }
    }
  }

  private connectRooms(tiles: number[][], rooms: Room[]): DoorData[] {
    // First, carve corridors between rooms
    for (let i = 1; i < rooms.length; i++) {
      const roomA = rooms[i - 1]
      const roomB = rooms[i]
      this.carveCorridor(tiles, roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY)
    }

    // Now find all entrances to combat/boss rooms and place doors
    const doors: DoorData[] = []
    let doorIdCounter = 0

    rooms.forEach((room, roomIndex) => {
      // Only place doors for combat and boss rooms
      if (room.type !== 'combat' && room.type !== 'boss') {
        return
      }

      // Find all floor tiles on the perimeter of this room that connect to corridors
      const entrances = this.findRoomEntrances(tiles, room)

      entrances.forEach(entrance => {
        doors.push({
          id: `door_${roomIndex}_${doorIdCounter++}`,
          gridX: entrance.x,
          gridY: entrance.y,
          orientation: entrance.orientation,
          roomIndex: roomIndex
        })
      })
    })

    console.log(`🚪 Generated ${doors.length} doors for combat/boss rooms`)
    return doors
  }

  private findRoomEntrances(tiles: number[][], room: Room): Array<{ x: number, y: number, orientation: 'horizontal' | 'vertical' }> {
    const entrances: Array<{ x: number, y: number, orientation: 'horizontal' | 'vertical' }> = []

    // Check top edge
    for (let x = room.x; x < room.x + room.width; x++) {
      const y = room.y
      if (this.isEntrance(tiles, x, y, 0, -1)) {
        entrances.push({ x, y, orientation: 'horizontal' })
      }
    }

    // Check bottom edge
    for (let x = room.x; x < room.x + room.width; x++) {
      const y = room.y + room.height - 1
      if (this.isEntrance(tiles, x, y, 0, 1)) {
        entrances.push({ x, y, orientation: 'horizontal' })
      }
    }

    // Check left edge
    for (let y = room.y; y < room.y + room.height; y++) {
      const x = room.x
      if (this.isEntrance(tiles, x, y, -1, 0)) {
        entrances.push({ x, y, orientation: 'vertical' })
      }
    }

    // Check right edge
    for (let y = room.y; y < room.y + room.height; y++) {
      const x = room.x + room.width - 1
      if (this.isEntrance(tiles, x, y, 1, 0)) {
        entrances.push({ x, y, orientation: 'vertical' })
      }
    }

    return entrances
  }

  private isEntrance(tiles: number[][], x: number, y: number, dx: number, dy: number): boolean {
    // Check if this tile is floor and the adjacent tile (outside room) is also floor (corridor)
    if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[0].length) {
      return false
    }

    const currentTile = tiles[y][x]
    if (currentTile !== this.TILE_FLOOR) {
      return false
    }

    const adjY = y + dy
    const adjX = x + dx

    if (adjY < 0 || adjY >= tiles.length || adjX < 0 || adjX >= tiles[0].length) {
      return false
    }

    const adjacentTile = tiles[adjY][adjX]
    return adjacentTile === this.TILE_FLOOR
  }

  private carveCorridor(tiles: number[][], x1: number, y1: number, x2: number, y2: number): void {
    // L-shaped corridor
    let currentX = x1
    let currentY = y1

    // Horizontal first
    while (currentX !== x2) {
      if (currentY >= 0 && currentY < tiles.length && currentX >= 0 && currentX < tiles[0].length) {
        tiles[currentY][currentX] = this.TILE_FLOOR
      }
      currentX += currentX < x2 ? 1 : -1
    }

    // Then vertical
    while (currentY !== y2) {
      if (currentY >= 0 && currentY < tiles.length && currentX >= 0 && currentX < tiles[0].length) {
        tiles[currentY][currentX] = this.TILE_FLOOR
      }
      currentY += currentY < y2 ? 1 : -1
    }
  }

  private addDoors(tiles: number[][], rooms: Room[]): void {
    rooms.forEach(room => {
      // Add door at random position on room perimeter
      const side = Math.floor(Math.random() * 4)
      let doorX: number, doorY: number

      switch (side) {
        case 0: // Top
          doorX = room.x + Math.floor(room.width / 2)
          doorY = room.y
          break
        case 1: // Right
          doorX = room.x + room.width - 1
          doorY = room.y + Math.floor(room.height / 2)
          break
        case 2: // Bottom
          doorX = room.x + Math.floor(room.width / 2)
          doorY = room.y + room.height - 1
          break
        default: // Left
          doorX = room.x
          doorY = room.y + Math.floor(room.height / 2)
          break
      }

      if (doorY >= 0 && doorY < tiles.length && doorX >= 0 && doorX < tiles[0].length) {
        tiles[doorY][doorX] = this.TILE_DOOR
      }
    })
  }

  /**
   * Adds 3-tile thick boundary walls around the entire map edge.
   * Prevents players from seeing the dungeon edge and ensures professional appearance.
   */
  private addBoundaryWalls(tiles: number[][]): void {
    const height = tiles.length
    const width = tiles[0].length
    const BOUNDARY_THICKNESS = 3

    // Fill top 3 rows
    for (let y = 0; y < BOUNDARY_THICKNESS && y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles[y][x] = this.TILE_WALL
      }
    }

    // Fill bottom 3 rows
    for (let y = Math.max(0, height - BOUNDARY_THICKNESS); y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles[y][x] = this.TILE_WALL
      }
    }

    // Fill left 3 columns
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < BOUNDARY_THICKNESS && x < width; x++) {
        tiles[y][x] = this.TILE_WALL
      }
    }

    // Fill right 3 columns
    for (let y = 0; y < height; y++) {
      for (let x = Math.max(0, width - BOUNDARY_THICKNESS); x < width; x++) {
        tiles[y][x] = this.TILE_WALL
      }
    }
  }

  /**
   * Validates that all rooms are reachable from entrance using BFS flood-fill
   * @returns Set of room indices that are reachable from entrance (room 0)
   */
  private validateRoomReachability(tiles: number[][], rooms: Room[]): Set<number> {
    if (rooms.length === 0) return new Set()

    const entrance = rooms[0]
    const reachableRooms = new Set<number>()
    const visited = new Set<string>()
    const queue: Array<{x: number, y: number}> = []

    // Start BFS from entrance room center
    const startKey = `${entrance.centerX},${entrance.centerY}`
    queue.push({ x: entrance.centerX, y: entrance.centerY })
    visited.add(startKey)

    // BFS through all walkable tiles
    while (queue.length > 0) {
      const current = queue.shift()!
      const { x, y } = current

      // Check which room this position belongs to
      rooms.forEach((room, index) => {
        if (x >= room.x && x < room.x + room.width &&
            y >= room.y && y < room.y + room.height) {
          reachableRooms.add(index)
        }
      })

      // Explore neighbors (4-directional)
      const neighbors = [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
      ]

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`

        // Skip if already visited
        if (visited.has(key)) continue

        // Skip if out of bounds
        if (neighbor.y < 0 || neighbor.y >= tiles.length ||
            neighbor.x < 0 || neighbor.x >= tiles[0].length) {
          continue
        }

        // Skip if wall (only walk on floor or door tiles)
        const tile = tiles[neighbor.y][neighbor.x]
        if (tile !== this.TILE_FLOOR && tile !== this.TILE_DOOR) {
          continue
        }

        visited.add(key)
        queue.push(neighbor)
      }
    }

    return reachableRooms
  }
}