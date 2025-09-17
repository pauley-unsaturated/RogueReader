import Phaser from 'phaser'

export class AssetLoader {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  loadCharacterSprites(): void {
    console.log('Loading wizard sprites...')

    try {
      // Load optimized 32x32 sprites
      this.scene.load.image('wizard_idle_1', 'assets/sprites/characters/wizard_optimized/wizard_idle_1.png')
      this.scene.load.image('wizard_idle_2', 'assets/sprites/characters/wizard_optimized/wizard_idle_2.png')
      this.scene.load.image('wizard_idle_3', 'assets/sprites/characters/wizard_optimized/wizard_idle_3.png')
      this.scene.load.image('wizard_idle_4', 'assets/sprites/characters/wizard_optimized/wizard_idle_4.png')

      // Load optimized spritesheet
      this.scene.load.spritesheet('wizard_spritesheet', 'assets/sprites/characters/wizard_optimized_sheet.png', {
        frameWidth: 32,
        frameHeight: 32
      })
    } catch (error) {
      console.log('Wizard sprites not found, will use fallback graphics')
    }

    // Set up error handling for missing files
    this.scene.load.on('filecomplete', (key: string) => {
      console.log(`Loaded asset: ${key}`)
    })

    this.scene.load.on('loaderror', (file: any) => {
      console.log(`Failed to load asset: ${file.key}`)
    })
  }

  loadEnvironmentSprites(): void {
    // Placeholder environment sprites (we'll replace these with generated assets later)
    this.createPlaceholderTextures()
  }

  private createPlaceholderTextures(): void {
    // Create colored rectangle textures as placeholders
    const graphics = this.scene.add.graphics()

    // Floor tile
    graphics.fillStyle(0x95a5a6)
    graphics.fillRect(0, 0, 32, 32)
    graphics.generateTexture('floor_tile', 32, 32)

    // Wall tile
    graphics.clear()
    graphics.fillStyle(0x7f8c8d)
    graphics.fillRect(0, 0, 32, 32)
    graphics.lineStyle(1, 0x5d6d6e)
    graphics.strokeRect(0, 0, 32, 32)
    graphics.generateTexture('wall_tile', 32, 32)

    // Door
    graphics.clear()
    graphics.fillStyle(0xf39c12)
    graphics.fillRect(0, 0, 32, 32)
    graphics.lineStyle(2, 0xd68910)
    graphics.strokeRect(2, 2, 28, 28)
    graphics.generateTexture('door_tile', 32, 32)

    // Treasure chest
    graphics.clear()
    graphics.fillStyle(0xf1c40f)
    graphics.fillRect(4, 8, 24, 16)
    graphics.fillStyle(0xe67e22)
    graphics.fillRect(6, 10, 20, 12)
    graphics.generateTexture('chest_tile', 32, 32)

    graphics.destroy()
  }

  createAnimations(): void {
    // Create wizard idle animation if using individual frames
    if (this.scene.textures.exists('wizard_idle_1')) {
      this.scene.anims.create({
        key: 'wizard_idle',
        frames: [
          { key: 'wizard_idle_1' },
          { key: 'wizard_idle_2' },
          { key: 'wizard_idle_3' },
          { key: 'wizard_idle_4' }
        ],
        frameRate: 2, // Slow idle animation
        repeat: -1   // Loop forever
      })
    }

    // Alternative: Create animation from spritesheet
    if (this.scene.textures.exists('wizard_spritesheet')) {
      this.scene.anims.create({
        key: 'wizard_idle_sheet',
        frames: this.scene.anims.generateFrameNumbers('wizard_spritesheet', { start: 0, end: 3 }),
        frameRate: 2,
        repeat: -1
      })
    }

    // Create walking animation (using same frames for now)
    this.scene.anims.create({
      key: 'wizard_walk',
      frames: [
        { key: 'wizard_idle_1' },
        { key: 'wizard_idle_3' },
        { key: 'wizard_idle_2' },
        { key: 'wizard_idle_4' }
      ],
      frameRate: 4, // Faster for walking
      repeat: -1
    })

    // Create casting animation
    this.scene.anims.create({
      key: 'wizard_cast',
      frames: [
        { key: 'wizard_idle_2' },
        { key: 'wizard_idle_4' },
        { key: 'wizard_idle_3' },
        { key: 'wizard_idle_1' }
      ],
      frameRate: 6, // Fast casting animation
      repeat: 0     // Play once
    })
  }
}