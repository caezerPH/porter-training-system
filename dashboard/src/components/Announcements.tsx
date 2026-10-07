import React, { useState } from "react";
import { useAnnouncements } from "../hooks/useAnnouncements";
import { useAuth } from "./AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Loader2, Trash2, Eye, EyeOff, Plus } from "lucide-react";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

// Read-only feed shown to every user (e.g. on the My Training view).
export const AnnouncementsFeed: React.FC<{ emptyState?: boolean }> = ({ emptyState }) => {
  const { items, loading } = useAnnouncements(true);

  if (loading) return null;
  if (!items.length)
    return emptyState ? (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500">
        No announcements right now.
      </div>
    ) : null;

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div
          key={a.id}
          className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900/50 dark:bg-brand-900/20"
        >
          <div className="flex items-start gap-2.5">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-brand-900 dark:text-brand-200">{a.title}</h4>
                <span className="text-[10px] text-brand-500 dark:text-brand-400">{fmtDate(a.created_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-brand-800 dark:text-brand-200/90">
                {a.body}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Admin management: compose + list with show/hide + delete.
export const AnnouncementsAdmin: React.FC = () => {
  const { user } = useAuth();
  const { items, loading, error, create, remove, toggleActive } = useAnnouncements(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !body.trim()) {
      setFormError("Title and message are required.");
      return;
    }
    setBusy(true);
    try {
      await create(title.trim(), body.trim(), user?.email ?? undefined);
      setTitle("");
      setBody("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Megaphone className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Post an announcement
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="an-title" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Title</Label>
            <Input id="an-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New compliance script this week" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-body" className="text-xs font-semibold text-slate-700 dark:text-slate-200">Message</Label>
            <textarea
              id="an-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Share news or updates with all users…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{formError}</p>}
          <Button type="submit" disabled={busy} className="bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Plus className="mr-1 h-4 w-4" /> Post</>)}
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          All announcements
        </h4>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : error ? (
          <p className="text-xs text-amber-700">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">No announcements yet.</p>
        ) : (
          items.map((a) => (
            <div
              key={a.id}
              className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                a.is_active
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                  : "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{a.title}</span>
                  <span className="text-[10px] text-slate-400">{fmtDate(a.created_at)}</span>
                  {!a.is_active && <span className="text-[10px] font-semibold text-slate-400">(hidden)</span>}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{a.body}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => toggleActive(a.id, !a.is_active)}
                  title={a.is_active ? "Hide from users" : "Show to users"}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                >
                  {a.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => remove(a.id)}
                  title="Delete"
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
