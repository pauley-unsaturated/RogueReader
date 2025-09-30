import * as Phaser from 'phaser'
import { ConsumableTemplate } from '@/systems/ConsumableSystem'

export interface HotBarSlotData {
  slotIndex: number
  template: ConsumableTemplate | null
  quantity: number
}

export class HotBarUI extends Phaser.GameObjects.Container {
  private slots: Phaser.GameObjects.Container[] = []
  private slotBackgrounds: Phaser.GameObjects.Graphics[] = []
  private slotNumbers: Phaser.GameObjects.Text[] = []
  private slotIcons: Phaser.GameObjects.Graphics[] = []
  private slotNames: Phaser.GameObjects.Text[] = []
  private slotQuantities: Phaser.GameObjects.Text[] = []

  private readonly SLOT_SIZE = 60
  private readonly SLOT_SPACING = 8
  private readonly TOTAL_SLOTS = 4

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0)

    this.createHotBarSlots()
    this.positionHotBar()

    scene.add.existing(this)
    this.setDepth(100) // High depth to appear over game elements
  }

  private createHotBarSlots(): void {
    for (let i = 0; i < this.TOTAL_SLOTS; i++) {
      const slotContainer = this.scene.add.container(0, 0)

      // Slot background
      const background = this.scene.add.graphics()
      background.fillStyle(0x2a2a2a, 0.8) // Dark background
      background.lineStyle(2, 0x555555) // Gray border
      background.fillRoundedRect(-this.SLOT_SIZE/2, -this.SLOT_SIZE/2, this.SLOT_SIZE, this.SLOT_SIZE, 8)
      background.strokeRoundedRect(-this.SLOT_SIZE/2, -this.SLOT_SIZE/2, this.SLOT_SIZE, this.SLOT_SIZE, 8)

      // Slot number (1-4)
      const numberText = this.scene.add.text(-this.SLOT_SIZE/2 + 4, -this.SLOT_SIZE/2 + 2, (i + 1).toString(), {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      })

      // Item icon placeholder (will be replaced with actual icons)
      const icon = this.scene.add.graphics()
      icon.fillStyle(0x666666, 0.5)
      icon.fillCircle(0, -5, 12) // Empty slot circle

      // Item name
      const nameText = this.scene.add.text(0, 15, '', {
        fontSize: '10px',
        color: '#ffffff',
        align: 'center'
      })
      nameText.setOrigin(0.5)

      // Quantity text
      const quantityText = this.scene.add.text(this.SLOT_SIZE/2 - 6, this.SLOT_SIZE/2 - 6, '', {
        fontSize: '11px',
        color: '#ffff00',
        fontStyle: 'bold'
      })
      quantityText.setOrigin(1)

      // Add to slot container
      slotContainer.add([background, numberText, icon, nameText, quantityText])

      // Position slot
      const xPos = i * (this.SLOT_SIZE + this.SLOT_SPACING)
      slotContainer.setPosition(xPos, 0)

      // Store references
      this.slots.push(slotContainer)
      this.slotBackgrounds.push(background)
      this.slotNumbers.push(numberText)
      this.slotIcons.push(icon)
      this.slotNames.push(nameText)
      this.slotQuantities.push(quantityText)

      this.add(slotContainer)
    }
  }

  private positionHotBar(): void {
    // Position at bottom center of screen
    const camera = this.scene.cameras.main
    const totalWidth = (this.SLOT_SIZE * this.TOTAL_SLOTS) + (this.SLOT_SPACING * (this.TOTAL_SLOTS - 1))

    this.setPosition(
      camera.centerX - (totalWidth / 2) + (this.SLOT_SIZE / 2),
      camera.height - 80 // 80 pixels from bottom
    )
  }

  /**
   * Update hot bar display with current slot data
   */
  updateHotBar(hotBarData: HotBarSlotData[]): void {
    hotBarData.forEach((slotData, index) => {
      if (index >= this.TOTAL_SLOTS) return

      const icon = this.slotIcons[index]
      const nameText = this.slotNames[index]
      const quantityText = this.slotQuantities[index]
      const background = this.slotBackgrounds[index]

      if (slotData.template && slotData.quantity > 0) {
        // Update icon based on consumable type
        icon.clear()
        this.drawConsumableIcon(icon, slotData.template.type)

        // Update text
        nameText.setText(slotData.template.name)
        quantityText.setText(slotData.quantity > 1 ? `x${slotData.quantity}` : '')

        // Highlight background
        background.clear()
        background.fillStyle(0x3a3a3a, 0.9)
        background.lineStyle(2, 0x00ff00) // Green border for filled slots
        background.fillRoundedRect(-this.SLOT_SIZE/2, -this.SLOT_SIZE/2, this.SLOT_SIZE, this.SLOT_SIZE, 8)
        background.strokeRoundedRect(-this.SLOT_SIZE/2, -this.SLOT_SIZE/2, this.SLOT_SIZE, this.SLOT_SIZE, 8)
      } else {
        // Empty slot
        icon.clear()
        icon.fillStyle(0x666666, 0.3)
        icon.fillCircle(0, -5, 12)

        nameText.setText('')
        quantityText.setText('')

        // Default background
        background.clear()
        background.fillStyle(0x2a2a2a, 0.8)
        background.lineStyle(2, 0x555555)
        background.fillRoundedRect(-this.SLOT_SIZE/2, -this.SLOT_SIZE/2, this.SLOT_SIZE, this.SLOT_SIZE, 8)
        background.strokeRoundedRect(-this.SLOT_SIZE/2, -this.SLOT_SIZE/2, this.SLOT_SIZE, this.SLOT_SIZE, 8)
      }
    })
  }

  /**
   * Draw simple icons for different consumable types
   */
  private drawConsumableIcon(graphics: Phaser.GameObjects.Graphics, type: string): void {
    graphics.clear()

    switch (type) {
      case 'food':
        // Apple - red circle with green leaf
        graphics.fillStyle(0xff4444, 1)
        graphics.fillCircle(0, -5, 12)
        graphics.fillStyle(0x44ff44, 1)
        graphics.fillEllipse(-2, -12, 6, 4)
        break

      case 'potion':
        // Bottle shape
        graphics.fillStyle(0x4444ff, 1)
        graphics.fillRect(-6, -10, 12, 16)
        graphics.fillRect(-4, -15, 8, 6)
        graphics.fillStyle(0x888888, 1)
        graphics.fillRect(-2, -18, 4, 4)
        break

      case 'fairy':
        // Star shape - draw manually
        graphics.fillStyle(0xffff44, 1)
        const points = 5
        const outerRadius = 8
        const innerRadius = 4
        const centerX = 0
        const centerY = -5

        graphics.beginPath()
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (Math.PI * i) / points - Math.PI / 2
          const x = centerX + Math.cos(angle) * radius
          const y = centerY + Math.sin(angle) * radius

          if (i === 0) {
            graphics.moveTo(x, y)
          } else {
            graphics.lineTo(x, y)
          }
        }
        graphics.closePath()
        graphics.fillPath()
        break

      default:
        // Generic item
        graphics.fillStyle(0x888888, 1)
        graphics.fillCircle(0, -5, 10)
        break
    }
  }

  /**
   * Highlight a slot when it's used
   */
  highlightSlot(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.TOTAL_SLOTS) return

    const background = this.slotBackgrounds[slotIndex]

    // Flash effect
    this.scene.tweens.add({
      targets: background,
      alpha: 0.5,
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    })
  }

  /**
   * Show floating text when item is used
   */
  showUsageText(slotIndex: number, text: string): void {
    if (slotIndex < 0 || slotIndex >= this.TOTAL_SLOTS) return

    const slot = this.slots[slotIndex]
    const floatingText = this.scene.add.text(slot.x, slot.y - 30, text, {
      fontSize: '14px',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2
    })
    floatingText.setOrigin(0.5)
    floatingText.setDepth(150)

    // Animate text
    this.scene.tweens.add({
      targets: floatingText,
      y: floatingText.y - 20,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.out',
      onComplete: () => floatingText.destroy()
    })
  }

  /**
   * Reposition hot bar (useful for screen resize)
   */
  repositionHotBar(): void {
    this.positionHotBar()
  }

  /**
   * Set visibility of hot bar
   */
  setVisible(visible: boolean): this {
    super.setVisible(visible)
    return this
  }

  /**
   * Clean up hot bar
   */
  destroy(): void {
    // Clean up any running tweens
    this.scene.tweens.killTweensOf(this.slotBackgrounds)

    super.destroy()
  }
}