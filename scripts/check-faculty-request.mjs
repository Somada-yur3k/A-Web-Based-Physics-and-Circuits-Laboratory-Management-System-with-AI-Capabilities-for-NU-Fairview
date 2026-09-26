import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requirePackage = createRequire(import.meta.url);
const loaded = new Map();
function loadSource(file) {
  const filename = resolve(root, file);
  if (loaded.has(filename)) return loaded.get(filename).exports;
  const module = { exports: {} };
  loaded.set(filename, module);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  function localRequire(name) {
    if (name.endsWith(".css")) return {};
    if (!name.startsWith(".") && !name.startsWith("@/")) return requirePackage(name);
    const target = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(filename), name);
    return loadSource(existsSync(target + ".ts") ? target + ".ts" : target + ".tsx");
  }
  new Function("exports", "require", "module", output)(module.exports, localRequire, module);
  return module.exports;
}
const { createScheduleDraft } = loadSource("src/features/lab-dashboard/room-availability.ts");
const { addCatalogItem } = loadSource("src/features/lab-dashboard/equipment-catalog.ts");
const { facultyRequestSteps, facultyApprovalRecipient, facultyRequestError, createFacultyDemoSnapshot } = loadSource("src/features/lab-dashboard/faculty-request-model.ts");
const Review = loadSource("src/features/lab-dashboard/faculty-request-review.tsx").default;
const render = (draft, locked = false) => renderToStaticMarkup(React.createElement(Review, { draft, confirmed: false, locked, onConfirmedChange() {}, onEdit() {} }));
const lab = { laboratory: "circuits", activityType: "LABORATORY_ACTIVITY", scheduleType: "ON_SCHEDULE", schedule: createScheduleDraft("circuits", "ON_SCHEDULE"), items: [], notes: "" };
const nonLab = { ...lab, activityType: "NON_LABORATORY_ACTIVITY" };
const out = { ...nonLab, scheduleType: "OUT_OF_SCHEDULE", schedule: { ...createScheduleDraft("circuits", "OUT_OF_SCHEDULE"), date: "2026-03-13", startTime: "11:30", endTime: "12:30" } };
assert.deepEqual(facultyRequestSteps(lab.activityType), ["laboratory", "activity", "schedule", "equipment", "review"]);
assert.equal(facultyRequestSteps(nonLab.activityType).length, 6);
for (const draft of [lab, nonLab]) {
  assert.equal(facultyRequestError(draft), null);
  assert.equal(facultyApprovalRecipient(draft), null);
  assert.equal(createFacultyDemoSnapshot(draft).status, "Awaiting Reservation");
  assert.ok(!render(draft).includes("Request Approval"));
  assert.match(render(draft), /does not require academic approval/);
}
assert.equal(facultyRequestError(out), null);
assert.equal(facultyApprovalRecipient(out), "DEAN");
assert.equal(createFacultyDemoSnapshot(out).status, "Pending Dean Approval");
assert.match(render(out), /For approval by: <strong>Dean/);
assert.ok(!render(out).includes('name="approval-recipient"'), "Faculty cannot choose a Faculty approver.");
assert.match(facultyRequestError({ ...out, activityType: "LABORATORY_ACTIVITY" }), /assigned class schedule/);
assert.throws(() => createFacultyDemoSnapshot({ ...out, activityType: "LABORATORY_ACTIVITY" }));
assert.match(facultyRequestError({ ...lab, activityType: null }), /activity type/);
assert.match(facultyRequestError({ ...lab, scheduleType: "UNKNOWN" }), /schedule type/);
assert.ok(facultyRequestError({ ...lab, schedule: { ...lab.schedule, startTime: "12:00" } }));
assert.ok(facultyRequestError({ ...lab, laboratory: "physics" }));
assert.equal(facultyRequestError({ ...lab, laboratory: "physics", schedule: createScheduleDraft("physics", "ON_SCHEDULE") }), null);
assert.match(facultyRequestError({ ...out, schedule: { ...out.schedule, date: "2026-03-14", startTime: "09:00", endTime: "11:00" } }), /pending/);
assert.ok(facultyRequestError({ ...lab, items: [{ rowId: 1, kind: "Equipment", name: "", quantity: 1 }] }));
const stockItems = addCatalogItem([], "power-supply", "circuits", 1);
assert.equal(facultyRequestError({ ...lab, items: stockItems }), null);
assert.throws(() => createFacultyDemoSnapshot({ ...out, items: [{ ...stockItems[0], quantity: 5 }] }), /up to 4/, "Dean routing cannot bypass stock validation.");
assert.ok(facultyRequestError({ ...lab, laboratory: "physics", schedule: createScheduleDraft("physics", "ON_SCHEDULE"), items: addCatalogItem([], "breadboard", "circuits", 1) }));
const item = { rowId: 1, kind: "Equipment", name: " Multimeter ", quantity: 2 };
const snapshot = createFacultyDemoSnapshot({ ...out, items: [item], notes: " Setup " });
assert.notEqual(snapshot.schedule, out.schedule);
assert.notEqual(snapshot.items[0], item);
assert.equal(snapshot.items[0].name, "Multimeter");
assert.equal(snapshot.notes, "Setup");
assert.match(render(snapshot, true), /type="checkbox" disabled/);
assert.ok(!render(lab).includes("Participating Students"));
console.log("Faculty request checks passed: both activity branches, three routes, validation, detached snapshots, and review rendering.");
