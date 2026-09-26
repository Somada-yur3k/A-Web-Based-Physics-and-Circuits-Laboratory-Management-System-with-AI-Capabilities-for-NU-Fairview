export const departmentOptions = ["Electrical Engineering", "Electronics Engineering", "Information Technology", "Computer Science"];
export const sectionOptions = Array.from({ length: 35 }, (_, index) => `${index % 4 < 2 ? "IT" : "ECE"} - ${241 + index}`);
