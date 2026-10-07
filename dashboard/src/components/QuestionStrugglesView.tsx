import React, { useState } from "react";
import {
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Sparkles,
  MessageSquareQuote,
  Search,
} from "lucide-react";
import { QuestionAnalysis } from "../types/agentTraining";
import { Badge } from "@/components/ui/badge";

interface QuestionStrugglesViewProps {
  questions: QuestionAnalysis[];
}

export const QuestionStrugglesView: React.FC<QuestionStrugglesViewProps> = ({
  questions,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedQuestion, setSelectedQuestion] =
    useState<QuestionAnalysis | null>(questions[0] || null);

  const filteredQuestions = questions.filter((q) => {
    const matchesDiff =
      filterDifficulty === "all" ||
      q.difficulty.toLowerCase().includes(filterDifficulty.toLowerCase());
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  const getDifficultyBadge = (difficulty: string, rate: number) => {
    if (rate < 60)
      return (
        <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-semibold">
          Critical Concern ({rate}%)
        </Badge>
      );
    if (rate < 75)
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">
          Struggle Area ({rate}%)
        </Badge>
      );
    if (rate < 88)
      return (
        <Badge className="bg-brand-500 hover:bg-brand-600 text-white font-semibold">
          Moderate ({rate}%)
        </Badge>
      );
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
        Mastered ({rate}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Training
            Question Diagnostics & Struggles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pinpoints exact training questions causing agent friction,
            misconception patterns, and actionable coaching recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search question or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 w-48"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setFilterDifficulty("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterDifficulty === "all" ? "bg-white text-slate-900 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilterDifficulty("critical")}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterDifficulty === "critical" ? "bg-white text-rose-600 shadow-sm font-semibold" : "hover:text-slate-900"}`}
            >
              Struggles
            </button>
          </div>
        </div>
      </div>

      {/* Main Split View: Question List + In-depth Analyst Panel */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <AlertTriangle className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">
            No structured training questions detected in any report.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Question-level diagnostics appear here once reports contain
            Q&amp;A-style breakdowns.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Question Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                No training questions match your filter.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = selectedQuestion?.id === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {q.category}
                      </span>
                      {getDifficultyBadge(q.difficulty, q.successRate)}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2 leading-relaxed">
                      {q.questionText}
                    </h4>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100/80 pt-2">
                      <span>
                        Success Rate:{" "}
                        <strong className="text-slate-800">
                          {q.successRate}%
                        </strong>{" "}
                        ({q.correctAnswers}/{q.totalAttempts})
                      </span>
                      <span className="text-brand-600 font-semibold flex items-center gap-0.5">
                        Analyze details <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Side: Deep-Dive Analyst Feedback Panel (7 cols) */}
          <div className="lg:col-span-7">
            {selectedQuestion ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      {selectedQuestion.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Question Diagnostic ID: #{selectedQuestion.id}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-2">
                    {selectedQuestion.questionText}
                  </h3>
                </div>

                {/* Success Gauge Banner */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">
                      Agent Mastery Score
                    </span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      {selectedQuestion.successRate}%
                    </div>
                  </div>

                  <div className="w-1/2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Attempts: {selectedQuestion.totalAttempts}</span>
                      <span>Passed: {selectedQuestion.correctAnswers}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedQuestion.successRate >= 80
                            ? "bg-emerald-500"
                            : selectedQuestion.successRate >= 65
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{ width: `${selectedQuestion.successRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Agent Struggles & Friction Points */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                    <AlertTriangle className="h-4 w-4" /> Observed Friction
                    Points & Agent Misconceptions
                  </h4>
                  <div className="mt-2 space-y-2">
                    {selectedQuestion.commonStruggles.length > 0 ? (
                      selectedQuestion.commonStruggles.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-rose-50/50 border border-rose-100 text-xs text-rose-900 flex items-start gap-2"
                        >
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                          <span>{st}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500">
                        No significant agent friction identified for this topic.
                      </div>
                    )}
                  </div>
                </div>

                {/* Manager Feedback & Roleplay Recommendations */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-brand-700">
                    <MessageSquareQuote className="h-4 w-4" /> Evaluator
                    Feedback & Coaching Directives
                  </h4>
                  <div className="mt-2 space-y-2">
                    {selectedQuestion.feedbackHighlights.length > 0 ? (
                      selectedQuestion.feedbackHighlights.map((fb, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-brand-50/40 border border-brand-100 text-xs text-slate-700 flex items-start gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500">
                        No evaluator feedback recorded for this question.
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Strategic Action Plan */}
                <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white shadow-md">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" /> Recommended Manager Action
                    Plan
                  </div>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                    Schedule a 15-minute targeted micro-roleplay focusing on{" "}
                    <strong className="text-white underline decoration-cyan-400">
                      {selectedQuestion.category}
                    </strong>
                    . Provide agents with cheat-sheet scripts emphasizing
                    mandatory compliance disclosure and objection pivots.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                Select a question to view deep-dive analytics.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
