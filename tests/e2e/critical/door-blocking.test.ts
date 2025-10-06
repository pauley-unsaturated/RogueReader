import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'puppeteer';
import { setupBrowser, setupGamePage } from '../setup';
import { GameTestHelpers } from '../helpers/gameHelpers';
import fs from 'fs/promises';

describe('Door Blocking System', () => {
  let browser: Browser;
  let page: Page;
  let helpers: GameTestHelpers;

  beforeAll(async () => {
    browser = await setupBrowser();
    page = await setupGamePage(browser);
    helpers = new GameTestHelpers(page);
    await helpers.injectTestAPI();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should have doors connecting rooms', async () => {
    await helpers.startGame();
    await page.waitForTimeout(2000); // Let dungeon generate

    const gameState = await helpers.getGameState();
    const roomCount = gameState?.dungeon?.rooms?.length || 0;

    console.log('Game state:', JSON.stringify(gameState, null, 2));
    console.log(`Found ${roomCount} rooms`);

    // This test will likely FAIL initially because we may not have implemented doors yet
    // That's exactly what we want - it will catch the "skip to boss" bug

    // For now, just verify dungeon structure exists
    expect(gameState?.dungeon).not.toBeNull();
    expect(roomCount).toBeGreaterThan(0);

    // TODO: Once doors are implemented, add checks for:
    // - Door count (should be >= roomCount - 1 for connected rooms)
    // - Door states (initially closed)
    // - Door positions (between rooms)

    // Placeholder for door check (will fail until implemented)
    const hasDoorSystem = await page.evaluate(() => {
      const game = (window as any).game;
      const gameScene = game?.scene.getScene('GameScene');
      // Check if door array or door tracking exists
      return gameScene?.doors !== undefined;
    });

    if (!hasDoorSystem) {
      await helpers.takeScreenshot('no-door-system-bug');

      const report = {
        bug: 'CRITICAL: Door system not implemented - player can skip to boss',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        rooms: gameState?.dungeon?.rooms,
        screenshotPath: 'tests/reports/screenshots/no-door-system-bug.png',
        designRequirement: 'Boss-Gated Progression requires doors to block paths until combat is cleared',
        exploitFound: 'Kid playtest discovered: can walk directly to boss without clearing rooms',
        suggestedFix: [
          'Add doors array to GameScene',
          'Create Door class extending Phaser.GameObjects.Container',
          'Generate doors between connected rooms in DungeonGenerator',
          'Block player movement through closed doors in Player.ts collision detection',
          'Open doors when combat room is cleared'
        ]
      };

      await fs.writeFile(
        'tests/reports/latest-failure.json',
        JSON.stringify(report, null, 2)
      );

      console.warn('⚠️ Door system not found - this will allow boss skip exploit');
    }

    // This will fail initially - that's expected and desired!
    expect(hasDoorSystem).toBe(true);
  });

  it('should prevent player from moving through closed doors', async () => {
    // This test requires door system to be implemented first
    // Will be skipped until door system exists

    const hasDoorSystem = await page.evaluate(() => {
      const game = (window as any).game;
      const gameScene = game?.scene.getScene('GameScene');
      return gameScene?.doors !== undefined;
    });

    if (!hasDoorSystem) {
      console.log('⏭️ Skipping door collision test - door system not implemented');
      return;
    }

    // TODO: Implement door collision test
    // 1. Find a closed door
    // 2. Try to move player through it
    // 3. Verify player position doesn't change
    expect(hasDoorSystem).toBe(true);
  });

  it('should open doors after clearing combat rooms', async () => {
    // This test requires both door system AND combat system to work together
    // Will be implemented after door system exists

    const hasDoorSystem = await page.evaluate(() => {
      const game = (window as any).game;
      const gameScene = game?.scene.getScene('GameScene');
      return gameScene?.doors !== undefined;
    });

    if (!hasDoorSystem) {
      console.log('⏭️ Skipping door unlock test - door system not implemented');
      return;
    }

    // TODO: Implement door unlock test
    // 1. Enter combat room
    // 2. Defeat all enemies
    // 3. Verify connected doors open
    expect(hasDoorSystem).toBe(true);
  });
});
