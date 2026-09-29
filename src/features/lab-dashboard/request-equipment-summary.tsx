import { findCatalogItem } from "./equipment-catalog";
import EquipmentThumbnail from "./equipment-thumbnail";
import LabIcon from "@/components/dashboard/lab-icon";
import type { RequestedItem } from "./request-review";
import type { InventoryItem } from "@/features/staff/types";
import type { RequestLaboratory } from "./room-availability";
import "./request-equipment-catalog.css";

export default function RequestEquipmentSummary({ items, inventory, laboratory }: { items: readonly RequestedItem[]; inventory?: readonly InventoryItem[]; laboratory?: RequestLaboratory }) {
  if (!items.length) return <p className="request-review-note">No equipment or materials requested.</p>;
  return <ul className="review-equipment-list">{items.map((item) => {
    const source = item.catalogId ? findCatalogItem(item.catalogId) : undefined;
    const stocked = inventory?.find((entry) => entry.laboratory === laboratory && (item.catalogId ? entry.catalogId === item.catalogId : entry.name.toLowerCase() === item.name.trim().toLowerCase()));
    return <li key={item.rowId}><span className="equipment-thumbnail">{stocked?.image ? <img className="request-item-image" src={stocked.image} alt={item.name} width={50} height={56} /> : source ? <EquipmentThumbnail item={source} /> : <LabIcon name="inventory" />}</span><span className="review-equipment-copy"><strong>{item.name.trim()}</strong><span>{source?.description ?? "Additional item"}</span><span>{item.kind}{source ? ` · ${source.category}` : ""}</span></span><span className="review-equipment-quantity">{item.quantity} {stocked?.unit ?? source?.unit ?? "qty"}</span></li>;
  })}</ul>;
}
