import Phaser from 'phaser'
import { TutorialSystem } from '../systems/TutorialSystem'
import type { ElementType } from '../entities/Projectile'

export class MenuScene extends Phaser.Scene {
  private tutorialSystem?: TutorialSystem
  private wizardSelectionContainer?: Phaser.GameObjects.Container
  private selectedWizard: ElementType = 'fire'  // Default selection
  private selectedStartingFloor: number = 1  // Default to Floor 1

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
    // Show wizard selection dialog instead of immediately starting
    this.showWizardSelection()
  }

  /**
   * Show wizard selection dialog
   */
  private showWizardSelection() {
    const { width, height } = this.cameras.main

    // Create container for wizard selection UI
    this.wizardSelectionContainer = this.add.container(0, 0)
    this.wizardSelectionContainer.setDepth(1000)

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
    overlay.setOrigin(0, 0)
    this.wizardSelectionContainer.add(overlay)

    // Title
    const title = this.add.text(width / 2, 100, 'Choose Your Wizard', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.wizardSelectionContainer.add(title)

    // Wizard descriptions
    const wizards: Array<{ element: ElementType; name: string; color: string; description: string }> = [
      {
        element: 'fire',
        name: '🔥 Fire Wizard',
        color: '#FF4500',
        description: 'Burns enemies over time\n110% damage + burn effect'
      },
      {
        element: 'ice',
        name: '❄️ Ice Wizard',
        color: '#00BFFF',
        description: 'Slows enemies down\nFast spells + crowd control'
      },
      {
        element: 'lightning',
        name: '⚡ Lightning Wizard',
        color: '#FFFF00',
        description: 'Chains to nearby enemies\nInstant hits + chain lightning'
      },
      {
        element: 'arcane',
        name: '🔮 Arcane Wizard',
        color: '#9370DB',
        description: 'Rewards vocabulary mastery\nBonus damage from long words'
      }
    ]

    // Create selection cards
    const cardWidth = 220
    const cardHeight = 140
    const cardSpacing = 20
    const totalWidth = (cardWidth * 4) + (cardSpacing * 3)
    const startX = (width - totalWidth) / 2 + cardWidth / 2
    const startY = height / 2 - 20

    wizards.forEach((wizard, index) => {
      const x = startX + (index * (cardWidth + cardSpacing))
      const y = startY

      // Card background
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x2c3e50, 1)
      card.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(wizard.color).color)
      card.setInteractive({ useHandCursor: true })

      // Highlight selected card
      if (wizard.element === this.selectedWizard) {
        card.setFillStyle(0x34495e)
      }

      // Click handler
      card.on('pointerdown', () => {
        this.selectedWizard = wizard.element
        // Re-render selection to update highlights
        this.wizardSelectionContainer?.destroy()
        this.showWizardSelection()
      })

      // Hover effect
      card.on('pointerover', () => {
        card.setFillStyle(0x34495e)
      })
      card.on('pointerout', () => {
        if (wizard.element !== this.selectedWizard) {
          card.setFillStyle(0x2c3e50)
        }
      })

      // Wizard name
      const nameText = this.add.text(x, y - 45, wizard.name, {
        fontSize: '20px',
        color: wizard.color,
        fontStyle: 'bold'
      }).setOrigin(0.5)

      // Description
      const descText = this.add.text(x, y + 10, wizard.description, {
        fontSize: '14px',
        color: '#ecf0f1',
        align: 'center',
        lineSpacing: 4
      }).setOrigin(0.5)

      this.wizardSelectionContainer!.add([card, nameText, descText])
    })

    // Start button
    const startButton = this.add.rectangle(width / 2, height - 120, 250, 60, 0x27ae60)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.confirmWizardSelection())
      .on('pointerover', () => startButton.setFillStyle(0x229954))
      .on('pointerout', () => startButton.setFillStyle(0x27ae60))

    const startButtonText = this.add.text(width / 2, height - 120, 'START ADVENTURE!', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.wizardSelectionContainer!.add([startButton, startButtonText])

    // Floor Selection Section
    const floorSectionY = height - 250

    const floorTitle = this.add.text(width / 2, floorSectionY, 'Starting Floor (Skip Ahead for Harder Words & Better Rewards):', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    this.wizardSelectionContainer!.add(floorTitle)

    // Floor options: 1, 5, 10, 15, 20, 25, 30, 35, 40
    const floorOptions = [1, 5, 10, 15, 20, 25, 30, 35, 40]
    const floorButtonWidth = 80
    const floorButtonHeight = 40
    const floorButtonSpacing = 10
    const totalFloorWidth = (floorButtonWidth * floorOptions.length) + (floorButtonSpacing * (floorOptions.length - 1))
    const floorStartX = (width - totalFloorWidth) / 2 + floorButtonWidth / 2
    const floorButtonY = floorSectionY + 40

    floorOptions.forEach((floor, index) => {
      const buttonX = floorStartX + (index * (floorButtonWidth + floorButtonSpacing))

      // Floor button
      const floorButton = this.add.rectangle(buttonX, floorButtonY, floorButtonWidth, floorButtonHeight, 0x34495e, 1)
      floorButton.setStrokeStyle(2, 0x7f8c8d)
      floorButton.setInteractive({ useHandCursor: true })

      // Highlight selected floor
      if (floor === this.selectedStartingFloor) {
        floorButton.setFillStyle(0x27ae60)
        floorButton.setStrokeStyle(3, 0x1abc9c)
      }

      // Click handler
      floorButton.on('pointerdown', () => {
        this.selectedStartingFloor = floor
        // Re-render selection to update highlights
        this.wizardSelectionContainer?.destroy()
        this.showWizardSelection()
      })

      // Hover effect
      floorButton.on('pointerover', () => {
        if (floor !== this.selectedStartingFloor) {
          floorButton.setFillStyle(0x2c3e50)
        }
      })
      floorButton.on('pointerout', () => {
        if (floor !== this.selectedStartingFloor) {
          floorButton.setFillStyle(0x34495e)
        }
      })

      // Floor number text
      const floorText = this.add.text(buttonX, floorButtonY, `${floor}`, {
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5)

      this.wizardSelectionContainer!.add([floorButton, floorText])
    })

    // Floor info text
    const readingLevel = Math.ceil(this.selectedStartingFloor / 2)  // 2 floors per reading level
    const floorInfo = this.add.text(width / 2, floorButtonY + 50, `Reading Level: ${readingLevel} | Gold Multiplier: ${(1 + this.selectedStartingFloor * 0.15).toFixed(1)}x`, {
      fontSize: '16px',
      color: '#bdc3c7',
      align: 'center'
    }).setOrigin(0.5)
    this.wizardSelectionContainer!.add(floorInfo)
  }

  /**
   * Confirm wizard selection and start game
   */
  private confirmWizardSelection() {
    console.log(`🧙 Player selected: ${this.selectedWizard} wizard`)
    console.log(`📍 Starting floor: ${this.selectedStartingFloor}`)

    // Clean up wizard selection UI
    this.wizardSelectionContainer?.destroy()

    // Start game with selected wizard element and starting floor
    this.scene.start('GameScene', {
      wizardElement: this.selectedWizard,
      startingFloor: this.selectedStartingFloor
    })
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