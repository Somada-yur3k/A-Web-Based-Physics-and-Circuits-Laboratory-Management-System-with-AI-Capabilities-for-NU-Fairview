export type RequestType = "GROUP" | "STUDENT_ONLY";
export type StudentDetails = { name: string; studentId: string };
export type GroupStudentRow = StudentDetails & { rowId: number };

// Assigned section for the demo account; replace with its actual class context.
export const demoRequestClass = { section: "BSIT 2A" };

export function isStudentDetailsComplete(student: StudentDetails): boolean {
  return student.name.trim().length > 0 && student.name.length <= 120 && isNuStudentId(student.studentId);
}

export function areParticipantDetailsValid(requestType: RequestType | null, students: readonly StudentDetails[]): boolean {
  if (requestType !== "GROUP" && requestType !== "STUDENT_ONLY") return false;
  if (!students.length || (requestType === "STUDENT_ONLY" && students.length !== 1)) return false;
  if (!students.every(isStudentDetailsComplete)) return false;
  const studentIds = students.map((student) => student.studentId.trim().toLowerCase());
  if (new Set(studentIds).size !== studentIds.length) return false;
  return true;
}
import { isNuStudentId } from "@/features/students/nu-student-id";
