import { GAME_CONFIG } from '@/config/GameConfig'

export interface Room {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
  type: 'combat' | 'treasure' | 'puzzle' | 'shop' | 'boss'
}

export interface Dungeon {
  width: number
  height: number
  rooms: Room[]
  tiles: number[][]
  playerStart: { x: number, y: number }
  bossRoom: Room | null
  stairwellPosition: { x: number, y: number } | null
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

    // Connect rooms with corridors
    this.connectRooms(tiles, rooms)

    // Add doors
    this.addDoors(tiles, rooms)

    // Determine stairwell position (in boss room)
    const stairwellPosition = bossRoom ? { x: bossRoom.centerX, y: bossRoom.centerY } : null

    return {
      width: dungeonWidth,
      height: dungeonHeight,
      rooms,
      tiles,
      playerStart: { x: rooms[0].centerX, y: rooms[0].centerY },
      bossRoom,
      stairwellPosition
    }
  }

  private createEmptyDungeon(width: number, height: number): number[][] {
    return Array(height).fill(null).map(() => Array(width).fill(this.TILE_WALL))
  }

  private generateRooms(dungeonWidth: number, dungeonHeight: number, numRooms: number, floor: number): Room[] {
    const rooms: Room[] = []
    const { MIN_ROOM_SIZE, MAX_ROOM_SIZE } = GAME_CONFIG.ROOM_CONFIG
    const maxAttempts = 100

    for (let i = 0; i < numRooms; i++) {
      let attempts = 0
      let room: Room | null = null

      while (attempts < maxAttempts && !room) {
        const width = MIN_ROOM_SIZE + Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE))
        const height = MIN_ROOM_SIZE + Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE))
        const x = 1 + Math.floor(Math.random() * (dungeonWidth - width - 1))
        const y = 1 + Math.floor(Math.random() * (dungeonHeight - height - 1))

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
    if (roomIndex === 0) return 'combat' // Start room
    // Boss room will be assigned later via distance-based algorithm

    const rand = Math.random()
    if (rand < 0.5) return 'combat'
    if (rand < 0.7) return 'treasure'
    if (rand < 0.85) return 'puzzle'
    return 'shop'
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

    // Sort by: 1) Non-combat rooms first (to preserve combat rooms), 2) Distance (farthest first)
    roomDistances.sort((a, b) => {
      // Prioritize non-combat rooms for boss conversion
      const aIsCombat = a.room.type === 'combat' ? 1 : 0
      const bIsCombat = b.room.type === 'combat' ? 1 : 0
      if (aIsCombat !== bIsCombat) return aIsCombat - bIsCombat

      // Then sort by distance (farthest first)
      return b.distance - a.distance
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

  private connectRooms(tiles: number[][], rooms: Room[]): void {
    for (let i = 1; i < rooms.length; i++) {
      const roomA = rooms[i - 1]
      const roomB = rooms[i]
      
      this.carveCorridor(tiles, roomA.centerX, roomA.centerY, roomB.centerX, roomB.centerY)
    }
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
}