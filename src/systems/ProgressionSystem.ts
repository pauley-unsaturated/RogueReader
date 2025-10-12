/**
 * ProgressionSystem - Centralized game progression and difficulty scaling
 *
 * This system manages the relationship between game floors (dungeon levels)
 * and reading difficulty levels (word complexity). It provides all configuration
 * for enemy scaling, spell costs, and progression mechanics.
 *
 * Design Goals:
 * - Single source of truth for progression logic
 * - Support current 1:1 floor→level mapping (20 floors)
 * - Extensible to 35-40 levels with transition levels (Item #11)
 * - Clear separation between "floors" (game progression) and "levels" (word difficulty)
 *
 * Terminology:
 * - Floor: The dungeon level (1-20 currently, 1-40 with Item #11)
 * - Reading Level: The word difficulty tier (1-20, maps to K-10th grade)
 * - Transition Level: A floor that mixes two reading levels (future: Item #11)
 */

export interface TransitionMix {
  currentLevel: number;
  nextLevel: number;
  ratio: number; // 0.0-1.0, chance of using nextLevel
}

export interface EnemyLevelWeights {
  level: number;
  weight: number;
}

export interface BossConfig {
  hpMultiplier: number;
  damageMultiplier: number;
  wordLevelBoost: number; // How much higher than normal enemies
}

export class ProgressionSystem {
  private static readonly MAX_READING_LEVEL = 20;
  private static readonly MAX_FLOOR = 20; // Will expand to 40 with Item #11

  /**
   * Get the primary reading level for a given floor
   * Currently 1:1 mapping, but will support transitions in Item #11
   */
  public static getWordLevelForFloor(floor: number): number {
    // Cap at max reading level
    const level = Math.min(Math.floor(floor), this.MAX_READING_LEVEL);
    return Math.max(1, level);
  }

  /**
   * Get transition mix for floors that blend two reading levels
   * Returns null for non-transition floors
   *
   * Future (Item #11): Will return mix ratios for transition levels
   * Example: Floor 11 might return { currentLevel: 1, nextLevel: 2, ratio: 0.5 }
   */
  public static getTransitionMix(_floor: number): TransitionMix | null {
    // Current implementation: No transitions yet
    // Item #11 will implement this based on transition level design
    return null;
  }

  /**
   * Check if a floor is a transition level (mixing two word difficulties)
   * Future (Item #11): Will identify floors between major reading levels
   */
  public static isTransitionLevel(floor: number): boolean {
    return this.getTransitionMix(floor) !== null;
  }

  /**
   * Calculate enemy level weights for a given floor
   * Uses falloff probability system (Item #10)
   *
   * Returns weighted distribution:
   * - Current floor level: 60% probability
   * - One above: 25% probability
   * - One below: 30% probability
   * - Two below: 10% probability
   * - Three+ below: 2% probability (legacy enemies)
   */
  public static getEnemyLevelWeights(floor: number): EnemyLevelWeights[] {
    const currentLevel = Math.min(Math.floor(floor), this.MAX_READING_LEVEL);
    const weights: EnemyLevelWeights[] = [];

    // Special case: Floor 1 always uses level 1
    if (floor <= 1) {
      return [{ level: 1, weight: 1.0 }];
    }

    // Check each possible level (1 to currentLevel + 1)
    for (let level = 1; level <= Math.min(currentLevel + 1, this.MAX_READING_LEVEL); level++) {
      const floorDistance = floor - level;

      // Calculate falloff probability
      let weight = 0;
      if (floorDistance === 0) {
        // Current floor level: highest probability
        weight = 0.6;
      } else if (floorDistance === -1) {
        // One level above: allow slightly harder enemies
        weight = 0.25;
      } else if (floorDistance === 1) {
        // One below: legacy enemies still appear
        weight = 0.3;
      } else if (floorDistance === 2) {
        // Two below: rare legacy encounters
        weight = 0.1;
      } else if (floorDistance >= 3) {
        // Three+ below: very rare legacy enemies
        weight = 0.02;
      }

      if (weight > 0) {
        weights.push({ level, weight });
      }
    }

    return weights;
  }

  /**
   * Sample a random enemy level from the weighted distribution
   */
  public static getRandomEnemyLevel(floor: number): number {
    const weights = this.getEnemyLevelWeights(floor);

    if (weights.length === 0) {
      return this.getWordLevelForFloor(floor);
    }

    // Weighted random selection
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const { level, weight } of weights) {
      random -= weight;
      if (random <= 0) {
        return level;
      }
    }

    // Fallback
    return this.getWordLevelForFloor(floor);
  }

  /**
   * Get recommended enemy count for a room based on floor
   * Scales with difficulty but accounts for beginner-friendly pacing
   */
  public static getEnemyCountForFloor(floor: number): { min: number; max: number } {
    if (floor <= 2) {
      // K-2nd grade: Very few enemies
      return { min: 1, max: 2 };
    } else if (floor <= 4) {
      // 3rd-4th grade: Slightly more
      return { min: 2, max: 3 };
    } else if (floor <= 10) {
      // 5th-10th grade: Progressive increase
      return { min: 2, max: 4 };
    } else {
      // Advanced: More challenging encounters
      return { min: 3, max: 5 };
    }
  }

  /**
   * Get enemy type pool for a given floor
   * Gradually introduces more complex enemy types
   */
  public static getEnemyTypePool(floor: number): string[] {
    if (floor <= 2) {
      // K-2nd grade: Only the weakest enemies
      return ['bat', 'slime']; // Bat has lowest health, slime has lowest damage
    } else if (floor <= 4) {
      // 3rd-4th grade: Add goblin
      return ['bat', 'slime', 'goblin'];
    } else if (floor <= 6) {
      // 5th-6th grade: Add skeleton
      return ['bat', 'slime', 'goblin', 'skeleton'];
    } else {
      // Advanced: Full enemy roster
      return ['bat', 'slime', 'goblin', 'skeleton', 'orc'];
    }
  }

  /**
   * Get boss configuration for a given floor
   * Bosses are significantly stronger than normal enemies
   */
  public static getBossConfig(_floor: number): BossConfig {
    // Note: Configuration is currently the same for all floors
    // Future: Could scale boss difficulty based on floor progression
    return {
      hpMultiplier: 4.5,     // 4.5x normal enemy health
      damageMultiplier: 3.5,  // 3.5x normal enemy damage
      wordLevelBoost: 1       // Boss uses current + 1 level (or mix of current/next)
    };
  }

  /**
   * Calculate boss level based on floor
   * Bosses are typically current floor level + 1
   */
  public static getBossLevel(floor: number): number {
    const normalLevel = this.getRandomEnemyLevel(floor);
    return Math.max(normalLevel + 1, Math.min(floor, this.MAX_READING_LEVEL));
  }

  /**
   * Determine if enemies should be paused during spell casting
   * Early grades (K-4) get combat pause to reduce stress
   */
  public static shouldPauseEnemiesDuringCasting(floor: number): boolean {
    return floor <= 4;
  }

  /**
   * Get drop chance multiplier for consumables
   * Increases with floor progression
   */
  public static getConsumableDropChance(floor: number, isBoss: boolean): number {
    if (isBoss) {
      return 1.0; // Bosses always drop consumables
    }
    // Regular enemies: 15% base + 1% per floor
    return 0.15 + (floor * 0.01);
  }

  /**
   * Get drop chance for runes (rare items)
   * Very low base chance, increases with floor
   */
  public static getRuneDropChance(floor: number, isBoss: boolean): number {
    let baseChance = 0.03; // 3% base
    if (isBoss) {
      baseChance = 0.15; // Bosses have higher rune drop rate
    }
    // Increase chance with floor level (up to 10% for regular, 30% for bosses)
    return Math.min(baseChance + (floor * 0.02), isBoss ? 0.30 : 0.10);
  }

  /**
   * Get human-readable name for a floor's reading level
   * Maps to grade levels (K-10th)
   */
  public static getLevelName(floor: number): string {
    const level = this.getWordLevelForFloor(floor);
    const gradeNames = [
      'Kindergarten',      // Level 1
      '1st Grade',         // Level 2
      '2nd Grade',         // Level 3
      '3rd Grade',         // Level 4
      '4th Grade',         // Level 5
      '5th Grade',         // Level 6
      '6th Grade',         // Level 7
      '7th Grade',         // Level 8
      '8th Grade',         // Level 9
      '9th Grade',         // Level 10
      '10th Grade'         // Level 11-20
    ];

    if (level <= gradeNames.length) {
      return gradeNames[level - 1];
    }
    return `${level - 1}th Grade`; // For levels beyond our array
  }

  /**
   * Get flavor text for a floor (for UI display)
   * Future: Could be data-driven for more variety
   */
  public static getFloorDescription(floor: number): string {
    const level = this.getWordLevelForFloor(floor);
    if (level <= 2) return `The dungeon begins... (Floor ${floor})`;
    if (level <= 5) return `Darkness deepens... (Floor ${floor})`;
    if (level <= 10) return `Ancient halls await... (Floor ${floor})`;
    if (level <= 15) return `Peril grows... (Floor ${floor})`;
    return `The abyss beckons... (Floor ${floor})`;
  }

  /**
   * Future (Item #11): Get progression table for all floors
   * Will return complete mapping of floors to reading levels with transitions
   */
  public static getProgressionTable(): { floor: number; level: number; isTransition: boolean }[] {
    const table: { floor: number; level: number; isTransition: boolean }[] = [];

    for (let floor = 1; floor <= this.MAX_FLOOR; floor++) {
      table.push({
        floor,
        level: this.getWordLevelForFloor(floor),
        isTransition: this.isTransitionLevel(floor)
      });
    }

    return table;
  }
}
