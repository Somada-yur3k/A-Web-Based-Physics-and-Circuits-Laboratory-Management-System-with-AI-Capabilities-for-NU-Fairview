// Optional browser check: set PLAYWRIGHT_MODULE to an installed Playwright module.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const base = "http://127.0.0.1:3107";
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", "3107", "-H", "127.0.0.1"], { cwd: root, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

(async () => {
  let browser;
  try {
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      if (attempt > 100 || server.exitCode !== null) throw new Error(`Test server unavailable: ${serverOutput}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ channel: "msedge", headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const login = await context.request.post(`${base}/api/demo/login`, { data: { accountId: "2024-1031816", password: "ClassrepDemo!2026" } });
    assert.equal(login.status(), 200);
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${base}/dashboard/classrep/service-request`);
    const next = (name) => page.getByRole("button", { name, exact: true }).click();
    async function enterStudents(type) {
      await next("Next: Choose Request Type");
      await page.locator(`input[name="request-type"][value="${type}"]`).check();
      await page.getByLabel(/^Student Name/).first().fill("Review Test Student");
      await page.getByLabel(/^NU Student ID/).first().fill("2024-1031816");
    }
    async function review() {
      await next("Next: Equipment & Materials");
      await next("Next: Review Information");
      await page.getByRole("heading", { name: "Review Information", exact: true }).waitFor();
    }
    const submit = () => page.getByRole("button", { name: "Submit Demo Request", exact: true });
    const confirmation = () => page.getByRole("checkbox");
    mkdirSync(path.join(root, "artifacts"), { recursive: true });

    // Group / On-Schedule: details, optional items, edits, subject Faculty, locked receipt.
    await enterStudents("GROUP");
    await next("Add Student");
    await page.getByLabel(/^Student Name/).nth(1).fill("Second Student");
    await page.getByLabel(/^NU Student ID/).nth(1).fill("2024-1234567");
    await next("Next: Schedule Type");
    await next("Next: Schedule & Room");
    await next("Next: Equipment & Materials");
    await next("+ Add Equipment / Material");
    assert.equal(await page.getByRole("button", { name: "Next: Review Information" }).isDisabled(), true);
    await page.getByLabel(/^Item Name/).fill("Multimeter");
    await page.getByLabel(/^Quantity/).fill("2");
    await page.getByLabel(/^Notes \/ Special Setup/).fill("Prepare test bench.");
    await next("Next: Review Information");
    assert.match(await page.locator(".request-review-content").innerText(), /G\. Pulgar/);
    assert.match(await page.locator(".request-review-content").innerText(), /Second Student/);
    assert.match(await page.locator(".request-review-content").innerText(), /Multimeter/);
    assert.equal(await page.locator('input[name="approval-recipient"]').count(), 0);
    assert.equal(await submit().isDisabled(), true);
    await confirmation().check();
    assert.equal(await submit().isEnabled(), true);
    await page.getByRole("button", { name: "Edit schedule and room", exact: true }).click();
    await page.getByLabel(/^Assigned Class \/ Subject/).selectOption("circuits-analysis");
    await review();
    assert.equal(await confirmation().isChecked(), false);
    assert.match(await page.locator(".request-review-content").innerText(), /M\. Ordonez/);
    await page.screenshot({ path: path.join(root, "artifacts/request-review-desktop.png"), fullPage: true });
    await confirmation().check();
    await submit().click();
    await page.getByRole("heading", { name: "Demo Request Submitted" }).waitFor();
    assert.match(await page.locator(".request-demo-receipt").innerText(), /M\. Ordonez \(Faculty\)/);
    assert.equal(await confirmation().isDisabled(), true);
    assert.equal(await submit().count(), 0);

    // Student Only / Out-of-Schedule: no default reviewer, explicit Dean, mobile layout.
    await next("Create Another Request");
    await enterStudents("STUDENT_ONLY");
    await next("Next: Schedule Type");
    await page.locator('input[name="schedule-type"][value="OUT_OF_SCHEDULE"]').check();
    await next("Next: Schedule & Room");
    await page.getByLabel(/^Date Needed/).fill("2026-03-13");
    await page.getByLabel(/^Start Time/).fill("11:30");
    await page.getByLabel(/^End Time/).fill("12:30");
    await review();
    assert.equal(await page.locator('input[name="approval-recipient"]:checked').count(), 0);
    await confirmation().check();
    assert.equal(await submit().isDisabled(), true);
    await page.locator('input[name="approval-recipient"][value="DEAN"]').check();
    assert.equal(await confirmation().isChecked(), false);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Review does not overflow the mobile viewport.");
    await page.screenshot({ path: path.join(root, "artifacts/request-review-mobile.png"), fullPage: true });
    await confirmation().check();
    await submit().click();
    await page.getByRole("heading", { name: "Demo Request Submitted" }).waitFor();
    assert.match(await page.locator(".request-demo-receipt").innerText(), /Selected approver: Dean/);

    // Explicit Faculty remains supported for the same Out-of-Schedule time.
    await next("Create Another Request");
    await enterStudents("STUDENT_ONLY");
    await next("Next: Schedule Type");
    await page.locator('input[name="schedule-type"][value="OUT_OF_SCHEDULE"]').check();
    await next("Next: Schedule & Room");
    await page.getByLabel(/^Date Needed/).fill("2026-03-13");
    await page.getByLabel(/^Start Time/).fill("11:30");
    await page.getByLabel(/^End Time/).fill("12:30");
    await review();
    await page.locator('input[name="approval-recipient"][value="FACULTY"]').check();
    await confirmation().check();
    await submit().click();
    await page.getByRole("heading", { name: "Demo Request Submitted" }).waitFor();
    assert.match(await page.locator(".request-demo-receipt").innerText(), /G\. Pulgar \(Faculty\)/);
    await page.reload();
    await page.getByRole("heading", { name: "Choose Laboratory", exact: true }).waitFor();
    assert.deepEqual(pageErrors, []);
    console.log("Browser checks passed: six-step flow, On-Schedule Faculty, edits, items, Out-of-Schedule Dean/Faculty, confirmation, locked demo receipt, reset, reload, and mobile overflow.");
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
