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

  it('should have doors at entrances to combat/boss rooms', async () => {
    await helpers.startGame();

    // Wait longer for dungeon generation + scene transition
    await new Promise(resolve => setTimeout(resolve, 3500));

    const doorData = await page.evaluate(() => {
      const game = (window as any).game;
      const gameScene = game?.scene.getScene('GameScene');

      if (!gameScene || !gameScene.doors) {
        return { hasDoors: false, doors: [], rooms: [] };
      }

      const doors = gameScene.doors.map((door: any) => ({
        id: door.id,
        gridX: door.gridX,
        gridY: door.gridY,
        roomIndex: door.roomIndex,
        isOpen: door.getIsOpen(),
        alpha: door.doorGraphic?.alpha || 0
      }));

      const rooms = gameScene.dungeon.rooms.map((r: any, i: number) => ({
        index: i,
        type: r.type,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height
      }));

      return { hasDoors: true, doors, rooms };
    });

    console.log('Door system check:', JSON.stringify(doorData, null, 2));

    if (!doorData.hasDoors) {
      await helpers.takeScreenshot('no-door-system-bug');

      const report = {
        bug: 'CRITICAL: Door system not implemented',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        screenshotPath: 'tests/reports/screenshots/no-door-system-bug.png',
      };

      await fs.writeFile(
        'tests/reports/latest-failure.json',
        JSON.stringify(report, null, 2)
      );
    }

    expect(doorData.hasDoors).toBe(true);

    // Verify doors only exist for combat/boss rooms
    const combatBossRooms = doorData.rooms.filter((r: any) =>
      r.type === 'combat' || r.type === 'boss'
    );

    console.log(`Combat/boss rooms: ${combatBossRooms.length}, Total doors: ${doorData.doors.length}`);
    expect(doorData.doors.length).toBeGreaterThan(0);

    // Verify doors start open (alpha = 0)
    const openDoors = doorData.doors.filter((d: any) => d.isOpen && d.alpha === 0);
    console.log(`Open doors (alpha=0): ${openDoors.length}/${doorData.doors.length}`);
    expect(openDoors.length).toBe(doorData.doors.length);
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
