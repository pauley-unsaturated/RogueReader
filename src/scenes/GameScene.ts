import Phaser from 'phaser'
import { Player } from '@/entities/Player'
import { DungeonGenerator, Dungeon } from '@/systems/DungeonGenerator'
import { AssetLoader } from '@/systems/AssetLoader'
import { GAME_CONFIG } from '@/config/GameConfig'
import { CombatSystem } from '@/systems/CombatSystem'
import { CombatUI } from '@/components/CombatUI'
import { Enemy, EnemyConfig } from '@/entities/Enemy'
import { WordManager } from '@/systems/WordManager'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private dungeon!: Dungeon
  private dungeonGenerator!: DungeonGenerator
  private assetLoader!: AssetLoader
  private currentFloor: number = 1
  private tiles: Phaser.GameObjects.Rectangle[][] = []
  private combatSystem!: CombatSystem
  private combatUI!: CombatUI
  private enemies: Enemy[] = []
  private wordManager!: WordManager
  private currentWord: string | null = null
  private isInCombat: boolean = false
  private isGameOver: boolean = false

  constructor() {
    super({ key: 'GameScene' })
  }

  preload() {
    this.assetLoader = new AssetLoader(this)
    this.assetLoader.loadCharacterSprites()
    this.assetLoader.loadEnvironmentSprites()
  }

  create() {
    // Reset game state
    this.isGameOver = false
    this.isInCombat = false
    this.currentWord = null
    this.currentFloor = this.currentFloor || 1
    this.enemies = []
    this.tiles = []

    this.assetLoader.createAnimations()
    this.dungeonGenerator = new DungeonGenerator()

    // Initialize systems
    this.wordManager = new WordManager()
    this.combatSystem = new CombatSystem()

    // Setup combat event listeners
    this.setupCombatListeners()

    this.generateDungeon()
    this.createPlayer()
    this.setupCamera()
    this.setupInput()

    // Create combat UI
    this.combatUI = new CombatUI(this, 400, 100, this.combatSystem)
    this.combatUI.setScrollFactor(0)
    this.combatUI.setDepth(100)

    // Spawn enemies in combat rooms
    this.spawnEnemies()

    // Display floor info
    this.displayFloorInfo()

    // Check if we should show in-game tutorial on first play
    const hasPlayedBefore = localStorage.getItem('roguereader_has_played') === 'true'
    if (!hasPlayedBefore) {
      // Show help text
      this.showFirstTimeHelp()
      localStorage.setItem('roguereader_has_played', 'true')
    }
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
    this.dungeon.rooms.forEach((room) => {
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
    if (this.isGameOver) return  // Don't allow movement if game is over

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

  private setupCombatListeners(): void {
    // Listen for combat events
    this.combatSystem.on('combatStarted', () => {
      this.isInCombat = true
      this.showCombatPrompt()
    })

    this.combatSystem.on('combatEnded', (data: any) => {
      this.isInCombat = false
      this.hideCombatPrompt()
      if (data.maxCombo > 0) {
        this.showReward(data.bonusReward, 'Combo Bonus!')
      }
    })

    this.combatSystem.on('enemyDefeated', (data: any) => {
      this.showReward(data.rewards.goldWords, 'Gold Words')
      // Remove enemy from array
      this.enemies = this.enemies.filter(e => e.getCombatEntity().id !== data.enemyId)
    })

    // Listen for damage being dealt
    this.combatSystem.on('damageDealt', (data: any) => {
      // Find the enemy and apply damage
      const enemy = this.enemies.find(e => e.getCombatEntity().id === data.targetId)
      if (enemy) {
        enemy.takeDamage(data.damage)
      }
    })

    this.combatSystem.on('playerDefeated', () => {
      this.gameOver()
    })

    // Listen for enemy attacks
    this.events.on('enemyAttack', (data: any) => {
      this.combatSystem.takeDamage(data.damage)
    })

    // Listen for enemy deaths
    this.events.on('enemyDied', (data: any) => {
      this.combatSystem.removeEnemy(data.id)
    })
  }

  private spawnEnemies(): void {
    // Clear existing enemies
    this.enemies.forEach(enemy => enemy.destroy())
    this.enemies = []

    // Spawn enemies in combat rooms
    this.dungeon.rooms.forEach((room, index) => {
      if (room.type === 'combat') {
        // Spawn 1-3 enemies per combat room
        const enemyCount = Phaser.Math.Between(1, 3)

        for (let i = 0; i < enemyCount; i++) {
          const enemyX = room.x + Phaser.Math.Between(2, room.width - 2)
          const enemyY = room.y + Phaser.Math.Between(2, room.height - 2)

          // Make sure it's on a floor tile
          if (this.dungeon.tiles[enemyY][enemyX] === 0) {
            const enemyType = this.getRandomEnemyType()
            const config: EnemyConfig = {
              id: `enemy_${index}_${i}`,
              name: `${enemyType} ${i + 1}`,
              type: enemyType as any,
              level: Math.min(this.currentFloor, 5),
              gridPosition: { x: enemyX, y: enemyY }
            }

            const enemy = new Enemy(this, config)
            this.enemies.push(enemy)
          }
        }
      } else if (room.type === 'boss') {
        // Spawn boss enemy
        const bossX = room.centerX
        const bossY = room.centerY

        const config: EnemyConfig = {
          id: `boss_${index}`,
          name: 'Boss',
          type: 'demon',
          level: this.currentFloor + 2,
          gridPosition: { x: bossX, y: bossY },
          health: 150,
          damage: 20
        }

        const enemy = new Enemy(this, config)
        this.enemies.push(enemy)
      }
    })

    // Don't register enemies yet - we'll do it when combat starts
  }

  private getRandomEnemyType(): string {
    const types = ['goblin', 'skeleton', 'bat', 'slime', 'orc']
    return types[Math.floor(Math.random() * types.length)]
  }

  private showCombatPrompt(): void {
    // Get a word appropriate for the player's level
    const wordData = this.wordManager.selectWordForLevel(this.currentFloor)
    if (wordData) {
      this.currentWord = wordData.word
      this.combatUI.showCastingWord(this.currentWord)

      // For now, simulate spell casting after a delay
      // Later this will be triggered by speech recognition
      this.time.delayedCall(2000, () => {
        if (this.currentWord) {
          this.castSpell(this.currentWord)
        }
      })
    }
  }

  private hideCombatPrompt(): void {
    this.currentWord = null
    this.combatUI.hideCastingWord()
  }

  private castSpell(word: string): void {
    if (!this.isInCombat) return

    // Cast the spell
    this.combatSystem.castSpell(word)

    // Show complexity bonus
    const complexity = this.combatSystem['calculateWordComplexity'](word)
    this.combatUI.showWordComplexity(word, complexity)

    // Record word attempt for spaced repetition
    this.wordManager.recordWordAttempt(word, this.currentFloor, true, 1000) // Simulating 1 second read time

    // Get next word if still in combat
    if (this.isInCombat) {
      this.showCombatPrompt()
    }
  }

  private showReward(amount: number, type: string): void {
    const rewardText = this.add.text(
      this.player.x,
      this.player.y - 50,
      `+${amount} ${type}`,
      {
        fontSize: '20px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3
      }
    )
    rewardText.setOrigin(0.5)

    this.tweens.add({
      targets: rewardText,
      y: rewardText.y - 30,
      alpha: 0,
      duration: 1500,
      ease: 'Power2.out',
      onComplete: () => rewardText.destroy()
    })
  }

  private gameOver(): void {
    // Don't pause the scene - just stop game logic
    this.isGameOver = true
    this.isInCombat = false

    // Stop all enemy actions
    this.enemies.forEach(enemy => enemy.stopCombat())

    const gameOverText = this.add.text(400, 300, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4
    })
    gameOverText.setOrigin(0.5)
    gameOverText.setScrollFactor(0)
    gameOverText.setDepth(200)

    const restartText = this.add.text(400, 350, 'Press R to restart • Click to restart', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    })
    restartText.setOrigin(0.5)
    restartText.setScrollFactor(0)
    restartText.setDepth(200)

    // Also handle lowercase 'r'
    const handleRestart = () => {
      // Clean up combat system
      this.combatSystem.removeAllListeners()

      // Clean up enemies
      this.enemies.forEach(enemy => enemy.destroy())
      this.enemies = []

      // Reset all game state
      this.currentFloor = 1
      this.isGameOver = false
      this.isInCombat = false
      this.currentWord = null

      // Restart the scene completely
      this.scene.restart()
    }

    this.input.keyboard!.once('keydown-R', handleRestart)
    this.input.keyboard!.once('keydown-r', handleRestart)

    // Also add click/tap to restart for mobile
    restartText.setInteractive({ useHandCursor: true })
    restartText.once('pointerdown', handleRestart)

    // Add pulsing animation to restart text
    this.tweens.add({
      targets: restartText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private showFirstTimeHelp(): void {
    const helpText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100,
      'Use ARROW KEYS to move • Approach enemies to start combat',
      {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 8 }
      }
    )
    helpText.setOrigin(0.5)
    helpText.setScrollFactor(0)
    helpText.setDepth(90)

    // Fade out after 8 seconds
    this.time.delayedCall(8000, () => {
      this.tweens.add({
        targets: helpText,
        alpha: 0,
        duration: 1000,
        onComplete: () => helpText.destroy()
      })
    })
  }

  update(_time: number, _delta: number): void {
    // Don't update if game is over
    if (this.isGameOver) return

    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(this.player.getGridPosition())
    })

    // Update combat system with player position
    this.combatSystem.updatePlayerPosition(this.player.gridX, this.player.gridY)

    // Check for combat proximity
    const nearbyEnemies = this.enemies.filter(enemy => {
      const pos = enemy.getGridPosition()
      const distance = Math.abs(pos.x - this.player.gridX) + Math.abs(pos.y - this.player.gridY)
      return distance <= 5 && enemy.isAliveStatus()
    })

    if (nearbyEnemies.length > 0 && !this.isInCombat) {
      // Register nearby enemies with combat system
      nearbyEnemies.forEach(enemy => {
        this.combatSystem.addEnemy(enemy.getCombatEntity())
        enemy.startCombat(this.player.getGridPosition())
      })
    }
  }
}