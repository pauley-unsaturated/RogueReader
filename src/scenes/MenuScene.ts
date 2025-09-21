import Phaser from 'phaser'
import { TutorialSystem } from '../systems/TutorialSystem'

export class MenuScene extends Phaser.Scene {
  private tutorialSystem?: TutorialSystem

  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    // Title
    this.add.text(width / 2, height / 3, 'ROGUE READER', {
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

    // Tutorial button
    const tutorialButton = this.add.rectangle(width / 2, height / 2 + 130, 200, 50, 0x27ae60)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.showTutorial())
      .on('pointerover', () => tutorialButton.setFillStyle(0x229954))
      .on('pointerout', () => tutorialButton.setFillStyle(0x27ae60))

    this.add.text(width / 2, height / 2 + 130, 'HOW TO PLAY', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Instructions
    this.add.text(width / 2, height - 100, 'Press T for Tutorial • Use ARROW KEYS to move • Read words aloud to cast spells!', {
      fontSize: '16px',
      color: '#95a5a6'
    }).setOrigin(0.5)

    // Keyboard shortcut for tutorial
    this.input.keyboard?.on('keydown-T', () => this.showTutorial())

    // Check if this is first time and auto-show tutorial
    const hasSeenTutorial = localStorage.getItem('roguereader_tutorial_completed')
    if (!hasSeenTutorial) {
      // Delay slightly to ensure scene is ready
      this.time.delayedCall(500, () => {
        this.showTutorial()
      })
    }
  }

  private startGame() {
    this.scene.start('GameScene')
    this.scene.start('UIScene')
  }

  private showTutorial() {
    // Initialize tutorial system if not already done
    if (!this.tutorialSystem) {
      this.tutorialSystem = new TutorialSystem(this)
    }

    // Start the tutorial
    this.tutorialSystem.start()

    // Listen for completion to return to menu
    this.events.once('tutorial-completed', () => {
      // Tutorial completed, stay in menu
      console.log('Tutorial completed')
    })
  }
}