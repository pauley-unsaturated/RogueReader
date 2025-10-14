import * as Phaser from 'phaser';
import { Enemy } from './Enemy';

export type ElementType = 'fire' | 'ice' | 'lightning' | 'arcane';

export interface ProjectileConfig {
  element: ElementType;
  damage: number;
  targetEnemy: Enemy;
  speed: number; // pixels per second
  sourcePosition: { x: number; y: number };
  comboLevel: number; // For visual scaling (1x, 1.5x, 2x, etc.)
}

export interface ElementConfig {
  color: number;
  particleColor: number;
  trailLength: number;
  speed: number;
  damageMultiplier: number;
  trait: 'burn' | 'slow' | 'chain' | 'scholar';
}

export const ELEMENT_CONFIGS: Record<ElementType, ElementConfig> = {
  fire: {
    color: 0xff4500,      // Orange-red
    particleColor: 0xff8c00,
    trailLength: 20,
    speed: 200,           // Slow, visible projectile
    damageMultiplier: 1.1, // 110% damage
    trait: 'burn'         // 2 damage/sec for 3 seconds
  },
  ice: {
    color: 0x00bfff,      // Deep sky blue
    particleColor: 0x87ceeb,
    trailLength: 15,
    speed: 250,           // Fast projectile (but still visible)
    damageMultiplier: 1.0, // 100% damage
    trait: 'slow'         // 30% chance, 50% movement reduction
  },
  lightning: {
    color: 0xffff00,      // Yellow
    particleColor: 0xffffff,
    trailLength: 10,
    speed: Infinity,      // Instant hit
    damageMultiplier: 0.9, // 90% damage
    trait: 'chain'        // 20% chance to hit nearby enemy
  },
  arcane: {
    color: 0x9370db,      // Medium purple
    particleColor: 0xda70d6,
    trailLength: 15,
    speed: 225,           // Moderate speed
    damageMultiplier: 1.0, // 100% + complexity bonus
    trait: 'scholar'      // +5% damage per letter beyond 3
  }
};

export class Projectile extends Phaser.GameObjects.Container {
  private config: ProjectileConfig;
  private elementConfig: ElementConfig;
  private sprite!: Phaser.GameObjects.Graphics;
  private targetEnemy: Enemy;
  private velocity: Phaser.Math.Vector2;
  private hasHit: boolean = false;
  private trailParticles: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene, config: ProjectileConfig) {
    super(scene, config.sourcePosition.x, config.sourcePosition.y);

    this.config = config;
    this.targetEnemy = config.targetEnemy;
    this.elementConfig = ELEMENT_CONFIGS[config.element];

    // Calculate velocity toward target
    this.velocity = this.calculateVelocity();

    // Create projectile sprite
    this.createSprite();

    // Add to scene
    scene.add.existing(this);
    this.setDepth(50); // Above enemies (10) but below UI (100+)
  }

  private calculateVelocity(): Phaser.Math.Vector2 {
    const targetPos = this.targetEnemy.getGridPosition();
    const targetWorldX = targetPos.x * 48 + 24; // Using TILE_SIZE from config
    const targetWorldY = targetPos.y * 48 + 24;

    const dx = targetWorldX - this.x;
    const dy = targetWorldY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      return new Phaser.Math.Vector2(0, 0);
    }

    // Normalize and multiply by speed
    const speed = this.elementConfig.speed === Infinity
      ? distance * 60 // Instant hit (arrives in 1 frame at 60fps)
      : this.elementConfig.speed;

    return new Phaser.Math.Vector2(
      (dx / distance) * speed,
      (dy / distance) * speed
    );
  }

  private createSprite(): void {
    // Phase 1: Simple colored circle
    this.sprite = this.scene.add.graphics();

    // Scale size based on combo level
    const baseSize = 8;
    const sizeMultiplier = 1 + (this.config.comboLevel - 1) * 0.2; // 1x, 1.2x, 1.4x, etc.
    const size = baseSize * sizeMultiplier;

    // Draw filled circle with element color
    this.sprite.fillStyle(this.elementConfig.color, 1);
    this.sprite.fillCircle(0, 0, size);

    // Add glow effect for higher combo levels
    if (this.config.comboLevel >= 2) {
      this.sprite.lineStyle(2, this.elementConfig.color, 0.6);
      this.sprite.strokeCircle(0, 0, size + 2);
    }

    if (this.config.comboLevel >= 3) {
      this.sprite.lineStyle(2, this.elementConfig.color, 0.3);
      this.sprite.strokeCircle(0, 0, size + 4);
    }

    this.add(this.sprite);
  }

  public update(_time: number, delta: number): void {
    if (this.hasHit) return;

    // Check if target is still alive
    if (!this.targetEnemy.isAliveStatus()) {
      this.destroy();
      return;
    }

    // Move projectile
    const deltaSeconds = delta / 1000;
    this.x += this.velocity.x * deltaSeconds;
    this.y += this.velocity.y * deltaSeconds;

    // Create trail effect
    if (this.config.comboLevel >= 2) {
      this.createTrailParticle();
    }

    // Check collision with target
    this.checkCollision();
  }

  private createTrailParticle(): void {
    const trail = this.scene.add.graphics();
    const size = 4 * (1 + (this.config.comboLevel - 1) * 0.1);

    trail.fillStyle(this.elementConfig.particleColor, 0.5);
    trail.fillCircle(this.x, this.y, size);
    trail.setDepth(49); // Just below projectile

    this.trailParticles.push(trail);

    // Fade out and destroy trail particle
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        trail.destroy();
        const index = this.trailParticles.indexOf(trail);
        if (index > -1) {
          this.trailParticles.splice(index, 1);
        }
      }
    });

    // Limit trail length
    if (this.trailParticles.length > this.elementConfig.trailLength) {
      const oldest = this.trailParticles.shift();
      oldest?.destroy();
    }
  }

  private checkCollision(): void {
    const targetPos = this.targetEnemy.getGridPosition();
    const targetWorldX = targetPos.x * 48 + 24;
    const targetWorldY = targetPos.y * 48 + 24;

    const distance = Phaser.Math.Distance.Between(
      this.x, this.y,
      targetWorldX, targetWorldY
    );

    // Hit detection radius (target size + projectile size)
    const hitRadius = 20;

    if (distance <= hitRadius) {
      this.onCollision();
    }
  }

  private onCollision(): void {
    if (this.hasHit) return;
    this.hasHit = true;

    // Emit collision event
    this.scene.events.emit('projectileHit', {
      projectile: this,
      targetId: this.targetEnemy.id,
      damage: this.config.damage,
      element: this.config.element,
      position: { x: this.x, y: this.y }
    });

    // Create impact effect
    this.createImpactEffect();

    // Destroy projectile
    this.scene.time.delayedCall(100, () => {
      this.cleanup();
    });
  }

  private createImpactEffect(): void {
    // Phase 3: Enhanced element-specific impact effects
    const impact = this.scene.add.graphics();
    impact.setDepth(51);

    switch (this.config.element) {
      case 'fire':
        // Fiery explosion burst
        impact.fillStyle(0xff4500, 0.8); // Orange-red
        impact.fillCircle(this.x, this.y, 15);
        impact.fillStyle(0xffff00, 0.6); // Yellow center
        impact.fillCircle(this.x, this.y, 10);

        // Add flame particles
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          const particle = this.scene.add.graphics();
          particle.fillStyle(0xff8c00, 0.7);
          particle.fillCircle(this.x, this.y, 4);
          particle.setDepth(51);

          this.scene.tweens.add({
            targets: particle,
            x: this.x + Math.cos(angle) * 30,
            y: this.y + Math.sin(angle) * 30,
            alpha: 0,
            duration: 300,
            ease: 'Power2.out',
            onComplete: () => particle.destroy()
          });
        }
        break;

      case 'ice':
        // Icy shatter effect
        impact.lineStyle(3, 0x00bfff, 0.8); // Ice blue
        // Draw shattered ice lines radiating outward
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          impact.beginPath();
          impact.moveTo(this.x, this.y);
          impact.lineTo(this.x + Math.cos(angle) * 20, this.y + Math.sin(angle) * 20);
          impact.strokePath();
        }
        // Center ice burst
        impact.fillStyle(0x87ceeb, 0.6);
        impact.fillCircle(this.x, this.y, 12);
        break;

      case 'lightning':
        // Electric discharge
        impact.fillStyle(0xffff00, 1); // Bright yellow flash
        impact.fillCircle(this.x, this.y, 18);
        impact.fillStyle(0xffffff, 0.8); // White center
        impact.fillCircle(this.x, this.y, 10);

        // Add electric sparks
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6 + Phaser.Math.Between(-0.3, 0.3);
          const sparkLength = Phaser.Math.Between(15, 25);
          impact.lineStyle(2, 0xffffff, 1);
          impact.beginPath();
          impact.moveTo(this.x, this.y);
          impact.lineTo(this.x + Math.cos(angle) * sparkLength, this.y + Math.sin(angle) * sparkLength);
          impact.strokePath();
        }
        break;

      case 'arcane':
        // Mystical burst with rotating symbols
        impact.fillStyle(0x9370db, 0.8); // Purple
        impact.fillCircle(this.x, this.y, 15);
        impact.fillStyle(0xda70d6, 0.6); // Lighter purple center
        impact.fillCircle(this.x, this.y, 10);

        // Add mystical particles in spiral
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          const particle = this.scene.add.graphics();
          particle.fillStyle(0xda70d6, 0.7);
          particle.fillCircle(this.x, this.y, 3);
          particle.setDepth(51);

          this.scene.tweens.add({
            targets: particle,
            x: this.x + Math.cos(angle) * 25,
            y: this.y + Math.sin(angle) * 25,
            angle: 360,
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeOut',
            onComplete: () => particle.destroy()
          });
        }
        break;
    }

    // Main impact fade out
    this.scene.tweens.add({
      targets: impact,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Power2.out',
      onComplete: () => impact.destroy()
    });

    // Emit camera shake event (Phase 3)
    this.scene.events.emit('impactCameraShake', {
      intensity: 2 + this.config.comboLevel * 0.5 // Scales with combo
    });
  }

  public cleanup(): void {
    // Destroy all trail particles
    this.trailParticles.forEach(trail => trail.destroy());
    this.trailParticles = [];

    // Destroy projectile
    this.destroy();
  }

  public getConfig(): ProjectileConfig {
    return { ...this.config };
  }

  public getElement(): ElementType {
    return this.config.element;
  }

  public getDamage(): number {
    return this.config.damage;
  }

  public getTargetEnemy(): Enemy {
    return this.targetEnemy;
  }
}
