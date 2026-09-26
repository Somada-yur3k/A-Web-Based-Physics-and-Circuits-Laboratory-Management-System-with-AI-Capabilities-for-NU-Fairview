"use client";

import { useState, type KeyboardEvent } from "react";
import AdminIcon from "@/components/admin/admin-icon";
import { demoAccounts } from "./demo-data";
import AccountDialog, { type AccountDialogState } from "./account-dialog";
import type { Account, AccountRole, AccountStatus } from "./types";

const PAGE_SIZE = 10;
const formatDate = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export default function AccountManagement() {
  const [accounts, setAccounts] = useState<Account[]>(demoAccounts);
  const [role, setRole] = useState<AccountRole>("faculty");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | AccountStatus>("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<AccountDialogState | null>(null);
  const [message, setMessage] = useState("");
  const isFaculty = role === "faculty";
  const roleLabel = isFaculty ? "Faculty" : "Class Representative";
  const facultyName = (id: string) => accounts.find((account) => account.id === id)?.fullName ?? "Unassigned";
  const query = search.trim().toLowerCase();
  const filtered = accounts.filter((account) => account.role === role && (status === "all" || account.status === status) && [account.fullName, account.email, ...(account.role === "faculty" ? [account.department] : [account.section, account.accountId, facultyName(account.facultyId), account.laboratory])].some((value) => value.toLowerCase().includes(query)));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(offset, offset + PAGE_SIZE);

  function selectRole(next: AccountRole) { setRole(next); setSearch(""); setStatus("all"); setPage(1); setMessage(""); }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? "faculty" : event.key === "End" ? "classrep" : isFaculty ? "classrep" : "faculty";
      selectRole(next);
      event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus();
    }
  }
  function saveAccount(account: Account) {
    const editing = accounts.some((member) => member.id === account.id);
    setAccounts((previous) => editing ? previous.map((member) => member.id === account.id ? account : member) : [account, ...previous]);
    if (!editing) { setSearch(""); setStatus("all"); setPage(1); }
    setMessage(`${account.fullName} ${editing ? "updated" : "created"} in preview accounts.`);
    setDialog(null);
  }
  function deleteAccount(id: string) {
    const name = accounts.find((account) => account.id === id)?.fullName;
    setAccounts((previous) => previous.filter((account) => account.id !== id));
    setMessage(`${name} removed from preview accounts.`);
    setDialog(null);
  }

  return <main className="admin-content">
    <div className="account-page-heading"><div><h1>Account Management</h1><p>Manage system accounts for faculty and class representatives.</p></div><span className="account-preview-badge" title="Demo accounts only. Changes reset when this page is reloaded.">Preview</span></div>
    <div className="account-tabs" role="tablist" aria-label="Account type">
      <button id="tab-faculty" role="tab" type="button" aria-selected={isFaculty} aria-controls="accounts-panel" tabIndex={isFaculty ? 0 : -1} className={isFaculty ? "is-selected" : ""} onClick={() => selectRole("faculty")} onKeyDown={tabKey}><AdminIcon name="users" /><span>Faculty Accounts</span></button>
      <button id="tab-classrep" role="tab" type="button" aria-selected={!isFaculty} aria-controls="accounts-panel" tabIndex={!isFaculty ? 0 : -1} className={!isFaculty ? "is-selected" : ""} onClick={() => selectRole("classrep")} onKeyDown={tabKey}><AdminIcon name="faculty" /><span>Class Representative Accounts</span></button>
    </div>
    <section id="accounts-panel" className="account-panel" role="tabpanel" aria-labelledby={`tab-${role}`}>
      <div className="account-panel-heading"><div><h2>{roleLabel} Accounts</h2><p>View, create, and manage {isFaculty ? "faculty" : "class representative"} accounts for the Physics and Circuits Laboratories.</p></div><button type="button" className="admin-primary-button account-create-button" onClick={() => setDialog({ mode: "create", role })}><AdminIcon name="plus" /><span>Create {roleLabel} Account</span></button></div>
      <div className="account-toolbar"><div className="account-search"><AdminIcon name="search" /><input type="search" aria-label={`Search ${roleLabel.toLowerCase()} accounts`} placeholder={isFaculty ? "Search by name or email..." : "Search by name, section, account ID, or email..."} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div><select className="account-status-filter" aria-label="Filter accounts by status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
      {message && <div className="account-feedback" role="status">{message}<button type="button" className="admin-icon-button" aria-label="Dismiss message" onClick={() => setMessage("")}><AdminIcon name="close" /></button></div>}
      <div className="account-table-scroll" role="region" aria-label={`${roleLabel} accounts table`} tabIndex={0}>
        <table className={`account-table ${isFaculty ? "faculty-table" : "classrep-table"}`}>
          <thead><tr><th scope="col">#</th><th scope="col">Full Name</th>{isFaculty ? <><th scope="col">NU Fairview Email</th><th scope="col">Department / Program</th></> : <><th scope="col">Section</th><th scope="col">Account ID</th><th scope="col">Student Email</th><th scope="col">Designated Faculty</th><th scope="col">Laboratory</th></>}<th scope="col">Status</th><th scope="col">Date Created</th><th scope="col" className="account-actions-cell">Actions</th></tr></thead>
          <tbody>{visible.map((account, index) => <tr key={account.id}><td>{offset + index + 1}</td><td>{account.fullName}</td>{account.role === "faculty" ? <><td>{account.email}</td><td>{account.department}</td></> : <><td>{account.section}</td><td>{account.accountId}</td><td>{account.email}</td><td>{facultyName(account.facultyId)}</td><td>{account.laboratory}</td></>}<td><span className={`account-status ${account.status}`}>{account.status === "active" ? "Active" : "Inactive"}</span></td><td>{formatDate(account.createdAt)}</td><td className="account-actions-cell"><div className="account-row-actions"><button type="button" className="account-edit-button" aria-label={`Edit ${account.fullName}`} title="Edit account" onClick={() => setDialog({ mode: "edit", account })}><AdminIcon name="edit" /></button><button type="button" className="account-delete-button" aria-label={`Delete ${account.fullName}`} title="Delete account" onClick={() => setDialog({ mode: "delete", account })}><AdminIcon name="trash" /></button></div></td></tr>)}
          {visible.length === 0 && <tr><td colSpan={isFaculty ? 7 : 10} className="account-empty"><AdminIcon name="search" /><strong>No accounts found</strong><p>Try another search or status filter.</p><button type="button" className="admin-secondary-button" onClick={() => { setSearch(""); setStatus("all"); setPage(1); }}>Clear filters</button></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="account-pagination"><p aria-live="polite">Showing {filtered.length === 0 ? 0 : offset + 1} to {Math.min(offset + PAGE_SIZE, filtered.length)} of {filtered.length} entries</p><nav aria-label="Account table pagination"><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><AdminIcon name="chevron" style={{ transform: "rotate(180deg)" }} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1).map((number, index, numbers) => <span key={number} className="account-page-item">{index > 0 && number - numbers[index - 1] > 1 && <span className="account-page-ellipsis">…</span>}<button className={number === currentPage ? "is-current" : ""} aria-label={`Page ${number}`} aria-current={number === currentPage ? "page" : undefined} onClick={() => setPage(number)}>{number}</button></span>)}<button aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><AdminIcon name="chevron" /></button></nav></div>
      <p className="account-preview-note">Demo accounts · Changes reset on reload.</p>
    </section>
    {dialog && <AccountDialog state={dialog} accounts={accounts} onClose={() => setDialog(null)} onSave={saveAccount} onDelete={deleteAccount} />}
  </main>;
}
