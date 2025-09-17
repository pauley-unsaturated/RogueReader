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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
}

new Phaser.Game(config)