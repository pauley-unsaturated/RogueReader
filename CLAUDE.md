# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RogueReader is an educational roguelike game that teaches sight-reading through spell-casting mechanics. Built with Phaser 3 and TypeScript, it features procedurally-generated dungeons where players read words aloud to cast spells and progress through reading levels.

## Build and Development Commands

```bash
# Development server (runs on localhost:3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck
```

## Architecture

### Scene System
- **MenuScene**: Main menu and game initialization
- **GameScene**: Core gameplay, dungeon exploration, combat
- **UIScene**: HUD, spell casting interface, word display overlays

### Core Systems
- **DungeonGenerator**: BSP-based procedural generation with progressive scaling
- **WordManager**: Manages reading content, spaced repetition (SM-2 algorithm), word mastery tracking
- **AssetLoader**: Handles sprite loading with fallback graphics
- **Player**: Grid-based movement, collision detection, animation states

### Reading Progression
- 20 levels mapped to K-10th grade vocabulary
- Progressive difficulty from CVC words to academic terms
- Spaced repetition for word mastery
- Real-time speech recognition integration planned (Whisper API)

## Key Implementation Details

### Grid System
- 32x32 pixel tiles
- 1024x768 game resolution
- Grid-based collision detection in Player class
- Room templates use ASCII layouts with legend mapping

### Asset Pipeline
- Sprites processed through `pixel_perfect_processor.py` for clean transparency
- 64x64 wizard sprites with flood-fill background removal
- Assets stored in `public/assets/sprites/`

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/` maps to `src/`
- Module resolution set to "bundler" for Vite compatibility

## Current Development Focus

Based on STATUS.md, immediate priorities are:
1. **Speech Recognition Integration**: Whisper API for spell casting
2. **Combat Mechanics**: Enemy AI, spell effects, damage calculations
3. **Game Progression**: Level completion, XP system, unlocks

## Testing Approach

No automated testing framework currently. Manual testing for:
- Movement and collision
- Room generation
- Game state transitions
- Asset loading and animations

## Important Files

- `SPECIFICATION.md`: Full game design document
- `STATUS.md`: Current development state and priorities
- `src/config/GameConfig.ts`: Game constants and configuration
- `src/systems/DungeonGenerator.ts`: Procedural generation logic
- `src/systems/WordManager.ts`: Reading content and progression