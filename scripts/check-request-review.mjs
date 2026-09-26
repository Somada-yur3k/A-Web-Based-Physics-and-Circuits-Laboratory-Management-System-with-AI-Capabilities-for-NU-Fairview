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
const { addCatalogItem, itemsForLaboratory } = loadSource("src/features/lab-dashboard/equipment-catalog.ts");
const { approvalRecipient, requestedItemsError, serviceRequestError, createDemoRequestSnapshot } = loadSource("src/features/lab-dashboard/request-review.ts");
const draft = {
  laboratory: "circuits", requestType: "GROUP", students: [{ name: " Demo Student ", studentId: " 2024-1031816 " }],
  scheduleType: "ON_SCHEDULE", schedule: createScheduleDraft("circuits", "ON_SCHEDULE"),
  items: [], notes: "", approver: null,
};
assert.equal(serviceRequestError(draft), null);
assert.deepEqual(approvalRecipient(draft), { role: "FACULTY", name: "G. Pulgar" });
assert.deepEqual(approvalRecipient({ ...draft, approver: "DEAN" }), { role: "FACULTY", name: "G. Pulgar" }, "An old Dean choice cannot change the On-Schedule recipient.");
assert.deepEqual(approvalRecipient({ ...draft, schedule: createScheduleDraft("circuits", "ON_SCHEDULE", undefined, "circuits-analysis") }), { role: "FACULTY", name: "M. Ordonez" }, "Faculty follows the selected subject.");
assert.deepEqual(approvalRecipient({ ...draft, laboratory: "physics", schedule: createScheduleDraft("physics", "ON_SCHEDULE") }), { role: "FACULTY", name: "R. Bautista" });
const out = { ...draft, scheduleType: "OUT_OF_SCHEDULE", schedule: { ...createScheduleDraft("circuits", "OUT_OF_SCHEDULE"), date: "2026-03-13", startTime: "11:30", endTime: "12:30" } };
assert.equal(approvalRecipient(out), null);
assert.match(serviceRequestError(out), /Choose Faculty or Dean/);
assert.equal(serviceRequestError({ ...out, approver: "FACULTY" }), null);
assert.equal(serviceRequestError({ ...out, approver: "DEAN" }), null);
assert.deepEqual(approvalRecipient({ ...out, approver: "FACULTY" }), { role: "FACULTY", name: "G. Pulgar" });
assert.deepEqual(approvalRecipient({ ...out, approver: "DEAN" }), { role: "DEAN", name: "Dean" });
assert.match(serviceRequestError({ ...draft, students: [] }), /student names/);
assert.match(serviceRequestError({ ...draft, requestType: "STUDENT_ONLY", students: [...draft.students, { name: "Other", studentId: "2024-1234567" }] }), /student names/);
assert.match(serviceRequestError({ ...draft, students: [...draft.students, ...draft.students] }), /unique NU/);
assert.match(serviceRequestError({ ...out, approver: "DEAN", schedule: { ...out.schedule, date: "2026-03-14", startTime: "09:00", endTime: "11:00" } }), /pending/, "Choosing Dean cannot bypass availability validation.");
assert.equal(approvalRecipient({ ...draft, laboratory: "physics" }), null, "Mismatched subjects cannot resolve a reviewer.");
assert.match(serviceRequestError({ ...draft, scheduleType: "unknown" }), /schedule type/);
assert.equal(requestedItemsError([], ""), null, "Equipment is optional.");
const item = { rowId: 1, kind: "Equipment", name: " Multimeter ", quantity: 2 };
assert.equal(requestedItemsError([item], "Setup"), null);
for (const quantity of [0, -1, 1.5, 1000, NaN, Infinity]) assert.ok(requestedItemsError([{ ...item, quantity }], ""));
assert.ok(requestedItemsError([{ ...item, name: " " }], ""));
assert.ok(requestedItemsError([{ ...item, kind: "unknown" }], ""));
assert.ok(requestedItemsError([item], "x".repeat(1001)));
const catalogItems = addCatalogItem([], "breadboard", "circuits", 1);
assert.equal(requestedItemsError(catalogItems, "", "circuits"), null);
assert.equal(addCatalogItem(catalogItems, "breadboard", "circuits", 2).length, 1);
assert.equal(addCatalogItem(catalogItems, "breadboard", "circuits", 2)[0].quantity, 2);
assert.equal(addCatalogItem([], "oscilloscope", "circuits", 1).length, 0, "Unavailable items cannot be added.");
assert.equal(addCatalogItem([], "breadboard", "physics", 1).length, 0, "Cannot add another lab's catalogue item.");
assert.equal(addCatalogItem([{ ...catalogItems[0], quantity: 12 }], "breadboard", "circuits", 2)[0].quantity, 12);
assert.match(requestedItemsError([{ ...catalogItems[0], quantity: 13 }], "", "circuits"), /up to 12/);
assert.ok(requestedItemsError(catalogItems, "", "physics"));
assert.ok(requestedItemsError([...catalogItems, { ...catalogItems[0], rowId: 2 }], "", "circuits"));
assert.ok(requestedItemsError([{ ...catalogItems[0], name: "Different name" }], "", "circuits"));
assert.ok(requestedItemsError([{ ...catalogItems[0], catalogId: "unknown" }], "", "circuits"));
assert.equal(itemsForLaboratory(catalogItems, "physics").length, 0);
assert.equal(itemsForLaboratory([...catalogItems, item], "physics").length, 1, "Custom items survive a laboratory change.");
assert.equal(itemsForLaboratory(addCatalogItem(catalogItems, "multimeter", "circuits", 2), "physics")[0].catalogId, "multimeter", "Shared equipment survives a lab change.");
assert.throws(() => createDemoRequestSnapshot({ ...draft, items: [{ ...catalogItems[0], quantity: 13 }] }), /up to 12/);
assert.throws(() => createDemoRequestSnapshot(out), /Choose Faculty or Dean/);
const snapshot = createDemoRequestSnapshot({ ...draft, items: [item], notes: " Setup " });
assert.deepEqual(snapshot.students, [{ name: "Demo Student", studentId: "2024-1031816" }]);
assert.equal(snapshot.notes, "Setup");
assert.equal(snapshot.items[0].name, "Multimeter");
assert.equal(snapshot.approver, "FACULTY");
assert.notEqual(snapshot.schedule, draft.schedule);
assert.notEqual(snapshot.students[0], draft.students[0]);
assert.notEqual(snapshot.items[0], item);
assert.equal(createDemoRequestSnapshot({ ...out, approver: "DEAN" }).recipient.role, "DEAN");

const Component = loadSource("src/features/lab-dashboard/request-information-review.tsx").default;
const render = (reviewDraft, locked = false) => renderToStaticMarkup(React.createElement(Component, { draft: reviewDraft, confirmed: false, locked, onApproverChange() {}, onConfirmedChange() {}, onEdit() {} }));
const onHtml = render(draft);
assert.match(onHtml, /G\. Pulgar/);
assert.match(onHtml, /2024-1031816/);
assert.match(onHtml, /Circuits Lab Room 301/);
assert.match(onHtml, /1:00 PM – 4:00 PM/);
assert.match(onHtml, /BSIT 2A/);
assert.ok(!onHtml.includes('name="approval-recipient"'), "On-Schedule does not offer a Dean override.");
const outHtml = render(out);
assert.equal([...outHtml.matchAll(/name="approval-recipient"/g)].length, 2);
assert.ok(!/<input[^>]*name="approval-recipient"[^>]*checked/.test(outHtml), "Out-of-Schedule requires an explicit selection.");
assert.match(render({ ...out, approver: "DEAN" }), /For approval by: <strong>Dean/);
assert.match(render(draft, true), /type="checkbox" disabled/);
assert.match(render({ ...draft, students: [{ name: "<script>test</script>", studentId: "2024-1031816" }] }), /&lt;script&gt;/, "Names are rendered as text.");
assert.match(render({ ...draft, items: catalogItems }), /Breadboard/);
assert.match(render({ ...draft, items: catalogItems }), /1 pcs/);
console.log("Request review checks passed: assigned Faculty, explicit Out-of-Schedule recipients, submission validation, immutable snapshots, and review rendering.");
