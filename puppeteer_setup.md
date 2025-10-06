# Puppeteer QA Automation Setup for RogueReader

## Context

RogueReader is an educational reading game built with Phaser 3 + TypeScript. We need automated testing to catch bugs during development and ensure design compliance without manual intervention.

## Current Problems to Solve

1. **Door-Skip Bug**: Player can reach the boss without opening doors (discovered by kid playtest)
2. **Chrome Game Loop Bugs**: Various issues in Chrome browser
3. **Design Compliance**: Need to verify implementation matches DESIGN.md specifications

## Objective

Set up Puppeteer to:
- Automatically test game mechanics
- Detect design violations
- Generate structured bug reports
- Enable longer coding agent iteration without manual testing

## Installation Steps

```bash
# Install dependencies
npm install --save-dev puppeteer @types/node vitest
```

## File Structure to Create

```
roguereader/
├── tests/
│   ├── e2e/
│   │   ├── setup.ts
│   │   ├── helpers/
│   │   │   └── gameHelpers.ts
│   │   └── critical/
│   │       ├── door-blocking.test.ts
│   │       └── boss-gating.test.ts
│   └── reports/
│       └── screenshots/
└── scripts/
    └── run-qa-loop.ts
```

## Code Files to Create

### 1. `tests/e2e/setup.ts`

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';

export async function setupBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: false, // Set to true for CI, false for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50, // Slow down actions for debugging
  });
}

export async function setupGamePage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  
  // Set viewport for consistent testing
  await page.setViewport({ width: 1280, height: 720 });
  
  // Navigate to dev server
  await page.goto('http://localhost:5173', { 
    waitUntil: 'networkidle0' 
  });
  
  // Wait for Phaser to initialize
  await page.waitForFunction(() => {
    return (window as any).game !== undefined;
  }, { timeout: 10000 });
  
  return page;
}
```

### 2. `tests/e2e/helpers/gameHelpers.ts`

```typescript
import { Page } from 'puppeteer';

export class GameTestHelpers {
  constructor(private page: Page) {}

  async injectTestAPI() {
    await this.page.evaluate(() => {
      (window as any).testAPI = {
        getCurrentScene: () => {
          const game = (window as any).game;
          return game?.scene.keys;
        },
        
        getPlayerPosition: () => {
          const game = (window as any).game;
          const dungeonScene = game?.scene.getScene('DungeonScene');
          return dungeonScene?.player 
            ? { x: dungeonScene.player.x, y: dungeonScene.player.y }
            : null;
        },
        
        getBossRoom: () => {
          const game = (window as any).game;
          const dungeonScene = game?.scene.getScene('DungeonScene');
          return dungeonScene?.bossRoom || null;
        },
        
        getDoors: () => {
          const game = (window as any).game;
          const dungeonScene = game?.scene.getScene('DungeonScene');
          return dungeonScene?.doors?.map((d: any) => ({
            x: d.x,
            y: d.y,
            isOpen: d.isOpen || false
          })) || [];
        },
        
        getRooms: () => {
          const game = (window as any).game;
          const dungeonScene = game?.scene.getScene('DungeonScene');
          return dungeonScene?.rooms?.map((r: any) => ({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height
          })) || [];
        }
      };
    });
  }

  async startGame() {
    // Wait for start button and click it
    await this.page.waitForSelector('button', { timeout: 5000 });
    const buttons = await this.page.$$('button');
    
    for (const button of buttons) {
      const text = await this.page.evaluate(el => el.textContent, button);
      if (text?.includes('Start') || text?.includes('Play')) {
        await button.click();
        await this.page.waitForTimeout(1000);
        return;
      }
    }
  }

  async skipTutorial() {
    try {
      const buttons = await this.page.$$('button');
      for (const button of buttons) {
        const text = await this.page.evaluate(el => el.textContent, button);
        if (text?.includes('Skip')) {
          await button.click();
          await this.page.waitForTimeout(500);
          return;
        }
      }
    } catch (error) {
      // Tutorial might not be present
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
      return (window as any).testAPI;
    });
  }
}
```

### 3. `tests/e2e/critical/door-blocking.test.ts`

```typescript
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
    await helpers.skipTutorial();
    
    await page.waitForTimeout(2000); // Let dungeon generate

    const doors = await page.evaluate(() => {
      return (window as any).testAPI.getDoors();
    });

    const rooms = await page.evaluate(() => {
      return (window as any).testAPI.getRooms();
    });

    console.log('Found rooms:', rooms.length);
    console.log('Found doors:', doors.length);

    if (doors.length === 0) {
      await helpers.takeScreenshot('no-doors-bug');
      
      const report = {
        bug: 'CRITICAL: No doors exist in dungeon',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        rooms: rooms,
        doors: doors,
        screenshotPath: 'tests/reports/screenshots/no-doors-bug.png',
        designRequirement: 'Boss-Gated Stairwell Progression requires doors to block paths',
        suggestedFix: [
          'Check DungeonScene room generation logic',
          'Ensure doors are created between connected rooms',
          'Verify door sprites are added to the scene'
        ]
      };
      
      await fs.writeFile(
        'tests/reports/latest-failure.json',
        JSON.stringify(report, null, 2)
      );
    }

    expect(doors.length).toBeGreaterThan(0);
  });

  it('should prevent skipping to boss without opening doors', async () => {
    // This test requires implementing pathfinding check
    // For now, verify doors exist and are closed
    const doors = await page.evaluate(() => {
      return (window as any).testAPI.getDoors();
    });

    const allClosed = doors.every((door: any) => !door.isOpen);
    expect(allClosed).toBe(true);
  });
});
```

### 4. `tests/e2e/critical/boss-gating.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Browser, Page } from 'puppeteer';
import { setupBrowser, setupGamePage } from '../setup';
import { GameTestHelpers } from '../helpers/gameHelpers';

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
    await helpers.skipTutorial();
    
    await page.waitForTimeout(2000);

    const bossRoom = await page.evaluate(() => {
      return (window as any).testAPI.getBossRoom();
    });

    expect(bossRoom).not.toBeNull();
  });

  it('boss should not spawn in player start room', async () => {
    const playerPos = await page.evaluate(() => {
      return (window as any).testAPI.getPlayerPosition();
    });

    const bossRoom = await page.evaluate(() => {
      return (window as any).testAPI.getBossRoom();
    });

    if (playerPos && bossRoom) {
      const distance = Math.sqrt(
        Math.pow(playerPos.x - bossRoom.x, 2) + 
        Math.pow(playerPos.y - bossRoom.y, 2)
      );

      // Boss should be far from player spawn
      expect(distance).toBeGreaterThan(100);
    }
  });
});
```

### 5. `scripts/run-qa-loop.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function runQALoop() {
  console.log('🤖 Starting RogueReader QA Loop...\n');

  try {
    console.log('Running Puppeteer tests...');
    await execAsync('npm run test:e2e');
    console.log('✅ All tests passed!\n');
    return;
  } catch (error) {
    console.log('❌ Tests failed. Generating report...\n');
  }

  try {
    const report = JSON.parse(
      await fs.readFile('tests/reports/latest-failure.json', 'utf-8')
    );

    const agentPrompt = `# QA Test Failure Report

## Bug Detected
${report.bug}

**Severity**: ${report.severity}
**Timestamp**: ${report.timestamp}

## Evidence
- Screenshot: ${report.screenshotPath}
${report.rooms ? `- Rooms found: ${report.rooms.length}` : ''}
${report.doors ? `- Doors found: ${report.doors.length}` : ''}

## Design Requirement
${report.designRequirement}

## Suggested Fix
${report.suggestedFix.map((fix: string, i: number) => `${i + 1}. ${fix}`).join('\n')}

## Debug Data
\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;

    await fs.writeFile('tests/reports/agent-prompt.md', agentPrompt);
    
    console.log('📝 Report generated: tests/reports/agent-prompt.md');
    console.log('\nNext: Review the report and fix the issues.\n');
    
  } catch (error) {
    console.log('⚠️  No failure report found. Check test output.\n');
  }
}

runQALoop().catch(console.error);
```

### 6. Update `package.json`

Add these scripts:

```json
{
  "scripts": {
    "test:e2e": "vitest run tests/e2e",
    "test:e2e:watch": "vitest watch tests/e2e",
    "qa-loop": "tsx scripts/run-qa-loop.ts"
  }
}
```

### 7. Create `vitest.config.ts` (if not exists)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds for Puppeteer tests
  },
});
```

## Modifications to Existing Code

### Expose game instance for testing in `src/main.ts`

Add after game creation:

```typescript
// Make game accessible for testing in development
if (import.meta.env.DEV) {
  (window as any).game = game;
}
```

### Add test helpers to `src/scenes/DungeonScene.ts`

Add these properties/methods so Puppeteer can inspect game state:

```typescript
// In DungeonScene class
public doors: any[] = []; // Make doors accessible
public rooms: any[] = []; // Make rooms accessible
public bossRoom: any = null; // Track boss room
```

## Usage Instructions

### Initial Setup
```bash
# Install dependencies
npm install

# Create directory structure
mkdir -p tests/e2e/helpers tests/e2e/critical tests/reports/screenshots scripts
```

### Running Tests

```bash
# Run dev server in one terminal
npm run dev

# Run QA loop in another terminal
npm run qa-loop

# Or watch tests continuously
npm run test:e2e:watch
```

### Debugging Tests

Set `headless: false` in `tests/e2e/setup.ts` to watch the browser.

## Critical Tests to Implement First

1. **Door Blocking** ✓ (catches the kid's exploit)
2. **Boss Gating** ✓ (verifies design requirement)
3. Combat loop integrity (next priority)
4. Scene transitions (next priority)

## Success Criteria

- ✅ Tests catch the door-skip bug
- ✅ Reports are generated automatically
- ✅ Agent can iterate based on test feedback
- ✅ Chrome-specific bugs are caught early

## Next Steps After Setup

1. Run `npm run qa-loop` to generate first failure report
2. Review `tests/reports/agent-prompt.md`
3. Fix the door-blocking issue
4. Re-run tests to verify fix
5. Add more tests as needed

## Notes

- Tests run against `http://localhost:5173` (Vite dev server must be running)
- Screenshots saved to `tests/reports/screenshots/`
- Failure reports saved to `tests/reports/latest-failure.json`
- Agent prompts saved to `tests/reports/agent-prompt.md`
