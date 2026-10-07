import { describe, it, expect } from "vitest";
import { parseGhlContactsToAnalytics } from "../utils/trainingReportParser";

// Live GHL smoke test. Credentials are NEVER hardcoded — supply them via env to run:
//   GHL_PIT=... GHL_LOCATION_ID=... GHL_TAG="DBG Agents" npx vitest run liveParser
// Without env vars the suite is skipped (so CI and normal `npm test` stay offline/safe).
const API_BASE = "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_PIT ?? "";
const LOC = process.env.GHL_LOCATION_ID ?? "";
const TAG = process.env.GHL_TAG ?? "";
const headers = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Version: "2021-07-28",
  Authorization: `Bearer ${TOKEN}`,
};

async function fetchAll() {
  const collected: any[] = [];
  let cursor: any;
  for (let i = 0; i < 50; i++) {
    const body: any = { pageLimit: 100, locationId: LOC };
    if (TAG) body.query = TAG;
    if (cursor) body.searchAfter = cursor;
    const r = await fetch(`${API_BASE}/contacts/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const j = await r.json();
    const batch = j.contacts || [];
    collected.push(...batch);
    const last = batch[batch.length - 1];
    cursor =
      last && Array.isArray(last.searchAfter) ? last.searchAfter : undefined;
    if (batch.length < 100) break;
  }
  return collected;
}

describe.skipIf(!TOKEN || !LOC)("live parser", () => {
  it("parses contacts without throwing", async () => {
    const all = await fetchAll();
    const normTag = (t: string) => (t || "").trim().toLowerCase();
    const filtered = TAG
      ? all.filter((c: any) =>
          (c.tags || []).some((t: string) => normTag(t) === normTag(TAG)),
        )
      : all;
    console.log("fetched", all.length, "filtered", filtered.length);

    const analytics = parseGhlContactsToAnalytics(filtered, {});
    console.log("agents parsed:", analytics.agents.length);
    expect(analytics.agents.length).toBeGreaterThan(0);
  }, 60000);
});
