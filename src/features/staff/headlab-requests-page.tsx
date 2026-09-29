"use client";

import { useCallback, useEffect, useState } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import { RequestDialog } from "@/features/demo-requests/request-queue";
import type { DemoRequestRecord } from "@/features/demo-requests/types";
import { laboratoryLabel, type StaffLaboratory } from "./config";
import type { InventoryItem } from "./types";
import "./staff.css";

export default function HeadlabRequestsPage() {
  const [requests, setRequests] = useState<DemoRequestRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selected, setSelected] = useState<DemoRequestRecord | null>(null);
  const [laboratory, setLaboratory] = useState<"All" | StaffLaboratory>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [requestResponse, inventoryResponse] = await Promise.all([
        fetch("/api/demo/requests", { cache: "no-store" }),
        fetch("/api/demo/inventory", { cache: "no-store" }),
      ]);
      const [requestData, inventoryData] = await Promise.all([requestResponse.json(), inventoryResponse.json()]);
      if (!requestResponse.ok || !inventoryResponse.ok) throw new Error(requestData.error ?? inventoryData.error ?? "Could not load laboratory requests.");
      setRequests(requestData.requests);
      setInventory(inventoryData.inventory);
      setSelected((current) => current ? requestData.requests.find((entry: DemoRequestRecord) => entry.reference === current.reference) ?? null : null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load laboratory requests."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const query = search.trim().toLowerCase();
  const filtered = requests.filter((record) => (laboratory === "All" || record.snapshot.laboratory === laboratory) && `${record.reference} ${record.requester.displayName} ${record.snapshot.notes} ${record.snapshot.items.map((item) => item.name).join(" ")}`.toLowerCase().includes(query));
  return <main className="admin-content staff-content" aria-labelledby="headlab-requests-title">
    <header className="account-page-heading"><div><h1 id="headlab-requests-title">Reservation Requests</h1><p>View submitted Physics and Circuits requests, including equipment, materials, and images.</p></div></header>
    <section className="account-panel"><header className="account-panel-heading"><div><h2>Laboratory Requests</h2><p>Requests from both laboratories appear here.</p></div><button className="admin-secondary-button" disabled={loading} onClick={load}>{loading ? "Loading…" : "Refresh"}</button></header>
      <div className="account-toolbar headlab-inventory-toolbar"><label className="account-search"><span className="sr-only">Search requests</span><AdminIcon name="search" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search request, requester, or item…" /></label><select className="account-status-filter" aria-label="Filter by laboratory" value={laboratory} onChange={(event) => setLaboratory(event.target.value as "All" | StaffLaboratory)}><option value="All">All Laboratories</option><option value="physics">Physics Laboratory</option><option value="circuits">Circuits Laboratory</option></select></div>
      {error && <p className="account-form-error" role="alert">{error}</p>}
      {loading ? <p className="staff-empty" role="status">Loading requests…</p> : error ? <p className="staff-empty">Use Refresh to try again.</p> : !filtered.length ? <p className="staff-empty">No matching requests found.</p> : <div className="account-table-scroll staff-table-scroll"><table className="account-table staff-table staff-requests-table"><thead><tr>{["Reference", "Laboratory", "Requested By", "Equipment / Materials", "Status", "Action"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{filtered.map((record) => <tr key={record.reference}><td data-label="Reference"><strong>{record.reference}</strong>{record.sample && <small>Sample</small>}</td><td data-label="Laboratory">{laboratoryLabel(record.snapshot.laboratory)}</td><td data-label="Requested By">{record.requester.displayName}</td><td data-label="Equipment / Materials">{record.snapshot.items.length} item{record.snapshot.items.length === 1 ? "" : "s"}</td><td data-label="Status">{record.status}</td><td data-label="Action"><button className="staff-view-button" onClick={() => setSelected(record)}>View Request</button></td></tr>)}</tbody></table></div>}
    </section>
    {selected && <RequestDialog key={selected.reference} record={selected} dean={false} inventory={inventory} onClose={() => setSelected(null)} onDecision={() => {}} />}
  </main>;
}
