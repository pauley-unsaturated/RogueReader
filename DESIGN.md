# DESIGN.md - RogueReader Game Design Decisions

## Core Design Philosophy
Every mechanic reinforces reading practice while maintaining compelling roguelike gameplay. Players should feel they're getting better at the game BECAUSE they're getting better at reading.

## Combat Mechanics

### Monster Counter-Attacks: Rewarding Reading Quality

**Design Philosophy**: Perfect spell casting should protect you! Reading well isn't just about dealing damage - it's also about defense.

**Probabilistic Counter-Attack System**:
- Enemies have a **base chance to counter-attack** after each player spell
- **Perfect reading** (exact match + good pronunciation) significantly **reduces counter-attack chance**
- **Poor reading** (wrong word, bad pronunciation) = normal or increased counter-attack chance

**Counter-Attack Probabilities**:
- **Bosses** (Melee Range ≤3 tiles): 70% base → **0% with perfect spell**
- **Bosses** (Ranged 4-6 tiles): 50% base → **0% with perfect spell**
- **Normal Enemies** (Melee Range ≤3 tiles): 50% base → **0% with perfect spell**
- **Normal Enemies** (Ranged 4-6 tiles): 30% base → **0% with perfect spell**

**Defense Bonus Calculation**:
- **Exact match** (correct word): +40% defense
- **Perfect pronunciation** (score ≥ 1.0): +40% additional defense
- **Total defense at perfection**: 80% reduction in counter-attack chance

**Example**:
```
Boss at melee range (70% base counter-attack chance)
  - Perfect spell: 70% - 80% = 0% (boss cannot counter!)
  - Good pronunciation (0.9): 70% - 58% = 12% (much safer!)
  - Wrong word: 70% - 0% = 70% (no protection)
```

**Educational Benefits**:
- **Immediate feedback**: Good reading = safety from attacks ("natural 20" D&D feel)
- **Motivation to improve**: Kids WANT to pronounce correctly to avoid damage
- **Strategic depth**: Better readers take less damage, progressing faster
- **Positive reinforcement**: Reading well = powerful defense, not just offense

**Implementation**: See `CombatSystem.ts` `triggerCounterAttacks()` method

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

## Elemental Wizard System & Projectile Mechanics

### Core Design Philosophy
The elemental system adds visual excitement and strategic depth while keeping reading as the primary mechanic. All wizard types are equally viable, offering texture rather than power imbalance.

### Four Schools of Magic

#### Fire Wizard (The Scorcher)
- **Projectile Visual**: Fireball with ember trail
- **Base Stats**: 110% damage, medium projectile speed
- **Special Trait**: Burn damage over time (2 damage/sec for 3 seconds)
- **Projectile Behavior**: Slight arc trajectory with particle trail
- **Color Palette**: Orange/Red/Yellow (#FF4500, #FF8C00, #FFD700)
- **Strategic Niche**: Best against high-HP enemies (bosses)

#### Ice Wizard (The Frostweaver)
- **Projectile Visual**: Ice shard with crystalline particles
- **Base Stats**: 100% damage, fast projectile speed
- **Special Trait**: 30% chance to slow enemies (50% movement for 2 seconds)
- **Projectile Behavior**: Direct line trajectory, leaves frost particles
- **Color Palette**: Light Blue/White/Cyan (#00BFFF, #87CEEB, #E0FFFF)
- **Strategic Niche**: Best for crowd control (multiple enemies)

#### Lightning Wizard (The Stormcaller)
- **Projectile Visual**: Lightning bolt with electric sparks
- **Base Stats**: 90% damage, instant hit speed
- **Special Trait**: 20% chance to chain to nearby enemy (50% damage)
- **Projectile Behavior**: Instant zig-zag path to target
- **Color Palette**: Yellow/White/Purple (#FFFF00, #FFFFFF, #9370DB)
- **Strategic Niche**: Best for clearing weak enemies quickly

#### Arcane Wizard (The Scholar)
- **Projectile Visual**: Purple orb with rotating mystical runes
- **Base Stats**: 100% damage, medium speed
- **Special Trait**: +5% damage per letter beyond 3 (rewards vocabulary)
- **Projectile Behavior**: Spiral trajectory with magical symbols
- **Color Palette**: Purple/Pink/Violet (#9370DB, #DA70D6, #8B008B)
- **Strategic Niche**: Best for advanced readers (scales with word complexity)

### Wizard Selection Mechanics

**Initial Implementation (Random)**:
- Element randomly assigned at game start
- Consistent throughout the run for learning curve
- Future: Character select screen with descriptions

**Future Character Progression**:
- Unlock new wizard types through achievements
- Cosmetic variations (robes, hats, wands) as rewards
- Meta-progression: Slight stat bonuses for mastered elements

### Projectile System Architecture

#### Visual Progression by Combo Level
Projectiles become more visually impressive as combo multiplier increases:
- **Combo 1x**: Basic colored projectile
- **Combo 1.5x**: Add particle trail
- **Combo 2x**: Glow effect + larger size
- **Combo 2.5x**: Enhanced particles + impact effect
- **Combo 3x+**: Full spectacle with screen effects

#### Projectile Behavior Rules
1. **Automatic Targeting**: Projectile fires at nearest enemy
2. **Travel Time**: Creates anticipation (except Lightning's instant hit)
3. **Collision Detection**: Precise hit detection for fair gameplay
4. **Multiple Projectiles**: Can have multiple in flight simultaneously
5. **Cleanup**: Projectiles destroyed on enemy death or floor transition

### Rune-Element Interaction Matrix

Runes have similar but differentiated effects based on wizard element:

| Rune Type | Fire Effect | Ice Effect | Lightning Effect | Arcane Effect |
|-----------|------------|------------|-----------------|---------------|
| **Blast** (Suffix) | Explosion radius +50% | Freeze splash (slows nearby) | Chain +1 enemy guaranteed | Knockback enemies |
| **Echo** (Core) | Leaves fire trail on ground | Creates temporary ice walls | Projectile forks to 2 targets | Duplicates projectile |
| **Power** (Core) | +40% burn tick damage | +40% slow duration | +40% chain damage | +40% complexity bonus |
| **Shield** (Suffix) | Fire shield (damages melee attackers) | Ice armor (25% damage reduction) | Lightning aura (mini-stuns) | Magic barrier (reflects 1 projectile) |
| **Heal** (Suffix) | Instant heal + cauterize | Heal over time + frost armor | Instant mana restore | Bonus XP from combat |
| **Big** (Prefix) | Meteor-sized projectile | Glacier chunk | Thunder from above | Massive orb with gravitational pull |

### Implementation Phases

#### Phase 1: Basic Projectile System (Current Priority)
- Simple colored circles as projectiles
- Movement from player to target enemy
- Damage applied on collision (not instant)
- Element type stored but not fully differentiated

#### Phase 2: Element Differentiation
- Unique visual sprites per element
- Implement special traits (burn, slow, chain, complexity bonus)
- Basic particle effects using Phaser's particle system
- Element-specific impact sounds

#### Phase 3: Full Visual Polish
- Advanced particle effects with custom shaders
- Screen shake on powerful impacts
- Environmental reactions (scorch marks, ice patches)
- Combo-based visual scaling system
- Victory flourishes unique per element

### Wizard Asset Requirements

Each wizard type requires these sprite sheets:
- **Base Sprite**: 64x64 pixels, 4 directions (N, S, E, W)
- **Idle Animation**: 4 frames per direction
- **Casting Animation**: 6 frames (wind-up, cast, recovery)
- **Walking Animation**: 8 frames per direction
- **Hit/Damage Animation**: 3 frames
- **Victory Pose**: 4 frames celebration

**Robe Designs**:
- Fire: Red/orange with flame trim patterns
- Ice: Blue/white with snowflake embroidery
- Lightning: Yellow/purple with lightning bolt designs
- Arcane: Purple/violet with mystical star patterns

### Balance Philosophy

**Core Principle**: All wizards deal identical base damage from reading words correctly. Elemental differences provide tactical variety without creating "wrong" choices.

**Damage Calculation**:
```
Total Damage = (Base Word Damage) × (Combo Multiplier) × (Element Modifier) × (Rune Bonuses)
```

**Element Modifiers Are Situational**:
- Fire excels in long fights (burn stacks)
- Ice excels with groups (crowd control)
- Lightning excels at cleanup (chain hits)
- Arcane excels with vocabulary mastery (scaling bonus)

This ensures the reading mechanic remains paramount while adding replayability through varied playstyles.

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

### Selected System: Boss-Gated Stairwell Progression

**Core Mechanics:**
- **Entrance Room (Room 0)**: The first room is always type "entrance"
  - NEVER contains enemies - provides safe zone for orientation
  - NO doors - player can freely enter and exit
  - Cannot be converted to boss room
  - Always the player spawn point
- **Boss Guarantee**: Every dungeon level ALWAYS has at least one boss enemy
- **Boss Placement**: Probability decay from farthest to nearest rooms
- **Combat Room Doors**: Every entrance/exit to combat and boss rooms has a door
  - Doors are VISIBLE (solid brown) when closed
  - Doors are INVISIBLE (alpha: 0) when open
  - Doors start OPEN to allow exploration
- **Combat Room Lock-In**: When player enters a combat/boss room with enemies:
  - ALL doors to that room instantly CLOSE and become visible (Binding of Isaac style)
  - Player cannot leave until all enemies are defeated
  - Doors block movement when closed
- **Door Unlocking**: When all enemies in current room reach zero:
  - ALL doors to that room instantly OPEN and become invisible
  - Player can freely exit to continue exploring
- **Stairwell Activation**: Stairwells only appear after defeating the floor's boss
- **Visual Feedback**: Stairwell materializes with shimmery appearing animation upon boss death
- **Progression Lock**: Cannot advance to next floor without defeating current floor's boss

**Implementation Details:**
- **Distance Calculation**: Use pathfinding or Manhattan distance to rank rooms by distance
- **Boss Room Selection Algorithm**:
  - Sort rooms by distance from player spawn (farthest to nearest)
  - 90% chance for farthest room
  - If not placed, 90% chance for next farthest room
  - Continue with 90% probability decay (90% → 81% → 72.9% → ...)
  - **Hard constraint**: Never place in player's spawn room (closest room)
  - If reached second-closest room without placement, force placement there
- **Multiple Bosses**: Higher floors may have multiple bosses requiring all defeats
- **Stairwell Location**: Appears in boss room or designated "exit room" after victory
- **Animation**: Particle effects, glow, and fade-in for stairwell materialization

**Educational Benefits:**
- Forces engagement with combat reading mechanics
- Creates clear goals and progression milestones
- Provides sense of accomplishment after difficult battles
- Encourages exploration to find boss location

### Alternative Options Considered:

#### Option 1: The Ascending Library
- **Boss as Gatekeeper**: Each floor's boss guards a "Tome of Passage"
- **Tome Challenge**: Read the tome's passage (grade-appropriate text) to unlock stairs
- **Partial Progress**: Can attempt tome multiple times, progress saves
- **Secret Exits**: Hidden stairs accessed by reading environmental clues
- **Backtracking Bonus**: Return to cleared floors to practice words for bonus XP
- **Special Mechanic**: "Word Elevator" - Skip floors by reading increasingly difficult word chains

#### Option 2: Portal Inscription System
- **Boss Keys**: Bosses drop key fragments with words on them
- **Portal Assembly**: Combine key fragments by reading all their words in sequence
- **Portal Stability**: Portal degrades if you take too long - maintain by reading "stability" words
- **Multiple Portals**: Choose between easy/hard portals based on word difficulty
- **Portal Network**: Unlock fast travel by memorizing portal word addresses

#### Option 3: The Growing Spellbook
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

2. **Currency**: Gold Words Economy with Shop Integration
   - Gold words as primary currency, value based on reading complexity
   - Earned from enemy defeats, scaled by floor and enemy type
   - Shop rooms on every level for guaranteed consumable access
   - Strategic spending decisions between healing and equipment

3. **Power-Ups**: Runic Augmentation System (Phase 1)
   - Equipment slots for prefix/suffix/core runes (1 each)
   - Runes stack/level up (Flame I → Flame II → Flame III)
   - Text-to-speech reads rune names for beginning readers
   - Companion spirits deferred to later levels

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

6. **Progression**: Boss-Gated Stairwell System
   - Every level ALWAYS has at least one boss (guaranteed)
   - Boss placement uses 90% probability decay from farthest room
   - Never spawns in player's room, forced placement if needed
   - Stairwells only appear after defeating floor boss
   - Shimmery materialization animation on boss defeat

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

### Mana Point (MP) System - Core Spell Casting Resource

**MP Controls Spell Attempts (Not Damage)**
- MP is consumed to START casting a spell, not for damage
- Early grades: MP determines number of tries available
- Advanced grades: MP determines timer duration (while recording)
- Creates consistent resource management across all levels

**Grade-Based MP Consumption**:

**K-2nd Grade (Tries Mode)**:
- Base: 10 MP = 3 tries
- Formula: Tries = floor(MP / 10) * 3
- Examples:
  - 50 MP = 15 tries total
  - 30 MP = 9 tries total
  - 10 MP = 3 tries (minimum for one spell)
- Cannot cast if MP < 10

**3rd-4th Grade (Hybrid Mode)**:
- Base: 10 MP = 5 seconds timer (recording time only)
- Formula: Timer = (MP / 10) * 5 seconds
- Examples:
  - 50 MP = 25 seconds total recording time
  - 30 MP = 15 seconds total recording time
  - 10 MP = 5 seconds (minimum)
- Cannot cast if MP < 10

**5th+ Grade (Timer Mode)**:
- Base: 15 MP = 5 seconds timer (recording time only)
- Formula: Timer = (MP / 15) * 5 seconds
- Examples:
  - 45 MP = 15 seconds total recording time
  - 30 MP = 10 seconds total recording time
  - 15 MP = 5 seconds (minimum)
- Cannot cast if MP < 15

**MP Regeneration**:
- **Passive Regeneration**: 1 MP per second (always active)
- **Combat Bonus**: +25% of max MP after combat ends
- **Prevents Deadlock**: Player can never be stuck with 0 MP
- **Encourages Patience**: Waiting a bit restores casting ability

**Strategic Decisions**:
- Players must balance number of spell attempts vs saving MP
- Word complexity affects damage, not MP cost
- Failed attempts still consume MP (risk/reward)
- Can wait for MP to regenerate if running low
- Treasure rooms may contain MP potions for instant restoration

**Design Benefits**:
- Single resource system across all grades
- Natural difficulty scaling with grade progression
- Prevents spell spamming while allowing practice
- Creates meaningful resource management decisions
- Accessibility without removing challenge

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

## Art Assets Required for Production

This section catalogs all visual assets needed for full production of RogueReader. Assets are organized by priority and implementation phase.

### Loot Drop System Assets (Phase 1 - Current Priority)

#### Gold Coins
- **Format**: Sprite sheet with animation frames
- **Specifications**:
  - Size: 32x32 pixels per frame
  - Animation: 8 frames of spinning coin
  - Visual: Gold coin with letter embossing (random letters: A-Z)
  - Particle effect: Small sparkle particles (4x4px, yellow/white)
- **Quantity**: 1 sprite sheet (256x32px for 8 frames)
- **Use**: Common drop from all enemies, auto-collects with magnetism
- **Status**: ⚠️ REQUIRED for Phase 1

#### Consumable Items
**Food Items (Common)**:
- **Apple** 🍎
  - Size: 32x32 pixels
  - Idle animation: Gentle bobbing (2 frames)
  - Glow color: White (common rarity)
  - Quantity: 1 sprite + glow overlay

- **Bread** 🍞
  - Size: 32x32 pixels
  - Idle animation: Gentle bobbing (2 frames)
  - Glow color: White (common rarity)
  - Quantity: 1 sprite + glow overlay

- **Cheese** 🧀
  - Size: 32x32 pixels
  - Idle animation: Gentle bobbing (2 frames)
  - Glow color: White (common rarity)
  - Quantity: 1 sprite + glow overlay

**Potions (Rare)**:
- **Red Potion** 🧪
  - Size: 32x32 pixels
  - Idle animation: Liquid bubbling (4 frames)
  - Glow color: Blue (rare rarity)
  - Particle effect: Rising bubbles
  - Quantity: 1 sprite sheet + particle effect

- **Blue Potion** 🧪
  - Size: 32x32 pixels
  - Idle animation: Liquid swirling (4 frames)
  - Glow color: Blue (rare rarity)
  - Particle effect: Mystical wisps
  - Quantity: 1 sprite sheet + particle effect

**Epic Items**:
- **Healing Fairy** 🧚
  - Size: 48x48 pixels (larger for epicness)
  - Idle animation: Flying/fluttering (6 frames)
  - Glow color: Purple (epic rarity)
  - Particle effect: Sparkle trail
  - Wings animation: Gentle flutter
  - Quantity: 1 sprite sheet + particle system

#### Rune Sprites (Basic)
- **Format**: Individual sprites with glow effects
- **Specifications**:
  - Size: 32x32 pixels
  - Idle animation: Slow rotation (360° in 4s, 8 frames)
  - Particle aura: Mystical glow matching rune color
- **Rune Types Needed**:
  - **Common Runes** (70% drops):
    - Flame Rune (red/orange glow)
    - Ice Rune (blue/cyan glow)
    - Power Rune (yellow glow)
  - **Rare Runes** (25% drops):
    - Echo Rune (purple glow)
    - Blast Rune (orange glow)
  - **Epic Runes** (5% drops):
    - Shield Rune (white/silver glow)
    - Heal Rune (green glow)
- **Quantity**: 7 rune types × 8 animation frames = 56 frames total
- **Status**: ⚠️ REQUIRED for Phase 1

#### Particle Effects
**Burst Effects** (for enemy death drops):
- Size: 64x64 pixels
- Animation: 15 frames (charge → burst → disperse)
- Color variants: Match drop type
- Quantity: 3 variants (gold, item, rune)

**Pickup Effects**:
- Magnetism sparkle trail (for gold)
- Item scale-up flash (for consumables)
- Rune absorption spiral (for runes)

#### Floating Text
- **Font**: Bold, child-friendly sans-serif
- **Sizes**: 24px for damage, 32px for pickups
- **Colors**:
  - Gold pickups: #FFD700 (yellow)
  - Health: #00FF00 (green)
  - Damage: #FF0000 (red)
- **Animation**: Float up + fade out (1 second total)
- **Stroke**: 2px black outline for readability

### Loot Drop System Assets (Phase 2 - Visual Polish)

#### Advanced Particle Systems
- **Gold shimmer**: Continuous sparkle on idle coins
- **Rarity beams**: Vertical light beams for epic+ drops
- **Landing dust**: Small puff when items hit ground
- **Collection burst**: Radial particles when picked up

#### Stack Indicators
- **Badge overlay**: "x3", "x5" quantity indicators
- Size: 16x16 pixels
- Background: Semi-transparent dark circle
- Text: White, bold numbers

### Enemy Sprites (Existing System - Reference)

These are already partially implemented but included for completeness:

#### Basic Enemies
- Goblin, Bat, Skeleton, Slime, Orc, Demon
- Each requires: Idle, walk, attack, death animations
- Status: ⚠️ PARTIAL (some placeholder graphics in use)

#### Boss Enemies
- Boss variants of standard enemies
- Larger size (96x96 vs 64x64)
- More elaborate animations
- Status: ⚠️ PARTIAL

### UI Elements (Future Phases)

#### Inventory Icons
- 32x32 pixel icons for each consumable
- Rune icons for equipment screen
- Hot-bar slot backgrounds

#### Shop Interface
- Merchant NPC sprite (64x64)
- Shop counter/stand background
- Currency display icons

### Priority Levels

**🔴 CRITICAL (Needed for Phase 1)**:
- Gold coin sprite (8 frames)
- Apple, Bread, Cheese sprites (simple, 2 frames each)
- Red Potion, Blue Potion sprites (4 frames each)
- Healing Fairy sprite (6 frames)
- Basic rune sprites (7 types, 8 frames each)
- Burst effect for drops (15 frames)
- Floating text rendering

**🟡 HIGH (Needed for Phase 2)**:
- Advanced particle effects
- Rarity glow overlays
- Stack indicators
- Collection animations

**🟢 MEDIUM (Polish/Future)**:
- Loot beam effects
- Environmental interactions
- Advanced visual effects

### Temporary Placeholder Strategy

Until production art is available, use:
- **Colored circles** for gold (yellow circle)
- **Emoji or simple shapes** for consumables
- **Colored squares** for runes (colored by type)
- **Phaser's built-in text** for floating numbers
- **Phaser particle system** for basic effects

This allows full mechanical implementation while art assets are created.

### Asset Delivery Format

**Preferred formats**:
- Sprite sheets: PNG with transparency
- Animations: Horizontal strip layout (frame 1, 2, 3...)
- Particles: Individual PNG files
- Resolution: 2x for retina display support (will be scaled down)

**Naming convention**:
```
loot_gold_coin_sheet.png (256x32, 8 frames)
loot_consumable_apple.png (32x32, static)
loot_consumable_apple_anim.png (64x32, 2 frames)
loot_rune_flame_sheet.png (256x32, 8 frames)
particle_burst_gold.png (960x64, 15 frames)
```

## Speech Recognition & Pronunciation System

### Architecture Overview (Hybrid Approach)

**Primary Goal**: Low-latency word verification with intelligent pronunciation feedback when needed.

**System Components**:
1. **Whisper API** (Primary Recognition) - Fast transcription (100-300ms)
2. **GPT-4o-mini** (Pronunciation Analysis) - Detailed feedback on errors only
3. **TTS (tts-1)** (Pronunciation Teaching) - Generate word pronunciation audio

### Speech Recognition Pipeline

#### Phase 1: Fast Verification (Whisper)
```
User speaks word → Whisper API → Compare with target word
  ✓ Match → Success! Continue gameplay
  ✗ Mismatch → Trigger pronunciation analysis
```

**Latency Target**: 100-300ms for correct pronunciations

**Implementation**:
- Use Whisper `base` model for speed-accuracy balance
- Stream audio in real-time using continuous recording
- Compare transcription with expected word using fuzzy matching

#### Phase 2: Intelligent Feedback (GPT-4o-mini, on mismatch only)
```
Whisper says wrong word → Send to GPT-4o-mini with:
  - Target word: "rabbit"
  - Audio recording
  - Prompt: "Explain how the speaker mispronounced this word. Be specific about phonemes."

GPT Response:
  "The speaker said 'wabbit' instead of 'rabbit'.
   The /r/ sound was replaced with /w/.
   Practice saying /r/ by curling tongue back."
```

**Latency**: 800ms-1.5s (only on errors, doesn't impact normal gameplay)

**Benefits**:
- Fast response for correct pronunciations (most common case)
- Detailed, actionable feedback only when needed
- Reduces API costs by only analyzing errors

### Pronunciation Teaching System

#### Word Pronunciation Database Structure

For each word in the curriculum, pre-generate:

```json
{
  "word": "rabbit",
  "ipa": "/ˈræb.ɪt/",
  "syllables": ["rab", "bit"],
  "phoneme_groups": ["ræb", "ɪt"],
  "audio_files": {
    "normal": "rabbit_normal.mp3",
    "slow": "rabbit_slow.mp3",
    "syllable_rab": "rabbit_syl_1.mp3",
    "syllable_bit": "rabbit_syl_2.mp3",
    "teaching": "rabbit_teaching.mp3"
  },
  "tts_prompts": [
    "Say the word: rabbit.",
    "Say it slowly: rab... bit.",
    "Now say it with me: rab (pause) bit.",
    "One more time! Rabbit!"
  ]
}
```

#### Teaching Mode UI Flow

When player requests help with a word:

1. **Show phonetic breakdown** visually on screen
2. **Play full word** (normal speed)
3. **Play syllable-by-syllable** (with pauses)
4. **Interactive practice**: Tap each syllable to hear it again
5. **Call-and-response**: "Your turn - say 'rab'"
6. **Record & verify**: Player records, Whisper checks

#### TTS Audio Generation (Pre-computed at Build Time)

Generate pronunciation audio for all curriculum words during game build:

```javascript
// Pre-generation script (run once)
for (const word of curriculumWords) {
  // Normal pronunciation
  await generateTTS({
    model: "tts-1",
    voice: "alloy", // Kid-friendly voice
    input: `Say the word: ${word}.`,
    output: `audio/words/${word}_normal.mp3`
  });

  // Slow pronunciation
  await generateTTS({
    model: "tts-1",
    voice: "alloy",
    input: `Say it slowly: ${syllables.join('... ')}.`,
    output: `audio/words/${word}_slow.mp3`
  });

  // Teaching sequence
  await generateTTS({
    model: "tts-1",
    voice: "alloy",
    input: `Let's practice: ${word}. Say it with me: ${syllables.join(' (pause) ')}.`,
    output: `audio/words/${word}_teaching.mp3`
  });
}
```

**Benefits**:
- Zero latency during gameplay (audio pre-loaded)
- Consistent pronunciation across all words
- No per-use API costs
- Offline playback capability

#### Syllable Breakdown Generation

Use GPT-4o-mini to automatically generate pronunciation data:

```javascript
// One-time generation per word
const response = await gpt4oMini({
  prompt: `Break down the word "${word}" for teaching a child to read.

  Provide:
  1. IPA notation
  2. Syllable breakdown (American English)
  3. Phoneme groups suitable for teaching
  4. Simple pronunciation tips

  Format as JSON.`,

  response_format: { type: "json_object" }
});
```

**Output Example**:
```json
{
  "word": "elephant",
  "ipa": "/ˈel.ɪ.fənt/",
  "syllables": ["el", "e", "phant"],
  "phoneme_groups": ["ɛl", "ɪ", "fənt"],
  "pronunciation_tips": "Start with 'el' like 'L', then 'eh', then 'fant' like 'font'",
  "common_mistakes": [
    "Saying 'elefant' instead of 'elephant'",
    "Dropping the 'ph' sound"
  ]
}
```

### API Integration Strategy

#### Development Environment
- Use `VITE_OPENAI_API_KEY` for rapid testing
- All APIs called directly from client
- **⚠️ NEVER commit this to production**

#### Production Environment (Proxy Service Required)

**Architecture**:
```
[Game Client]
    ↓
[Proxy Server]
    ├─→ [Whisper API] (Primary recognition)
    ├─→ [GPT-4o-mini] (Error analysis, pronunciation data generation)
    └─→ [TTS API] (Build-time audio generation only)
```

**Proxy Responsibilities**:
- Secure API key storage
- Rate limiting (30 requests/min per user)
- Usage tracking and cost monitoring
- Session authentication
- Request caching for repeated words

### Future Optimization: Pronunciation Caching (TODO)

**Current State**: Generate pronunciation feedback on-demand via GPT-4o-mini (costs ~$0.0001 per error)

**Future Goal**: Pre-generate and cache all pronunciation data to eliminate runtime API costs

**Implementation Plan**:

1. **Build-Time Generation Script** (`scripts/generatePronunciationData.ts`)
   - Use GPT-4o-mini to generate pronunciation data for all curriculum words (~2000 words)
   - Generate common error patterns for each word
   - Store in structured JSON format

2. **Data Structure** (`public/data/pronunciations.json`):
   ```json
   {
     "rabbit": {
       "ipa": "/ˈræb.ɪt/",
       "syllables": ["rab", "bit"],
       "phoneme_groups": ["ræb", "ɪt"],
       "common_errors": {
         "wabbit": {
           "errorExplanation": "You said 'wabbit' instead of 'rabbit'. The /r/ sound was replaced with /w/.",
           "correctionTip": "For the /r/ sound, curl your tongue back and make a 'rrr' sound.",
           "practiceWords": ["run", "red", "rabbit"]
         },
         "rabit": {
           "errorExplanation": "You said 'rabit' with one 'b'. The word 'rabbit' has two 'b's.",
           "correctionTip": "Say 'rab' (pause) 'bit'. Notice the double 'b' sound.",
           "practiceWords": ["rubber", "hobby", "rabbit"]
         }
       },
       "pronunciation_tips": "Start with 'rab' like 'grab', then 'bit' like 'sit'."
     },
     "elephant": {
       "ipa": "/ˈel.ɪ.fənt/",
       "syllables": ["el", "e", "phant"],
       "phoneme_groups": ["ɛl", "ɪ", "fənt"],
       "common_errors": {
         "elefant": {
           "errorExplanation": "You skipped the 'ph' sound. It makes an /f/ sound.",
           "correctionTip": "The letters 'ph' together make the /f/ sound, like 'phone'.",
           "practiceWords": ["phone", "photo", "elephant"]
         }
       },
       "pronunciation_tips": "Three parts: 'el' (like L), 'e' (short eh), 'phant' (like font with f)."
     }
   }
   ```

3. **Fallback Strategy**:
   - **Primary**: Look up error in cache by fuzzy matching transcription
   - **Secondary**: If exact error not found, look up general word tips
   - **Tertiary**: If word not in cache, call GPT-4o-mini live (fallback)

4. **TTS Audio Pre-generation** (Optional Phase 2):
   ```json
   {
     "rabbit": {
       "audio_files": {
         "normal": "/audio/pronunciations/rabbit_normal.mp3",
         "slow": "/audio/pronunciations/rabbit_slow.mp3",
         "syllable_0": "/audio/pronunciations/rabbit_syl_0.mp3",
         "syllable_1": "/audio/pronunciations/rabbit_syl_1.mp3",
         "teaching": "/audio/pronunciations/rabbit_teaching.mp3"
       }
     }
   }
   ```

5. **Benefits**:
   - ✅ Zero API costs during gameplay (except for uncached errors)
   - ✅ Instant feedback (no 800ms-1.5s GPT-4o-mini latency)
   - ✅ Offline capability
   - ✅ Consistent, high-quality feedback across all words
   - ✅ Reduced dependency on external APIs

6. **Generation Cost Estimate**:
   - ~2000 curriculum words × 5 common errors per word = 10,000 GPT-4o-mini calls
   - Cost: 10,000 × $0.0001 = **$1.00 one-time cost**
   - Saves: ~$0.0001 per error × thousands of student errors = **significant savings**

7. **Implementation Files**:
   - `scripts/generatePronunciationData.ts` - Generation script
   - `scripts/generatePronunciationAudio.ts` - TTS audio generation
   - `public/data/pronunciations.json` - Cached pronunciation data
   - `public/audio/pronunciations/` - Pre-generated TTS files
   - `src/services/PronunciationCache.ts` - Cache lookup service

**Status**: ⚠️ **DEFERRED** until after initial Whisper integration is complete and tested

**Priority**: Medium (cost savings and performance improvement, but not blocking)

### Migration Path from Current Implementation

**Current State** (`StreamingSpeechService`):
- Uses OpenAI Realtime API with gpt-4o-audio-preview
- Client-side API key (development only)
- ~800ms-1.5s latency due to full audio processing

**Target State** (Whisper + GPT-4o-mini):
1. **Immediate**: Replace OpenAI Realtime API with Whisper API
   - Change endpoint from `/v1/realtime` to `/v1/audio/transcriptions`
   - Reduce latency from 800ms → 100-300ms
   - Keep existing continuous recording architecture

2. **Phase 2**: Add pronunciation feedback
   - On Whisper mismatch, call GPT-4o-mini with audio + target word
   - Parse pronunciation error explanation
   - Display feedback UI to player

3. **Phase 3**: Add TTS teaching mode
   - Pre-generate pronunciation audio for curriculum
   - Build interactive syllable-by-syllable UI
   - Integrate with existing word display system

**Code Changes Required**:
```typescript
// OLD (current implementation)
class StreamingSpeechService {
  async recognize(audio: Blob): Promise<string> {
    // Calls gpt-4o-audio-preview realtime API
  }
}

// NEW (Whisper + fallback to GPT-4o-mini)
class SpeechRecognitionService {
  async recognizeWithWhisper(audio: Blob, targetWord: string): Promise<{
    text: string;
    isCorrect: boolean;
    feedback?: string; // Only present if incorrect
  }> {
    // 1. Fast Whisper transcription
    const transcription = await whisperAPI.transcribe(audio);

    // 2. Check if correct
    if (fuzzyMatch(transcription, targetWord)) {
      return { text: transcription, isCorrect: true };
    }

    // 3. Get pronunciation feedback (only on error)
    const feedback = await gpt4oMini.analyzePronunciation({
      audio,
      targetWord,
      transcription
    });

    return {
      text: transcription,
      isCorrect: false,
      feedback: feedback.explanation
    };
  }
}
```

## Security and Deployment Considerations

### Speech Recognition API Security ✅ IMPLEMENTED

**Previous Issue (RESOLVED)**: OpenAI API key was exposed in client-side code
- Browser-bundled environment variables made API key visible
- Risk of API abuse and unauthorized usage charges

**✅ Implemented Solution: Express Proxy Server**

We've implemented a secure proxy server that keeps API keys server-side and prevents CORS issues.

#### Architecture Overview
```
[Game Client (localhost:3000)]
         ↓ HTTP request with audio blob
[Proxy Server (localhost:3001)]
         ↓ Authenticated API call with server-side key
[OpenAI Whisper API]
```

#### Implementation Details

**Backend Server** (`server.js`):
- **Express.js** proxy running on port 3001
- **CORS configured** to only allow requests from game client
- **Secure API key storage** via server-side environment variables
- **Error handling** with detailed logging
- **Multer** for multipart/form-data audio file uploads

**Proxy Endpoint**:
```
POST http://localhost:3001/api/transcribe
Body: FormData with audio file + model parameters
Response: { text: string } (Whisper transcription)
```

**Client Changes** (`GameScene.ts`):
- Changed from direct OpenAI calls to proxy endpoint
- Removed API key from client-side requests
- Added error handling for proxy connection issues

**Development Workflow**:
```bash
# Terminal 1: Start API proxy server
npm run server

# Terminal 2: Start game dev server
npm run dev
```

#### Security Benefits
✅ **API Key Protection**: Key never exposed to browser/client code
✅ **CORS Resolution**: Server-to-server calls bypass browser restrictions
✅ **Request Control**: All API calls go through proxy (can add logging, rate limiting)
✅ **FreeBSD Compatible**: Works on all platforms including FreeBSD

#### Future Enhancements (TODO)
- **Session Authentication**: Add user session validation
- **Rate Limiting**: Implement per-user request throttling (e.g., 30 req/min)
- **Usage Monitoring**: Log API costs and track usage patterns
- **Request Caching**: Cache repeated transcriptions for identical audio
- **Production Deployment**: Deploy proxy to cloud service (Vercel, Railway, etc.)

#### Deployment Considerations
**Local Development** (Current):
- Proxy runs locally on port 3001
- Game connects to `http://localhost:3001/api/transcribe`

**Production** (Future):
- Deploy proxy to cloud hosting service
- Update client to use production proxy URL
- Add authentication layer for public access
- Implement rate limiting and monitoring
- Use environment-specific CORS origins

**Alternative Solutions Considered**:
- **Browser Speech Recognition**: Less accurate, limited browser support
- **Offline Speech Recognition**: Large model downloads, performance issues
- **Third-party Services**: Additional vendor dependency, potential privacy concerns

**Status**: ✅ **COMPLETED** - Secure proxy server operational for local development

## Technical Architecture Decisions

### Input Handling (CRITICAL)
**Decision: Use Phaser's input system exclusively**

**Rationale:**
- Prevents double-input bugs from mixing input methods
- Ensures consistent event handling across all browsers
- Integrates properly with game loop and scene lifecycle
- Provides unified handling for keyboard, mouse, and touch

**Implementation Rules:**
1. **ALWAYS** use `this.input.keyboard.on()` for keyboard events
2. **NEVER** use `addEventListener`, `document.onkeydown`, or DOM event listeners
3. **NEVER** create HTML input elements for game input (only for debug tools)
4. Register input handlers in scene's `create()` method
5. Clean up listeners in scene's `shutdown()` or state transitions
6. Use key-specific events (e.g., 'keydown-SPACE') for clarity

**Anti-patterns to avoid:**
```javascript
// ❌ NEVER DO THIS
document.addEventListener('keydown', handler)
window.onkeydown = handler
inputElement.addEventListener('keydown', handler)

// ✅ ALWAYS DO THIS
this.input.keyboard.on('keydown-SPACE', handler)
```

### Audio Recording Architecture (CRITICAL)
**Decision: Continuous recording with tap-in processing**

**Rationale:**
- Eliminates MediaRecorder initialization delays (critical for Safari)
- Zero-latency recording start when spacebar is pressed
- No missed audio from initialization timing issues
- Smooth user experience without recording startup glitches

**Implementation:**
1. **Pre-warm MediaRecorder** at game start (during scene creation)
2. **Keep recorder always running** in a circular buffer mode
3. **Tap into stream** when spacebar is pressed (process buffered audio)
4. **Discard unused audio** when no spell casting is active
5. **Clean up recorder** only on scene shutdown or game end

**Technical Details:**
- MediaRecorder runs continuously with timeslice events
- Audio chunks are buffered but only processed when needed
- When spacebar pressed, immediately process accumulated buffer
- This approach trades minimal CPU/memory overhead for perfect responsiveness

**Benefits:**
- No first-recording failure issues
- No initialization delay on spell cast
- Consistent recording quality across all attempts
- Works reliably across all browsers (especially Safari)

## Runic Augmentation System (Phase 1 Implementation)

### Core Design Principles
- **Beginner-Friendly**: Simple words (K-3 reading level) with text-to-speech support
- **Limited Complexity**: Only 3 equipment slots (1 prefix + 1 suffix + 1 core)
- **Stacking Progression**: Runes level up instead of cluttering inventory (Flame I → II → III)
- **Meaningful Choices**: Each rune provides clear, visible effects

### Rune Types and Slots

#### Prefix Runes (modify spell beginning)
- **Flame**: Adds fire damage (+25% per level)
- **Ice**: Increases casting speed (+15% per level)
- **Big**: Major damage boost (+40% per level, max 3)

#### Suffix Runes (modify spell ending)
- **Blast**: Area effect, hits nearby enemies (+1 target per level)
- **Heal**: Restores player health when casting (+5 HP per level)
- **Shield**: Grants temporary protection (+3 shield per level)

#### Core Runes (modify base behavior)
- **Echo**: Spell repeats/chains (+1 repeat per level, max 2)
- **Power**: Overall damage amplification (+30% per level)

### Rune Mechanics

#### Acquisition and Leveling
- **Drop System**: Enemies drop runes based on rarity (70% common, 25% rare, 5% epic)
- **Stacking**: Duplicate runes automatically level up existing ones
- **Max Levels**: 3-5 levels per rune type to prevent overwhelming complexity
- **Reading Practice**: Players hear rune names via TTS for vocabulary building

#### Equipment System
- **Single Slots**: Only one rune per type (prefix/suffix/core) to avoid analysis paralysis
- **Hot-Swapping**: Can change runes between combat encounters
- **Visual Feedback**: Clear display of active effects and damage numbers

#### Rune Effects in Combat
- **Damage Multipliers**: Stack multiplicatively for interesting combinations
- **Area Effects**: "Blast" suffix hits additional enemies in range
- **Self-Healing**: "Heal" suffix provides sustain without making game too easy
- **Echo Chains**: "Echo" core creates spell repetition for advanced players

### Health Recovery System

#### Consumable Types
- **Food Items**: Common drops, small healing (10-15 HP)
  - Apple, Bread, Cheese (K-2 reading level)
- **Potions**: Rare drops, medium healing (25-30 HP)
  - Red Potion, Blue Potion (Grade 3 reading level)
- **Fairies**: Epic drops, large healing (50 HP)
  - Healing Fairy (Grade 4 reading level)

#### Scarcity Mechanics
- **Limited Inventory**: 8 slots maximum to force strategic decisions
- **Reading Requirement**: Must read "use text" to consume items
  - "eat apple", "drink potion", "call fairy"
- **Drop Rates**: 70% chance for drops, improving on higher floors
- **No Automatic Healing**: All recovery requires player action and reading
- **Strategic Timing**: Items cannot be used during combat (must plan ahead)

#### Consumable Usage Mechanics
- **Text-to-Speech**: Item names and use-text read aloud for learning
- **Inventory Management**: Players must choose which items to keep
- **Quantity Stacking**: Same items stack together (e.g., "Apple x3")
- **Progressive Vocabulary**: Higher floor items require more advanced reading
- **Use Confirmation**: Players must correctly read the use-text to consume

#### Dual Acquisition System

**Shop Purchases (Primary Source)**
- **Guaranteed Access**: Every level has at least one shop room
- **Gold Word Currency**: Earned from defeating enemies and word mastery
- **Shop Pricing Strategy**:
  - Floor 1-2: Apple (5 gold), Bread (8 gold), Cheese (6 gold)
  - Floor 3-4: + Red Potion (20 gold), Blue Potion (25 gold)
  - Floor 5+: + Healing Fairy (50 gold)
- **Reading Requirement**: Must read item names to purchase
- **Haggling Potential**: Future feature for persuasion vocabulary

**Enemy Drops (Secondary Source)**
- **Rare Drops**: 15-20% chance from regular enemies
- **Boss Guaranteed**: Always drop rare/epic consumables + runes
- **Floor Scaling**: Higher floors = better drop chances and rarity
- **Excitement Factor**: "Bonus healing!" creates positive surprises

#### Gold Words Currency System

**Value Calculation Algorithm**
- **Base Value by Complexity**:
  - Simple words (K-2): 2 gold words (cat, dog, run)
  - Medium words (3-4): 4-6 gold words (dragon, castle, magic)
  - Complex words (5+): 7-10 gold words (adventure, mysterious, powerful)
- **Reading Level Bonus**: +0.5 gold per grade level
- **Word Length Bonus**: +0.5 gold per letter beyond 3 characters
- **Example**: "mysterious" (Grade 6, 10 letters) = 7 base + 3 level + 3.5 length = 13.5 → 13 gold

**Enemy Reward Scaling**
- **Base Rewards**: 3 gold words minimum
- **Enemy Type Multipliers**:
  - Goblin: 1.0x, Bat: 0.8x, Skeleton: 1.2x
  - Slime: 1.1x, Orc: 1.5x, Demon/Boss: 2.0x
- **Floor Scaling**: +1.5 gold per floor level
- **Enemy Level Bonus**: +2 gold per enemy level
- **Variance**: ±25% randomization for excitement

**Economic Balance**
- **Shop Pricing Strategy**:
  - Basic food (5-8 gold): Affordable frequent healing
  - Potions (20-25 gold): Significant investment decisions
  - Rare items (50+ gold): Major purchases requiring planning
- **Income vs. Expenses**: Designed for 70% shop reliance, 30% lucky drops
- **Strategic Decisions**: Immediate healing vs. saving for equipment
- **Floor Progression**: Higher floors = better income and more expensive items

### User Interface Design

#### Hot-Bar Consumable System
- **Direct Number Keys**: Press 1-4 to use consumables instantly
- **Visual Hot-Bar**: Bottom screen display with icons, names, quantities
  ```
  [1] 🍎 Apple x3    [2] 🧪 Potion x1    [3] 🍞 Bread x2    [4] Empty
  ```
- **Auto-Population**: Most useful items automatically fill empty slots
- **Immediate Feedback**: "+10 HP" floats up, slot updates in real-time
- **No Voice Required**: Simple key press, no speech confirmation needed

#### Equipment Management
- **Tab Key**: Opens rune equipment screen
- **Three Clear Slots**: Prefix | Core | Suffix with visual effects
- **Simple Interaction**: Click to equip/swap runes between fights
- **Visual Confirmation**: Shows active effects and damage bonuses
- **TTS Support**: Reads rune names and effects on hover

#### Shop Interface
- **Room-Based**: Enter shop rooms to access merchant
- **Gold Word Display**: Shows current currency at top of screen
- **Reading Practice**: Must read item names to purchase
- **Price Transparency**: Clear cost display for strategic decisions
- **Inventory Integration**: Purchased items auto-fill hot-bar slots

#### Accessibility Features
- **Large Icons**: Clear visuals for young readers
- **Audio Feedback**: TTS for item names, effects, and instructions
- **Color Coding**: Rarity-based colors (white/blue/purple for common/rare/epic)
- **Simple Navigation**: Arrow keys for menu access, ESC to close

### Integration with Existing Systems

#### Combat Enhancements
- Rune effects apply to existing spell chain combat system
- Damage calculations modified by equipped rune multipliers
- Area effects work with current enemy targeting

#### Word Recognition
- Rune names chosen for age-appropriate vocabulary building
- Consumable use-text provides additional reading practice
- TTS support ensures accessibility for struggling readers

#### Progression Balance
- Health scarcity prevents trivializing combat encounters
- Rune progression provides clear power advancement
- Limited slots maintain decision complexity without overwhelming

### Future Expansion Hooks
- **Advanced Runes**: Higher grade vocabulary for older students
- **Combination Effects**: Special bonuses for specific rune pairings
- **Companion Spirits**: Additional progression system for advanced players
- **Rune Crafting**: Combine lower-level runes to create custom effects

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
   - **Phase 1**: Whisper API integration for fast word verification (100-300ms)
   - **Phase 2**: GPT-4o-mini pronunciation analysis (error feedback only)
   - **Phase 3**: Pre-generate TTS audio for all curriculum words
   - **Phase 4**: Interactive pronunciation teaching mode
   - Microphone UI indicators and visual feedback

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

---

## Automated Testing Strategy (Puppeteer E2E)

### Philosophy
Automated testing enables longer AI-assisted development sessions by catching regressions and design violations without manual playtesting. Critical for maintaining game loop integrity across rapid iterations.

### Testing Infrastructure

**Technology Stack:**
- **Puppeteer** - Headless Chrome automation for E2E testing
- **Vitest** - Test runner with fast execution and watch mode
- **TypeScript** - Type-safe test helpers matching game architecture

**Test Server Requirements:**
- Dev server: `https://localhost:3000` (HTTPS required for microphone permissions)
- SSL: Self-signed certificate via `@vitejs/plugin-basic-ssl`
- Game instance exposed: `window.game` (dev mode only)

### Test Categories

**1. Critical Game Loop Tests (Priority 1)**
- Boss-gated progression enforcement
- Door blocking/unlocking mechanics
- Combat state transitions
- Floor progression requirements

**2. Design Compliance Tests (Priority 2)**
- Room generation constraints (min/max sizes, count scaling)
- Enemy spawn rules (safe starting room, combat room placement, boss distance from spawn)
- Currency/reward calculations
- Mana consumption and restoration

**3. Chrome-Specific Tests (Priority 3)**
- Speech recognition initialization
- Scene transitions without memory leaks
- Input handling (keyboard vs. touch)
- Canvas rendering stability

### Test API Design

Expose minimal test hooks on GameScene (dev mode only):

```typescript
// In GameScene - test helpers
public getTestAPI() {
  if (!import.meta.env.DEV) return null;

  return {
    player: {
      position: this.player.getGridPosition(),
      health: this.player.getHealth(),
      mana: this.player.getMana()
    },
    dungeon: {
      rooms: this.dungeon.rooms.map(r => ({
        x: r.x, y: r.y, width: r.width, height: r.height,
        type: r.type, hasBoss: r.hasBoss
      })),
      currentFloor: this.currentFloor
    },
    combat: {
      isActive: this.isInCombat,
      enemyCount: this.enemies.length,
      enemies: this.enemies.map(e => ({
        id: e.id,
        position: e.getGridPosition(),
        health: e.stats.health,
        isAlive: e.isAlive
      }))
    }
  };
}
```

### Failure Reporting

**Structured Bug Reports Include:**
- Screenshot of failure state
- Game state snapshot (rooms, player pos, enemies)
- Design requirement violated
- Suggested fix steps
- JSON debug data for AI agents

**Report Format:**
```markdown
# Bug: [SEVERITY] [Description]
**Detected:** [timestamp]
**Screenshot:** tests/reports/screenshots/[name].png

## Evidence
- Rooms generated: X
- Doors found: Y
- Player position: (x, y)

## Design Violation
[Which requirement from DESIGN.md was violated]

## Suggested Fix
1. Check [file.ts] line [N]
2. Verify [specific logic]
3. Add [missing validation]
```

### Known Limitations
- Cannot test speech recognition accuracy (requires real audio input)
- Cannot verify pronunciation feedback quality (subjective)
- Async timing issues may cause flaky tests (use retry logic)
- HTTPS certificate warnings must be bypassed manually first run

### Development Workflow
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: Watch tests
npm run test:e2e:watch

# Or run full QA loop (generates reports)
npm run qa-loop
```

### Critical Tests to Implement First
1. ✅ **Boss Gating** - Verify boss room exists and is distant from spawn
2. ✅ **Door Mechanics** - Catch the "door skip to boss" exploit found by kid playtest
3. ⚠️ **Combat Loop** - Ensure enemies pause/resume correctly during spell casting
4. ⚠️ **Mana Economy** - Verify costs match DESIGN.md (10 MP per spell on floors 1-4)

Status: Infrastructure ready, tests pending implementation.