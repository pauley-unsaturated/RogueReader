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
    // Wait for canvas to be ready
    await this.page.waitForSelector('canvas', { timeout: 5000 });
    console.log('Canvas found, looking for START ADVENTURE button...');

    // Click the START ADVENTURE button at its position
    // Button is at (width/2, height/2 + 50) which is approximately (512, 434) for 1024x768
    const canvas = await this.page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        // Calculate button center position
        const buttonX = box.x + box.width / 2;
        const buttonY = box.y + box.height / 2 + 50; // Offset from MenuScene

        console.log(`Clicking START ADVENTURE at (${buttonX}, ${buttonY})`);
        await this.page.mouse.click(buttonX, buttonY);

        // Wait for scene transition to GameScene
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Game started successfully');
      }
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

  /**
   * Simulate player movement using arrow keys
   * @param direction - 'up', 'down', 'left', 'right'
   * @param steps - number of steps to move (each step is 1 grid tile)
   * @param delayMs - delay between steps in milliseconds (default: 200ms)
   */
  async movePlayer(direction: 'up' | 'down' | 'left' | 'right', steps: number = 1, delayMs: number = 200) {
    const keyMap = {
      'up': 'ArrowUp',
      'down': 'ArrowDown',
      'left': 'ArrowLeft',
      'right': 'ArrowRight'
    };

    const key = keyMap[direction];

    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press(key);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    console.log(`Moved player ${direction} ${steps} step(s)`);
  }

  /**
   * Get detailed information about a specific room
   */
  async getRoomInfo(roomIndex: number) {
    return await this.page.evaluate((index) => {
      const game = (window as any).game;
      const gameScene = game?.scene.getScene('GameScene');
      if (!gameScene) return null;

      const room = gameScene.dungeon?.rooms[index];
      if (!room) return null;

      // Get doors for this room
      const roomDoors = gameScene.doors.filter((door: any) => door.roomIndex === index).map((door: any) => ({
        id: door.id,
        gridX: door.gridX,
        gridY: door.gridY,
        isOpen: door.getIsOpen(),
        alpha: door.doorGraphic?.alpha
      }));

      // Count enemies in this room
      const enemies = gameScene.enemies.filter((enemy: any) => {
        if (!enemy.isAliveStatus()) return false;
        const pos = enemy.getGridPosition();
        return pos.x >= room.x && pos.x < room.x + room.width &&
               pos.y >= room.y && pos.y < room.y + room.height;
      });

      return {
        index,
        type: room.type,
        bounds: {
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height
        },
        doors: roomDoors,
        enemyCount: enemies.length,
        enemies: enemies.map((e: any) => ({
          id: e.id,
          position: e.getGridPosition(),
          isAlive: e.isAliveStatus()
        }))
      };
    }, roomIndex);
  }

  /**
   * Find a path from current player position to a target room using BFS
   * Returns array of directions to move: ['right', 'down', 'right', ...]
   */
  async findPathToRoom(targetRoomIndex: number): Promise<Array<'up' | 'down' | 'left' | 'right'> | null> {
    return await this.page.evaluate((roomIndex) => {
      const game = (window as any).game;
      const gameScene = game?.scene.getScene('GameScene');
      if (!gameScene) return null;

      const player = gameScene.player;
      const dungeon = gameScene.dungeon;
      const targetRoom = dungeon.rooms[roomIndex];

      if (!player || !targetRoom) return null;

      // BFS to find path
      const start = { x: player.gridX, y: player.gridY };
      const goal = { x: targetRoom.centerX, y: targetRoom.centerY };

      const queue: Array<{ pos: {x: number, y: number}, path: string[] }> = [{ pos: start, path: [] }];
      const visited = new Set<string>();
      visited.add(`${start.x},${start.y}`);

      const directions = [
        { dx: 1, dy: 0, name: 'right' },
        { dx: -1, dy: 0, name: 'left' },
        { dx: 0, dy: 1, name: 'down' },
        { dx: 0, dy: -1, name: 'up' }
      ];

      while (queue.length > 0) {
        const current = queue.shift()!;

        // Check if we reached the goal
        if (current.pos.x === goal.x && current.pos.y === goal.y) {
          return current.path as any;
        }

        // Try all 4 directions
        for (const dir of directions) {
          const newX = current.pos.x + dir.dx;
          const newY = current.pos.y + dir.dy;
          const key = `${newX},${newY}`;

          if (visited.has(key)) continue;

          // Check if position is walkable (floor tile = 0 or stairwell = 2)
          if (newY >= 0 && newY < dungeon.height && newX >= 0 && newX < dungeon.width) {
            const tile = dungeon.tiles[newY][newX];
            if (tile === 0 || tile === 2) {
              visited.add(key);
              queue.push({
                pos: { x: newX, y: newY },
                path: [...current.path, dir.name]
              });
            }
          }
        }
      }

      return null; // No path found
    }, targetRoomIndex);
  }

  /**
   * Navigate player to a specific room using pathfinding
   */
  async navigateToRoom(roomIndex: number): Promise<boolean> {
    const path = await this.findPathToRoom(roomIndex);

    if (!path) {
      console.log(`❌ No path found to room ${roomIndex}`);
      return false;
    }

    console.log(`🗺️ Found path to room ${roomIndex}: ${path.length} steps`);

    // Execute the path
    for (const direction of path) {
      await this.movePlayer(direction, 1, 150); // Move one step at a time
    }

    console.log(`✅ Arrived at room ${roomIndex}`);
    return true;
  }

  /**
   * Wait for a door to reach a specific state
   */
  async waitForDoorState(doorId: string, expectedOpen: boolean, timeoutMs: number = 3000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const doorState = await this.page.evaluate((id) => {
        const game = (window as any).game;
        const gameScene = game?.scene.getScene('GameScene');
        if (!gameScene) return null;

        const door = gameScene.doors.find((d: any) => d.id === id);
        return door ? door.getIsOpen() : null;
      }, doorId);

      if (doorState === expectedOpen) {
        console.log(`✅ Door ${doorId} reached expected state: ${expectedOpen ? 'open' : 'closed'}`);
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`❌ Door ${doorId} did not reach expected state within ${timeoutMs}ms`);
    return false;
  }
}
