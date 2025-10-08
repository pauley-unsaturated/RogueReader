import Phaser from 'phaser'
import { Room } from '@/systems/DungeonGenerator'

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Rectangle
  private manaBar!: Phaser.GameObjects.Rectangle
  private healthText!: Phaser.GameObjects.Text
  private manaText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createHUD()
    this.setupEventListeners()
  }

  private createHUD(): void {
    const { width, height } = this.cameras.main

    // HP on LEFT side - big, easy to read for kids
    const hpX = 120
    const hpY = height - 40

    // Health bar background
    const healthBarBg = this.add.rectangle(hpX, hpY, 180, 24, 0x7f8c8d)
    healthBarBg.setDepth(1100)
    // Health bar foreground
    this.healthBar = this.add.rectangle(hpX, hpY, 180, 24, 0xe74c3c)
    this.healthBar.setDepth(1100)
    // HP label (small)
    this.add.text(30, hpY - 12, 'HP', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setDepth(1100)
    // HP value (BIG number)
    this.healthText = this.add.text(hpX, hpY, '100', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.healthText.setOrigin(0.5)
    this.healthText.setDepth(1100)

    // MP on RIGHT side - big, easy to read for kids
    const mpX = width - 120
    const mpY = height - 40

    // Mana bar background
    const manaBarBg = this.add.rectangle(mpX, mpY, 180, 24, 0x7f8c8d)
    manaBarBg.setDepth(1100)
    // Mana bar foreground
    this.manaBar = this.add.rectangle(mpX, mpY, 180, 24, 0x3498db)
    this.manaBar.setDepth(1100)
    // MP label (small)
    this.add.text(width - 210, mpY - 12, 'MP', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setDepth(1100)
    // MP value (BIG number)
    this.manaText = this.add.text(mpX, mpY, '50', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    })
    this.manaText.setOrigin(0.5)
    this.manaText.setDepth(1100)

    // Instructions
    this.add.text(width - 20, height - 60, 'Arrow Keys: Move • Space: Interact • N: Next Floor', {
      fontSize: '12px',
      color: '#bdc3c7'
    }).setOrigin(1, 0)
  }


  private setupEventListeners(): void {
    // Listen for room events
    this.events.on('room-entered', (room: Room) => {
      this.handleRoomEntered(room)
    })
    
    // Listen for player stats updates
    this.events.on('update-health', (current: number, max: number) => {
      this.updateHealthBar(current, max)
    })
    
    this.events.on('update-mana', (current: number, max: number) => {
      this.updateManaBar(current, max)
    })
  }

  private handleRoomEntered(room: Room): void {
    switch (room.type) {
      case 'combat':
        // Combat handled by GameScene's CastingDialog system
        // No message needed here as the casting dialog provides all UI
        break
      case 'treasure':
        this.showMessage(`Treasure room discovered!`, 0xf1c40f)
        // this.openSpellModal('UNLOCK', 'Open the treasure chest!')
        break
      case 'puzzle':
        this.showMessage(`Puzzle room - use your wits!`, 0x9b59b6)
        // this.openSpellModal('SOLVE', 'Solve the puzzle!')
        break
      case 'shop':
        this.showMessage(`Shop found - trade your loot!`, 0x2ecc71)
        break
      case 'boss':
        this.showMessage(`Boss room! Prepare for battle!`, 0x8e44ad)
        // this.openSpellModal('POWER', 'Defeat the boss!')
        break
    }
  }

  private showMessage(text: string, _color: number = 0xffffff): void {
    const { width } = this.cameras.main
    
    const messageText = this.add.text(width / 2, 100, text, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: messageText,
      alpha: 0,
      y: 50,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => messageText.destroy()
    })
  }


  private updateHealthBar(current: number, max: number): void {
    const percentage = current / max
    this.healthBar.setScale(percentage, 1)
    // Show just the current value, BIG and readable
    this.healthText.setText(`${Math.round(current)}`)
  }

  private updateManaBar(current: number, max: number): void {
    const percentage = current / max
    this.manaBar.setScale(percentage, 1)
    // Show just the current value, BIG and readable
    this.manaText.setText(`${Math.round(current)}`)
  }
}