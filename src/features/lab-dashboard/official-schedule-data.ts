import type { AvailabilityBlock } from "./room-availability";

export type OfficialBlock = Omit<AvailabilityBlock, "date" | "kind"> & {
  weekday: number;
  kind: "laboratory" | "lecture";
};

const row = (roomId: string, weekday: number, start: string, end: string, title: string, section: string, faculty: string): OfficialBlock => {
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  return { id: `official-${roomId}-${weekday}-${start}-${title}`, roomId, weekday, start: minutes(start), end: minutes(end), kind: "laboratory", title, section, faculty };
};

// Transcribed from the supplied Circuits, Physics 1–407 and Physics 2–409 timetables.
// Weekday: Monday=1 through Saturday=6. Times use the timetable's 20-minute grid.
export const initialOfficialBlocks: OfficialBlock[] = [
  row("circuits-301", 1, "13:20", "16:40", "CPOSYS30", "CPE32A", "C. Fernandez"),
  row("circuits-301", 2, "08:00", "12:00", "CPDSPG30", "CPE33A", "J. San Luis"),
  row("circuits-301", 2, "14:20", "16:40", "CPOSFT30", "CPE32", "B. Zurbito"),
  row("circuits-301", 2, "17:20", "21:00", "CPLGCTL", "CPE23A", "M. Briones"),
  row("circuits-301", 3, "12:20", "16:40", "CECLCX1L", "CPE22A", "J. Apduhan"),
  row("circuits-301", 3, "17:20", "21:00", "CPEMBS1L", "CPE32A", "J. Apduhan"),
  row("circuits-301", 4, "12:20", "16:40", "CPMICR1L", "CPE241", "C. Fernandez"),
  row("circuits-301", 5, "14:20", "16:40", "CPELX130", "CPE33A", "M. Somao-I"),
  row("circuits-301", 6, "09:40", "12:00", "EECKTC30", "CPE251", "A. Jacinto"),
  row("circuits-301", 6, "12:40", "16:40", "EECKTC1L", "CPE251", "A. Jacinto"),
  row("circuits-301", 6, "17:20", "21:00", "CPARCH1L", "CPE33A", "R. Ventura"),

  row("physics-201", 1, "08:00", "12:00", "CPTHS32D", "CPE42A", "C. Rebong"),
  row("physics-201", 1, "12:20", "14:20", "NSGICO1L", "PSY252", "R. Rivera"),
  row("physics-201", 1, "14:20", "16:40", "ENBOSH30", "CPE32B", "J. Peñarroyo"),
  row("physics-201", 2, "09:00", "12:00", "ENBOSH30", "CPE32A", "J. Peñarroyo"),
  row("physics-201", 2, "12:20", "14:20", "CPSOFT30", "CPE231", "B. Zurbito"),
  row("physics-201", 2, "17:20", "21:00", "CPLGCTL", "CPE23B", "M. Somao-I"),
  row("physics-201", 3, "09:00", "12:00", "CPORTN10", "CPE263", "J. Peñarroyo"),
  row("physics-201", 3, "12:20", "14:20", "CPELX330", "CPE42A", "J. San Luis"),
  row("physics-201", 3, "17:20", "21:00", "ENPHYS1L", "CPE13A", "P. Teodoro"),
  row("physics-201", 4, "08:00", "12:00", "CPTHS32D", "CPE42A", "C. Rebong"),
  row("physics-201", 4, "12:20", "14:20", "NSGICO1L", "PSY252", "R. Rivera"),
  row("physics-201", 4, "14:20", "16:40", "ENBOSH30", "CPE32B", "J. Peñarroyo"),
  row("physics-201", 5, "09:00", "12:00", "ENBOSH30", "CPE32A", "J. Peñarroyo"),
  row("physics-201", 5, "12:20", "14:20", "CPTECH30", "CPE42A", "M. Somao-I"),
  row("physics-201", 6, "12:20", "16:40", "ENPHYS1L", "CE13A", "A. Corpus"),
  row("physics-201", 6, "17:20", "21:00", "ENPHYS1L", "CE13A", "A. Corpus"),

  row("physics-202", 1, "12:20", "14:20", "GEUTS01X", "PSY264", "Montehermoso"),
  row("physics-202", 1, "14:20", "16:40", "PSYCH01X", "PSY264", "M. Mamon"),
  row("physics-202", 1, "17:20", "21:00", "ABCOM21X", "ABC243", "V. Duran"),
  row("physics-202", 2, "08:00", "12:00", "ABCOM20X", "ABC243", "M. Leguia"),
  row("physics-202", 2, "14:40", "16:40", "ABCOM20X", "ABC241", "M. Leguia"),
  row("physics-202", 3, "08:00", "12:00", "ABCOM33X", "ABC231", "L. Lantajo"),
  row("physics-202", 3, "12:40", "14:40", "ABCOM32X", "ABC232", "J. Delos Reyes"),
  row("physics-202", 4, "09:00", "12:00", "ABCOM18X", "ABC242", "F. Orcio"),
  row("physics-202", 4, "14:20", "16:40", "PSYCH01X", "PSY264", "R. Mamon"),
  row("physics-202", 5, "14:40", "16:40", "ABC264", "", "C. Banaag"),
];

for (const [classId, roomId, weekday, title, section] of [
  ["circuits-electronics", "circuits-301", 3, "CECLCX1L", "CPE22A"],
  ["circuits-analysis", "circuits-301", 2, "CPDSPG30", "CPE33A"],
  ["physics-general", "physics-201", 3, "ENPHYS1L", "CPE13A"],
  ["physics-electricity", "physics-202", 4, "PSYCH01X", "PSY264"],
] as const) {
  const block = initialOfficialBlocks.find((item) => item.roomId === roomId && item.weekday === weekday && item.title === title && item.section === section);
  if (block) block.assignedClassId = classId;
}
