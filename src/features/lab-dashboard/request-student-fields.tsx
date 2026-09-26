import LabIcon from "@/components/dashboard/lab-icon";
import { NU_STUDENT_ID_EXAMPLE, NU_STUDENT_ID_MAX_LENGTH, NU_STUDENT_ID_PATTERN } from "@/features/students/nu-student-id";
import { demoRequestClass, isStudentDetailsComplete, type GroupStudentRow, type RequestType, type StudentDetails } from "./request-participants";

type StudentFieldsProps = {
  requestType: RequestType;
  groupStudents: GroupStudentRow[];
  individualStudent: StudentDetails;
  onGroupStudentChange: (rowId: number, details: Partial<StudentDetails>) => void;
  onIndividualStudentChange: (details: Partial<StudentDetails>) => void;
  onAddStudent: () => void;
  onRemoveStudent: (rowId: number) => void;
};

export default function RequestStudentFields({ requestType, groupStudents, individualStudent, onGroupStudentChange, onIndividualStudentChange, onAddStudent, onRemoveStudent }: StudentFieldsProps) {
  const isGroup = requestType === "GROUP";
  const rows = isGroup ? groupStudents : [{ rowId: 0, ...individualStudent }];
  const completedCount = rows.filter(isStudentDetailsComplete).length;

  return <section className="request-students-panel" aria-labelledby="request-students-title">
    <header className="request-students-heading">
      <div><h2 id="request-students-title">{isGroup ? "Group Students" : "Student Information"}</h2><p>{isGroup ? "Enter the name and NU Student ID for each participating student." : "Enter the name and NU Student ID of the student using the laboratory."} Section is fixed to your assigned class.</p></div>
      <span className="request-class-badge">Section: {demoRequestClass.section}</span>
    </header>

    <div className="request-student-rows">
      {rows.map(({ rowId, name, studentId }, index) => {
        const fieldId = isGroup ? `request-group-student-${rowId}` : "request-individual-student";
        return <fieldset key={fieldId} className="request-student-row">
          <legend className="sr-only">{isGroup ? `Student ${index + 1}` : "Student details"}</legend>
          <div className="request-student-row-heading"><strong>{isGroup ? `Student ${index + 1}` : "Student Details"}</strong>{isGroup && rows.length > 1 && <button type="button" className="request-remove-student" aria-label={`Remove Student ${index + 1}`} onClick={() => onRemoveStudent(rowId)}><LabIcon name="trash" />Remove</button>}</div>
          <div className="request-student-fields">
            <div className="request-student-field">
              <label htmlFor={`${fieldId}-name`}>Student Name <span aria-hidden="true">*</span></label>
              <input id={`${fieldId}-name`} name={`${fieldId}-name`} type="text" value={name} placeholder="Enter student's full name" autoComplete="off" maxLength={120} required onChange={(event) => isGroup ? onGroupStudentChange(rowId, { name: event.target.value }) : onIndividualStudentChange({ name: event.target.value })} />
            </div>
            <div className="request-student-field"><label htmlFor={`${fieldId}-id`}>NU Student ID <span aria-hidden="true">*</span></label><input id={`${fieldId}-id`} name={`${fieldId}-id`} type="text" value={studentId} placeholder={`e.g. ${NU_STUDENT_ID_EXAMPLE}`} autoComplete="off" spellCheck={false} maxLength={NU_STUDENT_ID_MAX_LENGTH} pattern={NU_STUDENT_ID_PATTERN} title={`Use YYYY-NNNNNNN, e.g. ${NU_STUDENT_ID_EXAMPLE}`} aria-describedby={`${fieldId}-id-format`} required onChange={(event) => isGroup ? onGroupStudentChange(rowId, { studentId: event.target.value }) : onIndividualStudentChange({ studentId: event.target.value })} /><small id={`${fieldId}-id-format`}>Format: {NU_STUDENT_ID_EXAMPLE}</small></div>
            <div className="request-student-field"><label htmlFor={`${fieldId}-section`}>Section</label><input id={`${fieldId}-section`} value={demoRequestClass.section} readOnly /></div>
          </div>
        </fieldset>;
      })}
    </div>

    <footer className="request-students-footer">
      {isGroup && <button type="button" className="request-add-student" onClick={onAddStudent}><LabIcon name="plus" />Add Student</button>}
      <p role="status">{completedCount} {completedCount === 1 ? "student" : "students"} entered{isGroup ? ` · ${demoRequestClass.section}` : " · Student Only"}</p>
    </footer>
  </section>;
}
