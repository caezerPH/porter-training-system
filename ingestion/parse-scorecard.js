// Deterministic parser for the Porter roleplay scorecard spoken at the end of
// each Voice-AI call transcript. Returns a flat object of scorecard columns.
//
// Handles the observed format variants:
//  - scores as digits OR words:  "5 out of 10"  /  "seven out of ten"
//  - totals:  "40 out of 100"  /  "seventy-six out of a hundred"
//  - verdicts: "...so this one would be retraining required." / "...is a pass."
//  - sentences that run together with no space after the period
//  - qualitative-only reviews with NO numeric scores (coach_text still captured)

const PARSE_VERSION = 'v2-2026-10-07';

const CRITERIA = [
  { key: 'score_opening',             label: 'Opening and introduction' },
  { key: 'score_compliance',          label: 'Compliance disclosure' },
  { key: 'score_rapport',             label: 'Rapport and trust' },
  { key: 'score_needs_discovery',     label: 'Needs discovery' },
  { key: 'score_plan_review',         label: 'Current plan review' },
  { key: 'score_plan_recommendation', label: 'Plan recommendation' },
  { key: 'score_objection_handling',  label: 'Objection handling' },
  { key: 'score_medicare_clarity',    label: 'Medicare clarity' },
  { key: 'score_closing',             label: 'Closing and next steps' },
  { key: 'score_professionalism',     label: 'Overall professionalism' },
];

const WORDS = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8,
  nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30,
  forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90, hundred:100,
};

// digits OR a (possibly hyphenated / two-word) number like "forty-five"
const NUM = "(\\d{1,3}|[a-z]+(?:[\\s-][a-z]+)?)";
// denominators spoken as word or digit
const TEN = "(?:10|ten)";
const HUNDRED = "(?:100|(?:a\\s+|one\\s+)?hundred)";

function toNum(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(/[\s-]+/).filter(Boolean);
  let total = 0, any = false;
  for (const p of parts) {
    if (p in WORDS) { total += WORDS[p]; any = true; }
    else return null;
  }
  return any ? total : null;
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function clean(s) { return s ? s.replace(/\s+/g, ' ').trim() : s; }
function sentences(s) {
  if (!s) return [];
  return clean(s).split(/(?<=[.!?])\s+/).map(t => t.trim()).filter(Boolean);
}

function firstMatch(text, patterns) {
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m) return m[1];
  }
  return null;
}

function parseScorecard(transcript) {
  const out = {
    score_opening: null, score_compliance: null, score_rapport: null,
    score_needs_discovery: null, score_plan_review: null,
    score_plan_recommendation: null, score_objection_handling: null,
    score_medicare_clarity: null, score_closing: null, score_professionalism: null,
    total_score: null, verdict_band: null, compliance_auto_fail: false,
    did_well: null, missed: null, focus_next_time: null,
    scorecard_raw: null, scorecard_parsed: false, parse_version: PARSE_VERSION,
  };
  if (!transcript || typeof transcript !== 'string') return out;

  const t = transcript;
  const raw = {};
  let matched = 0;
  let firstScoreIdx = -1;

  // --- per-criterion scores: "<label>, <n> out of ten/10" ---
  // Tolerate a speaker-tag interruption splitting the label or preceding the
  // number, e.g. "Opening and \nhuman:Alright.\nbot:introduction, six out of ten".
  const GAP = "[\\s\\S]{0,25}?";
  const TAG = "(?:\\n?(?:human|user|bot|agent)\\s*:\\s*[^\\n]*\\n?)?";
  for (const c of CRITERIA) {
    const body = c.label.split(/\s+/).map(esc).join(GAP);
    // allow spoken ("<label>, 5 out of 10") and written ("<label> score: 5 out of 10")
    const rx = new RegExp(body + "(?:\\s+score)?\\s*[,:]?\\s*" + TAG + "\\s*" + NUM + "\\s*(?:out of|/)\\s*" + TEN + "\\b", "i");
    const m = t.match(rx);
    if (m) {
      const n = toNum(m[1]);
      if (n != null && n >= 0 && n <= 10) {
        out[c.key] = n;
        raw[c.label] = n;
        matched++;
        if (m.index != null && (firstScoreIdx < 0 || m.index < firstScoreIdx)) firstScoreIdx = m.index;
      }
    }
  }

  // --- total: "comes to 40 out of 100" / "seventy-six out of a hundred" ---
  const totalM = t.match(new RegExp("total\\s+score\\s*:?\\s*" + NUM + "\\s*(?:out of|/)\\s*" + HUNDRED + "\\b", "i"))
              || t.match(new RegExp("comes?\\s+to\\s+" + NUM + "\\s*(?:out of|/)\\s*" + HUNDRED + "\\b", "i"))
              || t.match(new RegExp(NUM + "\\s*(?:out of|/)\\s*" + HUNDRED + "\\b", "i"));
  if (totalM) {
    const n = toNum(totalM[1]);
    if (n != null && n >= 0 && n <= 100) { out.total_score = n; raw.total = n; }
  }

  // --- verdict band: "...so this one would be / is [a] <X>." ---
  const idx100 = t.search(new RegExp("(?:out of|/)\\s*" + HUNDRED + "\\b", "i"));
  if (idx100 >= 0) {
    const after = t.slice(idx100);
    const vm = t.match(/\bresult\s*:\s*(?:a\s+|an\s+)?([^.\n]+?)\s*[.\n]/i)
            || after.match(/so this (?:one|call)\s+(?:would be|is)\s+(?:a\s+|an\s+)?([^.\n]+?)\s*[.\n]/i)
            || after.match(/so this (?:one|call)\s+(?:a\s+|an\s+)?([^.\n]+?)\s*[.\n]/i)
            || after.match(/(?:would be|is)\s+(?:a\s+|an\s+)?([^.\n]+?)\s*[.\n]/i);
    if (vm) { out.verdict_band = clean(vm[1]).toLowerCase(); raw.verdict_band = out.verdict_band; }
  }

  // --- compliance auto-fail (true only for a POSITIVE assertion;
  //     "there was no automatic fail" must stay false) ---
  const afRx = /\bautomatic\s+fail(?:ure)?\b|\bauto-?\s?fail\b/gi;
  let af; let autofail = false;
  while ((af = afRx.exec(t))) {
    const pre = t.slice(Math.max(0, af.index - 28), af.index).toLowerCase();
    if (!/\b(no|not|never|without|avoided?|wasn'?t|weren'?t|isn'?t|aren'?t|didn'?t|won'?t|nearly|almost)\b/.test(pre)) {
      autofail = true; break;
    }
  }
  out.compliance_auto_fail = autofail;
  if (autofail) raw.compliance_auto_fail = true;

  // --- feedback blocks (best-effort; wording varies) ---
  const STOP_DW = "(?=what you missed|where (?:it|you) fell short|(?:a couple of|a few|some) things to tighten|the (?:one|main) thing to focus|one thing you could try|a better way|your full report|$)";
  const STOP_MS = "(?=the (?:one|main) thing to focus|one thing you could try|your full report|$)";
  const STOP_FN = "(?=your full report|that'?s everything|that'?s all|take care|$)";

  const dw = firstMatch(t, [
    new RegExp("things you did well\\s*[:,.\\-]?\\s*([\\s\\S]+?)" + STOP_DW, "i"),
    new RegExp("did\\s+(?:a couple of|a few|some|two|three|four|\\d+)?\\s*things?\\s+(?:really\\s+)?well[.:,\\-]?\\s*([\\s\\S]+?)" + STOP_DW, "i"),
  ]);
  if (dw) { out.did_well = sentences(dw); raw.did_well = out.did_well; }

  const ms = firstMatch(t, [
    new RegExp("what you missed\\s*(?:is|was|:|-)?\\s*([\\s\\S]+?)" + STOP_MS, "i"),
    new RegExp("where (?:it|you) fell short\\s*(?:is|was|:|-)?\\s*([\\s\\S]+?)" + STOP_MS, "i"),
    new RegExp("(?:a couple of|a few|some)\\s+things to tighten up\\s*[:,.\\-]?\\s*([\\s\\S]+?)" + STOP_MS, "i"),
  ]);
  if (ms) { out.missed = sentences(ms); raw.missed = out.missed; }

  const fn = firstMatch(t, [
    new RegExp("the (?:one|main) thing to focus on next time\\s*(?:is|:|-)?\\s*([\\s\\S]+?)" + STOP_FN, "i"),
    new RegExp("one thing you could try next time\\s*[:,.\\-]?\\s*([\\s\\S]+?)" + STOP_FN, "i"),
  ]);
  if (fn) { out.focus_next_time = clean(fn); raw.focus_next_time = out.focus_next_time; }

  // --- full coaching text (always captured when a review section exists) ---
  const anchorRx = /that'?s the roleplay done|let'?s go through how that went|okay,?\s*let'?s go through|here'?s how that went/i;
  const am = t.match(anchorRx);
  let startIdx = am ? am.index : -1;
  if (firstScoreIdx >= 0 && (startIdx < 0 || firstScoreIdx < startIdx)) startIdx = firstScoreIdx;
  if (startIdx >= 0) {
    let coach = t.slice(startIdx);
    const tc = coach.search(/take care/i);
    if (tc >= 0) coach = coach.slice(0, tc + 'take care'.length) + '.';
    raw.coach_text = clean(coach);
  }
  raw.scored = matched > 0;

  // --- decide if this counts as a parsed (numeric) scorecard ---
  out.scorecard_parsed = (out.total_score != null) || matched >= 5;
  out.scorecard_raw = Object.keys(raw).length ? raw : null;

  return out;
}

module.exports = { parseScorecard, CRITERIA, PARSE_VERSION };
