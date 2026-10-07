import { describe, it, expect } from "vitest";
import { parseReport, CRITERIA } from "../lib/porterReport";
import { stripHtml } from "../lib/stripHtml";

// Representative of the real Porter manager report (HTML in a GHL custom field).
const SAMPLE_HTML = `
<div><h1>Porter Insurance Professionals</h1>
<p>Training Call Report — Trainee Chauncey Porter</p>
<p>Final Result Retraining Required &nbsp; Call Score 76 / 100 &nbsp; Plan Accuracy 7 / 10</p>
<table>
<tr><td>Opening and introduction</td><td>7/10</td></tr>
<tr><td>Compliance disclosure</td><td>8/10</td></tr>
<tr><td>Rapport and trust</td><td>8/10</td></tr>
<tr><td>Needs discovery</td><td>8/10</td></tr>
<tr><td>Current plan review</td><td>8/10</td></tr>
<tr><td>Plan recommendation</td><td>7/10</td></tr>
<tr><td>Objection handling</td><td>7/10</td></tr>
<tr><td>Medicare clarity</td><td>8/10</td></tr>
<tr><td>Closing and next steps</td><td>7/10</td></tr>
<tr><td>Overall professionalism</td><td>8/10</td></tr>
<tr><td>Total</td><td>76/100</td></tr>
</table>
<p>Automatic fail: Yes, asked about health conditions without consent.</p>
<p>Current plan specialist is 15% coinsurance and dental 50% coinsurance.</p>
<p>What They Did Well Accurately summarized the current UHC plan. Offered a clear comparison to lower specialist costs.</p>
<p>Areas for Improvement Obtain consent before health questions. Complete needs discovery before recommending.</p>
<p>Compliance Check: Fail</p>
</div>`;

describe("parseReport (Porter training report)", () => {
  const parsed = parseReport(stripHtml(SAMPLE_HTML));

  it("reads the authoritative Total /100, not a stray % or /10", () => {
    expect(parsed.total).toBe(76); // not 15, 50, or 70
  });

  it("extracts all 10 category scores", () => {
    expect(parsed.categories).toHaveLength(CRITERIA.length);
    const byLabel = Object.fromEntries(parsed.categories.map((c) => [c.label, c.score]));
    expect(byLabel["Opening and introduction"]).toBe(7);
    expect(byLabel["Compliance disclosure"]).toBe(8);
    expect(byLabel["Overall professionalism"]).toBe(8);
  });

  it("reads verdict band and compliance auto-fail with reason", () => {
    expect(parsed.verdict).toMatch(/retraining required/i);
    expect(parsed.autoFail).toBe(true);
    expect(parsed.autoFailReason).toMatch(/health conditions/i);
  });

  it("captures narrative blocks", () => {
    expect(parsed.didWell.length).toBeGreaterThan(0);
    expect(parsed.improve.length).toBeGreaterThan(0);
    expect(parsed.planAccuracy).toBe(7);
  });

  it("returns empty (no fabrication) for text with no scorecard", () => {
    const empty = parseReport("Just some notes, no scores here.");
    expect(empty.total).toBeNull();
    expect(empty.categories).toHaveLength(0);
    expect(empty.hasScorecard).toBe(false);
  });
});
