import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Mic, Loader2 } from "lucide-react";

interface CallMediaProps {
  recordingPath?: string | null;
  transcript?: string | null;
  summary?: string | null;
}

// Plays a single call's recording (short-lived signed URL from the private bucket)
// and shows its transcript. Used inside the selected-attempt panel.
export const CallMedia: React.FC<CallMediaProps> = ({ recordingPath, transcript, summary }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    if (!recordingPath) return;
    setLoading(true);
    supabase.storage
      .from("recordings")
      .createSignedUrl(recordingPath, 3600)
      .then(({ data }) => {
        if (!cancelled) {
          setUrl(data?.signedUrl ?? null);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [recordingPath]);

  if (!recordingPath && !transcript && !summary) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-brand-50 dark:bg-brand-900/30 border-b border-brand-100 dark:border-brand-900/50 px-4 py-2.5 flex items-center gap-2">
        <Mic className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <span className="text-xs font-bold text-brand-900 dark:text-brand-300 uppercase tracking-wider">
          Call Recording &amp; Transcript
        </span>
      </div>
      <div className="p-3 space-y-2.5">
        {recordingPath ? (
          loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading recording…
            </div>
          ) : url ? (
            <audio controls preload="none" src={url} className="w-full h-9" />
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">Recording unavailable.</p>
          )
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            No recording stored for this call (older calls age out in GHL).
          </p>
        )}

        {summary && (
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{summary}</p>
        )}

        {transcript && (
          <details>
            <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 select-none">
              View transcript
            </summary>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 p-2.5">
              {transcript}
            </p>
          </details>
        )}
      </div>
    </div>
  );
};
