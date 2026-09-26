import { demoRequestClass } from "./request-participants";
import { demoAssignedClasses, displayDate, displayTime, laboratoryRooms, timeToMinutes } from "./room-availability";
import { approvalRecipient, type ApprovalRecipient, type ServiceRequestDraft } from "./request-review";

type Props = {
  draft: ServiceRequestDraft;
  confirmed: boolean;
  locked?: boolean;
  onApproverChange: (approver: ApprovalRecipient) => void;
  onConfirmedChange: (confirmed: boolean) => void;
  onEdit: (step: 1 | 2 | 3 | 4 | 5) => void;
};

export default function RequestInformationReview({ draft, confirmed, locked = false, onApproverChange, onConfirmedChange, onEdit }: Props) {
  const subject = demoAssignedClasses.find((item) => item.id === draft.schedule.classId && item.laboratory === draft.laboratory);
  const room = laboratoryRooms.find((item) => item.id === draft.schedule.roomId);
  const recipient = approvalRecipient(draft);
  const start = timeToMinutes(draft.schedule.startTime), end = timeToMinutes(draft.schedule.endTime);
  const time = start !== null && end !== null ? `${displayTime(start)} – ${displayTime(end)}` : "Select a time in Step 4";
  const editButton = (step: 1 | 2 | 3 | 4 | 5, label: string) => <button type="button" className="request-review-edit" disabled={locked} aria-label={`Edit ${label}`} onClick={() => onEdit(step)}>Edit</button>;
  return <div className="request-review-content">
    <div className="request-review-grid">
      <section className="request-review-card" aria-labelledby="review-request-heading">
        <header><h3 id="review-request-heading">Request Details</h3>{editButton(1, "laboratory")}</header>
        <dl><div><dt>Laboratory</dt><dd>{draft.laboratory === "circuits" ? "Circuits Laboratory" : "Physics Laboratory"}</dd></div><div><dt>Request Type</dt><dd>{draft.requestType === "GROUP" ? "Group" : "Student Only"}</dd></div><div><dt>Section</dt><dd>{demoRequestClass.section}</dd></div><div><dt>Schedule Type</dt><dd>{draft.scheduleType === "ON_SCHEDULE" ? "On-Schedule" : "Out-of-Schedule"} {editButton(3, "schedule type")}</dd></div></dl>
      </section>
      <section className="request-review-card" aria-labelledby="review-schedule-heading">
        <header><h3 id="review-schedule-heading">Schedule &amp; Room</h3>{editButton(4, "schedule and room")}</header>
        <dl><div><dt>Assigned Class / Subject</dt><dd>{subject?.label ?? "Select a subject in Step 4"}</dd></div><div><dt>Room</dt><dd>{room?.label ?? "Select a room in Step 4"}</dd></div><div><dt>Date Needed</dt><dd>{displayDate(draft.schedule.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</dd></div><div><dt>Time</dt><dd>{time}</dd></div><div><dt>Request For</dt><dd>One-time use</dd></div></dl>
      </section>
    </div>
    <section className="request-review-card" aria-labelledby="review-students-heading">
      <header><h3 id="review-students-heading">Participating Students ({draft.students.length})</h3>{editButton(2, "participating students")}</header>
      <div className="request-review-table-scroll" tabIndex={0}><table><thead><tr><th scope="col">Student Name</th><th scope="col">NU Student ID</th><th scope="col">Section</th></tr></thead><tbody>{draft.students.map((student, index) => <tr key={index}><td>{student.name.trim()}</td><td>{student.studentId.trim()}</td><td>{demoRequestClass.section}</td></tr>)}</tbody></table></div>
    </section>
    <section className="request-review-card" aria-labelledby="review-items-heading">
      <header><h3 id="review-items-heading">Equipment &amp; Materials</h3>{editButton(5, "equipment and materials")}</header>
      {draft.items.length ? <div className="request-review-table-scroll" tabIndex={0}><table><thead><tr><th scope="col">Type</th><th scope="col">Item Name</th><th scope="col">Quantity</th></tr></thead><tbody>{draft.items.map((item) => <tr key={item.rowId}><td>{item.kind}</td><td>{item.name.trim()}</td><td>{item.quantity}</td></tr>)}</tbody></table></div> : <p className="request-review-note">No equipment or materials requested.</p>}
      <h4>Notes / Special Setup</h4><p className="request-review-notes">{draft.notes.trim() || "No additional notes."}</p>
    </section>
    <section className="request-review-card request-review-approval" aria-labelledby="review-approval-heading">
      <header><h3 id="review-approval-heading">Request Approval</h3></header>
      {draft.scheduleType === "ON_SCHEDULE" ? <><p className="request-review-note">Your On-Schedule request is for approval by the Faculty assigned to this subject.</p><dl><div><dt>Assigned Faculty</dt><dd>{subject?.faculty ?? "Select an assigned subject"}</dd></div></dl></> : <>
        <p className="request-review-note">Choose who will review your Out-of-Schedule request.</p>
        <fieldset className="request-approver-options" disabled={locked}><legend>Approval Recipient <span>*</span></legend>
          <label className={draft.approver === "FACULTY" ? "is-selected" : ""}><input type="radio" name="approval-recipient" value="FACULTY" checked={draft.approver === "FACULTY"} onChange={() => onApproverChange("FACULTY")} /><span><strong>Assigned Faculty</strong><span>{subject?.faculty ?? "Select an assigned subject"}</span></span></label>
          <label className={draft.approver === "DEAN" ? "is-selected" : ""}><input type="radio" name="approval-recipient" value="DEAN" checked={draft.approver === "DEAN"} onChange={() => onApproverChange("DEAN")} /><span><strong>Dean</strong><span>Request approval from the Dean.</span></span></label>
        </fieldset>
      </>}
      <p className="request-review-recipient" role="status">{recipient ? <>For approval by: <strong>{recipient.role === "FACULTY" ? `${recipient.name} (Faculty)` : "Dean"}</strong></> : "Select Faculty or Dean before submitting."}</p>
    </section>
    <label className="request-review-confirm"><input type="checkbox" checked={confirmed} disabled={locked} onChange={(event) => onConfirmedChange(event.target.checked)} /><span>I have reviewed the request details and confirm that they are correct.</span></label>
    <p className="request-review-note">Demo only: submitting creates a preview on this page. It does not send a request to Faculty or Dean, reserve a room, or save after leaving this page.</p>
  </div>;
}
