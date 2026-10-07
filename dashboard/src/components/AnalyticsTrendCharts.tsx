import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OverallAnalytics } from "../types/agentTraining";

interface AnalyticsTrendChartsProps {
  analytics: OverallAnalytics;
}

export const AnalyticsTrendCharts: React.FC<AnalyticsTrendChartsProps> = ({
  analytics,
}) => {
  const { historicalTrends, scoreDistribution } = analytics;

  const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Historical Performance Trend Chart */}
      <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Historical Training Progress
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Average agent scores and pass rates over training iterations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="h-3 w-3 rounded-full bg-brand-600 inline-block" />{" "}
              Avg Score
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />{" "}
              Pass Rate (%)
            </span>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          {historicalTrends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 italic">
              No historical training data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historicalTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="scoreGradiant"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="passGradiant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    border: "none",
                    color: "#FFF",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#94A3B8" }}
                />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  name="Average Score"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradiant)"
                />
                <Area
                  type="monotone"
                  dataKey="passRate"
                  name="Pass Rate %"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#passGradiant)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Score Tier Distribution */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Score Tier Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Agent count per score performance bracket
          </p>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scoreDistribution}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#F1F5F9"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <YAxis
                dataKey="range"
                type="category"
                width={120}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderRadius: "8px",
                  color: "#FFF",
                }}
              />
              <Bar dataKey="count" name="Agents" radius={[0, 6, 6, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
