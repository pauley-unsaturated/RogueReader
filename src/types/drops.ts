/**
 * Drop System Type Definitions
 *
 * Based on LOOT_DESIGN.md specifications for enemy loot drops,
 * consumables, and rune augmentation system.
 */

import type Phaser from 'phaser';

/**
 * Drop types available in the game
 */
export type DropType = 'gold' | 'consumable' | 'rune';

/**
 * Item rarity levels affecting visual appearance and value
 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Rune slot types for equipment system
 */
export type RuneSlotType = 'prefix' | 'suffix' | 'core';

/**
 * Consumable item that can be used for healing/restoration
 */
export interface ConsumableItem {
  /** Display name for the item (e.g., "Apple", "Red Potion") */
  name: string;

  /** Amount of HP restored when consumed */
  healAmount: number;

  /** Item rarity affecting appearance and drop rate */
  rarity: Rarity;

  /** Sprite key for rendering this item */
  spriteKey: string;

  /** Reading level required (K-10) */
  readingLevel: number;
}

/**
 * Rune data for equipment augmentation system
 */
export interface RuneData {
  /** Display name (e.g., "Flame Rune", "Ice Rune") */
  name: string;

  /** Which equipment slot this rune occupies */
  type: RuneSlotType;

  /** Current level of the rune (1-3) */
  level: number;

  /** Rune rarity */
  rarity: Rarity;

  /** Sprite key for rendering */
  spriteKey: string;

  /** Reading level required */
  readingLevel: number;

  /** Effect description for UI display */
  effectDescription: string;
}

/**
 * Drop entity representing an item on the ground
 */
export interface Drop {
  /** Unique identifier for this drop instance */
  id: string;

  /** Type of drop (determines collection behavior) */
  type: DropType;

  /** Phaser sprite for rendering */
  sprite: Phaser.GameObjects.Sprite;

  /** Gold value (only for gold drops) */
  value?: number;

  /** Consumable item data (only for consumable drops) */
  item?: ConsumableItem;

  /** Rune data (only for rune drops) */
  rune?: RuneData;

  /** World position */
  position: { x: number; y: number };

  /** Whether player can collect this drop (false during bounce animation) */
  isCollectable: boolean;

  /** Whether this is the first time player has seen this item type */
  firstTimePickup: boolean;

  /** Magnetism radius for gold auto-collection (default: 48px = 1 tile) */
  magnetRadius?: number;

  /** Timestamp when drop was created (for cleanup) */
  spawnTime: number;
}

/**
 * Configuration for drop spawn behavior
 */
export interface DropSpawnConfig {
  /** Number of drops to spawn */
  count: number;

  /** Angle offset for circular placement (radians) */
  angleOffset?: number;

  /** Base distance from spawn point (pixels) */
  distance: number;

  /** Randomness factor for distance */
  distanceVariance: number;

  /** Initial velocity for arc trajectory */
  velocity: {
    /** X velocity component */
    x: number;
    /** Y velocity component */
    y: number;
  };

  /** Initial rotation (radians) */
  rotation?: number;
}

/**
 * Drop table entry defining probability and configuration
 */
export interface DropTableEntry {
  /** Type of drop */
  type: DropType;

  /** Probability weight (0-1) */
  chance: number;

  /** Specific item/rune name (optional) */
  itemName?: string;

  /** Quantity range */
  quantityMin?: number;
  quantityMax?: number;

  /** Forced rarity (optional, otherwise random by rarity weights) */
  forcedRarity?: Rarity;
}

/**
 * Enemy drop configuration
 */
export interface EnemyDropConfig {
  /** Enemy type identifier */
  enemyType: string;

  /** Base gold drop range */
  goldBase: { min: number; max: number };

  /** Chance to drop consumable (0-1) */
  consumableChance: number;

  /** Chance to drop rune (0-1) */
  runeChance: number;

  /** Special behavior notes */
  specialBehavior?: string;

  /** Whether this is a boss enemy (guaranteed multiple drops) */
  isBoss?: boolean;
}

/**
 * Defines consumable item templates
 */
export const CONSUMABLE_TEMPLATES: Record<string, Omit<ConsumableItem, 'spriteKey'>> = {
  apple: {
    name: 'Apple',
    healAmount: 10,
    rarity: 'common',
    readingLevel: 1,
  },
  bread: {
    name: 'Bread',
    healAmount: 12,
    rarity: 'common',
    readingLevel: 1,
  },
  cheese: {
    name: 'Cheese',
    healAmount: 10,
    rarity: 'common',
    readingLevel: 2,
  },
  redPotion: {
    name: 'Red Potion',
    healAmount: 25,
    rarity: 'rare',
    readingLevel: 3,
  },
  bluePotion: {
    name: 'Blue Potion',
    healAmount: 25,
    rarity: 'rare',
    readingLevel: 3,
  },
  fairy: {
    name: 'Healing Fairy',
    healAmount: 50,
    rarity: 'epic',
    readingLevel: 4,
  },
};

/**
 * Defines rune templates for augmentation system
 */
export const RUNE_TEMPLATES: Record<string, Omit<RuneData, 'spriteKey' | 'level'>> = {
  flame: {
    name: 'Flame Rune',
    type: 'prefix',
    rarity: 'common',
    readingLevel: 2,
    effectDescription: '+25% fire damage per level',
  },
  ice: {
    name: 'Ice Rune',
    type: 'prefix',
    rarity: 'common',
    readingLevel: 2,
    effectDescription: '+15% casting speed per level',
  },
  big: {
    name: 'Big Rune',
    type: 'prefix',
    rarity: 'common',
    readingLevel: 1,
    effectDescription: '+40% damage per level',
  },
  blast: {
    name: 'Blast Rune',
    type: 'suffix',
    rarity: 'rare',
    readingLevel: 3,
    effectDescription: 'Hits +1 enemy per level',
  },
  heal: {
    name: 'Heal Rune',
    type: 'suffix',
    rarity: 'epic',
    readingLevel: 3,
    effectDescription: '+5 HP when casting per level',
  },
  shield: {
    name: 'Shield Rune',
    type: 'suffix',
    rarity: 'epic',
    readingLevel: 3,
    effectDescription: '+3 shield per level',
  },
  echo: {
    name: 'Echo Rune',
    type: 'core',
    rarity: 'rare',
    readingLevel: 4,
    effectDescription: 'Spell repeats +1 time per level',
  },
  power: {
    name: 'Power Rune',
    type: 'core',
    rarity: 'common',
    readingLevel: 2,
    effectDescription: '+30% overall damage per level',
  },
};

/**
 * Enemy drop tables defining what each enemy type can drop
 */
export const ENEMY_DROP_TABLES: Record<string, EnemyDropConfig> = {
  goblin: {
    enemyType: 'goblin',
    goldBase: { min: 3, max: 5 },
    consumableChance: 0.15,
    runeChance: 0.03,
    specialBehavior: 'Fast gold magnet',
  },
  bat: {
    enemyType: 'bat',
    goldBase: { min: 2, max: 4 },
    consumableChance: 0.10,
    runeChance: 0.02,
    specialBehavior: 'Small burst radius',
  },
  skeleton: {
    enemyType: 'skeleton',
    goldBase: { min: 4, max: 6 },
    consumableChance: 0.20,
    runeChance: 0.05,
    specialBehavior: '+Bread chance',
  },
  slime: {
    enemyType: 'slime',
    goldBase: { min: 3, max: 5 },
    consumableChance: 0.25,
    runeChance: 0.03,
    specialBehavior: '+Potion chance',
  },
  orc: {
    enemyType: 'orc',
    goldBase: { min: 6, max: 8 },
    consumableChance: 0.20,
    runeChance: 0.07,
    specialBehavior: '+Rune chance',
  },
  demon: {
    enemyType: 'demon',
    goldBase: { min: 8, max: 12 },
    consumableChance: 0.30,
    runeChance: 0.10,
    specialBehavior: 'Guaranteed rare+',
  },
  boss: {
    enemyType: 'boss',
    goldBase: { min: 20, max: 30 },
    consumableChance: 1.0, // 100% guaranteed
    runeChance: 0.5, // 50% chance
    isBoss: true,
    specialBehavior: '3-5 guaranteed items',
  },
};
