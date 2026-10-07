import React from "react";
import {
  UserCheck,
  TrendingUp,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";
import { OverallAnalytics } from "../types/agentTraining";
import { Button } from "@/components/ui/button";

interface ManagerPerformanceViewProps {
  analytics: OverallAnalytics;
}

export const ManagerPerformanceView: React.FC<ManagerPerformanceViewProps> = ({
  analytics,
}) => {
  const { agents } = analytics;

  // Aggregate stats per manager
  const managerStatsMap: Record<
    string,
    {
      managerName: string;
      totalAgents: number;
      totalAttempts: number;
      totalScore: number;
      passedCount: number;
    }
  > = {};

  agents.forEach((ag) => {
    const mgr = ag.managerName || "Unassigned";
    if (!managerStatsMap[mgr]) {
      managerStatsMap[mgr] = {
        managerName: mgr,
        totalAgents: 0,
        totalAttempts: 0,
        totalScore: 0,
        passedCount: 0,
      };
    }

    managerStatsMap[mgr].totalAgents += 1;
    managerStatsMap[mgr].totalAttempts += ag.attemptsCount;
    managerStatsMap[mgr].totalScore += ag.averageScore;
    if (ag.averageScore >= 80) {
      managerStatsMap[mgr].passedCount += 1;
    }
  });

  const managersList = Object.values(managerStatsMap).map((m) => {
    const avgScore = Math.round(m.totalScore / (m.totalAgents || 1));
    const passRate = Math.round((m.passedCount / (m.totalAgents || 1)) * 100);
    return {
      ...m,
      avgScore,
      passRate,
    };
  });

  // Export CSV Helper
  const handleExportCsv = () => {
    const headers = [
      "Agent Name",
      "Email",
      "Status",
      "Avg Score",
      "Attempts",
      "Evaluator",
      "Scenario",
      "Struggles",
    ];
    const rows = agents.map((ag) => [
      `"${ag.agentName}"`,
      `"${ag.email}"`,
      `"${ag.status}"`,
      ag.averageScore,
      ag.attemptsCount,
      `"${ag.managerName}"`,
      `"${ag.scenario}"`,
      ag.struggleCount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `dbg_agents_training_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Export Banner & Manager Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-xl shadow-md">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-brand-400 uppercase">
            Analyst Tools
          </span>
          <h2 className="text-xl font-black mt-1 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-emerald-400" /> Manager
            Evaluation & Training Export
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Compare coaching effectiveness across managers and export complete
            audit report datasets for compliance review.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export CSV Report
        </Button>
      </div>

      {/* Managers Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {managersList.map((mgr, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 font-black text-slate-800 dark:text-slate-100 flex items-center justify-center border text-sm">
                  {mgr.managerName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {mgr.managerName}
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {mgr.totalAgents} Agents Assigned
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 p-2 border border-slate-100 dark:border-slate-700">
                <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {mgr.avgScore}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  Team Avg Score
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 p-2 border border-slate-100 dark:border-slate-700">
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {mgr.passRate}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  Certification Rate
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between">
              <span>Total Evaluations Completed:</span>
              <strong className="text-slate-800 dark:text-slate-100">{mgr.totalAttempts}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
