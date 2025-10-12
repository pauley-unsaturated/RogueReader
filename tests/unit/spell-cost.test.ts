import { describe, it, expect } from 'vitest';
import { SpellCostSystem } from '@/systems/SpellCostSystem';

describe('SpellCostSystem - Timer Delay (Item #15)', () => {
  describe('Tries Mode (Floors 1-10)', () => {
    it('should use tries mode for floor 1', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 1,
        playerMP: 100,
        playerMaxMP: 100
      });

      expect(config.useTriesMode).toBe(true);
      expect(config.maxTries).toBe(3);
      expect(config.mpCost).toBe(10);
      expect(config.canCast).toBe(true);
    });

    it('should use tries mode for floor 5 (mid-early game)', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 5,
        playerMP: 50,
        playerMaxMP: 100
      });

      expect(config.useTriesMode).toBe(true);
      expect(config.maxTries).toBe(3);
      expect(config.mpCost).toBe(10);
    });

    it('should use tries mode for floor 10 (last tries-only floor)', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 10,
        playerMP: 50,
        playerMaxMP: 100
      });

      expect(config.useTriesMode).toBe(true);
      expect(config.maxTries).toBe(3);
      expect(config.mpCost).toBe(10);
    });

    it('should reject casting if not enough MP (tries mode)', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 5,
        playerMP: 5, // Not enough!
        playerMaxMP: 100
      });

      expect(config.canCast).toBe(false);
      expect(config.reason).toContain('Need 10 MP');
    });
  });

  describe('Timer Mode (Floors 11+)', () => {
    it('should use timer mode for floor 11 (first timer floor)', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 11,
        playerMP: 100,
        playerMaxMP: 100
      });

      expect(config.useTriesMode).toBe(false);
      expect(config.duration).toBe(5000); // 5 seconds in ms
      expect(config.mpCost).toBe(15); // Higher cost for timer mode
      expect(config.canCast).toBe(true);
    });

    it('should use timer mode for floor 15', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 15,
        playerMP: 50,
        playerMaxMP: 100
      });

      expect(config.useTriesMode).toBe(false);
      expect(config.duration).toBe(5000);
      expect(config.mpCost).toBe(15);
    });

    it('should reject casting if not enough MP (timer mode)', () => {
      const config = SpellCostSystem.calculateSpellCost({
        currentFloor: 15,
        playerMP: 10, // Not enough for timer mode!
        playerMaxMP: 100
      });

      expect(config.canCast).toBe(false);
      expect(config.reason).toContain('Need 15 MP');
    });
  });

  describe('Cost Description', () => {
    it('should describe tries mode correctly (floors 1-10)', () => {
      expect(SpellCostSystem.getSpellCostDescription(1)).toBe('10 MP = 3 tries');
      expect(SpellCostSystem.getSpellCostDescription(5)).toBe('10 MP = 3 tries');
      expect(SpellCostSystem.getSpellCostDescription(10)).toBe('10 MP = 3 tries');
    });

    it('should describe timer mode correctly (floors 11+)', () => {
      expect(SpellCostSystem.getSpellCostDescription(11)).toBe('15 MP = 5 seconds');
      expect(SpellCostSystem.getSpellCostDescription(20)).toBe('15 MP = 5 seconds');
    });
  });

  describe('Affordability Check', () => {
    it('should check affordability for tries mode (10 MP)', () => {
      expect(SpellCostSystem.canAffordSpell(5, 10)).toBe(true);
      expect(SpellCostSystem.canAffordSpell(5, 9)).toBe(false);
    });

    it('should check affordability for timer mode (15 MP)', () => {
      expect(SpellCostSystem.canAffordSpell(15, 15)).toBe(true);
      expect(SpellCostSystem.canAffordSpell(15, 14)).toBe(false);
    });
  });
});
