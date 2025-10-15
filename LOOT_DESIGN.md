# LOOT_DESIGN.md - Enemy Drop System Design

## Executive Summary

The drop system adds excitement and reward to combat by having enemies drop loot with satisfying visual feedback. Kids will see items burst out of defeated enemies, creating a "piñata effect" that makes every victory feel rewarding.

**Target Audience**: 6-9 year olds
**Status**: Design complete, ready for implementation
**Priority**: High (Item #18 from ERINS_FEEDBACK_TODOS.md)

---

## Design Goals

1. **Visual Excitement**: Make drops feel like opening presents
2. **Educational Reinforcement**: Every pickup requires reading (first time)
3. **Strategic Collection**: Manual pickup creates risk/reward decisions
4. **Clear Feedback**: Kids instantly understand what they got and why it matters

---

## Drop Types & Rarities

### 1. Gold Words (Most Common - 70% drop rate)
- **Visual**: Golden spinning coins with letters on them
- **Value**: Based on word complexity (2-15 gold per drop)
- **Animation**: Fountain burst from enemy, coins scatter in arc
- **Collection**: Walk over to auto-collect (no reading required)
- **Sound**: Satisfying "cha-ching" coin collection
- **Magnetism**: 1 tile radius (48px) - responsive but requires intent

### 2. Consumables (Uncommon - 15-20% drop rate)
- **Types**:
  - 🍎 Apple (10 HP) - Common (60% of consumable drops)
  - 🍞 Bread (12 HP) - Common (30%)
  - 🧪 Red Potion (25 HP) - Rare (8%)
  - 🧚 Fairy (50 HP) - Epic (2%)
- **Visual**: Items glow with rarity color (white/green/blue/purple)
- **Animation**: Pop out with physics bounce
- **Collection**: Stand on item + press E to pick up
- **Reading Gate**: Must read item name on FIRST pickup only

### 3. Runes (Rare - 5-10% drop rate)
- **Rarities**: Common (70%), Rare (25%), Epic (5%)
- **Visual**: Floating crystalline shards with runic symbols
- **Animation**: Slowly rotate with particle aura
- **Collection**: Automatic if same rune (levels it up), otherwise manual
- **Reading Gate**: Must read rune name on first encounter

---

## Visual Feedback System

### Death → Drop Animation Sequence
```
Frame 0-10:  Enemy death animation plays
Frame 11-15: Loot "charges up" inside enemy (glow effect)
Frame 16-25: BURST! Items explode outward in arc
Frame 26-40: Items land with physics bounce
Frame 41+:   Items settle and begin idle animations
```

### Drop Positioning Algorithm
```typescript
// Items spawn in circle around enemy death position
const dropCount = calculateDrops(enemy);
const angleStep = (Math.PI * 2) / dropCount;

for (let i = 0; i < dropCount; i++) {
  const angle = angleStep * i + Math.random() * 0.3; // Add randomness
  const distance = 32 + Math.random() * 16; // 1-1.5 tiles away
  const x = enemyX + Math.cos(angle) * distance;
  const y = enemyY + Math.sin(angle) * distance;

  spawnDrop(x, y, dropType, {
    velocity: calculateArcVelocity(angle, distance),
    rotation: Math.random() * Math.PI * 2
  });
}
```

### Idle Animations by Type
- **Gold**: Gentle spin (360° in 2s) + sparkle particles every 0.5s
- **Consumables**: Soft bob up/down (±3px) + item-specific glow pulse
- **Runes**: Slow rotation (360° in 4s) + mystical particle trail
- **All types**: Subtle pulsing scale (0.95x to 1.05x, 1s cycle)

### Pickup Feedback
- **Pre-pickup**: Items get brighter when player within 1 tile
- **During pickup**:
  - Item scales up 1.5x over 0.2s
  - Alpha fades to 0 over 0.3s
  - Rotates toward player
- **Post-pickup**:
  - "+10 Gold!" text floats up (yellow, bold)
  - Item icon slides to inventory/gold counter (0.5s tween)
  - Satisfying collection sound per type
  - Screen flash for epic+ items

---

## Mechanical Implementation

### Drop Calculation
```typescript
function calculateDrops(enemy: Enemy): Drop[] {
  const drops: Drop[] = [];

  // GOLD: Guaranteed for non-boss enemies
  if (!enemy.isBoss) {
    drops.push({
      type: 'gold',
      amount: calculateGoldValue(enemy)
    });
  }

  // CONSUMABLE: Chance-based
  const consumableChance = getConsumableChance(enemy);
  if (Math.random() < consumableChance) {
    drops.push({
      type: 'consumable',
      item: selectConsumable(enemy.level)
    });
  }

  // RUNE: Rare drop (higher for bosses)
  const runeChance = enemy.isBoss ? 0.5 : 0.05;
  if (Math.random() < runeChance) {
    drops.push({
      type: 'rune',
      rarity: selectRuneRarity(),
      runeName: selectRuneName()
    });
  }

  // BOSS: Always drop 3-5 items (guaranteed progression)
  if (enemy.isBoss) {
    drops.push(...generateBossBonus(enemy.floor));
  }

  return drops;
}
```

### Collection Mechanics

#### Auto-Collect (Gold Only)
- Player walks within 1 tile → gold flies to player
- Tween duration: 0.3s with ease-in effect
- No interaction needed (reduces friction)
- Multiple coins collected = additive sound (pitch up per coin)

#### Manual Collect (Items & Runes)
- Player must be on same tile as item
- Press E (or interact key) to pick up
- **First Time**: Reading popup appears
  - "Pick up [item name]?" with TTS read-aloud
  - Player presses SPACEBAR or clicks confirm
  - Item added to inventory/equipment
- **Subsequent Times**: Instant pickup (no reading required)

#### Inventory Full Behavior
- When inventory reaches 8 items (consumables only)
- New pickup auto-drops oldest non-equipped item
- Flash animation shows what was dropped
- Message: "Dropped [old item] for [new item]!"
- Dropped item appears on ground at player feet

---

## Drop Tables by Enemy Type

| Enemy | Gold Base | Consumable % | Rune % | Special Behavior |
|-------|-----------|--------------|--------|------------------|
| Goblin | 3-5 | 15% | 3% | Fast gold magnet |
| Bat | 2-4 | 10% | 2% | Small burst radius |
| Skeleton | 4-6 | 20% | 5% | +Bread chance |
| Slime | 3-5 | 25% | 3% | +Potion chance |
| Orc | 6-8 | 20% | 7% | +Rune chance |
| Demon | 8-12 | 30% | 10% | Guaranteed rare+ |
| **Boss** | 20-30 | 100% | 50% | 3-5 guaranteed items |

### Boss Progressive Rewards (Guaranteed Drops)
- **Floor 1**: Fire Rune I + 2 consumables + gold pile
- **Floor 2**: Ice Rune I + 3 consumables + gold pile
- **Floor 3**: Lightning Rune I + 3 consumables + gold pile
- **Floor 4**: Echo Rune I + 4 consumables + gold pile
- **Floor 5+**: Random Epic Rune + 4 consumables + gold pile

Each boss guarantees a NEW rune type or levels up existing one.

---

## Drop Persistence & Cleanup

### Timing Rules
- **Initial spawn**: Items uncollectable for 0.5s (during bounce animation)
- **Persistence**: Items remain for entire floor (no timeout)
- **Warning phase**: After 30 seconds, items start pulsing red (visual reminder)
- **Cleanup**: All items destroyed on floor transition

### Performance Optimization
- **Max drops on screen**: 20 visible drops
- **Overflow handling**: Oldest gold auto-combines into "gold pile"
- **Off-screen behavior**: Items beyond camera enter "sleep mode" (no animations)
- **Physics**: Disabled after initial bounce (only idle animations remain)

---

## Visual Clutter Management: Smart Stacking

When 3+ of the same item are nearby (within 1 tile of each other):
- Items merge into a single "pile" representation
- Badge shows quantity: "x3", "x5", etc.
- Pickup collects all items at once
- Reading requirement: Read once for the pile
- Visual: Larger icon with quantity indicator

Example:
```
Before: 🍎 🍎 🍎 (3 separate apples)
After:  🍎 x3 (one stacked apple)
```

---

## Critical Design Decisions (With Alternatives)

### 1. Reading Requirement Strictness

#### ⭐ SELECTED: "First Time Learning"
- **How it works**: Read item name on FIRST pickup only, auto-collect thereafter
- **Fun**: ⬆️ High - No repetitive friction, smooth gameplay after learning
- **Learning**: ⬆️ High - Still teaches every word once, reinforces through visual recognition
- **Gameplay**: ⬆️ High - Fast-paced combat isn't interrupted repeatedly
- **Example**: First apple requires reading "Apple", all future apples auto-pickup

#### Alternative B: "Always Read"
- Must read item name EVERY single pickup
- Fun: ⬇️ Low - Gets tedious for 6-9 year olds
- Learning: ⬆️ High - Maximum reading practice
- Gameplay: ⬇️ Low - Kids may avoid picking up items

#### Alternative C: "Combat Smart"
- Auto-collect during combat, require reading only in safe rooms
- Fun: ➡️ Medium - Reduces combat stress
- Learning: ➡️ Medium - Inconsistent
- Complexity: May confuse young players

---

### 2. Drop Magnetism Range

#### ⭐ SELECTED: "Close Comfort" (1 tile = 48px)
- **How it works**: Gold flies to player when within 1 tile
- **Fun**: ⬆️ High - Satisfying "vacuum" effect without being too easy
- **Learning**: ➡️ N/A - Gold doesn't require reading
- **Gameplay**: ⬆️ High - Encourages exploration and movement
- **Kid-friendly**: Close enough to feel responsive, far enough to require intent

#### Alternative B: "Super Magnet" (3 tiles)
- Large collection radius across room
- Fun: ⬆️ High initially, then removes gameplay
- Gameplay: ⬇️ Low - Too easy, no risk/reward

#### Alternative C: "Touch to Collect" (0 tiles)
- Must walk directly over items
- Fun: ⬇️ Low - Frustrating for young kids
- Gameplay: ➡️ Medium - More strategic but tedious

---

### 3. Boss Drop Guarantees

#### ⭐ SELECTED: "Progressive Rewards"
- **How it works**: Each boss drops specific milestone items
- **Fun**: ⬆️ High - Kids know they'll get something special and new
- **Learning**: ⬆️ High - New vocabulary with each boss
- **Gameplay**: ⬆️ High - Clear progression and goals
- **Floor 1 boss**: Always drops "Fire Rune" + random consumables

#### Alternative B: "RNG Excitement"
- Random epic/legendary drops from boss loot table
- Fun: ➡️ Variable - Exciting when lucky, frustrating when unlucky
- Gameplay: ⬇️ Low - 6-9 year olds don't handle RNG disappointment well

#### Alternative C: "Treasure Choice"
- Boss drops chest with 3 items, pick 1
- Fun: ⬆️ High - Agency and decision-making
- Learning: ⬆️ Very High - Must read all 3 options
- Complexity: Might overwhelm youngest players

---

### 4. Visual Clutter Management

#### ⭐ SELECTED: "Smart Stacking"
- **How it works**: Similar items group (3+ apples = "Apple Pile")
- **Fun**: ⬆️ High - Clean visuals, special "pile" graphics
- **Learning**: ⬆️ High - Shows quantity ("Apple x3")
- **Gameplay**: ⬆️ High - Can see everything clearly
- **Visual**: One apple with "x3" badge instead of 3 separate apples

#### Alternative B: "Item Carousel"
- 5+ drops create rotating carousel
- Fun: ➡️ Medium - Items feel "hidden"
- Gameplay: ⬇️ Low - Young kids need to see everything at once

#### Alternative C: "Loot Explosion Spread"
- Many drops = larger explosion radius
- Fun: ⬆️ Very High - Bigger excitement
- Gameplay: ➡️ Medium - Items might spread off-screen

---

### 5. Inventory Integration

#### ⭐ SELECTED: "Flexible Bags"
- **How it works**: 8 slots, full = oldest consumable auto-drops
- **Fun**: ⬆️ High - Never stuck unable to pick up new shiny item
- **Learning**: ⬆️ High - Must read what's being dropped/kept
- **Gameplay**: ⬆️ High - No frustrating "inventory full" blocks
- **Kid-friendly**: Forgiving system that prevents frustration

#### Alternative B: "Hard Limits"
- 8 slots max, full = cannot pickup until you use/drop items
- Fun: ⬇️ Low - Frustrating for kids who want everything
- Gameplay: ⬇️ Low - 6-9 year olds struggle with inventory management

#### Alternative C: "Expandable Pockets"
- Start with 4 slots, find "backpacks" to add +2 slots each
- Fun: ⬆️ High - Progression and upgrades
- Gameplay: ➡️ Medium - Adds another system to track

---

## Golden Rules for 6-9 Year Old Design

1. **"One Touch Teaching"**: Teach once, then reduce friction
2. **"Always Say Yes"**: Let kids pick up items (auto-drop old ones)
3. **"Guaranteed Joy"**: Bosses always drop something new and cool
4. **"Clean Canvas"**: Visual clarity > realistic physics
5. **"Close Enough"**: Magnetism that feels helpful, not automatic

---

## Implementation Phases

### Phase 1: Core System (Priority 1)
**Estimated Time**: 2-3 hours

- [ ] Drop data structures (Drop interface, DropType enum)
- [ ] Drop spawning from enemy death events
- [ ] Basic gold auto-collection (1 tile magnetism)
- [ ] Simple float-up feedback text ("+10 Gold!")
- [ ] Inventory integration for consumables
- [ ] First-time reading gate system
- [ ] Basic item pickup with E key

**Deliverable**: Working drops that appear, can be collected, and add to inventory

---

### Phase 2: Visual Polish (Priority 2)
**Estimated Time**: 2-3 hours

- [ ] Burst animation from enemy death
- [ ] Physics-based scattering (arc trajectories)
- [ ] Idle animations (spinning, bobbing, rotating)
- [ ] Particle effects by rarity
- [ ] Collection animations (scale up, fly to player)
- [ ] Smart stacking for 3+ similar items
- [ ] Rarity-based glow effects

**Deliverable**: Drops that look exciting and satisfying to collect

---

### Phase 3: Audio & Juice (Priority 3)
**Estimated Time**: 1-2 hours

- [ ] Drop sounds by type (coin clink, item pop, rune chime)
- [ ] Collection sounds (additive coin pitch)
- [ ] Screen shake on epic drops
- [ ] Rainbow particle effects for legendary items
- [ ] Victory fanfare for boss drops
- [ ] Item popup "ding" sounds

**Deliverable**: Fully polished drop experience with satisfying audio

---

## Technical Implementation Notes

### Drop Entity Structure
```typescript
interface Drop {
  id: string;
  type: 'gold' | 'consumable' | 'rune';
  sprite: Phaser.GameObjects.Sprite;
  value?: number; // For gold
  item?: ConsumableItem; // For consumables
  rune?: RuneData; // For runes
  position: { x: number; y: number };
  isCollectable: boolean; // False during bounce animation
  firstTimePickup: boolean; // True if never collected this item type
  magnetRadius?: number; // For gold (48px = 1 tile)
}

interface ConsumableItem {
  name: string; // "Apple", "Bread", "Red Potion", "Fairy"
  healAmount: number;
  rarity: 'common' | 'rare' | 'epic';
  spriteKey: string;
}

interface RuneData {
  name: string; // "Flame Rune", "Ice Rune", etc.
  type: 'prefix' | 'suffix' | 'core';
  level: number; // 1-3
  rarity: 'common' | 'rare' | 'epic';
}
```

### DropManager Class
```typescript
class DropManager {
  private drops: Drop[] = [];
  private scene: GameScene;
  private firstTimePickups: Set<string> = new Set(); // Track what player has seen

  spawnDrops(enemy: Enemy): void {
    const drops = this.calculateDrops(enemy);
    drops.forEach((drop, index) => {
      this.createDrop(drop, enemy.x, enemy.y, index, drops.length);
    });
  }

  private createDrop(drop: Drop, x: number, y: number, index: number, total: number): void {
    // Calculate spawn position in circle
    const angle = (Math.PI * 2 / total) * index + Math.random() * 0.3;
    const distance = 32 + Math.random() * 16;
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    // Create sprite with physics
    const sprite = this.scene.physics.add.sprite(x, y, drop.spriteKey);

    // Launch with arc trajectory
    const velocity = this.calculateArcVelocity(angle, distance);
    sprite.setVelocity(velocity.x, velocity.y);

    // Add to drops array
    this.drops.push({ ...drop, sprite, isCollectable: false });

    // Enable collection after bounce animation
    this.scene.time.delayedCall(500, () => {
      drop.isCollectable = true;
    });
  }

  update(): void {
    this.drops.forEach(drop => {
      if (!drop.isCollectable) return;

      // Gold magnetism
      if (drop.type === 'gold') {
        const distance = Phaser.Math.Distance.Between(
          drop.sprite.x, drop.sprite.y,
          this.scene.player.x, this.scene.player.y
        );

        if (distance <= 48) { // 1 tile
          this.collectGold(drop);
        }
      }

      // Manual pickup check
      if (this.scene.input.keyboard.checkDown('E')) {
        if (this.isPlayerOnDrop(drop)) {
          this.collectItem(drop);
        }
      }
    });
  }

  private collectGold(drop: Drop): void {
    // Tween to player
    this.scene.tweens.add({
      targets: drop.sprite,
      x: this.scene.player.x,
      y: this.scene.player.y,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.scene.goldWords += drop.value!;
        this.showFloatText(`+${drop.value!} Gold`, drop.sprite.x, drop.sprite.y);
        this.playSound('coin-collect');
        this.removeDrop(drop);
      }
    });
  }

  private collectItem(drop: Drop): void {
    const itemKey = drop.item?.name || drop.rune?.name;

    // Check if first time pickup
    if (!this.firstTimePickups.has(itemKey)) {
      this.showReadingPopup(itemKey, () => {
        this.firstTimePickups.add(itemKey);
        this.completeItemPickup(drop);
      });
    } else {
      this.completeItemPickup(drop);
    }
  }

  private completeItemPickup(drop: Drop): void {
    // Pickup animation
    this.scene.tweens.add({
      targets: drop.sprite,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.addToInventory(drop);
        this.showFloatText(`+${drop.item?.name}`, drop.sprite.x, drop.sprite.y);
        this.playSound('item-collect');
        this.removeDrop(drop);
      }
    });
  }
}
```

---

## Success Metrics

- **Pickup Rate**: 95%+ of drops collected (shows they're valuable)
- **Reading Completion**: 90%+ successful item name reads (first time)
- **Inventory Management**: Players use items rather than hoarding
- **Visual Satisfaction**: Playtest feedback on "fun factor"
- **Boss Excitement**: Kids express enthusiasm about boss drops

---

## Future Enhancements (Post-Phase 3)

- **Loot Beam**: Vertical beam of light for epic+ drops (visible across map)
- **Drop Magnets**: Rune that increases collection radius
- **Lucky Drops**: Random "double drop" events with special VFX
- **Treasure Goblin**: Rare enemy that drops tons of loot if defeated quickly
- **Loot Piñata**: Boss death creates multi-wave drop sequence
- **Drop Trails**: Gold leaves sparkle trail when flying to player

---

## References

- DESIGN.md: Lines 1036-1176 (Runic Augmentation System)
- DESIGN.md: Lines 1055-1123 (Health Recovery & Gold Words)
- ERINS_FEEDBACK_TODOS.md: Item #18 (Enemy Drops System)

---

**Status**: ✅ Design Complete - Ready for Implementation
**Next Step**: Begin Phase 1 implementation (core drop system)
**Estimated Total Implementation Time**: 5-8 hours
