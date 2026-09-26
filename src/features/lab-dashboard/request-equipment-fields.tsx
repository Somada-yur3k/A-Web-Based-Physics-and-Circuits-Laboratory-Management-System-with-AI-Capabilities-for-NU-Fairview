import { requestedItemsError, type RequestedItem } from "./request-review";

type Props = {
  items: RequestedItem[];
  notes: string;
  onAdd: () => void;
  onChange: (rowId: number, patch: Partial<RequestedItem>) => void;
  onRemove: (rowId: number) => void;
  onNotesChange: (notes: string) => void;
};

export default function RequestEquipmentFields({ items, notes, onAdd, onChange, onRemove, onNotesChange }: Props) {
  const error = requestedItemsError(items, notes);
  return <div className="request-equipment-fields">
    <p className="request-review-note">Add equipment or materials if needed. You can continue without items.</p>
    <div className="request-item-rows">
      {items.map((item, index) => <fieldset key={item.rowId} className="request-item-row">
        <legend>Item {index + 1}</legend>
        <label>Type<select value={item.kind} onChange={(event) => onChange(item.rowId, { kind: event.target.value as RequestedItem["kind"] })}><option>Equipment</option><option>Material</option></select></label>
        <label>Item Name <span>*</span><input value={item.name} maxLength={120} placeholder="Enter equipment or material" onChange={(event) => onChange(item.rowId, { name: event.target.value })} required /></label>
        <label>Quantity <span>*</span><input type="number" min={1} max={999} step={1} value={Number.isNaN(item.quantity) ? "" : item.quantity} onChange={(event) => onChange(item.rowId, { quantity: event.target.valueAsNumber })} required /></label>
        <button type="button" className="request-remove-student" aria-label={`Remove item ${index + 1}`} onClick={() => onRemove(item.rowId)}>Remove</button>
      </fieldset>)}
    </div>
    <button type="button" className="request-add-student" onClick={onAdd}>+ Add Equipment / Material</button>
    <label className="request-notes-field">Notes / Special Setup <span>(Optional)</span><textarea value={notes} maxLength={1000} rows={4} placeholder="Describe any materials or special setup needed for your session." onChange={(event) => onNotesChange(event.target.value)} /></label>
    {error && <p className="request-review-error" role="status">{error}</p>}
  </div>;
}
