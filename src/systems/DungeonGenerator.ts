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
    
    // Carve out rooms
    rooms.forEach(room => this.carveRoom(tiles, room))
    
    // Connect rooms with corridors
    this.connectRooms(tiles, rooms)
    
    // Add doors
    this.addDoors(tiles, rooms)
    
    return {
      width: dungeonWidth,
      height: dungeonHeight,
      rooms,
      tiles,
      playerStart: { x: rooms[0].centerX, y: rooms[0].centerY }
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

  private getRoomType(roomIndex: number, totalRooms: number, floor: number): Room['type'] {
    if (roomIndex === 0) return 'combat' // Start room
    if (roomIndex === totalRooms - 1) return 'boss' // Final room
    
    const rand = Math.random()
    if (rand < 0.5) return 'combat'
    if (rand < 0.7) return 'treasure'
    if (rand < 0.85) return 'puzzle'
    return 'shop'
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