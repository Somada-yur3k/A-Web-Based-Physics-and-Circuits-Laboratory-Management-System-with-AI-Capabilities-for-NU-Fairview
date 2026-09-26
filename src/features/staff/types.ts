import type { StaffLaboratory } from "./config";
export type InventoryItem = {
  id: string; laboratory: StaffLaboratory; name: string; category: string;
  kind: "Equipment" | "Material"; stock: number; unit: string;
  condition: "Usable" | "Maintenance"; updatedAt: string;
  image?: string | null; catalogId?: string;
};
export type InventoryInput = Pick<InventoryItem, "name" | "category" | "kind" | "stock" | "unit" | "condition" | "image">;
export type BorrowingSlip = {
  reference: string; laboratory: StaffLaboratory; borrower: string; studentId: string;
  section: string; faculty: string; room: string; issued: string; due: string;
  status: "Borrowed" | "Returned"; returned: string | null;
  items: { name: string; quantity: number; unit: string }[];
};
export const stockStatus = (item: InventoryItem) => item.condition === "Maintenance" ? "Maintenance" : item.stock === 0 ? "Out of Stock" : item.stock <= 5 ? "Low Stock" : "In Stock";
