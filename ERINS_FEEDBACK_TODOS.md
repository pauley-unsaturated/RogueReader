# Erin's Feedback - Prioritized TODO List

**Date**: October 2025
**Source**: Playtesting session with partner Erin

## Analysis Summary

### Main Themes Identified

1. **Child Usability** - UI elements need to be clearer, bigger, and more obvious for young readers
2. **Spell Dialog Overhaul** - Current unlimited casting needs limits, visual feedback, and no repeats
3. **Viewport/Scaling Issues** - Map too zoomed out on Chromebook, needs larger tiles
4. **Progression Pacing** - Difficulty jumps too steep, need transition levels
5. **Word List Quality** - Possible gaps in vocabulary, too many repeats
6. **Game-Over Flow** - Overlay broken, should return to menu not restart
7. **Visual Feedback** - Kids respond better to graphics than numbers

---

## CRITICAL PRIORITY (Blocking Issues)

### 1. Map Viewport Scaling
**Problem**: Map too zoomed out on small Chromebook screens, unplayable for target audience
**Solution**:
- Change visible area from current size to 10x10 tiles
- Make tiles bigger (currently 32x32, consider 48x48 or 64x64)
- Keep or increase overall viewport size
- Test on 1366x768 Chromebook resolution

**Impact**: Game currently unplayable on primary target device
**Effort**: Medium (requires camera/viewport changes)
**Files**: `src/scenes/GameScene.ts`, `src/config/GameConfig.ts`

---

### 2. HP/MP Display Unreadable
**Problem**: HP/MP meters hard to read, shown as fractions
**Solution**:
- Display as large single numbers (e.g., "45 HP" instead of "45/100")
- Keep bar visualization for at-a-glance status
- Put HP on left side, MP on right side
- Increase font size significantly

**Impact**: Players can't track their resources
**Effort**: Low (UI component update)
**Files**: `src/scenes/UIScene.ts` or `src/components/HotBarUI.ts`

---

### 3. Spell Dialog: Eliminate Word Repeats
**Problem**: Same words appearing multiple times in spell dialog
**Solution**:
- Implement shuffle/sampling without replacement
- Maintain pool of unread words per combat session
- Refill pool when exhausted
- Track used words per floor or session

**Impact**: Breaks educational value, players can't practice variety
**Effort**: Low (WordManager logic update)
**Files**: `src/systems/WordManager.ts`

---

### 4. Map Reachability Guarantee
**Problem**: Some rooms may be unreachable from entrance
**Solution**:
- Add reachability validation in DungeonGenerator
- Use flood-fill or BFS from entrance to verify all rooms accessible
- Regenerate if any rooms are isolated
- Add unit tests for this (generate 100 dungeons, verify all reachable)

**Impact**: Players may get stuck, unable to find boss
**Effort**: Medium (generator validation + tests)
**Files**: `src/systems/DungeonGenerator.ts`, `tests/unit/dungeon.test.ts` (new)

---

### 5. Game-Over Overlay Coverage
**Problem**: Game-over overlay doesn't cover middle of screen properly
**Solution**:
- Full-screen overlay like Dark Souls/Elden Ring "YOU DIED"
- Cover entire game board
- Large, obvious "Return to Menu" button
- Transition to MenuScene, not restart GameScene

**Impact**: Broken game flow, confusing restart
**Effort**: Low (overlay positioning fix)
**Files**: `src/scenes/GameScene.ts` (game over handler)

---

## HIGH PRIORITY (Major UX Issues)

### 6. Spell Dialog: Spell Count Limit
**Problem**: Unlimited spell casting removes strategy
**Solution**:
- Start with max 2 spells per cast
- Auto-fire spell when max reached
- Grow to 3, 4, 5 with powerup items (runes)
- Display visual counter for spells remaining (not just number)

**Impact**: Core combat mechanic needs constraints
**Effort**: Medium (combat system + UI changes)
**Files**: `src/components/CastingDialog.ts`, `src/systems/CombatSystem.ts`

---

### 7. Tutorial Improvements
**Problem**: Kids can't read instructions well, missed mechanics
**Solution**:
- Add clear "Next" button in addition to spacebar
- Allow clicking anywhere to advance
- Ensure ALL dialog is read aloud (some title text missed)
- Update tutorial to match actual spell mechanics (spacebar, hold spacebar, etc.)
- Focus on basic mechanisms, keep it brief

**Impact**: Players don't understand core mechanics
**Effort**: Medium (tutorial scene overhaul)
**Files**: `src/scenes/TutorialScene.ts` (if exists) or MenuScene

---

### 8. Map Boundary Walls
**Problem**: Some generated tiles not viewable, may be masking walkable areas
**Solution**:
- Generate ring of impenetrable walls at map edge
- 3 tiles deep
- Ensure no walkable areas are ever masked

**Impact**: Players may think they're stuck
**Effort**: Low (generator edge case)
**Files**: `src/systems/DungeonGenerator.ts`

---

### 9. Remove Random Green Bar Bug
**Problem**: Green bar appears at top sometimes
**Solution**:
- Investigate and remove source
- Likely a debug element or misplaced UI component

**Impact**: Visual clutter, unprofessional
**Effort**: Low (debug/remove)
**Files**: Unknown (needs investigation)

---

## MEDIUM PRIORITY (Important Enhancements)

### 10. Monster Level → Word Difficulty Mapping
**Problem**: Words not aligned with monster difficulty
**Solution**:
- Level 1 monsters = Level 1 words only
- Level 2 monsters = Level 2 words only, etc.
- Lower level monsters become less common as floors progress
- Implement falloff probability (e.g., L1 monsters 90% floor 1, 40% floor 2, 10% floor 3)

**Impact**: Difficulty curve is unpredictable
**Effort**: Medium (enemy spawning + word selection logic)
**Files**: `src/systems/CombatSystem.ts`, `src/systems/WordManager.ts`, `src/scenes/GameScene.ts`

---

### 11. Progression: Add Transition Levels
**Problem**: Difficulty jumps too steep between levels
**Solution**:
- Between current L1 and L2: Add 1 transition level (50/50 mix)
- Between L2-L3, L3-L4, etc.: Add 4 transition levels each
- Gradual word difficulty progression
- Monster levels increase gradually

**Impact**: Game too hard/frustrating for young readers
**Effort**: High (major progression system overhaul)
**Files**: `src/systems/WordManager.ts`, `src/config/GameConfig.ts`

**Note**: This may expand from 20 levels to ~35-40 levels total

---

### 12. Boss Difficulty Increase
**Problem**: Boss not significantly harder than normal enemies
**Solution**:
- Boss HP = 4-5x normal enemy HP
- Boss introduces some words from NEXT difficulty level
- Mix: 70% current level words, 30% next level words
- Fits into transition dynamic

**Impact**: Boss fights not climactic
**Effort**: Low (stat scaling)
**Files**: `src/scenes/GameScene.ts` (boss spawning), `src/systems/WordManager.ts`

---

### 13. Word List Verification
**Problem**: Repeating words too often, missing obvious words like "dog"
**Solution**:
- Audit all word lists for each level
- Ensure full vocabulary coverage for each grade level
- Find or generate complete word lists
- Cross-reference with common sight word lists (Dolch, Fry)

**Impact**: Educational value compromised
**Effort**: High (research + data work)
**Files**: `src/data/words/` (all word list files)

---

### 14. Spell Counter Visual Display
**Problem**: Number counters not kid-friendly
**Solution**:
- Display large, clear numbers for spell count
- Add visual progress indicator (bar, icons)
- Same for timer if timer is active

**Impact**: Kids don't notice spell limits
**Effort**: Low (UI update)
**Files**: `src/components/CastingDialog.ts`

---

### 15. Timer Mechanic Delayed to 4th/5th Grade
**Problem**: Timer too stressful for early readers
**Solution**:
- Disable timer for Levels 1-10 (K-3rd grade)
- Introduce timer at Level 11+ (4th/5th grade)
- Or make timer a powerup item obtained at later levels

**Impact**: Early readers feel rushed
**Effort**: Low (conditional timer logic)
**Files**: `src/components/CastingDialog.ts`

---

## LOW PRIORITY (Polish & New Features)

### 16. Wand Charging Visual Feedback
**Problem**: Combo counter is just a number
**Solution**:
- 1 word: Wand glowing ball at end
- 2 words: Sparkling ball
- 3 words: Energy crackling
- 4 words: Pulsing energy + particles
- 5 words: Strong pulsing + warping space + particles
- Make combos exciting for kids

**Impact**: Combos feel unrewarding
**Effort**: High (new visual assets + animations)
**Files**: New animation system, `src/components/CastingDialog.ts`

---

### 17. Spell Projectiles with Effects
**Problem**: Spells feel instant, no visual feedback
**Solution**:
- Projectile flies from player to enemy
- Size/particles scale with damage
- Different spell types have different effects
- Target selection with arrow keys during spell dialog

**Impact**: Combat feels bland
**Effort**: High (particle system + projectile physics)
**Files**: `src/systems/CombatSystem.ts`, new particle/projectile classes

---

### 18. Enemy Drops System
**Problem**: No variety in rewards, only combat XP
**Solution**:
- Enemies drop loot 1/10 chance (every 4-10 enemies)
- Health potions / food items
- Runes (very rare, 1 every 2-3 floors max)

**Impact**: Gameplay repetitive
**Effort**: Medium (loot system)
**Files**: `src/systems/CombatSystem.ts`, new drop tables

---

### 19. Rune System
**Problem**: No equipment progression mid-run
**Solution**:
- Rune types:
  - Multi-shot runes (hits multiple enemies, reduced damage per shot)
  - Health stealing (1-2% lifesteal, needs tuning)
- Runes increase max combo words
- Rare drops from enemies or treasure rooms

**Impact**: Runs feel samey
**Effort**: High (new item/equipment system)
**Files**: New rune system, inventory integration

---

### 20. Game-Over Screen Polish
**Problem**: Game-over screen is bare-bones
**Solution**:
- Snowflakes or particles falling
- Tombstone with flowers (silly but kid-friendly)
- Display stats:
  - Points earned
  - Powerups gathered
  - Words read
  - Rooms explored
  - Floors reached

**Impact**: Death feels unrewarding
**Effort**: Medium (new UI scene)
**Files**: New GameOverScene or overlay component

---

### 21. Bigger Maps, More Enemy Rooms
**Problem**: Maps feel small, too many treasure/shop rooms
**Solution**:
- Increase dungeon size (more rooms overall)
- 80% combat rooms, 10% treasure, 10% shop
- Currently feels more like 50/25/25

**Impact**: Exploration feels cramped
**Effort**: Low (generator parameters)
**Files**: `src/systems/DungeonGenerator.ts`

---

## RESEARCH / INVESTIGATION NEEDED

### 22. Boss Room A* Distance
**Current**: Boss placement uses Manhattan distance
**Erin's Request**: Use A* distance (accounts for walls/corridors)
**Question**: Is Manhattan distance insufficient? Does it create problems?
**Action**:
- Test current implementation
- Determine if A* is necessary
- Add unit tests for boss placement either way

**Effort**: Medium (pathfinding algorithm)
**Files**: `src/systems/DungeonGenerator.ts`, tests

---

## Implementation Strategy

### Phase 1: Critical Fixes (Week 1)
- Items 1-5: Viewport scaling, HP/MP display, no word repeats, reachability, game-over

### Phase 2: Core UX (Week 2)
- Items 6-9: Spell limits, tutorial, boundary walls, green bar bug

### Phase 3: Difficulty Balancing (Week 3)
- Items 10-15: Monster/word mapping, transition levels, boss difficulty, word lists, spell counter, timer

### Phase 4: Polish & Features (Future)
- Items 16-21: Visual effects, drops, runes, game-over polish, bigger maps

### Ongoing: Research
- Item 22: A* distance investigation

---

## Notes for Design Document Updates

Remember to update `DESIGN.md` after implementing:
- Spell limit mechanic (2 spells → grow with runes)
- Transition level system (L1.5, L2.25, L2.5, L2.75, L3, etc.)
- Monster level → word difficulty mapping
- Timer introduction at 4th/5th grade
- Rune system design
- Enemy drop rates
- Map size and room distribution ratios

---

## Testing Checklist

**After Critical Fixes:**
- [ ] Test on 1366x768 Chromebook screen
- [ ] Verify HP/MP readable from 3 feet away
- [ ] Play 10 combat encounters, ensure no word repeats
- [ ] Generate 100 dungeons, verify all rooms reachable
- [ ] Test game-over flow returns to menu

**After Spell Limit Implementation:**
- [ ] Verify auto-fire at 2 spells
- [ ] Test rune pickup increases limit to 3, 4, 5
- [ ] Verify spell counter is visible and clear

**After Progression Changes:**
- [ ] Playtest L1 → L2 transition smoothness
- [ ] Verify monster word difficulty alignment
- [ ] Test boss difficulty (should feel 4-5x harder)

---

## Architecture Decisions - CONFIRMED

### Transition Level System (Item #11)
The following design decisions have been confirmed:

#### Game Length
- **Total levels**: 20 → 35-40 levels ✅ CONFIRMED
- Longer game with smoother progression

#### Content Requirements
- **Word lists**: Verify current lists via web search and audit first
- **Action**: Only generate new word lists if existing ones are inadequate
- **Research needed**: Check coverage of current vocabulary data

#### Balance Tuning - Combat System
- **Monster HP scaling** ✅ Confirmed
- **Larger levels** ✅ Maps will be bigger overall
- **Monster density**:
  - **Fewer monsters per room** ✅
  - Start with low density, gradually increase with difficulty
  - Scale enemy count based on progression level
- **Targeting**: One-by-one monster targeting ✅ (already implemented)
- **Monster counter-attacks** ✅ NEW MECHANIC:
  - Monsters attack AFTER player fires spell
  - Only attack if in range
  - Not all monsters are ranged/magic users
  - Creates risk/reward: "Do I target the close goblin or the far archer?"

#### Boss System - Major Change
- **Previous design**: Boss every 5th level only
- **NEW DESIGN**: Boss at end of EVERY level ✅ CONFIRMED
  - Total bosses: 35-40 (one per level)
  - Boss room still placed farthest from entrance
  - Stairwell still spawns in boss room after defeat
  - Boss still 4-5x harder than normal enemies

### Implementation Impact

**High Impact Items:**
1. DungeonGenerator must create boss room every level (not every 5th)
2. Combat system needs monster counter-attack after spell cast
3. Monster spawning needs density scaling (fewer at start, more at end)
4. Word list audit required before adding new content
5. Map generation needs size increase across all levels

**Files Affected:**
- `src/systems/DungeonGenerator.ts` - Boss every level, larger maps, monster density
- `src/systems/CombatSystem.ts` - Monster counter-attacks after spell
- `src/systems/WordManager.ts` - Word list verification and transition levels
- `src/scenes/GameScene.ts` - Enemy spawning with density scaling
- `src/config/GameConfig.ts` - Level count, progression parameters
