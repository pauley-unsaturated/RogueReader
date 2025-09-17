# Asset Specification for AI Generation
## Spell Speakers: Reading Roguelike Game

### Technical Requirements
- **Resolution**: 32×32 pixels per sprite
- **Style**: Pixel art, retro 16-bit aesthetic
- **Color Palette**: Limited palette with high contrast for readability
- **Format**: PNG with transparency
- **Animation**: Frame-based animation for movement and actions

### Color Scheme
```
Primary Colors:
- Player/Magic: #3498db (Blue)
- Enemy/Danger: #e74c3c (Red) 
- Treasure/Loot: #f1c40f (Yellow/Gold)
- Nature/Safe: #2ecc71 (Green)
- Mystery/Puzzle: #9b59b6 (Purple)
- Environment: #7f8c8d (Gray), #95a5a6 (Light Gray)
```

## Character Sprites

### 1. Player Wizard
**Description**: A young, friendly wizard suitable for a 6-year-old audience
- **Style**: Cute, cartoon-like, non-threatening
- **Colors**: Blue robes, brown staff, friendly face
- **Hat**: Classic pointed wizard hat with stars
- **Size**: Should fit comfortably in 32×32 grid

**Required Animations** (4 frames each):
- `wizard_idle_north.png` - Facing up, gentle breathing animation
- `wizard_idle_south.png` - Facing down, gentle breathing animation  
- `wizard_idle_east.png` - Facing right, gentle breathing animation
- `wizard_idle_west.png` - Facing left, gentle breathing animation
- `wizard_walk_north.png` - Walking up, robe flowing
- `wizard_walk_south.png` - Walking down, robe flowing
- `wizard_walk_east.png` - Walking right, robe flowing
- `wizard_walk_west.png` - Walking left, robe flowing
- `wizard_cast_north.png` - Casting spell upward, staff glowing
- `wizard_cast_south.png` - Casting spell downward, staff glowing
- `wizard_cast_east.png` - Casting spell right, staff glowing
- `wizard_cast_west.png` - Casting spell left, staff glowing

### 2. Enemies

#### Slime
**Description**: Friendly, bouncy slime creature - not scary
- **Style**: Rounded, jelly-like, cute eyes
- **Colors**: Green base with darker green spots
- **Expression**: Curious rather than menacing

**Required Sprites**:
- `slime_idle.png` - Gentle wobbling
- `slime_move.png` - Bouncing movement (2 frames)
- `slime_attack.png` - Slight forward bounce
- `slime_defeat.png` - Gentle dissolving effect

#### Skeleton
**Description**: Cartoon skeleton, not scary - think Halloween decoration
- **Style**: Clean white bones, friendly skull
- **Colors**: White/cream bones, optional colorful accessories
- **Expression**: Neutral or even friendly

**Required Sprites**:
- `skeleton_idle.png` - Standing with slight sway
- `skeleton_move.png` - Walking with bone clattering (2 frames)
- `skeleton_attack.png` - Arm raised in gesture
- `skeleton_defeat.png` - Bones separating gently

#### Goblin
**Description**: Small, mischievous creature - playful not evil
- **Style**: Green skin, pointed ears, impish grin
- **Colors**: Green skin, brown/tan clothing
- **Expression**: Playful, mischievous smile

**Required Sprites**:
- `goblin_idle.png` - Standing with slight movements
- `goblin_move.png` - Quick scampering (2 frames)
- `goblin_attack.png` - Playful lunge forward
- `goblin_defeat.png` - Sitting down defeated but not hurt

## Environment Tiles

### Floor Tiles
- `floor_stone.png` - Basic stone dungeon floor
- `floor_stone_crack.png` - Stone floor with cracks for variety
- `floor_stone_moss.png` - Stone floor with moss patches

### Wall Tiles  
- `wall_brick.png` - Standard brick wall
- `wall_brick_top.png` - Brick wall top edge
- `wall_brick_damaged.png` - Damaged brick wall for variety

### Interactive Elements
- `door_closed.png` - Wooden door, closed
- `door_open.png` - Wooden door, open
- `door_locked.png` - Door with visible lock

### Treasure Chests
**Description**: Classic treasure chests with increasing visual richness
- `chest_common.png` - Simple wooden chest
- `chest_rare.png` - Wooden chest with metal bands  
- `chest_epic.png` - Ornate chest with gems
- `chest_mythic.png` - Glowing magical chest

### Decorative Props
- `torch.png` - Wall torch with flame
- `barrel.png` - Wooden storage barrel  
- `bones.png` - Scattered bones (not scary)
- `puddle.png` - Small water puddle

## UI Elements

### Interface Components
- `health_orb.png` - Red crystal/orb for health display
- `mana_orb.png` - Blue crystal/orb for mana display
- `spell_frame.png` - Decorative frame for spell words
- `button_cast.png` - Magical "Cast Spell" button
- `button_cancel.png` - Simple "Cancel" button

### Spell Effects
- `sparkle_small.png` - Small magical sparkle (8×8)
- `sparkle_medium.png` - Medium magical sparkle (16×16)  
- `energy_blast.png` - Magical energy effect
- `healing_glow.png` - Green healing effect
- `damage_impact.png` - Red damage effect

## Icon Set

### Room Type Icons (16×16)
- `icon_combat.png` - Crossed swords
- `icon_treasure.png` - Treasure chest  
- `icon_puzzle.png` - Question mark
- `icon_shop.png` - Coin or scales
- `icon_boss.png` - Crown or skull

### Item Icons (16×16)
- `icon_health_potion.png` - Red potion bottle
- `icon_mana_potion.png` - Blue potion bottle
- `icon_key.png` - Golden key
- `icon_scroll.png` - Spell scroll

## Animation Specifications

### Timing
- **Idle animations**: 500ms per frame, loop
- **Movement animations**: 150ms per frame, loop
- **Spell casting**: 200ms per frame, play once
- **Defeat animations**: 300ms per frame, play once

### Frame Counts
- Idle: 2-4 frames
- Movement: 2-4 frames  
- Casting: 4-6 frames
- Defeat: 3-4 frames

## Style Guidelines

### Art Direction
1. **Child-Friendly**: No scary or violent imagery
2. **High Contrast**: Clear visibility on various backgrounds
3. **Readable**: Shapes should be distinct at 32×32 resolution
4. **Consistent**: Unified art style across all assets
5. **Colorful**: Vibrant but not overwhelming colors

### Technical Notes
- Use consistent light source (top-left)
- Maintain pixel-perfect alignment
- Include 1-2 pixel black outlines for clarity
- Avoid anti-aliasing (crisp pixel art)
- Ensure transparency is properly set

## Asset Organization
```
assets/
├── characters/
│   ├── wizard/
│   └── enemies/
├── environment/
│   ├── floors/
│   ├── walls/
│   └── props/
├── ui/
│   ├── buttons/
│   ├── frames/
│   └── icons/
└── effects/
    ├── spells/
    └── particles/
```

## Priority Order for Generation
1. **High Priority**: Wizard sprites (all animations)
2. **High Priority**: Basic environment tiles (floor, wall, door)
3. **Medium Priority**: Enemy sprites (slime, skeleton, goblin)
4. **Medium Priority**: Treasure chests and interactive items
5. **Low Priority**: Decorative props and spell effects
6. **Low Priority**: UI elements and icons

This specification provides complete guidance for generating a cohesive, child-friendly pixel art asset set for the Spell Speakers reading roguelike game.