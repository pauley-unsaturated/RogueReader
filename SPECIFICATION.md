SPECIFICATION.md - Reading Roguelike: "Spell Speakers"
Project Overview
A browser-based educational roguelike game that teaches sight-reading through spell-casting mechanics. Players must read words aloud to cast spells, defeat enemies, and progress through procedurally-generated dungeons. Each dungeon level corresponds to reading skill level.
Core Game Loop

Explore procedurally-generated dungeon rooms
Encounter enemies, treasures, or puzzles
Read Aloud words to cast spells or solve challenges
Progress through rooms collecting loot and experience
Level Up reading skills to access deeper dungeon levels
Die & Retry with persistent reading progress and hall of fame items

Technical Architecture
Stack

Frontend: Phaser 3.70+ (JavaScript/TypeScript)
Backend: Node.js + Express (running on M4 Mac mini)
Speech Recognition: Whisper (running locally via whisper.cpp or Whisper API)
Database: SQLite (local storage of progress)
LLM Integration: Claude API for content generation and assessment
Hosting: Local network (192.168.x.x:3000)

Key Services
javascript// Server endpoints needed
POST /api/speech/recognize     // Process audio, return recognized word
POST /api/progress/save        // Save reading progress
GET  /api/words/next           // Get next words based on skill level
POST /api/dungeon/generate     // Generate new dungeon based on reading level
GET  /api/player/profile       // Load saved progress
Game Mechanics
Controls

Arrow Keys: Move wizard (8-directional)
Spacebar: Interact (open chest, talk to NPC)
Mouse Click: Alternative movement
Hold Shift + Arrow: Face direction without moving
Enter: Confirm spell reading complete

Spell Casting System
javascriptspellTypes = {
  "attack": {
    trigger: "onEnemyTarget",
    wordCount: 1,        // Start with single words
    timeLimit: 5000,     // 5 seconds to read
    damage: baseDamage * accuracyScore
  },
  "defense": {
    trigger: "onIncomingAttack",
    wordCount: 1,
    timeLimit: 3000,     // Faster for defense
    shieldStrength: baseShield * accuracyScore
  },
  "treasure": {
    trigger: "onChestOpen",
    wordCount: 2,        // Two words for better loot
    timeLimit: 8000,
    lootMultiplier: accuracyScore
  }
}
Reading Progression System
Levels 1-20 (Dungeon Floors)
javascriptconst readingLevels = {
  // Floors 1-3: CVC words (cat, dog, run)
  1: { pattern: "CVC", vowels: ["a"], examples: ["cat", "bat", "sat", "mat"] },
  2: { pattern: "CVC", vowels: ["a", "e"], examples: ["bed", "red", "pet"] },
  3: { pattern: "CVC", vowels: ["a", "e", "i"], examples: ["big", "hit", "sit"] },
  
  // Floors 4-6: Sight words + CVC
  4: { sightWords: ["the", "and", "is", "it"], mixCVC: true },
  5: { sightWords: ["he", "she", "we", "be"], mixCVC: true },
  
  // Floors 7-10: Blends (bl, cr, st)
  7: { patterns: ["CCVC"], blends: ["bl", "br", "cl", "cr"] },
  8: { patterns: ["CVCC"], endings: ["st", "nd", "mp"] },
  
  // Floors 11-15: Long vowels
  11: { patterns: ["CVCe"], examples: ["make", "like", "home"] },
  12: { patterns: ["CVVC"], teams: ["ea", "ee", "ai", "oa"] },
  
  // Floors 16-20: Multi-syllable
  16: { syllables: 2, examples: ["button", "happy", "little"] },
  18: { syllables: 2-3, includes: ["ing", "ed", "er"] },
  20: { phrases: true, words: 2-3, examples: ["the big dog", "run fast now"] }
}
Spaced Repetition Algorithm
javascriptclass WordMastery {
  constructor(word) {
    this.word = word;
    this.interval = 1;      // Start with frequent repetition
    this.easeFactor = 2.5;  // Standard SM-2 factor
    this.repetitions = 0;
    this.nextReview = Date.now();
  }
  
  processResponse(accuracy, responseTime) {
    // 0-3 quality based on accuracy and speed
    const quality = this.calculateQuality(accuracy, responseTime);
    
    if (quality < 2) {
      this.repetitions = 0;
      this.interval = 1;
    } else {
      this.repetitions += 1;
      if (this.repetitions === 1) {
        this.interval = 1;
      } else if (this.repetitions === 2) {
        this.interval = 6;
      } else {
        this.interval = Math.round(this.interval * this.easeFactor);
      }
      
      this.easeFactor = Math.max(1.3, 
        this.easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
    }
    
    this.nextReview = Date.now() + (this.interval * 60000); // Convert to minutes
  }
}
Procedural Generation
Dungeon Generation (BSP)
javascriptclass DungeonGenerator {
  generate(floor, readingLevel) {
    const config = {
      width: 50 + (floor * 2),        // Dungeons get bigger
      height: 50 + (floor * 2),
      minRoomSize: 5,
      maxRoomSize: 9,
      maxRooms: 8 + Math.floor(floor / 3),
      
      // Room type distribution based on floor
      roomTypes: {
        combat: 0.4,
        puzzle: 0.2,
        treasure: 0.2,
        challenge: 0.1,
        shop: 0.05,
        boss: 0.05  // One guaranteed per floor
      },
      
      // Word distribution
      wordsPerRoom: {
        min: 3,
        max: 8,
        difficulty: readingLevel
      }
    };
    
    return this.bspGenerate(config);
  }
}
Room Templates
javascriptconst roomTemplates = {
  "combat_basic": {
    layout: [
      "###D###",
      "#.....#",
      "#..E..#",
      "#.....#",
      "#..E..#",
      "#.....#",
      "###D###"
    ],
    legend: {
      "#": "wall",
      ".": "floor",
      "D": "door",
      "E": "enemySpawn"
    },
    wordTriggers: ["onEnemyAttack", "onEnemyDefeat"]
  },
  
  "puzzle_bridges": {
    layout: [
      "#######",
      "#..~..#",
      "#..~..#",
      "D..B..D",
      "#..~..#",
      "#..~..#",
      "#######"
    ],
    legend: {
      "~": "water",
      "B": "bridge_puzzle"
    },
    wordTriggers: ["onBridgeActivate"]
  },
  
  "treasure_vault": {
    layout: [
      "#######",
      "##TTT##",
      "#T...T#",
      "#T.C.T#",
      "#T...T#",
      "###D###"
    ],
    legend: {
      "T": "treasure_small",
      "C": "treasure_epic"
    },
    wordTriggers: ["onChestOpen"]
  }
};
Asset Generation Plan
Tile Requirements (16x16 or 32x32 pixels)
javascriptconst requiredTiles = {
  // Basic tiles
  floor: ["stone", "stone_crack", "stone_moss"],
  wall: ["brick", "brick_top", "brick_damaged"],
  door: ["closed", "open", "locked"],
  
  // Interactive
  chest: ["common", "rare", "epic", "mythic"],
  trap: ["spikes", "magic_rune", "arrow_trap"],
  
  // Decorative
  props: ["torch", "barrel", "bones", "puddle"],
  
  // Characters (need animations)
  wizard: {
    idle: ["north", "south", "east", "west"],
    walk: ["north", "south", "east", "west"], // 4 frames each
    cast: ["north", "south", "east", "west"], // 6 frames each
  },
  
  enemies: {
    slime: ["idle", "move", "attack", "defeat"],
    skeleton: ["idle", "move", "attack", "defeat"],
    goblin: ["idle", "move", "attack", "defeat"]
  }
};
Generation Strategy

Use AI image generation for base sprites (Midjourney/DALL-E)
Process through pixel art converter
Use free asset packs as base (OpenGameArt.org)
Simple geometric shapes for MVP

Progression Systems
Player Stats
javascriptclass PlayerCharacter {
  constructor() {
    this.stats = {
      health: 100,
      mana: 50,
      readingLevel: 1,      // Current dungeon floor access
      wordsmastered: 0,     // Total words learned
      accuracy: 1.0,        // Reading accuracy score
      speed: 1.0,           // Reading speed multiplier
    };
    
    this.equipment = {
      hat: null,         // +mana
      robe: null,        // +health
      wand: null,        // +damage
      boots: null,       // +speed
      amulet: null,      // +special
    };
    
    this.spellbook = [
      "Fireball",        // Unlocked by default
      // More spells unlocked by reading challenges
    ];
    
    this.hallOfFame = []; // Permanent trophy items
  }
}
Loot System
javascriptconst lootTable = {
  calculateRarity(accuracy, speed, streak) {
    const score = (accuracy * 0.5) + (speed * 0.3) + (streak * 0.2);
    
    if (score > 0.95) return "mythic";    // 5% chance
    if (score > 0.85) return "epic";      // 10% chance
    if (score > 0.65) return "rare";      // 20% chance
    if (score > 0.35) return "uncommon";  // 30% chance
    return "common";                      // 35% chance
  },
  
  itemPrefixes: {
    common: ["Worn", "Simple", "Basic"],
    uncommon: ["Sturdy", "Quality", "Fine"],
    rare: ["Enchanted", "Mystic", "Powerful"],
    epic: ["Legendary", "Ancient", "Masterwork"],
    mythic: ["Godly", "Eternal", "Cosmic"]
  }
};
Data Persistence
Database Schema
sql-- Player progress
CREATE TABLE players (
  id INTEGER PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP,
  reading_level INTEGER DEFAULT 1,
  total_words_read INTEGER DEFAULT 0,
  play_time_minutes INTEGER DEFAULT 0
);

-- Word mastery tracking
CREATE TABLE word_mastery (
  player_id INTEGER,
  word TEXT,
  times_seen INTEGER,
  times_correct INTEGER,
  average_response_time REAL,
  next_review TIMESTAMP,
  ease_factor REAL DEFAULT 2.5,
  FOREIGN KEY(player_id) REFERENCES players(id)
);

-- Hall of Fame items
CREATE TABLE hall_of_fame (
  player_id INTEGER,
  item_name TEXT,
  item_rarity TEXT,
  date_acquired TIMESTAMP,
  dungeon_floor INTEGER,
  FOREIGN KEY(player_id) REFERENCES players(id)
);

-- Session tracking for analytics
CREATE TABLE sessions (
  player_id INTEGER,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  words_practiced INTEGER,
  accuracy REAL,
  floors_completed INTEGER
);
Speech Recognition Integration
Whisper Setup
javascriptclass SpeechRecognizer {
  constructor() {
    // Option 1: Local whisper.cpp
    this.whisperPath = '/usr/local/bin/whisper';
    this.model = 'base.en'; // Smaller model for speed
    
    // Option 2: Whisper API
    this.apiEndpoint = 'http://localhost:8080/v1/audio/transcriptions';
  }
  
  async recognizeWord(audioBlob, expectedWord) {
    const transcription = await this.transcribe(audioBlob);
    
    // Fuzzy matching for child speech
    const similarity = this.calculateSimilarity(
      transcription.toLowerCase(),
      expectedWord.toLowerCase()
    );
    
    return {
      recognized: transcription,
      expected: expectedWord,
      accuracy: similarity,
      success: similarity > 0.7  // 70% threshold
    };
  }
}
MVP Features (Week 1-4)
Must Have

 5 dungeon floors with increasing difficulty
 50 CVC words for floors 1-3
 Basic wizard sprite with movement
 3 enemy types (slime, skeleton, goblin)
 Speech recognition for spell casting
 Simple combat system
 Progress saving
 Basic loot (health potions, mana potions)

Nice to Have

 Spell animations
 Background music
 Shop system
 Multiple wizard skins
 Leaderboard

Testing Plan
Week 1: Core Mechanics

Movement and collision
Basic room generation
Speech recognition pipeline

Week 2: Game Loop

Combat with word reading
Loot drops
Floor progression

Week 3: Polish & Cole Testing

Difficulty tuning
UI/UX improvements
Bug fixes from kid testing

Week 4: David Testing & Iteration

Advanced features
Multiplayer prep
Performance optimization

Success Metrics

Cole voluntarily plays for 15+ minutes
Successfully reads 20+ words per session
Shows measurable improvement in reading speed over 1 week
Asks to play without prompting
Reading accuracy improves from baseline by 20%

(Cole is 6, David is 9)
