const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'), base = 'http://localhost:3112';
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3112', '-H', 'localhost'], { cwd: root, stdio: 'ignore', windowsHide: true });
(async () => {
  let browser;
  try {
    for (let i = 0; ; i++) { try { if ((await fetch(base)).ok) break; } catch {} if (i > 100) throw Error('Server unavailable'); await new Promise(resolve => setTimeout(resolve, 100)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    fs.mkdirSync(path.join(root, 'artifacts/login'), { recursive: true });
    await page.goto(base);
    const metrics = [];
    for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[600,800],[768,1024],[1366,768],[1920,1080],[2560,1440],[844,390],[390,360]]) {
      await page.setViewportSize({ width, height });
      const result = await page.evaluate(() => {
        const card = document.querySelector('.login-card'), rect = card.getBoundingClientRect();
        return { card: { left: rect.left, top: rect.top, right: rect.right, width: rect.width, height: rect.height }, pageWidth: document.documentElement.scrollWidth,
          inputFont: getComputedStyle(document.querySelector('#account-id')).fontSize,
          inputHeight: document.querySelector('.input-wrap').getBoundingClientRect().height,
          toggle: document.querySelector('.password-toggle').getBoundingClientRect().height,
          buttonHeight: document.querySelector('.sign-in').getBoundingClientRect().height,
          spills: [...card.querySelectorAll('header,form,.input-wrap,.welcome,footer')].filter(node => node.scrollWidth > node.clientWidth + 2).map(node => node.className) };
      });
      assert(result.pageWidth <= width + 1, `Page overflow at ${width}x${height}`);
      assert(result.card.width <= (width <= 600 ? 360 : 440) + 1);
      assert(result.card.height <= (width <= 600 ? 550 : 600), 'Login card unexpectedly tall');
      assert(result.card.left >= 0 && result.card.right <= width && result.card.top >= 0, 'Login is cropped');
      assert.equal(result.inputFont, '16px');
      assert(result.inputHeight >= 44 && result.toggle >= 44 && result.buttonHeight >= 44, 'Controls remain usable');
      assert.deepEqual(result.spills, []);
      metrics.push({ width, height, ...result });
      if ([[390,844],[1366,768],[844,390]].some(([w,h]) => w === width && h === height)) await page.screenshot({ path: path.join(root, `artifacts/login/compact-${width}-${height}.png`), fullPage: true });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByLabel('Account ID', { exact: true }).fill('2024-1031816');
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword');
    await page.getByRole('button', { name: 'Show password' }).click();
    assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    try { await page.getByRole('status').filter({ hasText: 'Incorrect Account ID or password.' }).waitFor({ timeout: 5000 }); }
    catch (error) { console.error(JSON.stringify({ url: page.url(), notice: await page.locator('.form-notice').allTextContents() })); await page.screenshot({ path: path.join(root, 'artifacts/login/check-error.png'), fullPage: true }); throw error; }
    assert(await page.getByRole('button', { name: 'Sign In', exact: true }).isEnabled());
    await page.getByLabel('Password', { exact: true }).fill('ClassrepDemo!2026');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(base + '/dashboard/classrep');
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(root, 'artifacts/login/measurements.json'), JSON.stringify(metrics, null, 2));
    console.log('Compact login verified at 11 viewports: mobile, desktop, ultrawide, landscape, and keyboard-height layout; bounded card, no overflow, 16px inputs, 44px controls, password toggle, error state, and successful sign-in.');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
