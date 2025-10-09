import * as Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/GameConfig';

export interface StairwellConfig {
  gridPosition: { x: number; y: number };
  targetFloor: number;
}

export class Stairwell extends Phaser.GameObjects.Container {
  private config: StairwellConfig;
  private gridPosition: { x: number; y: number };
  private sprite!: Phaser.GameObjects.Graphics;
  private glowEffect!: Phaser.GameObjects.Graphics;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private isActive: boolean = false;

  constructor(scene: Phaser.Scene, config: StairwellConfig) {
    const worldX = config.gridPosition.x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const worldY = config.gridPosition.y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    super(scene, worldX, worldY);

    this.config = config;
    this.gridPosition = { ...config.gridPosition };

    this.createSprite();
    this.createGlowEffect();
    this.createParticleEffect();

    // Start invisible
    this.setAlpha(0);
    this.setActive(false);

    scene.add.existing(this);
    this.setDepth(15); // Above enemies but below UI
  }

  private createSprite(): void {
    this.sprite = this.scene.add.graphics();

    // Create stairwell visual - downward steps
    this.sprite.fillStyle(0x8B4513, 1); // Brown
    this.sprite.fillRect(-12, -8, 24, 16); // Base platform

    // Create step effect
    for (let i = 0; i < 3; i++) {
      const stepY = -6 + (i * 4);
      const stepWidth = 20 - (i * 2);
      const stepX = -(stepWidth / 2);

      this.sprite.fillStyle(0x654321, 1); // Darker brown
      this.sprite.fillRect(stepX, stepY, stepWidth, 3);
    }

    // Add some detail - side walls
    this.sprite.fillStyle(0x444444, 1); // Dark gray
    this.sprite.fillRect(-14, -8, 2, 16); // Left wall
    this.sprite.fillRect(12, -8, 2, 16);  // Right wall

    // Add entrance shadow
    this.sprite.fillStyle(0x000000, 0.3);
    this.sprite.fillEllipse(0, 4, 20, 8);

    this.add(this.sprite);
  }

  private createGlowEffect(): void {
    this.glowEffect = this.scene.add.graphics();

    // Magical glow around the stairwell
    this.glowEffect.fillStyle(0x00FFFF, 0.3); // Cyan glow
    this.glowEffect.fillCircle(0, 0, 25);

    this.glowEffect.fillStyle(0xFFFFFF, 0.1); // White inner glow
    this.glowEffect.fillCircle(0, 0, 20);

    this.add(this.glowEffect);
  }

  private createParticleEffect(): void {
    // Create shimmer particles
    const particleTexture = this.scene.add.graphics();
    particleTexture.fillStyle(0xFFFFFF, 1);
    particleTexture.fillCircle(2, 2, 2);
    particleTexture.generateTexture('stairwell-particle', 4, 4);
    particleTexture.destroy();

    this.particles = this.scene.add.particles(this.x, this.y, 'stairwell-particle', {
      speed: { min: 10, max: 30 },
      scale: { start: 0.3, end: 0 },
      lifespan: 1000,
      frequency: 100,
      alpha: { start: 0.8, end: 0 },
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 20),
        quantity: 2
      }
    });

    this.particles.stop(); // Start stopped
  }

  /**
   * Makes the stairwell appear with animation after boss defeat
   */
  public materialize(): void {
    if (this.isActive) return;

    console.log(`✨ Stairwell materializing at (${this.gridPosition.x}, ${this.gridPosition.y})`);

    this.isActive = true;
    this.setActive(true);

    // Start particle effect
    this.particles.start();

    // Fade in with scale animation
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: { from: 0, to: 1 },
      scaleY: { from: 0, to: 1 },
      duration: 1000,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Add pulsing glow effect
        this.scene.tweens.add({
          targets: this.glowEffect,
          alpha: { from: 0.3, to: 0.6 },
          scaleX: { from: 1, to: 1.2 },
          scaleY: { from: 1, to: 1.2 },
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Play materialization sound (if audio system exists)
    this.scene.events.emit('stairwellMaterialized', {
      position: this.gridPosition,
      targetFloor: this.config.targetFloor
    });
  }

  /**
   * Check if player can interact with this stairwell
   */
  public canInteract(playerPosition: { x: number; y: number }): boolean {
    if (!this.isActive) return false;

    const distance = Math.abs(this.gridPosition.x - playerPosition.x) +
                    Math.abs(this.gridPosition.y - playerPosition.y);

    return distance <= 1; // Adjacent tile
  }

  /**
   * Interact with the stairwell to advance to next floor
   */
  public interact(): void {
    if (!this.isActive) return;

    console.log(`🚪 Player entering stairwell to floor ${this.config.targetFloor}`);

    // Emit event for game scene to handle floor transition
    this.scene.events.emit('playerEnterStairwell', {
      targetFloor: this.config.targetFloor,
      stairwellPosition: this.gridPosition
    });

    // Play interaction animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });
  }

  public getGridPosition(): { x: number; y: number } {
    return { ...this.gridPosition };
  }

  public getTargetFloor(): number {
    return this.config.targetFloor;
  }

  public isActiveStatus(): boolean {
    return this.isActive;
  }

  /**
   * Clean up particle effects and tweens
   */
  public destroy(fromScene?: boolean): void {
    if (this.particles) {
      this.particles.destroy();
    }

    // Stop all tweens targeting this object
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.killTweensOf(this.glowEffect);

    super.destroy(fromScene);
  }
}