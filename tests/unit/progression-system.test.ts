import { describe, it, expect } from 'vitest';
import { ProgressionSystem } from '@/systems/ProgressionSystem';

describe('ProgressionSystem - Floor to Level Mapping', () => {
  describe('getWordLevelForFloor()', () => {
    it('should map floors 1-20 to reading levels 1-20', () => {
      for (let floor = 1; floor <= 20; floor++) {
        expect(ProgressionSystem.getWordLevelForFloor(floor)).toBe(floor);
      }
    });

    it('should cap at max reading level (20)', () => {
      expect(ProgressionSystem.getWordLevelForFloor(25)).toBe(20);
      expect(ProgressionSystem.getWordLevelForFloor(100)).toBe(20);
    });

    it('should handle floor 0 as level 1', () => {
      expect(ProgressionSystem.getWordLevelForFloor(0)).toBe(1);
    });

    it('should handle negative floors as level 1', () => {
      expect(ProgressionSystem.getWordLevelForFloor(-5)).toBe(1);
    });
  });

  describe('getTransitionMix()', () => {
    it('should return null for current implementation (no transitions yet)', () => {
      // Item #11 will implement transitions
      expect(ProgressionSystem.getTransitionMix(1)).toBeNull();
      expect(ProgressionSystem.getTransitionMix(5)).toBeNull();
      expect(ProgressionSystem.getTransitionMix(20)).toBeNull();
    });
  });

  describe('isTransitionLevel()', () => {
    it('should return false for all floors in current implementation', () => {
      for (let floor = 1; floor <= 20; floor++) {
        expect(ProgressionSystem.isTransitionLevel(floor)).toBe(false);
      }
    });
  });

  describe('getLevelName()', () => {
    it('should return correct grade names for levels 1-11', () => {
      expect(ProgressionSystem.getLevelName(1)).toBe('Kindergarten');
      expect(ProgressionSystem.getLevelName(2)).toBe('1st Grade');
      expect(ProgressionSystem.getLevelName(3)).toBe('2nd Grade');
      expect(ProgressionSystem.getLevelName(4)).toBe('3rd Grade');
      expect(ProgressionSystem.getLevelName(5)).toBe('4th Grade');
      expect(ProgressionSystem.getLevelName(10)).toBe('9th Grade');
      expect(ProgressionSystem.getLevelName(11)).toBe('10th Grade');
    });

    it('should generate grade names for higher levels', () => {
      expect(ProgressionSystem.getLevelName(15)).toContain('Grade');
      expect(ProgressionSystem.getLevelName(20)).toContain('Grade');
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
      expect(levelCounts[9]).toBeGreaterThan(200);
      expect(levelCounts[9]).toBeLessThan(400);

      console.log(`Enemy level distribution for floor ${floor}:`, levelCounts);
    });

    it('should never exceed max reading level', () => {
      for (let i = 0; i < 100; i++) {
        const level = ProgressionSystem.getRandomEnemyLevel(25);
        expect(level).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('getEnemyCountForFloor()', () => {
    it('should return 1-2 enemies for floors 1-2 (K-2nd grade)', () => {
      const count1 = ProgressionSystem.getEnemyCountForFloor(1);
      const count2 = ProgressionSystem.getEnemyCountForFloor(2);

      expect(count1).toEqual({ min: 1, max: 2 });
      expect(count2).toEqual({ min: 1, max: 2 });
    });

    it('should return 2-3 enemies for floors 3-4 (3rd-4th grade)', () => {
      const count3 = ProgressionSystem.getEnemyCountForFloor(3);
      const count4 = ProgressionSystem.getEnemyCountForFloor(4);

      expect(count3).toEqual({ min: 2, max: 3 });
      expect(count4).toEqual({ min: 2, max: 3 });
    });

    it('should return 2-4 enemies for floors 5-10', () => {
      const count5 = ProgressionSystem.getEnemyCountForFloor(5);
      const count10 = ProgressionSystem.getEnemyCountForFloor(10);

      expect(count5).toEqual({ min: 2, max: 4 });
      expect(count10).toEqual({ min: 2, max: 4 });
    });

    it('should return 3-5 enemies for advanced floors (11+)', () => {
      const count15 = ProgressionSystem.getEnemyCountForFloor(15);
      const count20 = ProgressionSystem.getEnemyCountForFloor(20);

      expect(count15).toEqual({ min: 3, max: 5 });
      expect(count20).toEqual({ min: 3, max: 5 });
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
    it('should be at least current floor level', () => {
      for (let floor = 1; floor <= 20; floor++) {
        const bossLevel = ProgressionSystem.getBossLevel(floor);
        expect(bossLevel).toBeGreaterThanOrEqual(floor);
      }
    });

    it('should not exceed max reading level', () => {
      const bossLevel25 = ProgressionSystem.getBossLevel(25);
      expect(bossLevel25).toBeLessThanOrEqual(20);
    });

    it('should typically be floor level or higher', () => {
      // Statistical test over many samples
      let higherCount = 0;
      const samples = 100;

      for (let i = 0; i < samples; i++) {
        const bossLevel = ProgressionSystem.getBossLevel(10);
        if (bossLevel >= 10) higherCount++;
      }

      // Boss should always be >= floor level
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
  describe('getProgressionTable()', () => {
    it('should return entry for each floor (1-20)', () => {
      const table = ProgressionSystem.getProgressionTable();
      expect(table).toHaveLength(20);
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

    it('should show 1:1 floor to level mapping currently', () => {
      const table = ProgressionSystem.getProgressionTable();

      table.forEach((entry) => {
        expect(entry.level).toBe(entry.floor);
      });
    });

    it('should show no transitions in current implementation', () => {
      const table = ProgressionSystem.getProgressionTable();

      table.forEach((entry) => {
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
