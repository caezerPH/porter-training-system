// Sync: pull every GHL contact (with custom fields) for the location -> upsert into
// public.contacts. The dashboard reads this mirror instead of calling GHL from the
// browser (avoids CORS + keeps the GHL token server-side only).
//
// Usage:
//   node sync-contacts.js            full sync (upsert all contacts)
//   node sync-contacts.js --limit 5  only the first 5 contacts (smoke test)
//   node sync-contacts.js --tag "DBG Agents"   only contacts with this tag
//   node sync-contacts.js --dry      fetch + print, write nothing
//
// Re-runnable: upserts by contact id.

const fs = require('fs');
const path = require('path');

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
const REQ = ['GHL_LOCATION_ID', 'GHL_PIT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const k of REQ) if (!E[k]) { console.error('Missing env:', k); process.exit(1); }

const args = process.argv.slice(2);
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i + 1], 10) : null; })();
const TAG = (() => { const i = args.indexOf('--tag'); return i >= 0 ? args[i + 1] : null; })();
const DRY = args.includes('--dry');

const GHL = 'https://services.leadconnectorhq.com';
// Contacts API uses the dated version header (NOT v3, which is for voice-ai endpoints).
const ghlHeaders = {
  Authorization: `Bearer ${E.GHL_PIT}`,
  Version: '2021-07-28',
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
const sbHeaders = {
  apikey: E.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${E.SUPABASE_SERVICE_ROLE_KEY}`,
};

const normTag = (t) => (t || '').trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- GHL ----------
// POST /contacts/search with searchAfter cursor pagination.
async function fetchAllContacts() {
  const all = [];
  let cursor;
  for (let page = 0; page < 200; page++) {
    const body = { locationId: E.GHL_LOCATION_ID, pageLimit: 100 };
    if (cursor) body.searchAfter = cursor;
    const r = await fetch(`${GHL}/contacts/search`, {
      method: 'POST', headers: ghlHeaders, body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`contacts/search page ${page} -> HTTP ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const batch = d.contacts || d.data || [];
    if (!batch.length) break;
    all.push(...batch);
    const last = batch[batch.length - 1];
    cursor = last && Array.isArray(last.searchAfter) ? last.searchAfter : undefined;
    if (batch.length < 100 || !cursor) break;
  }
  return all;
}

// ---------- Supabase ----------
async function upsertRows(rows) {
  const r = await fetch(`${E.SUPABASE_URL}/rest/v1/contacts?on_conflict=id`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`upsert contacts -> HTTP ${r.status}: ${await r.text()}`);
}

// ---------- row mapping ----------
// GHL returns customFields as [{ id, value } | { id, field_value }]. Store as a flat
// object keyed by field id so the dashboard can map by the known per-client field IDs.
function customFieldsObject(c) {
  const arr = c.customFields || c.customField || [];
  const obj = {};
  for (const v of arr) {
    const key = v.id || v.fieldKey || v.key;
    if (!key) continue;
    obj[key] = v.value ?? v.fieldValue ?? v.field_value ?? null;
  }
  return obj;
}

function buildRow(c) {
  const first = c.firstName ?? c.firstNameLowerCase ?? null;
  const last = c.lastName ?? c.lastNameLowerCase ?? null;
  const name = c.contactName || c.fullNameLowerCase ||
    [first, last].filter(Boolean).join(' ').trim() || null;
  return {
    id: c.id,
    location_id: c.locationId ?? E.GHL_LOCATION_ID,
    name,
    first_name: first,
    last_name: last,
    email: c.email ?? null,
    phone: c.phone ?? null,
    tags: Array.isArray(c.tags) ? c.tags : [],
    custom_fields: customFieldsObject(c),
    date_added: c.dateAdded ?? null,
    ghl_updated_at: c.dateUpdated ?? null,
    synced_at: new Date().toISOString(),
  };
}

// ---------- main ----------
(async () => {
  console.log(`Mode: ${DRY ? 'DRY' : 'WRITE'}${LIMIT ? ` limit=${LIMIT}` : ''}${TAG ? ` tag="${TAG}"` : ''}`);
  let contacts = await fetchAllContacts();
  console.log(`Fetched ${contacts.length} contacts from GHL.`);

  if (TAG) {
    const want = normTag(TAG);
    contacts = contacts.filter((c) => (c.tags || []).some((t) => normTag(t) === want));
    console.log(`After tag filter: ${contacts.length}`);
  }
  if (LIMIT) contacts = contacts.slice(0, LIMIT);

  const rows = contacts.map(buildRow);

  // quick visibility: how many carry report-bearing custom fields
  const withCf = rows.filter((r) => Object.keys(r.custom_fields).length > 0).length;
  console.log(`${withCf}/${rows.length} have custom fields.`);

  if (DRY) {
    console.log(JSON.stringify(rows.slice(0, 2), null, 2).slice(0, 2000));
    console.log('DRY run — nothing written.');
    return;
  }
  if (!rows.length) { console.log('No rows to write.'); return; }

  // batch upserts (<=100 per request)
  for (let i = 0; i < rows.length; i += 100) {
    await upsertRows(rows.slice(i, i + 100));
    console.log(`Upserted ${Math.min(i + 100, rows.length)}/${rows.length}`);
  }
  console.log('Done.');
})().catch((e) => { console.error(e); process.exit(1); });
