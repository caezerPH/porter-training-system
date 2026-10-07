import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { config } from "../config";
import { AgentMetric } from "../types/agentTraining";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, UserPlus, Loader2, CheckCircle2 } from "lucide-react";

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentMetric[];
}

// Admin-only. Creates new logins via the admin-create-user Edge Function (which
// verifies the caller is an admin and uses the service key server-side).
export const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ isOpen, onClose, agents }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [contactId, setContactId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setEmail("");
    setPassword("");
    setRole("user");
    setContactId("");
    setError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (role === "user" && !contactId) {
      setError("Select which agent this user can see.");
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${config.supabaseUrl}/functions/v1/admin-create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ email, password, role, contactId: role === "user" ? contactId : "" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      setSuccess(`Created ${body.email} (${body.role}).`);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Manage Users
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create a login. <strong>Admins</strong> see the full dashboard;{" "}
            <strong>users</strong> see only their assigned agent.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="mu-email" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Email</Label>
            <Input id="mu-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@company.com" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mu-pass" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Temporary password</Label>
            <Input id="mu-pass" type="text" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 8 characters" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Role</Label>
            <div className="flex gap-2">
              {(["user", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                    role === r ? "bg-brand-600 text-white border-brand-600" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === "user" && (
            <div className="space-y-1.5">
              <Label htmlFor="mu-agent" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Assigned agent</Label>
              <select
                id="mu-agent"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              >
                <option value="">Select an agent…</option>
                {agents.map((a) => (
                  <option key={a.contactId} value={a.contactId}>
                    {a.agentName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
          {success && (
            <p className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> {success}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
};
