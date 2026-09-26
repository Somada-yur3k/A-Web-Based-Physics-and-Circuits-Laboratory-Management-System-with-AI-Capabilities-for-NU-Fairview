// Build first; PLAYWRIGHT_MODULE may point to an installed Playwright module.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'), base = 'http://localhost:3117';
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3117', '-H', 'localhost'], { cwd: root, stdio: 'ignore', windowsHide: true });
(async () => {
  let browser;
  try {
    for (let attempt = 0; ; attempt++) { try { if ((await fetch(base)).ok) break; } catch {} if (attempt > 100 || server.exitCode !== null) throw new Error('Staff workspace server unavailable'); await new Promise(resolve => setTimeout(resolve, 100)); }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const anonymous = await browser.newContext();
    assert.equal((await anonymous.request.get(base + '/api/demo/staff')).status(), 401);
    assert.equal((await anonymous.request.post(base + '/api/demo/staff', { data: {} })).status(), 401);
    const contexts = {};
    for (const [role, accountId, password] of [['physics', 'physics@nu-fairview.edu.ph', 'PhysicsDemo!2026'], ['circuits', 'circuits@nu-fairview.edu.ph', 'CircuitsDemo!2026'], ['classrep', '2024-1031816', 'ClassrepDemo!2026']]) {
      contexts[role] = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      assert.equal((await contexts[role].request.post(base + '/api/demo/login', { data: { accountId, password } })).status(), 200);
    }
    assert.equal((await contexts.classrep.request.get(base + '/api/demo/staff')).status(), 403);
    assert.equal((await contexts.classrep.request.post(base + '/api/demo/staff', { data: {} })).status(), 403);
    const validItem = { name: 'Staff API Test Item', category: 'Demo Test', kind: 'Equipment', unit: 'pcs', stock: 9, condition: 'Usable' };
    for (const laboratory of ['physics', 'circuits']) {
      const context = contexts[laboratory];
      const response = await context.request.get(base + '/api/demo/staff?laboratory=' + (laboratory === 'physics' ? 'circuits' : 'physics'));
      assert.equal(response.status(), 200); assert.match(response.headers()['cache-control'], /no-store/);
      const data = await response.json();
      assert.equal(data.laboratory, laboratory);
      assert.ok(data.inventory.length > 0 && data.inventory.every(item => item.laboratory === laboratory));
      assert.ok(data.slips.every(item => item.laboratory === laboratory));
      assert.ok(data.requests.every(item => item.snapshot.laboratory === laboratory));
      const other = laboratory === 'physics' ? 'circuits' : 'physics';
      const otherData = await (await contexts[other].request.get(base + '/api/demo/staff')).json();
      const foreignId = otherData.inventory[0].id;
      assert.equal((await context.request.patch(`${base}/api/demo/staff/inventory/${foreignId}`, { data: validItem })).status(), 404);
      assert.equal((await context.request.delete(`${base}/api/demo/staff/inventory/${foreignId}`)).status(), 404);
      assert.equal((await context.request.post(base + '/api/demo/staff', { headers: { Origin: 'https://example.invalid' }, data: validItem })).status(), 403);
      assert.equal((await context.request.post(base + '/api/demo/staff', { data: { ...validItem, stock: 1.5 } })).status(), 400);
      assert.equal((await context.request.post(base + '/api/demo/staff', { data: { ...validItem, stock: -1 } })).status(), 400);
      assert.equal((await context.request.post(base + '/api/demo/staff', { data: { ...validItem, condition: 'invalid' } })).status(), 400);
      const created = await context.request.post(base + '/api/demo/staff', { data: { ...validItem, laboratory: other } });
      assert.equal(created.status(), 201); const item = (await created.json()).item; assert.equal(item.laboratory, laboratory);
      assert.equal((await context.request.post(base + '/api/demo/staff', { data: validItem })).status(), 400);
      assert.equal((await context.request.delete(`${base}/api/demo/staff/inventory/${item.id}`)).status(), 200);
      assert.equal((await context.request.get(base + '/api/demo/requests')).status(), 200);
      const allRequests = (await (await context.request.get(base + '/api/demo/requests')).json()).requests;
      assert.ok(allRequests.every(item => item.snapshot.laboratory === laboratory));
      if (allRequests.length) assert.equal((await context.request.post(`${base}/api/demo/requests/${allRequests[0].reference}/decision`, { data: { decision: 'Approved', remarks: '' } })).status(), 403);
    }
    const references = {};
    for (const laboratory of ['physics', 'circuits']) {
      const schedule = laboratory === 'physics' ? { classId: 'physics-general', roomId: 'physics-201', requestFor: 'ONE_TIME', date: '2026-03-12', startTime: '08:00', endTime: '09:00' } : { classId: 'circuits-electronics', roomId: 'circuits-301', requestFor: 'ONE_TIME', date: '2026-03-13', startTime: '11:30', endTime: '12:30' };
      const response = await contexts.classrep.request.post(base + '/api/demo/requests', { data: { laboratory, scheduleType: 'OUT_OF_SCHEDULE', schedule, requestType: 'STUDENT_ONLY', students: [{ name: 'Staff Request Student', studentId: '2024-1031816' }], items: [], notes: 'Staff visibility test', approver: 'DEAN' } });
      assert.equal(response.status(), 201); references[laboratory] = (await response.json()).request.reference;
    }
    mkdirSync(path.join(root, 'artifacts/staff'), { recursive: true });
    const pages = {};
    for (const laboratory of ['physics', 'circuits']) {
      const page = await contexts[laboratory].newPage(), errors = [], label = laboratory === 'physics' ? 'Physics Laboratory' : 'Circuits Laboratory', dashboard = `/dashboard/${laboratory}-laboratory`;
      pages[laboratory] = page;
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + dashboard);
      await page.getByRole('heading', { name: label + ' Dashboard', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Refresh Data', exact: true }).waitFor();
      assert.equal(await page.locator('.admin-sidebar').count(), 1);
      assert.equal(await page.locator('main .dashboard-organizer').count(), 0);
      await page.goto(base + dashboard + '/manage-inventory');
      await page.locator('.staff-inventory-table tbody tr').first().waitFor();
      const excluded = laboratory === 'physics' ? 'Breadboard' : 'Vernier Caliper';
      await page.getByRole('searchbox').fill(excluded); await page.getByRole('heading', { name: 'No inventory items found' }).waitFor();
      await page.getByRole('searchbox').fill('');
      await page.getByRole('button', { name: 'Next page', exact: true }).click(); assert.match(await page.locator('.account-pagination').innerText(), /2 \/ 2/);
      await page.getByRole('button', { name: 'Add Inventory Item', exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Add Inventory Item', exact: true });
      const name = label + ' UI Test Item';
      await dialog.getByLabel('Item Name *', { exact: true }).fill(name);
      await dialog.getByLabel('Category *', { exact: true }).fill('Test Category');
      await dialog.getByLabel('Stock Quantity *', { exact: true }).fill('8');
      await dialog.getByRole('button', { name: 'Add Item', exact: true }).click();
      await page.getByRole('status').filter({ hasText: name + ' added' }).waitFor();
      await page.getByRole('searchbox').fill(name);
      assert.equal(await page.locator('.staff-inventory-table tbody tr').count(), 1);
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Edit Inventory Item', exact: true });
      await dialog.getByLabel('Stock Quantity *', { exact: true }).fill('3');
      await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await page.getByRole('status').filter({ hasText: name + ' updated' }).waitFor();
      await page.reload(); await page.getByRole('searchbox').fill(name);
      await page.getByRole('table').getByText('Low Stock', { exact: true }).waitFor();
      const other = laboratory === 'physics' ? 'circuits' : 'physics';
      assert.ok(!(await (await contexts[other].request.get(base + '/api/demo/staff')).json()).inventory.some(item => item.name === name));
      for (const width of [320, 390, 600, 768, 1024, 1440, 2560, 3440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${laboratory} inventory fits ${width}`);
        assert.ok((await page.locator('.staff-content').boundingBox()).width <= 1441);
      }
      await page.setViewportSize({ width: 390, height: 900 });
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Edit Inventory Item', exact: true });
      assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true);
      await page.screenshot({ path: path.join(root, `artifacts/staff/${laboratory}-inventory-edit-mobile.png`) });
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('button', { name: 'Delete ' + name, exact: true }).click();
      await page.getByRole('dialog', { name: 'Delete Inventory Item', exact: true }).getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal(await page.locator('.staff-inventory-table tbody tr').count(), 1);
      await page.getByRole('button', { name: 'Delete ' + name, exact: true }).click();
      await page.getByRole('dialog', { name: 'Delete Inventory Item', exact: true }).getByRole('button', { name: 'Delete Item', exact: true }).click();
      await page.getByRole('status').filter({ hasText: name + ' removed' }).waitFor();
      await page.goto(base + dashboard + '/borrowing-slip-records');
      await page.locator('.staff-table tbody tr').first().waitFor();
      await page.getByLabel('Filter by status').selectOption('Returned'); assert.equal(await page.locator('.staff-table tbody tr').count(), 1);
      await page.getByRole('button', { name: 'View Slip', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Borrowing Slip Record', exact: true });
      assert.match(await dialog.innerText(), /2024-1031817/); assert.match(await dialog.innerText(), new RegExp(label.replace('Laboratory', 'Lab Room')));
      assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true);
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await page.goto(base + dashboard + '/reservation-requests');
      await page.getByRole('searchbox').fill(references[laboratory]); await page.locator('.staff-table tbody tr').first().waitFor();
      assert.equal(await page.locator('.staff-table tbody tr').count(), 1);
      await page.getByRole('button', { name: 'View Request', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Laboratory Service Request', exact: true });
      assert.match(await dialog.innerText(), /Staff Request Student/); assert.match(await dialog.innerText(), new RegExp(label));
      assert.equal(await dialog.getByRole('button', { name: 'Approve Request' }).count(), 0);
      assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true);
      await dialog.getByRole('button', { name: 'Close review', exact: true }).click();
      await page.getByRole('searchbox').fill(references[other]); await page.getByRole('heading', { name: 'No reservation requests found' }).waitFor();
      for (const section of ['', '/manage-inventory', '/borrowing-slip-records', '/reservation-requests']) {
        await page.goto(base + dashboard + section); await page.getByRole('button', { name: section ? 'Refresh' : 'Refresh Data', exact: true }).waitFor();
        for (const width of [320, 600, 1024, 1440, 3440]) { await page.setViewportSize({ width, height: 1000 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${laboratory}${section} fits ${width}`); }
      }
      await page.goto(base + dashboard + '/manage-inventory'); await page.setViewportSize({ width: 1440, height: 1000 });
      await page.locator('.staff-table tbody tr').first().waitFor(); await page.screenshot({ path: path.join(root, `artifacts/staff/${laboratory}-inventory-desktop.png`), fullPage: true });
      await page.setViewportSize({ width: 390, height: 900 });
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
      await page.getByRole('dialog', { name: label + ' Staff navigation', exact: true }).getByRole('link', { name: 'Borrowing Slip Records', exact: true }).click();
      await page.waitForURL(base + dashboard + '/borrowing-slip-records');
      await page.goto(base + `/dashboard/${other}-laboratory/manage-inventory`); await page.waitForURL(base + dashboard);
      assert.deepEqual(errors, []);
    }
    for (const laboratory of ['physics', 'circuits']) {
      const page = pages[laboratory];
      await page.getByRole('button', { name: 'Open account menu', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Log-out', exact: true }).click(); await page.waitForURL(base + '/');
      assert.equal((await contexts[laboratory].request.get(base + '/api/demo/staff')).status(), 401);
    }
    console.log('Staff workspace checks passed: Headlab shell, laboratory data isolation, inventory CRUD/validation/persistence, borrowing records, submitted request visibility, mobile navigation, 320–3440px layouts, and logout.');
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
