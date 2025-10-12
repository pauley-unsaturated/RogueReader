import { describe, it, expect, beforeEach } from 'vitest';
import { WordManager } from '@/systems/WordManager';

describe('WordManager - Boss Word Selection (Item #12)', () => {
  let wordManager: WordManager;

  beforeEach(() => {
    wordManager = new WordManager();
  });

  describe('selectWordForBoss()', () => {
    it('should select words from current or next level', () => {
      // Run 100 times to get statistical distribution
      let currentLevelCount = 0;
      let nextLevelCount = 0;

      for (let i = 0; i < 100; i++) {
        const word = wordManager.selectWordForBoss(5);
        expect(word).not.toBeNull();

        if (word) {
          // Boss words should be from level 5 (current) or level 6 (next)
          expect([5, 6]).toContain(word.level);

          if (word.level === 5) currentLevelCount++;
          if (word.level === 6) nextLevelCount++;
        }
      }

      // Verify roughly 70/30 split (with some variance)
      // Expected: 70 current, 30 next
      // Allow 60-80 current, 20-40 next for statistical variance
      expect(currentLevelCount).toBeGreaterThan(55);
      expect(currentLevelCount).toBeLessThan(85);
      expect(nextLevelCount).toBeGreaterThan(15);
      expect(nextLevelCount).toBeLessThan(45);

      console.log(`Boss word distribution (level 5): ${currentLevelCount}% current, ${nextLevelCount}% next`);
    });

    it('should not exceed max level (20)', () => {
      const word = wordManager.selectWordForBoss(20);
      expect(word).not.toBeNull();

      if (word) {
        // At level 20, should only get level 20 words (can't go to 21)
        expect(word.level).toBe(20);
      }
    });

    it('should work for early levels', () => {
      const word = wordManager.selectWordForBoss(1);
      expect(word).not.toBeNull();

      if (word) {
        // Level 1 boss: should get level 1 or 2 words
        expect([1, 2]).toContain(word.level);
      }
    });
  });

  describe('selectWordForLevel() - baseline comparison', () => {
    it('should always return same level for normal enemy selection', () => {
      // Run 50 times
      for (let i = 0; i < 50; i++) {
        const word = wordManager.selectWordForLevel(5);
        expect(word).not.toBeNull();

        if (word) {
          // Normal enemies always get exactly their level
          expect(word.level).toBe(5);
        }
      }
    });
  });
});
