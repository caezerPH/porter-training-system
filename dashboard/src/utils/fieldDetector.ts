// Normalize a custom-field key for matching: lowercase, strip spaces AND underscores.
// The CRM returns field names like "Training Report Original" (spaces) but users configure
// "training_report_original" (underscores) — both must resolve to the same value.
export const normalizeKey = (key: string): string =>
  (key || "")
    .toLowerCase()
    // Strip merge-field wrappers like {{contact.xxx}} / {{custom_field.xxx}}
    .replace(/^\{\{\s*(?:contact|custom_field|customfield)\./, "")
    .replace(/^\{\{/, "")
    .replace(/\}\}\s*$/, "")
    // Strip a bare "contact." / "custom_field." prefix (no braces)
    .replace(/^(?:contact|custom_field|customfield)\./, "")
    .replace(/[\s_.\-]+/g, "");

// Build a lookup map keyed by normalized names so any naming variant matches.
export function buildCustomFieldMap(raw: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;

  const assign = (k: string, v: any) => {
    if (!k) return;
    const nk = normalizeKey(k);
    if (!nk) return;
    const sv = v == null ? "" : String(v);
    if (sv || map[nk] === undefined) map[nk] = sv;
  };

  if (Array.isArray(raw)) {
    raw.forEach((cf: any) => {
      if (!cf || typeof cf !== "object") return;
      const k = cf.id || cf.name || cf.field_key || cf.key || cf.fieldKey || "";
      const v = cf.value ?? cf.val ?? "";
      assign(k, v);
    });
  } else if (typeof raw === "object") {
    Object.keys(raw).forEach((k) => assign(k, (raw as any)[k]));
  }
  return map;
}

// Known labeled blocks used to bound the value captured after a label line.
const KNOWN_LABELS = [
  "trainee",
  "manager",
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

// Line-anchored label extraction. A label must appear at the START of a line
// (optionally indented) and be followed by ":" or end of line — this prevents
// matching "MANAGER" inside a header like "TRAINING REPORT - FOR THE MANAGER",
// which was causing the manager name to be captured as the trainee's name.
export function extractLabeledValue(text: string, label: string): string {
  if (!text) return "";
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const labelLineRe = new RegExp(
    `(?:^|\\n)\\s*${esc}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${KNOWN_LABELS.join(
      "|",
    )})\\s*:?\\s|\\n\\s*\\n|$)`,
    "i",
  );
  const m = text.match(labelLineRe);
  if (!m) return "";
  return m[1].trim();
}

export interface DetectedFields {
  managerReport: string;
  traineeReport: string;
  scenario: string;
  managerName: string;
  traineeName: string;
  otherFields: { key: string; value: string }[];
}

// The CRM returns custom fields keyed by OPAQUE IDs (e.g. "wPPje9Kvk5vwkZ3oEU9z"),
// NOT by friendly names. The field-definitions endpoint requires OAuth, so we cannot
// resolve names→IDs. Instead we detect which custom field holds which report by
// inspecting its VALUE content, since the reports carry distinctive headers.
export function detectFieldsByContent(
  customFieldsList: { id?: string; name?: string; value?: any }[],
): DetectedFields {
  const out: DetectedFields = {
    managerReport: "",
    traineeReport: "",
    scenario: "",
    managerName: "",
    traineeName: "",
    otherFields: [],
  };

  for (const cf of customFieldsList) {
    const rawVal = cf?.value;
    const val = rawVal == null ? "" : String(rawVal);
    const key = cf?.id || cf?.name || "field";
    const head =
      val
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)[0] || "";
    const upper = (val + "\n" + head).toUpperCase();

    if (
      !out.managerReport &&
      (upper.includes("FOR THE MANAGER") ||
        upper.includes("MANAGER REPORT") ||
        upper.includes("TRAINING REPORT"))
    ) {
      out.managerReport = val;
      continue;
    }
    if (
      !out.traineeReport &&
      (upper.includes("TRAINEE VERSION") ||
        upper.includes("TRAINEE FEEDBACK") ||
        upper.includes("TRAINEE REPORT"))
    ) {
      out.traineeReport = val;
      continue;
    }
    out.otherFields.push({ key, value: val });
  }

  const reportForLabels = out.managerReport || out.traineeReport || "";
  if (reportForLabels) {
    if (!out.traineeName)
      out.traineeName = extractLabeledValue(reportForLabels, "trainee");
    if (!out.managerName)
      out.managerName = extractLabeledValue(reportForLabels, "manager");
    if (!out.scenario)
      out.scenario = extractLabeledValue(reportForLabels, "training scenario");
    if (!out.scenario)
      out.scenario = extractLabeledValue(reportForLabels, "scenario");
  }

  return out;
}
