import React from "react";
import {
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { OverallAnalytics } from "../types/agentTraining";

interface OverviewKpiCardsProps {
  analytics: OverallAnalytics;
  onNavigateToStruggles?: () => void;
}

export const OverviewKpiCards: React.FC<OverviewKpiCardsProps> = ({
  analytics,
  onNavigateToStruggles,
}) => {
  const {
    totalAgentsCount,
    totalAttemptsCount,
    averageScore,
    passRate,
    topManager,
  } = analytics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Total Agents Active */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Agents Evaluated
          </span>
          <div className="rounded-lg bg-brand-50 dark:bg-brand-900/30 p-2 text-brand-600 dark:text-brand-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {totalAgentsCount}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            Agents
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          From{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {totalAttemptsCount} total call evaluations
          </span>
        </p>
      </div>

      {/* Average Score */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Training Score
          </span>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {averageScore}%
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              averageScore >= 80
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : averageScore >= 70
                  ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  : "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
            }`}
          >
            Target: 80%
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              averageScore >= 80
                ? "bg-emerald-500"
                : averageScore >= 70
                  ? "bg-amber-500"
                  : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(100, averageScore)}%` }}
          />
        </div>
      </div>

      {/* Pass Rate */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Certification Pass Rate
          </span>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {passRate}%
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
            Benchmark: 75%
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Top
          Performing Manager:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {topManager || "—"}
          </span>
        </p>
      </div>
    </div>
  );
};
