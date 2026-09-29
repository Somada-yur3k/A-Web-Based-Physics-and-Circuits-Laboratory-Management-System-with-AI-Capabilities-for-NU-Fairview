import { demoAssignedClasses, displayDate, displayTime, laboratoryRooms, timeToMinutes, type AssignedClass } from "./room-availability";
import { facultyApprovalRecipient, type FacultyRequestDraft, type FacultyRequestStep } from "./faculty-request-model";
import RequestEquipmentSummary from "./request-equipment-summary";

type Props = { draft: FacultyRequestDraft; classes?: readonly AssignedClass[]; confirmed: boolean; locked: boolean; onConfirmedChange: (value: boolean) => void; onEdit: (step: FacultyRequestStep) => void };

export default function FacultyRequestReview({ draft, classes = demoAssignedClasses, confirmed, locked, onConfirmedChange, onEdit }: Props) {
  const subject = classes.find((item) => item.id === draft.schedule.classId && item.laboratory === draft.laboratory);
  const room = laboratoryRooms.find((item) => item.id === draft.schedule.roomId);
  const start = timeToMinutes(draft.schedule.startTime), end = timeToMinutes(draft.schedule.endTime);
  const recipient = facultyApprovalRecipient(draft);
  const edit = (step: FacultyRequestStep, label: string) => <button type="button" className="request-review-edit" disabled={locked} aria-label={`Edit ${label}`} onClick={() => onEdit(step)}>Edit</button>;
  return <div className="request-review-content">
    <div className="request-review-grid">
      <section className="request-review-card" aria-labelledby="faculty-review-details">
        <header><h3 id="faculty-review-details">Request Details</h3>{edit("laboratory", "laboratory")}</header>
        <dl><div><dt>Laboratory</dt><dd>{draft.laboratory === "circuits" ? "Circuits Laboratory" : "Physics Laboratory"}</dd></div>
          <div><dt>Activity Type</dt><dd>{draft.activityType === "LABORATORY_ACTIVITY" ? "Laboratory Activity" : "Non-Laboratory Activity"} {edit("activity", "activity type")}</dd></div>
          <div><dt>Schedule Type</dt><dd>{draft.scheduleType === "ON_SCHEDULE" ? "On-Schedule (Assigned Class Schedule)" : "Out-of-Schedule"} {draft.activityType === "NON_LABORATORY_ACTIVITY" && edit("schedule-type", "schedule type")}</dd></div>
          <div><dt>Section</dt><dd>{subject?.section ?? "Select an assigned subject"}</dd></div></dl>
      </section>
      <section className="request-review-card" aria-labelledby="faculty-review-schedule">
        <header><h3 id="faculty-review-schedule">Schedule &amp; Room</h3>{edit("schedule", "schedule and room")}</header>
        <dl><div><dt>Assigned Class / Subject</dt><dd>{subject?.label ?? "Select an assigned subject"}</dd></div><div><dt>Room</dt><dd>{room?.label ?? "Select a room"}</dd></div><div><dt>Date Needed</dt><dd>{displayDate(draft.schedule.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</dd></div><div><dt>Time</dt><dd>{start !== null && end !== null ? `${displayTime(start)} – ${displayTime(end)}` : "Select a session block"}</dd></div><div><dt>Request For</dt><dd>One-time use</dd></div></dl>
      </section>
    </div>
    <section className="request-review-card" aria-labelledby="faculty-review-items">
      <header><h3 id="faculty-review-items">Equipment &amp; Materials</h3>{edit("equipment", "equipment and materials")}</header>
      <RequestEquipmentSummary items={draft.items} />
      <h4>Notes / Special Setup</h4><p className="request-review-notes">{draft.notes.trim() || "No additional notes."}</p>
    </section>
    <section className="request-review-card request-review-approval" aria-labelledby="faculty-review-route">
      <header><h3 id="faculty-review-route">{recipient ? "Request Approval" : "Reservation Processing"}</h3></header>
      <p className="request-review-note">{recipient ? "Your Out-of-Schedule request will be sent to the Dean for approval before reservation processing." : "This request uses your assigned schedule and does not require academic approval. Wait for your reservation to be processed."}</p>
      {recipient && <p className="request-review-recipient">For approval by: <strong>Dean</strong></p>}
    </section>
    <label className="request-review-confirm"><input type="checkbox" checked={confirmed} disabled={locked} onChange={(event) => onConfirmedChange(event.target.checked)} /><span>I have reviewed the request details and confirm that they are correct.</span></label>
    <p className="request-review-note">Demo only: submitted requests block the selected room time while pending or approved. Requests routed to the Dean appear in the Dean review queue. No notification is sent; data resets on server restart.</p>
  </div>;
}
