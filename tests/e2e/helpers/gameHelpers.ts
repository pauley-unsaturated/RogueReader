import { Page } from 'puppeteer';

export class GameTestHelpers {
  constructor(private page: Page) {}

  async injectTestAPI() {
    await this.page.evaluate(() => {
      (window as any).testAPI = {
        getCurrentScene: () => {
          const game = (window as any).game;
          if (!game) return null;
          const scene = game.scene.getScene('GameScene');
          return scene ? 'GameScene' : null;
        },

        getPlayerPosition: () => {
          const game = (window as any).game;
          const gameScene = game?.scene.getScene('GameScene');
          if (!gameScene?.player) return null;
          return gameScene.player.getGridPosition();
        },

        getPlayerStats: () => {
          const game = (window as any).game;
          const gameScene = game?.scene.getScene('GameScene');
          if (!gameScene?.player) return null;
          return {
            health: gameScene.player.getHealth(),
            mana: gameScene.player.getMana()
          };
        },

        getDungeonInfo: () => {
          const game = (window as any).game;
          const gameScene = game?.scene.getScene('GameScene');
          if (!gameScene?.dungeon) return null;

          return {
            rooms: gameScene.dungeon.rooms?.map((r: any) => ({
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              type: r.type || 'normal',
              hasBoss: r.hasBoss || false
            })) || [],
            floor: gameScene.currentFloor || 1
          };
        },

        getCombatState: () => {
          const game = (window as any).game;
          const gameScene = game?.scene.getScene('GameScene');
          if (!gameScene) return null;

          return {
            isActive: gameScene.isInCombat || false,
            enemyCount: gameScene.enemies?.length || 0,
            enemies: gameScene.enemies?.map((e: any) => ({
              id: e.id,
              position: e.getGridPosition ? e.getGridPosition() : { x: 0, y: 0 },
              health: e.stats?.health || 0,
              isAlive: e.isAlive !== false
            })) || []
          };
        },

        // Helper to find boss room
        getBossRoom: () => {
          const game = (window as any).game;
          const gameScene = game?.scene.getScene('GameScene');
          if (!gameScene?.dungeon?.rooms) return null;

          const bossRoom = gameScene.dungeon.rooms.find((r: any) => r.hasBoss || r.type === 'boss');
          return bossRoom ? {
            x: bossRoom.x,
            y: bossRoom.y,
            width: bossRoom.width,
            height: bossRoom.height
          } : null;
        },

        // Helper to check distance between player and boss
        getPlayerBossDistance: () => {
          const playerPos = (window as any).testAPI.getPlayerPosition();
          const bossRoom = (window as any).testAPI.getBossRoom();

          if (!playerPos || !bossRoom) return null;

          const bossCenter = {
            x: bossRoom.x + bossRoom.width / 2,
            y: bossRoom.y + bossRoom.height / 2
          };

          return Math.sqrt(
            Math.pow(playerPos.x - bossCenter.x, 2) +
            Math.pow(playerPos.y - bossCenter.y, 2)
          );
        }
      };
    });
  }

  async startGame() {
    // Click "New Game" button in MenuScene
    try {
      await this.page.waitForSelector('canvas', { timeout: 5000 });

      // MenuScene uses Phaser buttons, so we need to click on the canvas at the button position
      // For now, we'll use keyboard to start (SPACE or ENTER typically starts)
      await this.page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Skip tutorial if it appears (press T to skip)
      await this.page.keyboard.press('t');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log('Could not start game via button, trying keyboard...');
      await this.page.keyboard.press(' ');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Skip tutorial if it appears
      await this.page.keyboard.press('t');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/reports/screenshots/${name}.png`,
      fullPage: true
    });
  }

  async getGameState() {
    return await this.page.evaluate(() => {
      const api = (window as any).testAPI;
      if (!api) return null;

      return {
        scene: api.getCurrentScene(),
        player: {
          position: api.getPlayerPosition(),
          stats: api.getPlayerStats()
        },
        dungeon: api.getDungeonInfo(),
        combat: api.getCombatState(),
        bossRoom: api.getBossRoom(),
        playerBossDistance: api.getPlayerBossDistance()
      };
    });
  }
}
