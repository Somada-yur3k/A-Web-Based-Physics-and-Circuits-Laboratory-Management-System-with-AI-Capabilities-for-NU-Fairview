import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.DEMO_BASE_URL ?? "http://localhost:3000";
const document = await readFile(new URL("../DEMO-ACCOUNTS.md", import.meta.url), "utf8");
const sessions = {};
const pending = new Set();
async function request(role, path, method = "GET", body) {
  const response = await fetch(`${base}/api/demo/${path}`, {
    method, redirect: "manual",
    headers: { "Content-Type": "application/json", ...(sessions[role] ? { Cookie: sessions[role] } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response;
}
async function ok(role, path, method, body) {
  const response = await request(role, path, method, body);
  assert.ok(response.ok, `${role} ${method ?? "GET"} ${path}: ${response.status}`);
  return response.json();
}
try {
  for (const [role, label] of [["headlab", "Head Laboratory / Admin"], ["physics", "Physics Laboratory Staff"], ["circuits", "Circuits Laboratory Staff"]]) {
    const row = document.split("\n").find(line => line.startsWith(`| ${label} |`));
    const [, accountId, password] = row.split("|").slice(1, -1).map(cell => cell.trim().replaceAll("`", ""));
    const response = await request(role, "login", "POST", { accountId, password });
    assert.equal(response.status, 200);
    sessions[role] = response.headers.get("set-cookie").split(";")[0];
  }
  const original = (await ok("headlab", "inventory")).inventory;
  assert.ok(original.length > 0);
  for (const [index, source] of original.entries()) {
    const role = source.laboratory;
    const other = role === "physics" ? "circuits" : "physics";
    // Exercise every item's field values on disposable copies, preserving real records.
    for (const deletingRole of [role, "headlab"]) {
      const input = { ...source, name: `Inventory check ${Date.now()} ${index} ${deletingRole}` };
      const { item } = await ok(role, "staff", "POST", input);
      pending.add(item.id);
      const staffPath = `staff/inventory/${item.id}`;
      const headPath = `inventory/${item.id}`;
      for (const method of ["PATCH", "DELETE"]) {
        assert.equal((await request(other, staffPath, method, method === "PATCH" ? input : undefined)).status, 404);
      }
      await ok(role, staffPath, "PATCH", { ...input, stock: 17, condition: "Maintenance" });
      let shared = (await ok("headlab", "inventory")).inventory.find(entry => entry.id === item.id);
      assert.equal(shared.stock, 17);
      assert.equal(shared.condition, "Maintenance");
      await ok("headlab", headPath, "PATCH", { ...input, stock: 19, condition: "Usable" });
      shared = (await ok(role, "staff")).inventory.find(entry => entry.id === item.id);
      assert.equal(shared.stock, 19);
      assert.equal(shared.condition, "Usable");
      await ok(deletingRole, deletingRole === "headlab" ? headPath : staffPath, "DELETE");
      pending.delete(item.id);
      assert.ok(!(await ok(role, "staff")).inventory.some(entry => entry.id === item.id));
      assert.ok(!(await ok("headlab", "inventory")).inventory.some(entry => entry.id === item.id));
    }
  }
  assert.deepEqual((await ok("headlab", "inventory")).inventory, original, "Original inventory is unchanged.");
  console.log(`PASS: ${original.length} item templates support staff/headlab edits and deletes, shared updates, and laboratory isolation. Original records preserved.`);
} finally {
  for (const id of pending) await request("headlab", `inventory/${id}`, "DELETE");
  for (const role of Object.keys(sessions)) await request(role, "logout", "POST");
}
