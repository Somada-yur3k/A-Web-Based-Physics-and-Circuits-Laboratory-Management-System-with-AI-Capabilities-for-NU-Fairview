import AdminIcon from "@/components/admin/admin-icon";
import { equipmentCatalog } from "@/features/lab-dashboard/equipment-catalog";
import EquipmentThumbnail from "@/features/lab-dashboard/equipment-thumbnail";
import type { InventoryItem } from "./types";

export default function InventoryThumbnail({ item, preview = false }: { item: Pick<InventoryItem, "id" | "laboratory" | "name" | "image" | "catalogId">; preview?: boolean }) {
  const catalogId = item.catalogId ?? item.id.replace(`${item.laboratory}-`, "");
  const catalogItem = equipmentCatalog.find((entry) => entry.id === catalogId);
  return <span className={`inventory-thumbnail${preview ? " inventory-image-preview" : ""}`}>
    {item.image ? <img src={item.image} alt={preview ? "Inventory image preview" : item.name} width={preview ? 112 : 48} height={preview ? 112 : 48} /> : catalogItem ? <EquipmentThumbnail item={catalogItem} /> : <AdminIcon name="inventory" />}
  </span>;
}
