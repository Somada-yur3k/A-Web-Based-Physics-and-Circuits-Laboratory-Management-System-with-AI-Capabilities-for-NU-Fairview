const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:3111';
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3111', '-H', '127.0.0.1'], { cwd: root, stdio: 'ignore', windowsHide: true });
const widths = [320, 390, 650, 768, 860, 900, 1024, 1440, 1920, 2560, 3440];
(async () => {
  let browser;
  try {
    for (let i = 0; ; i++) { try { if ((await fetch(base)).ok) break; } catch {} if (i > 100) throw Error('Server unavailable'); await new Promise(resolve => setTimeout(resolve, 100)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    mkdirSync(path.join(root, 'artifacts/responsive'), { recursive: true });
    const metrics = [];
    async function check(page, label, selector) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const sizes = await page.evaluate(selector => {
          const main = document.querySelector(selector), bounds = main.getBoundingClientRect();
          const cards = [...document.querySelectorAll('.lab-stat-card,.lab-panel,.lab-create-panel,.lab-quick-action,.request-laboratory-panel,.request-laboratory-option,.request-type-option,.request-students-panel,.request-student-row,.request-schedule-fields,.request-availability-panel,.request-review-card,.request-item-row')].map(node => {
            const rect = node.getBoundingClientRect();
            return { className: node.className, left: rect.left, right: rect.right, width: rect.width, scroll: node.scrollWidth, client: node.clientWidth };
          });
          return { root: document.documentElement.scrollWidth, main: { left: bounds.left, right: bounds.right, width: bounds.width }, cards, columns: getComputedStyle(document.querySelector('.lab-primary-grid,.request-laboratory-options,.request-type-options,.request-schedule-columns,.request-review-grid') || main).gridTemplateColumns };
        }, selector);
        assert(sizes.root <= width + 1, `${label} ${width}: root horizontal overflow ${sizes.root}`);
        assert(sizes.main.width <= (selector === '.lab-dashboard-content' ? 1440 : 1120) + 1, `${label} ${width}: unbounded main`);
        for (const card of sizes.cards) {
          assert(card.left >= sizes.main.left - 1 && card.right <= sizes.main.right + 1, `${label} ${width}: card exceeds page: ${JSON.stringify(card)}`);
          assert(card.scroll <= card.client + 2, `${label} ${width}: content spills from card: ${JSON.stringify(card)}`);
        }
        metrics.push({ label, width, content: sizes.main.width, columns: sizes.columns });
        if ([390, 900, 2560].includes(width)) await page.screenshot({ path: path.join(root, `artifacts/responsive/${label}-${width}.png`), fullPage: true });
      }
    }
    for (const role of ['classrep', 'faculty']) {
      const context = await browser.newContext();
      const response = await context.request.post(base + '/api/demo/login', { data: { accountId: role === 'classrep' ? '2024-1031816' : 'faculty@nu-fairview.edu.ph', password: role === 'classrep' ? 'ClassrepDemo!2026' : 'FacultyDemo!2026' } });
      assert.equal(response.status(), 200);
      const page = await context.newPage();
      await page.goto(base + '/dashboard/' + role);
      await page.locator('.lab-dashboard-content').waitFor();
      await check(page, role + '-dashboard', '.lab-dashboard-content');
      if (role === 'classrep') {
        await page.goto(base + '/dashboard/classrep/service-request');
        await page.locator('.classrep-request-page').waitFor();
        const next = name => page.getByRole('button', { name, exact: true }).click();
        await check(page, 'request-step-1', '.classrep-request-page');
        await next('Next: Choose Request Type');
        await page.locator('input[name="request-type"][value="GROUP"]').check();
        await page.getByLabel(/^Student Name/).fill('Responsive Test Student');
        await page.getByLabel(/^NU Student ID/).fill('2024-1031816');
        await check(page, 'request-step-2', '.classrep-request-page');
        await next('Next: Schedule Type');
        await page.locator('input[name="schedule-type"][value="OUT_OF_SCHEDULE"]').check();
        await check(page, 'request-step-3', '.classrep-request-page');
        await next('Next: Schedule & Room');
        await page.getByLabel(/^Date Needed/).fill('2026-03-13');
        await page.getByLabel(/^Start Time/).fill('11:30');
        await page.getByLabel(/^End Time/).fill('12:30');
        await check(page, 'request-step-4', '.classrep-request-page');
        await next('Next: Equipment & Materials');
        await next('+ Add Equipment / Material');
        await page.getByLabel(/^Item Name/).fill('Multimeter');
        await page.getByLabel(/^Quantity/).fill('2');
        await check(page, 'request-step-5', '.classrep-request-page');
        await next('Next: Review Information');
        await page.locator('input[name="approval-recipient"][value="DEAN"]').check();
        await check(page, 'request-step-6', '.classrep-request-page');
      }
      await context.close();
    }
    writeFileSync(path.join(root, 'artifacts/responsive/measurements.json'), JSON.stringify(metrics, null, 2));
    console.log('Responsive browser checks passed: both dashboards and all six request steps at 11 widths (320–3440px), bounded main/card widths, internal table/calendar scrolling, and no page overflow.');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
