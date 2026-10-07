import { ReportSection } from "../types/agentTraining";

// Labeled blocks recognized in the manager report.
export const MANAGER_SECTION_LABELS = [
  "training scenario",
  "scenario",
  "overall result",
  "overall score",
  "manager summary",
  "quick summary",
  "what the trainee did well",
  "what you did well",
  "coaching opportunities",
  "what to work on next",
  "try this next time",
  "recommended manager action",
  "final encouragement",
];

// Labeled blocks recognized in the trainee self-report.
export const TRAINEE_SECTION_LABELS = [
  "what i did well",
  "what i could improve",
  "what i struggled with",
  "key takeaways",
  "my action plan",
  "next steps",
  "overall reflection",
  "reflection",
  "feedback",
  "what went well",
  "what could be better",
  "what i learned",
];

function titleCaseLabel(label: string): string {
  return label
    .split(/\s+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Normalize a label for matching: lowercase, collapse whitespace.
const normLabel = (s: string) =>
  (s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Build a quick lookup of normalized label -> original label.
function buildLabelIndex(labels: string[]): Map<string, string> {
  const m = new Map<string, string>();
  labels.forEach((l) => m.set(normLabel(l), l));
  return m;
}

// Line-based section parser (O(n), no backtracking). A label must appear at the
// start of a line (optionally indented) and be followed by ":" or end of line.
// The value is everything after it up to the next known label or end of text.
export function parseReportSections(
  text: string,
  labels: string[] = MANAGER_SECTION_LABELS,
): ReportSection[] {
  if (!text || !text.trim()) return [];
  const labelIndex = buildLabelIndex(labels);
  if (labelIndex.size === 0) return [];

  const sections: ReportSection[] = [];
  const seen = new Set<string>();
  let current: { label: string; lines: string[] } | null = null;

  const flush = () => {
    if (current && current.lines.length > 0) {
      const value = current.lines.join("\n").trim();
      if (value) {
        sections.push({ label: titleCaseLabel(current.label), value });
      }
    }
    current = null;
  };

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      if (current) current.lines.push("");
      continue;
    }

    // Try to match a label at the start of this line.
    // Match the longest label first to avoid partial matches.
    let matchedLabel: string | null = null;
    let restAfterLabel = "";
    for (const [nlabel, olabel] of labelIndex) {
      if (trimmed.toLowerCase().startsWith(nlabel)) {
        const after = trimmed.slice(nlabel.length);
        // Label must be followed by ":" or end-of-line (after optional spaces).
        if (after === "" || /^[\s:]/.test(after)) {
          // Prefer the longest matching label for this line.
          if (!matchedLabel || nlabel.length > matchedLabel.length) {
            matchedLabel = olabel;
            restAfterLabel = after.replace(/^[\s:]+/, "");
          }
        }
      }
    }

    if (matchedLabel) {
      const key = normLabel(matchedLabel);
      if (!seen.has(key)) {
        flush();
        seen.add(key);
        current = { label: matchedLabel, lines: [] };
        if (restAfterLabel) current.lines.push(restAfterLabel);
      } else if (current) {
        current.lines.push(trimmed);
      }
    } else if (current) {
      current.lines.push(trimmed);
    }
  }
  flush();

  return sections;
}
