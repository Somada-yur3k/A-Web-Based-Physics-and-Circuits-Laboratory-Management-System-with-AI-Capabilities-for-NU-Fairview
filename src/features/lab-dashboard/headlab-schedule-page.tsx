"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import { initialOfficialBlocks, type OfficialBlock } from "./official-schedule-data";
import { addDateDays, calendarBlocks, DEMO_SCHEDULE_DATE, displayDate, displayTime, laboratoryRooms, minutesToTime, OFFICE_END, OFFICE_START, roomBlocksForDate, SLOT_MINUTES, weekStart, type AvailabilityBlock } from "./room-availability";
import "./request-room-availability.css";
import "./headlab-schedule-page.css";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type FormValues = { roomId: string; weekday: number; startTime: string; endTime: string; title: string; section: string; faculty: string };
const emptyForm = (roomId: string): FormValues => ({ roomId, weekday: 1, startTime: "07:00", endTime: "08:00", title: "", section: "", faculty: "" });

function BlockDialog({ block, roomId, onClose, onSaved }: { block?: OfficialBlock; roomId: string; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<FormValues>(() => block ? { roomId: block.roomId, weekday: block.weekday, startTime: minutesToTime(block.start), endTime: minutesToTime(block.end), title: block.title, section: block.section, faculty: block.faculty ?? "" } : emptyForm(roomId));
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(block ? `/api/demo/schedule/${encodeURIComponent(block.id)}` : "/api/demo/schedule", { method: block ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save the official block.");
      onSaved(); dialog.current?.close();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the official block."); }
    finally { setBusy(false); }
  }
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <dialog ref={dialog} className="account-dialog official-block-dialog" aria-labelledby="official-block-title" onClose={onClose} onCancel={(event) => { if (busy) event.preventDefault(); }}>
    <header className="account-dialog-heading"><div><h2 id="official-block-title">{block ? "Edit Official Time" : "Add Official Time"}</h2><p>Weekly class block for the selected laboratory room.</p></div><button type="button" className="admin-icon-button" aria-label="Close schedule editor" disabled={busy} onClick={() => dialog.current?.close()}><AdminIcon name="close" /></button></header>
    <form className="account-form" onSubmit={save}><fieldset disabled={busy} className="official-form-grid">
      <label>Laboratory room<select value={form.roomId} onChange={(event) => set("roomId", event.target.value)}>{laboratoryRooms.map((room) => <option value={room.id} key={room.id}>{room.label}</option>)}</select></label>
      <label>Day<select value={form.weekday} onChange={(event) => set("weekday", Number(event.target.value))}>{days.map((day, index) => <option value={index + 1} key={day}>{day}</option>)}</select></label>
      <label>Start time<input type="time" min="07:00" max="20:40" step={1200} required value={form.startTime} onChange={(event) => set("startTime", event.target.value)} /></label>
      <label>End time<input type="time" min="07:20" max="21:00" step={1200} required value={form.endTime} onChange={(event) => set("endTime", event.target.value)} /></label>
      <label>Subject / code<input required maxLength={100} value={form.title} onChange={(event) => set("title", event.target.value)} /></label>
      <label>Section<input required maxLength={100} value={form.section} onChange={(event) => set("section", event.target.value)} /></label>
      <label className="official-field-wide">Faculty<input required maxLength={100} value={form.faculty} onChange={(event) => set("faculty", event.target.value)} /></label>
    </fieldset>{error && <p className="account-form-error" role="alert">{error}</p>}<div className="account-dialog-actions"><button type="button" className="admin-secondary-button" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" className="admin-primary-button" disabled={busy}>{busy ? "Saving…" : "Save Official Time"}</button></div></form>
  </dialog>;
}

export default function HeadlabSchedulePage() {
  const [official, setOfficial] = useState<OfficialBlock[]>(initialOfficialBlocks);
  const [reservations, setReservations] = useState<AvailabilityBlock[]>([]);
  const [roomId, setRoomId] = useState<string>(laboratoryRooms[0].id);
  const [week, setWeek] = useState(() => weekStart(DEMO_SCHEDULE_DATE));
  const [editing, setEditing] = useState<OfficialBlock | "new" | null>(null);
  const [selected, setSelected] = useState<AvailabilityBlock | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/demo/schedule", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load schedules.");
      setOfficial(data.blocks); setReservations(data.reservations);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load schedules."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const room = laboratoryRooms.find((item) => item.id === roomId)!;
  const dates = Array.from({ length: 6 }, (_, index) => addDateDays(week, index));
  const datesBlocks = dates.map((date) => calendarBlocks(roomBlocksForDate(roomId, date, official, reservations)));
  const slots = Array.from({ length: (OFFICE_END - OFFICE_START) / SLOT_MINUTES }, (_, index) => OFFICE_START + index * SLOT_MINUTES);
  const roomOfficial = official.filter((block) => block.roomId === roomId);
  const roomReservations = reservations.filter((block) => block.roomId === roomId && dates.includes(block.date));
  return <main className="admin-content headlab-schedule" aria-labelledby="headlab-schedule-title">
    <header className="account-page-heading"><div><h1 id="headlab-schedule-title">Schedule Management</h1><p>Manage official weekly time for Circuits, Physics 1 – 407, and Physics 2 – 409. View reservation blocks for the selected week.</p></div></header>
    <section className="account-panel"><header className="account-panel-heading"><div><h2>{room.label}</h2><p>Official time: 7:00 AM–9:00 PM, Monday–Saturday.</p></div><div className="headlab-schedule-actions"><button className="admin-secondary-button" disabled={loading} onClick={load}>{loading ? "Loading…" : "Refresh"}</button><button className="admin-primary-button" disabled={loading || Boolean(error)} onClick={() => setEditing("new")}>Add Official Time</button></div></header>
      <div className="headlab-room-tabs" role="group" aria-label="Choose laboratory schedule">{laboratoryRooms.map((item) => <button type="button" key={item.id} className={roomId === item.id ? "is-active" : ""} aria-pressed={roomId === item.id} onClick={() => { setRoomId(item.id); setSelected(null); }}>{item.label}</button>)}</div>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <div className="availability-week-navigation"><p>{displayDate(dates[0])}–{displayDate(dates[5], { month: "short", day: "numeric", year: "numeric" })}</p><div><button className="availability-week-button is-previous" aria-label="Previous week" onClick={() => setWeek(addDateDays(week, -7))}><AdminIcon name="chevron" /></button><button className="availability-selected-week" onClick={() => setWeek(weekStart(DEMO_SCHEDULE_DATE))}>Sample week</button><button className="availability-week-button" aria-label="Next week" onClick={() => setWeek(addDateDays(week, 7))}><AdminIcon name="chevron" /></button></div></div>
      <ul className="availability-legend" aria-label="Schedule colors"><li><span className="availability-swatch availability-laboratory" />Official class</li><li><span className="availability-swatch availability-pending" />Pending reservation</li><li><span className="availability-swatch availability-approved" />Approved reservation</li></ul>
      <div className="availability-table-scroll" tabIndex={0} aria-label={`${room.label} weekly schedule`}><table className="availability-calendar"><caption className="sr-only">{room.label} official timetable and reservation blocks in 20-minute intervals.</caption><thead><tr><th scope="col">Time</th>{dates.map((date, index) => <th scope="col" key={date}>{days[index]}<span>{displayDate(date)}</span></th>)}</tr></thead><tbody>{slots.map((minutes) => <tr key={minutes}><th scope="row">{displayTime(minutes)}</th>{dates.map((date, dayIndex) => {
        const block = datesBlocks[dayIndex].find((item) => minutes >= item.gridStart && minutes < item.gridEnd);
        if (!block) return <td key={date} className="availability-vacant" />;
        if (minutes !== block.gridStart) return null;
        const span = (block.gridEnd - block.gridStart) / SLOT_MINUTES;
        return <td key={date} rowSpan={span} className={`availability-${block.kind}`}><button type="button" className={`availability-event availability-${block.kind}`} style={{ height: `calc(var(--availability-slot-height) * ${span} - 1px)` }} aria-label={`${block.title}, ${days[dayIndex]}, ${displayTime(block.start)} to ${displayTime(block.end)}`} onClick={() => setSelected(block)}><strong>{block.title}</strong><span>{block.section}</span><span>{block.faculty ?? block.reference}</span></button></td>;
      })}</tr>)}</tbody></table></div>
      {selected && <aside className="availability-block-details"><div><strong>{selected.title} · {selected.section}</strong><p>{displayDate(selected.date, { weekday: "long", month: "short", day: "numeric" })} · {displayTime(selected.start)}–{displayTime(selected.end)} · {room.label}</p><p>{selected.reference ? `${selected.reference} · ${selected.kind === "approved" ? "Approved" : "Pending"} reservation` : `Official weekly time · ${selected.faculty}`}</p></div>{!selected.reference && <button className="admin-secondary-button" onClick={() => { const block = official.find((item) => item.id === selected.id); if (block) setEditing(block); }}>Edit</button>}</aside>}
    </section>
    <section className="account-panel headlab-schedule-list"><h2>Official Weekly Blocks ({roomOfficial.length})</h2><div className="headlab-block-list">{roomOfficial.map((block) => <article key={block.id}><div><strong>{block.title}</strong><span>{block.section} · {block.faculty}</span><span>{days[block.weekday - 1]} · {displayTime(block.start)}–{displayTime(block.end)}</span></div><button className="admin-secondary-button" onClick={() => setEditing(block)}>Edit</button></article>)}</div><h2>Reservation Blocks This Week ({roomReservations.length})</h2>{roomReservations.length ? <div className="headlab-block-list">{roomReservations.map((block) => <article key={block.id}><div><strong>{block.title}</strong><span>{block.section} · {block.reference}</span><span>{displayDate(block.date)} · {displayTime(block.start)}–{displayTime(block.end)}</span></div><span className={`headlab-reservation-status ${block.kind}`}>{block.kind === "approved" ? "Approved" : "Pending"}</span></article>)}</div> : <p>No reservation blocks this week.</p>}</section>
    <p className="headlab-schedule-note">Official schedule edits and demo requests are stored temporarily until the server restarts. Pending requests block availability; rejected requests do not.</p>
    {editing && <BlockDialog key={typeof editing === "string" ? "new" : editing.id} block={typeof editing === "string" ? undefined : editing} roomId={roomId} onClose={() => setEditing(null)} onSaved={() => { void load(); setSelected(null); }} />}
  </main>;
}
