import Phaser from 'phaser'
import { Player } from '@/entities/Player'
import { DungeonGenerator, Dungeon } from '@/systems/DungeonGenerator'
import { AssetLoader } from '@/systems/AssetLoader'
import { GAME_CONFIG } from '@/config/GameConfig'
import { CombatSystem } from '@/systems/CombatSystem'
import { CombatUI } from '@/components/CombatUI'
import { CastingDialog } from '@/components/CastingDialog'
import { Enemy, EnemyConfig } from '@/entities/Enemy'
import { WordManager } from '@/systems/WordManager'
import { SpeechRecognitionResult } from '@/services/SpeechRecognitionService'
import { PronunciationHelpService } from '@/services/PronunciationHelpService'
import { StreamingSpeechService } from '@/services/StreamingSpeechService'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private dungeon!: Dungeon
  private dungeonGenerator!: DungeonGenerator
  private assetLoader!: AssetLoader
  private currentFloor: number = 1
  private tiles: Phaser.GameObjects.Rectangle[][] = []
  private combatSystem!: CombatSystem
  private combatUI!: CombatUI
  private castingDialog: CastingDialog | null = null
  private enemies: Enemy[] = []
  private wordManager!: WordManager
  private currentWord: string | null = null
  private comboWords: string[] = []
  private pendingComboResults: SpeechRecognitionResult[] = []
  private isInCombat: boolean = false
  private isGameOver: boolean = false
  private streamingService: StreamingSpeechService | null = null
  private pronunciationHelp: PronunciationHelpService | null = null
  private isListeningForSpeech: boolean = false
  private isGamePaused: boolean = false

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

    // Initialize speech services
    try {
      this.streamingService = new StreamingSpeechService()
      this.pronunciationHelp = new PronunciationHelpService()
      console.log('Speech services initialized successfully')
    } catch (error) {
      console.error('Failed to initialize speech services:', error)
      // Game can still work without speech recognition
    }

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

    // Interaction and speech casting
    this.input.keyboard!.on('keydown-SPACE', () => {
      console.log('SPACE pressed!')

      // If dialog is open and recording, stop and process
      if (this.castingDialog && this.castingDialog.isRecordingActive()) {
        // Stop recording and process
        this.stopRecordingAndProcess()
      } else if (this.castingDialog && !this.castingDialog.isRecordingActive()) {
        // Dialog open but not recording - do nothing (processing or showing result)
        console.log('⏳ Still processing previous word...')
      } else if (this.isInCombat) {
        // Open dialog (will auto-start recording)
        this.showCastingDialog()
      } else {
        // Non-combat interaction
        this.interact()
      }
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
    // This is now handled by showCastingDialog when space is pressed
    this.combatUI.showSpeechPrompt()
  }

  private hideCombatPrompt(): void {
    this.combatUI.hideSpeechPrompt()
    this.combatUI.hideMicrophoneIndicator()
    this.combatUI.hidePronunciationHelp()
  }

  private castSpell(word: string, speechResult?: SpeechRecognitionResult): void {
    console.log('🪄 castSpell called!')
    console.log(`  - Word: "${word}"`)
    console.log(`  - Is in combat: ${this.isInCombat}`)
    console.log(`  - Speech result:`, speechResult)

    if (!this.isInCombat) {
      console.log('❌ Not in combat, spell cancelled')
      return
    }

    // Calculate speech-based modifiers
    let speechModifiers = undefined
    if (speechResult) {
      speechModifiers = {
        pronunciationScore: speechResult.pronunciation_score || 1.0,
        isCriticalHit: speechResult.isCriticalHit,
        spellingPenalty: speechResult.isTimeout ? 0.3 : 0
      }
      console.log('🎯 Speech modifiers:', speechModifiers)
    }

    // Cast the spell with speech results
    console.log('⚡ Calling combatSystem.castSpell...')
    const spell = this.combatSystem.castSpell(word, undefined, speechModifiers)
    console.log('✨ Spell cast result:', spell)

    // Show spell effects
    if (spell.isCriticalHit) {
      console.log('💥 Showing critical hit effect!')
      this.combatUI.showCriticalHit()
    }

    // Show complexity bonus
    const complexity = this.combatSystem['calculateWordComplexity'](word)
    this.combatUI.showWordComplexity(word, complexity)

    // Record word attempt for spaced repetition
    const readTime = speechResult?.isTimeout ? 5000 : 2000
    const success = !speechResult?.isError && !speechResult?.isTimeout
    this.wordManager.recordWordAttempt(word, this.currentFloor, success, readTime)

    // Get next word if still in combat
    if (this.isInCombat) {
      console.log('🔄 Still in combat, showing next prompt')
      this.showCombatPrompt()
    } else {
      console.log('✅ Combat ended')
    }
  }

  private showCastingDialog(): void {
    if (this.castingDialog || !this.isInCombat) return

    // Get initial word for the spell
    const wordData = this.wordManager.selectWordForLevel(this.currentFloor)
    if (!wordData) {
      console.error('No word available for casting')
      return
    }

    // Get a spell name from the current combat system
    const spellName = this.getRandomSpellName()

    // Reset combo tracking
    this.comboWords = []
    this.pendingComboResults = []
    this.currentWord = wordData.word

    // Create and show the casting dialog
    this.castingDialog = new CastingDialog(this, {
      spellName: spellName,
      duration: 10000, // 10 second timer (gives more time for API responses)
      onTimerEnd: (results) => this.handleComboComplete(results),
      onClose: () => {
        this.streamingService?.stopStreaming()
        this.castingDialog = null
        this.isListeningForSpeech = false
      }
    })

    this.castingDialog.show(wordData.word)

    // IMMEDIATELY start recording
    this.startRecordingForWord()
  }

  private getRandomSpellName(): string {
    const spellNames = ['Fireball', 'Ice Shard', 'Lightning Bolt', 'Magic Missile', 'Arcane Blast']
    return spellNames[Math.floor(Math.random() * spellNames.length)]
  }

  private startRecordingForWord(): void {
    if (!this.streamingService || !this.castingDialog || this.isListeningForSpeech) {
      return
    }

    const currentWord = this.castingDialog.getCurrentWord()
    if (!currentWord) return

    console.log('🎤 Starting recording for word:', currentWord)
    this.isListeningForSpeech = true
    this.currentWord = currentWord

    // Update UI to show recording
    this.castingDialog.startRecording()

    // Start streaming service
    this.streamingService.startStreaming({
      targetWord: currentWord,
      onPartialResult: (text: string) => {
        console.log(`📝 Partial: "${text}"`)
      },
      onFinalResult: () => {
        // Don't process yet - wait for spacebar to stop
      },
      maxDuration: 10000 // 10 seconds max
    })
  }

  private async stopRecordingAndProcess(): Promise<void> {
    if (!this.streamingService || !this.castingDialog || !this.isListeningForSpeech) {
      return
    }

    console.log('🔴 Stopping recording and processing...')
    this.castingDialog.stopRecording()

    // Stop streaming and get the accumulated audio
    this.streamingService.stopStreaming()

    // Now send the complete audio for transcription
    await this.processRecordedAudio()
  }

  private async processRecordedAudio(): Promise<void> {
    if (!this.currentWord) return

    try {
      // Get the audio blob from streaming service
      const audioBlob = await this.streamingService?.getRecordedAudio()
      if (!audioBlob) {
        this.castingDialog?.handleWordError()
        this.isListeningForSpeech = false
        return
      }

      // Send to Whisper for transcription
      const result = await this.transcribeAudio(audioBlob, this.currentWord)
      this.handleDialogSpeechResult(result)
    } catch (error) {
      console.error('Processing error:', error)
      this.castingDialog?.handleWordError()
      this.isListeningForSpeech = false
    }
  }

  private async transcribeAudio(audioBlob: Blob, targetWord: string): Promise<SpeechRecognitionResult> {
    const formData = new FormData()
    const fileExt = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'
    formData.append('file', audioBlob, `audio.${fileExt}`)
    formData.append('model', 'gpt-4o-mini-transcribe') // Use faster model
    formData.append('language', 'en')
    formData.append('response_format', 'json')
    formData.append('prompt', `The user is saying the single word: ${targetWord}`)

    const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const transcribedText = data.text?.toLowerCase().trim() || ''

    // Clean up repeated words and punctuation
    const cleanedText = this.cleanTranscription(transcribedText, targetWord)

    // Check accuracy
    const isMatch = cleanedText === targetWord.toLowerCase()
    const confidence = isMatch ? 1.0 : 0.5

    return {
      text: cleanedText,
      confidence,
      pronunciation_score: confidence,
      isCriticalHit: isMatch && confidence > 0.95,
      isTimeout: false,
      isError: false
    }
  }

  private cleanTranscription(text: string, targetWord: string): string {
    // Remove punctuation
    let cleaned = text.replace(/[!.,?;]/g, '').toLowerCase().trim()

    // Handle repeated words
    const words = cleaned.split(/\s+/)
    if (words.every(w => w === targetWord.toLowerCase())) {
      return targetWord.toLowerCase()
    }

    // If target word appears anywhere, return it
    if (words.includes(targetWord.toLowerCase())) {
      return targetWord.toLowerCase()
    }

    return cleaned
  }


  private async handleDialogSpeechResult(result: SpeechRecognitionResult): Promise<void> {
    this.isListeningForSpeech = false

    if (!this.castingDialog || !this.currentWord) return

    const spokenWord = result.text.toLowerCase().trim()
    const targetWord = this.currentWord.toLowerCase().trim()

    console.log(`🎯 Word matching: "${spokenWord}" vs "${targetWord}"`)
    console.log(`  Confidence: ${result.confidence}`)
    console.log(`  Pronunciation: ${result.pronunciation_score}`)

    // Check for match
    const isMatch = spokenWord === targetWord ||
                   spokenWord.includes(targetWord) ||
                   result.confidence > 0.7

    if (isMatch && !result.isError && !result.isTimeout) {
      // Success! Add to combo
      this.comboWords.push(this.currentWord)
      this.pendingComboResults.push(result)
      this.castingDialog.handleWordSuccess(this.currentWord, result)

      // Get next word
      const nextWordData = this.wordManager.selectWordForLevel(this.currentFloor)
      if (nextWordData) {
        this.currentWord = nextWordData.word
        this.castingDialog.setNextWord(nextWordData.word)

        // IMMEDIATELY start recording the next word
        this.startRecordingForWord()
      }
    } else {
      // Failed - show error state
      this.castingDialog.handleWordError()

      // Auto-restart recording after brief delay
      this.time.delayedCall(1500, () => {
        if (this.castingDialog && this.currentWord) {
          this.startRecordingForWord()
        }
      })
    }
  }

  private handleComboComplete(results: SpeechRecognitionResult[]): void {
    console.log('⏰ Timer complete! Combo results:', results)

    // Stop any ongoing streaming
    this.streamingService?.stopStreaming()

    if (results.length === 0) {
      // No words spoken - enter learning mode
      if (this.currentWord) {
        this.startPhoneticLessonMode()
      }
    } else {
      // Cast spell with combo multiplier
      const comboMultiplier = Math.min(3, 1 + (results.length - 1) * 0.5)

      // Use best result from combo for spell casting (unused for now)
      // const bestResult = results.reduce((best, current) => {
      //   if (current.isCriticalHit && !best.isCriticalHit) return current
      //   if (current.confidence > best.confidence) return current
      //   return best
      // })

      // Cast spell for each word in combo
      results.forEach((result, index) => {
        const word = this.comboWords[index]
        if (word) {
          const modifiedResult = {
            ...result,
            confidence: result.confidence * comboMultiplier,
            pronunciation_score: (result.pronunciation_score ?? 1) * comboMultiplier
          }
          this.castSpell(word, modifiedResult)
        }
      })
    }

    // Clean up
    this.castingDialog = null
    this.comboWords = []
    this.pendingComboResults = []
    this.currentWord = null
  }

  // Removed old handleSpeechResult - now handled by handleDialogSpeechResult
  // Removed offerPronunciationHelp - now part of lesson mode

  /* Unused - keeping for potential future use
  private async offerPronunciationHelp(): Promise<void> {
    if (!this.currentWord || !this.pronunciationHelp) return

    // Pause the game for pronunciation help
    this.isGamePaused = true
    this.physics.pause()

    this.combatUI.showPronunciationHelp(`Listen carefully: "${this.currentWord}"`)

    try {
      // Speak the word slowly first
      await this.pronunciationHelp.speakSlowly(this.currentWord)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Then break it into syllables if it's complex
      if (this.currentWord.length > 4) {
        this.combatUI.showPronunciationHelp('Now broken into syllables...')
        await this.pronunciationHelp.speakSyllables(this.currentWord)
      }

      // Resume game with penalty spell
      this.isGamePaused = false
      this.physics.resume()

      // Cast spell with penalty (50% damage)
      const penaltyResult: SpeechRecognitionResult = {
        text: this.currentWord,
        confidence: 0.5,
        pronunciation_score: 0.5,
        isCriticalHit: false,
        isTimeout: false,
        isError: false
      }

      this.castSpell(this.currentWord, penaltyResult)
    } catch (error) {
      console.error('Pronunciation help failed:', error)
      this.isGamePaused = false
      this.physics.resume()
      // Cast spell with penalty anyway
      this.castSpell(this.currentWord)
    }

    this.combatUI.hidePronunciationHelp()
  }
  */

  /* Unused - keeping for potential future use
  private async offerTextInputFallback(): Promise<void> {
    if (!this.currentWord) return

    this.combatUI.showPronunciationHelp('Speech recording unavailable. Type the word and press Enter:')

    // Pause the game
    this.isGamePaused = true
    this.physics.pause()

    // Create a temporary text input
    const inputElement = document.createElement('input')
    inputElement.type = 'text'
    inputElement.placeholder = `Type: ${this.currentWord}`
    inputElement.style.position = 'fixed'
    inputElement.style.top = '50%'
    inputElement.style.left = '50%'
    inputElement.style.transform = 'translate(-50%, -50%)'
    inputElement.style.padding = '10px'
    inputElement.style.fontSize = '18px'
    inputElement.style.border = '2px solid #00ff00'
    inputElement.style.borderRadius = '5px'
    inputElement.style.backgroundColor = '#000'
    inputElement.style.color = '#fff'
    inputElement.style.zIndex = '10000'
    document.body.appendChild(inputElement)

    return new Promise((resolve) => {
      inputElement.focus()

      const handleInput = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          const typedWord = inputElement.value.toLowerCase().trim()
          document.body.removeChild(inputElement)

          // Resume game
          this.isGamePaused = false
          this.physics.resume()

          // Check if typed word matches
          if (typedWord === this.currentWord?.toLowerCase().trim()) {
            // Perfect typing gets normal spell
            this.castSpell(this.currentWord!, {
              text: typedWord,
              confidence: 1.0,
              pronunciation_score: 1.0,
              isCriticalHit: false,
              isTimeout: false,
              isError: false
            })
          } else {
            // Incorrect typing gets penalty
            this.castSpell(this.currentWord!, {
              text: typedWord,
              confidence: 0.3,
              pronunciation_score: 0.3,
              isCriticalHit: false,
              isTimeout: false,
              isError: false
            })
          }

          this.combatUI.hidePronunciationHelp()
          resolve()
        }
      }

      inputElement.addEventListener('keydown', handleInput)

      // Auto-cleanup after 15 seconds
      setTimeout(() => {
        if (document.body.contains(inputElement)) {
          document.body.removeChild(inputElement)
          this.isGamePaused = false
          this.physics.resume()
          this.combatUI.hidePronunciationHelp()

          // Cast spell with penalty for timeout
          this.castSpell(this.currentWord!, {
            text: '',
            confidence: 0.1,
            pronunciation_score: 0.1,
            isCriticalHit: false,
            isTimeout: true,
            isError: false
          })
          resolve()
        }
      }, 15000)
    })
  }
  */

  /* Unused - keeping for potential future use
  private calculateWordSimilarity(word1: string, word2: string): number {
    if (!word1 || !word2) return 0
    if (word1 === word2) return 1

    // Simple similarity based on common characters and length
    const maxLength = Math.max(word1.length, word2.length)
    const commonChars = word1.split('').filter(char => word2.includes(char)).length
    return commonChars / maxLength
  }
  */

  private async startPhoneticLessonMode(word?: string): Promise<void> {
    const targetWord = word || this.currentWord
    if (!targetWord || !this.pronunciationHelp) return

    console.log('🎓 Entering phonetic lesson mode for:', targetWord)

    // Close dialog if open
    if (this.castingDialog) {
      this.castingDialog.close()
      this.castingDialog = null
    }

    // Pause the game
    this.isGamePaused = true
    this.physics.pause()

    // Break word into phonetic parts
    const phoneticParts = this.breakWordIntoPhonetics(targetWord)
    console.log('📚 Phonetic breakdown:', phoneticParts)

    this.combatUI.showPronunciationHelp('Let\'s practice this word together...')

    try {
      // First, say the whole word slowly
      await this.speakWithHighlight(targetWord, targetWord)
      await this.delay(800)

      // Then break it down phonetically
      this.combatUI.showPronunciationHelp('Now let\'s break it down:')
      await this.delay(500)

      for (let i = 0; i < phoneticParts.length; i++) {
        const part = phoneticParts[i]
        await this.speakWithHighlight(part, targetWord, i)
        await this.delay(600)
      }

      // Finally, say it all together again
      await this.delay(500)
      this.combatUI.showPronunciationHelp('Now all together:')
      await this.speakWithHighlight(targetWord, targetWord)

      // Resume game and cast spell with lesson penalty
      await this.delay(1000)
      this.isGamePaused = false
      this.physics.resume()

      // Cast spell with reduced damage for needing help
      const lessonResult: SpeechRecognitionResult = {
        text: targetWord,
        confidence: 0.6,
        pronunciation_score: 0.6,
        isCriticalHit: false,
        isTimeout: false,
        isError: false
      }

      this.castSpell(targetWord, lessonResult)

    } catch (error) {
      console.error('Lesson mode failed:', error)
      this.isGamePaused = false
      this.physics.resume()
      // Cast spell with penalty anyway
      this.castSpell(targetWord)
    }

    this.combatUI.hidePronunciationHelp()
  }

  private breakWordIntoPhonetics(word: string): string[] {
    // Simple phonetic breakdown - this could be more sophisticated
    const patterns = [
      // Common digraphs and blends
      { pattern: /ch|sh|th|wh|ph/, type: 'digraph' },
      { pattern: /bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw/, type: 'blend' },
      // Vowel patterns
      { pattern: /ai|ay|ea|ee|ie|oa|oo|ou|ow/, type: 'vowel_team' },
      // Single letters
      { pattern: /[a-z]/, type: 'letter' }
    ]

    const parts: string[] = []
    let remaining = word.toLowerCase()

    while (remaining.length > 0) {
      let matched = false

      for (const { pattern } of patterns) {
        const match = remaining.match(pattern)
        if (match && match.index === 0) {
          parts.push(match[0])
          remaining = remaining.slice(match[0].length)
          matched = true
          break
        }
      }

      if (!matched) {
        // Fallback: take first character
        parts.push(remaining[0])
        remaining = remaining.slice(1)
      }
    }

    return parts
  }

  private async speakWithHighlight(textToSpeak: string, fullWord: string, partIndex?: number): Promise<void> {
    // Show phonetic breakdown with highlighting
    if (partIndex !== undefined) {
      const phoneticParts = this.breakWordIntoPhonetics(fullWord)
      const partToHighlight = phoneticParts[partIndex]
      this.combatUI.showPhoneticBreakdown(fullWord, partToHighlight, partIndex)
      this.combatUI.showPronunciationHelp(`🔊 "${partToHighlight}" - Listen carefully...`)
    } else {
      // Show word in pronunciation help instead of casting word
      this.combatUI.showPronunciationHelp(`🔊 "${fullWord}" - Listen carefully...`)
    }

    // Speak the text
    if (this.pronunciationHelp) {
      await this.pronunciationHelp.speakSlowly(textToSpeak)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
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
      'Use ARROW KEYS to move • Approach enemies to start combat • Press SPACE to speak words aloud',
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
    // Don't update if game is over or paused
    if (this.isGameOver || this.isGamePaused) return

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