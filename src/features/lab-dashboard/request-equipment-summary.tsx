import { findCatalogItem } from "./equipment-catalog";
import EquipmentThumbnail from "./equipment-thumbnail";
import LabIcon from "@/components/dashboard/lab-icon";
import type { RequestedItem } from "./request-review";
import "./request-equipment-catalog.css";

export default function RequestEquipmentSummary({ items }: { items: readonly RequestedItem[] }) {
  if (!items.length) return <p className="request-review-note">No equipment or materials requested.</p>;
  return <ul className="review-equipment-list">{items.map((item) => {
    const source = item.catalogId ? findCatalogItem(item.catalogId) : undefined;
    return <li key={item.rowId}><span className="equipment-thumbnail">{source ? <EquipmentThumbnail item={source} /> : <LabIcon name="inventory" />}</span><span className="review-equipment-copy"><strong>{item.name.trim()}</strong><span>{source?.description ?? "Additional item"}</span><span>{item.kind}{source ? ` · ${source.category}` : ""}</span></span><span className="review-equipment-quantity">{item.quantity} {source?.unit ?? "qty"}</span></li>;
  })}</ul>;
}
