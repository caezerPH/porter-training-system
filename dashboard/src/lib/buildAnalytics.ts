import {
  AgentMetric,
  TrainingAttempt,
  OverallAnalytics,
  ReportSection,
} from "../types/agentTraining";
import { calculateOverallAnalytics } from "../utils/analyticsAggregator";
import { generateSampleAnalytics } from "../utils/sampleData";
import { config } from "../config";
import { stripHtml } from "./stripHtml";
import { parseReport } from "./porterReport";
import { CRITERIA } from "./porterReport";

export interface ContactRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  custom_fields: Record<string, unknown> | null;
  date_added: string | null;
  ghl_updated_at: string | null;
}

export interface CallRow {
  id: string;
  contact_id: string | null;
  created_at: string | null;
  duration_seconds: number | null;
  recording_path: string | null;
  transcript: string | null;
  summary: string | null;
  total_score: number | null;
  verdict_band: string | null;
  compliance_auto_fail: boolean | null;
  score_opening: number | null;
  score_compliance: number | null;
  score_rapport: number | null;
  score_needs_discovery: number | null;
  score_plan_review: number | null;
  score_plan_recommendation: number | null;
  score_objection_handling: number | null;
  score_medicare_clarity: number | null;
  score_closing: number | null;
  score_professionalism: number | null;
  did_well: string[] | null;
  missed: string[] | null;
  focus_next_time: string | null;
}

// column -> criterion label, in rubric order
const CALL_SCORE_COLUMNS: { col: keyof CallRow; label: string }[] = CRITERIA.map(
  (c) => ({ col: (`score_${c.key}` as unknown) as keyof CallRow, label: c.label }),
);

const toYmd = (iso: string | null): string => {
  const d = iso ? new Date(iso) : new Date();
  return (isNaN(d.getTime()) ? new Date() : d).toISOString().slice(0, 10);
};

function agentStatus(score: number, hasScore: boolean, hasData: boolean): AgentMetric["status"] {
  if (!hasData) return "Not Trained";
  if (!hasScore) return "Requires Coaching";
  if (score >= config.bands.pass) return "Certified";
  if (score >= config.bands.needsImprovement) return "In Training";
  return "Requires Coaching";
}
function attemptStatus(score: number, hasScore: boolean, hasData: boolean): TrainingAttempt["status"] {
  if (!hasData) return "Not Trained";
  if (!hasScore) return "Needs Review";
  if (score >= config.bands.pass) return "Passed";
  if (score >= config.bands.needsImprovement) return "Needs Review";
  return "Failed";
}

// Build the per-call manager report sections from the call's parsed scorecard.
function callSections(call: CallRow): ReportSection[] {
  const sections: ReportSection[] = [];
  const scoreLines = CALL_SCORE_COLUMNS.filter((c) => call[c.col] != null).map(
    (c) => `${c.label}: ${call[c.col]}/10`,
  );
  if (scoreLines.length) {
    sections.push({
      label: "Scorecard",
      value:
        scoreLines.join("\n") +
        (call.total_score != null ? `\nTotal: ${call.total_score}/100` : ""),
    });
  }
  if (call.verdict_band) {
    const verdict = call.verdict_band.replace(/\b\w/g, (m) => m.toUpperCase());
    sections.push({
      label: "Result",
      value: verdict + (call.compliance_auto_fail ? " — Automatic fail" : ""),
    });
  }
  if (call.did_well?.length) {
    sections.push({ label: "What They Did Well", value: call.did_well.map((s) => `• ${s}`).join("\n") });
  }
  if (call.missed?.length) {
    sections.push({ label: "What You Missed", value: call.missed.map((s) => `• ${s}`).join("\n") });
  }
  if (call.focus_next_time) {
    sections.push({ label: "Focus Next Time", value: call.focus_next_time });
  }
  return sections;
}

// Turn Supabase `contacts` + `calls` into the OverallAnalytics shape the UI expects.
// Each Voice-AI call is a training attempt (so attempts, averages, and the progression
// chart reflect real call history). The contact's HTML report gives identity + scenario.
export function buildAnalytics(contacts: ContactRow[], calls: CallRow[] = []): OverallAnalytics {
  const fm = config.fieldMap;

  const callsByContact = new Map<string, CallRow[]>();
  for (const c of calls) {
    if (!c.contact_id) continue;
    const arr = callsByContact.get(c.contact_id) || [];
    arr.push(c);
    callsByContact.set(c.contact_id, arr);
  }

  const agents: AgentMetric[] = [];

  for (const row of contacts) {
    const cf = (row.custom_fields || {}) as Record<string, unknown>;
    const val = (id: string) => {
      const v = cf[id];
      return v == null ? "" : String(v);
    };

    const report = stripHtml(val(fm.managerReport) || val(fm.traineeReport));
    const contactCalls = (callsByContact.get(row.id) || []).slice();
    const hasTrainingData = report.trim().length > 0 || contactCalls.length > 0;
    // Only trainees (a report OR calls). Skips bare inbound leads.
    if (!hasTrainingData) continue;

    const name =
      (val(fm.name) || row.name || row.email || `Agent ${row.id.slice(0, 5)}`).trim();
    const scenario = val(fm.scenario);
    const difficulty = val(fm.difficulty);
    const version = val(fm.version);

    const extra: Record<string, string> = {};
    if (scenario) extra["Scenario"] = scenario;
    if (difficulty) extra["Difficulty"] = difficulty;
    if (version) extra["Version"] = version;
    const extraFields = Object.keys(extra).length ? extra : undefined;

    // oldest -> newest so attempt tabs / progression read left-to-right in time
    contactCalls.sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || ""),
    );

    let attempts: TrainingAttempt[];

    if (contactCalls.length > 0) {
      attempts = contactCalls.map((call) => {
        const hasScore = call.total_score != null;
        const score = call.total_score ?? 0;
        return {
          id: `att-${call.id}`,
          contactId: row.id,
          agentName: name,
          email: row.email || "",
          phone: row.phone || "",
          date: toYmd(call.created_at),
          managerName: "",
          scenario,
          score,
          hasScore,
          hasTrainingData: true,
          status: attemptStatus(score, hasScore, true),
          originalReport: "",
          cleanReport: "",
          traineeReport: "",
          managerSections: callSections(call),
          traineeSections: [],
          tags: row.tags || [],
          customFields: extraFields,
          questionsAnswered: [],
          callId: call.id,
          recordingPath: call.recording_path,
          transcript: call.transcript,
          callSummary: call.summary,
          durationSeconds: call.duration_seconds,
        } as TrainingAttempt;
      });
    } else {
      // Fallback: no calls linked — use the contact's HTML report as one attempt.
      const parsed = parseReport(report);
      const hasScore = parsed.total != null;
      const score = parsed.total ?? 0;
      const sections: ReportSection[] = [];
      if (parsed.categories.length) {
        sections.push({
          label: "Scorecard",
          value:
            parsed.categories.map((c) => `${c.label}: ${c.score}/10`).join("\n") +
            (parsed.total != null ? `\nTotal: ${parsed.total}/100` : ""),
        });
      }
      if (parsed.verdict) {
        sections.push({
          label: "Result",
          value:
            parsed.verdict +
            (parsed.autoFail ? ` — Automatic fail${parsed.autoFailReason ? `: ${parsed.autoFailReason}` : ""}` : ""),
        });
      }
      if (parsed.didWell.length) sections.push({ label: "What They Did Well", value: parsed.didWell.map((s) => `• ${s}`).join("\n") });
      if (parsed.improve.length) sections.push({ label: "Areas for Improvement", value: parsed.improve.map((s) => `• ${s}`).join("\n") });

      attempts = [
        {
          id: `att-${row.id}`,
          contactId: row.id,
          agentName: name,
          email: row.email || "",
          phone: row.phone || "",
          date: toYmd(row.date_added || row.ghl_updated_at),
          managerName: "",
          scenario,
          score,
          hasScore,
          hasTrainingData: true,
          status: attemptStatus(score, hasScore, true),
          originalReport: report,
          cleanReport: "",
          traineeReport: "",
          managerSections: sections,
          traineeSections: [],
          tags: row.tags || [],
          customFields: extraFields,
          questionsAnswered: [],
        },
      ];
    }

    const scored = attempts.filter((a) => a.hasScore);
    const averageScore = scored.length
      ? Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length)
      : 0;
    const bestScore = scored.length ? Math.max(...scored.map((a) => a.score)) : 0;
    const latest = attempts[attempts.length - 1];

    agents.push({
      id: `agent-${row.id}`,
      contactId: row.id,
      agentName: name,
      email: row.email || "",
      phone: row.phone || "",
      attemptsCount: attempts.length,
      latestScore: latest.score,
      averageScore,
      bestScore,
      hasScore: scored.length > 0,
      hasTrainingData: true,
      status: agentStatus(averageScore, scored.length > 0, true),
      managerName: "",
      scenario,
      lastTrainingDate: latest.date,
      struggleCount: 0,
      customFields: extraFields,
      attempts,
    });
  }

  if (!agents.length) return generateSampleAnalytics();
  return calculateOverallAnalytics(agents);
}
