// Optional browser check: build first and set PLAYWRIGHT_MODULE to an installed Playwright module.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const base = "http://localhost:3113";
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", "3113", "-H", "localhost"], { cwd: root, stdio: "ignore", windowsHide: true });
(async () => {
  let browser;
  try {
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      if (attempt > 100 || server.exitCode !== null) throw new Error("Test server unavailable");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    assert.equal((await context.request.post(`${base}/api/demo/login`, { data: { accountId: "faculty@nu-fairview.edu.ph", password: "FacultyDemo!2026" } })).status(), 200);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/dashboard/faculty/service-request`);
    const next = () => page.locator(".request-next-button").click();
    const back = () => page.getByRole("button", { name: "Back", exact: true }).click();
    const activity = (value) => page.locator(`input[name="activity-type"][value="${value}"]`).check();
    const scheduleType = (value) => page.locator(`input[name="schedule-type"][value="${value}"]`).check();
    const heading = () => page.locator("#request-step-title").innerText();
    async function responsive() {
      for (const width of [320, 390, 768, 1024, 1440, 2560, 3440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No page overflow at ${width}px (${await heading()})`);
        assert.ok((await page.locator(".classrep-request-page").boundingBox()).width <= 1121);
        const choices = page.locator(".request-type-option");
        if (width === 320 && await choices.count() === 2) {
          const first = await choices.nth(0).boundingBox(), second = await choices.nth(1).boundingBox();
          assert.ok(second.y > first.y + first.height, "Choice cards stack on narrow screens");
        }
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await responsive(); await next();
    assert.equal(await page.locator(".request-next-button").isDisabled(), true);
    await activity("LABORATORY_ACTIVITY");
    assert.equal(await page.locator(".request-steps > li").count(), 5);
    assert.equal(await page.locator('input[name="request-type"]').count(), 0);
    await responsive(); await next();
    assert.equal(await heading(), "Schedule & Room Availability");
    assert.equal(await page.getByLabel(/^Room Number/).isDisabled(), true);
    assert.equal(await page.getByLabel(/^Start Time/).getAttribute("readonly"), "");
    await responsive(); await back();
    assert.equal(await heading(), "Select Activity Type");
    await next(); await next();
    await page.getByRole("button", { name: "+ Add Equipment / Material", exact: true }).click();
    assert.equal(await page.locator(".request-next-button").isDisabled(), true);
    await page.getByLabel(/^Item Name/).fill("Multimeter");
    await page.getByLabel(/^Quantity/).fill("2");
    await responsive(); await next();
    assert.match(await page.locator(".request-review-content").innerText(), /Reservation Processing/);
    assert.equal(await page.getByRole("heading", { name: "Request Approval", exact: true }).count(), 0);
    assert.equal(await page.locator(".request-next-button").isDisabled(), true);
    await responsive();
    mkdirSync(path.join(root, "artifacts"), { recursive: true });
    await page.screenshot({ path: path.join(root, "artifacts/faculty-request-regular-desktop.png"), fullPage: true });
    await page.getByRole("checkbox").check(); await next();
    assert.match(await page.locator(".request-demo-receipt").innerText(), /Awaiting Reservation/);
    assert.equal(await page.getByRole("checkbox").isDisabled(), true);
    await next(); await next(); await activity("NON_LABORATORY_ACTIVITY");
    assert.equal(await page.locator(".request-steps > li").count(), 6);
    await next(); await responsive(); await next(); await next(); await next();
    assert.equal(await heading(), "Review Information");
    assert.equal(await page.getByRole("heading", { name: "Request Approval", exact: true }).count(), 0);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Edit schedule type", exact: true }).click();
    await scheduleType("OUT_OF_SCHEDULE"); await next();
    assert.equal(await page.getByLabel(/^Room Number/).isEnabled(), true);
    await page.getByLabel(/^Date Needed/).fill("2026-03-14");
    await page.getByLabel(/^Start Time/).fill("09:00"); await page.getByLabel(/^End Time/).fill("11:00");
    assert.equal(await page.locator(".request-next-button").isDisabled(), true, "Dean route cannot bypass occupied rooms");
    await page.getByLabel(/^Date Needed/).fill("2026-03-13");
    await page.getByLabel(/^Start Time/).fill("11:30"); await page.getByLabel(/^End Time/).fill("12:30");
    await next(); await next();
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
    assert.match(await page.locator(".request-review-content").innerText(), /For approval by: Dean/);
    assert.equal(await page.locator('input[name="approval-recipient"]').count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(root, "artifacts/faculty-request-dean-mobile.png"), fullPage: true });
    // Changing the branch removes Schedule Type and restores a valid assigned block.
    await page.getByRole("button", { name: "Edit activity type", exact: true }).click();
    await activity("LABORATORY_ACTIVITY"); await next();
    assert.equal(await page.getByLabel(/^Start Time/).inputValue(), "13:00");
    assert.equal(await page.getByLabel(/^Room Number/).isDisabled(), true);
    await back(); await activity("NON_LABORATORY_ACTIVITY"); await next();
    await scheduleType("OUT_OF_SCHEDULE"); await next();
    await page.getByLabel(/^Date Needed/).fill("2026-03-13"); await page.getByLabel(/^Start Time/).fill("11:30"); await page.getByLabel(/^End Time/).fill("12:30");
    await next(); await next(); await page.getByRole("checkbox").check(); await next();
    assert.match(await page.locator(".request-demo-receipt").innerText(), /Pending Dean Approval/);
    await next();
    await page.locator('input[name="laboratory"][value="physics"]').check(); await next(); await activity("LABORATORY_ACTIVITY"); await next();
    assert.equal(await page.getByLabel(/^Room Number/).inputValue(), "physics-201");
    await next(); await next(); assert.match(await page.locator(".request-review-content").innerText(), /Physics Laboratory/);
    await page.reload(); assert.equal(await heading(), "Choose Laboratory");
    assert.deepEqual(errors, []);
    console.log("Faculty browser checks passed: five/six steps, all routes, edits, conflicts, locked previews, Physics, and 320–3440px layouts.");
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
