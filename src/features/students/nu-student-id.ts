export const NU_STUDENT_ID_EXAMPLE = "2024-1031816";
export const NU_STUDENT_ID_PATTERN = "[0-9]{4}-[0-9]{7}";
export const NU_STUDENT_ID_MAX_LENGTH = 12;

const studentIdPattern = new RegExp(`^${NU_STUDENT_ID_PATTERN}$`);

export function isNuStudentId(value: string): boolean {
  return studentIdPattern.test(value.trim());
}
