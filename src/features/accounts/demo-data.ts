import type { Account, FacultyAccount, ClassRepAccount, SubjectClassAssignment } from "./types";
import { departmentOptions, sectionOptions } from "./form-options";

const facultyNames = ["Maria Santos", "Juan Dela Cruz", "Ana Reyes", "Mark Lopez", "Christina Banna", "Robert Tan", "Liza Mendoza", "Kevin Sy", "Patricia Cruz", "Daniel Santos", "Andrea Ramos", "Paolo Garcia", "Camille Lim", "Miguel Flores", "Sofia Torres", "Carlo Aquino", "Nicole Rivera", "Gabriel Dizon", "Isabel Villanueva", "Rafael Bautista", "Bea Navarro", "Luis Castillo", "Diana Francisco", "Marco Velasco", "Julia Santiago"];
const representativeNames = ["Patricia Lim", "Miguel Santos", "Alyanna Cruz", "Ramon Villanueva", "Isabelle Tan", "Jasper Reyes", "Nicole Garcia", "Charles Dizon", "Sofia Manalo", "Adrian Bautista", "Hannah Ramos", "Joshua Flores", "Ella Torres", "Nathan Aquino", "Chloe Rivera", "Justin Mendoza", "Alex Navarro", "Mika Castillo", "Liam Francisco", "Dana Velasco", "Sean Santiago", "Kyla Lopez", "Ethan Sy", "Ria David", "Ryan Del Rosario"];
const emailName = (name: string) => name.toLowerCase().replace(/\s/g, ".");
const dateAt = (index: number, day: number) => new Date(Date.UTC(2026, 2, day - index * 3)).toISOString().slice(0, 10);
const splitName = (fullName: string) => ({ firstName: fullName.split(" ")[0], middleName: "", lastName: fullName.split(" ").slice(1).join(" ") });

export const demoFaculty: FacultyAccount[] = facultyNames.map((fullName, index) => ({
  id: `demo-faculty-${index + 1}`, role: "faculty", fullName, ...splitName(fullName),
  email: `${emailName(fullName)}@nu-fairview.edu.ph`, department: departmentOptions[index % 3],
  laboratory: index % 2 ? "Circuits Lab" : "Physics Lab",
  assignedSections: [sectionOptions[index], sectionOptions[25 + index % 10]],
  contactNumber: `0917${1000000 + index}`, notes: "",
  status: index === 4 || index === 7 ? "inactive" : "active", createdAt: dateAt(index, 1),
}));

export const demoSubjectClasses: SubjectClassAssignment[] = demoFaculty.flatMap((faculty) => faculty.assignedSections.flatMap((section, sectionIndex) => [0, 1].map((subjectIndex) => ({
  id: `${faculty.id}-class-${sectionIndex}-${subjectIndex}`,
  facultyId: faculty.id, section, laboratory: faculty.laboratory,
  subjectCode: faculty.laboratory === "Physics Lab" ? (subjectIndex ? "PHYS102" : "PHYS101") : (subjectIndex ? "ECE202" : "ECE201"),
  subjectName: faculty.laboratory === "Physics Lab" ? (subjectIndex ? "Electricity and Magnetism" : "General Physics") : (subjectIndex ? "Electronic Circuits" : "Circuit Analysis"),
}))));

export const demoClassReps: ClassRepAccount[] = representativeNames.map((fullName, index) => ({
  id: `demo-classrep-${index + 1}`, role: "classrep", fullName, ...splitName(fullName),
  email: `${emailName(fullName)}@student.nu-fairview.edu.ph`, section: sectionOptions[index],
  accountId: `2024-${String(1031816 + index).padStart(7, "0")}`,
  facultyId: demoFaculty[index % demoFaculty.length].id,
  laboratory: index % 2 ? "Circuits Lab" : "Physics Lab",
  subjectClassId: `${demoFaculty[index].id}-class-0-0`, contactNumber: `0918${1000000 + index}`, notes: "",
  status: index === 3 || index === 7 ? "inactive" : "active", createdAt: dateAt(index, 5),
}));

export const demoAccounts: Account[] = [...demoFaculty, ...demoClassReps];
