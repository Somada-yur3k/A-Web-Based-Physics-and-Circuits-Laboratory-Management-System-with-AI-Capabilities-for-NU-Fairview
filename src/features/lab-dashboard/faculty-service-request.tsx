"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import LabIcon from "@/components/dashboard/lab-icon";
import RequestLaboratoryChoices from "./request-laboratory-choices";
import RequestRoomAvailability from "./request-room-availability";
import RequestEquipmentFields from "./request-equipment-fields";
import FacultyRequestReview from "./faculty-request-review";
import { addCatalogItem, itemsForLaboratory } from "./equipment-catalog";
import useRequestProgress from "./use-request-progress";
import useOfficialSchedule from "./use-official-schedule";
import { createScheduleDraft, scheduleDraftError, type RequestLaboratory, type RequestScheduleType, type ScheduleDraft } from "./room-availability";
import { requestedItemsError, type RequestedItem } from "./request-review";
import { facultyRequestError, facultyRequestSteps, type FacultyActivityType, type FacultyDemoSnapshot, type FacultyRequestDraft, type FacultyRequestStep } from "./faculty-request-model";
import "./laboratory-service-request.css";
import "./request-information-review.css";

const headings: Record<FacultyRequestStep, { title: string; description: string; progress: string }> = {
  laboratory: { title: "Choose Laboratory", progress: "Choose Laboratory", description: "Select the laboratory where you want to make a service request." },
  activity: { title: "Select Activity Type", progress: "Activity Type", description: "Choose whether this request is for a laboratory activity." },
  "schedule-type": { title: "Select Schedule Type", progress: "Schedule Type", description: "Choose when you want to schedule your non-laboratory activity." },
  schedule: { title: "Schedule & Room Availability", progress: "Schedule & Room Availability", description: "Check regular schedules and existing requests, then select your session block." },
  equipment: { title: "Equipment & Materials", progress: "Equipment & Materials", description: "Add equipment, materials, or special setup needed for your session." },
  review: { title: "Review Information", progress: "Review Information", description: "Review your request details before submitting." },
};
const activityChoices = [
  { id: "LABORATORY_ACTIVITY", name: "Laboratory Activity", icon: "calendar", description: "Request services for an activity in your assigned laboratory class.", guidance: ["Use your assigned class schedule and room.", "No academic approval is required."] },
  { id: "NON_LABORATORY_ACTIVITY", name: "Non-Laboratory Activity", icon: "request", description: "Request laboratory services for another activity.", guidance: ["Choose On-Schedule or Out-of-Schedule.", "Out-of-Schedule requests require Dean approval."] },
] as const;
const scheduleChoices = [
  { id: "ON_SCHEDULE", name: "On-Schedule", icon: "calendar", description: "Use your existing assigned class schedule and laboratory block.", guidance: ["Follow your assigned class schedule and room.", "No academic approval is required."] },
  { id: "OUT_OF_SCHEDULE", name: "Out-of-Schedule", icon: "calendar-plus", description: "Request a session outside your assigned class schedule.", guidance: ["Select an available room and time block.", "The Dean must approve this request."] },
] as const;

export default function FacultyServiceRequest() {
  const scheduleData = useOfficialSchedule();
  const [step, setStep] = useState<FacultyRequestStep>("laboratory");
  const [laboratory, setLaboratory] = useState<RequestLaboratory>("circuits");
  const [activityType, setActivityType] = useState<FacultyActivityType | null>(null);
  const [scheduleType, setScheduleType] = useState<RequestScheduleType>("ON_SCHEDULE");
  const [schedule, setSchedule] = useState<ScheduleDraft>(() => createScheduleDraft("circuits", "ON_SCHEDULE"));
  const [items, setItems] = useState<RequestedItem[]>([]);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [receipt, setReceipt] = useState<{ reference: string; snapshot: FacultyDemoSnapshot } | null>(null);
  const nextItemId = useRef(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const activeStep = useRef<HTMLLIElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submissionLock = useRef(false);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  useRequestProgress(activeStep, step);
  const steps = facultyRequestSteps(activityType);
  const index = steps.indexOf(step);
  const nextStep = steps[index + 1];
  const draft: FacultyRequestDraft = { laboratory, activityType, scheduleType, schedule, items, notes };
  const scheduleError = scheduleData.loading ? "Loading official schedule…" : scheduleData.error || scheduleDraftError(laboratory, scheduleType, schedule, scheduleData.blocksFor(schedule), scheduleData.classes);
  const error = step === "activity" ? (!activityType ? "Choose an activity type to continue." : null) : step === "schedule" ? scheduleError : step === "equipment" ? requestedItemsError(items, notes, laboratory) : step === "review" ? scheduleData.loading ? "Loading official schedule…" : scheduleData.error || facultyRequestError(draft, scheduleData.blocksFor(schedule), scheduleData.classes) : null;

  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    heading.current?.focus({ preventScroll: true });
    activeStep.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [step]);
  useEffect(() => { if (receipt) receiptHeading.current?.focus(); }, [receipt]);
  useEffect(() => {
    if (!scheduleData.loading && scheduleType === "ON_SCHEDULE" && !receipt) setSchedule((current) => createScheduleDraft(laboratory, scheduleType, current.date, current.classId, scheduleData.classes));
  }, [scheduleData.official]);

  function editStep(target: FacultyRequestStep) {
    if (receipt || !steps.includes(target)) return;
    setConfirmed(false);
    setStep(target);
  }
  function selectActivity(value: FacultyActivityType) {
    if (activityType === value) return;
    setActivityType(value);
    setScheduleType("ON_SCHEDULE");
    setSchedule(createScheduleDraft(laboratory, "ON_SCHEDULE", schedule.date, schedule.classId, scheduleData.classes));
    setConfirmed(false);
  }
  function selectSchedule(value: RequestScheduleType) {
    if (scheduleType === value) return;
    setScheduleType(value);
    setSchedule(createScheduleDraft(laboratory, value, schedule.date, schedule.classId, scheduleData.classes));
    setConfirmed(false);
  }
  async function submit() {
    if (submissionLock.current || !confirmed || receipt || scheduleData.loading || scheduleData.error || facultyRequestError(draft, scheduleData.blocksFor(schedule), scheduleData.classes)) return;
    submissionLock.current = true; setSubmitting(true); setSubmitError("");
    try {
      const response = await fetch("/api/demo/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not submit the request.");
      setReceipt({ reference: data.request.reference, snapshot: data.request.snapshot });
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Could not submit the request. Try again."); }
    finally { submissionLock.current = false; setSubmitting(false); }
  }
  function startNew() {
    setSubmitError("");
    setReceipt(null); setConfirmed(false); setLaboratory("circuits"); setActivityType(null); setScheduleType("ON_SCHEDULE");
    setSchedule(createScheduleDraft("circuits", "ON_SCHEDULE", undefined, undefined, scheduleData.classes)); setItems([]); setNotes(""); nextItemId.current = 1; setStep("laboratory");
  }

  return <main className="classrep-request-page" aria-labelledby="request-page-title">
    <nav className="request-progress" aria-label="Faculty laboratory service request progress" tabIndex={0}>
      <ol className="request-steps" style={{ "--request-step-count": steps.length } as CSSProperties}>
        {steps.map((key, position) => <li key={key} ref={key === step ? activeStep : undefined} className={key === step ? "is-current" : position < index ? "is-complete" : ""} aria-current={key === step ? "step" : undefined}>
          <span className="request-step-number" aria-hidden="true">{position < index ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg> : position + 1}</span>
          <span className="request-step-label"><span className="sr-only">Step {position + 1}: </span>{headings[key].progress}</span>
        </li>)}
      </ol>
    </nav>
    <header className="request-page-heading"><h1 id="request-page-title">Create a Laboratory Service Request</h1><p>Request laboratory services, equipment, and materials for your faculty activities.</p></header>
    <section className={`request-laboratory-panel ${step !== "laboratory" ? "request-type-panel" : ""}`} aria-labelledby="request-step-title">
      <header className="request-laboratory-heading"><h2 ref={heading} id="request-step-title" tabIndex={-1}>{headings[step].title}</h2><p>{headings[step].description}</p></header>
      {step === "laboratory" ? <RequestLaboratoryChoices laboratory={laboratory} onChange={(value) => {
        if (value === laboratory) return;
        setLaboratory(value); setSchedule(createScheduleDraft(value, scheduleType, schedule.date, undefined, scheduleData.classes)); setItems((previous) => itemsForLaboratory(previous, value)); setConfirmed(false);
      }} /> : step === "activity" ? <fieldset className="request-type-options">
        <legend className="sr-only">Select an activity type</legend>
        {activityChoices.map((choice) => <label key={choice.id} className={`request-type-option ${activityType === choice.id ? "is-selected" : ""}`}>
          <input type="radio" name="activity-type" value={choice.id} checked={activityType === choice.id} onChange={() => selectActivity(choice.id)} required />
          <span className="request-type-icon"><LabIcon name={choice.icon} /></span><strong>{choice.name}</strong><span className="request-type-description">{choice.description}</span>
          <span className="request-type-guidance" role="list">{choice.guidance.map((text) => <span role="listitem" key={text}>{text}</span>)}</span>
        </label>)}
      </fieldset> : step === "schedule-type" ? <>
        <fieldset className="request-type-options request-schedule-options"><legend className="sr-only">Select a schedule type</legend>
          {scheduleChoices.map((choice) => <label key={choice.id} className={`request-type-option ${scheduleType === choice.id ? "is-selected" : ""}`}>
            <input type="radio" name="schedule-type" value={choice.id} checked={scheduleType === choice.id} onChange={() => selectSchedule(choice.id)} required />
            <span className="request-type-icon"><LabIcon name={choice.icon} /></span><strong>{choice.name}</strong><span className="request-type-description">{choice.description}</span>
            <span className="request-type-guidance" role="list">{choice.guidance.map((text) => <span role="listitem" key={text}>{text}</span>)}</span>
          </label>)}
        </fieldset>
        <aside className="request-approval-route" aria-live="polite"><div><strong>{scheduleType === "OUT_OF_SCHEDULE" ? "Approval Route" : "Reservation Processing"}</strong><p>{scheduleType === "OUT_OF_SCHEDULE" ? "This request will be sent to the Dean for approval." : "No academic approval is required. Wait for your reservation to be processed."}</p></div></aside>
      </> : step === "schedule" ? <RequestRoomAvailability laboratory={laboratory} scheduleType={scheduleType} draft={schedule} official={scheduleData.official} reservations={scheduleData.reservations} classes={scheduleData.classes} loading={scheduleData.loading} loadError={scheduleData.error} onRefresh={scheduleData.refresh} onChange={(value) => { setSchedule(value); setConfirmed(false); }} /> : step === "equipment" ? <RequestEquipmentFields laboratory={laboratory} items={items} notes={notes}
        onAdd={(catalogId) => { const rowId = nextItemId.current++; setItems((previous) => catalogId ? addCatalogItem(previous, catalogId, laboratory, rowId) : [...previous, { rowId, kind: "Equipment", name: "", quantity: 1 }]); setConfirmed(false); }}
        onChange={(rowId, patch) => { setItems((previous) => previous.map((item) => item.rowId === rowId ? { ...item, ...patch, rowId } : item)); setConfirmed(false); }}
        onRemove={(rowId) => { setItems((previous) => previous.filter((item) => item.rowId !== rowId)); setConfirmed(false); }}
        onNotesChange={(value) => { setNotes(value); setConfirmed(false); }} /> : <>
          {receipt && <section className="request-demo-receipt" role="status" aria-labelledby="faculty-receipt-title"><h3 ref={receiptHeading} id="faculty-receipt-title" tabIndex={-1}>Demo Request Submitted</h3><p>Reference: <strong>{receipt.reference}</strong></p><p>Demo status: <strong>{receipt.snapshot.status}</strong></p>{receipt.snapshot.recipient && <p>For approval by: <strong>Dean</strong></p>}<p>The requested room time is blocked in the demo calendar while this request is pending. No notification was sent.</p><Link href="/dashboard/faculty/reservation-status">View Request Status</Link></section>}
          <FacultyRequestReview draft={receipt?.snapshot ?? draft} classes={scheduleData.classes} confirmed={confirmed} locked={Boolean(receipt)} onConfirmedChange={setConfirmed} onEdit={editStep} />
          {!receipt && error && <p className="request-review-error" role="status">{error}</p>}
        </>}
      {submitError && <p className="request-review-error" role="alert">{submitError}</p>}
      <footer className="request-laboratory-actions" inert={submitting}>
        {receipt ? <><Link href="/dashboard/faculty" className="request-cancel-button">Back to Dashboard</Link><button type="button" className="request-next-button" onClick={startNew}>Create Another Request</button></> : <>
          {index === 0 ? <Link href="/dashboard/faculty" className="request-cancel-button">Cancel</Link> : <button type="button" className="request-back-button" onClick={() => editStep(steps[index - 1])}><LabIcon name="arrow" />Back</button>}
          {step === "review" ? <button type="button" className="request-next-button" disabled={!confirmed || Boolean(error)} title={error ?? (!confirmed ? "Confirm that you have reviewed the request details." : undefined)} onClick={submit}>{submitting ? "Submitting…" : "Submit Demo Request"} <LabIcon name="arrow" /></button> : <button type="button" className="request-next-button" disabled={Boolean(error)} title={error ?? undefined} onClick={() => { if (!error && nextStep) editStep(nextStep); }}>Next: {nextStep && headings[nextStep].progress} <LabIcon name="arrow" /></button>}
        </>}
      </footer>
    </section>
  </main>;
}
