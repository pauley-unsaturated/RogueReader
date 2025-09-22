# DESIGN.md - RogueReader Game Design Decisions

## Core Design Philosophy
Every mechanic reinforces reading practice while maintaining compelling roguelike gameplay. Players should feel they're getting better at the game BECAUSE they're getting better at reading.

## Combat Mechanics

### Option 1: Spell Chain Combat (Combo System)
- **Basic Attack**: Read a word to cast damage spell
- **Chain Multiplier**: Successfully reading multiple words quickly increases damage (1x, 1.5x, 2x, 3x...)
- **Defensive Stance**: Read words to generate shields that block incoming damage
- **Counter-Spell**: When enemy telegraphs attack, player has 3 seconds to read a defensive word
- **Elemental Typing**: Words have element types (fire/ice/lightning) based on phonetic properties
  - Hard consonants (K, T, P) = Lightning
  - Soft sounds (S, M, L) = Water/Ice
  - Fricatives (F, V, TH) = Fire
- **Reading Benefit**: Faster readers can build higher combos and react to threats

### Option 2: Word Power Combat (Complexity = Strength)
- **Damage Scaling**: Longer/harder words deal more damage
- **Spell Types by Word Category**:
  - Nouns = Direct damage spells
  - Verbs = Status effects (burn, freeze, stun)
  - Adjectives = Buffs/debuffs
  - Compound words = Area attacks
- **Mana System**: Each word costs mana based on difficulty
- **Critical Hits**: Perfect pronunciation (when speech recognition added) = 2x damage
- **Reading Benefit**: Advanced readers access more powerful spell types

### Option 3: Tactical Spell Grid Combat
- **Spell Positioning**: Words appear in grid positions around enemies
- **Target Selection**: Read specific words to hit specific enemies/body parts
- **Weakness Exploitation**: Enemies show word hints for their weaknesses
- **Combo Patterns**: Reading words in specific orders creates special attacks
- **Time Pressure**: Words fade if not read quickly enough
- **Reading Benefit**: Better readers can execute complex tactical patterns

## Treasure/Inventory System

### Option 1: Enchanted Loot Library
- **Treasure Chests**: Protected by "Lock Words" - must read 3-5 words correctly to open
- **Item Identification**: All items start unidentified, read their description to reveal stats
- **Upgrade Scrolls**: Find scrolls with upgrade words - reading them enhances equipment
- **Cursed Items**: Misreading identification words may curse items (removable by reading cleansing spell)
- **Inventory Sorting**: Items auto-sort by word difficulty of their names
- **Special Mechanic**: "Word Forge" - Combine items by reading both their names perfectly in sequence

### Option 2: Spell Component Collection
- **Component Drops**: Enemies drop spell components with word labels
- **Recipe Books**: Find spellbooks that show component combinations
- **Crafting**: Read all component names to craft new spells
- **Rarity Tiers**:
  - Common (CVC words)
  - Rare (multisyllabic)
  - Epic (compound words)
  - Legendary (academic vocabulary)
- **Storage Bags**: Limited inventory, but reading bag descriptions increases capacity
- **Special Mechanic**: "Living Library" - A pet/companion that stores excess words and can be summoned by reading its name

### Option 3: Word Currency Economy
- **Gold Words**: Enemies drop "gold words" of varying value based on difficulty
- **Merchant Encounters**: Shop NPCs require reading item names to purchase
- **Haggling System**: Read persuasion words to get better prices
- **Investment Vaults**: Store words in vaults, they grow in value if you can remember and re-read them later
- **Treasure Maps**: Partial words that need to be completed to reveal treasure locations
- **Special Mechanic**: "Word Bank" - Deposit mastered words for passive income generation

## Power-Up System

### Option 1: Spell Evolution Tree
- **Base Spells**: Start with simple CVC word spells
- **Evolution Points**: Earn by perfect word streaks
- **Upgrade Paths**: Each spell can evolve 3 different ways
  - Speed Path: Reduces casting time
  - Power Path: Increases damage/effect
  - Utility Path: Adds secondary effects
- **Word Mastery Bonus**: Mastered words provide permanent stat boosts
- **Synergy System**: Certain word combinations unlock hidden power-ups
- **Ultimate Spells**: Unlock by reading entire sentences perfectly

### Option 2: Runic Augmentation
- **Rune Slots**: Equipment has slots for word runes
- **Rune Types**:
  - Prefix Runes: Add effects to spell starts
  - Suffix Runes: Add effects to spell ends
  - Core Runes: Modify base spell behavior
- **Combination Effects**: Specific rune word combinations create set bonuses
- **Rune Charging**: Runes need to be "charged" by reading them periodically
- **Meta-Progression**: Permanent rune unlocks between runs based on total words read

### Option 3: Companion Spirit System
- **Word Spirits**: Befriend spirits by reading their true names
- **Spirit Levels**: Spirits grow stronger as you read more words from their domain
  - Nature Spirit: Nature/animal words
  - Scholar Spirit: Academic words
  - Warrior Spirit: Action words
- **Spirit Abilities**: Each provides passive bonuses and active abilities
- **Spirit Fusion**: Combine spirits by reading fusion incantations
- **Bond Strength**: Maintained by regularly reading spirit-specific word lists

## Boss Battle Mechanics

### Option 1: Linguistic Duel System
- **Boss Phases**: Each phase requires different word types
  - Phase 1: Speed reading (many simple words)
  - Phase 2: Accuracy test (complex words, no mistakes allowed)
  - Phase 3: Memory challenge (repeat previously shown words)
- **Boss Patterns**: Bosses telegraph attacks with partial words - complete them to dodge
- **Vulnerability Windows**: Boss shows weakness word - limited time to read and exploit
- **Environmental Words**: Arena contains environmental hazards with word labels to activate/avoid
- **Climax Mechanic**: Final blow requires reading a full sentence that summarizes the boss's defeat

### Option 2: Word Puzzle Bosses
- **Shield Layers**: Bosses have word shields that must be broken in order
- **Weakness Rotation**: Boss weakness changes - shown as scrambled word to unscramble
- **Minion Summoning**: Boss summons helpers with word names - prioritize targets by reading
- **Rage Timer**: Boss gets stronger over time - read "calm" words to reset rage
- **Special Mechanic**: "True Name" - Discover and speak boss's true name for massive damage

### Option 3: Narrative Battle System
- **Story Progression**: Boss fight is a story told through words
- **Choice Points**: Read different words to make different tactical choices
- **Dialogue Attacks**: Boss taunts with sentences - find and read the key word to counter
- **Transformation Triggers**: Reading specific word sequences causes boss transformations
- **Victory Condition**: Complete the boss's story by reading the final paragraph

## Dungeon Progression Mechanics

### Option 1: The Ascending Library
- **Boss as Gatekeeper**: Each floor's boss guards a "Tome of Passage"
- **Tome Challenge**: Read the tome's passage (grade-appropriate text) to unlock stairs
- **Partial Progress**: Can attempt tome multiple times, progress saves
- **Secret Exits**: Hidden stairs accessed by reading environmental clues
- **Backtracking Bonus**: Return to cleared floors to practice words for bonus XP
- **Special Mechanic**: "Word Elevator" - Skip floors by reading increasingly difficult word chains

### Option 2: Portal Inscription System
- **Boss Keys**: Bosses drop key fragments with words on them
- **Portal Assembly**: Combine key fragments by reading all their words in sequence
- **Portal Stability**: Portal degrades if you take too long - maintain by reading "stability" words
- **Multiple Portals**: Choose between easy/hard portals based on word difficulty
- **Portal Network**: Unlock fast travel by memorizing portal word addresses

### Option 3: The Growing Spellbook
- **Page Collection**: Bosses drop spellbook pages
- **Chapter Completion**: Each floor is a chapter, must collect all pages to proceed
- **Page Order**: Pages must be read in correct order to activate stairs
- **Bonus Pages**: Optional pages provide lore but aren't required
- **Book of Power**: Completed chapters provide permanent abilities
- **Special Mechanic**: "Speed Reading Challenge" - Speedrun option to skip to next level by reading entire chapter quickly

## Selected Design Decisions

Based on gameplay goals and educational value:

### Core Systems
1. **Combat**: Spell Chain Combat with Combo System + Complexity Scaling
   - Chain multipliers for successive correct readings
   - Damage scales with word difficulty
   - Defensive counter-spell mechanics

2. **Treasure**: Word Currency Economy with Merchant Haggling
   - Gold words as currency based on difficulty
   - Merchant encounters require reading item names
   - Haggling through persuasion words

3. **Power-Ups**: Hybrid of Runic Augmentation + Companion Spirits
   - Equipment slots for prefix/suffix/core runes
   - Companion spirits that bond through vocabulary domains
   - Both systems provide progression variety

4. **Early Bosses**: Linguistic Duel System (for Cole's level)
   - Phase-based battles testing different skills
   - Word shields and vulnerability windows
   - Appropriate for K-3 reading levels

5. **Late-Game Bosses**: Academic Challenge System (grades 8+)
   - SAT-style analogies (cat:kitten::dog:?)
   - Definition matching with partial letters
   - Context-based vocabulary ("Choose the word that best completes this sentence")
   - Synonym/antonym challenges
   - Word root/prefix/suffix manipulation

6. **Progression**: The Growing Spellbook
   - Pages collected from bosses and exploration
   - Chapters unlock new dungeon levels
   - Meta-progression through permanent abilities

### Implementation Priority (for Cole's reading level)
Focus on grades K-3 mechanics first:
- Simple CVC words for basic spells
- Sight words for defensive abilities
- Phonics patterns for combo bonuses
- Picture-word association for treasure

Advanced SAT-style mechanics will be implemented once core systems are proven and Cole progresses to higher reading levels.

## Success Metrics

### Engagement Metrics
- Words read per session
- Voluntary replay of completed levels
- Time spent in game vs. in menus
- Collection completion percentage

### Learning Metrics
- Word recognition speed improvement
- Accuracy rate trends
- Vocabulary expansion rate
- Difficulty curve progression speed

### Fun Metrics
- Combat chain high scores
- Boss attempts before victory
- Treasure collection rate
- Player-initiated difficulty increases

## Balancing Philosophy

- **Never Punish Reading Attempts**: Mistakes slow progress but don't cause regression
- **Always Reward Effort**: Even failed attempts provide some XP/resources
- **Multiple Valid Strategies**: Both careful readers and speed readers can succeed
- **Adaptive Difficulty**: Game secretly adjusts based on reading performance
- **Celebration Moments**: Big visual/audio rewards for reading achievements
- **No Timers on Learning**: Combat has time pressure, but learning new words doesn't

## Accessibility & Progression Mechanics

### Timer vs. Tries System (Grade-Based)

**Early Levels (K-2nd Grade)**: No Timer, Uses Try-Based System
- Players get 3 attempts per word initially
- Focus is on accuracy and learning, not speed
- Reduces anxiety for beginning readers
- Encourages experimentation without time pressure
- **Combat Paused**: Enemies cannot attack during spell casting dialog

**Mid Levels (3rd-4th Grade)**: Hybrid System
- Short timer (8-10 seconds) OR 2 tries, whichever comes first
- Introduces mild time pressure while maintaining safety net
- Builds reading fluency gradually
- **Combat Paused**: Enemies cannot attack during spell casting dialog

**Advanced Levels (5th+ Grade)**: Timer-Based System
- Standard 5-7 second timer for grade-level words
- Encourages reading fluency and quick recognition
- Mimics real-world reading speed expectations
- **Real-Time Combat**: Enemies continue attacking (adds strategic pressure)

### Combat Fairness Mechanics

**Grades K-4: Safe Casting Mode**
- Combat completely pauses when spell dialog appears
- Enemies freeze in place, attack timers pause
- Player can focus entirely on reading without distraction
- Removes unfair deaths from reading time
- Educational focus over gameplay challenge

**Grades 5+: Strategic Casting Mode**
- Enemies continue their attack patterns during casting
- Players must balance reading speed with defensive positioning
- Adds strategic depth for advanced players
- Mimics real-time decision making

### Mana Point (MP) Scaling System

**MP as Universal Enhancement Resource**
- **Timer Extension**: Spend MP to add 2-3 seconds to spell timer
- **Extra Tries**: Spend MP to gain additional attempts (1 MP = 1 extra try)
- **Scaling Cost**: Higher grade levels cost more MP for same benefit
- **Strategic Resource**: Creates meaningful choice between spell power and accessibility

**MP Cost Examples**:
- K-2nd Grade: 1 MP = +1 extra try
- 3rd-5th Grade: 2 MP = +3 seconds timer OR +1 try
- 6th+ Grade: 3 MP = +2 seconds timer OR +1 try

**Design Benefits**:
- Allows players to adapt difficulty to their current ability
- Provides progression path for players who struggle with speed
- Creates strategic depth in resource management
- Maintains challenge while offering accessibility options

## Audio Design (To Be Implemented)

### Music System
- **Dynamic Soundtrack**: Music intensity based on combat state
  - Exploration: Calm, ambient dungeon music
  - Combat: Energetic battle themes
  - Boss Fights: Epic orchestral tracks
  - Victory: Triumphant fanfare
- **Adaptive Layers**: Add/remove instrument layers based on combo multiplier
- **Reading Success Audio**: Musical notes that play when words are read correctly

### Sound Effects
- **Spell Casting**:
  - Unique sound per element (fire = whoosh, ice = crystallize, lightning = zap)
  - Pitch variation based on word complexity
  - Combo building sounds (escalating tones)
- **Combat Feedback**:
  - Enemy hit sounds
  - Player damage sounds (with shield/armor variations)
  - Critical hit emphasis
- **Environmental**:
  - Footsteps on different surfaces
  - Door opening/closing
  - Treasure chest unlocking
  - Item pickup jingles
- **UI Sounds**:
  - Menu navigation clicks
  - Word appearance "pop"
  - Success/failure chimes
  - Level up fanfare

### Voice & Speech
- **Tutorial Narration**: Professional voice-over for tutorial (currently using TTS)
- **Character Voices**:
  - Wizard spell incantations
  - Enemy battle cries
  - NPC merchant greetings
- **Reading Assistance**:
  - Optional word pronunciation on hover
  - Celebration phrases for streaks ("Excellent!", "Amazing combo!")

### Accessibility Audio
- **Screen Reader Support**: Full compatibility
- **Audio Cues**: Non-visual feedback for all important events
- **Volume Sliders**: Separate controls for music, SFX, voice
- **Audio Descriptions**: Optional descriptive audio for visual elements

## Implementation Status

### ✅ Completed Systems

#### Combat System (Implemented)
- **Spell Chain Combat**: Combo multipliers (1x → 1.5x → 2x → 2.5x → 3x)
- **Word Complexity Scaling**: Damage increases with word difficulty
  - Simple CVC words: Base damage
  - Medium complexity: 1.5x damage
  - Complex words: 2.5x+ damage
- **Elemental System**: Phonetic-based elements (fire/ice/lightning)
- **Enemy Types**: 6 types with unique stats (goblin, skeleton, bat, slime, orc, demon)
- **Combat UI**: Real-time health bars, combo meters, damage numbers

#### Tutorial System (Implemented)
- **Interactive Tutorial**: 6-step guide with voice narration
- **Text-to-Speech**: Browser-based speech synthesis
- **Visual Effects**: Twinkling stars background
- **Accessibility**: Skip option, keyboard controls

#### Word Management (Implemented)
- **Spaced Repetition**: SM-2 algorithm for word mastery
- **Level Progression**: 20 levels of vocabulary (K-10th grade)
- **Fallback Words**: 30+ words per level for immediate play
- **Word History**: Tracks attempts, successes, and mastery

### 🚧 Next Implementation Priority

1. **Combat Fairness System** (Critical Fix)
   - Pause enemy attacks during spell dialog for grades K-4
   - Implement grade-level detection for combat behavior
   - Prevent unfair deaths during reading time

2. **Speech Recognition Integration** (Highest Priority)
   - Whisper API for spell casting
   - Real-time pronunciation feedback
   - Microphone UI indicators

2. **Treasure System**
   - Word-lock mechanics for chests
   - Item identification through reading
   - Rarity tiers based on word difficulty

3. **Boss Battles**
   - Multi-phase encounters
   - Word-based vulnerability windows
   - Unique mechanics per boss type

4. **Merchant System**
   - Word currency economy
   - Haggling through vocabulary
   - Shop rooms with NPCs

5. **Power Progression**
   - Spell evolution paths
   - Equipment augmentation
   - Meta-progression systems

This creates a vertical slice that demonstrates all core loops while maintaining focus on reading practice.