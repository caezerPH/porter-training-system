import React from "react";
import { AgentMetric } from "../types/agentTraining";
import { useSettings } from "../context/SettingsContext";
import { AnnouncementsFeed } from "./Announcements";
import { Button } from "@/components/ui/button";
import { PhoneCall, FileText, GraduationCap, Megaphone } from "lucide-react";

const statusChip = (status: AgentMetric["status"]) => {
  const map: Record<string, string> = {
    Certified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    "In Training": "bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300",
    "Requires Coaching": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    "Not Trained": "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  };
  return map[status] || map["Not Trained"];
};

export const MyTraining: React.FC<{ agent: AgentMetric | null; onOpenReport: () => void }> = ({
  agent,
  onOpenReport,
}) => {
  const { resolved } = useSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
          <GraduationCap className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          {agent ? `Welcome back, ${agent.agentName}` : "My Training"}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Your training performance, recordings, and coaching.
        </p>
      </div>

      {resolved.trainingAiUrl && (
        <a
          href={resolved.trainingAiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-600 p-5 text-white shadow-sm transition-colors hover:bg-brand-500 dark:border-brand-900/50"
        >
          <div>
            <div className="text-base font-bold">Start a Training Call</div>
            <div className="text-xs text-brand-100">Practice a roleplay with the AI training agent.</div>
          </div>
          <PhoneCall className="h-6 w-6 shrink-0" />
        </a>
      )}

      {!agent ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-600 dark:bg-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">No training data yet</h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Once you complete a training call, your scorecard and recordings will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Your performance</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusChip(agent.status)}`}>
              {agent.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-700/40">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {agent.hasScore ? `${agent.averageScore}%` : "—"}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Score</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-700/40">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {agent.hasScore ? `${agent.bestScore}%` : "—"}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Best Score</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-700/40">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{agent.attemptsCount}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attempts</div>
            </div>
          </div>

          <Button onClick={onOpenReport} className="mt-4 w-full bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500">
            <FileText className="mr-1.5 h-4 w-4" /> View my full report
          </Button>
        </div>
      )}

      {/* Announcements */}
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Megaphone className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Announcements
        </h3>
        <AnnouncementsFeed emptyState />
      </div>
    </div>
  );
};
