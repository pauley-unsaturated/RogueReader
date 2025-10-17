/**
 * DropManager - Handles enemy loot drops, collection, and rewards
 *
 * Phase 1 Implementation:
 * - Drop spawning from enemy deaths
 * - Gold auto-collection with 1-tile magnetism
 * - Manual item/rune pickup with E key
 * - First-time reading gate for items
 * - Floating text feedback
 * - Integration with inventory system
 */

import Phaser from 'phaser';
import type { GameScene } from '../scenes/GameScene';
import type {
  Drop,
  DropType,
  ConsumableItem,
  RuneData,
  Rarity,
} from '../types/drops';
import {
  CONSUMABLE_TEMPLATES,
  RUNE_TEMPLATES,
  ENEMY_DROP_TABLES,
} from '../types/drops';

/**
 * Configuration constants for drop system
 */
const DROP_CONFIG = {
  /** Magnetism radius for gold collection (1 tile = 48px) */
  GOLD_MAGNET_RADIUS: 48,

  /** How long drops remain on ground before showing warning (ms) */
  DROP_LIFETIME_WARNING: 30000, // 30 seconds

  /** Maximum number of drops on screen before combining */
  MAX_DROPS_ON_SCREEN: 20,

  /** Distance drops spawn from enemy (pixels) */
  DROP_SPAWN_DISTANCE_BASE: 32,
  DROP_SPAWN_DISTANCE_VARIANCE: 16,

  /** Time before drops become collectable after spawn (ms) */
  DROP_BOUNCE_DURATION: 500,

  /** Tween duration for gold flying to player (ms) */
  GOLD_COLLECT_TWEEN_DURATION: 300,

  /** Tween duration for item pickup animation (ms) */
  ITEM_COLLECT_TWEEN_DURATION: 300,
} as const;

/**
 * Manages all drop-related functionality
 */
export class DropManager {
  private scene: GameScene;
  private drops: Map<string, Drop> = new Map();
  private firstTimePickups: Set<string> = new Set();
  private dropIdCounter: number = 0;

  // Sprite groups for efficient rendering
  private goldGroup: Phaser.GameObjects.Group;
  private itemGroup: Phaser.GameObjects.Group;
  private runeGroup: Phaser.GameObjects.Group;

  constructor(scene: GameScene) {
    this.scene = scene;

    // Create sprite groups
    this.goldGroup = this.scene.add.group();
    this.itemGroup = this.scene.add.group();
    this.runeGroup = this.scene.add.group();

    console.log('DropManager initialized');
  }

  /**
   * Main update loop - handles magnetism and cleanup
   */
  public update(_delta: number): void {
    const playerPos = this.getPlayerPosition();
    if (!playerPos) return;

    this.drops.forEach((drop) => {
      if (!drop.isCollectable) return;

      // Handle gold magnetism (auto-collection)
      if (drop.type === 'gold') {
        const distance = Phaser.Math.Distance.Between(
          drop.position.x,
          drop.position.y,
          playerPos.x,
          playerPos.y
        );

        if (distance <= DROP_CONFIG.GOLD_MAGNET_RADIUS) {
          this.collectGold(drop);
        }
      }

      // Check for timeout warning (optional Phase 2 feature)
      const age = Date.now() - drop.spawnTime;
      if (age > DROP_CONFIG.DROP_LIFETIME_WARNING) {
        this.showDropWarning(drop);
      }
    });
  }

  /**
   * Spawn drops from defeated enemy
   * @param enemyX - Enemy X position
   * @param enemyY - Enemy Y position
   * @param enemyType - Type of enemy for drop table lookup
   * @param isBoss - Whether this was a boss enemy
   */
  public spawnDropsFromEnemy(
    enemyX: number,
    enemyY: number,
    enemyType: string,
    isBoss: boolean = false
  ): void {
    console.log(`💰 Spawning drops from ${enemyType} at (${enemyX}, ${enemyY})`);

    const dropConfig = ENEMY_DROP_TABLES[enemyType] || ENEMY_DROP_TABLES.goblin;
    const dropsToSpawn: Array<{ type: DropType; data: any }> = [];

    // 1. GOLD DROP (guaranteed for non-boss enemies)
    if (!isBoss) {
      const goldAmount = Phaser.Math.Between(
        dropConfig.goldBase.min,
        dropConfig.goldBase.max
      );
      dropsToSpawn.push({ type: 'gold', data: { value: goldAmount } });
    }

    // 2. CONSUMABLE DROP (chance-based or guaranteed for bosses)
    if (Math.random() < dropConfig.consumableChance) {
      const consumable = this.selectRandomConsumable();
      if (consumable) {
        dropsToSpawn.push({ type: 'consumable', data: consumable });
      }
    }

    // 3. RUNE DROP (rare, higher chance for bosses)
    if (Math.random() < dropConfig.runeChance) {
      const rune = this.selectRandomRune();
      if (rune) {
        dropsToSpawn.push({ type: 'rune', data: rune });
      }
    }

    // 4. BOSS BONUS DROPS (3-5 guaranteed items)
    if (isBoss) {
      const bonusCount = Phaser.Math.Between(3, 5);
      for (let i = 0; i < bonusCount; i++) {
        const goldAmount = Phaser.Math.Between(5, 15);
        dropsToSpawn.push({ type: 'gold', data: { value: goldAmount } });
      }

      // Guaranteed rare+ consumable
      const rareConsumable = this.selectRandomConsumable('rare');
      if (rareConsumable) {
        dropsToSpawn.push({ type: 'consumable', data: rareConsumable });
      }
    }

    // Spawn all drops in a circular pattern
    this.spawnDropsInCircle(enemyX, enemyY, dropsToSpawn);
  }

  /**
   * Spawn multiple drops in a circular pattern around a point
   */
  private spawnDropsInCircle(
    x: number,
    y: number,
    drops: Array<{ type: DropType; data: any }>
  ): void {
    const dropCount = drops.length;
    if (dropCount === 0) return;

    const angleStep = (Math.PI * 2) / dropCount;

    drops.forEach((dropData, index) => {
      const angle = angleStep * index + Math.random() * 0.3; // Add randomness
      const distance =
        DROP_CONFIG.DROP_SPAWN_DISTANCE_BASE +
        Math.random() * DROP_CONFIG.DROP_SPAWN_DISTANCE_VARIANCE;

      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      this.createDrop(
        dropData.type,
        x,
        y,
        targetX,
        targetY,
        dropData.data
      );
    });
  }

  /**
   * Create a single drop entity
   */
  private createDrop(
    type: DropType,
    spawnX: number,
    spawnY: number,
    targetX: number,
    targetY: number,
    data: any
  ): void {
    const dropId = `drop_${this.dropIdCounter++}`;

    // Create sprite (placeholder for now - Phase 2 will add real sprites)
    let sprite: Phaser.GameObjects.Sprite;
    let spriteColor = 0xffffff;

    switch (type) {
      case 'gold':
        spriteColor = 0xffd700; // Gold color
        sprite = this.scene.add.sprite(spawnX, spawnY, '');
        sprite.setTint(spriteColor);
        this.goldGroup.add(sprite);
        break;

      case 'consumable':
        spriteColor = this.getRarityColor(data.rarity);
        sprite = this.scene.add.sprite(spawnX, spawnY, '');
        sprite.setTint(spriteColor);
        this.itemGroup.add(sprite);
        break;

      case 'rune':
        spriteColor = this.getRarityColor(data.rarity);
        sprite = this.scene.add.sprite(spawnX, spawnY, '');
        sprite.setTint(spriteColor);
        this.runeGroup.add(sprite);
        break;

      default:
        console.error(`Unknown drop type: ${type}`);
        return;
    }

    // Create placeholder circle for now
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(spriteColor, 1);
    graphics.fillCircle(spawnX, spawnY, 12);
    graphics.setDepth(50);

    // Create drop data
    const drop: Drop = {
      id: dropId,
      type,
      sprite,
      value: data.value,
      item: data.name ? this.createConsumableItem(data) : undefined,
      rune: data.type ? this.createRuneData(data) : undefined,
      position: { x: targetX, y: targetY },
      isCollectable: false,
      firstTimePickup: false,
      magnetRadius: type === 'gold' ? DROP_CONFIG.GOLD_MAGNET_RADIUS : undefined,
      spawnTime: Date.now(),
    };

    // Add to map
    this.drops.set(dropId, drop);

    // Animate drop with arc trajectory
    this.scene.tweens.add({
      targets: [sprite, graphics],
      x: targetX,
      y: targetY,
      duration: DROP_CONFIG.DROP_BOUNCE_DURATION,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        drop.isCollectable = true;
        console.log(`✅ Drop ${dropId} is now collectable`);
      },
    });

    console.log(`Created drop: ${dropId} (${type})`);
  }

  /**
   * Collect a gold drop (auto-collection via magnetism)
   */
  private collectGold(drop: Drop): void {
    if (!drop.value) return;

    console.log(`💰 Collecting ${drop.value} gold`);

    const playerPos = this.getPlayerPosition();
    if (!playerPos) return;

    // Tween gold to player
    this.scene.tweens.add({
      targets: drop.sprite,
      x: playerPos.x,
      y: playerPos.y,
      duration: DROP_CONFIG.GOLD_COLLECT_TWEEN_DURATION,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Add gold to player
        this.addGoldToPlayer(drop.value!);

        // Show floating text
        this.showFloatingText(
          `+${drop.value} Gold`,
          drop.sprite.x,
          drop.sprite.y,
          '#FFD700'
        );

        // Play sound (Phase 2)
        // this.scene.sound.play('coin-collect');

        // Remove drop
        this.removeDrop(drop);
      },
    });
  }

  /**
   * Check if there's an item near the given position
   * @param x - X position to check
   * @param y - Y position to check
   * @param radius - Search radius in pixels (default 24px = half tile)
   * @returns true if collectable item nearby, false otherwise
   */
  public hasItemNearPosition(x: number, y: number, radius: number = 24): boolean {
    return Array.from(this.drops.values()).some(
      (drop) =>
        drop.isCollectable &&
        drop.type !== 'gold' && // Gold is auto-collected
        Phaser.Math.Distance.Between(
          drop.position.x,
          drop.position.y,
          x,
          y
        ) < radius
    );
  }

  /**
   * Attempt to collect an item/rune at player's position
   * @param playerX - Player X position
   * @param playerY - Player Y position
   */
  public tryCollectItemAtPosition(playerX: number, playerY: number): void {
    // Find drops near player (within 24px = half a tile)
    const nearbyDrops = Array.from(this.drops.values()).filter(
      (drop) =>
        drop.isCollectable &&
        drop.type !== 'gold' && // Gold is auto-collected
        Phaser.Math.Distance.Between(
          drop.position.x,
          drop.position.y,
          playerX,
          playerY
        ) < 24
    );

    if (nearbyDrops.length === 0) {
      console.log('No items nearby to collect');
      return;
    }

    // Collect the nearest drop
    const nearestDrop = nearbyDrops[0];
    this.collectItem(nearestDrop);
  }

  /**
   * Collect an item or rune (manual pickup)
   */
  private collectItem(drop: Drop): void {
    const itemName = drop.item?.name || drop.rune?.name || 'Unknown';

    console.log(`📦 Collecting item: ${itemName}`);

    // Check if first time pickup (reading gate)
    const isFirstTime = !this.firstTimePickups.has(itemName);

    if (isFirstTime) {
      // Show reading popup (Phase 1: simple alert, Phase 2: custom UI)
      console.log(`📖 First time seeing "${itemName}" - show reading popup`);
      this.firstTimePickups.add(itemName);

      // TODO: Phase 1 - Show simple reading prompt
      // TODO: Phase 2 - Show custom reading dialog with TTS
      alert(`You found: ${itemName}\n\nPress OK to pick it up!`);
    }

    // Pickup animation
    this.scene.tweens.add({
      targets: drop.sprite,
      scale: 1.5,
      alpha: 0,
      duration: DROP_CONFIG.ITEM_COLLECT_TWEEN_DURATION,
      onComplete: () => {
        // Add to inventory
        if (drop.item) {
          this.addItemToInventory(drop.item);
        } else if (drop.rune) {
          this.addRuneToInventory(drop.rune);
        }

        // Show floating text
        this.showFloatingText(
          `+${itemName}`,
          drop.sprite.x,
          drop.sprite.y,
          this.getRarityColorHex(drop.item?.rarity || drop.rune?.rarity || 'common')
        );

        // Play sound (Phase 2)
        // this.scene.sound.play('item-collect');

        // Remove drop
        this.removeDrop(drop);
      },
    });
  }

  /**
   * Remove a drop from the game
   */
  private removeDrop(drop: Drop): void {
    drop.sprite?.destroy();
    this.drops.delete(drop.id);
    console.log(`Removed drop: ${drop.id}`);
  }

  /**
   * Show floating text for feedback
   */
  private showFloatingText(
    text: string,
    x: number,
    y: number,
    color: string
  ): void {
    const floatText = this.scene.add.text(x, y, text, {
      fontSize: '32px',
      fontFamily: 'Arial',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    });

    floatText.setOrigin(0.5);
    floatText.setDepth(100);

    // Animate: float up and fade out
    this.scene.tweens.add({
      targets: floatText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        floatText.destroy();
      },
    });
  }

  /**
   * Show warning for old drops (Phase 2 feature)
   */
  private showDropWarning(_drop: Drop): void {
    // TODO: Add pulsing red effect to sprite
    // For now, just log
    // console.log(`⚠️ Drop ${_drop.id} is getting old (${Date.now() - _drop.spawnTime}ms)`);
  }

  /**
   * Select a random consumable from templates
   */
  private selectRandomConsumable(minRarity?: Rarity): ConsumableItem | null {
    const items = Object.entries(CONSUMABLE_TEMPLATES);

    // Filter by rarity if specified
    const filtered = minRarity
      ? items.filter(([_, item]) => this.rarityValue(item.rarity) >= this.rarityValue(minRarity))
      : items;

    if (filtered.length === 0) return null;

    const [key, template] = filtered[Math.floor(Math.random() * filtered.length)];
    return this.createConsumableItem({ ...template, spriteKey: `consumable_${key}` });
  }

  /**
   * Select a random rune from templates
   */
  private selectRandomRune(): RuneData | null {
    const runes = Object.entries(RUNE_TEMPLATES);
    if (runes.length === 0) return null;

    const [key, template] = runes[Math.floor(Math.random() * runes.length)];
    return this.createRuneData({
      ...template,
      level: 1,
      spriteKey: `rune_${key}`,
    });
  }

  /**
   * Create a consumable item instance
   */
  private createConsumableItem(data: any): ConsumableItem {
    return {
      name: data.name,
      healAmount: data.healAmount,
      rarity: data.rarity,
      spriteKey: data.spriteKey || 'consumable_default',
      readingLevel: data.readingLevel || 1,
    };
  }

  /**
   * Create a rune data instance
   */
  private createRuneData(data: any): RuneData {
    return {
      name: data.name,
      type: data.type,
      level: data.level || 1,
      rarity: data.rarity,
      spriteKey: data.spriteKey || 'rune_default',
      readingLevel: data.readingLevel || 1,
      effectDescription: data.effectDescription,
    };
  }

  /**
   * Add gold to player
   */
  private addGoldToPlayer(amount: number): void {
    // TODO: Integrate with player gold system
    console.log(`💰 Player receives ${amount} gold`);
    // this.scene.player.addGold(amount);
  }

  /**
   * Add item to player inventory
   */
  private addItemToInventory(item: ConsumableItem): void {
    // TODO: Integrate with inventory system
    console.log(`📦 Adding ${item.name} to inventory`);
    // this.scene.inventory.addItem(item);
  }

  /**
   * Add rune to player inventory
   */
  private addRuneToInventory(rune: RuneData): void {
    // TODO: Integrate with rune system
    console.log(`✨ Adding ${rune.name} to rune inventory`);
    // this.scene.runeInventory.addRune(rune);
  }

  /**
   * Get player position from scene
   */
  private getPlayerPosition(): { x: number; y: number } | null {
    // Get actual player position from GameScene
    const player = (this.scene as any).player;
    return player ? { x: player.x, y: player.y } : null;
  }

  /**
   * Get color for rarity
   */
  private getRarityColor(rarity: Rarity): number {
    switch (rarity) {
      case 'common':
        return 0xffffff; // White
      case 'rare':
        return 0x0080ff; // Blue
      case 'epic':
        return 0xa020f0; // Purple
      case 'legendary':
        return 0xffa500; // Orange
      default:
        return 0xffffff;
    }
  }

  /**
   * Get hex color for rarity (for text)
   */
  private getRarityColorHex(rarity: Rarity): string {
    switch (rarity) {
      case 'common':
        return '#FFFFFF';
      case 'rare':
        return '#0080FF';
      case 'epic':
        return '#A020F0';
      case 'legendary':
        return '#FFA500';
      default:
        return '#FFFFFF';
    }
  }

  /**
   * Convert rarity to numeric value for comparison
   */
  private rarityValue(rarity: Rarity): number {
    switch (rarity) {
      case 'common':
        return 1;
      case 'rare':
        return 2;
      case 'epic':
        return 3;
      case 'legendary':
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Clean up all drops (e.g., on floor transition)
   */
  public cleanup(): void {
    this.drops.forEach((drop) => {
      drop.sprite?.destroy();
    });
    this.drops.clear();

    this.goldGroup.clear(true, true);
    this.itemGroup.clear(true, true);
    this.runeGroup.clear(true, true);

    console.log('DropManager cleaned up');
  }

  /**
   * Get debug info
   */
  public getDebugInfo(): string {
    return `Drops: ${this.drops.size} | First-time items seen: ${this.firstTimePickups.size}`;
  }
}
