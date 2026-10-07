// Backfill: pull every GHL Voice-AI call -> parse scorecard -> download WAV to
// Supabase Storage -> upsert row into public.calls.
//
// Usage:
//   node backfill.js                 full run (download recordings + upsert)
//   node backfill.js --limit 3       only the first 3 calls (smoke test)
//   node backfill.js --no-recordings skip WAV download/upload (metadata only)
//   node backfill.js --dry           parse + print, write nothing
//
// Re-runnable: upserts by call id; skips a recording already in Storage.

const fs = require('fs');
const path = require('path');
const { parseScorecard } = require('./parse-scorecard.js');

// ---------- env ----------
function loadEnv() {
  const txt = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}
const E = loadEnv();
const REQ = ['GHL_LOCATION_ID','GHL_PIT','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];
for (const k of REQ) if (!E[k]) { console.error('Missing env:', k); process.exit(1); }

const args = process.argv.slice(2);
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i+1],10) : null; })();
const NO_REC = args.includes('--no-recordings');
const DRY = args.includes('--dry');

const GHL = 'https://services.leadconnectorhq.com';
const ghlHeaders = { Authorization: `Bearer ${E.GHL_PIT}`, Version: 'v3', Accept: 'application/json' };
const sbHeaders = {
  apikey: E.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${E.SUPABASE_SERVICE_ROLE_KEY}`,
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- GHL ----------
async function fetchAllCalls() {
  let all = [], page = 1;
  while (true) {
    const url = `${GHL}/voice-ai/dashboard/call-logs?locationId=${E.GHL_LOCATION_ID}&page=${page}&pageSize=50`;
    const r = await fetch(url, { headers: ghlHeaders });
    if (!r.ok) throw new Error(`call-logs page ${page} -> HTTP ${r.status}: ${await r.text()}`);
    const d = await r.json();
    all = all.concat(d.callLogs || []);
    if (all.length >= d.total || !(d.callLogs || []).length) { all._total = d.total; break; }
    page++;
  }
  return all;
}

async function downloadRecording(messageId) {
  const url = `${GHL}/conversations/messages/${messageId}/locations/${E.GHL_LOCATION_ID}/recording`;
  const r = await fetch(url, { headers: ghlHeaders });
  if (!r.ok) return null; // 404 = no recording for this call
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.length ? buf : null;
}

// ---------- Supabase ----------
async function storageExists(objPath) {
  const r = await fetch(`${E.SUPABASE_URL}/storage/v1/object/info/recordings/${objPath}`, { headers: sbHeaders });
  return r.ok;
}
async function storageUpload(objPath, buf) {
  const r = await fetch(`${E.SUPABASE_URL}/storage/v1/object/recordings/${objPath}`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'audio/x-wav', 'x-upsert': 'true' },
    body: buf,
  });
  if (!r.ok) throw new Error(`storage upload ${objPath} -> HTTP ${r.status}: ${await r.text()}`);
}
async function upsertRow(row) {
  const r = await fetch(`${E.SUPABASE_URL}/rest/v1/calls?on_conflict=id`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([row]),
  });
  if (!r.ok) throw new Error(`upsert ${row.id} -> HTTP ${r.status}: ${await r.text()}`);
}

// ---------- row mapping ----------
function buildRow(c, sc, rec) {
  return {
    id: c.id,
    message_id: c.messageId ?? null,
    contact_id: c.contactId ?? null,
    agent_id: c.agentId ?? null,
    from_number: c.fromNumber ?? null,
    created_at: c.createdAt ?? null,
    duration_seconds: c.duration ?? null,
    summary: c.summary ?? null,
    transcript: c.transcript ?? null,
    translation: c.translation ?? null,
    trial_call: c.trialCall ?? null,
    agent_transfer_occurred: c.agentTransferOccurred ?? null,
    is_agent_deleted: c.isAgentDeleted ?? null,
    executed_call_actions: c.executedCallActions ?? null,
    recording_path: rec ? rec.path : null,
    recording_bytes: rec ? rec.bytes : null,
    recording_downloaded_at: rec ? new Date().toISOString() : null,
    ...sc,
  };
}

// ---------- main ----------
(async () => {
  console.log(`Mode: ${DRY ? 'DRY' : 'WRITE'}${NO_REC ? ' (no recordings)' : ''}${LIMIT ? ` limit=${LIMIT}` : ''}`);
  let calls = await fetchAllCalls();
  const total = calls._total;
  if (LIMIT) calls = calls.slice(0, LIMIT);
  console.log(`Fetched ${calls.length} of ${total} calls\n`);

  const stat = { ok: 0, scored: 0, qual: 0, none: 0, rec: 0, recSkip: 0, recMiss: 0, err: 0 };

  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    const tag = `[${i+1}/${calls.length}] ${c.id}`;
    try {
      const sc = parseScorecard(c.transcript);
      const kind = sc.scorecard_parsed ? 'scored' : (sc.scorecard_raw && sc.scorecard_raw.coach_text ? 'qual' : 'none');
      stat[kind]++;

      let rec = null;
      if (!NO_REC && c.messageId) {
        const objPath = `wav/${c.id}.wav`;
        if (!DRY && await storageExists(objPath)) {
          rec = { path: objPath, bytes: null }; stat.recSkip++;
        } else {
          const buf = await downloadRecording(c.messageId);
          if (buf) {
            if (!DRY) await storageUpload(objPath, buf);
            rec = { path: objPath, bytes: buf.length }; stat.rec++;
          } else { stat.recMiss++; }
        }
      }

      const row = buildRow(c, sc, rec);
      if (!DRY) await upsertRow(row);
      stat.ok++;
      console.log(`${tag}  ${kind.padEnd(6)} total=${sc.total_score ?? '-'} verdict=${sc.verdict_band ?? '-'} rec=${rec ? (rec.bytes!=null?rec.bytes+'b':'exists') : 'none'}`);
    } catch (e) {
      stat.err++;
      console.error(`${tag}  ERROR: ${e.message}`);
    }
    await sleep(150);
  }

  console.log('\n--- SUMMARY ---');
  console.log(`rows upserted:   ${stat.ok}`);
  console.log(`  scored:        ${stat.scored}`);
  console.log(`  qualitative:   ${stat.qual}`);
  console.log(`  no review:     ${stat.none}`);
  console.log(`recordings:      ${stat.rec} uploaded, ${stat.recSkip} already present, ${stat.recMiss} none available`);
  console.log(`errors:          ${stat.err}`);
})();
