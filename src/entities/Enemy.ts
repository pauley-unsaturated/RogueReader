import * as Phaser from 'phaser';
import { CombatEntity } from '../systems/CombatSystem';

export interface EnemyConfig {
  id: string;
  name: string;
  type: 'goblin' | 'skeleton' | 'bat' | 'slime' | 'orc' | 'demon';
  level: number;
  gridPosition: { x: number; y: number };
  health?: number;
  damage?: number;
  defense?: number;
  attackSpeed?: number; // milliseconds between attacks
  movementSpeed?: number; // tiles per second
  aggroRange?: number; // tiles
}

export class Enemy extends Phaser.GameObjects.Container {
  private config: EnemyConfig;
  private sprite!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private stats: CombatEntity['stats'];
  private gridPosition: { x: number; y: number };
  private attackTimer?: Phaser.Time.TimerEvent;
  private isAlive: boolean = true;
  private isInCombat: boolean = false;
  private moveTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, config: EnemyConfig) {
    const worldX = config.gridPosition.x * 32 + 16;
    const worldY = config.gridPosition.y * 32 + 16;
    super(scene, worldX, worldY);

    this.config = config;
    this.gridPosition = { ...config.gridPosition };

    // Calculate stats based on level
    this.stats = this.calculateStats();

    // Create sprite or placeholder
    this.createSprite();
    this.createHealthBar();
    this.createNameLabel();

    scene.add.existing(this);
    this.setDepth(10);
  }

  private calculateStats(): CombatEntity['stats'] {
    const baseStats = this.getBaseStats();
    const levelMultiplier = 1 + (this.config.level - 1) * 0.2;

    return {
      health: Math.floor((this.config.health || baseStats.health) * levelMultiplier),
      maxHealth: Math.floor((this.config.health || baseStats.health) * levelMultiplier),
      damage: Math.floor((this.config.damage || baseStats.damage) * levelMultiplier),
      defense: Math.floor((this.config.defense || baseStats.defense) * levelMultiplier)
    };
  }

  private getBaseStats(): CombatEntity['stats'] {
    switch (this.config.type) {
      case 'goblin':
        return { health: 30, maxHealth: 30, damage: 5, defense: 2 };
      case 'skeleton':
        return { health: 40, maxHealth: 40, damage: 8, defense: 3 };
      case 'bat':
        return { health: 20, maxHealth: 20, damage: 4, defense: 1 };
      case 'slime':
        return { health: 50, maxHealth: 50, damage: 3, defense: 5 };
      case 'orc':
        return { health: 60, maxHealth: 60, damage: 12, defense: 5 };
      case 'demon':
        return { health: 100, maxHealth: 100, damage: 15, defense: 8 };
      default:
        return { health: 30, maxHealth: 30, damage: 5, defense: 2 };
    }
  }

  private createSprite(): void {
    // Try to load actual sprite, fallback to colored shape
    const spriteKey = `enemy_${this.config.type}`;

    if (this.scene.textures.exists(spriteKey)) {
      this.sprite = this.scene.add.sprite(0, 0, spriteKey);
    } else {
      // Create placeholder graphics
      this.sprite = this.scene.add.graphics();
      const graphics = this.sprite as Phaser.GameObjects.Graphics;

      // Different shapes/colors for different enemy types
      switch (this.config.type) {
        case 'goblin':
          graphics.fillStyle(0x00ff00, 1); // Green
          graphics.fillCircle(0, 0, 12);
          break;
        case 'skeleton':
          graphics.fillStyle(0xffffff, 1); // White
          graphics.fillRect(-10, -10, 20, 20);
          break;
        case 'bat':
          graphics.fillStyle(0x800080, 1); // Purple
          graphics.fillTriangle(-10, 0, 10, 0, 0, -15);
          break;
        case 'slime':
          graphics.fillStyle(0x00ffff, 1); // Cyan
          graphics.fillEllipse(0, 0, 20, 15);
          break;
        case 'orc':
          graphics.fillStyle(0x8b4513, 1); // Brown
          graphics.fillRect(-12, -12, 24, 24);
          break;
        case 'demon':
          graphics.fillStyle(0xff0000, 1); // Red
          graphics.fillCircle(0, 0, 15);
          graphics.fillStyle(0x000000, 1);
          graphics.fillCircle(-5, -5, 3); // Eye
          graphics.fillCircle(5, -5, 3); // Eye
          break;
      }

      // Add outline
      graphics.lineStyle(2, 0x000000);
      if (this.config.type === 'skeleton' || this.config.type === 'orc') {
        graphics.strokeRect(-12, -12, 24, 24);
      } else if (this.config.type === 'bat') {
        graphics.strokeTriangle(-10, 0, 10, 0, 0, -15);
      } else {
        graphics.strokeCircle(0, 0, 15);
      }
    }

    this.add(this.sprite);
  }

  private createHealthBar(): void {
    // Background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(-20, -30, 40, 6);
    this.add(this.healthBarBg);

    // Health bar
    this.healthBar = this.scene.add.graphics();
    this.updateHealthBar();
    this.add(this.healthBar);
  }

  private createNameLabel(): void {
    this.nameText = this.scene.add.text(0, -40, this.config.name, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Add level indicator
    if (this.config.level > 1) {
      const levelText = this.scene.add.text(25, -40, `Lv${this.config.level}`, {
        fontSize: '10px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2
      });
      levelText.setOrigin(0.5);
      this.add(levelText);
    }
  }

  private updateHealthBar(): void {
    this.healthBar.clear();

    const healthPercent = this.stats.health / this.stats.maxHealth;
    const barWidth = Math.floor(40 * healthPercent);

    // Color based on health
    let color = 0x00ff00; // Green
    if (healthPercent <= 0.25) color = 0xff0000; // Red
    else if (healthPercent <= 0.5) color = 0xffff00; // Yellow

    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(-20, -30, barWidth, 6);

    // Border
    this.healthBar.lineStyle(1, 0x000000);
    this.healthBar.strokeRect(-20, -30, 40, 6);
  }

  public takeDamage(amount: number): number {
    if (!this.isAlive) return 0;

    const actualDamage = Math.max(1, amount - this.stats.defense);
    this.stats.health = Math.max(0, this.stats.health - actualDamage);

    this.updateHealthBar();
    this.showDamageEffect(actualDamage);

    if (this.stats.health <= 0) {
      this.die();
    }

    return actualDamage;
  }

  private showDamageEffect(damage: number): void {
    // Flash red
    if (this.sprite instanceof Phaser.GameObjects.Sprite) {
      this.sprite.setTint(0xff0000);
      this.scene.time.delayedCall(200, () => {
        if (this.sprite instanceof Phaser.GameObjects.Sprite) {
          this.sprite.clearTint();
        }
      });
    }

    // Show damage number
    const damageText = this.scene.add.text(
      this.x + Phaser.Math.Between(-10, 10),
      this.y - 20,
      `-${damage}`,
      {
        fontSize: '18px',
        color: '#ff0000',
        stroke: '#ffffff',
        strokeThickness: 2
      }
    );
    damageText.setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      ease: 'Power2.out',
      onComplete: () => damageText.destroy()
    });

    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-3, 3),
      y: this.y + Phaser.Math.Between(-3, 3),
      duration: 50,
      repeat: 3,
      yoyo: true,
      ease: 'Power0'
    });
  }

  private die(): void {
    this.isAlive = false;

    // Stop any timers
    if (this.attackTimer) {
      this.attackTimer.destroy();
    }
    if (this.moveTimer) {
      this.moveTimer.destroy();
    }

    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      rotation: Math.PI,
      duration: 500,
      ease: 'Power2.in',
      onComplete: () => {
        this.destroy();
      }
    });

    // Emit death event
    this.scene.events.emit('enemyDied', {
      id: this.config.id,
      position: this.gridPosition,
      rewards: this.generateRewards()
    });
  }

  private generateRewards(): any {
    // Generate word rewards based on enemy level
    const baseReward = 5;
    const levelBonus = this.config.level * 3;

    return {
      goldWords: baseReward + levelBonus,
      experience: this.config.level * 10
    };
  }

  public startCombat(playerPosition: { x: number; y: number }): void {
    if (!this.isAlive || this.isInCombat) return;

    this.isInCombat = true;

    // Start attack timer
    const attackSpeed = this.config.attackSpeed || 3000;
    this.attackTimer = this.scene.time.addEvent({
      delay: attackSpeed,
      callback: () => this.performAttack(playerPosition),
      loop: true
    });

    // Show combat indicator
    this.nameText.setColor('#ff0000');
  }

  public stopCombat(): void {
    this.isInCombat = false;

    if (this.attackTimer) {
      this.attackTimer.destroy();
      this.attackTimer = undefined;
    }

    this.nameText.setColor('#ffffff');
  }

  private performAttack(playerPosition: { x: number; y: number }): void {
    if (!this.isAlive) return;

    // Check if player is in range (adjacent tile)
    const distance = Math.abs(this.gridPosition.x - playerPosition.x) +
                    Math.abs(this.gridPosition.y - playerPosition.y);

    if (distance <= 1) {
      // Attack animation
      const originalX = this.x;
      const originalY = this.y;

      // Lunge toward player
      const dx = playerPosition.x - this.gridPosition.x;
      const dy = playerPosition.y - this.gridPosition.y;

      this.scene.tweens.add({
        targets: this,
        x: originalX + (dx * 10),
        y: originalY + (dy * 10),
        duration: 100,
        yoyo: true,
        ease: 'Power1',
        onComplete: () => {
          // Emit attack event
          this.scene.events.emit('enemyAttack', {
            enemyId: this.config.id,
            damage: this.stats.damage
          });
        }
      });
    } else {
      // Move toward player if too far
      this.moveToward(playerPosition);
    }
  }

  private moveToward(target: { x: number; y: number }): void {
    if (!this.isAlive) return;

    const dx = target.x - this.gridPosition.x;
    const dy = target.y - this.gridPosition.y;

    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else if (dy !== 0) {
      moveY = dy > 0 ? 1 : -1;
    }

    const newX = this.gridPosition.x + moveX;
    const newY = this.gridPosition.y + moveY;

    // Check if move is valid (would need collision check with dungeon)
    this.moveToGrid(newX, newY);
  }

  public moveToGrid(gridX: number, gridY: number): void {
    this.gridPosition.x = gridX;
    this.gridPosition.y = gridY;

    const worldX = gridX * 32 + 16;
    const worldY = gridY * 32 + 16;

    this.scene.tweens.add({
      targets: this,
      x: worldX,
      y: worldY,
      duration: 300,
      ease: 'Power2.inOut'
    });
  }

  public getStats(): CombatEntity['stats'] {
    return { ...this.stats };
  }

  public getCombatEntity(): CombatEntity {
    return {
      id: this.config.id,
      name: this.config.name,
      stats: this.getStats(),
      gridPosition: { ...this.gridPosition }
    };
  }

  public getGridPosition(): { x: number; y: number } {
    return { ...this.gridPosition };
  }

  public isAliveStatus(): boolean {
    return this.isAlive;
  }

  public update(playerPosition: { x: number; y: number }): void {
    if (!this.isAlive) return;

    // Check aggro range
    const distance = Math.abs(this.gridPosition.x - playerPosition.x) +
                    Math.abs(this.gridPosition.y - playerPosition.y);

    const aggroRange = this.config.aggroRange || 5;

    if (distance <= aggroRange && !this.isInCombat) {
      this.startCombat(playerPosition);
    } else if (distance > aggroRange * 2 && this.isInCombat) {
      this.stopCombat();
    }
  }
}