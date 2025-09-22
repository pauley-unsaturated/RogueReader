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
    
    // Health bar
    this.add.rectangle(100, height - 50, 200, 20, 0x7f8c8d)
    this.healthBar = this.add.rectangle(100, height - 50, 200, 20, 0xe74c3c)
    this.healthText = this.add.text(20, height - 60, 'HP: 100/100', {
      fontSize: '14px',
      color: '#ffffff'
    })

    // Mana bar
    this.add.rectangle(100, height - 25, 200, 20, 0x7f8c8d)
    this.manaBar = this.add.rectangle(100, height - 25, 200, 20, 0x3498db)
    this.manaText = this.add.text(20, height - 35, 'MP: 50/50', {
      fontSize: '14px',
      color: '#ffffff'
    })

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
        this.showMessage(`Entered ${room.type} room! Enemies await!`, 0xe74c3c)
        // Old modal disabled - using new CastingDialog in GameScene
        // this.openSpellModal('FIRE', 'Attack the enemies!')
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
    this.healthText.setText(`HP: ${current}/${max}`)
  }

  private updateManaBar(current: number, max: number): void {
    const percentage = current / max
    this.manaBar.setScale(percentage, 1)
    this.manaText.setText(`MP: ${current}/${max}`)
  }
}