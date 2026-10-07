import React, { useState, useEffect } from "react";
import { AgentMetric, TrainingAttempt } from "../types/agentTraining";
import {
  User,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AgentLeaderboardProps {
  agents: AgentMetric[];
  onSelectAgent: (agent: AgentMetric) => void;
}

export const AgentLeaderboard: React.FC<AgentLeaderboardProps> = ({
  agents,
  onSelectAgent,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredAgents = agents
    .filter((ag) => {
      const matchesSearch =
        ag.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ag.managerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        ag.status.toLowerCase().replace(/\s+/g, "") ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.averageScore - a.averageScore;
      return a.agentName.localeCompare(b.agentName);
    });

  // Reset to first page whenever filters / size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, pageSize, agents.length]);

  const totalAgents = filteredAgents.length;
  const totalPages = Math.max(1, Math.ceil(totalAgents / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedAgents = filteredAgents.slice(startIdx, endIdx);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Certified":
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 whitespace-nowrap">
            Certified
          </Badge>
        );
      case "In Training":
        return (
          <Badge className="bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 whitespace-nowrap">
            In Training
          </Badge>
        );
      case "Not Trained":
        return (
          <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
            Not Trained
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 whitespace-nowrap">
            Requires Coaching
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-brand-600 dark:text-brand-400 shrink-0" />{" "}
            Agent Training Leaderboard
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            {totalAgents} agent{totalAgents === 1 ? "" : "s"} · evaluations,
            scores, and report records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search agent or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-48"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2 sm:px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="certified">Certified</option>
            <option value="intraining">In Training</option>
            <option value="requirescoaching">Requires Coaching</option>
            <option value="nottrained">Not Trained</option>
          </select>

          <button
            onClick={() => setSortBy(sortBy === "score" ? "name" : "score")}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort: {sortBy === "score" ? "Avg Score" : "Agent Name"}</span>
          </button>

          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 ml-auto sm:ml-0">
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="py-1.5 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 text-slate-700 dark:text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Agent Name</th>
              <th className="py-3 px-4 min-w-[150px] whitespace-nowrap">
                Status
              </th>
              <th className="py-3 px-4 text-center">Avg Score</th>
              <th className="py-3 px-4">Evaluator / Manager</th>
              <th className="py-3 px-4">Scenario Topic</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {pagedAgents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  No agents matched criteria.
                </td>
              </tr>
            ) : (
              pagedAgents.map((ag) => (
                <tr
                  key={ag.id}
                  onClick={() => onSelectAgent(ag)}
                  className="hover:bg-brand-50/30 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-bold flex items-center justify-center text-xs border border-brand-200 dark:border-brand-900/50 shrink-0">
                        {ag.agentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {ag.agentName}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {ag.email ? (
                            ag.email
                          ) : (
                            <span className="italic text-slate-300 dark:text-slate-600">
                              No email
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">{getStatusBadge(ag.status)}</td>

                  <td className="py-3.5 px-4 text-center">
                    {ag.hasScore ? (
                      <span
                        className={`font-black text-sm px-2 py-0.5 rounded ${
                          ag.averageScore >= 85
                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                            : ag.averageScore >= 72
                              ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30"
                              : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30"
                        }`}
                      >
                        {ag.averageScore}%
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 italic text-xs">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-100">
                    {ag.managerName ? (
                      ag.managerName
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                    )}
                  </td>

                  <td
                    className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[160px] truncate"
                    title={ag.scenario}
                  >
                    {ag.scenario ? (
                      ag.scenario
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600 italic">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-brand-100/50 dark:hover:bg-brand-900/30 flex items-center gap-1 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAgent(ag);
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" /> View Report
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalAgents > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-700/40">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Showing{" "}
            <span className="font-bold text-slate-700 dark:text-slate-200">{startIdx + 1}</span>–
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.min(endIdx, totalAgents)}
            </span>{" "}
            of <span className="font-bold text-slate-700 dark:text-slate-200">{totalAgents}</span>{" "}
            agents
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>

            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
              Page {safePage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
