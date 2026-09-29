"use client";

import { useEffect, useState } from "react";
import LabIcon from "@/components/dashboard/lab-icon";
import { addDateDays, calendarBlocks, createScheduleDraft, displayDate, displayTime, laboratoryRooms, minutesToTime, OFFICE_END, OFFICE_START, parseDate, roomBlocksForDate, scheduleDraftError, SLOT_MINUTES, timeToMinutes, weekStart, type AssignedClass, type AvailabilityBlock, type RequestLaboratory, type RequestScheduleType, type ScheduleDraft } from "./room-availability";
import type { OfficialBlock } from "./official-schedule-data";
import "./request-room-availability.css";

const legend = [
  { kind: "laboratory", label: "Laboratory Session" }, { kind: "lecture", label: "Lecture" },
  { kind: "pending", label: "Pending Request" }, { kind: "approved", label: "Approved Request" },
  { kind: "vacant", label: "Vacant" }, { kind: "official", label: "Official Time 7:00 AM–9:00 PM" },
  { kind: "selection", label: "Your Selection" },
];

export default function RequestRoomAvailability({ laboratory, scheduleType, draft, official, reservations, classes, loading, loadError, onRefresh, onChange }: { laboratory: RequestLaboratory; scheduleType: RequestScheduleType; draft: ScheduleDraft; official: readonly OfficialBlock[]; reservations: readonly AvailabilityBlock[]; classes: readonly AssignedClass[]; loading: boolean; loadError: string; onRefresh: () => void; onChange: (draft: ScheduleDraft) => void }) {
  const [visibleWeek, setVisibleWeek] = useState(() => weekStart(draft.date));
  const [inspectedBlock, setInspectedBlock] = useState<AvailabilityBlock | null>(null);
  const onSchedule = scheduleType === "ON_SCHEDULE";
  const subjects = classes.filter((subject) => subject.laboratory === laboratory);
  const rooms = laboratoryRooms.filter((room) => room.laboratory === laboratory);
  const selectedClass = subjects.find((subject) => subject.id === draft.classId);
  const selectedRoom = rooms.find((room) => room.id === draft.roomId);
  const dates = Array.from({ length: 6 }, (_, index) => addDateDays(visibleWeek, index));
  const slots = Array.from({ length: (OFFICE_END - OFFICE_START) / SLOT_MINUTES }, (_, index) => OFFICE_START + index * SLOT_MINUTES);
  const dateBlocks = dates.map((date) => roomBlocksForDate(draft.roomId, date, official, reservations));
  const displayedBlocks = dateBlocks.map(calendarBlocks);
  const error = scheduleDraftError(laboratory, scheduleType, draft, roomBlocksForDate(draft.roomId, draft.date, official, reservations), classes);
  const start = timeToMinutes(draft.startTime), end = timeToMinutes(draft.endTime);
  const hasSelection = error === null && start !== null && end !== null;

  useEffect(() => { if (parseDate(draft.date)) setVisibleWeek(weekStart(draft.date)); }, [draft.date]);
  useEffect(() => { setInspectedBlock(null); }, [draft.roomId, visibleWeek, laboratory, scheduleType]);

  function selectVacantSlot(date: string, minutes: number) {
    const extend = draft.date === date && start !== null && minutes > start;
    onChange({ ...draft, date, startTime: extend ? draft.startTime : minutesToTime(minutes), endTime: minutesToTime(minutes + SLOT_MINUTES) });
    setInspectedBlock(null);
  }
  function inspectBlock(block: AvailabilityBlock) {
    if (onSchedule && block.assignedClassId === draft.classId) onChange({ ...draft, date: block.date, startTime: minutesToTime(block.start), endTime: minutesToTime(block.end) });
    setInspectedBlock(block);
  }

  return <div className="request-room-availability">
    <section className="request-schedule-fields" aria-labelledby="request-schedule-fields-title">
      <header className="request-schedule-header"><h3 id="request-schedule-fields-title"><LabIcon name="calendar" />Schedule</h3><span className="request-class-badge">Official schedule</span></header>
      <div className="request-schedule-columns">
        <div>
          <div className="request-schedule-field"><label htmlFor="request-assigned-class">Assigned Class / Subject <span>*</span></label><select id="request-assigned-class" value={draft.classId} required onChange={(event) => {
            const subject = subjects.find((item) => item.id === event.target.value);
            if (!subject) return;
            onChange(onSchedule ? createScheduleDraft(laboratory, scheduleType, draft.date, subject.id, classes) : { ...draft, classId: subject.id, roomId: subject.roomId, startTime: "", endTime: "" });
          }}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</select></div>
          <div className="request-schedule-field"><label htmlFor="request-for">Request For <span>*</span></label><select id="request-for" value={draft.requestFor} required onChange={() => onChange({ ...draft, requestFor: "ONE_TIME" })}><option value="ONE_TIME">One-time use</option></select></div>
          <div className="request-schedule-field"><label htmlFor="request-date">Date Needed <span>*</span></label><input id="request-date" type="date" value={draft.date} required onChange={(event) => onChange({ ...draft, date: event.target.value })} /></div>
        </div>
        <div>
          <div className="request-schedule-field"><label htmlFor="request-room">Room Number <span>*</span></label><select id="request-room" value={draft.roomId} disabled={onSchedule} required aria-describedby="request-room-help" onChange={(event) => onChange({ ...draft, roomId: event.target.value, startTime: "", endTime: "" })}>{rooms.map((room) => <option key={room.id} value={room.id}>{room.label}</option>)}</select><small id="request-room-help">{onSchedule ? "Room and times follow your assigned class schedule." : "Select a room to check its schedule and availability."}</small></div>
          <div className="request-schedule-field"><label htmlFor="request-start-time">Start Time <span>*</span></label><input id="request-start-time" type="time" value={draft.startTime} min="07:00" max="20:40" step={1200} readOnly={onSchedule} required onChange={(event) => onChange({ ...draft, startTime: event.target.value })} /></div>
          <div className="request-schedule-field"><label htmlFor="request-end-time">End Time <span>*</span></label><input id="request-end-time" type="time" value={draft.endTime} min="07:20" max="21:00" step={1200} readOnly={onSchedule} required onChange={(event) => onChange({ ...draft, endTime: event.target.value })} /></div>
        </div>
      </div>
    </section>

    <section className="request-availability-panel" aria-labelledby="request-availability-title">
      <div className="request-availability-heading"><h3 id="request-availability-title"><LabIcon name="calendar" />Room Availability</h3><span>{selectedRoom?.label}</span><button type="button" className="availability-selected-week" disabled={loading} onClick={onRefresh}>{loading ? "Loading…" : "Refresh blocks"}</button></div>
      {loadError && <p className="request-review-error" role="alert">{loadError}</p>}
      <ul className="availability-legend" aria-label="Availability colors">{legend.map(({ kind, label }) => <li key={kind}><span className={`availability-swatch availability-${kind}`} aria-hidden="true" />{label}</li>)}</ul>
      <div className="availability-week-navigation">
        <p>{displayDate(dates[0])}–{displayDate(dates[5], { month: "short", day: "numeric", year: "numeric" })}</p>
        <div><button type="button" className="availability-week-button is-previous" aria-label="Previous week" onClick={() => setVisibleWeek(addDateDays(visibleWeek, -7))}><LabIcon name="chevron" /></button><button type="button" className="availability-selected-week" onClick={() => setVisibleWeek(weekStart(draft.date))}>Selected week</button><button type="button" className="availability-week-button" aria-label="Next week" onClick={() => setVisibleWeek(addDateDays(visibleWeek, 7))}><LabIcon name="chevron" /></button></div>
      </div>
      <p className="availability-instructions">{onSchedule ? "Choose your assigned class block. Other blocks can be opened to view their details." : "Click a vacant slot to set the start, then a later slot on the same day to extend the range. You can also enter the times above."}</p>
      <div className="availability-table-scroll" tabIndex={0} aria-label="Weekly room availability calendar">
        <table className="availability-calendar">
          <caption className="sr-only">Official weekly schedule for {selectedRoom?.label}, {displayDate(dates[0])} to {displayDate(dates[5])}. Times are in 20-minute intervals.</caption>
          <thead><tr><th scope="col">Time</th>{dates.map((date) => <th key={date} scope="col" className={date === draft.date ? "is-selected-date" : ""}><span>{displayDate(date, { weekday: "short" })}</span><span>{displayDate(date)}</span></th>)}</tr></thead>
          <tbody>{slots.map((minutes) => <tr key={minutes}>
            <th scope="row">{displayTime(minutes)}</th>
            {dates.map((date, dayIndex) => {
              if (hasSelection && date === draft.date && minutes >= start && minutes < end) {
                if (minutes !== start) return null;
                const span = (end - start) / SLOT_MINUTES;
                return <td key={date} rowSpan={span} className="availability-selection"><button type="button" className="availability-event availability-selection" style={{ height: `calc(var(--availability-slot-height) * ${span} - 1px)` }} aria-label={`Your selection: ${displayDate(date, { weekday: "long", month: "long", day: "numeric" })}, ${displayTime(start)} to ${displayTime(end)}, ${selectedRoom?.label}`} onClick={() => setInspectedBlock(null)}><strong>Your Selection</strong>{span >= 3 && <><span>{selectedClass?.code}</span><span>{selectedClass?.section}</span><span>{displayTime(start)}–{displayTime(end)}</span></>}</button></td>;
              }
              const block = displayedBlocks[dayIndex].find((item) => minutes >= item.gridStart && minutes < item.gridEnd);
              if (block) {
                if (minutes !== block.gridStart) return null;
                const span = (block.gridEnd - block.gridStart) / SLOT_MINUTES;
                const description = `${block.title}, ${block.section}, ${displayDate(date)}, ${displayTime(block.start)} to ${displayTime(block.end)}${block.reference ? `, ${block.reference}` : ""}`;
                return <td key={date} rowSpan={span} className={`availability-${block.kind}`}><button type="button" className={`availability-event availability-${block.kind}`} style={{ height: `calc(var(--availability-slot-height) * ${span} - 1px)` }} title={description} aria-label={`View ${description}`} onClick={() => inspectBlock(block)}><strong>{block.title}</strong><span>{block.section}</span><span>{block.faculty ?? block.reference}</span>{block.kind === "pending" || block.kind === "approved" ? <span>Out-of-Schedule</span> : null}</button></td>;
              }
              const slotError = scheduleDraftError(laboratory, scheduleType, { ...draft, date, startTime: minutesToTime(minutes), endTime: minutesToTime(minutes + SLOT_MINUTES) }, dateBlocks[dayIndex], classes);
              return <td key={date} className="availability-vacant"><button type="button" className="availability-slot" disabled={loading || !!loadError || onSchedule || slotError !== null} title={onSchedule ? "Select your assigned class block." : slotError ?? "Select this vacant time slot."} aria-label={`${displayDate(date, { weekday: "long", month: "long", day: "numeric" })}, ${displayTime(minutes)} to ${displayTime(minutes + SLOT_MINUTES)}, vacant${slotError ? `: ${slotError}` : ""}`} onClick={() => selectVacantSlot(date, minutes)} /></td>;
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <div className={`availability-selection-status ${hasSelection ? "is-valid" : draft.startTime && draft.endTime ? "is-error" : ""}`} role="status"><LabIcon name={hasSelection ? "check-circle" : "clock"} /><p>{hasSelection ? `${displayDate(draft.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · ${selectedRoom?.label} · ${displayTime(start)}–${displayTime(end)}` : error}</p></div>
      {inspectedBlock && <aside className="availability-block-details"><div><strong>{inspectedBlock.title} · {inspectedBlock.section}</strong><p>{displayDate(inspectedBlock.date, { weekday: "long", month: "short", day: "numeric" })} · {displayTime(inspectedBlock.start)}–{displayTime(inspectedBlock.end)} · {selectedRoom?.label}</p><p>{inspectedBlock.reference ? `${inspectedBlock.reference} · Out-of-Schedule · ${inspectedBlock.kind === "pending" ? "Pending approval" : "Approved"}` : `${inspectedBlock.kind === "lecture" ? "Regular lecture" : "Regular laboratory session"} · ${inspectedBlock.faculty}`}</p></div><button type="button" className="lab-icon-button" aria-label="Close block details" onClick={() => setInspectedBlock(null)}><LabIcon name="close" /></button></aside>}
      <p className="availability-draft-note">Your selection is a draft and does not reserve the room.</p>
    </section>
  </div>;
}
