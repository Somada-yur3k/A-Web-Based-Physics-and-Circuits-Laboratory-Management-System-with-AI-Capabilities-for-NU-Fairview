"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LabIcon, { type LabIconName } from "@/components/dashboard/lab-icon";
import { dashboardHref, type DashboardRole } from "./config";
import { dashboardSnapshots, formatDashboardDate, type DashboardRequest } from "./demo-data";

function RequestDetails({ request, role, onClose }: { request: DashboardRequest; role: DashboardRole; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const isFaculty = role === "faculty";
  return <dialog ref={dialog} className="lab-details-dialog" aria-labelledby="lab-details-title" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <header><div><p>{isFaculty ? "LABORATORY REQUEST" : "LABORATORY RESERVATION"}</p><h2 id="lab-details-title">{request.reference}</h2></div><button className="lab-icon-button" aria-label="Close details" onClick={() => dialog.current?.close()}><LabIcon name="close" /></button></header>
    <div className="lab-details-body"><span className={`lab-status ${request.status.toLowerCase().replace(/\s/g, "-")}`}>{request.status}</span><dl><div><dt>Date Submitted</dt><dd>{formatDashboardDate(request.date)}</dd></div><div><dt>Section</dt><dd>{request.section}</dd></div><div><dt>Laboratory</dt><dd>{request.laboratory}</dd></div><div><dt>{isFaculty ? "Schedule Type" : "Reservation Type"}</dt><dd>{request.type}</dd></div></dl><p className="lab-details-note">This is a sample record for the dashboard preview.</p><button className="lab-outline-button" onClick={() => dialog.current?.close()}>Close</button></div>
  </dialog>;
}

export default function DashboardHome({ role }: { role: DashboardRole }) {
  const snapshot = dashboardSnapshots[role];
  const isFaculty = role === "faculty";
  const [selectedRequest, setSelectedRequest] = useState<DashboardRequest | null>(null);
  const createLabel = isFaculty ? "Create Request" : "Make Reservation";
  const createPath = "service-request";
  const recentPath = isFaculty ? "reservation-status" : "my-reservations";
  const quickActions: { label: string; slug: string; icon: LabIconName; tone: string }[] = [
    { label: createLabel, slug: createPath, icon: "calendar-plus", tone: "blue" },
    { label: "View Schedule", slug: "schedule", icon: "inventory", tone: "amber" },
    { label: isFaculty ? "Reservation Status" : "My Reservation", slug: recentPath, icon: "report", tone: "blue" },
  ];
  if (!isFaculty) quickActions.push({ label: "Clearance", slug: "clearance-status", icon: "shield", tone: "green" });

  return <main className="lab-dashboard-content">
    <div className="lab-page-heading"><div><h1>{snapshot.title}</h1><p>{snapshot.description}</p></div><time dateTime={snapshot.asOf}>{formatDashboardDate(snapshot.asOf, true)}</time></div>
    <section className="lab-stats" aria-label="Dashboard summary">{snapshot.stats.map(({ label, value, icon, tone }) => <article key={label} className="lab-stat-card"><span className={`lab-stat-icon ${tone}`}><LabIcon name={icon} /></span><dl><dt>{label}</dt><dd>{value}</dd></dl></article>)}</section>
    <div className="lab-primary-grid">
      <section className="lab-panel lab-schedule-panel" aria-labelledby="lab-schedule-title"><header className="lab-panel-heading"><h2 id="lab-schedule-title"><LabIcon name="calendar" /><span>Upcoming Circuits Lab Schedule</span></h2><Link href={dashboardHref(role, "schedule")}>View Full Schedule</Link></header><div className="lab-table-scroll" tabIndex={0} role="region" aria-label="Upcoming schedule table"><table className="lab-table lab-schedule-table"><thead><tr><th scope="col">Date</th><th scope="col">Time</th><th scope="col">Section</th><th scope="col">Laboratory</th></tr></thead><tbody>{snapshot.schedule.map((session) => <tr key={`${session.date}-${session.section}`}><td><time dateTime={session.date}>{formatDashboardDate(session.date)}</time></td><td>{session.time}</td><td>{session.section}</td><td>{session.laboratory}</td></tr>)}</tbody></table></div></section>
      <section className="lab-create-panel" aria-labelledby="lab-create-title"><div className="lab-create-copy"><span className="lab-create-icon"><LabIcon name={isFaculty ? "request" : "calendar-plus"} /></span><div><h2 id="lab-create-title">{isFaculty ? "Create a Laboratory Service Request" : "Make a Circuits Lab Reservation"}</h2><p>{isFaculty ? "Submit a request for laboratory equipment, materials, or special setup for your Circuits laboratory sessions." : "Submit a new reservation for the Circuits Laboratory. Choose between Group or Student Only reservation type."}</p></div></div><Link href={dashboardHref(role, createPath)} className="lab-primary-button"><span>{createLabel}</span><LabIcon name="arrow" /></Link></section>
    </div>
    <div className="lab-secondary-grid">
      <section className="lab-panel lab-recent-panel" aria-labelledby="lab-recent-title"><header className="lab-panel-heading"><h2 id="lab-recent-title"><LabIcon name="report" /><span>{isFaculty ? "Recent Laboratory Requests" : "Recent Circuits Lab Reservations"}</span></h2><Link href={dashboardHref(role, recentPath)}>View All</Link></header><div className="lab-table-scroll" tabIndex={0} role="region" aria-label={isFaculty ? "Recent requests table" : "Recent reservations table"}><table className="lab-table lab-recent-table"><thead><tr><th scope="col">Ref No.</th><th scope="col">Date</th><th scope="col">{isFaculty ? "Section" : "Laboratory"}</th><th scope="col">{isFaculty ? "Schedule Type" : "Reservation Type"}</th><th scope="col">Status</th><th scope="col" className="lab-action-column">Action</th></tr></thead><tbody>{snapshot.requests.map((request) => <tr key={request.reference}><td>{request.reference}</td><td><time dateTime={request.date}>{formatDashboardDate(request.date)}</time></td><td>{isFaculty ? request.section : request.laboratory}</td><td>{request.type}</td><td><span className={`lab-status ${request.status.toLowerCase().replace(/\s/g, "-")}`}>{request.status}</span></td><td className="lab-action-column"><button className="lab-view-button" aria-label={`View ${request.reference}`} onClick={() => setSelectedRequest(request)}>View</button></td></tr>)}</tbody></table></div></section>
      <section className="lab-panel lab-quick-panel" aria-labelledby="lab-quick-title"><header className="lab-quick-heading"><LabIcon name="bolt" /><div><h2 id="lab-quick-title">Quick Actions</h2><p>Common tasks for Circuits laboratory {isFaculty ? "faculty" : "representatives"}.</p></div></header><div className={`lab-quick-grid${isFaculty ? " faculty-quick-grid" : ""}`}>{quickActions.map(({ label, slug, icon, tone }) => <Link key={slug} href={dashboardHref(role, slug)} className="lab-quick-action"><span className={`lab-quick-icon ${tone}`}><LabIcon name={icon} /></span><LabIcon name="chevron" className="lab-quick-chevron" /><strong>{label}</strong></Link>)}</div></section>
    </div>
    <p className="lab-preview-note">Dashboard preview · Sample data</p>
    {selectedRequest && <RequestDetails request={selectedRequest} role={role} onClose={() => setSelectedRequest(null)} />}
  </main>;
}
