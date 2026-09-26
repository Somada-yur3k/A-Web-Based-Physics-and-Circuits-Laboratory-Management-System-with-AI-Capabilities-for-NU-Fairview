"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import { NU_STUDENT_ID_EXAMPLE, NU_STUDENT_ID_MAX_LENGTH, NU_STUDENT_ID_PATTERN } from "@/features/students/nu-student-id";
import { buildAccountFromForm } from "./account-form-data";
import { demoSubjectClasses } from "./demo-data";
import { departmentOptions, sectionOptions } from "./form-options";
import type { Account, AccountRole, FacultyAccount } from "./types";

export type AccountDialogState = { mode: "create"; role: AccountRole } | { mode: "edit" | "delete"; account: Account };

function FieldLabel({ htmlFor, children, optional = false }: { htmlFor: string; children: ReactNode; optional?: boolean }) {
  return <label htmlFor={htmlFor}>{children}{optional ? <span className="account-optional"> (Optional)</span> : <span className="account-required" aria-hidden="true"> *</span>}</label>;
}

export default function AccountDialog({ state, accounts, onClose, onSave, onDelete }: {
  state: AccountDialogState; accounts: Account[]; onClose: () => void;
  onSave: (account: Account) => void; onDelete: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const existing = state.mode === "create" ? undefined : state.account;
  const role = state.mode === "create" ? state.role : state.account.role;
  const isFaculty = role === "faculty";
  const roleLabel = isFaculty ? "Faculty" : "Class Representative";
  const [assignedSections, setAssignedSections] = useState(existing?.role === "faculty" ? existing.assignedSections : []);
  const [section, setSection] = useState(existing?.role === "classrep" ? existing.section : "");
  const [facultyId, setFacultyId] = useState(existing?.role === "classrep" ? existing.facultyId : "");
  const [laboratory, setLaboratory] = useState(existing?.laboratory ?? "");
  const [subjectClassId, setSubjectClassId] = useState(existing?.role === "classrep" ? existing.subjectClassId : "");
  const faculty = accounts.filter((account): account is FacultyAccount => account.role === "faculty");
  const availableFaculty = faculty.filter((member) => member.assignedSections.includes(section) && (!laboratory || member.laboratory === laboratory) && (member.status === "active" || (existing?.role === "classrep" && existing.facultyId === member.id)));
  const availableClasses = demoSubjectClasses.filter((assignment) => assignment.section === section && assignment.facultyId === facultyId && assignment.laboratory === laboratory);
  const linkedRepresentatives = existing?.role === "faculty" ? accounts.filter((account) => account.role === "classrep" && account.facultyId === existing.id) : [];

  useEffect(() => { dialog.current?.showModal(); }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = buildAccountFromForm(new FormData(event.currentTarget), role, accounts, demoSubjectClasses, existing);
    if ("error" in result) { setError(result.error); return; }
    onSave(result.account);
  }

  const subtitle = state.mode === "delete" ? "Review the account before removing it." : isFaculty ? "Enter faculty information and laboratory assignment." : "Enter class representative information and assignment details.";
  return <dialog ref={dialog} className={`account-dialog ${state.mode === "delete" ? "account-delete-dialog" : "account-profile-dialog"}`} aria-labelledby="account-dialog-title" aria-describedby="account-dialog-description" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="account-dialog-heading"><div><h2 id="account-dialog-title">{state.mode === "delete" ? "Delete account" : `${state.mode === "edit" ? "Edit" : "Create"} ${roleLabel} Account`}</h2><p id="account-dialog-description">{subtitle}</p></div><button type="button" className="admin-icon-button" onClick={() => dialog.current?.close()} aria-label="Close account dialog"><AdminIcon name="close" /></button></div>
    {state.mode === "delete" ? <div className="account-delete-body">
      <p>Remove <strong>{state.account.fullName}</strong> from the demo accounts?</p>
      {linkedRepresentatives.length > 0 ? <p className="account-form-error" role="alert">This faculty is assigned to {linkedRepresentatives.length} class representative account{linkedRepresentatives.length === 1 ? "" : "s"}. Reassign them before deleting this faculty account.</p> : <p className="account-form-help">This removes the preview record. Changes reset when you reload the page.</p>}
      <div className="account-dialog-actions"><button type="button" className="admin-secondary-button" onClick={() => dialog.current?.close()}>Cancel</button><button type="button" className="admin-danger-button" disabled={linkedRepresentatives.length > 0} onClick={() => onDelete(state.account.id)}>Delete account</button></div>
    </div> : <form className="account-form" onSubmit={submit} onChange={() => setError("")}>
      <div className="account-form-grid">
        <div className="account-form-field"><FieldLabel htmlFor="account-first-name">First Name</FieldLabel><input autoFocus id="account-first-name" name="firstName" autoComplete="off" required maxLength={60} defaultValue={existing?.firstName} placeholder="Enter first name" /></div>
        <div className="account-form-field"><FieldLabel htmlFor="account-middle-name" optional>Middle Name</FieldLabel><input id="account-middle-name" name="middleName" autoComplete="off" maxLength={60} defaultValue={existing?.middleName} placeholder="Enter middle name" /></div>
        <div className="account-form-field"><FieldLabel htmlFor="account-last-name">Last Name</FieldLabel><input id="account-last-name" name="lastName" autoComplete="off" required maxLength={80} defaultValue={existing?.lastName} placeholder="Enter last name" /></div>
        {isFaculty ? <div className="account-form-field"><FieldLabel htmlFor="account-email">NU Fairview Email</FieldLabel><input id="account-email" name="email" type="email" autoComplete="off" required maxLength={254} defaultValue={existing?.email} placeholder="name@nu-fairview.edu.ph" /></div> : <div className="account-form-field"><FieldLabel htmlFor="account-student-id">NU Student ID</FieldLabel><input id="account-student-id" name="accountId" type="text" autoComplete="off" spellCheck={false} required maxLength={NU_STUDENT_ID_MAX_LENGTH} pattern={NU_STUDENT_ID_PATTERN} title={`Use YYYY-NNNNNNN, e.g. ${NU_STUDENT_ID_EXAMPLE}`} aria-describedby="account-student-id-format" defaultValue={existing?.role === "classrep" ? existing.accountId : ""} placeholder={`e.g. ${NU_STUDENT_ID_EXAMPLE}`} /><small id="account-student-id-format">Format: {NU_STUDENT_ID_EXAMPLE}</small></div>}
        {isFaculty ? <div className="account-form-field"><FieldLabel htmlFor="account-department">Department / Program</FieldLabel><select id="account-department" name="department" required defaultValue={existing?.role === "faculty" ? existing.department : ""}><option value="" disabled>Select department or program</option>{departmentOptions.map((department) => <option key={department}>{department}</option>)}</select></div> : <>
          <div className="account-form-field"><FieldLabel htmlFor="account-email">Student Email</FieldLabel><input id="account-email" name="email" type="email" autoComplete="off" required maxLength={254} defaultValue={existing?.email} placeholder="lastname@student.nu-fairview.edu.ph" /></div>
          <div className="account-form-field"><FieldLabel htmlFor="account-section">Section</FieldLabel><select id="account-section" name="section" required value={section} onChange={(event) => { setSection(event.target.value); setFacultyId(""); setLaboratory(""); setSubjectClassId(""); }}><option value="" disabled>Select section</option>{sectionOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="account-form-field"><FieldLabel htmlFor="account-faculty">Designated Faculty</FieldLabel><select id="account-faculty" name="facultyId" required value={facultyId} disabled={!section} onChange={(event) => { const id = event.target.value; setFacultyId(id); setLaboratory(faculty.find((member) => member.id === id)?.laboratory ?? ""); setSubjectClassId(""); }}><option value="" disabled>{!section ? "Select section first" : availableFaculty.length ? "Select faculty member" : "No assigned faculty available"}</option>{availableFaculty.map((member) => <option key={member.id} value={member.id}>{member.fullName}{member.status === "inactive" ? " (Inactive)" : ""}</option>)}</select></div>
        </>}
        <div className="account-form-field"><FieldLabel htmlFor="account-laboratory">Assigned Laboratory</FieldLabel><select id="account-laboratory" name="laboratory" required value={laboratory} onChange={(event) => { const next = event.target.value; setLaboratory(next); if (!isFaculty && faculty.find((member) => member.id === facultyId)?.laboratory !== next) { setFacultyId(""); } setSubjectClassId(""); }}><option value="" disabled>Select laboratory</option><option value="Physics Lab">Physics Laboratory</option><option value="Circuits Lab">Circuits Laboratory</option></select></div>
        {isFaculty ? <fieldset className="account-section-picker account-field-wide"><legend id="account-sections-label">Assigned Sections<span className="account-required" aria-hidden="true"> *</span></legend><details><summary aria-label={`Assigned Sections: ${assignedSections.length ? assignedSections.join(", ") : "Select sections"}`}><span className={assignedSections.length ? "" : "account-select-placeholder"}>{assignedSections.length > 2 ? `${assignedSections.length} sections selected` : assignedSections.join(", ") || "Select sections"}</span><AdminIcon name="chevron" /></summary><div className="account-section-options" role="group" aria-labelledby="account-sections-label">{sectionOptions.map((item) => <label key={item}><input type="checkbox" name="assignedSections" value={item} checked={assignedSections.includes(item)} onChange={(event) => setAssignedSections((previous) => event.target.checked ? [...previous, item] : previous.filter((selected) => selected !== item))} /><span>{item}</span></label>)}</div></details></fieldset> : <div className="account-form-field"><FieldLabel htmlFor="account-subject-class">Existing Subject / Class Assignment</FieldLabel><select id="account-subject-class" name="subjectClassId" required value={subjectClassId} disabled={!facultyId || !laboratory} onChange={(event) => setSubjectClassId(event.target.value)} aria-describedby={facultyId && laboratory && availableClasses.length === 0 ? "account-class-help" : undefined}><option value="" disabled>{!facultyId ? "Select faculty first" : availableClasses.length ? "Select subject or class" : "No matching class assignment"}</option>{availableClasses.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.subjectCode} - {assignment.subjectName} ({assignment.section})</option>)}</select>{facultyId && laboratory && availableClasses.length === 0 && <small id="account-class-help">An existing class assignment is required for this section, faculty, and laboratory.</small>}</div>}
        <div className="account-form-field"><FieldLabel htmlFor="account-contact">Contact Number</FieldLabel><input id="account-contact" name="contactNumber" type="tel" autoComplete="off" required maxLength={25} defaultValue={existing?.contactNumber} placeholder="e.g. 0917 123 4567" /></div>
        <div className={`account-form-field ${isFaculty ? "" : "account-field-wide"}`}><FieldLabel htmlFor="account-status">Account Status</FieldLabel><select id="account-status" name="status" required defaultValue={existing?.status ?? "active"}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <div className="account-form-field account-field-wide"><FieldLabel htmlFor="account-notes" optional>Notes / Remarks</FieldLabel><textarea id="account-notes" name="notes" rows={3} maxLength={2000} defaultValue={existing?.notes} placeholder="Add any additional notes or remarks..." /></div>
      </div>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <footer className="account-form-footer"><p><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v7M12 6v2" /></svg><span>{isFaculty ? "Faculty sign in with their NU email. Temporary passwords will be issued after account provisioning is connected." : "The NU Student ID is the sign-in ID. Temporary passwords will be issued after account provisioning is connected."}</span></p><div className="account-dialog-actions"><button type="button" className="admin-secondary-button" onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" className="admin-primary-button">{state.mode === "edit" ? "Save Changes" : `Create ${roleLabel} Account`}</button></div></footer>
    </form>}
  </dialog>;
}
