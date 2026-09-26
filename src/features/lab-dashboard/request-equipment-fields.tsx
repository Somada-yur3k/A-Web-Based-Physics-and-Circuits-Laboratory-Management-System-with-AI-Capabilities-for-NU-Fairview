import { useState } from "react";
import LabIcon from "@/components/dashboard/lab-icon";
import { requestedItemsError, type RequestedItem } from "./request-review";
import { catalogForLaboratory, findCatalogItem } from "./equipment-catalog";
import EquipmentThumbnail from "./equipment-thumbnail";
import type { RequestLaboratory } from "./room-availability";
import "./request-equipment-catalog.css";

type Props = {
  laboratory: RequestLaboratory;
  items: RequestedItem[];
  notes: string;
  onAdd: (catalogId?: string) => void;
  onChange: (rowId: number, patch: Partial<RequestedItem>) => void;
  onRemove: (rowId: number) => void;
  onNotesChange: (notes: string) => void;
};

export default function RequestEquipmentFields({ laboratory, items, notes, onAdd, onChange, onRemove, onNotesChange }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const catalog = catalogForLaboratory(laboratory);
  const categories = [...new Set(catalog.map((item) => item.category))];
  const query = search.trim().toLowerCase();
  const filtered = catalog.filter((item) => (category === "ALL" || item.category === category) && `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query));
  const selected = items.filter((item) => item.catalogId);
  const additional = items.filter((item) => !item.catalogId);
  const error = requestedItemsError(items, notes, laboratory);
  return <div className="request-equipment-fields">
    <div className="equipment-catalog-filters">
      <label className="equipment-search"><span className="sr-only">Search equipment and materials</span><LabIcon name="search" /><input type="search" value={search} placeholder="Search items…" onChange={(event) => setSearch(event.target.value)} /></label>
      <label><span className="sr-only">Item category</span><select aria-label="Item category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">All categories</option>{categories.map((name) => <option key={name}>{name}</option>)}</select></label>
    </div>
    <div className="equipment-catalog-layout">
      <section className="equipment-catalog" aria-labelledby="equipment-catalog-title">
        <header className="equipment-catalog-heading"><h3 id="equipment-catalog-title">{laboratory === "circuits" ? "Circuits" : "Physics"} Catalogue</h3><span>{filtered.length} items</span></header>
        <div className="equipment-catalog-grid">
          {filtered.map((source) => {
            const requested = items.find((item) => item.catalogId === source.id);
            const atLimit = Boolean(requested && (!Number.isInteger(requested.quantity) || requested.quantity < 1 || requested.quantity >= source.stock));
            return <article key={source.id} className={`equipment-catalog-card ${requested ? "is-added" : ""}`}>
              <div className="equipment-thumbnail"><EquipmentThumbnail item={source} /></div>
              <div className="equipment-card-copy"><h4>{source.name}</h4><p>{source.description}</p><span className="equipment-category">{source.category}</span>
                <div className="equipment-stock-line"><span className={`equipment-stock ${source.stock === 0 ? "is-unavailable" : source.stock <= 5 ? "is-low" : ""}`}>{source.stock === 0 ? "Out of stock" : source.stock <= 5 ? "Low stock" : "In stock"}</span><span>{source.stock} {source.unit}</span></div>
                <button type="button" className="equipment-add" aria-label={`Add ${source.name}`} disabled={source.stock === 0 || atLimit} onClick={() => onAdd(source.id)}><LabIcon name={requested ? "check-circle" : "plus"} />{source.stock === 0 ? "Unavailable" : atLimit ? "Stock limit" : requested ? "Add another" : "Add"}</button>
              </div>
            </article>;
          })}
        </div>
        {!filtered.length && <div className="equipment-empty"><LabIcon name="search" /><strong>No matching items</strong><p>Try another search or category.</p><button type="button" onClick={() => { setSearch(""); setCategory("ALL"); }}>Clear filters</button></div>}
        <p className="equipment-sample-note">Sample availability only. Stock is confirmed when your request is processed.</p>
      </section>
      <aside className="equipment-request-list" aria-labelledby="equipment-list-title">
        <header><h3 id="equipment-list-title"><LabIcon name="report" />Request List</h3><span className="equipment-list-count" aria-label={`${items.length} item types selected`}>{items.length}</span></header>
        {selected.length ? <ul className="equipment-selected-items">{selected.map((item) => {
          const source = findCatalogItem(item.catalogId!);
          if (!source) return null;
          const invalid = !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > source.stock;
          return <li key={item.rowId} className="equipment-selected-item">
            <div className="equipment-thumbnail"><EquipmentThumbnail item={source} /></div>
            <div className="equipment-selected-copy"><strong>{source.name}</strong><span>{source.description}</span><span className="equipment-category">{source.category}</span></div>
            <button type="button" className="equipment-remove" aria-label={`Remove ${source.name}`} onClick={() => onRemove(item.rowId)}><LabIcon name="trash" /></button>
            <div className="equipment-quantity-row"><span>Available: {source.stock} {source.unit}</span><label>Quantity<input type="number" min={1} max={source.stock} step={1} value={Number.isNaN(item.quantity) ? "" : item.quantity} aria-label={`Quantity for ${source.name}`} aria-invalid={invalid} onChange={(event) => onChange(item.rowId, { quantity: event.target.valueAsNumber })} required /></label></div>
          </li>;
        })}</ul> : <div className="equipment-empty equipment-list-empty"><LabIcon name="inventory" /><strong>{additional.length ? "No catalogue items selected" : "Your list is empty"}</strong><p>Add items from the catalogue, or continue without equipment.</p></div>}
        {additional.length > 0 && <p className="equipment-additional-count">{additional.length} additional {additional.length === 1 ? "item" : "items"} listed below.</p>}
        <p className="equipment-list-notice" role="status">{items.length ? `${items.length} item ${items.length === 1 ? "type" : "types"} selected. Adjust quantities before continuing.` : "Equipment and materials are optional."}</p>
      </aside>
    </div>
    <section className="equipment-additional" aria-labelledby="equipment-additional-title">
      <header><div><h3 id="equipment-additional-title">Additional Items</h3><p>Need something outside the catalogue? Describe it for the laboratory staff.</p></div><button type="button" className="request-add-student" onClick={() => onAdd()}>+ Add Equipment / Material</button></header>
      <div className="request-item-rows">
      {additional.map((item, index) => <fieldset key={item.rowId} className="request-item-row">
        <legend>Item {index + 1}</legend>
        <label>Type<select value={item.kind} onChange={(event) => onChange(item.rowId, { kind: event.target.value as RequestedItem["kind"] })}><option>Equipment</option><option>Material</option></select></label>
        <label>Item Name <span>*</span><input value={item.name} maxLength={120} placeholder="Enter equipment or material" onChange={(event) => onChange(item.rowId, { name: event.target.value })} required /></label>
        <label>Quantity <span>*</span><input type="number" min={1} max={999} step={1} value={Number.isNaN(item.quantity) ? "" : item.quantity} onChange={(event) => onChange(item.rowId, { quantity: event.target.valueAsNumber })} required /></label>
        <button type="button" className="request-remove-student" aria-label={`Remove item ${index + 1}`} onClick={() => onRemove(item.rowId)}>Remove</button>
      </fieldset>)}
      </div>
    </section>
    <label className="request-notes-field">Notes / Special Setup <span>(Optional)</span><textarea value={notes} maxLength={1000} rows={4} placeholder="Describe any materials or special setup needed for your session." onChange={(event) => onNotesChange(event.target.value)} /></label>
    {error && <p className="request-review-error" role="status">{error}</p>}
  </div>;
}
