import Phaser from 'phaser'
import { GAME_CONFIG } from '@/config/GameConfig'

export class Player extends Phaser.GameObjects.Sprite {
  public gridX: number
  public gridY: number
  public health: number
  public mana: number
  public isMoving: boolean = false
  private currentAnimation: string = 'idle'

  constructor(scene: Phaser.Scene, gridX: number, gridY: number) {
    const pixelX = gridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
    const pixelY = gridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2

    // Create fallback texture first if needed
    if (!scene.textures.exists('wizard_idle_1') && !scene.textures.exists('wizard_fallback')) {
      Player.createFallbackTexture(scene)
    }

    // Use wizard sprite if available, otherwise use fallback
    const textureKey = scene.textures.exists('wizard_idle_1') ? 'wizard_idle_1' : 'wizard_fallback'
    super(scene, pixelX, pixelY, textureKey)

    this.gridX = gridX
    this.gridY = gridY
    this.health = GAME_CONFIG.COMBAT.BASE_PLAYER_HP
    this.mana = GAME_CONFIG.COMBAT.BASE_PLAYER_MANA

    scene.add.existing(this)

    // Set up sprite properties
    this.setOrigin(0.5, 0.5)

    // Scale 64x64 sprites to 32x32 tile size
    if (scene.textures.exists('wizard_idle_1')) {
      this.setScale(GAME_CONFIG.TILE_SIZE / 64) // Scale from 64px to 32px
    } else {
      this.setScale(1) // Fallback texture is already correct size
    }

    this.startIdleAnimation()
  }

  private static createFallbackTexture(scene: Phaser.Scene): void {
    // Create a simple wizard rectangle as fallback
    const graphics = scene.add.graphics()
    graphics.fillStyle(GAME_CONFIG.COLORS.PLAYER)
    graphics.fillRect(0, 0, GAME_CONFIG.TILE_SIZE - 4, GAME_CONFIG.TILE_SIZE - 4)
    graphics.lineStyle(2, 0xffffff)
    graphics.strokeRect(0, 0, GAME_CONFIG.TILE_SIZE - 4, GAME_CONFIG.TILE_SIZE - 4)

    // Add a simple hat indicator
    graphics.fillStyle(0x8e44ad)
    graphics.fillRect(4, 0, GAME_CONFIG.TILE_SIZE - 12, 8)

    graphics.generateTexture('wizard_fallback', GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE)
    graphics.destroy()
  }

  private startIdleAnimation(): void {
    try {
      if (this.scene.anims.exists('wizard_idle')) {
        this.play('wizard_idle')
      } else if (this.scene.anims.exists('wizard_idle_sheet')) {
        this.play('wizard_idle_sheet')
      }
    } catch (error) {
      console.log('Animation failed, using static sprite:', error)
      // Just use static sprite if animation fails
    }
  }

  moveToGrid(newGridX: number, newGridY: number, canMove: (x: number, y: number) => boolean): boolean {
    if (this.isMoving || !canMove(newGridX, newGridY)) {
      return false
    }

    this.isMoving = true
    this.gridX = newGridX
    this.gridY = newGridY

    const newPixelX = newGridX * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2
    const newPixelY = newGridY * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2

    // Play walking animation if available
    try {
      if (this.scene.anims.exists('wizard_walk') && this.currentAnimation !== 'walk') {
        this.play('wizard_walk')
        this.currentAnimation = 'walk'
      }
    } catch (error) {
      console.log('Walking animation failed, using static sprite:', error)
      // Continue with movement even if animation fails
    }

    this.scene.tweens.add({
      targets: this,
      x: newPixelX,
      y: newPixelY,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this.isMoving = false
        // Return to idle animation
        if (this.currentAnimation === 'walk') {
          try {
            this.startIdleAnimation()
            this.currentAnimation = 'idle'
          } catch (error) {
            console.log('Idle animation failed:', error)
            this.currentAnimation = 'idle'
          }
        }
        this.scene.events.emit('player-moved', this.gridX, this.gridY)
      }
    })

    return true
  }

  castSpell(): void {
    try {
      if (this.scene.anims.exists('wizard_cast')) {
        this.play('wizard_cast')
        this.currentAnimation = 'cast'

        // Return to idle after casting
        this.once('animationcomplete', () => {
          if (this.currentAnimation === 'cast') {
            this.startIdleAnimation()
            this.currentAnimation = 'idle'
          }
        })
      }
    } catch (error) {
      console.log('Cast animation failed:', error)
      // Continue without animation
    }
  }

  takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount)

    // Visual feedback
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    })

    return this.health <= 0
  }

  heal(amount: number): void {
    this.health = Math.min(GAME_CONFIG.COMBAT.BASE_PLAYER_HP, this.health + amount)
  }

  useMana(amount: number): boolean {
    if (this.mana >= amount) {
      this.mana -= amount
      return true
    }
    return false
  }

  restoreMana(amount: number): void {
    this.mana = Math.min(GAME_CONFIG.COMBAT.BASE_PLAYER_MANA, this.mana + amount)
  }
}