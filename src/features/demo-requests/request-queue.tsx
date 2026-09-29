"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LabIcon from "@/components/dashboard/lab-icon";
import RequestEquipmentSummary from "@/features/lab-dashboard/request-equipment-summary";
import { demoAssignedClasses, displayDate, displayTime, laboratoryRooms, timeToMinutes } from "@/features/lab-dashboard/room-availability";
import type { DemoRequestRecord } from "./types";
import type { InventoryItem } from "@/features/staff/types";
import "./request-queue.css";

function Status({ record }: { record: DemoRequestRecord }) {
  return <span className={`dean-status ${record.status === "Approved" ? "approved" : record.status === "Rejected" ? "rejected" : "pending"}`}>{record.status}</span>;
}
export function RequestDialog({ record, dean, inventory, onClose, onDecision }: { record: DemoRequestRecord; dean: boolean; inventory?: readonly InventoryItem[]; onClose: () => void; onDecision: (record: DemoRequestRecord) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [remarks, setRemarks] = useState("");
  const [confirmation, setConfirmation] = useState<"Approved" | "Rejected" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const subject = record.assignedClass ?? demoAssignedClasses.find((item) => item.id === record.snapshot.schedule.classId);
  const room = laboratoryRooms.find((item) => item.id === record.snapshot.schedule.roomId);
  const snapshot = record.snapshot;
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function save() {
    if (!confirmation || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/demo/requests/${encodeURIComponent(record.reference)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: confirmation, remarks }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save the decision.");
      onDecision(data.record); setConfirmation(null);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save the decision. Try again."); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="dean-dialog" aria-labelledby="dean-review-title" onClose={onClose} onCancel={(event) => { if (busy) event.preventDefault(); }}>
    <header><div><p>{dean ? "OUT-OF-SCHEDULE REVIEW" : "REQUEST DETAILS"}</p><h2 id="dean-review-title">Laboratory Service Request</h2></div><button className="lab-icon-button" aria-label="Close review" disabled={busy} onClick={() => dialog.current?.close()}><LabIcon name="close" /></button></header>
    <div className="dean-dialog-body">
      <p className="dean-reference">{record.reference}</p><Status record={record} />{record.sample && <p className="dean-note">Sample record for the demo.</p>}
      <dl className="dean-details">
        <div><dt>Requested by</dt><dd>{record.requester.displayName} · {record.requester.role === "faculty" ? "Faculty" : "Class Representative"}</dd></div>
        <div><dt>Laboratory</dt><dd>{snapshot.laboratory === "circuits" ? "Circuits Laboratory" : "Physics Laboratory"}</dd></div>
        <div><dt>Request type</dt><dd>{"requestType" in snapshot ? snapshot.requestType === "GROUP" ? "Group" : "Student Only" : snapshot.activityType === "LABORATORY_ACTIVITY" ? "Laboratory Activity" : "Non-Laboratory Activity"}</dd></div>
        <div><dt>Schedule type</dt><dd>{snapshot.scheduleType === "OUT_OF_SCHEDULE" ? "Out-of-Schedule" : "On-Schedule"}</dd></div>
        <div><dt>Assigned class / section</dt><dd>{subject?.label} · {subject?.section}</dd></div>
        <div><dt>Assigned Faculty</dt><dd>{subject?.faculty}</dd></div>
        <div><dt>Room</dt><dd>{room?.label}</dd></div>
        <div><dt>Requested session</dt><dd>{displayDate(snapshot.schedule.date)} · {displayTime(timeToMinutes(snapshot.schedule.startTime)!)} – {displayTime(timeToMinutes(snapshot.schedule.endTime)!)}</dd></div>
        <div><dt>Submitted</dt><dd>{new Date(record.createdAt).toLocaleString()}</dd></div>
        <div><dt>Approval recipient</dt><dd>{record.recipient === "DEAN" ? "Dean" : record.recipient === "FACULTY" ? `Faculty · ${subject?.faculty}` : "No academic approval required"}</dd></div>
      </dl>
      {"students" in snapshot && <section><h3>Participating students ({snapshot.students.length})</h3><ul className="dean-students">{snapshot.students.map((student) => <li key={student.studentId}><strong>{student.name}</strong><span>{student.studentId} · {subject?.section}</span></li>)}</ul></section>}
      <section><h3>Equipment & Materials</h3><RequestEquipmentSummary items={snapshot.items} inventory={inventory} laboratory={snapshot.laboratory} /></section>
      <section><h3>Requester notes</h3><p className="dean-notes">{snapshot.notes || "No additional notes."}</p></section>
      {record.decision ? <section className="dean-decision"><h3>{record.status} by {record.decision.by}</h3><p>{new Date(record.decision.at).toLocaleString()}</p><p className="dean-notes">{record.decision.remarks || "No additional remarks."}</p></section> : dean && <section className="dean-decision"><label htmlFor="dean-remarks">Decision remarks <span>(required when rejecting)</span></label><textarea id="dean-remarks" value={remarks} disabled={busy} maxLength={1000} rows={3} onChange={(event) => { setRemarks(event.target.value); setConfirmation(null); setError(""); }} placeholder="Explain your decision to the requester…" />
        {confirmation ? <div className="dean-confirmation" role="status"><p>{confirmation === "Approved" ? "Approve this request? It will be marked approved for laboratory reservation processing." : "Reject this request? Your reason will be visible to the requester."}</p><div className="dean-actions"><button className="lab-outline-button" disabled={busy} onClick={() => setConfirmation(null)}>Cancel</button><button className={confirmation === "Rejected" ? "dean-reject" : "dean-approve"} disabled={busy} onClick={save}>{busy ? "Saving…" : "Confirm Decision"}</button></div></div> : <div className="dean-actions"><button className="dean-reject" onClick={() => { if (!remarks.trim()) setError("Enter a reason before rejecting this request."); else { setError(""); setConfirmation("Rejected"); } }}>Reject Request</button><button className="dean-approve" onClick={() => { setError(""); setConfirmation("Approved"); }}>Approve Request</button></div>}
      </section>}
      {error && <p className="dean-error" role="alert">{error}</p>}
      <p className="dean-note">Demo only. Pending and approved requests block the selected room time in the calendar. Equipment stock is not held and no notifications are sent. Data resets when the server restarts.</p>
    </div>
  </dialog>;
}

export default function RequestQueue({ mode = "dashboard", requesterRole }: { mode?: "dashboard" | "review" | "history" | "own"; requesterRole?: "faculty" | "classrep" }) {
  const [records, setRecords] = useState<DemoRequestRecord[]>([]);
  const [selected, setSelected] = useState<DemoRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [laboratory, setLaboratory] = useState("All");
  const dean = mode !== "own";
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await fetch("/api/demo/requests", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load requests."); setRecords(data.requests); setSelected((current) => current ? data.requests.find((record: DemoRequestRecord) => record.reference === current.reference) ?? null : null); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not load requests."); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const filtered = records.filter((record) => (mode !== "review" || record.status === "Pending Dean Approval") && (mode !== "history" || Boolean(record.decision)) && (status === "All" || record.status === status) && (laboratory === "All" || record.snapshot.laboratory === laboratory) && `${record.reference} ${record.requester.displayName} ${record.requester.role} ${record.snapshot.notes}`.toLowerCase().includes(search.trim().toLowerCase()));
  const title = mode === "own" ? requesterRole === "faculty" ? "Reservation Status" : "My Reservation" : mode === "review" ? "Out-of-Schedule Request Review" : mode === "history" ? "Decision History" : "Dean Dashboard";
  return <main className="lab-dashboard-content dean-page">
    <div className="lab-page-heading"><div><h1>{title}</h1><p>{dean ? "Review Out-of-Schedule requests routed to the Dean from Faculty and Class Representatives." : "Track your submitted demo requests and approval decisions."}</p></div><button className="lab-outline-button" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh Requests"}</button></div>
    {dean && <section className="lab-stats" aria-label="Dean request summary">{[{ label: "Pending Review", status: "Pending Dean Approval", icon: "clock", tone: "amber" }, { label: "Approved Requests", status: "Approved", icon: "check-circle", tone: "green" }, { label: "Rejected Requests", status: "Rejected", icon: "close", tone: "blue" }].map((item) => <article className="lab-stat-card" key={item.status}><span className={`lab-stat-icon ${item.tone}`}><LabIcon name={item.icon as "clock" | "check-circle" | "close"} /></span><dl><dt>{item.label}</dt><dd>{loading ? "—" : records.filter((record) => record.status === item.status).length}</dd></dl></article>)}</section>}
    <section className="lab-panel"><div className="lab-panel-heading"><h2><LabIcon name="tasks" />{mode === "history" ? "Reviewed Requests" : dean ? "Out-of-Schedule Requests" : "Submitted Requests"}</h2></div>
      <div className="dean-filters"><label>Search requests<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reference, requester or notes…" /></label>{mode !== "review" && <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="All">All Status</option>{(dean ? ["Pending Dean Approval", "Approved", "Rejected"] : ["Pending Dean Approval", "Pending Faculty Approval", "Awaiting Reservation", "Approved", "Rejected"]).map((value) => <option key={value}>{value}</option>)}</select></label>}<label>Laboratory<select value={laboratory} onChange={(event) => setLaboratory(event.target.value)}><option value="All">All Laboratories</option><option value="circuits">Circuits Laboratory</option><option value="physics">Physics Laboratory</option></select></label></div>
      {message && <p role="status" className="dean-message">{message}</p>}{error && <p role="alert" className="dean-error">{error}</p>}
      {loading ? <p role="status">Loading requests…</p> : !filtered.length ? <div className="dean-empty"><LabIcon name="report" /><h3>{records.length ? "No matching requests" : "No submitted requests yet"}</h3><p>{dean ? "Requests routed to the Dean will appear here." : "Submit a Laboratory Service Request to start tracking its status."}</p></div> : <div className="dean-records">{filtered.map((record) => <article className="dean-record" key={record.reference}><div><h3>{record.requester.displayName}</h3><p>{record.requester.role === "faculty" ? "Faculty" : "Class Representative"}{record.sample && " · Sample"}</p><small className="dean-reference">{record.reference}</small></div><div><strong>{record.snapshot.laboratory === "circuits" ? "Circuits Laboratory" : "Physics Laboratory"}</strong><p>{displayDate(record.snapshot.schedule.date)}</p><small>{displayTime(timeToMinutes(record.snapshot.schedule.startTime)!)} – {displayTime(timeToMinutes(record.snapshot.schedule.endTime)!)}</small></div><Status record={record} /><button className="lab-view-button" onClick={() => { setSelected(record); setMessage(""); }}>{dean && !record.decision ? "Review" : "View Details"}</button></article>)}</div>}
      <p className="dean-note">{filtered.length} request{filtered.length === 1 ? "" : "s"} shown. Demo data is stored temporarily until the server restarts.{dean && " Sample records are included in the counters."}</p>
    </section>
    {selected && <RequestDialog key={selected.reference} record={selected} dean={dean} onClose={() => setSelected(null)} onDecision={(updated) => { setRecords((previous) => previous.map((record) => record.reference === updated.reference ? updated : record)); setSelected(updated); setMessage(`Request ${updated.status.toLowerCase()} successfully.`); }} />}
  </main>;
}
