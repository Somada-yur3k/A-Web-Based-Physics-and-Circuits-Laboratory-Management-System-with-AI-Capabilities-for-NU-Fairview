import { departmentOptions, sectionOptions } from "./form-options";
import { isNuStudentId, NU_STUDENT_ID_EXAMPLE } from "@/features/students/nu-student-id";
import type { Account, AccountRole, Laboratory, SubjectClassAssignment } from "./types";

export function buildAccountFromForm(data: FormData, role: AccountRole, accounts: Account[], classes: SubjectClassAssignment[], existing?: Account): { account: Account } | { error: string } {
  const value = (key: string) => String(data.get(key) ?? "").trim();
  const firstName = value("firstName"), middleName = value("middleName"), lastName = value("lastName");
  const email = value("email").toLowerCase(), contactNumber = value("contactNumber");
  if (!firstName || !lastName || !email) return { error: "Please complete the first name, last name, and email address." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  const phoneDigits = contactNumber.replace(/\D/g, "");
  if (!/^\+?[\d\s()-]+$/.test(contactNumber) || phoneDigits.length < 10 || phoneDigits.length > 15) return { error: "Please enter a valid contact number with 10 to 15 digits." };
  if (accounts.some((member) => member.id !== existing?.id && member.email.toLowerCase() === email)) return { error: "This email address is already assigned to an account." };
  const laboratory = value("laboratory");
  if (laboratory !== "Physics Lab" && laboratory !== "Circuits Lab") return { error: "Please select an assigned laboratory." };
  const status = value("status");
  if (status !== "active" && status !== "inactive") return { error: "Please select an account status." };
  const base = { id: existing?.id ?? crypto.randomUUID(), firstName, middleName, lastName, fullName: [firstName, middleName, lastName].filter(Boolean).join(" "), email, contactNumber, notes: value("notes"), status, createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10) };
  if (role === "faculty") {
    const department = value("department");
    const assignedSections = [...new Set(data.getAll("assignedSections").map(String))];
    if (!departmentOptions.includes(department)) return { error: "Please select a department or program." };
    if (assignedSections.length === 0 || assignedSections.some((section) => !sectionOptions.includes(section))) return { error: "Please select at least one assigned section." };
    if (accounts.some((member) => member.role === "classrep" && member.facultyId === existing?.id && (!assignedSections.includes(member.section) || laboratory !== member.laboratory))) return { error: "This assignment is used by a Class Representative. Reassign that account before changing its faculty's laboratory or section." };
    return { account: { ...base, status, role, department, assignedSections, laboratory: laboratory as Laboratory } };
  }
  const section = value("section"), accountId = value("accountId"), facultyId = value("facultyId"), subjectClassId = value("subjectClassId");
  if (!sectionOptions.includes(section) || !accountId || !facultyId || !subjectClassId) return { error: "Please complete the NU Student ID, section, designated faculty, and existing subject / class assignment." };
  if (!isNuStudentId(accountId)) return { error: `Enter a NU Student ID in YYYY-NNNNNNN format (e.g. ${NU_STUDENT_ID_EXAMPLE}).` };
  const faculty = accounts.find((member) => member.id === facultyId && member.role === "faculty");
  if (!faculty || faculty.role !== "faculty" || !faculty.assignedSections.includes(section) || faculty.laboratory !== laboratory || (faculty.status !== "active" && !(existing?.role === "classrep" && existing.facultyId === facultyId))) return { error: "Choose an active faculty member assigned to this section and laboratory." };
  if (!classes.some((assignment) => assignment.id === subjectClassId && assignment.facultyId === facultyId && assignment.section === section && assignment.laboratory === laboratory)) return { error: "Choose an existing subject / class matching the selected section, faculty, and laboratory." };
  if (accounts.some((member) => member.role === "classrep" && member.id !== existing?.id && member.accountId.toLowerCase() === accountId.toLowerCase())) return { error: "This NU Student ID is already assigned to an account." };
  if (status === "active" && accounts.some((member) => member.role === "classrep" && member.id !== existing?.id && member.status === "active" && member.section === section)) return { error: "This section already has an active Class Representative." };
  return { account: { ...base, status, role, section, accountId, facultyId, laboratory: laboratory as Laboratory, subjectClassId } };
}
