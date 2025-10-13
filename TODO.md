# RogueReader - TODO List

**Last Updated**: January 2025
**Current Session**: Item #13 (Word List Audit) COMPLETE, Moving to Item #17 (Projectile System)

---

## ✅ COMPLETED - Current Session

### Item #13: Word List Verification
**Status**: COMPLETE ✅
**Commit**: `931c8cb` - "Complete word list audit and add 52 missing high-frequency words"

**Results**:
- ✅ Dolch Pre-Primer: 42.5% → 100% (COMPLETE!)
- ✅ Common Nouns: 31.8% → 100% (ALL 22 PRESENT!)
- ✅ Fry First 100: 72% → 75% (+3%)
- ✅ Added 52 high-frequency words across levels 1-5
- ✅ Created `tools/audit-word-lists.js` for future audits

**Changes Made**:
- Level 1 (+3): a, I, am
- Level 2 (+6): is, it, in, an, as, at
- Level 3 (+6): and, the, to, of, for, or
- Level 4 (+23): ALL missing Dolch Pre-Primer words
- Level 5 (+15): bird, fish, tree, moon, star, rain, snow, home, school, book, ball, bike, food, milk, water

---

## 🚧 IN PROGRESS - Next Task

### Item #17: Spell Projectile System with Element Effects
**Status**: DESIGN PHASE 🎯
**Priority**: HIGH (fixes AOE problem + adds visual feedback)

**Problem to Solve**:
1. **AOE Issue**: Spells currently hit ALL nearby enemies instantly (too powerful)
2. **No Visual Feedback**: Combat feels instant and weightless
3. **Missing Element Types**: Fire/Ice/Lightning/Neutral have no visual distinction

**Proposed Architecture**:

#### New Components to Create:

**1. Projectile Class** (`src/entities/Projectile.ts`)
- Extends Phaser.GameObjects.Sprite
- Properties:
  - `element: 'fire' | 'ice' | 'lightning' | 'neutral'`
  - `damage: number`
  - `targetEnemy: Enemy`
  - `speed: number` (pixels/second)
  - `particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter`
- Methods:
  - `constructor(scene, x, y, targetEnemy, element, damage)`
  - `update(delta)` - move toward target
  - `onCollision()` - deal damage, trigger effects, destroy
  - `createParticleTrail()` - element-specific visual trail

**2. ProjectileManager** (`src/systems/ProjectileManager.ts`)
- Manages all active projectiles
- Properties:
  - `activeProjectiles: Projectile[]`
  - `scene: Phaser.Scene`
- Methods:
  - `fireProjectile(source, target, element, damage)` - create new projectile
  - `update(delta)` - update all projectiles
  - `checkCollisions()` - detect projectile-enemy collisions
  - `clearAll()` - cleanup on floor transition

**3. Element Visual Configs** (in ProjectileManager or separate config)
```typescript
const ELEMENT_CONFIGS = {
  fire: {
    color: 0xff4500,      // Orange-red
    particleColor: 0xff8c00,
    trailLength: 20,
    speed: 400,
    sprite: 'fireball'    // Or procedurally generated circle
  },
  ice: {
    color: 0x00bfff,      // Deep sky blue
    particleColor: 0x87ceeb,
    trailLength: 15,
    speed: 350,
    sprite: 'iceball'
  },
  lightning: {
    color: 0xffff00,      // Yellow
    particleColor: 0xffffff,
    trailLength: 10,
    speed: 600,           // Fastest
    sprite: 'lightningbolt'
  },
  neutral: {
    color: 0x9370db,      // Medium purple (arcane)
    particleColor: 0xda70d6,
    trailLength: 15,
    speed: 450,
    sprite: 'arcaneball'
  }
};
```

#### Files to Modify:

**1. CombatSystem.ts** (lines 156-165)
- **BEFORE**: `this.dealDamage(targetId, totalDamage, element)` (instant damage)
- **AFTER**: `this.emit('projectileFired', { targetId, damage, element, sourcePosition })` (deferred damage)
- Keep `dealDamage()` as public method for projectile collision callback

**2. GameScene.ts**
- Import ProjectileManager
- Create instance: `this.projectileManager = new ProjectileManager(this)`
- Listen for `'projectileFired'` event from CombatSystem
- Create projectile when event fires:
  ```typescript
  this.combatSystem.on('projectileFired', (data) => {
    const target = this.enemies.find(e => e.id === data.targetId);
    const playerPos = this.player.getPosition();
    this.projectileManager.fireProjectile(playerPos, target, data.element, data.damage);
  });
  ```
- Listen for projectile collision:
  ```typescript
  this.projectileManager.on('projectileHit', (data) => {
    this.combatSystem.dealDamage(data.targetId, data.damage, data.element);
  });
  ```
- Call `this.projectileManager.update(delta)` in GameScene.update()
- Call `this.projectileManager.clearAll()` on floor transition

**3. Player.ts** (optional)
- Add `getWorldPosition()` helper method for projectile spawn point
- Could add a "wand tip" offset for visual polish

#### Implementation Steps:

**Phase 1: Basic Projectile System**
- [ ] Create Projectile class with simple circle sprite
- [ ] Create ProjectileManager with basic firing/updating
- [ ] Modify CombatSystem to emit 'projectileFired' instead of instant damage
- [ ] Wire up GameScene event handlers
- [ ] Test with single enemy (no particles yet)

**Phase 2: Element Visual Effects**
- [ ] Add particle emitters to Projectile
- [ ] Implement ELEMENT_CONFIGS
- [ ] Create element-specific trails
- [ ] Test all 4 element types

**Phase 3: Polish & Refinement**
- [ ] Add impact effects (explosion, freeze, spark)
- [ ] Add sound effects (whoosh, impact)
- [ ] Projectile homing/arc trajectory (optional)
- [ ] Multi-shot for combo spells (optional)

#### Testing Checklist:
- [ ] Single projectile fires from player to enemy
- [ ] Projectile travels at correct speed
- [ ] Damage applies on collision (not instantly)
- [ ] Multiple projectiles don't interfere
- [ ] Projectiles cleanup on enemy death
- [ ] Projectiles cleanup on floor transition
- [ ] All 4 element types have distinct visuals
- [ ] Counter-attacks still work after projectile change

---

## 📋 REMAINING TASKS (from ERINS_FEEDBACK_TODOS.md)

### Low Priority (Polish & Features)

**Item #16: Wand Charging Visual Feedback**
- Status: Not Started
- Effort: High
- Description: Animated wand effects for spell combos (1-5 words)

**Item #18: Enemy Drops System**
- Status: Not Started
- Effort: Medium
- Description: Health potions, food items (1/10 drop chance)

**Item #19: Rune System**
- Status: Not Started
- Effort: High
- Description: Multi-shot, lifesteal runes (increase max combo words)

**Item #20: Game-Over Screen Polish**
- Status: Not Started
- Effort: Medium
- Description: Stats display, particle effects, tombstone

### Research

**Item #22: Boss Room A* Distance**
- Status: Not Started
- Effort: Medium
- Description: Investigate if Manhattan distance is sufficient for boss placement

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Complete Projectile System** (Item #17)
   - Start with Phase 1 (basic projectile)
   - Add element visuals in Phase 2
   - Polish in Phase 3

2. **Playtesting Session**
   - Test all 14 completed items together
   - Verify no regressions
   - Get fresh user feedback

3. **Consider Remaining Polish Items**
   - Items #16, #18, #19, #20 are nice-to-have
   - Projectile system is more impactful

---

## 📝 NOTES

### Current Context
- We just completed comprehensive word list audit
- All critical/high/medium priority items are done except Item #13
- Game is highly polished and playable
- Projectile system will fix last major gameplay issue (AOE spam)

### Design Decisions Confirmed
- 40 floors total (transition levels every other floor)
- Boss on every floor (not every 5th)
- Monster counter-attacks after spell cast
- Spell limit: 2 words (can grow with runes)
- Timer disabled for floors 1-10 (tries mode)

### Architecture Notes
- CombatSystem handles damage calculation
- GameScene handles visual effects and entity management
- Projectiles bridge the gap between calculation and visual

---

## 🔗 RELATED FILES

**Word Lists**:
- `src/data/words/level-01.txt` through `level-20.txt`
- `tools/audit-word-lists.js` (run with: `node tools/audit-word-lists.js`)

**Combat System**:
- `src/systems/CombatSystem.ts` (damage calculation, combo, elements)
- `src/scenes/GameScene.ts` (combat orchestration, 2552 lines)
- `src/entities/Player.ts` (player entity)
- `src/entities/Enemy.ts` (enemy entity)

**To Be Created**:
- `src/entities/Projectile.ts` (new)
- `src/systems/ProjectileManager.ts` (new)

**Reference**:
- `ERINS_FEEDBACK_TODOS.md` (full priority list)
- `CHANGELOG.md` (implementation history)
- `DESIGN.md` (game design decisions)

---

*Ready to continue: Start with Projectile class implementation (Phase 1)*
