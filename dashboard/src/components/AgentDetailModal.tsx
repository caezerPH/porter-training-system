import React, { useState } from "react";
import { AgentMetric, TrainingAttempt } from "../types/agentTraining";
import { CallMedia } from "./CallMedia";
import { X, Mail, Phone, FileText, ClipboardList, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AgentDetailModalProps {
  agent: AgentMetric | null;
  onClose: () => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  onClose,
}) => {
  const [selectedAttempt, setSelectedAttempt] =
    useState<TrainingAttempt | null>(
      agent?.attempts[agent.attempts.length - 1] || null,
    );

  if (!agent) return null;

  // Defensive guard: an agent should always have at least one attempt, but
  // if the array is ever empty, bail out gracefully instead of crashing on
  // undefined property access (which was making the page unresponsive).
  if (!agent.attempts || agent.attempts.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-2xl text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {agent.agentName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            No training attempt records are available for this agent.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const trendData = agent.attempts
    .filter((a) => a.hasScore)
    .map((a, idx) => ({
      name: `Attempt ${idx + 1}`,
      score: a.score,
      date: a.date,
    }));

  const activeAttempt =
    selectedAttempt || agent.attempts[agent.attempts.length - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-black flex items-center justify-center text-lg border-2 border-brand-200 dark:border-brand-900/50">
              {agent.agentName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {agent.agentName}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                {agent.email ? (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {agent.email}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 italic text-slate-300 dark:text-slate-600">
                    <Mail className="h-3.5 w-3.5" /> No email on record
                  </span>
                )}
                {agent.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {agent.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
            aria-label="Close report"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Stat Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {agent.hasScore ? `${agent.averageScore}%` : "—"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Avg Score
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {agent.hasScore ? `${agent.bestScore}%` : "—"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Best Score
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                {agent.attemptsCount}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Attempts
              </div>
            </div>
          </div>

          {/* Progress Trend */}
          {trendData.length > 1 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Score
                Progression Over Attempts
              </h4>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F5F9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#2563EB" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Attempt Selector Tabs */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-3">
              <ClipboardList className="h-4 w-4 text-slate-600 dark:text-slate-300" /> Training
              Attempt History
            </h4>
            <div className="flex flex-wrap gap-2">
              {agent.attempts.map((att, idx) => (
                <button
                  key={att.id}
                  onClick={() => setSelectedAttempt(att)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    activeAttempt.id === att.id
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-500"
                  }`}
                >
                  {att.date} — {att.hasScore ? `${att.score}%` : "No score"}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Attempt Details */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {activeAttempt.scenario || (
                    <span className="text-slate-400 dark:text-slate-500 italic font-normal">
                      No scenario recorded
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeAttempt.managerName ? (
                    <>
                      Evaluated by <strong>{activeAttempt.managerName}</strong>{" "}
                      on {activeAttempt.date}
                    </>
                  ) : (
                    <>No evaluator recorded · {activeAttempt.date}</>
                  )}
                </p>
              </div>
              <Badge
                className={
                  activeAttempt.status === "Passed"
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
                    : activeAttempt.status === "Needs Review"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
                      : activeAttempt.status === "Not Trained"
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        : "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                }
              >
                {activeAttempt.status === "Not Trained"
                  ? "Not Trained"
                  : `${activeAttempt.status} — ${activeAttempt.hasScore ? activeAttempt.score + "%" : "No score"}`}
              </Badge>
            </div>

            <div className="p-4 space-y-4">
              {/* Scorecard + coaching for this attempt */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-brand-50 dark:bg-brand-900/30 border-b border-brand-100 dark:border-brand-900/50 px-4 py-2.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <span className="text-xs font-bold text-brand-900 dark:text-brand-300 uppercase tracking-wider">
                    Scorecard &amp; Coaching
                  </span>
                </div>
                <div className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
                  {activeAttempt.managerSections.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                      No scorecard recorded for this attempt.
                    </p>
                  ) : (
                    activeAttempt.managerSections.map((sec, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-slate-50 dark:bg-slate-700/40 p-3 border border-slate-100 dark:border-slate-700"
                      >
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide block mb-1">
                          {sec.label}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {sec.value}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* This attempt's call recording + transcript */}
              <CallMedia
                recordingPath={activeAttempt.recordingPath}
                transcript={activeAttempt.transcript}
                summary={activeAttempt.callSummary}
              />

              {/* Raw report toggle */}
              {(activeAttempt.originalReport ||
                activeAttempt.cleanReport ||
                activeAttempt.traineeReport) && (
                <details className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/40">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5 hover:text-slate-700 dark:hover:text-slate-200 select-none">
                    View raw report text
                  </summary>
                  <div className="px-4 pb-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {activeAttempt.originalReport && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
                          Original Report
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {activeAttempt.originalReport}
                        </p>
                      </div>
                    )}
                    {activeAttempt.cleanReport && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
                          Clean Summary Report
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {activeAttempt.cleanReport}
                        </p>
                      </div>
                    )}
                    {activeAttempt.traineeReport && (
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
                          Trainee Self-Report
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {activeAttempt.traineeReport}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Extra parsed custom fields */}
              {activeAttempt.customFields &&
                Object.keys(activeAttempt.customFields).length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      Additional Parsed Fields
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(activeAttempt.customFields).map(
                        ([k, v]) => (
                          <div
                            key={k}
                            className="rounded-lg bg-slate-50 dark:bg-slate-700/40 p-2.5 border border-slate-100 dark:border-slate-700 text-xs"
                          >
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300 block">
                              {k}
                            </span>
                            <p className="text-slate-700 dark:text-slate-200 mt-0.5 break-words">
                              {v}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

            </div>
          </div>
        </div>

        {/* Sticky footer close button — always reachable on mobile */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 flex items-center justify-center gap-1.5"
          >
            <X className="h-4 w-4" /> Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
