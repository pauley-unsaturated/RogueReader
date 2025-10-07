# RogueReader

**An educational roguelike game that teaches sight-reading through spell-casting mechanics**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.70-orange.svg)](https://phaser.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

RogueReader combines the addictive gameplay of roguelike dungeon crawlers with evidence-based reading instruction. Players explore procedurally-generated dungeons, cast spells by reading words aloud, and progress through 20 levels of increasing vocabulary complexity—from simple CVC words to advanced academic vocabulary.

**Core Philosophy:** Every mechanic reinforces reading practice. Players get better at the game BECAUSE they're getting better at reading.

## Key Features

### 🎮 Roguelike Gameplay
- **Procedurally Generated Dungeons**: BSP-based dungeon generation with progressive difficulty scaling
- **Boss-Gated Progression**: Defeat the floor boss to unlock the stairwell to the next level
- **Room-Based Combat**: Doors lock when entering combat rooms with enemies (Binding of Isaac style)
- **Safe Entrance Rooms**: Each floor starts with a safe room for orientation
- **Permadeath with Progression**: Persistent vocabulary mastery across runs

### 📚 Evidence-Based Reading Instruction
- **20 Progressive Levels**: Mapped to K-10th grade reading standards
  - Levels 1-3: CVC words (cat, dog, run)
  - Levels 4-6: Sight words and blends
  - Levels 7-10: Digraphs and long vowels
  - Levels 11-15: Multi-syllable words
  - Levels 16-20: Academic vocabulary
- **Spaced Repetition**: SM-2 algorithm for optimal word mastery
- **Word Complexity = Spell Power**: Harder words deal more damage
- **Speech Recognition**: Real-time pronunciation feedback (Whisper API integration planned)

### ⚔️ Spell-Casting Combat System
- **Read to Cast**: Speak words aloud to unleash magical attacks
- **Mana System**: Time-based spell costs (15 MP minimum, scales with difficulty)
- **Passive MP Regeneration**: 1 MP per second to prevent deadlock
- **Combat Bonuses**: Restore 25% max MP after clearing rooms
- **Enemy Variety**: Slimes, goblins, orcs, dragons—each with unique behaviors

### 🚪 Dynamic Door System
- Doors lock automatically when entering combat rooms with living enemies
- Visual feedback: Semi-transparent when open, solid brown when closed
- Doors unlock after clearing all enemies in the room
- Movement blocking ensures tactical gameplay

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with microphone access (for speech recognition)

### Installation

```bash
# Clone the repository
git clone https://github.com/pauley-unsaturated/RogueReader.git
cd RogueReader

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `https://localhost:3000`

### Build Commands

```bash
# Development server (hot-reload enabled)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Run E2E tests
npm run test:e2e
```

## Architecture

### Tech Stack
- **Frontend**: Phaser 3.70+ (TypeScript)
- **Build Tool**: Vite 5.0
- **Speech Recognition**: Whisper API (integration in progress)
- **Testing**: Vitest + Puppeteer for E2E tests

### Core Systems

#### DungeonGenerator (`src/systems/DungeonGenerator.ts`)
- BSP-based procedural generation
- Room types: entrance, combat, treasure, puzzle, shop, boss
- Distance-based boss placement algorithm (90% probability decay)
- Automatic door placement at combat room entrances

#### WordManager (`src/systems/WordManager.ts`)
- Vocabulary progression across 20 levels
- SM-2 spaced repetition algorithm
- Word mastery tracking
- Difficulty-based word selection

#### CombatSystem (`src/systems/CombatSystem.ts`)
- Turn-based combat with spell casting
- Damage calculation based on word complexity
- Enemy AI with patrol and chase behaviors
- Room-based enemy spawning

#### Door System (`src/entities/Door.ts`)
- Automatic locking/unlocking based on room state
- Movement blocking when closed
- Visual animations (open/close with tweens)
- Room boundary detection for lock triggers

### Input Handling
- **Keyboard**: Arrow keys for movement, Spacebar for spell casting, ESC for pause
- **Speech**: Microphone input for word recognition (Shift+Spacebar to record)
- **Mobile**: Touch controls with virtual joystick

## Project Structure

```
RogueReader/
├── src/
│   ├── components/       # UI components (CombatUI, CastingDialog, HotBar)
│   ├── config/           # Game configuration and constants
│   ├── entities/         # Game entities (Player, Enemy, Door, Stairwell)
│   ├── scenes/           # Phaser scenes (MenuScene, GameScene, UIScene)
│   ├── services/         # External services (Speech recognition, pronunciation)
│   └── systems/          # Core game systems (Combat, Dungeon, Word management)
├── tests/
│   └── e2e/              # End-to-end tests with Puppeteer
├── public/
│   └── assets/           # Game assets (sprites, audio)
├── DESIGN.md             # Design decisions and rationale
├── SPECIFICATION.md      # Technical specifications
└── CLAUDE.md             # AI assistant guidance
```

## Game Mechanics

### Spell Casting Flow
1. Player encounters enemy
2. Press **Spacebar** to open casting dialog
3. Word appears on screen (difficulty based on current level)
4. Hold **Shift+Spacebar** to record pronunciation
5. Speak word clearly
6. Release to process speech
7. Successful reading = spell damage to enemy
8. Failed reading = spell fizzles, MP still consumed

### Mana (MP) System
- **Base Cost**: 15 MP minimum per spell
- **Time-Based Scaling**: +1 MP per second of word difficulty
- **Passive Regen**: 1 MP per second (always active)
- **Combat Bonus**: +25% max MP after defeating all enemies in a room
- **Strategic Depth**: Players must balance spell attempts vs. waiting for regen

### Door Locking Mechanics
- **Entrance Trigger**: Doors close when entering combat/boss room with living enemies
- **Exit Trigger**: Doors open when all enemies in current room are defeated
- **Movement Blocking**: Closed doors prevent player from leaving mid-combat
- **No Entrance Locks**: Entrance rooms (room 0) never have doors or enemies

## Testing

### E2E Test Suite
RogueReader includes comprehensive end-to-end tests using Puppeteer:

```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:watch     # Watch mode for development
```

**Test Coverage:**
- Boss placement verification (distance from entrance)
- Door locking/unlocking mechanics
- Room boundary detection
- Player movement and collision
- Combat initiation and resolution

**Test Utilities:**
- BFS pathfinding for automated navigation
- Game state inspection helpers
- Screenshot capture for debugging
- Room transition tracking

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Path alias `@/` maps to `src/`
- ESLint + Prettier for formatting

### Input Handling Rules
- **ALWAYS** use Phaser's input system (`this.input.keyboard.on()`)
- **NEVER** mix DOM event listeners with Phaser input
- Clean up input listeners in scene `shutdown()` method

### Asset Pipeline
- Sprites processed through `pixel_perfect_processor.py`
- 64x64 wizard sprites with flood-fill background removal
- 32x32 tile-based collision grid

### Design Documentation
- Update `DESIGN.md` for all design decisions and rule changes
- Document mechanics before implementation
- Include rationale for system choices

## Educational Impact

RogueReader is designed around evidence-based reading instruction principles:

- **Motivation**: Game progression provides intrinsic motivation to practice reading
- **Spaced Repetition**: Words reappear at optimal intervals for retention
- **Progressive Difficulty**: Vocabulary complexity scales with player skill
- **Immediate Feedback**: Speech recognition provides instant pronunciation correction
- **Mastery Tracking**: Visual progress indicators show vocabulary growth

Target audience: K-10th grade students, with particular focus on:
- Early readers building phonics skills
- Struggling readers needing engagement and practice
- English language learners expanding vocabulary

## Roadmap

### Current Status (v1.0)
- ✅ Core roguelike gameplay loop
- ✅ Procedural dungeon generation
- ✅ Door-based room locking system
- ✅ Boss-gated progression
- ✅ 20-level vocabulary progression
- ✅ MP regeneration system
- ✅ E2E test infrastructure

### Planned Features (v1.1+)
- 🔄 Full speech recognition integration (Whisper API)
- 🔄 Pronunciation feedback with phoneme analysis
- 🔄 Treasure chest unlocking mini-games
- 🔄 Shop system with word-based currency
- 🔄 Persistent player profiles and statistics
- 🔄 Leaderboards for reading speed and accuracy
- 🔄 Parent/teacher dashboard for progress tracking

## Contributing

Contributions are welcome! This project is designed for AI-assisted development with Claude Code.

### Development Workflow
1. Read `DESIGN.md` for design philosophy
2. Check `SPECIFICATION.md` for technical details
3. Review `CLAUDE.md` for AI assistant guidance
4. Make changes and update documentation
5. Run `npm run typecheck` before committing
6. Update `DESIGN.md` for any design decisions

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- **Phaser 3**: Amazing game framework that makes browser games delightful
- **Whisper**: OpenAI's speech recognition for educational feedback
- **Claude Code**: AI-assisted development for rapid prototyping and testing
- **Roguelike Community**: Inspiration from classics like NetHack, Brogue, and The Binding of Isaac

---

**Made with ❤️ for young readers everywhere**
