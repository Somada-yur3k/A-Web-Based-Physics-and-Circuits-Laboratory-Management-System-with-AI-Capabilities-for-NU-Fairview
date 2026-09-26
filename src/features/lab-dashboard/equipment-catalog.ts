import type { RequestLaboratory } from "./room-availability";
import type { RequestedItem } from "./request-review";

export type EquipmentArtwork = "breadboard" | "meter" | "resistors" | "leds" | "wires" | "multimeter" | "clips" | "power" | "probe" | "switch" | "motor" | "oscilloscope" | "caliper" | "balance" | "stopwatch" | "spring" | "weights" | "track" | "lens";
export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: "Equipment" | "Material";
  laboratories: readonly RequestLaboratory[];
  stock: number;
  unit: string;
  artwork: EquipmentArtwork;
};

// Static prototype inventory; these quantities are not live stock or reservations.
export const equipmentCatalog: readonly CatalogItem[] = [
  { id: "breadboard", name: "Breadboard", description: "830 tie points", category: "Circuits Equipment", kind: "Equipment", laboratories: ["circuits"], stock: 12, unit: "pcs", artwork: "breadboard" },
  { id: "ammeter", name: "Ammeter", description: "0–5 A · Analog", category: "Measurement Tools", kind: "Equipment", laboratories: ["circuits", "physics"], stock: 8, unit: "pcs", artwork: "meter" },
  { id: "voltmeter", name: "Voltmeter", description: "0–20 V · Analog", category: "Measurement Tools", kind: "Equipment", laboratories: ["circuits", "physics"], stock: 10, unit: "pcs", artwork: "meter" },
  { id: "resistor-kit", name: "Resistor Kit", description: "1 Ω–1 MΩ · Assorted", category: "Electronic Components", kind: "Material", laboratories: ["circuits"], stock: 20, unit: "kits", artwork: "resistors" },
  { id: "led-set", name: "LED Set", description: "5 mm · Assorted colors", category: "Electronic Components", kind: "Material", laboratories: ["circuits"], stock: 30, unit: "sets", artwork: "leds" },
  { id: "jumper-wires", name: "Jumper Wires", description: "Male to male", category: "Circuits Equipment", kind: "Material", laboratories: ["circuits"], stock: 50, unit: "sets", artwork: "wires" },
  { id: "multimeter", name: "Multimeter", description: "Digital · AC/DC", category: "Measurement Tools", kind: "Equipment", laboratories: ["circuits", "physics"], stock: 6, unit: "pcs", artwork: "multimeter" },
  { id: "alligator-clips", name: "Alligator Clips", description: "Insulated · 2 pcs/set", category: "Circuits Equipment", kind: "Material", laboratories: ["circuits"], stock: 25, unit: "sets", artwork: "clips" },
  { id: "power-supply", name: "Power Supply", description: "0–30 V · 0–5 A", category: "Circuits Equipment", kind: "Equipment", laboratories: ["circuits", "physics"], stock: 4, unit: "pcs", artwork: "power" },
  { id: "oscilloscope-probe", name: "Oscilloscope Probe", description: "x1/x10 · 100 MHz", category: "Measurement Tools", kind: "Equipment", laboratories: ["circuits"], stock: 8, unit: "pcs", artwork: "probe" },
  { id: "switch-module", name: "Switch Module", description: "SPST · 5 A", category: "Electronic Components", kind: "Material", laboratories: ["circuits"], stock: 15, unit: "pcs", artwork: "switch" },
  { id: "dc-motor", name: "DC Motor", description: "3–6 V", category: "Electronic Components", kind: "Equipment", laboratories: ["circuits"], stock: 5, unit: "pcs", artwork: "motor" },
  { id: "oscilloscope", name: "Oscilloscope", description: "Digital · 2 channels", category: "Measurement Tools", kind: "Equipment", laboratories: ["circuits"], stock: 0, unit: "pcs", artwork: "oscilloscope" },
  { id: "vernier-caliper", name: "Vernier Caliper", description: "0–150 mm", category: "Measurement Tools", kind: "Equipment", laboratories: ["physics"], stock: 12, unit: "pcs", artwork: "caliper" },
  { id: "digital-balance", name: "Digital Balance", description: "0.01 g resolution", category: "Measurement Tools", kind: "Equipment", laboratories: ["physics"], stock: 6, unit: "pcs", artwork: "balance" },
  { id: "stopwatch", name: "Stopwatch", description: "Digital timer", category: "Measurement Tools", kind: "Equipment", laboratories: ["physics"], stock: 20, unit: "pcs", artwork: "stopwatch" },
  { id: "spring-set", name: "Spring Set", description: "Hooke's law experiments", category: "Mechanics", kind: "Equipment", laboratories: ["physics"], stock: 8, unit: "sets", artwork: "spring" },
  { id: "slotted-weights", name: "Slotted Weights", description: "10–100 g · Assorted", category: "Mechanics", kind: "Equipment", laboratories: ["physics"], stock: 10, unit: "sets", artwork: "weights" },
  { id: "dynamics-track", name: "Dynamics Track", description: "Track and trolley", category: "Mechanics", kind: "Equipment", laboratories: ["physics"], stock: 3, unit: "sets", artwork: "track" },
  { id: "lens-set", name: "Lens Set", description: "Convex and concave lenses", category: "Optics", kind: "Equipment", laboratories: ["physics"], stock: 0, unit: "sets", artwork: "lens" },
];

export function findCatalogItem(id: string) { return equipmentCatalog.find((item) => item.id === id); }
export function catalogForLaboratory(laboratory: RequestLaboratory) { return equipmentCatalog.filter((item) => item.laboratories.includes(laboratory)); }
export function itemsForLaboratory(items: readonly RequestedItem[], laboratory: RequestLaboratory) {
  return items.filter((item) => !item.catalogId || findCatalogItem(item.catalogId)?.laboratories.includes(laboratory));
}

// Used by both wizards. Adding the same item increases its quantity without making duplicate rows.
export function addCatalogItem(items: readonly RequestedItem[], catalogId: string, laboratory: RequestLaboratory, rowId: number): RequestedItem[] {
  const source = findCatalogItem(catalogId);
  if (!source || !source.laboratories.includes(laboratory) || source.stock < 1) return [...items];
  const existing = items.find((item) => item.catalogId === catalogId);
  if (existing) {
    if (!Number.isInteger(existing.quantity) || existing.quantity < 1 || existing.quantity >= source.stock) return [...items];
    return items.map((item) => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
  }
  return [...items, { rowId, catalogId, kind: source.kind, name: source.name, quantity: 1 }];
}
