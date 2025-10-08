# RogueReader Development Changelog

This document tracks implementation progress for Erin's feedback and other development work.

## Session: October 2025 - Erin's Feedback Implementation

### Status: In Progress

---

## Critical Priority Items

### ✅ Item #1: Map Viewport Scaling
**Status**: COMPLETED
**Priority**: CRITICAL
**Problem**: Game unplayable on Chromebook (1366x768) - map too zoomed out
**Solution Implemented**:
- ✅ Increased TILE_SIZE from 32px to 48px
- ✅ Adjusted camera zoom from 1.5x to 2.1x
- ✅ Now shows ~10x10 tiles on screen (was ~21x16)
- ✅ Fixed hardcoded tile size in Door.ts

**Files Modified**:
- `src/config/GameConfig.ts` - TILE_SIZE: 32 → 48
- `src/scenes/GameScene.ts` - Camera zoom: 1.5 → 2.1
- `src/entities/Door.ts` - Use GAME_CONFIG.TILE_SIZE instead of hardcoded 32
- `src/main.ts` - Fixed keyboard capture type errors

**Math**:
- With 48px tiles at 2.1x zoom: 48 * 2.1 = 100.8px per tile on screen
- 1024px width / 100.8px = ~10.2 tiles wide ✓
- 768px height / 100.8px = ~7.6 tiles tall

---

### ✅ Item #2: HP/MP Display Unreadable
**Status**: COMPLETED
**Priority**: CRITICAL
**Problem**: HP/MP shown as fractions (e.g., "HP: 45/100"), hard to read
**Solution Implemented**:
- ✅ Redesigned layout: HP on left side, MP on right side
- ✅ Display ONLY current value (e.g., "45" not "45/100")
- ✅ Increased font size from 14px to 28px (2x bigger!)
- ✅ Added bold font + stroke for readability
- ✅ Kept bar visualization for at-a-glance status
- ✅ Small "HP"/"MP" labels above numbers

**Files Modified**:
- `src/scenes/UIScene.ts` - Complete HUD redesign

**Visual Changes**:
- Left: "HP" label + big "100" number + red bar
- Right: "MP" label + big "50" number + blue bar
- Font: 28px bold with 3px black stroke (easily visible from distance)

---

### ✅ Item #3: Word Repeats in Spell Dialog
**Status**: COMPLETED
**Priority**: CRITICAL
**Problem**: Same words appearing multiple times (breaks educational value)
**Solution Implemented**:
- ✅ Fisher-Yates shuffle for unbiased word randomization
- ✅ Session-based word pool (refreshed at combat start)
- ✅ Sampling without replacement - words never repeat in same session
- ✅ Auto-refill when pool exhausted (reshuffles remaining words)
- ✅ Track used words via Set for O(1) lookup

**Files Modified**:
- `src/systems/WordManager.ts`:
  - Added `currentSessionUsedWords: Set<string>`
  - Added `currentSessionWordPool: string[]`
  - Added `resetSessionWordPool()` - shuffles all words for level
  - Added `shuffleArray()` - Fisher-Yates implementation
  - Added `markWordAsUsed()` - tracks used words
  - Refactored `getWordsForSpell()` - uses pool instead of random
- `src/scenes/GameScene.ts`:
  - Call `resetSessionWordPool()` on `combatStarted` event

**Algorithm**:
1. Combat start: Shuffle all words for current level into pool
2. Pop words from pool (LIFO for performance)
3. Track each word in `usedWords` Set
4. When pool empty: Reshuffle and continue
5. Result: No repeats within combat session

---

### ❌ Item #4: Map Reachability Guarantee
**Status**: Not Started
**Priority**: CRITICAL
**Problem**: Some rooms may be unreachable
**Solution**:
- Add BFS validation from entrance
- Regenerate if rooms isolated
- Add unit tests (100 dungeons)

**Files to modify**:
- `src/systems/DungeonGenerator.ts`
- `tests/unit/dungeon.test.ts` (new)

---

### ❌ Item #5: Game-Over Overlay
**Status**: Not Started
**Priority**: CRITICAL
**Problem**: Overlay doesn't cover screen, wrong flow
**Solution**:
- Full-screen overlay (Dark Souls style)
- "Return to Menu" button
- Go to MenuScene, not restart

**Files to modify**:
- `src/scenes/GameScene.ts`

---

## High Priority Items

### ❌ Item #6: Spell Count Limit
**Status**: Not Started

### ❌ Item #7: Tutorial Improvements
**Status**: Not Started

### ❌ Item #8: Map Boundary Walls
**Status**: Not Started

### ❌ Item #9: Remove Green Bar Bug
**Status**: Not Started

---

## Medium Priority Items

### ❌ Item #10: Monster Level → Word Difficulty Mapping
**Status**: Not Started

### ❌ Item #11: Progression Transition Levels
**Status**: Not Started

### ❌ Item #12: Boss Difficulty Increase
**Status**: Not Started

### ❌ Item #13: Word List Verification
**Status**: Not Started

### ❌ Item #14: Spell Counter Visual Display
**Status**: Not Started

### ❌ Item #15: Timer Delayed to 4th/5th Grade
**Status**: Not Started

---

## Testing Log

### TypeScript Checks
- [ ] Initial typecheck before starting

### E2E Tests
- [ ] Run after critical fixes

### Manual Tests
- [ ] Test on 1366x768 Chromebook (after viewport fix)
- [ ] Verify HP/MP readable from 3 feet
- [ ] Verify no word repeats in 10 combat encounters

---

## Notes
- Starting with Critical Priority items (#1-5)
- Will run typecheck after each major change
- Will update this file with ✅ as items complete
