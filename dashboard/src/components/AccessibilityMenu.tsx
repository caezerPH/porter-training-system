import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Settings2, Sun, Moon, Minus, Plus, RotateCcw, X } from "lucide-react";

// Floating appearance & accessibility control: dark/light toggle + text size.
// Available on every screen (login + dashboard), for all roles.
export const AccessibilityMenu: React.FC = () => {
  const { theme, toggleTheme, fontScale, incFont, decFont, resetFont, MIN, MAX } = useTheme();
  const [open, setOpen] = useState(false);
  const pct = Math.round(fontScale * 100);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2">
      {open && (
        <div className="w-60 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Appearance
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Theme */}
          <div className="mb-4">
            <span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Theme
            </span>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                {theme === "dark" ? "Dark" : "Light"} mode
              </span>
              <span className="text-[10px] text-slate-400">tap to switch</span>
            </button>
          </div>

          {/* Text size */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Text size — {pct}%
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={decFont}
                disabled={fontScale <= MIN}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Decrease text size"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center text-sm font-bold text-slate-800 dark:text-slate-100">
                A
              </div>
              <button
                onClick={incFont}
                disabled={fontScale >= MAX}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label="Increase text size"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={resetFont}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                aria-label="Reset text size"
                title="Reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500"
        aria-label="Appearance & accessibility"
        title="Appearance & accessibility"
      >
        <Settings2 className="h-5 w-5" />
      </button>
    </div>
  );
};
