// Build first. PLAYWRIGHT_MODULE may point to an installed Playwright module.
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdirSync } = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(__dirname, "..");
const base = "http://localhost:3114";
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", "3114", "-H", "localhost"], { cwd: root, stdio: "ignore", windowsHide: true });
(async () => {
  let browser;
  try {
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      if (attempt > 100 || server.exitCode !== null) throw new Error("Test server unavailable");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ channel: "msedge", headless: true });
    mkdirSync(path.join(root, "artifacts/equipment"), { recursive: true });
    for (const role of ["classrep", "faculty"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const login = await context.request.post(`${base}/api/demo/login`, { data: { accountId: role === "classrep" ? "2024-1031816" : "faculty@nu-fairview.edu.ph", password: role === "classrep" ? "ClassrepDemo!2026" : "FacultyDemo!2026" } });
      assert.equal(login.status(), 200);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/dashboard/${role}/service-request`);
      const next = () => page.locator(".request-next-button").click();
      async function capture(name, width = 1440) {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
        await page.evaluate(() => { document.querySelector(".equipment-catalog-grid")?.scrollTo(0, 0); window.scrollTo({ top: 0, behavior: "instant" }); });
        await page.waitForTimeout(400); // Let the sidebar/progress transition settle for screenshots.
        await page.screenshot({ path: path.join(root, `artifacts/equipment/${role}-${name}.png`), fullPage: true });
      }
      async function responsive() {
        for (const width of [320, 390, 650, 768, 860, 900, 1024, 1440, 1920, 2560, 3440]) {
          await page.setViewportSize({ width, height: 1000 });
          const sizes = await page.evaluate(() => {
            const main = document.querySelector(".classrep-request-page").getBoundingClientRect();
            const cards = [...document.querySelectorAll(".request-laboratory-panel,.request-laboratory-option,.request-type-option,.request-student-row,.request-schedule-fields,.request-availability-panel,.equipment-catalog-card,.equipment-request-list,.equipment-selected-item,.equipment-additional,.request-review-card,.review-equipment-list > li")].map((element) => {
              const rect = element.getBoundingClientRect();
              return { className: element.className, left: rect.left, right: rect.right, scroll: element.scrollWidth, client: element.clientWidth };
            });
            return { width: main.width, left: main.left, right: main.right, root: document.documentElement.scrollWidth, cards };
          });
          const label = `${role}: ${await page.locator("#request-step-title").innerText()} at ${width}px`;
          assert.ok(sizes.root <= width + 1, `${label}: page overflow`);
          assert.ok(sizes.width <= 1121, `${label}: oversized main`);
          assert.equal(await page.locator(".request-steps > li[aria-current=step]").evaluate((element) => {
            const item = element.getBoundingClientRect(), nav = element.closest("nav").getBoundingClientRect();
            return item.left >= nav.left - 2 && item.right <= nav.right + 2;
          }), true, `${label}: current progress step stays visible`);
          for (const card of sizes.cards) {
            assert.ok(card.left >= sizes.left - 1 && card.right <= sizes.right + 1, `${label}: card exceeds page ${JSON.stringify(card)}`);
            assert.ok(card.scroll <= card.client + 2, `${label}: card content spills ${JSON.stringify(card)}`);
          }
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      await responsive(); await next();
      if (role === "classrep") {
        await page.locator('input[name="request-type"][value="GROUP"]').check();
        await page.getByLabel(/^Student Name/).fill("Catalogue Test Student");
        await page.getByLabel(/^NU Student ID/).fill("2024-1031816");
        await responsive(); await next(); await responsive(); await next();
      } else {
        await page.locator('input[name="activity-type"][value="LABORATORY_ACTIVITY"]').check();
        await responsive(); await next();
      }
      await responsive(); await next();
      assert.equal(await page.locator("#request-step-title").innerText(), "Equipment & Materials");
      assert.equal(await page.getByRole("button", { name: "Add Oscilloscope", exact: true }).isDisabled(), true);
      await page.getByLabel("Search equipment and materials", { exact: true }).fill("bread");
      assert.equal(await page.locator(".equipment-catalog-card").count(), 1);
      await page.getByRole("button", { name: "Add Breadboard", exact: true }).click();
      await page.getByRole("button", { name: "Add Breadboard", exact: true }).click();
      assert.equal(await page.locator(".equipment-selected-item").count(), 1);
      assert.equal(await page.getByLabel("Quantity for Breadboard").inputValue(), "2");
      await page.getByLabel("Item category", { exact: true }).selectOption("Electronic Components");
      assert.equal(await page.locator(".equipment-catalog-card").count(), 0);
      assert.equal(await page.locator(".equipment-selected-item").count(), 1, "Filters do not clear the request list");
      await page.getByRole("button", { name: "Clear filters", exact: true }).click();
      await page.getByRole("button", { name: "Add Multimeter", exact: true }).click();
      await page.getByLabel("Quantity for Multimeter").fill("3");
      await page.getByLabel("Quantity for Breadboard").fill("13");
      assert.equal(await page.locator(".request-next-button").isDisabled(), true);
      assert.equal(await page.getByRole("button", { name: "Add Breadboard", exact: true }).isDisabled(), true);
      await page.getByLabel("Quantity for Breadboard").fill("");
      assert.equal(await page.locator(".request-next-button").isDisabled(), true);
      await page.getByLabel("Quantity for Breadboard").fill("2");
      await page.getByRole("button", { name: "Add DC Motor", exact: true }).click();
      await page.getByRole("button", { name: "Remove DC Motor", exact: true }).click();
      await page.getByRole("button", { name: "+ Add Equipment / Material", exact: true }).click();
      assert.equal(await page.locator(".request-next-button").isDisabled(), true);
      await page.getByLabel(/^Item Name/).fill("Lab worksheets");
      await page.locator(".request-item-row select").selectOption("Material");
      await page.locator(".request-item-row input[type=number]").fill("5");
      await page.getByLabel(/^Notes \/ Special Setup/).fill("Set up one bench for the activity.");
      await responsive();
      await capture("catalog-desktop");
      await capture("catalog-mobile", 390);
      await next(); await responsive();
      assert.match(await page.locator(".request-review-content").innerText(), /Breadboard/);
      assert.match(await page.locator(".request-review-content").innerText(), /3 pcs/);
      assert.match(await page.locator(".request-review-content").innerText(), /Lab worksheets/);
      if (role === "classrep") assert.match(await page.locator(".request-review-approval").innerText(), /G\. Pulgar/);
      else assert.equal(await page.getByRole("heading", { name: "Request Approval", exact: true }).count(), 0);
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Edit equipment and materials", exact: true }).click();
      assert.equal(await page.getByLabel("Quantity for Breadboard").inputValue(), "2");
      await next(); assert.equal(await page.getByRole("checkbox").isChecked(), false);
      // Switching lab removes incompatible catalogue items and keeps shared/custom entries.
      await page.getByRole("button", { name: "Edit laboratory", exact: true }).click();
      await page.locator('input[name="laboratory"][value="physics"]').check();
      await next(); await next(); if (role === "classrep") await next();
      await next();
      assert.equal(await page.getByRole("button", { name: "Add Breadboard", exact: true }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Add Vernier Caliper", exact: true }).count(), 1);
      assert.equal(await page.getByLabel("Quantity for Multimeter").inputValue(), "3");
      assert.equal(await page.getByLabel(/^Item Name/).inputValue(), "Lab worksheets");
      await next();
      // Both accounts retain the last-step approval rules for an Out-of-Schedule draft.
      if (role === "faculty") {
        await page.getByRole("button", { name: "Edit activity type", exact: true }).click();
        await page.locator('input[name="activity-type"][value="NON_LABORATORY_ACTIVITY"]').check();
        await next();
      } else await page.getByRole("button", { name: "Edit schedule type", exact: true }).click();
      await page.locator('input[name="schedule-type"][value="OUT_OF_SCHEDULE"]').check();
      await responsive(); await next();
      await page.getByLabel(/^Date Needed/).fill("2026-03-12");
      await page.getByLabel(/^Start Time/).fill("08:00");
      await page.getByLabel(/^End Time/).fill("09:00");
      await next(); await next();
      if (role === "classrep") {
        assert.equal(await page.locator('input[name="approval-recipient"]:checked').count(), 0);
        await page.getByRole("checkbox").check(); assert.equal(await page.locator(".request-next-button").isDisabled(), true);
        await page.locator('input[name="approval-recipient"][value="FACULTY"]').check();
        assert.match(await page.locator(".request-review-recipient").innerText(), /R\. Bautista/);
        await page.locator('input[name="approval-recipient"][value="DEAN"]').check();
        assert.equal(await page.getByRole("checkbox").isChecked(), false);
      } else {
        assert.equal(await page.locator('input[name="approval-recipient"]').count(), 0);
        assert.match(await page.locator(".request-review-approval").innerText(), /Dean/);
      }
      await responsive(); await capture("review-mobile", 390);
      await page.getByRole("checkbox").check(); await next();
      assert.equal(await page.getByRole("checkbox").isDisabled(), true);
      assert.match(await page.locator(".request-demo-receipt").innerText(), /Dean/);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log("Catalogue browser checks passed: both roles, filters, duplicate adds, quantities, stock limits, removals, lab switching, review routing, locked submission, and all steps at 320–3440px.");
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
