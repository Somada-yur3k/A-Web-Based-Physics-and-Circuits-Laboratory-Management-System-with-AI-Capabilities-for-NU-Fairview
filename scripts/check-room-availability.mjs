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
const { initialOfficialBlocks } = loadSource("src/features/lab-dashboard/official-schedule-data.ts");
const { calendarBlocks, createScheduleDraft, scheduleDraftError, roomBlocksForDate, classesForOfficialBlocks, laboratoryRooms, addDateDays, rangesOverlap } = model;
assert.deepEqual(laboratoryRooms.map((room) => room.id), ["circuits-301", "physics-201", "physics-202"]);
assert.equal(initialOfficialBlocks.length, 37);
for (const room of laboratoryRooms) for (let weekday = 1; weekday <= 6; weekday++) {
  const blocks = initialOfficialBlocks.filter((block) => block.roomId === room.id && block.weekday === weekday).sort((a, b) => a.start - b.start);
  for (const block of blocks) assert.ok(block.start >= 420 && block.end <= 1260 && block.start < block.end && block.start % 20 === 0 && block.end % 20 === 0);
  for (let index = 1; index < blocks.length; index++) assert.equal(rangesOverlap(blocks[index - 1].start, blocks[index - 1].end, blocks[index].start, blocks[index].end), false);
}
const classes = classesForOfficialBlocks(initialOfficialBlocks);
const on = createScheduleDraft("circuits", "ON_SCHEDULE", undefined, undefined, classes);
assert.deepEqual([on.date, on.startTime, on.endTime], ["2026-03-11", "12:20", "16:40"]);
assert.equal(scheduleDraftError("circuits", "ON_SCHEDULE", on, roomBlocksForDate(on.roomId, on.date), classes), null);
assert.match(scheduleDraftError("circuits", "ON_SCHEDULE", { ...on, roomId: "physics-201" }, [], classes), /selected laboratory/);
assert.match(scheduleDraftError("circuits", "OUT_OF_SCHEDULE", { ...on, startTime: "12:40", endTime: "13:00" }, roomBlocksForDate(on.roomId, on.date), classes), /outside your assigned class schedule/);
assert.match(scheduleDraftError("circuits", "OUT_OF_SCHEDULE", { ...on, date: "2026-03-13", startTime: "11:30", endTime: "12:20" }, [], classes), /20-minute/);
assert.match(scheduleDraftError("circuits", "OUT_OF_SCHEDULE", { ...on, date: "2026-03-13", startTime: "20:40", endTime: "21:20" }, [], classes), /9:00 PM/);
assert.ok(roomBlocksForDate("physics-201", "2026-03-11").some((block) => block.title === "ENPHYS1L"));
assert.ok(roomBlocksForDate("physics-202", "2026-03-11").some((block) => block.title === "ABCOM33X"));
assert.deepEqual(roomBlocksForDate("circuits-301", "2026-03-11").map((block) => block.id), roomBlocksForDate("circuits-301", addDateDays("2026-03-11", 7)).map((block) => block.id));

const pending = { id: "test-reservation", roomId: "circuits-301", date: "2026-03-13", start: 680, end: 740, kind: "pending", title: "Pending request", section: "CPE22A", reference: "TEST-1" };
const vacant = { ...on, date: pending.date, startTime: "11:20", endTime: "12:20" };
assert.match(scheduleDraftError("circuits", "OUT_OF_SCHEDULE", vacant, roomBlocksForDate(vacant.roomId, vacant.date, initialOfficialBlocks, [pending]), classes), /pending/);
assert.equal(scheduleDraftError("circuits", "OUT_OF_SCHEDULE", { ...vacant, startTime: "12:20", endTime: "12:40" }, roomBlocksForDate(vacant.roomId, vacant.date, initialOfficialBlocks, [pending]), classes), null);

const changed = initialOfficialBlocks.map((block) => block.assignedClassId === on.classId ? { ...block, start: 760, end: 1020 } : block);
const changedClasses = classesForOfficialBlocks(changed);
const moved = createScheduleDraft("circuits", "ON_SCHEDULE", on.date, on.classId, changedClasses);
assert.equal(moved.startTime, "12:40");
assert.equal(scheduleDraftError("circuits", "ON_SCHEDULE", moved, roomBlocksForDate(moved.roomId, moved.date, changed), changedClasses), null);
assert.notEqual(scheduleDraftError("circuits", "ON_SCHEDULE", on, roomBlocksForDate(on.roomId, on.date, changed), changedClasses), null);

const ownClass = roomBlocksForDate(on.roomId, on.date).find((block) => block.assignedClassId === on.classId);
const heldOnClass = { ...pending, date: on.date, start: 810, end: 870 };
const segments = calendarBlocks([ownClass, heldOnClass]);
assert.deepEqual(segments.map((block) => [block.id, block.gridStart, block.gridEnd]), [[ownClass.id, 740, 800], [pending.id, 800, 880], [ownClass.id, 880, 1000]], "A reservation splits the official block and remains visible, including older 30-minute times.");
assert.equal(segments[1].start, 810, "Block details preserve exact reservation times.");

const Component = loadSource("src/features/lab-dashboard/request-room-availability.tsx").default;
const html = renderToStaticMarkup(React.createElement(Component, { laboratory: "physics", scheduleType: "ON_SCHEDULE", draft: createScheduleDraft("physics", "ON_SCHEDULE"), official: initialOfficialBlocks, reservations: [], classes, loading: false, loadError: "", onRefresh() {}, onChange() {} }));
assert.match(html, /Official schedule/);
assert.match(html, /Physics 1/);
assert.match(html, /Physics 2/);
assert.match(html, /ENPHYS1L/);
assert.match(html, /9:00 PM/);
console.log("Room availability checks passed: three official timetables, 20-minute slots, edited class times, reservation conflicts, and request calendar rendering.");
