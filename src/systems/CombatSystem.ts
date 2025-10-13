import * as Phaser from 'phaser';

export interface CombatStats {
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
}

export interface SpellCast {
  word: string;
  damage: number;
  element?: 'fire' | 'ice' | 'lightning' | 'neutral';
  timestamp: number;
  isCriticalHit?: boolean;
  pronunciationScore?: number;
  spellingPenalty?: number;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastCastTime: number;
  timeWindow: number; // milliseconds to maintain combo
}

export interface CombatEntity {
  id: string;
  name: string;
  stats: CombatStats;
  gridPosition: { x: number; y: number };
}

export class CombatSystem extends Phaser.Events.EventEmitter {
  private player: CombatEntity;
  private enemies: Map<string, CombatEntity>;
  private comboState: ComboState;
  private spellHistory: SpellCast[];
  private isInCombat: boolean;
  private wordComplexityBonus: Map<string, number>;

  constructor() {
    super();
    this.enemies = new Map();
    this.spellHistory = [];
    this.isInCombat = false;
    this.wordComplexityBonus = new Map();

    this.comboState = {
      count: 0,
      multiplier: 1.0,
      lastCastTime: 0,
      timeWindow: 3000 // 3 seconds to maintain combo
    };

    // Initialize player stats (will be loaded from save later)
    this.player = {
      id: 'player',
      name: 'Wizard',
      stats: {
        health: 100,
        maxHealth: 100,
        damage: 10,
        defense: 5
      },
      gridPosition: { x: 0, y: 0 }
    };
  }

  public initializePlayer(stats: Partial<CombatStats>): void {
    this.player.stats = {
      ...this.player.stats,
      ...stats
    };
  }

  public addEnemy(enemy: CombatEntity): void {
    this.enemies.set(enemy.id, enemy);
    if (!this.isInCombat) {
      this.startCombat();
    }
  }

  public removeEnemy(enemyId: string): void {
    this.enemies.delete(enemyId);
    if (this.enemies.size === 0) {
      this.endCombat();
    }
  }

  public castSpell(word: string, targetId?: string, speechResult?: {
    pronunciationScore?: number,
    isCriticalHit?: boolean,
    spellingPenalty?: number
  }): SpellCast {
    const now = Date.now();

    // Update combo state
    this.updateCombo(now);

    // Calculate base damage
    const wordComplexity = this.calculateWordComplexity(word);
    const baseDamage = this.player.stats.damage;

    // Apply complexity scaling
    const complexityMultiplier = 1 + (wordComplexity * 0.5); // 50% bonus per complexity level

    // Apply combo multiplier
    let totalMultiplier = complexityMultiplier * this.comboState.multiplier;

    // Apply speech recognition bonuses/penalties
    let isCriticalHit = false;
    let pronunciationScore = 1.0;
    let spellingPenalty = 0;

    if (speechResult) {
      pronunciationScore = speechResult.pronunciationScore || 1.0;
      isCriticalHit = speechResult.isCriticalHit || false;
      spellingPenalty = speechResult.spellingPenalty || 0;

      // Critical hit gives 2x damage bonus
      if (isCriticalHit) {
        totalMultiplier *= 2.0;
      }

      // Pronunciation accuracy affects damage (0.5x to 1.5x based on score)
      const pronunciationMultiplier = 0.5 + (pronunciationScore * 1.0);
      totalMultiplier *= pronunciationMultiplier;

      // Spelling penalty reduces damage
      totalMultiplier *= Math.max(0.3, 1.0 - spellingPenalty);
    }

    const totalDamage = Math.floor(baseDamage * totalMultiplier);

    // Determine element based on phonetics
    const element = this.getWordElement(word);

    const spell: SpellCast = {
      word,
      damage: totalDamage,
      element,
      timestamp: now,
      isCriticalHit,
      pronunciationScore,
      spellingPenalty
    };

    this.spellHistory.push(spell);

    // Increment combo
    this.comboState.count++;
    this.comboState.lastCastTime = now;
    this.updateComboMultiplier();

    // Apply damage to target
    if (targetId && this.enemies.has(targetId)) {
      this.dealDamage(targetId, totalDamage, element);
    } else if (this.enemies.size > 0) {
      // Auto-target nearest enemy
      const nearestEnemy = this.getNearestEnemy();
      if (nearestEnemy) {
        this.dealDamage(nearestEnemy.id, totalDamage, element);
      }
    }

    // Emit spell cast event
    this.emit('spellCast', {
      spell,
      combo: this.comboState.count,
      multiplier: this.comboState.multiplier
    });

    // Monster Counter-Attacks (Item #11 follow-up)
    // Enemies within range counter-attack after player casts spell
    this.triggerCounterAttacks();

    return spell;
  }

  /**
   * Trigger counter-attacks from enemies within range
   * Adds strategic depth: players must consider enemy positioning when casting
   *
   * Design (from ERINS_FEEDBACK_TODOS.md):
   * - Monsters attack AFTER player fires spell
   * - Only attack if in range
   * - Not all monsters are ranged/magic users
   * - Creates risk/reward: "Do I target the close goblin or the far archer?"
   */
  private triggerCounterAttacks(): void {
    if (this.enemies.size === 0) return;

    const counterAttackers: CombatEntity[] = [];

    // Determine which enemies counter-attack based on range
    this.enemies.forEach(enemy => {
      const distance = Math.abs(enemy.gridPosition.x - this.player.gridPosition.x) +
                      Math.abs(enemy.gridPosition.y - this.player.gridPosition.y);

      // Counter-attack range rules:
      // - Within 3 tiles: Always counter-attack (melee range)
      // - Within 6 tiles: 50% chance (some enemies have ranged abilities)
      // - Beyond 6 tiles: No counter-attack (too far)
      if (distance <= 3) {
        counterAttackers.push(enemy);
      } else if (distance <= 6) {
        // 50% chance for ranged counter-attack
        if (Math.random() < 0.5) {
          counterAttackers.push(enemy);
        }
      }
    });

    // Emit counter-attack event for each enemy
    // GameScene will handle applying damage to player
    counterAttackers.forEach(enemy => {
      const distance = Math.abs(enemy.gridPosition.x - this.player.gridPosition.x) +
                      Math.abs(enemy.gridPosition.y - this.player.gridPosition.y);

      // Damage scales inversely with distance (closer = more dangerous)
      const distanceFactor = Math.max(0.5, 1 - (distance / 10));
      const counterDamage = Math.floor(enemy.stats.damage * distanceFactor);

      this.emit('enemyCounterAttack', {
        enemyId: enemy.id,
        enemyName: enemy.name,
        damage: counterDamage,
        distance: distance,
        isRanged: distance > 3
      });
    });
  }

  public defendWithWord(word: string): boolean {

    // Check if there's an incoming attack to defend against
    // For now, simple implementation - later will check enemy attack timers
    const success = Math.random() > 0.3; // 70% success rate for defense

    if (success) {
      this.emit('defenseSuccess', { word });
      // Could add shield/barrier mechanics here
    } else {
      this.emit('defenseFailed', { word });
    }

    return success;
  }

  private updateCombo(currentTime: number): void {
    if (currentTime - this.comboState.lastCastTime > this.comboState.timeWindow) {
      // Combo expired
      if (this.comboState.count > 0) {
        this.emit('comboLost', {
          count: this.comboState.count,
          multiplier: this.comboState.multiplier
        });
      }
      this.comboState.count = 0;
      this.comboState.multiplier = 1.0;
    }
  }

  private updateComboMultiplier(): void {
    // Progressive multiplier: 1x, 1.5x, 2x, 2.5x, 3x...
    if (this.comboState.count <= 1) {
      this.comboState.multiplier = 1.0;
    } else if (this.comboState.count <= 3) {
      this.comboState.multiplier = 1.5;
    } else if (this.comboState.count <= 6) {
      this.comboState.multiplier = 2.0;
    } else if (this.comboState.count <= 10) {
      this.comboState.multiplier = 2.5;
    } else {
      this.comboState.multiplier = 3.0;
    }
  }

  private calculateWordComplexity(word: string): number {
    let complexity = 0;

    // Length-based complexity
    if (word.length <= 3) complexity = 0;
    else if (word.length <= 5) complexity = 1;
    else if (word.length <= 7) complexity = 2;
    else complexity = 3;

    // Check for complex patterns
    const hasBlend = /bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr/.test(word);
    const hasDigraph = /ch|sh|th|wh|ph/.test(word);
    const hasSilentLetter = /kn|wr|mb|gh/.test(word);
    const isCompound = word.includes('-') || this.isLikelyCompound(word);

    if (hasBlend) complexity += 0.5;
    if (hasDigraph) complexity += 0.5;
    if (hasSilentLetter) complexity += 1;
    if (isCompound) complexity += 1.5;

    // Store for UI display
    this.wordComplexityBonus.set(word, complexity);

    return complexity;
  }

  private isLikelyCompound(word: string): boolean {
    const commonCompounds = [
      'anywhere', 'something', 'everyone', 'basketball',
      'football', 'sunshine', 'rainbow', 'butterfly'
    ];
    return commonCompounds.includes(word.toLowerCase());
  }

  private getWordElement(word: string): 'fire' | 'ice' | 'lightning' | 'neutral' {
    const lowerWord = word.toLowerCase();

    // Hard consonants = Lightning
    if (/^[ktp]/.test(lowerWord)) return 'lightning';

    // Soft sounds = Ice
    if (/^[sml]/.test(lowerWord)) return 'ice';

    // Fricatives = Fire
    if (/^[fv]|^th/.test(lowerWord)) return 'fire';

    return 'neutral';
  }

  private dealDamage(targetId: string, damage: number, element?: string): void {
    const enemy = this.enemies.get(targetId);
    if (!enemy) return;

    // Apply elemental effectiveness (future feature)
    let finalDamage = damage;

    // Emit damage event - GameScene will apply it to the Enemy instance via enemy.takeDamage()
    // The Enemy class handles health modification, death, and emitting enemyDied event
    this.emit('damageDealt', {
      targetId,
      damage: finalDamage,
      element,
      remainingHealth: enemy.stats.health // Current health before damage
    });

    // Note: We do NOT modify enemy.stats.health here or call defeatEnemy()
    // The Enemy instance handles death via takeDamage() -> die() -> emit('enemyDied')
    // GameScene.enemyDied handler awards rewards and calls removeEnemy()
  }

  private getNearestEnemy(): CombatEntity | null {
    if (this.enemies.size === 0) return null;

    let nearest: CombatEntity | null = null;
    let minDistance = Infinity;

    this.enemies.forEach(enemy => {
      const distance = Math.abs(enemy.gridPosition.x - this.player.gridPosition.x) +
                      Math.abs(enemy.gridPosition.y - this.player.gridPosition.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private startCombat(): void {
    this.isInCombat = true;
    this.emit('combatStarted');
  }

  private endCombat(): void {
    this.isInCombat = false;

    // Final combo bonus
    if (this.comboState.count > 0) {
      this.emit('combatEnded', {
        maxCombo: this.comboState.count,
        bonusReward: this.comboState.count * 5 // Bonus gold words for combo
      });
    } else {
      this.emit('combatEnded', {});
    }

    // Reset combo
    this.comboState.count = 0;
    this.comboState.multiplier = 1.0;
  }

  public takeDamage(amount: number): void {
    this.player.stats.health = Math.max(0, this.player.stats.health - amount);

    this.emit('playerDamaged', {
      damage: amount,
      remainingHealth: this.player.stats.health
    });

    if (this.player.stats.health <= 0) {
      this.emit('playerDefeated');
    }
  }

  public healPlayer(amount: number): void {
    this.player.stats.health = Math.min(
      this.player.stats.maxHealth,
      this.player.stats.health + amount
    );

    this.emit('playerHealed', {
      amount,
      currentHealth: this.player.stats.health
    });
  }

  public getPlayerStats(): CombatStats {
    return { ...this.player.stats };
  }

  public getComboState(): ComboState {
    return { ...this.comboState };
  }

  public getEnemies(): CombatEntity[] {
    return Array.from(this.enemies.values());
  }

  public isPlayerInCombat(): boolean {
    return this.isInCombat;
  }

  public updatePlayerPosition(x: number, y: number): void {
    this.player.gridPosition = { x, y };
  }

  /**
   * Clear all combat state when advancing to next floor
   */
  public clearAll(): void {
    // Clear all enemies
    this.enemies.clear();

    // Reset combat state
    this.isInCombat = false;

    // Reset combo
    this.comboState = {
      count: 0,
      multiplier: 1.0,
      lastCastTime: 0,
      timeWindow: 3000
    };

    // Clear spell history
    this.spellHistory = [];

    // Clear word complexity bonuses
    this.wordComplexityBonus.clear();

    console.log('🧹 CombatSystem cleared for new floor');
  }
}