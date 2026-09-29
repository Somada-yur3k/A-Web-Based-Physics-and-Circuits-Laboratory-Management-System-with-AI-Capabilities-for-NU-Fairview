"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LabIcon from "@/components/dashboard/lab-icon";
import RequestLaboratoryChoices from "./request-laboratory-choices";
import RequestStudentFields from "./request-student-fields";
import RequestRoomAvailability from "./request-room-availability";
import RequestEquipmentFields from "./request-equipment-fields";
import RequestInformationReview from "./request-information-review";
import { addCatalogItem, itemsForLaboratory } from "./equipment-catalog";
import useRequestProgress from "./use-request-progress";
import useOfficialSchedule from "./use-official-schedule";
import { createScheduleDraft, scheduleDraftError, type ScheduleDraft } from "./room-availability";
import { requestedItemsError, serviceRequestError, type ApprovalRecipient, type DemoRequestSnapshot, type RequestedItem, type ServiceRequestDraft } from "./request-review";
import { areParticipantDetailsValid, type GroupStudentRow, type RequestType, type StudentDetails } from "./request-participants";
import "./laboratory-service-request.css";
import "./request-information-review.css";

const requestSteps = [
  "Choose Laboratory",
  "Choose Request Type",
  "Choose Schedule Type",
  "Schedule & Room Availability",
  "Equipment & Materials",
  "Review Information",
];

const requestTypes = [
  {
    id: "GROUP",
    name: "Group",
    icon: "faculty",
    description: "Request a laboratory session for a group of students from your assigned section/class.",
    guidance: ["Select participating students from your assigned section/class.", "Multiple students can be added."],
  },
  {
    id: "STUDENT_ONLY",
    name: "Student Only",
    icon: "user",
    description: "Request a laboratory session for one (1) student only.",
    guidance: ["Select exactly one student from your assigned section/class.", "Only one student can be added."],
  },
] as const;

const scheduleTypes = [
  {
    id: "ON_SCHEDULE",
    name: "On-Schedule",
    icon: "calendar",
    description: "Use your existing assigned class schedule and laboratory block.",
    guidance: ["Select from your assigned class/subject schedule.", "The session will follow your regular schedule."],
  },
  {
    id: "OUT_OF_SCHEDULE",
    name: "Out-of-Schedule",
    icon: "calendar-plus",
    description: "Request a laboratory session outside your assigned class schedule.",
    guidance: ["Select a vacant block outside your regular schedule.", "Subject to availability and approval."],
  },
] as const;

export default function LaboratoryServiceRequest() {
  const scheduleData = useOfficialSchedule();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [laboratory, setLaboratory] = useState<"physics" | "circuits">("circuits");
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [groupStudents, setGroupStudents] = useState<GroupStudentRow[]>([{ rowId: 1, name: "", studentId: "" }]);
  const [individualStudent, setIndividualStudent] = useState<StudentDetails>({ name: "", studentId: "" });
  const nextStudentRowId = useRef(2);
  const [scheduleType, setScheduleType] = useState<"ON_SCHEDULE" | "OUT_OF_SCHEDULE">("ON_SCHEDULE");
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(() => createScheduleDraft("circuits", "ON_SCHEDULE"));
  const [items, setItems] = useState<RequestedItem[]>([]);
  const nextItemRowId = useRef(1);
  const [notes, setNotes] = useState("");
  const [approver, setApprover] = useState<ApprovalRecipient | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<{ reference: string; snapshot: DemoRequestSnapshot } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submissionLock = useRef(false);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const activeStep = useRef<HTMLLIElement>(null);
  const previousStep = useRef(step);
  useRequestProgress(activeStep, step);
  const activeStudents = requestType === "GROUP" ? groupStudents : requestType === "STUDENT_ONLY" ? [individualStudent] : [];
  const canContinueToSchedule = areParticipantDetailsValid(requestType, activeStudents);
  const scheduleError = scheduleData.loading ? "Loading official schedule…" : scheduleData.error || scheduleDraftError(laboratory, scheduleType, scheduleDraft, scheduleData.blocksFor(scheduleDraft), scheduleData.classes);
  const itemsError = requestedItemsError(items, notes, laboratory);
  const draft: ServiceRequestDraft = { laboratory, requestType, students: activeStudents, scheduleType, schedule: scheduleDraft, items, notes, approver };
  const reviewError = scheduleData.loading ? "Loading official schedule…" : scheduleData.error || serviceRequestError(draft, scheduleData.blocksFor(scheduleDraft), scheduleData.classes);
  const canSubmit = confirmed && !reviewError && !receipt;
  const stepTitles = ["Choose Laboratory", "Select Request Type", "Select Schedule Type", "Schedule & Room Availability", "Equipment & Materials", "Review Information"];
  const stepDescriptions = ["Select the laboratory where you want to make a service request.", "Choose the type of reservation you want to make.", "Choose when you want to schedule your laboratory session.", "Check the room's regular schedules and existing requests, then choose your session block.", "Add any equipment, materials, or special setup needed for your laboratory session.", "Review your request details and approval recipient before submitting."];

  function editStep(target: 1 | 2 | 3 | 4 | 5) {
    if (receipt) return;
    setConfirmed(false);
    setStep(target);
  }

  async function submitDemoRequest() {
    if (submissionLock.current || !confirmed || receipt || reviewError) return;
    submissionLock.current = true; setSubmitting(true); setSubmitError("");
    try {
      const response = await fetch("/api/demo/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not submit the request.");
      setReceipt({ reference: data.request.reference, snapshot: data.request.snapshot });
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Could not submit the request. Try again."); }
    finally { submissionLock.current = false; setSubmitting(false); }
  }

  function startNewRequest() {
    setSubmitError("");
    setReceipt(null);
    setConfirmed(false);
    setApprover(null);
    setLaboratory("circuits");
    setRequestType(null);
    setGroupStudents([{ rowId: 1, name: "", studentId: "" }]);
    setIndividualStudent({ name: "", studentId: "" });
    nextStudentRowId.current = 2;
    setScheduleType("ON_SCHEDULE");
    setScheduleDraft(createScheduleDraft("circuits", "ON_SCHEDULE", undefined, undefined, scheduleData.classes));
    setItems([]);
    nextItemRowId.current = 1;
    setNotes("");
    setStep(1);
  }

  function addGroupStudent() {
    const row = { rowId: nextStudentRowId.current++, name: "", studentId: "" };
    setGroupStudents((previous) => [...previous, row]);
  }

  function addRequestedItem(catalogId?: string) {
    const rowId = nextItemRowId.current++;
    setItems((previous) => catalogId ? addCatalogItem(previous, catalogId, laboratory, rowId) : [...previous, { rowId, kind: "Equipment", name: "", quantity: 1 }]);
    setConfirmed(false);
  }

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    heading.current?.focus({ preventScroll: true });
    activeStep.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [step]);

  useEffect(() => {
    if (receipt) receiptHeading.current?.focus();
  }, [receipt]);

  useEffect(() => {
    if (!scheduleData.loading && scheduleType === "ON_SCHEDULE" && !receipt) setScheduleDraft((current) => createScheduleDraft(laboratory, scheduleType, current.date, current.classId, scheduleData.classes));
  }, [scheduleData.official]);

  return <main className="classrep-request-page" aria-labelledby="request-page-title">
    <nav className="request-progress" aria-label="Laboratory service request progress" tabIndex={0}>
      <ol className="request-steps">
        {requestSteps.map((label, index) => <li key={label} ref={index + 1 === step ? activeStep : undefined} className={index + 1 === step ? "is-current" : index + 1 < step ? "is-complete" : ""} aria-current={index + 1 === step ? "step" : undefined}>
          <span className="request-step-number" aria-hidden="true">{index + 1 < step ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg> : index + 1}</span>
          <span className="request-step-label"><span className="sr-only">Step {index + 1}: </span>{label}</span>
        </li>)}
      </ol>
    </nav>

    <header className="request-page-heading">
      <h1 id="request-page-title">Create a Laboratory Service Request</h1>
      <p>Submit a request for laboratory equipment, materials, or special setup for your laboratory sessions.</p>
    </header>

    <section className={`request-laboratory-panel ${step > 1 ? "request-type-panel" : ""}`} aria-labelledby="request-step-title">
      <header className="request-laboratory-heading">
        <h2 ref={heading} id="request-step-title" tabIndex={-1}>{stepTitles[step - 1]}</h2>
        <p>{stepDescriptions[step - 1]}</p>
      </header>

      {step === 1 ? <RequestLaboratoryChoices laboratory={laboratory} onChange={(id) => { if (id !== laboratory) { setLaboratory(id); setScheduleDraft(createScheduleDraft(id, scheduleType, scheduleDraft.date, undefined, scheduleData.classes)); setItems((previous) => itemsForLaboratory(previous, id)); setApprover(null); setConfirmed(false); } }} /> : step === 2 ? <><fieldset className="request-type-options">
        <legend className="sr-only">Select a request type</legend>
        {requestTypes.map(({ id, name, icon, description, guidance }) => <label key={id} className={`request-type-option ${requestType === id ? "is-selected" : ""}`}>
          <input type="radio" name="request-type" value={id} checked={requestType === id} onChange={() => setRequestType(id)} required />
          <span className="request-type-icon"><LabIcon name={icon} /></span>
          <strong>{name}</strong>
          <span className="request-type-description">{description}</span>
          <span className="request-type-guidance" role="list">{guidance.map((text) => <span key={text} role="listitem">{text}</span>)}</span>
        </label>)}
      </fieldset>
        {requestType && <RequestStudentFields requestType={requestType} groupStudents={groupStudents} individualStudent={individualStudent}
          onGroupStudentChange={(rowId, details) => setGroupStudents((previous) => previous.map((row) => row.rowId === rowId ? { ...row, ...details } : row))}
          onIndividualStudentChange={(details) => setIndividualStudent((previous) => ({ ...previous, ...details }))}
          onAddStudent={addGroupStudent}
          onRemoveStudent={(rowId) => setGroupStudents((previous) => previous.length > 1 ? previous.filter((row) => row.rowId !== rowId) : previous)} />}
      </> : step === 3 ? <>
        <fieldset className="request-type-options request-schedule-options">
          <legend className="sr-only">Select a schedule type</legend>
          {scheduleTypes.map(({ id, name, icon, description, guidance }) => <label key={id} className={`request-type-option ${scheduleType === id ? "is-selected" : ""}`}>
            <input type="radio" name="schedule-type" value={id} checked={scheduleType === id} onChange={() => { if (id !== scheduleType) { setScheduleType(id); setApprover(null); setScheduleDraft(createScheduleDraft(laboratory, id, scheduleDraft.date, scheduleDraft.classId, scheduleData.classes)); } }} required />
            <span className="request-type-icon"><LabIcon name={icon} /></span>
            <strong>{name}</strong>
            <span className="request-type-description">{description}</span>
            <span className="request-type-guidance" role="list">{guidance.map((text) => <span key={text} role="listitem">{text}</span>)}</span>
          </label>)}
        </fieldset>
        <aside className="request-approval-route" aria-live="polite" aria-atomic="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#2587ff" /><circle cx="12" cy="6.5" r="1" fill="white" /><path d="M12 10v7" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
          <div><strong>Approval Route</strong><p>{scheduleType === "ON_SCHEDULE" ? "This request will be sent to your assigned Faculty for approval." : "Choose your assigned Faculty or the Dean as the approval recipient in Review Information."}</p></div>
        </aside>
      </> : step === 4 ? <RequestRoomAvailability laboratory={laboratory} scheduleType={scheduleType} draft={scheduleDraft} official={scheduleData.official} reservations={scheduleData.reservations} classes={scheduleData.classes} loading={scheduleData.loading} loadError={scheduleData.error} onRefresh={scheduleData.refresh} onChange={setScheduleDraft} /> : step === 5 ? <RequestEquipmentFields laboratory={laboratory} items={items} notes={notes}
        onAdd={addRequestedItem}
        onChange={(rowId, patch) => { setItems((previous) => previous.map((item) => item.rowId === rowId ? { ...item, ...patch, rowId } : item)); setConfirmed(false); }}
        onRemove={(rowId) => { setItems((previous) => previous.filter((item) => item.rowId !== rowId)); setConfirmed(false); }}
        onNotesChange={(value) => { setNotes(value); setConfirmed(false); }} /> : <>
          {receipt && <section className="request-demo-receipt" aria-labelledby="request-receipt-title" role="status">
            <h3 ref={receiptHeading} id="request-receipt-title" tabIndex={-1}>Demo Request Submitted</h3>
            <p>Reference: <strong>{receipt.reference}</strong></p>
            <p>Selected approver: <strong>{receipt.snapshot.recipient.name}{receipt.snapshot.recipient.role === "FACULTY" ? " (Faculty)" : ""}</strong></p>
            <p>The requested room time is blocked in the demo calendar while this request is pending. No notification was sent.</p><Link href="/dashboard/classrep/my-reservations">View Request Status</Link>
          </section>}
          <RequestInformationReview draft={receipt?.snapshot ?? draft} classes={scheduleData.classes} confirmed={confirmed} locked={Boolean(receipt)}
            onApproverChange={(recipient) => { setApprover(recipient); setConfirmed(false); }} onConfirmedChange={setConfirmed} onEdit={editStep} />
          {!receipt && reviewError && <p className="request-review-error" role="status">{reviewError}</p>}
        </>}

      {submitError && <p className="request-review-error" role="alert">{submitError}</p>}
      <footer className="request-laboratory-actions" inert={submitting}>
        {receipt ? <>
          <Link href="/dashboard/classrep" className="request-cancel-button">Back to Dashboard</Link>
          <button type="button" className="request-next-button" onClick={startNewRequest}>Create Another Request</button>
        </> : step === 1 ? <>
          <Link href="/dashboard/classrep" className="request-cancel-button">Cancel</Link>
          <button type="button" className="request-next-button" onClick={() => setStep(2)}>Next: Choose Request Type <LabIcon name="arrow" /></button>
        </> : step === 2 ? <>
          <button type="button" className="request-back-button" onClick={() => setStep(1)}><LabIcon name="arrow" />Back</button>
          <button type="button" className="request-next-button" disabled={!canContinueToSchedule} title={canContinueToSchedule ? undefined : requestType ? "Enter a student name and unique NU Student ID in YYYY-NNNNNNN format in every row to continue." : "Select a request type to continue."} onClick={() => { if (canContinueToSchedule) setStep(3); }}>Next: Schedule Type <LabIcon name="arrow" /></button>
        </> : step === 3 ? <>
          <button type="button" className="request-back-button" onClick={() => setStep(2)}><LabIcon name="arrow" />Back</button>
          <button type="button" className="request-next-button" onClick={() => setStep(4)}>Next: Schedule &amp; Room <LabIcon name="arrow" /></button>
        </> : step === 4 ? <>
          <button type="button" className="request-back-button" onClick={() => setStep(3)}><LabIcon name="arrow" />Back</button>
          <button type="button" className="request-next-button" disabled={Boolean(scheduleError)} title={scheduleError ?? undefined} onClick={() => { if (!scheduleError) setStep(5); }}>Next: Equipment &amp; Materials <LabIcon name="arrow" /></button>
        </> : step === 5 ? <>
          <button type="button" className="request-back-button" onClick={() => setStep(4)}><LabIcon name="arrow" />Back</button>
          <button type="button" className="request-next-button" disabled={Boolean(itemsError)} title={itemsError ?? undefined} onClick={() => { if (!itemsError) { setConfirmed(false); setStep(6); } }}>Next: Review Information <LabIcon name="arrow" /></button>
        </> : <>
          <button type="button" className="request-back-button" onClick={() => editStep(5)}><LabIcon name="arrow" />Back</button>
          <button type="button" className="request-next-button" disabled={!canSubmit} title={reviewError ?? (!confirmed ? "Confirm that you have reviewed the request details." : undefined)} onClick={submitDemoRequest}>{submitting ? "Submitting…" : "Submit Demo Request"} <LabIcon name="arrow" /></button>
        </>}
      </footer>
    </section>
  </main>;
}
