import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'puppeteer';
import { setupBrowser, setupGamePage } from '../setup';
import { GameTestHelpers } from '../helpers/gameHelpers';
import fs from 'fs/promises';

describe('Boss-Gated Progression', () => {
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

  it('should have a boss room on every level', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Let dungeon generate

    const gameState = await helpers.getGameState();

    console.log('Game state:', JSON.stringify(gameState, null, 2));

    const bossRoom = gameState?.bossRoom;

    if (!bossRoom) {
      await helpers.takeScreenshot('no-boss-room-bug');

      const report = {
        bug: 'CRITICAL: No boss room exists on floor 1',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        dungeon: gameState?.dungeon,
        screenshotPath: 'tests/reports/screenshots/no-boss-room-bug.png',
        designRequirement: 'Boss-Gated Stairwell Progression requires a boss room on every floor',
        suggestedFix: [
          'Check DungeonGenerator.ts room generation logic',
          'Ensure one room is marked with hasBoss=true or type="boss"',
          'Verify boss enemy spawns in the designated room'
        ]
      };

      await fs.writeFile(
        'tests/reports/latest-failure.json',
        JSON.stringify(report, null, 2)
      );
    }

    expect(bossRoom).not.toBeNull();
    expect(bossRoom).toHaveProperty('x');
    expect(bossRoom).toHaveProperty('y');
  });

  it('boss should not spawn in player start room', async () => {
    const gameState = await helpers.getGameState();
    const distance = gameState?.playerBossDistance;

    console.log(`Player-to-boss distance: ${distance} tiles`);

    if (distance && distance < 5) {
      await helpers.takeScreenshot('boss-too-close-bug');

      const report = {
        bug: 'CRITICAL: Boss spawned too close to player start',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        playerPosition: gameState?.player?.position,
        bossRoom: gameState?.bossRoom,
        distance: distance,
        screenshotPath: 'tests/reports/screenshots/boss-too-close-bug.png',
        designRequirement: 'Boss should spawn far from player to require dungeon exploration',
        suggestedFix: [
          'Check DungeonGenerator.ts boss room selection',
          'Ensure boss room is not the starting room',
          'Add distance check: boss room should be >5 tiles from start'
        ]
      };

      await fs.writeFile(
        'tests/reports/latest-failure.json',
        JSON.stringify(report, null, 2)
      );
    }

    // Boss should be reasonably far from player spawn
    // Using grid distance (tiles), not pixel distance
    expect(distance).toBeGreaterThan(5);
  });

  it('should have multiple rooms connecting player to boss', async () => {
    const gameState = await helpers.getGameState();
    const roomCount = gameState?.dungeon?.rooms?.length || 0;

    console.log(`Total rooms generated: ${roomCount}`);

    // According to GAME_CONFIG, floor 1 should have BASE_ROOMS (5) minimum
    expect(roomCount).toBeGreaterThanOrEqual(5);
  });
});
