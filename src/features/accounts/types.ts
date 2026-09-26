export type AccountStatus = "active" | "inactive";
export type AccountRole = "faculty" | "classrep";
export type Laboratory = "Physics Lab" | "Circuits Lab";

type BaseAccount = {
  id: string; firstName: string; middleName: string; lastName: string; fullName: string;
  email: string; contactNumber: string; notes: string; status: AccountStatus; createdAt: string;
};
export type FacultyAccount = BaseAccount & { role: "faculty"; department: string; laboratory: Laboratory; assignedSections: string[] };
export type ClassRepAccount = BaseAccount & { role: "classrep"; section: string; accountId: string; facultyId: string; laboratory: Laboratory; subjectClassId: string };
export type Account = FacultyAccount | ClassRepAccount;

export type SubjectClassAssignment = { id: string; subjectCode: string; subjectName: string; section: string; facultyId: string; laboratory: Laboratory };

// UI records only. Supabase Auth credentials must be created on the server,
// never included in these records or generated in the browser.
