# RogueReader - Sprint TODO (October 25, 2025)

**Current Status**: Game is highly polished and playable! New sprint focused on polish and remaining features.

---

## 🎉 RECENTLY COMPLETED (This Session)

### Gold Economy Overhaul
- ✅ Reduced base gold drops by ~70% (goblin: 3-5 → 1-2, bat: 2-4 → 1, etc.)
- ✅ Implemented floor-based scaling: `finalGold = baseGold × (1 + floor × 0.15)`
- ✅ Floor 1: 1x multiplier (cheap Dragon Warrior economy)
- ✅ Floor 40: 7x multiplier (rewarding for advanced readers)
- ✅ Boss bonus drops reduced from 5-15 → 2-4 gold each
- ✅ Creates strong incentive to skip levels and practice harder words!

### Wizard Type Selection
- ✅ Beautiful wizard selection dialog in MenuScene
- ✅ 4 wizard cards with element-specific colors and descriptions
- ✅ Fire, Ice, Lightning, Arcane wizards fully described
- ✅ Selected wizard passed to GameScene via scene data
- ✅ No more random selection - player chooses their style!

### Level Skip Feature
- ✅ Starting floor selector added to wizard selection screen
- ✅ Options: 1, 5, 10, 15, 20, 25, 30, 35, 40 (every 5 floors)
- ✅ Shows reading level and gold multiplier for each floor
- ✅ GameScene initializes with selected starting floor
- ✅ Encourages advancing readers to challenge themselves!

---

## 📋 LOW PRIORITY - Polish & Nice-to-Have Features

### Item #16: Wand Charging Visual Feedback
**Status**: Not Started
**Priority**: LOW
**Description**: Animated wand effects for spell combos (1-5 words)
- 1 word: Glowing ball at wand tip
- 2 words: Sparkling ball
- 3 words: Energy crackling
- 4 words: Pulsing energy + particles
- 5 words: Strong pulsing + warping space

**Effort**: High (new animation system + visual assets)
**Files**: New animation system, `src/components/CastingDialog.ts`

---

### Item #18: Enhanced Enemy Drops System
**Status**: PARTIALLY COMPLETE (Basic system implemented, needs tuning)
**Priority**: MEDIUM
**Description**: Loot drop system with consumables, runes, and gold

**What's Done**:
- ✅ Basic DropManager implemented
- ✅ Gold auto-collection with magnetism
- ✅ Consumables and runes defined
- ✅ Drop spawning from enemy deaths
- ✅ Floor-based gold scaling

**What's Needed**:
- [ ] Integrate drops with actual inventory system (currently placeholder)
- [ ] Connect player gold tracking (currently logs only)
- [ ] Add proper sprites for consumables and runes (currently colored circles)
- [ ] Implement first-time reading gate UI (currently uses alert())
- [ ] Balance drop rates based on playtest feedback
- [ ] Add sound effects for pickups

**Files**: `src/systems/DropManager.ts`, `src/types/drops.ts`

---

### Item #19: Rune System
**Status**: SCAFFOLDED (types defined, not wired up)
**Priority**: MEDIUM
**Description**: Equipment augmentation with prefix/suffix/core runes

**What's Done**:
- ✅ Rune types defined in drops.ts
- ✅ Rune templates created (Flame, Ice, Big, Blast, Heal, Shield, Echo, Power)
- ✅ Drop system can spawn runes

**What's Needed**:
- [ ] Equipment screen UI (Tab key to open)
- [ ] 3 rune slots: Prefix | Core | Suffix
- [ ] Rune effects integration with combat system
- [ ] Rune stacking/leveling (Flame I → Flame II → Flame III)
- [ ] Visual feedback for equipped runes
- [ ] TTS support for rune names

**Files**: New `src/systems/RuneSystem.ts`, `src/scenes/EquipmentScene.ts`

---

### Item #20: Game-Over Screen Polish
**Status**: BASIC IMPLEMENTATION (needs enhancement)
**Priority**: LOW
**Description**: Enhanced game-over experience with stats

**Current State**:
- ✅ Full-screen overlay
- ✅ "GAME OVER" text
- ✅ Return to Menu button

**What's Needed**:
- [ ] Particle effects (snowflakes or falling leaves)
- [ ] Tombstone with flowers graphic (kid-friendly)
- [ ] Stats display:
  - Points earned
  - Words read
  - Floors reached
  - Enemies defeated
  - Time played
- [ ] Achievement notifications (if any unlocked)

**Files**: `src/scenes/GameScene.ts` (game over handler)

---

### Item #21: Bigger Maps & Room Distribution
**Status**: PARTIALLY ADDRESSED (40 floors now, but room distribution may need tuning)
**Priority**: LOW
**Description**: Adjust dungeon generation for better gameplay flow

**Current State**:
- Room sizes: Min 5x5, Max 8x8
- Combat rooms: Most common
- Treasure/Shop rooms: Less common

**Tuning Needed** (based on playtesting):
- [ ] Verify room distribution feels right (80% combat, 10% treasure, 10% shop)
- [ ] Consider increasing dungeon size for higher floors
- [ ] Add mini-boss rooms? (Optional elite enemies)

**Files**: `src/systems/DungeonGenerator.ts`

---

## 🔬 RESEARCH / INVESTIGATION

### Item #22: Boss Room Distance Calculation
**Status**: Not Investigated
**Priority**: LOW
**Description**: Determine if Manhattan distance is sufficient or if A* pathfinding needed

**Current Implementation**:
- Boss placement uses Manhattan distance with 90% probability decay
- Guarantees boss in farthest room or fallback

**Research Questions**:
- Does Manhattan distance create issues with unreachable boss rooms?
- Would A* pathfinding improve player experience?
- Is current implementation "good enough"?

**Action**:
- Playtest 20+ runs and track boss accessibility
- Log actual player path length to boss vs Manhattan distance
- Decide if A* is worth the complexity

**Files**: `src/systems/DungeonGenerator.ts`, potential new pathfinding utility

---

## 🧪 TESTING & QA

### Manual Testing Checklist
- [ ] Test wizard selection on all 4 types (fire, ice, lightning, arcane)
- [ ] Test level skip: Floor 1, 5, 10, 20, 40
- [ ] Verify gold drops scale correctly with floor
- [ ] Verify starting floor affects enemy difficulty appropriately
- [ ] Test 1366x768 Chromebook display (viewport scaling)
- [ ] Verify HP/MP readable from 3 feet away
- [ ] Test word repeats across 10 combat encounters
- [ ] Boss difficulty feels 4-5x harder than normal enemies
- [ ] Timer only appears on floors 11+ (not 1-10)

### Performance Testing
- [ ] Monitor FPS on low-end devices
- [ ] Check memory leaks (run for 30+ minutes)
- [ ] Verify cleanup on floor transitions
- [ ] Test with 100+ projectiles on screen

---

## 🎯 FUTURE ENHANCEMENTS (Post-Launch)

### Planned for Future Sprints
- [ ] Shop system integration (buy consumables with gold)
- [ ] Inventory hot-bar (number keys 1-4 to use items)
- [ ] Sound effects and music system
- [ ] More enemy types (current: 6 types)
- [ ] More boss mechanics (current: basic stat scaling)
- [ ] Achievement system
- [ ] Leaderboards / score tracking
- [ ] Multiplayer co-op? (far future)

---

## 📊 SPRINT METRICS

**Previous Sprint Accomplishments** (from archived CHANGELOG):
- 15 critical/high/medium priority items completed
- Projectile system (3 phases)
- Loot drop system (Phase 1)
- Anti-cheat measures (2 rounds)
- Boss behavior improvements
- 96 unit tests (83 passed, 13 skipped)

**Current Sprint Goals**:
- Polish wizard selection and level skip features
- Tune gold economy based on playtesting
- Complete loot system integration
- Begin rune system implementation
- Comprehensive manual testing

---

## 🔗 RELATED FILES

**Design Documents**:
- `DESIGN.md` - Complete game design specifications
- `ASSETS_DESIGN.md` - Art asset requirements
- `ChangeLogs/CHANGELOG_10_25_2025.md` - Archived previous sprint work

**Core Systems**:
- `src/scenes/MenuScene.ts` - Main menu + wizard selection
- `src/scenes/GameScene.ts` - Core gameplay (2800+ lines)
- `src/systems/DropManager.ts` - Loot drop system
- `src/systems/ProjectileManager.ts` - Spell projectiles + element effects
- `src/systems/CombatSystem.ts` - Damage, combos, counter-attacks

**Data Files**:
- `src/types/drops.ts` - Loot tables, consumables, runes
- `src/data/words/level-*.txt` - Curriculum word lists (20 levels)

---

## 📝 NOTES

### Development Context
- Game is very polished after previous sprint!
- 40 floors (2 per reading level, K-10th grade)
- Boss on every floor (not just every 5th)
- Transition levels for smooth difficulty curve
- 100% Dolch Pre-Primer coverage in word lists
- All critical bugs fixed (spacebar spam, collision, etc.)

### Next Session Priorities
1. **Playtest** wizard selection + level skip
2. **Tune** gold economy based on feel
3. **Integrate** drop system with inventory
4. **Start** rune system implementation

---

*Last Updated*: October 25, 2025
*Sprint Start*: October 25, 2025
*Target Completion*: TBD
