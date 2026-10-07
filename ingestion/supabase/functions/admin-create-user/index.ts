// Supabase Edge Function: admin-create-user
// Lets a logged-in ADMIN create new user/admin logins from the dashboard.
// The service_role key never leaves the server (auto-injected secret here).
//
// Deploy:  supabase functions deploy admin-create-user --project-ref <ref>
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-provided.)

import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";

  // 1. Verify the caller and that they are an admin.
  const caller = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: uErr } = await caller.auth.getUser();
  if (uErr || !user) return json(401, { error: "Not authenticated" });
  if ((user.app_metadata as Record<string, unknown>)?.role !== "admin") {
    return json(403, { error: "Admins only" });
  }

  // 2. Validate input.
  let body: { email?: string; password?: string; role?: string; contactId?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const role = body.role === "admin" ? "admin" : "user";
  const contactId = (body.contactId || "").trim();
  if (!email || password.length < 8) {
    return json(400, { error: "Email and a password of 8+ characters are required." });
  }
  if (role === "user" && !contactId) {
    return json(400, { error: "A user account must be assigned to an agent." });
  }

  // 3. Create the account with role metadata (service key, server-side only).
  const admin = createClient(url, serviceKey);
  const app_metadata =
    role === "admin" ? { role: "admin" } : { role: "user", contact_id: contactId };
  const { data, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata,
  });
  if (cErr) return json(400, { error: cErr.message });

  return json(200, { id: data.user?.id, email: data.user?.email, role });
});
