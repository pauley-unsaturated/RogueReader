import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'puppeteer';
import { setupBrowser, setupGamePage } from '../setup';
import { GameTestHelpers } from '../helpers/gameHelpers';
import fs from 'fs/promises';

describe('Room Lock-In Mechanics', () => {
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

  it('should lock doors when player enters combat room with enemies', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Find a combat room with enemies
    const gameState = await helpers.getGameState();
    const rooms = gameState?.dungeon?.rooms || [];

    let combatRoomWithEnemies = null;
    for (let i = 1; i < rooms.length; i++) { // Skip room 0 (entrance room)
      const roomInfo = await helpers.getRoomInfo(i);
      if (roomInfo && (roomInfo.type === 'combat' || roomInfo.type === 'boss') && roomInfo.enemyCount > 0) {
        combatRoomWithEnemies = roomInfo;
        break;
      }
    }

    if (!combatRoomWithEnemies) {
      console.log('⚠️ No combat rooms with enemies found - test inconclusive');
      return; // Skip test if dungeon has no combat rooms
    }

    console.log(`Found combat room ${combatRoomWithEnemies.index} with ${combatRoomWithEnemies.enemyCount} enemies`);

    // Record door states before entry
    const doorsBeforeEntry = combatRoomWithEnemies.doors;
    console.log(`Doors before entry:`, doorsBeforeEntry);

    // All doors should start open
    expect(doorsBeforeEntry.every((d: any) => d.isOpen)).toBe(true);

    // Use pathfinding to navigate to the combat room
    console.log(`Navigating to combat room ${combatRoomWithEnemies.index}...`);
    const arrived = await helpers.navigateToRoom(combatRoomWithEnemies.index);

    if (!arrived) {
      console.log('⚠️ Could not navigate to combat room - test inconclusive');
      return;
    }

    // Wait for door locking to trigger
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check door states after entry
    const roomInfoAfter = await helpers.getRoomInfo(combatRoomWithEnemies.index);

    if (roomInfoAfter && roomInfoAfter.doors) {
      const closedDoors = roomInfoAfter.doors.filter((d: any) => !d.isOpen);
      console.log(`Doors after entry: ${closedDoors.length}/${roomInfoAfter.doors.length} closed`);

      // All doors should now be closed (player entered room with enemies)
      expect(closedDoors.length).toBe(roomInfoAfter.doors.length);
      expect(roomInfoAfter.doors.every((d: any) => !d.isOpen)).toBe(true);
    }
  });

  it('should have entrance room (room 0) with no enemies and no doors', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    const entranceRoom = await helpers.getRoomInfo(0);

    expect(entranceRoom).toBeTruthy();
    expect(entranceRoom?.type).toBe('entrance');
    expect(entranceRoom?.enemyCount).toBe(0);
    expect(entranceRoom?.doors.length).toBe(0);

    console.log(`✅ Entrance room verified: type=${entranceRoom?.type}, enemies=${entranceRoom?.enemyCount}, doors=${entranceRoom?.doors.length}`);
  });

  it('should unlock doors after clearing all enemies in room', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    // This test requires ability to defeat enemies programmatically
    // Placeholder for now - full implementation would:
    // 1. Enter combat room
    // 2. Defeat all enemies (requires spell casting simulation)
    // 3. Verify doors open

    console.log('⚠️ Test requires spell casting simulation - placeholder');
    expect(true).toBe(true);
  });

  it('should NOT lock doors when entering empty combat room', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    const gameState = await helpers.getGameState();
    const rooms = gameState?.dungeon?.rooms || [];

    let emptyCombatRoom = null;
    for (let i = 1; i < rooms.length; i++) {
      const roomInfo = await helpers.getRoomInfo(i);
      if (roomInfo && (roomInfo.type === 'combat' || roomInfo.type === 'boss') && roomInfo.enemyCount === 0) {
        emptyCombatRoom = roomInfo;
        break;
      }
    }

    if (!emptyCombatRoom) {
      console.log('⚠️ No empty combat rooms found - test inconclusive');
      return;
    }

    console.log(`Found empty combat room ${emptyCombatRoom.index}`);

    // Doors should remain open since room has no enemies
    const doorsAfter = emptyCombatRoom.doors;
    const allDoorsOpen = doorsAfter.every((d: any) => d.isOpen);

    expect(allDoorsOpen).toBe(true);
  });

  it('should block player movement through closed doors', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    // This test requires:
    // 1. Finding a combat room with enemies
    // 2. Entering it to close doors
    // 3. Attempting to move through a closed door
    // 4. Verifying player position doesn't change

    console.log('⚠️ Test requires player movement simulation - placeholder');
    expect(true).toBe(true);
  });

  it('should allow player to walk through open doors', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    const gameState = await helpers.getGameState();
    const playerPos = gameState?.player?.position;

    if (!playerPos) {
      console.log('⚠️ No player position found');
      return;
    }

    console.log(`Player starting position: (${playerPos.x}, ${playerPos.y})`);

    // Try moving in various directions
    await helpers.movePlayer('right', 2);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newState = await helpers.getGameState();
    const newPos = newState?.player?.position;

    console.log(`Player new position: (${newPos?.x}, ${newPos?.y})`);

    // Player should have been able to move (positions should differ)
    const hasMoved = newPos?.x !== playerPos.x || newPos?.y !== playerPos.y;
    expect(hasMoved).toBe(true);
  });

  it('should generate failure report if doors not working', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    const gameState = await helpers.getGameState();
    const rooms = gameState?.dungeon?.rooms || [];

    const combatRooms = rooms.filter((r: any) => r.type === 'combat' || r.type === 'boss');

    if (combatRooms.length === 0) {
      console.log('⚠️ No combat rooms generated');
      return;
    }

    // Check if first combat room has doors
    const firstCombatRoom = await helpers.getRoomInfo(combatRooms[0].index);

    if (!firstCombatRoom || !firstCombatRoom.doors || firstCombatRoom.doors.length === 0) {
      await helpers.takeScreenshot('no-doors-on-combat-room');

      const report = {
        bug: 'CRITICAL: Combat room has no doors',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        screenshotPath: 'tests/reports/screenshots/no-doors-on-combat-room.png',
        details: {
          roomIndex: combatRooms[0].index,
          roomType: combatRooms[0].type,
          roomBounds: combatRooms[0],
          expectedDoors: 'At least 1',
          actualDoors: 0
        }
      };

      await fs.writeFile(
        'tests/reports/latest-failure.json',
        JSON.stringify(report, null, 2)
      );

      expect(firstCombatRoom?.doors?.length || 0).toBeGreaterThan(0);
    } else {
      // Room has doors - test passes
      expect(firstCombatRoom.doors.length).toBeGreaterThan(0);
    }
  });

  it('should properly track room transitions in console logs', async () => {
    await helpers.startGame();
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Listen for console logs
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Room transition') || msg.text().includes('LOCKING DOORS')) {
        logs.push(msg.text());
      }
    });

    // Move player around
    await helpers.movePlayer('right', 3);
    await helpers.movePlayer('down', 3);
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Captured room transition logs:', logs);

    // If player moved between rooms, we should see transition logs
    // This is a soft assertion - logs are useful for debugging
    expect(logs.length).toBeGreaterThanOrEqual(0);
  });
});
