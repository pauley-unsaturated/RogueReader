import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // Title
    this.add.text(width / 2, height / 3, 'SPELL SPEAKERS', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 3 + 60, 'Reading Roguelike Adventure', {
      fontSize: '24px',
      color: '#bdc3c7'
    }).setOrigin(0.5)

    // Start button
    const startButton = this.add.rectangle(width / 2, height / 2 + 50, 200, 60, 0x3498db)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startGame())
      .on('pointerover', () => startButton.setFillStyle(0x2980b9))
      .on('pointerout', () => startButton.setFillStyle(0x3498db))

    this.add.text(width / 2, height / 2 + 50, 'START ADVENTURE', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Instructions
    this.add.text(width / 2, height - 100, 'Use ARROW KEYS to move • SPACE to interact • Read words aloud to cast spells!', {
      fontSize: '16px',
      color: '#95a5a6'
    }).setOrigin(0.5)
  }

  private startGame() {
    this.scene.start('GameScene')
    this.scene.start('UIScene')
  }
}