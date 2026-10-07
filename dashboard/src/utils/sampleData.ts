import { OverallAnalytics } from "../types/agentTraining";
import { calculateOverallAnalytics } from "./analyticsAggregator";

// The dashboard intentionally ships with NO simulated/demo data. When no
// credentials are configured (or no matching contacts are returned), we show
// a genuinely empty analytics object so every KPI reads 0 / blank and all
// lists render their empty state.
export function generateSampleAnalytics(): OverallAnalytics {
  return calculateOverallAnalytics([]);
}
