import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'
import { MenuScene } from './scenes/MenuScene'
import { UIScene } from './scenes/UIScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  scene: [MenuScene, GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // Prevent zoom/scale changes on mobile devices
    zoom: 1
  },
  // Disable automatic canvas resizing
  autoRound: true,
  // Capture keyboard events to prevent browser default behavior (scrolling, etc.)
  input: {
    keyboard: {
      capture: [
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D
      ]
    }
  }
}

const game = new Phaser.Game(config)

// Make game accessible for testing in development
if (import.meta.env.DEV) {
  (window as any).game = game
}