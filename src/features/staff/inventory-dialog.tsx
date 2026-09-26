"use client";

import { useEffect, useRef, useState } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import { laboratoryLabel, type StaffLaboratory } from "./config";
import { INVENTORY_IMAGE_HELP, INVENTORY_IMAGE_MAX_BYTES, INVENTORY_IMAGE_TYPES } from "./inventory-image";
import InventoryThumbnail from "./inventory-thumbnail";
import type { InventoryInput, InventoryItem } from "./types";

type Props = {
  item?: InventoryItem; remove?: boolean; scope?: "staff" | "headlab"; laboratory: StaffLaboratory;
  onClose: () => void; onSaved: (item?: InventoryItem) => void;
};

export default function InventoryDialog({ item, remove = false, scope = "staff", laboratory, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null), imageInput = useRef<HTMLInputElement>(null);
  const reader = useRef<FileReader | null>(null), lock = useRef(false);
  const [values, setValues] = useState<InventoryInput>(item ?? { name: "", category: "", kind: "Equipment", stock: 0, unit: "pcs", condition: "Usable", image: null });
  const [selectedLaboratory, setLaboratory] = useState(item?.laboratory ?? laboratory);
  const [busy, setBusy] = useState(false), [readingImage, setReadingImage] = useState(false), [error, setError] = useState("");
  const disabled = busy || readingImage;
  useEffect(() => {
    dialog.current?.showModal();
    return () => { if (reader.current) { reader.current.onload = null; reader.current.onerror = null; reader.current.abort(); reader.current = null; } };
  }, []);

  function uploadImage(file?: File) {
    if (!file) return;
    setError("");
    if (!INVENTORY_IMAGE_TYPES.some((type) => type === file.type) || file.size > INVENTORY_IMAGE_MAX_BYTES || !file.size) {
      setError(`Choose an image. ${INVENTORY_IMAGE_HELP}`); return;
    }
    setReadingImage(true);
    const fileReader = new FileReader();
    reader.current = fileReader;
    fileReader.onerror = () => { setError("Could not read this image. Please try another file."); setReadingImage(false); };
    fileReader.onload = async () => {
      const result = fileReader.result;
      try {
        if (typeof result !== "string") throw new Error("Could not read this image.");
        const image = new Image();
        image.src = result;
        await image.decode();
        if (reader.current !== fileReader) return;
        setValues((previous) => ({ ...previous, image: result }));
      } catch { if (reader.current === fileReader) setError("This image cannot be opened. Please choose a valid PNG, JPG, or WebP file."); }
      finally { if (reader.current === fileReader) setReadingImage(false); }
    };
    fileReader.readAsDataURL(file);
  }

  async function save() {
    if (lock.current || readingImage) return;
    lock.current = true; setBusy(true); setError("");
    const endpoint = scope === "headlab" ? "/api/demo/inventory" : "/api/demo/staff";
    const itemEndpoint = scope === "headlab" ? endpoint : `${endpoint}/inventory`;
    try {
      const response = await fetch(item ? `${itemEndpoint}/${encodeURIComponent(item.id)}` : endpoint, {
        method: remove ? "DELETE" : item ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        ...(remove ? {} : { body: JSON.stringify({ ...values, laboratory: selectedLaboratory }) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save this item.");
      onSaved(data.item); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save this item. Try again."); }
    finally { lock.current = false; setBusy(false); }
  }

  return <dialog ref={dialog} className={`account-dialog ${remove ? "account-delete-dialog" : "account-profile-dialog inventory-dialog"}`} aria-labelledby="staff-item-title" aria-describedby="staff-item-description" onClose={onClose} onCancel={(event) => { if (disabled) event.preventDefault(); }} onClick={(event) => { if (event.target === event.currentTarget && !disabled) dialog.current?.close(); }}>
    <header className="account-dialog-heading"><div><h2 id="staff-item-title">{remove ? "Delete Inventory Item" : item ? "Edit Inventory Item" : "Add Inventory Item"}</h2><p id="staff-item-description">{remove ? "Remove this item from your laboratory inventory." : `Enter item details and update its image for the ${laboratoryLabel(selectedLaboratory)}.`}</p></div><button type="button" className="admin-icon-button" aria-label="Close inventory dialog" disabled={disabled} onClick={() => dialog.current?.close()}><AdminIcon name="close" /></button></header>
    {remove ? <div className="account-delete-body"><p>Delete <strong>{item?.name}</strong>? Existing borrowing slip records keep their recorded item details.</p>{error && <p className="account-form-error" role="alert">{error}</p>}<div className="account-dialog-actions"><button className="admin-secondary-button" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button><button className="admin-danger-button" disabled={busy} onClick={save}>{busy ? "Deleting…" : "Delete Item"}</button></div></div> : <form className="account-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset disabled={disabled} className="staff-form-fields"><legend className="sr-only">Inventory item details</legend><div className="account-form-grid">
        <div className="account-form-field"><label htmlFor="staff-item-name">Item Name<span className="account-required"> *</span></label><input autoFocus id="staff-item-name" required maxLength={120} value={values.name} placeholder="Enter item name" onChange={(event) => setValues({ ...values, name: event.target.value })} /></div>
        <div className="account-form-field"><label htmlFor="staff-item-category">Category<span className="account-required"> *</span></label><input id="staff-item-category" required maxLength={60} value={values.category} placeholder="e.g. Measurement Tools" onChange={(event) => setValues({ ...values, category: event.target.value })} /></div>
        <div className="account-form-field"><label htmlFor="staff-item-kind">Item Type<span className="account-required"> *</span></label><select id="staff-item-kind" value={values.kind} onChange={(event) => setValues({ ...values, kind: event.target.value as InventoryInput["kind"] })}><option>Equipment</option><option>Material</option></select></div>
        <div className="account-form-field"><label htmlFor="staff-item-laboratory">Laboratory<span className="account-required"> *</span></label><select id="staff-item-laboratory" value={selectedLaboratory} disabled={scope !== "headlab" || !!item} onChange={(event) => setLaboratory(event.target.value as StaffLaboratory)}><option value="physics">Physics Laboratory</option><option value="circuits">Circuits Laboratory</option></select></div>
        <div className="account-form-field"><label htmlFor="staff-item-stock">Stock Quantity<span className="account-required"> *</span></label><input id="staff-item-stock" type="number" min={0} max={9999} step={1} required value={Number.isNaN(values.stock) ? "" : values.stock} onChange={(event) => setValues({ ...values, stock: event.target.value === "" ? NaN : Number(event.target.value) })} /></div>
        <div className="account-form-field"><label htmlFor="staff-item-unit">Unit<span className="account-required"> *</span></label><input id="staff-item-unit" required maxLength={20} value={values.unit} placeholder="pcs, sets, kits" onChange={(event) => setValues({ ...values, unit: event.target.value })} /></div>
        <div className="account-form-field account-field-wide"><label htmlFor="staff-item-condition">Condition<span className="account-required"> *</span></label><select id="staff-item-condition" value={values.condition} onChange={(event) => setValues({ ...values, condition: event.target.value as InventoryInput["condition"] })}><option>Usable</option><option>Maintenance</option></select></div>
        <div className="account-form-field account-field-wide"><label htmlFor="staff-item-image">Item Image<span className="account-optional"> (Optional)</span></label><div className="inventory-image-upload">
          <InventoryThumbnail preview item={{ id: item?.id ?? "", catalogId: item?.catalogId, laboratory: selectedLaboratory, name: values.name, image: values.image }} />
          <div className="inventory-image-controls"><p>{readingImage ? "Preparing image…" : values.image ? "Your uploaded image is ready to save." : item ? "Keep the current illustration or upload a new image." : "Add a photo of this equipment or material."}</p><div className="inventory-image-actions"><button type="button" className="admin-secondary-button" onClick={() => imageInput.current?.click()}>{values.image || item ? "Replace Image" : "Upload Image"}</button>{values.image && <button type="button" className="inventory-reset-image" onClick={() => { setValues({ ...values, image: null }); setError(""); }}>Remove Image</button>}</div>
          <input ref={imageInput} className="inventory-file-input" id="staff-item-image" type="file" accept={INVENTORY_IMAGE_TYPES.join(",")} aria-describedby="staff-image-help" onChange={(event) => { uploadImage(event.target.files?.[0]); event.target.value = ""; }} /><small id="staff-image-help">{INVENTORY_IMAGE_HELP} Saved when you select {item ? "Save Changes" : "Add Item"}.</small></div>
        </div></div>
      </div></fieldset>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      <footer className="account-form-footer"><p><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v7M12 6v2" /></svg><span>Item details and images are saved temporarily until the demo server restarts.</span></p><div className="account-dialog-actions"><button type="button" className="admin-secondary-button" disabled={disabled} onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" className="admin-primary-button" disabled={disabled}>{busy ? "Saving…" : readingImage ? "Preparing Image…" : item ? "Save Changes" : "Add Item"}</button></div></footer>
    </form>}
  </dialog>;
}
