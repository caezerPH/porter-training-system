import {
  TrainingAttempt,
  AgentMetric,
  OverallAnalytics,
} from "../types/agentTraining";
import { calculateOverallAnalytics } from "./analyticsAggregator";
import { generateSampleAnalytics } from "./sampleData";
import {
  parseReportSections,
  MANAGER_SECTION_LABELS,
  TRAINEE_SECTION_LABELS,
} from "./reportSections";
import { parseScoreFromText } from "./scoreParser";
import { extractQuestionsFromReport } from "./questionExtractor";
import {
  normalizeKey,
  buildCustomFieldMap,
  detectFieldsByContent,
} from "./fieldDetector";

// Re-export so existing imports keep working
export { calculateOverallAnalytics, generateSampleAnalytics };
export { parseScoreFromText };
export { extractQuestionsFromReport };

export interface ParseOptions {
  extraFieldKeys?: string[];
  npnFieldId?: string;
}

// Transform raw CRM Contact objects into structured Agent metrics
export function parseGhlContactsToAnalytics(
  contacts: any[],
  options: ParseOptions = {},
): OverallAnalytics {
  if (!contacts || contacts.length === 0) {
    return generateSampleAnalytics();
  }

  // Normalize extra field keys the same way we normalize contact field keys
  const extraFieldKeys = (options.extraFieldKeys || []).map(normalizeKey);
  // The CRM stores custom fields keyed by opaque IDs (not friendly names), and
  // the field-definitions endpoint requires OAuth, so we cannot auto-resolve the
  // friendly name "npn_national_producer_number" to its ID. Instead the user
  // provides the opaque field ID directly in Connectivity settings.
  const npnFieldId = (options.npnFieldId || "").trim();

  const agentsMap = new Map<string, AgentMetric>();

  contacts.forEach((contact: any) => {
    const customFields =
      contact.customFields ||
      contact.custom_fields ||
      contact.customField ||
      {};
    const customFieldsList: { id?: string; name?: string; value?: any }[] =
      Array.isArray(customFields)
        ? customFields
        : Object.keys(customFields).map((k) => ({
            id: k,
            value: (customFields as any)[k],
          }));

    const customFieldsMap = buildCustomFieldMap(customFields);

    const getField = (...keys: string[]): string => {
      for (const k of keys) {
        const nk = normalizeKey(k);
        if (customFieldsMap[nk]) return customFieldsMap[nk];
      }
      return "";
    };

    // ---- Content-based detection (works around opaque CRM field IDs) ----
    const detected = detectFieldsByContent(customFieldsList);

    const extraFields: Record<string, string> = {};
    extraFieldKeys.forEach((key) => {
      if (customFieldsMap[key]) {
        extraFields[key] = customFieldsMap[key];
      }
    });

    const origReport =
      detected.managerReport ||
      getField(
        "training_report_original",
        "training_report",
        "training report original",
        "report original",
      ) ||
      contact.training_report_original ||
      "";
    const cleanReport =
      getField(
        "training_clean_report",
        "clean_report",
        "training clean report",
        "clean report",
      ) ||
      contact.training_clean_report ||
      "";
    const traineeReport =
      detected.traineeReport ||
      getField(
        "training_trainee_report",
        "trainee_report",
        "training trainee report",
        "trainee report",
      ) ||
      contact.training_trainee_report ||
      "";
    const scenario =
      detected.scenario ||
      getField("training_scenario", "scenario", "training scenario") ||
      contact.training_scenario ||
      "";
    const managerName =
      detected.managerName ||
      getField(
        "training_manager_name",
        "manager_name",
        "training manager name",
        "manager",
      ) ||
      contact.training_manager_name ||
      "";
    const traineeNameFromReport = detected.traineeName;
    const agentNameCustom =
      traineeNameFromReport ||
      getField("agent_name", "agent", "agent name") ||
      contact.agent_name ||
      "";

    const displayName =
      agentNameCustom.trim() ||
      `${contact.firstName || contact.first_name || ""} ${contact.lastName || contact.last_name || ""}`.trim() ||
      contact.name ||
      contact.companyName ||
      contact.email ||
      "Agent " + (contact.id || "").substring(0, 5);

    const email = contact.email || "";
    const phone = contact.phone || "";
    // NPN: try the configured opaque CRM field ID first (most reliable), then
    // fall back to friendly-name lookups for accounts that use named keys.
    let npn = "";
    if (npnFieldId) {
      for (const cf of customFieldsList) {
        const id = cf?.id || cf?.name || "";
        if (id === npnFieldId) {
          npn = cf?.value == null ? "" : String(cf.value).trim();
          break;
        }
      }
    }
    if (!npn) {
      npn =
        getField(
          "npn_national_producer_number",
          "npn",
          "national_producer_number",
          "national producer number",
          "npn number",
        ) ||
        contact.npn_national_producer_number ||
        "";
    }
    const date =
      contact.dateAdded ||
      contact.date_added ||
      contact.updatedAt ||
      new Date().toISOString();

    const reportText = `${origReport} ${cleanReport} ${traineeReport}`.trim();
    const hasTrainingData = reportText.length > 0;
    const parsedScore = parseScoreFromText(reportText);
    const hasScore = parsedScore !== null;
    const score = parsedScore ?? 0;

    const questionsAnswered = extractQuestionsFromReport(
      traineeReport,
      cleanReport || origReport,
    );
    const struggleCount = questionsAnswered.filter((q) => q.struggled).length;

    const managerSections = parseReportSections(
      origReport || cleanReport,
      MANAGER_SECTION_LABELS,
    );
    const traineeSections = parseReportSections(
      traineeReport,
      TRAINEE_SECTION_LABELS,
    );

    let status: TrainingAttempt["status"];
    if (!hasTrainingData) status = "Not Trained";
    else if (!hasScore) status = "Needs Review";
    else if (score >= 80) status = "Passed";
    else if (score >= 65) status = "Needs Review";
    else status = "Failed";

    const attempt: TrainingAttempt = {
      id: `att-${contact.id || Math.random()}`,
      contactId: contact.id || `cid-${Math.random()}`,
      agentName: displayName,
      email,
      phone,
      npn: npn || undefined,
      date: new Date(date).toISOString().split("T")[0],
      managerName: managerName || "",
      scenario: scenario || "",
      score,
      hasScore,
      hasTrainingData,
      status,
      originalReport: origReport || "",
      cleanReport: cleanReport || "",
      traineeReport: traineeReport || "",
      managerSections,
      traineeSections,
      tags: contact.tags || [],
      customFields: Object.keys(extraFields).length ? extraFields : undefined,
      questionsAnswered,
    };

    if (!agentsMap.has(displayName)) {
      agentsMap.set(displayName, {
        id: `agent-${contact.id || Math.random()}`,
        contactId: contact.id || "",
        agentName: displayName,
        email,
        phone,
        npn: npn || undefined,
        attemptsCount: 1,
        latestScore: score,
        averageScore: score,
        bestScore: score,
        hasScore,
        hasTrainingData,
        status: !hasTrainingData
          ? "Not Trained"
          : !hasScore
            ? "Requires Coaching"
            : score >= 82
              ? "Certified"
              : score >= 68
                ? "In Training"
                : "Requires Coaching",
        managerName: attempt.managerName,
        scenario: attempt.scenario,
        lastTrainingDate: attempt.date,
        struggleCount,
        customFields: Object.keys(extraFields).length ? extraFields : undefined,
        attempts: [attempt],
      });
    } else {
      const existing = agentsMap.get(displayName)!;
      existing.attempts.push(attempt);
      existing.attemptsCount += 1;
      existing.latestScore = score;
      existing.bestScore = Math.max(existing.bestScore, score);
      existing.averageScore = Math.round(
        existing.attempts.reduce((sum, a) => sum + a.score, 0) /
          existing.attempts.length,
      );
      existing.struggleCount += struggleCount;
      existing.hasTrainingData =
        existing.hasTrainingData || attempt.hasTrainingData;
      existing.hasScore = existing.hasScore || attempt.hasScore;
      existing.status = !existing.hasTrainingData
        ? "Not Trained"
        : !existing.hasScore
          ? "Requires Coaching"
          : existing.averageScore >= 82
            ? "Certified"
            : existing.averageScore >= 68
              ? "In Training"
              : "Requires Coaching";
    }
  });

  const agentsList = Array.from(agentsMap.values());
  return calculateOverallAnalytics(agentsList);
}
