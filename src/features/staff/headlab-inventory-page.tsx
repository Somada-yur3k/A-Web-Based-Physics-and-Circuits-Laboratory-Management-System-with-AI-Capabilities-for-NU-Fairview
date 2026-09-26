"use client";

import { useCallback, useEffect, useState } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import { laboratoryLabel, type StaffLaboratory } from "./config";
import InventoryDialog from "./inventory-dialog";
import InventoryThumbnail from "./inventory-thumbnail";
import { stockStatus, type InventoryItem } from "./types";
import "./staff.css";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));

export default function HeadlabInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [search, setSearch] = useState(""), [laboratory, setLaboratory] = useState<"All" | StaffLaboratory>("All"), [status, setStatus] = useState("All"), [page, setPage] = useState(1), [message, setMessage] = useState("");
  const [dialog, setDialog] = useState<{ item?: InventoryItem; remove?: boolean } | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/demo/inventory", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load inventory.");
      setInventory(body.inventory);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load inventory. Try again."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const query = search.trim().toLowerCase();
  const filtered = inventory.filter((item) => (laboratory === "All" || item.laboratory === laboratory) && (status === "All" || stockStatus(item) === status) && `${item.name} ${item.category} ${item.kind}`.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10)), currentPage = Math.min(page, pageCount), offset = (currentPage - 1) * 10;
  function saved(item?: InventoryItem) {
    const previous = dialog?.item;
    setInventory((items) => item ? previous ? items.map((existing) => existing.id === item.id ? item : existing) : [item, ...items] : items.filter((existing) => existing.id !== previous?.id));
    setMessage(item ? `${item.name} ${previous ? "updated" : "added"} in ${laboratoryLabel(item.laboratory)} inventory.` : `${previous?.name} removed from inventory.`);
    if (!previous && item) { setSearch(""); setLaboratory(item.laboratory); setStatus("All"); setPage(1); }
  }
  return <main className="admin-content staff-content" aria-labelledby="headlab-inventory-title">
    <header className="account-page-heading"><div><h1 id="headlab-inventory-title">Inventory Overview</h1><p>Manage equipment, materials, and item images across the Physics and Circuits Laboratories.</p></div></header>
    <section className="account-panel" aria-labelledby="headlab-inventory-list-title">
      <header className="account-panel-heading"><div><h2 id="headlab-inventory-list-title">Laboratory Inventory</h2><p>Updates are shared with the staff account assigned to each laboratory.</p></div><div className="staff-panel-actions"><button className="admin-secondary-button" disabled={loading} onClick={load}>{loading ? "Loading…" : "Refresh"}</button><button className="admin-primary-button" disabled={loading || !!error} onClick={() => setDialog({})}><AdminIcon name="plus" />Add Inventory Item</button></div></header>
      <div className="account-toolbar headlab-inventory-toolbar"><label className="account-search"><span className="sr-only">Search inventory</span><AdminIcon name="search" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search item name, category, or type…" /></label><select className="account-status-filter" aria-label="Filter by laboratory" value={laboratory} onChange={(event) => { setLaboratory(event.target.value as "All" | StaffLaboratory); setPage(1); }}><option value="All">All Laboratories</option><option value="physics">Physics Laboratory</option><option value="circuits">Circuits Laboratory</option></select><select className="account-status-filter" aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="All">All Status</option>{["In Stock", "Low Stock", "Out of Stock", "Maintenance"].map((option) => <option key={option}>{option}</option>)}</select></div>
      {message && <p className="staff-feedback" role="status">{message}</p>}{error && <p className="account-form-error" role="alert">{error}</p>}
      {loading ? <p className="staff-empty" role="status">Loading inventory…</p> : error ? <p className="staff-empty">Use Refresh to try loading the inventory again.</p> : !filtered.length ? <div className="staff-empty"><AdminIcon name="search" /><h3>No inventory items found</h3><p>Try a different search or filter.</p></div> : <div className="account-table-scroll staff-table-scroll"><table className="account-table staff-table staff-inventory-table headlab-inventory-table"><thead><tr>{["#", "Item Name", "Laboratory", "Category / Type", "Stock", "Status", "Last Updated", "Actions"].map((label) => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{filtered.slice(offset, offset + 10).map((item, index) => {
        const status = stockStatus(item);
        return <tr key={item.id}><td data-label="#">{offset + index + 1}</td><td data-label="Item Name"><div className="inventory-item-name"><InventoryThumbnail item={item} /><strong>{item.name}</strong></div></td><td data-label="Laboratory">{laboratoryLabel(item.laboratory)}</td><td data-label="Category / Type">{item.category}<small>{item.kind}</small></td><td data-label="Stock">{item.stock} {item.unit}</td><td data-label="Status"><span className={`staff-badge ${status === "In Stock" ? "green" : status === "Low Stock" ? "amber" : "red"}`}>{status}</span></td><td data-label="Last Updated">{formatDate(item.updatedAt)}</td><td data-label="Actions"><div className="staff-row-actions"><button className="staff-edit-button" aria-label={`Edit ${item.name}`} onClick={() => setDialog({ item })}><AdminIcon name="edit" /></button><button className="staff-delete-button" aria-label={`Delete ${item.name}`} onClick={() => setDialog({ item, remove: true })}><AdminIcon name="trash" /></button></div></td></tr>;
      })}</tbody></table></div>}
      {!loading && !error && <div className="account-pagination"><p>{filtered.length ? `Showing ${offset + 1} to ${Math.min(offset + 10, filtered.length)} of ${filtered.length} entries` : "Showing 0 entries"}</p><nav aria-label="Inventory pagination"><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><AdminIcon name="chevron" /></button><span className="staff-current-page">{currentPage} / {pageCount}</span><button aria-label="Next page" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}><AdminIcon name="chevron" /></button></nav></div>}
    </section>
    <p className="staff-demo-note">Inventory details and uploaded images reset on server restart. Request forms still use the sample equipment catalogue until inventory integration is connected.</p>
    {dialog && <InventoryDialog key={dialog.item?.id ?? "new"} {...dialog} scope="headlab" laboratory={laboratory === "All" ? "physics" : laboratory} onClose={() => setDialog(null)} onSaved={saved} />}
  </main>;
}
