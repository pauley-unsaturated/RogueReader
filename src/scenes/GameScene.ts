import Phaser from 'phaser'
import { Player } from '@/entities/Player'
import { DungeonGenerator, Dungeon } from '@/systems/DungeonGenerator'
import { AssetLoader } from '@/systems/AssetLoader'
import { GAME_CONFIG } from '@/config/GameConfig'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private dungeon!: Dungeon
  private dungeonGenerator!: DungeonGenerator
  private assetLoader!: AssetLoader
  private currentFloor: number = 1
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private tiles: Phaser.GameObjects.Rectangle[][] = []

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.assetLoader = new AssetLoader(this)
    this.assetLoader.loadCharacterSprites()
    this.assetLoader.loadEnvironmentSprites()
  }

  create() {
    this.assetLoader.createAnimations()
    this.dungeonGenerator = new DungeonGenerator()
    this.cursors = this.input.keyboard!.createCursorKeys()

    this.generateDungeon()
    this.createPlayer()
    this.setupCamera()
    this.setupInput()

    // Display floor info
    this.displayFloorInfo()
  }

  private generateDungeon(): void {
    // Clear existing tiles
    this.tiles.forEach(row => row.forEach(tile => tile.destroy()))
    this.tiles = []
    
    this.dungeon = this.dungeonGenerator.generate(this.currentFloor)
    
    // Create visual tiles
    for (let y = 0; y < this.dungeon.height; y++) {
      this.tiles[y] = []
      for (let x = 0; x < this.dungeon.width; x++) {
        const tileType = this.dungeon.tiles[y][x]
        let color: number
        
        switch (tileType) {
          case 0: // Floor
            color = GAME_CONFIG.COLORS.FLOOR
            break
          case 1: // Wall
            color = GAME_CONFIG.COLORS.WALL
            break
          case 2: // Door
            color = GAME_CONFIG.COLORS.DOOR
            break
          default:
            color = GAME_CONFIG.COLORS.WALL
        }
        
        const pixelX = x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
        const pixelY = y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
        
        const tile = this.add.rectangle(pixelX, pixelY, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE, color)
        tile.setStrokeStyle(1, 0x34495e, 0.3)
        
        this.tiles[y][x] = tile
      }
    }
    
    // Add room type indicators
    this.dungeon.rooms.forEach((room, index) => {
      const pixelX = room.centerX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
      const pixelY = room.centerY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
      
      let roomColor: number
      switch (room.type) {
        case 'combat': roomColor = 0xe74c3c; break
        case 'treasure': roomColor = 0xf1c40f; break
        case 'puzzle': roomColor = 0x9b59b6; break
        case 'shop': roomColor = 0x2ecc71; break
        case 'boss': roomColor = 0x8e44ad; break
      }
      
      // Room marker
      this.add.circle(pixelX, pixelY, 8, roomColor, 0.7)
      
      // Room label
      this.add.text(pixelX, pixelY - 20, room.type.toUpperCase(), {
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5)
    })
  }

  private createPlayer(): void {
    const startPos = this.dungeon.playerStart
    console.log(`Player starting at: (${startPos.x}, ${startPos.y})`)
    console.log(`Dungeon size: ${this.dungeon.width} x ${this.dungeon.height}`)

    // Check the tiles around the starting position
    for (let dy = -2; dy <= 2; dy++) {
      let row = ''
      for (let dx = -2; dx <= 2; dx++) {
        const x = startPos.x + dx
        const y = startPos.y + dy
        if (y >= 0 && y < this.dungeon.height && x >= 0 && x < this.dungeon.width) {
          const tile = this.dungeon.tiles[y][x]
          row += tile === 0 ? '.' : tile === 1 ? '#' : tile === 2 ? 'D' : '?'
        } else {
          row += ' '
        }
      }
      console.log(`Row ${startPos.y + dy}: ${row}`)
    }

    this.player = new Player(this, startPos.x, startPos.y)
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setZoom(1.5)
    
    // Set world bounds
    this.cameras.main.setBounds(
      0, 0,
      this.dungeon.width * GAME_CONFIG.TILE_SIZE,
      this.dungeon.height * GAME_CONFIG.TILE_SIZE
    )
  }

  private setupInput(): void {
    console.log('Setting up input handlers...')

    // Test if keyboard input is working at all
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      console.log(`Key pressed: ${event.code}`)
    })

    // Movement input with explicit logging
    this.input.keyboard!.on('keydown-UP', () => {
      console.log('UP arrow pressed!')
      this.movePlayer(0, -1)
    })
    this.input.keyboard!.on('keydown-DOWN', () => {
      console.log('DOWN arrow pressed!')
      this.movePlayer(0, 1)
    })
    this.input.keyboard!.on('keydown-LEFT', () => {
      console.log('LEFT arrow pressed!')
      this.movePlayer(-1, 0)
    })
    this.input.keyboard!.on('keydown-RIGHT', () => {
      console.log('RIGHT arrow pressed!')
      this.movePlayer(1, 0)
    })

    // Interaction
    this.input.keyboard!.on('keydown-SPACE', () => {
      console.log('SPACE pressed!')
      this.interact()
    })

    // Debug: Next floor
    this.input.keyboard!.on('keydown-N', () => {
      console.log('N pressed!')
      this.nextFloor()
    })

    console.log('Input handlers set up complete.')
  }

  private movePlayer(deltaX: number, deltaY: number): void {
    const newX = this.player.gridX + deltaX
    const newY = this.player.gridY + deltaY

    console.log(`Trying to move from (${this.player.gridX}, ${this.player.gridY}) to (${newX}, ${newY})`)

    const canMove = this.canMoveTo(newX, newY)
    console.log(`Can move to (${newX}, ${newY}): ${canMove}`)

    if (canMove) {
      this.player.moveToGrid(newX, newY, (x, y) => this.canMoveTo(x, y))
    } else {
      const tileType = this.dungeon.tiles[newY] ? this.dungeon.tiles[newY][newX] : 'out of bounds'
      console.log(`Movement blocked - tile type at (${newX}, ${newY}): ${tileType}`)
    }
  }

  private canMoveTo(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || x >= this.dungeon.width || y < 0 || y >= this.dungeon.height) {
      return false
    }
    
    // Check for walls
    const tileType = this.dungeon.tiles[y][x]
    return tileType === 0 || tileType === 2 // Floor or door
  }

  private interact(): void {
    const playerX = this.player.gridX
    const playerY = this.player.gridY
    
    // Check if player is in a room
    const currentRoom = this.dungeon.rooms.find(room =>
      playerX >= room.x && playerX < room.x + room.width &&
      playerY >= room.y && playerY < room.y + room.height
    )
    
    if (currentRoom) {
      this.scene.get('UIScene').events.emit('room-entered', currentRoom)
    }
  }

  private nextFloor(): void {
    this.currentFloor++
    this.generateDungeon()
    
    // Move player to new start position
    const startPos = this.dungeon.playerStart
    this.player.gridX = startPos.x
    this.player.gridY = startPos.y
    this.player.x = startPos.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
    this.player.y = startPos.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
    
    this.displayFloorInfo()
  }

  private displayFloorInfo(): void {
    const roomCount = this.dungeon.rooms.length
    console.log(`Floor ${this.currentFloor}: ${roomCount} rooms generated`)
    
    // Show floor info on screen
    const existingFloorText = this.children.getByName('floorText')
    if (existingFloorText) {
      existingFloorText.destroy()
    }
    
    this.add.text(16, 16, `Floor ${this.currentFloor} • Rooms: ${roomCount}`, {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setName('floorText')
  }
}