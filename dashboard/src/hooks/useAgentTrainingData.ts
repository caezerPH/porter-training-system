import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { buildAnalytics, ContactRow, CallRow } from "../lib/buildAnalytics";
import { OverallAnalytics } from "../types/agentTraining";
import { generateSampleAnalytics } from "../utils/sampleData";

export interface AutoSyncOptions {
  enabled: boolean;
  intervalMs: number;
}

interface FetchState {
  data: OverallAnalytics;
  isLoading: boolean;
  error: string | null;
  usingSampleData: boolean;
  lastFetchedAt: Date | null;
  rawContactsCount: number;
}

const CONTACTS_SELECT =
  "id,name,email,phone,tags,custom_fields,date_added,ghl_updated_at";
const CALLS_SELECT =
  "id,contact_id,created_at,duration_seconds,recording_path,transcript,summary," +
  "total_score,verdict_band,compliance_auto_fail," +
  "score_opening,score_compliance,score_rapport,score_needs_discovery,score_plan_review," +
  "score_plan_recommendation,score_objection_handling,score_medicare_clarity,score_closing," +
  "score_professionalism,did_well,missed,focus_next_time";

// Reads the Supabase `contacts` mirror (populated server-side by sync-contacts.js)
// and builds the dashboard analytics. No GHL token in the browser; access is gated
// by Supabase Auth + RLS.
export function useAgentTrainingData(autoSync: AutoSyncOptions) {
  const [state, setState] = useState<FetchState>({
    data: generateSampleAnalytics(),
    isLoading: false,
    error: null,
    usingSampleData: true,
    lastFetchedAt: null,
    rawContactsCount: 0,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [contactsRes, callsRes] = await Promise.all([
        supabase
          .from("contacts")
          .select(CONTACTS_SELECT)
          .order("date_added", { ascending: false }),
        supabase.from("calls").select(CALLS_SELECT),
      ]);

      if (contactsRes.error) throw new Error(contactsRes.error.message);
      if (callsRes.error) throw new Error(callsRes.error.message);

      const rows = (contactsRes.data || []) as unknown as ContactRow[];
      const calls = (callsRes.data || []) as unknown as CallRow[];
      const analytics = buildAnalytics(rows, calls);
      setState({
        data: analytics,
        isLoading: false,
        error: null,
        usingSampleData: analytics.agents.length === 0,
        lastFetchedAt: new Date(),
        rawContactsCount: rows.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setState((prev) => ({
        ...prev,
        data: generateSampleAnalytics(),
        isLoading: false,
        error: message,
        usingSampleData: true,
        lastFetchedAt: new Date(),
        rawContactsCount: 0,
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoSync.enabled || autoSync.intervalMs <= 0) return;
    const id = setInterval(fetchData, autoSync.intervalMs);
    return () => clearInterval(id);
  }, [autoSync.enabled, autoSync.intervalMs, fetchData]);

  return { ...state, refetch: fetchData };
}
