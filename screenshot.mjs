import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label]');
  process.exit(1);
}

const screenshotsDir = path.join(__dirname, 'temporary screenshots');

// Create directory if it doesn't exist
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Find the next available screenshot number
function getNextScreenshotNumber() {
  const files = fs.readdirSync(screenshotsDir);
  const screenshotFiles = files.filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));

  if (screenshotFiles.length === 0) {
    return 1;
  }

  const numbers = screenshotFiles.map(f => {
    const match = f.match(/screenshot-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });

  return Math.max(...numbers) + 1;
}

const screenshotNumber = getNextScreenshotNumber();
const filename = label
  ? `screenshot-${screenshotNumber}-${label}.png`
  : `screenshot-${screenshotNumber}.png`;
const filepath = path.join(screenshotsDir, filename);

console.log(`Taking screenshot of ${url}...`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

try {
  const page = await browser.newPage();

  // Set a reasonable viewport size
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2, // For retina/high-DPI displays
  });

  await page.goto(url, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Take full page screenshot
  await page.screenshot({
    path: filepath,
    fullPage: true
  });

  console.log(`Screenshot saved: ${filename}`);
} catch (error) {
  console.error('Error taking screenshot:', error.message);
  process.exit(1);
} finally {
  await browser.close();
}
