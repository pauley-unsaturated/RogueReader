import puppeteer, { Browser, Page } from 'puppeteer';

export async function setupBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: false, // Set to true for CI, false for debugging
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors', // Accept self-signed HTTPS cert
      '--allow-insecure-localhost'
    ],
    slowMo: 50, // Slow down actions for debugging
  });
}

export async function setupGamePage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Set viewport for consistent testing
  await page.setViewport({ width: 1280, height: 800 });

  // Navigate to HTTPS dev server (port 3000)
  await page.goto('https://localhost:3000', {
    waitUntil: 'networkidle0'
  });

  // Wait for Phaser to initialize
  await page.waitForFunction(() => {
    return (window as any).game !== undefined;
  }, { timeout: 10000 });

  return page;
}
