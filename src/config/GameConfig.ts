export const GAME_CONFIG = {
  TILE_SIZE: 48, // Increased from 32 for better visibility on small screens
  GRID_WIDTH: 32,
  GRID_HEIGHT: 24,
  
  // Room generation with updated scaling (Item #21: Bigger Maps)
  ROOM_CONFIG: {
    MIN_ROOM_SIZE: 5,
    MAX_ROOM_SIZE: 9,
    BASE_ROOMS: 8, // Increased from 5 for bigger dungeons
    ROOMS_PER_FLOOR: 2.5, // Adds 2-3 rooms per level on average
    MAX_ROOMS: 30 // Increased from 20 for larger late-game dungeons
  },
  
  // Combat
  COMBAT: {
    BASE_PLAYER_HP: 100,
    BASE_PLAYER_MANA: 50,
    ACCURACY_THRESHOLD: 0.7
  },
  
  // Colors for placeholder graphics
  COLORS: {
    PLAYER: 0x3498db,      // Blue
    ENEMY: 0xe74c3c,       // Red
    WALL: 0x7f8c8d,        // Gray
    FLOOR: 0x95a5a6,       // Light gray
    DOOR: 0xf39c12,        // Orange
    CHEST: 0xf1c40f,       // Yellow
    BACKGROUND: 0x2c3e50   // Dark blue-gray
  }
} as const