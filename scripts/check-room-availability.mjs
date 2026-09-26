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

const model = loadSource("src/features/lab-dashboard/room-availability.ts");
const { createScheduleDraft, scheduleDraftError, roomBlocksForDate, demoOtherRequests, laboratoryRooms, addDateDays, weekStart, parseDate, rangesOverlap } = model;
const on = createScheduleDraft("circuits", "ON_SCHEDULE");
const out = createScheduleDraft("circuits", "OUT_OF_SCHEDULE");
const validateOut = (patch) => scheduleDraftError("circuits", "OUT_OF_SCHEDULE", { ...out, ...patch });

assert.equal(on.roomId, "circuits-301");
assert.equal(on.date, "2026-03-10");
assert.equal(on.startTime, "13:00");
assert.equal(on.endTime, "16:00");
assert.equal(scheduleDraftError("circuits", "ON_SCHEDULE", on), null, "The assigned regular block is eligible.");
assert.notEqual(scheduleDraftError("circuits", "ON_SCHEDULE", { ...on, roomId: "circuits-302" }), null);
assert.notEqual(scheduleDraftError("circuits", "ON_SCHEDULE", { ...on, date: "2026-03-11" }), null);
assert.notEqual(scheduleDraftError("circuits", "ON_SCHEDULE", { ...on, startTime: "12:30" }), null);
assert.equal(scheduleDraftError("physics", "ON_SCHEDULE", createScheduleDraft("physics", "ON_SCHEDULE")), null);
assert.equal(weekStart("2026-03-14"), "2026-03-09");
assert.equal(weekStart("2026-03-15"), "2026-03-09");
assert.equal(weekStart("2026-04-01"), "2026-03-30");
assert.equal(addDateDays("2026-03-09", 7), "2026-03-16");
assert.equal(parseDate("2026-02-30"), null);

const free = { date: "2026-03-13", startTime: "11:30", endTime: "12:30" };
assert.equal(validateOut(free), null, "A vacant range is eligible, including a boundary next to an existing request.");
assert.match(validateOut({ date: "2026-03-14", startTime: "09:00", endTime: "11:00" }), /pending/);
assert.match(validateOut({ date: "2026-03-13", startTime: "10:00", endTime: "11:00" }), /approved/);
assert.match(validateOut({ date: "2026-03-09", startTime: "13:00", endTime: "14:00" }), /regular class schedule/);
assert.match(validateOut({ date: "2026-03-10", roomId: "circuits-302", startTime: "13:00", endTime: "14:00" }), /outside your assigned class schedule/, "Moving rooms does not bypass the class's regular schedule.");
assert.match(validateOut({ ...free, startTime: "10:30" }), /approved/, "Extending through a held block is rejected.");
assert.match(validateOut({ ...free, startTime: "11:35" }), /30-minute/);
assert.match(validateOut({ ...free, startTime: "12:30", endTime: "12:30" }), /later/);
assert.match(validateOut({ ...free, startTime: "06:30", endTime: "07:00" }), /7:00/);
assert.match(validateOut({ ...free, startTime: "16:30", endTime: "17:30" }), /5:00/);
assert.equal(validateOut({ date: "2026-03-14", startTime: "16:30", endTime: "17:00" }), null);
assert.match(validateOut({ ...free, date: "2026-03-15" }), /Monday to Saturday/);
assert.match(validateOut({ ...free, date: "2026-02-30" }), /valid date/);
assert.match(validateOut({ ...free, roomId: "physics-201" }), /selected laboratory/);
assert.match(validateOut({ ...free, classId: "physics-general" }), /assigned class/);

const regularWeek1 = roomBlocksForDate("circuits-301", "2026-03-10").filter((block) => block.kind === "laboratory" || block.kind === "lecture");
const regularWeek2 = roomBlocksForDate("circuits-301", "2026-03-17").filter((block) => block.kind === "laboratory" || block.kind === "lecture");
assert.deepEqual(regularWeek1.map(({ id, start, end }) => ({ id, start, end })), regularWeek2.map(({ id, start, end }) => ({ id, start, end })), "Regular schedules recur weekly.");
assert.ok(roomBlocksForDate("circuits-301", "2026-03-14").some((block) => block.reference === "CIR-2026-019"));
assert.ok(!roomBlocksForDate("circuits-301", "2026-03-21").some((block) => block.reference === "CIR-2026-019"), "Dated requests do not recur automatically.");
for (const request of demoOtherRequests) {
  assert.ok(roomBlocksForDate(request.roomId, request.date).some((block) => block.id === request.id));
  for (const room of laboratoryRooms.filter((room) => room.id !== request.roomId)) assert.ok(!roomBlocksForDate(room.id, request.date).some((block) => block.id === request.id));
}
for (const room of laboratoryRooms) {
  for (let day = 0; day < 14; day++) {
    const blocks = roomBlocksForDate(room.id, addDateDays("2026-03-09", day));
    for (const block of blocks) assert.ok(block.start >= 420 && block.end <= 1020 && block.start < block.end && block.start % 30 === 0 && block.end % 30 === 0);
    for (let index = 1; index < blocks.length; index++) assert.equal(rangesOverlap(blocks[index - 1].start, blocks[index - 1].end, blocks[index].start, blocks[index].end), false, "Sample blocks must not hide each other in merged calendar cells.");
  }
}
const holdOnOwnBlock = { id: "test-held-block", roomId: on.roomId, date: on.date, start: 780, end: 960, kind: "pending", title: "Pending", section: "BSIT 2A", reference: "TEST-HOLD" };
assert.match(scheduleDraftError("circuits", "ON_SCHEDULE", on, [...roomBlocksForDate(on.roomId, on.date), holdOnOwnBlock]), /pending/, "The own-class exception does not bypass an existing hold.");

const Component = loadSource("src/features/lab-dashboard/request-room-availability.tsx").default;
const render = (scheduleType, draft) => renderToStaticMarkup(React.createElement(Component, { laboratory: "circuits", scheduleType, draft, onChange() {} }));
const onHtml = render("ON_SCHEDULE", on);
assert.match(onHtml, /Room Availability/);
assert.match(onHtml, /CIR-2026-019/);
assert.match(onHtml, /CIR-2026-018/);
assert.match(onHtml, /aria-label="Previous week"/);
assert.match(onHtml, /aria-label="Next week"/);
assert.match(onHtml, /<td[^>]*rowSpan="6"[^>]*class="availability-selection"/i);
const outHtml = render("OUT_OF_SCHEDULE", { ...out, ...free });
assert.match(outHtml, /<td[^>]*class="availability-selection"/);
assert.ok([...outHtml.matchAll(/<button[^>]*class="availability-slot"[^>]*>/g)].some(([button]) => !button.includes("disabled")), "Vacant eligible slots are selectable in Out-of-Schedule mode.");
const busyHtml = render("OUT_OF_SCHEDULE", { ...out, date: "2026-03-14", startTime: "09:00", endTime: "11:00" });
assert.ok(!/<td[^>]*class="availability-selection"/.test(busyHtml), "Invalid ranges never paint over existing requests.");
console.log("Room availability checks passed: weekly schedules, dated pending/approved requests, room isolation, time conflicts, On-/Out-of-Schedule rules, and calendar rendering.");
