import "server-only";
import { randomUUID } from "node:crypto";
import type { DemoUser } from "@/features/demo-auth/types";
import { equipmentCatalog } from "@/features/lab-dashboard/equipment-catalog";
import type { StaffLaboratory } from "./config";
import type { BorrowingSlip, InventoryItem, InventoryInput } from "./types";
import { INVENTORY_IMAGE_MAX_BYTES } from "./inventory-image";

export function staffLaboratory(user: DemoUser): StaffLaboratory | null {
  return user.role === "physics-staff" ? "physics" : user.role === "circuits-staff" ? "circuits" : null;
}
declare global { var staffDemoInventory: Map<string, InventoryItem> | undefined; }
const inventory = globalThis.staffDemoInventory ??= new Map<string, InventoryItem>();
if (!inventory.size) for (const item of equipmentCatalog) for (const laboratory of item.laboratories) {
  const id = `${laboratory}-${item.id}`;
  inventory.set(id, { id, laboratory, catalogId: item.id, image: null, name: item.name, category: laboratory === "physics" && item.category === "Circuits Equipment" ? "Laboratory Equipment" : item.category, kind: item.kind, stock: item.stock, unit: item.unit, condition: "Usable", updatedAt: "2026-03-07T08:00:00Z" });
}
export function readInventory(laboratory?: StaffLaboratory): InventoryItem[] {
  return [...inventory.values()].filter((item) => !laboratory || item.laboratory === laboratory).map((item) => structuredClone(item));
}
function validateImage(value: unknown): string | null {
  if (value === null) return null;
  const error = "Upload a PNG, JPG, or WebP image up to 2 MB.";
  if (typeof value !== "string" || value.length > Math.ceil(INVENTORY_IMAGE_MAX_BYTES / 3) * 4 + 40) throw new Error(error);
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error(error);
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > INVENTORY_IMAGE_MAX_BYTES || bytes.toString("base64") !== match[2]) throw new Error(error);
  const valid = match[1] === "png" ? bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : match[1] === "jpeg" ? bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217
    : bytes.length >= 16 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new Error(error);
  return value;
}
export function saveInventory(laboratory: StaffLaboratory, input: unknown, id?: string): InventoryItem {
  if (id && inventory.get(id)?.laboratory !== laboratory) throw new Error("Item not found in your laboratory.");
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Check the item details.");
  const data = input as Record<string, unknown>;
  for (const [field, limit] of [["name", 120], ["category", 60], ["unit", 20]] as const) if (typeof data[field] !== "string" || !data[field].trim() || data[field].length > limit) throw new Error(`Enter a valid ${field} (up to ${limit} characters).`);
  if (typeof data.stock !== "number" || !Number.isInteger(data.stock) || data.stock < 0 || data.stock > 9999) throw new Error("Enter a whole-number stock quantity from 0 to 9,999.");
  if (!["Equipment", "Material"].includes(data.kind as string) || !["Usable", "Maintenance"].includes(data.condition as string)) throw new Error("Choose a valid item type and condition.");
  const values = data as InventoryInput;
  if (readInventory(laboratory).some((item) => item.id !== id && item.name.toLowerCase() === values.name.trim().toLowerCase())) throw new Error("An item with this name already exists in your laboratory.");
  if (!id && readInventory(laboratory).length >= 200) throw new Error("The demo inventory is full.");
  const existing = id ? inventory.get(id) : undefined;
  const image = data.image === undefined ? existing?.image ?? null : validateImage(data.image);
  const item: InventoryItem = { id: id ?? `${laboratory}-${randomUUID()}`, laboratory, catalogId: existing?.catalogId, image, name: values.name.trim(), category: values.category.trim(), unit: values.unit.trim(), stock: values.stock, kind: values.kind, condition: values.condition, updatedAt: new Date().toISOString() };
  inventory.set(item.id, item);
  return structuredClone(item);
}
export function removeInventory(laboratory: StaffLaboratory, id: string) {
  if (inventory.get(id)?.laboratory !== laboratory) return false;
  return inventory.delete(id);
}

const slips: BorrowingSlip[] = (["physics", "circuits"] as const).flatMap((laboratory) => [
  { reference: `BS-${laboratory === "physics" ? "PHY" : "CIR"}-2026-001`, laboratory, borrower: laboratory === "physics" ? "Andrea Cruz" : "Patricia Lim", studentId: "2024-1031816", section: "BSIT 2A", faculty: laboratory === "physics" ? "R. Bautista" : "G. Pulgar", room: laboratory === "physics" ? "Physics Lab Room 201" : "Circuits Lab Room 301", issued: "2026-03-10", due: "2026-03-10", status: "Borrowed" as const, returned: null, items: [{ name: laboratory === "physics" ? "Vernier Caliper" : "Breadboard", quantity: 2, unit: "pcs" }] },
  { reference: `BS-${laboratory === "physics" ? "PHY" : "CIR"}-2026-002`, laboratory, borrower: laboratory === "physics" ? "Miguel Santos" : "Isabella Tan", studentId: "2024-1031817", section: "BSIT 2A", faculty: laboratory === "physics" ? "R. Bautista" : "G. Pulgar", room: laboratory === "physics" ? "Physics Lab Room 201" : "Circuits Lab Room 301", issued: "2026-03-09", due: "2026-03-09", status: "Returned" as const, returned: "2026-03-09", items: [{ name: laboratory === "physics" ? "Stopwatch" : "Multimeter", quantity: 1, unit: "pcs" }] },
]);
export function readBorrowingSlips(laboratory: StaffLaboratory) { return slips.filter((slip) => slip.laboratory === laboratory).map((slip) => structuredClone(slip)); }
