import Phaser from 'phaser'
import { Room } from '@/systems/DungeonGenerator'

export class UIScene extends Phaser.Scene {
  private healthBar!: Phaser.GameObjects.Rectangle
  private manaBar!: Phaser.GameObjects.Rectangle
  private healthText!: Phaser.GameObjects.Text
  private manaText!: Phaser.GameObjects.Text
  private spellModal!: Phaser.GameObjects.Container
  private isSpellModalOpen: boolean = false

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createHUD()
    this.createSpellModal()
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

  private createSpellModal(): void {
    const { width, height } = this.cameras.main
    
    this.spellModal = this.add.container(width / 2, height / 2)
    
    // Modal background
    const modalBg = this.add.rectangle(0, 0, 400, 300, 0x2c3e50, 0.95)
    modalBg.setStrokeStyle(3, 0x3498db)
    
    // Title
    const title = this.add.text(0, -120, 'CAST SPELL', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Word display
    const wordDisplay = this.add.text(0, -60, 'FIREBALL', {
      fontSize: '32px',
      color: '#f39c12',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Instructions
    const instructions = this.add.text(0, 0, 'Read the word aloud clearly', {
      fontSize: '16px',
      color: '#bdc3c7'
    }).setOrigin(0.5)
    
    // Buttons
    const castButton = this.add.rectangle(0, 60, 120, 40, 0x27ae60)
    const castText = this.add.text(0, 60, 'CAST', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    const cancelButton = this.add.rectangle(0, 110, 120, 40, 0xe74c3c)
    const cancelText = this.add.text(0, 110, 'CANCEL', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    this.spellModal.add([modalBg, title, wordDisplay, instructions, castButton, castText, cancelButton, cancelText])
    this.spellModal.setVisible(false)
    
    // Make buttons interactive
    castButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.castSpell())
      .on('pointerover', () => castButton.setFillStyle(0x2ecc71))
      .on('pointerout', () => castButton.setFillStyle(0x27ae60))
    
    cancelButton.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeSpellModal())
      .on('pointerover', () => cancelButton.setFillStyle(0xc0392b))
      .on('pointerout', () => cancelButton.setFillStyle(0xe74c3c))
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
        this.openSpellModal('FIRE', 'Attack the enemies!')
        break
      case 'treasure':
        this.showMessage(`Treasure room discovered!`, 0xf1c40f)
        this.openSpellModal('UNLOCK', 'Open the treasure chest!')
        break
      case 'puzzle':
        this.showMessage(`Puzzle room - use your wits!`, 0x9b59b6)
        this.openSpellModal('SOLVE', 'Solve the puzzle!')
        break
      case 'shop':
        this.showMessage(`Shop found - trade your loot!`, 0x2ecc71)
        break
      case 'boss':
        this.showMessage(`Boss room! Prepare for battle!`, 0x8e44ad)
        this.openSpellModal('POWER', 'Defeat the boss!')
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

  private openSpellModal(word: string, instruction: string): void {
    if (this.isSpellModalOpen) return
    
    this.isSpellModalOpen = true
    
    // Update modal content
    const wordText = this.spellModal.list[2] as Phaser.GameObjects.Text
    const instructionText = this.spellModal.list[3] as Phaser.GameObjects.Text
    
    wordText.setText(word)
    instructionText.setText(instruction)
    
    this.spellModal.setVisible(true)
    
    // Animate in
    this.spellModal.setScale(0)
    this.tweens.add({
      targets: this.spellModal,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    })
  }

  private closeSpellModal(): void {
    this.tweens.add({
      targets: this.spellModal,
      scaleX: 0,
      scaleY: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.spellModal.setVisible(false)
        this.isSpellModalOpen = false
      }
    })
  }

  private castSpell(): void {
    // Simulate spell casting
    this.showMessage('Spell cast successfully!', 0x27ae60)
    this.closeSpellModal()
    
    // TODO: Integrate with speech recognition
    // TODO: Apply spell effects
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