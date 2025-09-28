/**
 * SpellCostSystem - Manages MP consumption for spell casting
 * Converts MP into tries (early grades) or timer duration (advanced grades)
 */

export interface SpellCostConfig {
  currentFloor: number;
  playerMP: number;
  playerMaxMP: number;
}

export interface SpellAttemptConfig {
  useTriesMode: boolean;
  maxTries?: number;
  duration?: number;
  mpCost: number;
  canCast: boolean;
  reason?: string;
}

export class SpellCostSystem {
  /**
   * Calculate spell attempt configuration based on grade level and available MP
   */
  static calculateSpellCost(config: SpellCostConfig): SpellAttemptConfig {
    const { currentFloor, playerMP } = config;

    // K-2nd Grade (Floors 1-2): Tries Mode
    if (currentFloor <= 2) {
      const mpPerSpell = 10;
      const triesPerSpell = 3;

      if (playerMP < mpPerSpell) {
        return {
          useTriesMode: true,
          canCast: false,
          mpCost: mpPerSpell,
          reason: `Need ${mpPerSpell} MP to cast (you have ${playerMP})`
        };
      }

      // Calculate how many tries the player can afford
      const spellsAvailable = Math.floor(playerMP / mpPerSpell);
      const totalTries = spellsAvailable * triesPerSpell;

      return {
        useTriesMode: true,
        maxTries: Math.min(triesPerSpell, totalTries), // Use 3 tries per spell cast
        mpCost: mpPerSpell,
        canCast: true
      };
    }

    // 3rd-4th Grade (Floors 3-4): Easier Timer Mode
    if (currentFloor <= 4) {
      const mpPerSpell = 10;
      const secondsPerSpell = 5;

      if (playerMP < mpPerSpell) {
        return {
          useTriesMode: false,
          canCast: false,
          mpCost: mpPerSpell,
          reason: `Need ${mpPerSpell} MP to cast (you have ${playerMP})`
        };
      }

      // Calculate total recording time available
      const spellsAvailable = Math.floor(playerMP / mpPerSpell);
      const totalSeconds = spellsAvailable * secondsPerSpell;

      return {
        useTriesMode: false,
        duration: Math.min(secondsPerSpell * 1000, totalSeconds * 1000), // Use 5 seconds per cast
        mpCost: mpPerSpell,
        canCast: true
      };
    }

    // 5th+ Grade (Floors 5+): Harder Timer Mode
    const mpPerSpell = 15;
    const secondsPerSpell = 5;

    if (playerMP < mpPerSpell) {
      return {
        useTriesMode: false,
        canCast: false,
        mpCost: mpPerSpell,
        reason: `Need ${mpPerSpell} MP to cast (you have ${playerMP})`
      };
    }

    // Calculate total recording time available
    const spellsAvailable = Math.floor(playerMP / mpPerSpell);
    const totalSeconds = spellsAvailable * secondsPerSpell;

    return {
      useTriesMode: false,
      duration: Math.min(secondsPerSpell * 1000, totalSeconds * 1000), // Use 5 seconds per cast
      mpCost: mpPerSpell,
      canCast: true
    };
  }

  /**
   * Get a human-readable description of the spell cost for UI
   */
  static getSpellCostDescription(currentFloor: number): string {
    if (currentFloor <= 2) {
      return "10 MP = 3 tries";
    } else if (currentFloor <= 4) {
      return "10 MP = 5 seconds";
    } else {
      return "15 MP = 5 seconds";
    }
  }

  /**
   * Calculate if player can afford to cast based on current MP
   */
  static canAffordSpell(currentFloor: number, playerMP: number): boolean {
    if (currentFloor <= 4) {
      return playerMP >= 10;
    }
    return playerMP >= 15;
  }

  /**
   * Get the MP cost for the current grade level
   */
  static getMPCost(currentFloor: number): number {
    if (currentFloor <= 4) {
      return 10;
    }
    return 15;
  }
}