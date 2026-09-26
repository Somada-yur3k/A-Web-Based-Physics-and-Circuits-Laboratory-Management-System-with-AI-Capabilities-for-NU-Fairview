// Build first; PLAYWRIGHT_MODULE may point to an installed Playwright module.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://localhost:3115';
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3115', '-H', 'localhost'], { cwd: root, stdio: 'ignore', windowsHide: true });
const accounts = [
  { accountId: 'physics@nu-fairview.edu.ph', password: 'PhysicsDemo!2026', dashboard: '/dashboard/physics-laboratory', other: '/dashboard/circuits-laboratory' },
  { accountId: 'circuits@nu-fairview.edu.ph', password: 'CircuitsDemo!2026', dashboard: '/dashboard/circuits-laboratory', other: '/dashboard/physics-laboratory' },
];
(async () => {
  let browser;
  try {
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      if (attempt > 100 || server.exitCode !== null) throw new Error('Staff test server unavailable');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    // Existing auth checks now cover every documented role and dashboard/Profile pair.
    await new Promise((resolve, reject) => {
      const check = spawn(process.execPath, ['scripts/check-demo-auth.mjs'], { cwd: root, env: { ...process.env, DEMO_BASE_URL: base }, stdio: 'inherit', windowsHide: true });
      check.once('error', reject);
      check.once('exit', code => code === 0 ? resolve() : reject(new Error('Demo auth checks failed')));
    });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    for (const account of accounts) {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base);
        await page.getByLabel('Account ID', { exact: true }).fill(account.accountId);
        await page.getByLabel('Password', { exact: true }).fill('WrongPassword');
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await page.getByText('Incorrect Account ID or password.', { exact: true }).waitFor();
        assert.equal(new URL(page.url()).pathname, '/');
        await page.getByLabel('Password', { exact: true }).fill(account.password);
        await page.getByRole('button', { name: 'Sign In', exact: true }).click();
        await page.waitForURL(base + account.dashboard);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.reload();
        await page.getByRole('button', { name: 'Open account menu', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Profile', exact: true }).click();
        await page.waitForURL(base + account.dashboard + '/profile');
        await page.goto(base + account.other + '/profile');
        await page.waitForURL(base + account.dashboard);
        await page.getByRole('button', { name: 'Open account menu', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Log-out', exact: true }).click();
        await page.waitForURL(base + '/');
        assert.equal((await context.request.get(base + '/api/demo/session')).status(), 401);
        await page.goto(base + account.dashboard);
        await page.waitForURL(base + '/');
        assert.deepEqual(errors, []);
        await context.close();
      }
    }
    console.log('Staff browser checks passed: desktop/mobile login, bad credentials, refresh, Profile, cross-lab redirects, and menu logout.');
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
