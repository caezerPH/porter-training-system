// Deterministic parser for the EZAI roleplay training report (lives as HTML in a
// GHL contact custom field). Label-anchored so it is immune to HTML-collapse and
// never grabs a stray "%"/"7/10" — it reads the authoritative "Total NN/100".
//
// Mirrors ../../../ingestion/parse-scorecard.js (same 10 criteria) but for the
// written report format: "<label> 7/10 … Total 76/100 … Result Retraining Required".

export const CRITERIA: { key: string; label: string }[] = [
  { key: "opening", label: "Opening and introduction" },
  { key: "compliance", label: "Compliance disclosure" },
  { key: "rapport", label: "Rapport and trust" },
  { key: "needs_discovery", label: "Needs discovery" },
  { key: "plan_review", label: "Current plan review" },
  { key: "plan_recommendation", label: "Plan recommendation" },
  { key: "objection_handling", label: "Objection handling" },
  { key: "medicare_clarity", label: "Medicare clarity" },
  { key: "closing", label: "Closing and next steps" },
  { key: "professionalism", label: "Overall professionalism" },
];

export interface ParsedReport {
  categories: { key: string; label: string; score: number }[];
  total: number | null;
  planAccuracy: number | null;
  verdict: string | null; // e.g. "Retraining Required"
  autoFail: boolean;
  autoFailReason: string;
  didWell: string[];
  improve: string[];
  hasScorecard: boolean;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function splitItems(block: string): string[] {
  if (!block) return [];
  return block
    .split(/(?<=[.!?])\s+(?=[A-Z])|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 8);
}

export function parseReport(text: string): ParsedReport {
  const out: ParsedReport = {
    categories: [],
    total: null,
    planAccuracy: null,
    verdict: null,
    autoFail: false,
    autoFailReason: "",
    didWell: [],
    improve: [],
    hasScorecard: false,
  };
  if (!text || !text.trim()) return out;
  const t = text.replace(/ /g, " ");

  // --- per-criterion scores: "<label> 7/10" (optionally "<label>: 7 / 10") ---
  for (const c of CRITERIA) {
    const rx = new RegExp(esc(c.label) + "\\s*[:\\-]?\\s*(\\d{1,2})\\s*/\\s*10\\b", "i");
    const m = t.match(rx);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 0 && n <= 10) out.categories.push({ key: c.key, label: c.label, score: n });
    }
  }

  // --- total /100: prefer "Total NN/100", then "Call Score NN/100" ---
  const totalM =
    t.match(/\btotal\s*(?:score)?\s*[:\-]?\s*(\d{1,3})\s*\/\s*100\b/i) ||
    t.match(/call\s*score\s*[:\-]?\s*(\d{1,3})\s*\/\s*100\b/i);
  if (totalM) {
    const n = parseInt(totalM[1], 10);
    if (n >= 0 && n <= 100) out.total = n;
  }

  // --- plan accuracy "Plan Accuracy 7 / 10" ---
  const paM = t.match(/plan\s*accuracy\s*[:\-]?\s*(\d{1,2})\s*\/\s*10\b/i);
  if (paM) out.planAccuracy = parseInt(paM[1], 10);

  // --- verdict band ---
  const vM = t.match(
    /\b(?:final\s+)?result\s*[:\-]?\s*(retraining required|needs improvement|pass(?:ed)?)\b/i,
  );
  if (vM) out.verdict = vM[1].replace(/\bpassed\b/i, "Pass").trim();

  // --- compliance auto-fail (positive assertion only) ---
  const afM = t.match(/automatic\s+fail\s*[:\-]?\s*(yes|no)\b([^\n.]*)/i);
  if (afM) {
    out.autoFail = /^yes$/i.test(afM[1]);
    out.autoFailReason = out.autoFail ? (afM[2] || "").replace(/^[,\s]+/, "").trim() : "";
  }

  // --- narrative blocks ---
  const dwM = t.match(
    /what\s+they\s+did\s+well\s*[:\-]?\s*([\s\S]*?)(?=areas for improvement|compliance check|plan accuracy check|$)/i,
  );
  if (dwM) out.didWell = splitItems(dwM[1]);

  const impM = t.match(
    /areas\s+for\s+improvement\s*[:\-]?\s*([\s\S]*?)(?=compliance check|plan accuracy check|final decision|$)/i,
  );
  if (impM) out.improve = splitItems(impM[1]);

  out.hasScorecard = out.total != null || out.categories.length >= 5;
  return out;
}
