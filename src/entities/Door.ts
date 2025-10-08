import Phaser from 'phaser'
import { GAME_CONFIG } from '@/config/GameConfig'

export interface DoorConfig {
  id: string
  gridX: number
  gridY: number
  orientation: 'horizontal' | 'vertical'
  roomIndex: number // Which room this door belongs to (combat/boss rooms only)
}

export class Door extends Phaser.GameObjects.Container {
  public readonly id: string
  public readonly gridX: number
  public readonly gridY: number
  public readonly orientation: 'horizontal' | 'vertical'
  public readonly roomIndex: number
  private isOpen: boolean = true // Start doors open
  private doorGraphic: Phaser.GameObjects.Rectangle
  private doorFrame: Phaser.GameObjects.Rectangle
  private readonly TILE_SIZE = GAME_CONFIG.TILE_SIZE

  constructor(scene: Phaser.Scene, config: DoorConfig) {
    super(scene, config.gridX * GAME_CONFIG.TILE_SIZE, config.gridY * GAME_CONFIG.TILE_SIZE)

    this.id = config.id
    this.gridX = config.gridX
    this.gridY = config.gridY
    this.orientation = config.orientation
    this.roomIndex = config.roomIndex

    // Create door frame (always visible to show where doors are)
    const frameWidth = this.orientation === 'horizontal' ? this.TILE_SIZE : this.TILE_SIZE * 0.4
    const frameHeight = this.orientation === 'vertical' ? this.TILE_SIZE : this.TILE_SIZE * 0.4

    this.doorFrame = scene.add.rectangle(
      this.TILE_SIZE / 2,
      this.TILE_SIZE / 2,
      frameWidth,
      frameHeight,
      0x654321 // Dark brown frame
    )
    this.doorFrame.setStrokeStyle(2, 0x4A3520)
    this.doorFrame.setAlpha(0.4) // Semi-transparent frame always visible

    // Create door graphic (solid when closed, transparent when open)
    const doorWidth = this.orientation === 'horizontal' ? this.TILE_SIZE - 4 : this.TILE_SIZE * 0.3
    const doorHeight = this.orientation === 'vertical' ? this.TILE_SIZE - 4 : this.TILE_SIZE * 0.3

    this.doorGraphic = scene.add.rectangle(
      this.TILE_SIZE / 2,
      this.TILE_SIZE / 2,
      doorWidth,
      doorHeight,
      0x8B4513 // Saddle brown for closed door
    )
    this.doorGraphic.setStrokeStyle(3, 0x3D2817) // Dark outline
    this.doorGraphic.setAlpha(0.3) // Start semi-transparent (open door)

    this.add(this.doorFrame)
    this.add(this.doorGraphic)
    scene.add.existing(this)
  }

  public open(): void {
    if (this.isOpen) return

    this.isOpen = true

    // Visual feedback - door becomes semi-transparent (still visible but passable)
    this.scene.tweens.add({
      targets: this.doorGraphic,
      alpha: 0.3, // Semi-transparent when open
      duration: 300,
      ease: 'Power2'
    })

    console.log(`🚪 Door ${this.id} opened`)
  }

  public close(): void {
    if (!this.isOpen) return

    this.isOpen = false

    // Visual feedback - door becomes solid and prominent
    this.scene.tweens.add({
      targets: this.doorGraphic,
      alpha: 1, // Fully opaque when closed
      duration: 300,
      ease: 'Power2'
    })

    // Add slight "slam" effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    })

    console.log(`🚪 Door ${this.id} closed`)
  }

  public getIsOpen(): boolean {
    return this.isOpen
  }

  public blocksPosition(gridX: number, gridY: number): boolean {
    // Door blocks movement if it's closed and player is trying to move through it
    if (this.isOpen) return false

    return gridX === this.gridX && gridY === this.gridY
  }
}
