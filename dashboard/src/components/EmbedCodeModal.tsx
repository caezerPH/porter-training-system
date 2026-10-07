import React, { useMemo, useState } from "react";
import { Code, X, Copy, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HEIGHT_OPTIONS = [
  { label: "800px", value: "800" },
  { label: "1000px", value: "1000" },
  { label: "1200px", value: "1200" },
  { label: "Full height", value: "100vh" },
];

export const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [height, setHeight] = useState("1000");
  const [copied, setCopied] = useState(false);

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin + window.location.pathname;
  }, []);

  const embedUrl = `${baseUrl}?embed=true`;

  const iframeCode = useMemo(() => {
    return `<iframe
  src="${embedUrl}"
  title="Agent Training Analyst Dashboard"
  width="100%"
  height="${height}"
  style="border:0; border-radius:12px;"
  allowfullscreen
  loading="lazy"
></iframe>`;
  }, [embedUrl, height]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select textarea
      const el = document.getElementById(
        "embed-code-block",
      ) as HTMLTextAreaElement | null;
      if (el) {
        el.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2 text-brand-600 dark:text-brand-400">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Embed Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View-only iframe code for external websites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              The embedded version is <strong>view-only</strong>. All
              connectivity, token, and sync controls are automatically hidden so
              viewers cannot change connection settings.
            </span>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Iframe Height
            </Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {HEIGHT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setHeight(o.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    height === o.value
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Embed Code
            </Label>
            <textarea
              id="embed-code-block"
              readOnly
              value={iframeCode}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              className="mt-1.5 w-full h-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 p-3 font-mono text-[11px] text-slate-700 dark:text-slate-200 resize-none outline-none"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Dashboard URL (view-only)
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                readOnly
                value={embedUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 px-3 py-2 font-mono text-[11px] text-slate-700 dark:text-slate-200 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Embed Code
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
