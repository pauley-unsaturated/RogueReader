import puppeteer, { Browser, Page } from 'puppeteer';

export async function setupBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: false, // Set to true for CI, false for debugging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors', // Accept self-signed HTTPS cert
      '--allow-insecure-localhost',
      '--disable-web-security', // Bypass CORS and cert issues
      '--reduce-security-for-testing', // Additional security bypass for localhost
      '--unsafely-treat-insecure-origin-as-secure=https://localhost:3000'
    ],
    slowMo: 50, // Slow down actions for debugging
    ignoreHTTPSErrors: true // Puppeteer-level HTTPS error ignore
  });
}

export async function setupGamePage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Grant microphone permissions to prevent dialog popups during testing
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://localhost:3000', ['microphone']);
  console.log('Microphone permissions granted');

  // Log console errors from the page
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`Browser ${type}:`, msg.text());
    }
  });

  // Log page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  // Set viewport for consistent testing
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to page first (needed to access localStorage)
  console.log('Navigating to https://localhost:3000...');
  await page.goto('https://localhost:3000', {
    waitUntil: 'domcontentloaded' // Don't wait for full load
  });

  // Set localStorage to skip tutorial BEFORE game initializes
  await page.evaluate(() => {
    localStorage.setItem('roguereader_tutorial_completed', 'true');
    localStorage.setItem('roguereader_has_played', 'true');
  });
  console.log('Tutorial skip flags set in localStorage');

  // Now reload to apply the flags
  await page.reload({ waitUntil: 'networkidle0' });
  console.log('Page reloaded with tutorial skipped');

  // Wait for Phaser to initialize
  await page.waitForFunction(() => {
    return (window as any).game !== undefined;
  }, { timeout: 10000 });
  console.log('Phaser game initialized');

  return page;
}
