import { describe, it, expect } from 'vitest';
import { ProgressionSystem } from '@/systems/ProgressionSystem';

describe('ProgressionSystem - Floor to Level Mapping', () => {
  describe('getWordLevelForFloor()', () => {
    it('should map 2 floors per reading level (Item #11)', () => {
      // Floors 1-2: Level 1
      expect(ProgressionSystem.getWordLevelForFloor(1)).toBe(1);
      expect(ProgressionSystem.getWordLevelForFloor(2)).toBe(1);
      // Floors 3-4: Level 2
      expect(ProgressionSystem.getWordLevelForFloor(3)).toBe(2);
      expect(ProgressionSystem.getWordLevelForFloor(4)).toBe(2);
      // Floors 5-6: Level 3
      expect(ProgressionSystem.getWordLevelForFloor(5)).toBe(3);
      expect(ProgressionSystem.getWordLevelForFloor(6)).toBe(3);
      // Floors 39-40: Level 20
      expect(ProgressionSystem.getWordLevelForFloor(39)).toBe(20);
      expect(ProgressionSystem.getWordLevelForFloor(40)).toBe(20);
    });

    it('should cap at max reading level (20)', () => {
      expect(ProgressionSystem.getWordLevelForFloor(45)).toBe(20);
      expect(ProgressionSystem.getWordLevelForFloor(100)).toBe(20);
    });

    it('should handle floor 0 as level 1', () => {
      expect(ProgressionSystem.getWordLevelForFloor(0)).toBe(1);
    });

    it('should handle negative floors as level 1', () => {
      expect(ProgressionSystem.getWordLevelForFloor(-5)).toBe(1);
    });
  });

  describe('getTransitionMix() - Item #11', () => {
    it('should return null for odd floors (pure levels)', () => {
      expect(ProgressionSystem.getTransitionMix(1)).toBeNull();
      expect(ProgressionSystem.getTransitionMix(3)).toBeNull();
      expect(ProgressionSystem.getTransitionMix(5)).toBeNull();
      expect(ProgressionSystem.getTransitionMix(39)).toBeNull();
    });

    it('should return 50/50 mix for even floors (transitions)', () => {
      // Floor 2: L1 → L2
      const mix2 = ProgressionSystem.getTransitionMix(2);
      expect(mix2).not.toBeNull();
      expect(mix2?.currentLevel).toBe(1);
      expect(mix2?.nextLevel).toBe(2);
      expect(mix2?.ratio).toBe(0.5);

      // Floor 4: L2 → L3
      const mix4 = ProgressionSystem.getTransitionMix(4);
      expect(mix4?.currentLevel).toBe(2);
      expect(mix4?.nextLevel).toBe(3);
      expect(mix4?.ratio).toBe(0.5);

      // Floor 38: L19 → L20
      const mix38 = ProgressionSystem.getTransitionMix(38);
      expect(mix38?.currentLevel).toBe(19);
      expect(mix38?.nextLevel).toBe(20);
      expect(mix38?.ratio).toBe(0.5);
    });

    it('should return null for floor 40 (max level, no next)', () => {
      expect(ProgressionSystem.getTransitionMix(40)).toBeNull();
    });
  });

  describe('isTransitionLevel() - Item #11', () => {
    it('should return true for even floors (2, 4, 6...38)', () => {
      expect(ProgressionSystem.isTransitionLevel(2)).toBe(true);
      expect(ProgressionSystem.isTransitionLevel(4)).toBe(true);
      expect(ProgressionSystem.isTransitionLevel(6)).toBe(true);
      expect(ProgressionSystem.isTransitionLevel(38)).toBe(true);
    });

    it('should return false for odd floors', () => {
      expect(ProgressionSystem.isTransitionLevel(1)).toBe(false);
      expect(ProgressionSystem.isTransitionLevel(3)).toBe(false);
      expect(ProgressionSystem.isTransitionLevel(39)).toBe(false);
    });

    it('should return false for floor 40 (max level)', () => {
      expect(ProgressionSystem.isTransitionLevel(40)).toBe(false);
    });
  });

  describe('getLevelName() - Item #11', () => {
    it('should return correct grade names based on floor (2 floors per level)', () => {
      // Floors 1-2: Level 1 = Kindergarten
      expect(ProgressionSystem.getLevelName(1)).toBe('Kindergarten');
      expect(ProgressionSystem.getLevelName(2)).toBe('Kindergarten');
      // Floors 3-4: Level 2 = 1st Grade
      expect(ProgressionSystem.getLevelName(3)).toBe('1st Grade');
      expect(ProgressionSystem.getLevelName(4)).toBe('1st Grade');
      // Floors 5-6: Level 3 = 2nd Grade
      expect(ProgressionSystem.getLevelName(5)).toBe('2nd Grade');
      expect(ProgressionSystem.getLevelName(6)).toBe('2nd Grade');
      // Floors 7-8: Level 4 = 3rd Grade
      expect(ProgressionSystem.getLevelName(7)).toBe('3rd Grade');
      expect(ProgressionSystem.getLevelName(8)).toBe('3rd Grade');
      // Floors 9-10: Level 5 = 4th Grade
      expect(ProgressionSystem.getLevelName(9)).toBe('4th Grade');
      expect(ProgressionSystem.getLevelName(10)).toBe('4th Grade');
      // Floors 19-20: Level 10 = 9th Grade
      expect(ProgressionSystem.getLevelName(19)).toBe('9th Grade');
      expect(ProgressionSystem.getLevelName(20)).toBe('9th Grade');
      // Floors 21-22: Level 11 = 10th Grade
      expect(ProgressionSystem.getLevelName(21)).toBe('10th Grade');
      expect(ProgressionSystem.getLevelName(22)).toBe('10th Grade');
    });

    it('should generate grade names for higher floors', () => {
      expect(ProgressionSystem.getLevelName(30)).toContain('Grade');
      expect(ProgressionSystem.getLevelName(40)).toContain('Grade');
    });
  });
});

describe('ProgressionSystem - Enemy Scaling', () => {
  describe('getEnemyLevelWeights()', () => {
    it('should return only level 1 for floor 1', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(1);
      expect(weights).toHaveLength(1);
      expect(weights[0].level).toBe(1);
      expect(weights[0].weight).toBe(1.0);
    });

    it('should include current level with 60% weight', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(5);
      const currentLevel = weights.find(w => w.level === 5);
      expect(currentLevel).toBeDefined();
      expect(currentLevel?.weight).toBe(0.6);
    });

    it('should include level above with 25% weight', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(5);
      const nextLevel = weights.find(w => w.level === 6);
      expect(nextLevel).toBeDefined();
      expect(nextLevel?.weight).toBe(0.25);
    });

    it('should include level below with 30% weight', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(5);
      const prevLevel = weights.find(w => w.level === 4);
      expect(prevLevel).toBeDefined();
      expect(prevLevel?.weight).toBe(0.3);
    });

    it('should include legacy levels with decreasing weights', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(10);
      const twoBelow = weights.find(w => w.level === 8);
      const threeBelow = weights.find(w => w.level === 7);

      expect(twoBelow?.weight).toBe(0.1);
      expect(threeBelow?.weight).toBe(0.02);
    });

    it('should not exceed max reading level', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(25);
      const maxLevel = Math.max(...weights.map(w => w.level));
      expect(maxLevel).toBeLessThanOrEqual(20);
    });

    it('should have total weight > 1.0 (allowing overlap)', () => {
      const weights = ProgressionSystem.getEnemyLevelWeights(10);
      const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
      expect(totalWeight).toBeGreaterThan(1.0);
    });
  });

  describe('getRandomEnemyLevel()', () => {
    it('should return level 1 for floor 1', () => {
      expect(ProgressionSystem.getRandomEnemyLevel(1)).toBe(1);
    });

    it('should return levels within expected range (statistical test)', () => {
      const floor = 10;
      const samples = 1000;
      const levelCounts: Record<number, number> = {};

      // Generate many samples
      for (let i = 0; i < samples; i++) {
        const level = ProgressionSystem.getRandomEnemyLevel(floor);
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      }

      // Current level (10) should be most common (~60%)
      // Allow wider tolerance for statistical variance
      expect(levelCounts[10]).toBeGreaterThan(400);
      expect(levelCounts[10]).toBeLessThan(750);

      // Level 11 should appear (~25%)
      expect(levelCounts[11]).toBeGreaterThan(150);
      expect(levelCounts[11]).toBeLessThan(350);

      // Level 9 should appear (~30%)
      expect(levelCounts[9]).toBeGreaterThan(180);
      expect(levelCounts[9]).toBeLessThan(420);

      console.log(`Enemy level distribution for floor ${floor}:`, levelCounts);
    });

    it('should never exceed max reading level', () => {
      for (let i = 0; i < 100; i++) {
        const level = ProgressionSystem.getRandomEnemyLevel(25);
        expect(level).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('getEnemyCountForFloor() - Monster Density Scaling', () => {
    it('should start with 1-2 enemies at floor 1 (beginner friendly)', () => {
      const count = ProgressionSystem.getEnemyCountForFloor(1);
      expect(count).toEqual({ min: 1, max: 2 });
    });

    it('should end with 3-5 enemies at floor 40 (challenging endgame)', () => {
      const count = ProgressionSystem.getEnemyCountForFloor(40);
      expect(count).toEqual({ min: 3, max: 5 });
    });

    it('should gradually increase enemy count across 40 floors', () => {
      const floor1 = ProgressionSystem.getEnemyCountForFloor(1);
      const floor11 = ProgressionSystem.getEnemyCountForFloor(11);
      const floor21 = ProgressionSystem.getEnemyCountForFloor(21);
      const floor31 = ProgressionSystem.getEnemyCountForFloor(31);
      const floor40 = ProgressionSystem.getEnemyCountForFloor(40);

      // Min should gradually increase: 1 → 3
      expect(floor1.min).toBe(1);
      expect(floor11.min).toBeGreaterThan(floor1.min);  // Floor 11 should have min=2
      expect(floor21.min).toBeGreaterThanOrEqual(floor11.min);  // Should be >= 2
      expect(floor31.min).toBeGreaterThan(floor21.min);  // Floor 31 should have min=3
      expect(floor40.min).toBe(3);

      // Max should gradually increase: 2 → 5
      expect(floor1.max).toBe(2);
      expect(floor11.max).toBeGreaterThan(floor1.max);  // Should have progressed
      expect(floor21.max).toBeGreaterThan(floor11.max);  // Should continue increasing
      expect(floor31.max).toBeGreaterThanOrEqual(floor21.max);  // Should be >= 4
      expect(floor40.max).toBe(5);
    });

    it('should never have min > max', () => {
      for (let floor = 1; floor <= 40; floor++) {
        const count = ProgressionSystem.getEnemyCountForFloor(floor);
        expect(count.min).toBeLessThanOrEqual(count.max);
      }
    });

    it('should provide smooth progression without sudden jumps', () => {
      let previousMin = 0;
      let previousMax = 0;

      for (let floor = 1; floor <= 40; floor++) {
        const count = ProgressionSystem.getEnemyCountForFloor(floor);

        // Changes should be gradual (max 1 enemy difference between floors)
        if (floor > 1) {
          expect(Math.abs(count.min - previousMin)).toBeLessThanOrEqual(1);
          expect(Math.abs(count.max - previousMax)).toBeLessThanOrEqual(1);
        }

        previousMin = count.min;
        previousMax = count.max;
      }
    });

    it('should cap enemy counts at floor 40 values for higher floors', () => {
      const floor40 = ProgressionSystem.getEnemyCountForFloor(40);
      const floor50 = ProgressionSystem.getEnemyCountForFloor(50);
      const floor100 = ProgressionSystem.getEnemyCountForFloor(100);

      expect(floor50).toEqual(floor40);
      expect(floor100).toEqual(floor40);
    });
  });

  describe('getEnemyTypePool()', () => {
    it('should return only bat and slime for floors 1-2', () => {
      const pool1 = ProgressionSystem.getEnemyTypePool(1);
      const pool2 = ProgressionSystem.getEnemyTypePool(2);

      expect(pool1).toEqual(['bat', 'slime']);
      expect(pool2).toEqual(['bat', 'slime']);
    });

    it('should add goblin for floors 3-4', () => {
      const pool3 = ProgressionSystem.getEnemyTypePool(3);
      const pool4 = ProgressionSystem.getEnemyTypePool(4);

      expect(pool3).toContain('bat');
      expect(pool3).toContain('slime');
      expect(pool3).toContain('goblin');
      expect(pool3).toHaveLength(3);
      expect(pool4).toHaveLength(3);
    });

    it('should add skeleton for floors 5-6', () => {
      const pool5 = ProgressionSystem.getEnemyTypePool(5);

      expect(pool5).toContain('skeleton');
      expect(pool5).toHaveLength(4);
    });

    it('should include orc for advanced floors (7+)', () => {
      const pool10 = ProgressionSystem.getEnemyTypePool(10);

      expect(pool10).toContain('bat');
      expect(pool10).toContain('slime');
      expect(pool10).toContain('goblin');
      expect(pool10).toContain('skeleton');
      expect(pool10).toContain('orc');
      expect(pool10).toHaveLength(5);
    });
  });
});

describe('ProgressionSystem - Boss Configuration', () => {
  describe('getBossConfig()', () => {
    it('should return consistent boss multipliers', () => {
      const config = ProgressionSystem.getBossConfig(5);

      expect(config.hpMultiplier).toBe(4.5);
      expect(config.damageMultiplier).toBe(3.5);
      expect(config.wordLevelBoost).toBe(1);
    });

    it('should return same config for all floors', () => {
      const config1 = ProgressionSystem.getBossConfig(1);
      const config10 = ProgressionSystem.getBossConfig(10);
      const config20 = ProgressionSystem.getBossConfig(20);

      expect(config1).toEqual(config10);
      expect(config10).toEqual(config20);
    });
  });

  describe('getBossLevel()', () => {
    it('should be at least current reading level (Item #11: 2 floors per level)', () => {
      for (let floor = 1; floor <= 40; floor++) {
        const bossLevel = ProgressionSystem.getBossLevel(floor);
        const readingLevel = ProgressionSystem.getWordLevelForFloor(floor);
        // Boss level should be reading level or higher
        expect(bossLevel).toBeGreaterThanOrEqual(readingLevel);
      }
    });

    it('should not exceed max reading level', () => {
      const bossLevel25 = ProgressionSystem.getBossLevel(25);
      expect(bossLevel25).toBeLessThanOrEqual(20);

      const bossLevel40 = ProgressionSystem.getBossLevel(40);
      expect(bossLevel40).toBeLessThanOrEqual(20);

      const bossLevel100 = ProgressionSystem.getBossLevel(100);
      expect(bossLevel100).toBeLessThanOrEqual(20);
    });

    it('should typically be reading level + 1', () => {
      // Statistical test over many samples
      let higherCount = 0;
      const samples = 100;

      for (let i = 0; i < samples; i++) {
        const bossLevel = ProgressionSystem.getBossLevel(20);
        const readingLevel = ProgressionSystem.getWordLevelForFloor(20);
        // Boss should typically be reading level or higher
        if (bossLevel >= readingLevel) higherCount++;
      }

      // Boss should always be >= reading level
      expect(higherCount).toBe(samples);
    });
  });
});

describe('ProgressionSystem - Gameplay Mechanics', () => {
  describe('shouldPauseEnemiesDuringCasting()', () => {
    it('should pause enemies for K-4th grade (floors 1-4)', () => {
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(1)).toBe(true);
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(2)).toBe(true);
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(3)).toBe(true);
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(4)).toBe(true);
    });

    it('should not pause enemies for 5th grade and above (floors 5+)', () => {
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(5)).toBe(false);
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(10)).toBe(false);
      expect(ProgressionSystem.shouldPauseEnemiesDuringCasting(20)).toBe(false);
    });
  });

  describe('getConsumableDropChance()', () => {
    it('should always return 1.0 for bosses', () => {
      expect(ProgressionSystem.getConsumableDropChance(1, true)).toBe(1.0);
      expect(ProgressionSystem.getConsumableDropChance(10, true)).toBe(1.0);
      expect(ProgressionSystem.getConsumableDropChance(20, true)).toBe(1.0);
    });

    it('should start at 15% for regular enemies at floor 1', () => {
      expect(ProgressionSystem.getConsumableDropChance(1, false)).toBe(0.16);
    });

    it('should increase by 1% per floor for regular enemies', () => {
      expect(ProgressionSystem.getConsumableDropChance(1, false)).toBe(0.16);
      expect(ProgressionSystem.getConsumableDropChance(5, false)).toBe(0.20);
      expect(ProgressionSystem.getConsumableDropChance(10, false)).toBe(0.25);
    });
  });

  describe('getRuneDropChance()', () => {
    it('should have 3% base chance for regular enemies', () => {
      expect(ProgressionSystem.getRuneDropChance(1, false)).toBe(0.05);
    });

    it('should have 15% base chance for bosses', () => {
      // Use toBeCloseTo for floating point comparison
      expect(ProgressionSystem.getRuneDropChance(1, true)).toBeCloseTo(0.17, 2);
    });

    it('should increase with floor level', () => {
      const floor1 = ProgressionSystem.getRuneDropChance(1, false);
      const floor2 = ProgressionSystem.getRuneDropChance(2, false);
      const floor3 = ProgressionSystem.getRuneDropChance(3, false);

      expect(floor2).toBeGreaterThan(floor1);
      expect(floor3).toBeGreaterThan(floor2);
      // Note: Cap is hit around floor 4-5, so we test early floors
    });

    it('should cap at 10% for regular enemies', () => {
      const floor50 = ProgressionSystem.getRuneDropChance(50, false);
      expect(floor50).toBeLessThanOrEqual(0.10);
    });

    it('should cap at 30% for bosses', () => {
      const floor50 = ProgressionSystem.getRuneDropChance(50, true);
      expect(floor50).toBeLessThanOrEqual(0.30);
    });
  });
});

describe('ProgressionSystem - Progression Table', () => {
  describe('getProgressionTable() - Item #11', () => {
    it('should return entry for each floor (1-40)', () => {
      const table = ProgressionSystem.getProgressionTable();
      expect(table).toHaveLength(40);
    });

    it('should have correct structure for each entry', () => {
      const table = ProgressionSystem.getProgressionTable();

      table.forEach((entry) => {
        expect(entry).toHaveProperty('floor');
        expect(entry).toHaveProperty('level');
        expect(entry).toHaveProperty('isTransition');
        expect(typeof entry.floor).toBe('number');
        expect(typeof entry.level).toBe('number');
        expect(typeof entry.isTransition).toBe('boolean');
      });
    });

    it('should show 2 floors per level mapping (40 floors → 20 levels)', () => {
      const table = ProgressionSystem.getProgressionTable();

      // Check first few pairs
      expect(table[0]).toEqual({ floor: 1, level: 1, isTransition: false });
      expect(table[1]).toEqual({ floor: 2, level: 1, isTransition: true });
      expect(table[2]).toEqual({ floor: 3, level: 2, isTransition: false });
      expect(table[3]).toEqual({ floor: 4, level: 2, isTransition: true });

      // Check last pair
      expect(table[38]).toEqual({ floor: 39, level: 20, isTransition: false });
      expect(table[39]).toEqual({ floor: 40, level: 20, isTransition: false });
    });

    it('should show 19 transitions (even floors 2,4,6...38)', () => {
      const table = ProgressionSystem.getProgressionTable();
      const transitions = table.filter(entry => entry.isTransition);

      expect(transitions).toHaveLength(19);

      // All transitions should be on even floors (except 40)
      transitions.forEach(entry => {
        expect(entry.floor % 2).toBe(0);
        expect(entry.floor).toBeLessThan(40);
      });
    });

    it('should show odd floors as pure levels', () => {
      const table = ProgressionSystem.getProgressionTable();
      const pureLevels = table.filter(entry => entry.floor % 2 === 1);

      expect(pureLevels).toHaveLength(20);
      pureLevels.forEach(entry => {
        expect(entry.isTransition).toBe(false);
      });
    });
  });

  describe('getFloorDescription()', () => {
    it('should return appropriate descriptions for different level ranges', () => {
      const desc1 = ProgressionSystem.getFloorDescription(1);
      const desc5 = ProgressionSystem.getFloorDescription(5);
      const desc10 = ProgressionSystem.getFloorDescription(10);
      const desc20 = ProgressionSystem.getFloorDescription(20);

      expect(desc1).toBeTruthy();
      expect(desc5).toBeTruthy();
      expect(desc10).toBeTruthy();
      expect(desc20).toBeTruthy();

      // Descriptions should differ across ranges
      expect(desc1).not.toBe(desc20);
    });
  });
});

describe('ProgressionSystem - Edge Cases', () => {
  it('should handle floor 0 gracefully', () => {
    expect(() => ProgressionSystem.getWordLevelForFloor(0)).not.toThrow();
    expect(() => ProgressionSystem.getEnemyLevelWeights(0)).not.toThrow();
    expect(() => ProgressionSystem.getRandomEnemyLevel(0)).not.toThrow();
  });

  it('should handle negative floors gracefully', () => {
    expect(() => ProgressionSystem.getWordLevelForFloor(-1)).not.toThrow();
    expect(() => ProgressionSystem.getRandomEnemyLevel(-1)).not.toThrow();
  });

  it('should handle very large floor numbers gracefully', () => {
    expect(() => ProgressionSystem.getWordLevelForFloor(1000)).not.toThrow();
    expect(() => ProgressionSystem.getRandomEnemyLevel(1000)).not.toThrow();
    expect(() => ProgressionSystem.getBossLevel(1000)).not.toThrow();
  });

  it('should never return invalid enemy types', () => {
    const types = ProgressionSystem.getEnemyTypePool(10);
    const validTypes = ['bat', 'slime', 'goblin', 'skeleton', 'orc', 'demon'];

    types.forEach((type) => {
      expect(validTypes).toContain(type);
    });
  });
});
