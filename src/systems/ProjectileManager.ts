import * as Phaser from 'phaser';
import { Projectile, ElementType, ELEMENT_CONFIGS } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';

export interface ProjectileFireEvent {
  targetEnemy: Enemy;
  damage: number;
  element: ElementType;
  sourcePosition: { x: number; y: number };
  comboLevel: number;
  wordLength: number; // For arcane "scholar" trait bonus
}

export class ProjectileManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private activeProjectiles: Projectile[] = [];
  private wizardElement: ElementType;

  constructor(scene: Phaser.Scene, wizardElement: ElementType = 'arcane') {
    super();
    this.scene = scene;
    this.wizardElement = wizardElement;

    console.log(`🧙 ProjectileManager initialized with element: ${wizardElement}`);
  }

  /**
   * Fire a new projectile from source position to target enemy
   */
  public fireProjectile(event: ProjectileFireEvent): void {
    const { targetEnemy, damage, sourcePosition, comboLevel, wordLength } = event;

    // Calculate final damage with element modifiers
    let finalDamage = damage;

    // Apply element multiplier
    const elementConfig = ELEMENT_CONFIGS[this.wizardElement];
    finalDamage *= elementConfig.damageMultiplier;

    // Apply Arcane Scholar trait (+5% per letter beyond 3)
    if (this.wizardElement === 'arcane' && wordLength > 3) {
      const scholarBonus = (wordLength - 3) * 0.05;
      finalDamage *= (1 + scholarBonus);
    }

    finalDamage = Math.floor(finalDamage);

    // Create projectile
    const projectile = new Projectile(this.scene, {
      element: this.wizardElement,
      damage: finalDamage,
      targetEnemy,
      speed: elementConfig.speed,
      sourcePosition,
      comboLevel
    });

    this.activeProjectiles.push(projectile);

    console.log(`🔮 Fired ${this.wizardElement} projectile: ${finalDamage} damage (combo: ${comboLevel}x)`);
  }

  /**
   * Update all active projectiles
   * Should be called from GameScene.update()
   */
  public update(time: number, delta: number): void {
    // Update projectiles in reverse order so we can safely remove them
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.activeProjectiles[i];

      if (!projectile.active) {
        // Projectile was destroyed (hit or target died)
        this.activeProjectiles.splice(i, 1);
        continue;
      }

      // Update projectile movement and collision
      projectile.update(time, delta);
    }
  }

  /**
   * Clear all projectiles (on floor transition)
   */
  public clearAll(): void {
    console.log(`🧹 Clearing ${this.activeProjectiles.length} active projectiles`);

    this.activeProjectiles.forEach(projectile => {
      projectile.cleanup();
    });

    this.activeProjectiles = [];
  }

  /**
   * Get current wizard element type
   */
  public getWizardElement(): ElementType {
    return this.wizardElement;
  }

  /**
   * Set wizard element (for character selection screen in future)
   */
  public setWizardElement(element: ElementType): void {
    this.wizardElement = element;
    console.log(`🧙 Wizard element changed to: ${element}`);
  }

  /**
   * Get count of active projectiles (for debugging/testing)
   */
  public getActiveCount(): number {
    return this.activeProjectiles.length;
  }

  /**
   * Apply special element traits when projectile hits
   * Called by GameScene when it receives 'projectileHit' event
   */
  public applyElementTrait(
    targetEnemy: Enemy,
    element: ElementType,
    damage: number
  ): void {
    const config = ELEMENT_CONFIGS[element];

    switch (config.trait) {
      case 'burn':
        // Fire: Apply burn damage over time (2 damage/sec for 3 seconds)
        this.applyBurnEffect(targetEnemy);
        break;

      case 'slow':
        // Ice: 30% chance to slow enemy movement
        if (Math.random() < 0.3) {
          this.applySlowEffect(targetEnemy);
        }
        break;

      case 'chain':
        // Lightning: 20% chance to chain to nearby enemy
        if (Math.random() < 0.2) {
          this.applyChainEffect(targetEnemy, damage);
        }
        break;

      case 'scholar':
        // Arcane: No special effect on hit (bonus already applied to damage)
        break;
    }
  }

  private applyBurnEffect(targetEnemy: Enemy): void {
    // Emit event for GameScene to handle
    // GameScene will apply 2 damage per second for 3 seconds
    this.emit('applyBurn', {
      targetId: targetEnemy.id,
      tickDamage: 2,
      duration: 3000
    });

    console.log(`🔥 Applied burn to ${targetEnemy.id}`);
  }

  private applySlowEffect(targetEnemy: Enemy): void {
    // Emit event for GameScene to handle
    // GameScene will reduce enemy movement speed by 50% for 2 seconds
    this.emit('applySlow', {
      targetId: targetEnemy.id,
      slowFactor: 0.5,
      duration: 2000
    });

    console.log(`❄️ Applied slow to ${targetEnemy.id}`);
  }

  private applyChainEffect(targetEnemy: Enemy, damage: number): void {
    // Emit event for GameScene to find and damage nearby enemy
    // Chain does 50% of original damage
    this.emit('applyChain', {
      sourceId: targetEnemy.id,
      sourcePosition: targetEnemy.getGridPosition(),
      chainDamage: Math.floor(damage * 0.5),
      maxRange: 3 // tiles
    });

    console.log(`⚡ Chain lightning from ${targetEnemy.id}`);
  }
}
