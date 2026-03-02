/**
 * Generate extension icons using Puppeteer
 * Design spec: red (#ef4444) rounded rect, white text "掰it"
 * - 128px: 掰it (ZCOOL KuaiLe + Nunito 700)
 * - 48px: 掰it
 * - 16px: only 掰
 */
import puppeteer from 'puppeteer';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, '..', 'icons');

const ICONS = [
  {
    size: 128,
    html: `
      <div style="display:flex;align-items:baseline;">
        <span style="font-family:'ZCOOL KuaiLe';font-size:58px;color:#fff;line-height:1;">掰</span>
        <span style="font-family:'Nunito';font-size:46px;font-weight:700;color:rgba(255,255,255,0.85);line-height:1;margin-left:1px;">it</span>
      </div>
    `
  },
  {
    size: 48,
    html: `
      <div style="display:flex;align-items:baseline;">
        <span style="font-family:'ZCOOL KuaiLe';font-size:22px;color:#fff;line-height:1;">掰</span>
        <span style="font-family:'Nunito';font-size:16px;font-weight:700;color:rgba(255,255,255,0.8);line-height:1;margin-left:0;">it</span>
      </div>
    `
  },
  {
    size: 16,
    html: `
      <span style="font-family:'ZCOOL KuaiLe';font-size:10px;color:#fff;line-height:1;">掰</span>
    `
  }
];

async function generate() {
  await mkdir(ICONS_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const icon of ICONS) {
    const { size, html } = icon;
    const radius = Math.round(size * 0.22);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Nunito:wght@700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; }
    body {
      width: ${size}px;
      height: ${size}px;
      overflow: hidden;
      background: transparent;
    }
    .icon {
      width: ${size}px;
      height: ${size}px;
      border-radius: ${radius}px;
      background: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="icon">${html}</div>
</body>
</html>`;

    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
    // Wait for fonts to load (with timeout fallback)
    await page.evaluate(() => Promise.race([
      document.fonts.ready,
      new Promise(r => setTimeout(r, 5000))
    ]));
    await new Promise(r => setTimeout(r, 1000));

    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size }
    });

    const outPath = path.join(ICONS_DIR, `icon${size}.png`);
    await writeFile(outPath, screenshot);
    console.log(`Generated ${outPath} (${size}x${size})`);
  }

  await browser.close();
  console.log('Done!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
