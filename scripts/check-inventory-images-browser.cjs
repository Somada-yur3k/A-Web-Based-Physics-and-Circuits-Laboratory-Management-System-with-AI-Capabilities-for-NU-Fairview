// Build first. PLAYWRIGHT_MODULE may point to an installed Playwright module.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..'), base = 'http://localhost:3123';
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', '3123', '-H', 'localhost'], { cwd: root, stdio: 'ignore', windowsHide: true });
(async () => {
  let browser;
  try {
    for (let attempt = 0; ; attempt++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      if (attempt > 150 || server.exitCode !== null) throw new Error('Inventory test server unavailable');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const contexts = {};
    for (const [role, accountId, password] of [['headlab', 'headlab@nu-fairview.edu.ph', 'HeadlabDemo!2026'], ['physics', 'physics@nu-fairview.edu.ph', 'PhysicsDemo!2026'], ['circuits', 'circuits@nu-fairview.edu.ph', 'CircuitsDemo!2026'], ['faculty', 'faculty@nu-fairview.edu.ph', 'FacultyDemo!2026']]) {
      contexts[role] = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      assert.equal((await contexts[role].request.post(base + '/api/demo/login', { data: { accountId, password } })).status(), 200);
    }
    const anonymous = await browser.newContext();
    for (const method of ['get', 'post', 'patch', 'delete']) {
      const endpoint = method === 'get' || method === 'post' ? '/api/demo/inventory' : '/api/demo/inventory/physics-vernier-caliper';
      assert.equal((await anonymous.request[method](base + endpoint, { data: {} })).status(), 401);
      for (const role of ['physics', 'circuits', 'faculty']) assert.equal((await contexts[role].request[method](base + endpoint, { data: {} })).status(), 403);
    }
    const fixturePage = await anonymous.newPage();
    const images = await fixturePage.evaluate(() => ['#12398b', '#ffc624'].map(color => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0, 0, 96, 96);
      ctx.fillStyle = 'white'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('LAB', 27, 55);
      return canvas.toDataURL('image/png');
    }));
    const valid = { name: 'Shared Inventory Photo Test', category: 'Test Instruments', kind: 'Equipment', stock: 12, unit: 'pcs', condition: 'Usable', laboratory: 'physics', image: images[0] };
    const created = await contexts.headlab.request.post(base + '/api/demo/inventory', { data: valid });
    assert.equal(created.status(), 201); const sharedItem = (await created.json()).item;
    assert.equal((await contexts.headlab.request.post(base + '/api/demo/inventory', { data: { ...valid, name: 'Wrong lab', laboratory: 'invalid' } })).status(), 400);
    assert.equal((await contexts.headlab.request.post(base + '/api/demo/inventory', { headers: { Origin: 'https://example.invalid' }, data: valid })).status(), 403);
    assert.ok((await (await contexts.physics.request.get(base + '/api/demo/staff')).json()).inventory.some(item => item.id === sharedItem.id && item.image === images[0]));
    assert.ok(!(await (await contexts.circuits.request.get(base + '/api/demo/staff')).json()).inventory.some(item => item.id === sharedItem.id));
    const endpoint = base + '/api/demo/inventory/' + sharedItem.id;
    assert.equal((await contexts.headlab.request.patch(endpoint, { data: { ...valid, laboratory: 'circuits' } })).status(), 200);
    assert.equal((await (await contexts.headlab.request.get(base + '/api/demo/inventory')).json()).inventory.find(item => item.id === sharedItem.id).laboratory, 'physics');
    assert.equal((await contexts.circuits.request.patch(base + '/api/demo/staff/inventory/' + sharedItem.id, { data: valid })).status(), 404);
    for (const image of ['data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,dGVzdA==', 'https://example.invalid/photo.png', 42, images[0] + ' ', 'data:image/png;base64,' + Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64')]) {
      assert.equal((await contexts.headlab.request.patch(endpoint, { data: { ...valid, image } })).status(), 400);
    }
    const withoutImage = { ...valid }; delete withoutImage.image;
    assert.equal((await (await contexts.headlab.request.patch(endpoint, { data: withoutImage })).json()).item.image, images[0], 'Older clients preserve an existing photo');
    const otherFormats = await fixturePage.evaluate(() => ['image/jpeg', 'image/webp'].map(type => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 16;
      return canvas.toDataURL(type);
    }));
    for (const image of otherFormats) assert.equal((await contexts.headlab.request.patch(endpoint, { data: { ...valid, image } })).status(), 200);
    assert.equal((await contexts.headlab.request.delete(endpoint)).status(), 200);
    mkdirSync(path.join(root, 'artifacts/inventory'), { recursive: true });
    for (const role of ['headlab', 'physics', 'circuits']) {
      const context = contexts[role], page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const dashboard = role === 'headlab' ? '/dashboard/head-laboratory/inventory-overview' : '/dashboard/' + role + '-laboratory/manage-inventory';
      const api = role === 'headlab' ? '/api/demo/inventory' : '/api/demo/staff';
      const name = role === 'circuits' ? 'Breadboard' : 'Vernier Caliper';
      await page.goto(base + dashboard);
      await page.getByRole('searchbox').fill(name);
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).waitFor();
      const original = (await (await context.request.get(base + api)).json()).inventory.find(item => item.name === name);
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Edit Inventory Item', exact: true });
      assert.equal(await dialog.locator('.account-form-footer').count(), 1);
      assert.equal(await dialog.locator('.inventory-image-preview svg').count(), 1);
      await dialog.getByLabel('Item Image (Optional)', { exact: true }).setInputFiles({ name: 'invalid.png', mimeType: 'image/png', buffer: Buffer.from('invalid image') });
      await dialog.getByRole('alert').filter({ hasText: 'cannot be opened' }).waitFor();
      await dialog.getByLabel('Item Image (Optional)', { exact: true }).setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
      await dialog.getByRole('alert').filter({ hasText: 'Maximum 2 MB' }).waitFor();
      const upload = async image => {
        await dialog.getByLabel('Item Image (Optional)', { exact: true }).setInputFiles({ name: 'item-photo.png', mimeType: 'image/png', buffer: Buffer.from(image.split(',')[1], 'base64') });
        await dialog.locator('.inventory-image-preview img').waitFor();
        await dialog.getByRole('button', { name: 'Save Changes', exact: true }).waitFor();
        await page.waitForFunction(() => !document.querySelector('.inventory-dialog button[type=submit]').disabled);
      };
      await upload(images[0]);
      assert.equal(await dialog.locator('.inventory-image-preview img').getAttribute('src'), images[0]);
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal((await (await context.request.get(base + api)).json()).inventory.find(item => item.id === original.id).image ?? null, original.image ?? null, 'Cancel does not save an image');
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Edit Inventory Item', exact: true });
      await upload(images[0]);
      await dialog.getByLabel('Stock Quantity *', { exact: true }).fill('17');
      await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await page.getByRole('status').filter({ hasText: name + ' updated' }).waitFor();
      await page.reload(); await page.getByRole('searchbox').fill(name);
      await page.locator('.inventory-item-name img').waitFor();
      assert.equal(await page.locator('.inventory-item-name img').getAttribute('src'), images[0]);
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Edit Inventory Item', exact: true });
      await upload(images[1]);
      for (const width of [320, 390, 600, 768, 1024, 1440, 2560, 3440]) {
        await page.setViewportSize({ width, height: width < 600 ? 740 : 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, role + ' page fits ' + width);
        assert.equal(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), true, role + ' modal fits ' + width);
        const box = await dialog.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width && box.width <= 761 && box.y >= 0, role + ' modal bounded at ' + width);
        assert.ok((await page.locator('.staff-content').boundingBox()).width <= 1441);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: path.join(root, 'artifacts/inventory/' + role + '-edit-desktop.png') });
      await page.setViewportSize({ width: 390, height: 844 });
      await dialog.getByRole('button', { name: 'Save Changes', exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(root, 'artifacts/inventory/' + role + '-edit-mobile.png') });
      await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await page.getByRole('status').filter({ hasText: name + ' updated' }).waitFor();
      const saved = (await (await context.request.get(base + api)).json()).inventory.find(item => item.id === original.id);
      assert.equal(saved.image, images[1]); assert.equal(saved.stock, 17);
      const shared = (await (await contexts.headlab.request.get(base + '/api/demo/inventory')).json()).inventory.find(item => item.id === original.id);
      assert.equal(shared.image, images[1]);
      if (role === 'headlab') assert.equal((await (await contexts.physics.request.get(base + '/api/demo/staff')).json()).inventory.find(item => item.id === original.id).image, images[1]);
      await page.getByRole('button', { name: 'Edit ' + name, exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Edit Inventory Item', exact: true });
      await dialog.getByRole('button', { name: 'Remove Image', exact: true }).click();
      assert.equal(await dialog.locator('.inventory-image-preview svg').count(), 1);
      await dialog.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await page.getByRole('status').filter({ hasText: name + ' updated' }).waitFor();
      assert.equal((await (await context.request.get(base + api)).json()).inventory.find(item => item.id === original.id).image, null);
      const mutation = role === 'headlab' ? '/api/demo/inventory/' : '/api/demo/staff/inventory/';
      assert.equal((await context.request.patch(base + mutation + original.id, { data: original })).status(), 200);
      assert.deepEqual(errors, []);
      await page.goto(base + dashboard); await page.setViewportSize({ width: 320, height: 740 });
      await page.locator('.staff-inventory-table tbody tr').first().waitFor();
      if (role === 'headlab') {
        await page.getByLabel('Filter by laboratory').selectOption('circuits');
        assert.ok((await page.locator('td[data-label=Laboratory]').allTextContents()).every(label => label === 'Circuits Laboratory'));
        await page.getByRole('button', { name: 'Add Inventory Item', exact: true }).click();
        dialog = page.getByRole('dialog', { name: 'Add Inventory Item', exact: true });
        await dialog.getByLabel('Item Name *', { exact: true }).fill('Headlab Image Item');
        await dialog.getByLabel('Category *', { exact: true }).fill('Instruments');
        await dialog.getByLabel('Laboratory *', { exact: true }).selectOption('physics');
        await dialog.getByLabel('Item Image (Optional)', { exact: true }).setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: Buffer.from(images[0].split(',')[1], 'base64') });
        await dialog.locator('.inventory-image-preview img').waitFor();
        await page.waitForFunction(() => !document.querySelector('.inventory-dialog button[type=submit]').disabled);
        await dialog.getByRole('button', { name: 'Add Item', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Headlab Image Item added' }).waitFor();
        assert.equal(await page.getByLabel('Filter by laboratory').inputValue(), 'physics');
        await page.getByRole('searchbox').fill('Headlab Image Item');
        assert.equal(await page.locator('.inventory-item-name img').getAttribute('src'), images[0]);
        assert.ok((await (await contexts.physics.request.get(base + '/api/demo/staff')).json()).inventory.some(item => item.name === 'Headlab Image Item'));
        await page.getByRole('button', { name: 'Delete Headlab Image Item', exact: true }).click();
        await page.getByRole('dialog', { name: 'Delete Inventory Item', exact: true }).getByRole('button', { name: 'Cancel', exact: true }).click();
        await page.getByRole('button', { name: 'Delete Headlab Image Item', exact: true }).click();
        await page.getByRole('dialog', { name: 'Delete Inventory Item', exact: true }).getByRole('button', { name: 'Delete Item', exact: true }).click();
        await page.getByRole('status').filter({ hasText: 'Headlab Image Item removed' }).waitFor();
        assert.ok(!(await (await contexts.physics.request.get(base + '/api/demo/staff')).json()).inventory.some(item => item.name === 'Headlab Image Item'));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    console.log('Inventory checks passed: Headlab and both staff editors, photo upload/replacement/removal/cancel/reload, shared updates, PNG/JPEG/WebP validation, authorization and lab isolation, 320-3440px layouts.');
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
