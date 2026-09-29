"use client";

import { useCallback, useEffect, useState } from "react";
import { initialOfficialBlocks, type OfficialBlock } from "./official-schedule-data";
import { classesForOfficialBlocks, roomBlocksForDate, type AvailabilityBlock, type ScheduleDraft } from "./room-availability";

export default function useOfficialSchedule() {
  const [official, setOfficial] = useState<OfficialBlock[]>(initialOfficialBlocks);
  const [reservations, setReservations] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/demo/schedule", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load the official schedule.");
      setOfficial(data.blocks);
      setReservations(data.reservations);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the official schedule."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const classes = classesForOfficialBlocks(official);
  const blocksFor = (draft: ScheduleDraft) => roomBlocksForDate(draft.roomId, draft.date, official, reservations);
  return { official, reservations, classes, blocksFor, loading, error, refresh };
}
