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

        getGameSceneData: () => {
          const game = (window as any).game;
          const gameScene = game?.scene.getScene('GameScene');
          if (!gameScene || !gameScene.getTestAPI) return null;
          return gameScene.getTestAPI();
        },

        // Helper to find boss room from game scene data
        getBossRoom: () => {
          const data = (window as any).testAPI.getGameSceneData();
          if (!data?.dungeon?.rooms) return null;

          const bossRoom = data.dungeon.rooms.find((r: any) => r.hasBoss || r.type === 'boss');
          return bossRoom || null;
        },

        // Helper to check distance between player and boss
        getPlayerBossDistance: () => {
          const data = (window as any).testAPI.getGameSceneData();
          const bossRoom = (window as any).testAPI.getBossRoom();

          if (!data?.player?.position || !bossRoom) return null;

          const playerPos = data.player.position;
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
    // Set up dialog handler BEFORE starting game (tutorial skip confirmation)
    this.page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.message()}`);
      await dialog.accept(); // Auto-accept tutorial skip confirmation
    });

    // Click "New Game" button in MenuScene
    try {
      await this.page.waitForSelector('canvas', { timeout: 5000 });

      // Start the game (ENTER or SPACE)
      await this.page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Skip tutorial (press SPACE, will trigger confirm dialog which we auto-accept)
      await this.page.keyboard.press(' ');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for GameScene to fully load
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('Could not start game via button, trying keyboard...');
      await this.page.keyboard.press(' ');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Skip tutorial
      await this.page.keyboard.press(' ');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for GameScene
      await new Promise(resolve => setTimeout(resolve, 1000));
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

      const data = api.getGameSceneData();

      return {
        scene: api.getCurrentScene(),
        player: data?.player || null,
        dungeon: data?.dungeon || null,
        combat: data?.combat || null,
        bossRoom: api.getBossRoom(),
        playerBossDistance: api.getPlayerBossDistance()
      };
    });
  }
}
