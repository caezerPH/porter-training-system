import {
  AgentMetric,
  OverallAnalytics,
  QuestionAnalysis,
} from "../types/agentTraining";

export function calculateOverallAnalytics(
  agents: AgentMetric[],
): OverallAnalytics {
  const totalAgentsCount = agents.length;
  const allAttempts = agents.flatMap((a) => a.attempts);
  const totalAttemptsCount = allAttempts.length;

  // Only count attempts that actually have an explicit score toward the average.
  const scoredAttempts = allAttempts.filter((a) => a.hasScore);

  const averageScore =
    scoredAttempts.length > 0
      ? Math.round(
          scoredAttempts.reduce((acc, curr) => acc + curr.score, 0) /
            scoredAttempts.length,
        )
      : 0;

  const passedAttempts = scoredAttempts.filter((a) => a.score >= 80).length;
  const passRate =
    scoredAttempts.length > 0
      ? Math.round((passedAttempts / scoredAttempts.length) * 100)
      : 0;

  // Manager aggregated performance — only from attempts that have training data
  const managerScores: Record<string, { total: number; count: number }> = {};
  scoredAttempts.forEach((att) => {
    const mgr = att.managerName || "Unassigned";
    if (!managerScores[mgr]) managerScores[mgr] = { total: 0, count: 0 };
    managerScores[mgr].total += att.score;
    managerScores[mgr].count += 1;
  });

  let topManager = "";
  let bestAvg = 0;
  Object.keys(managerScores).forEach((mgr) => {
    const avg = managerScores[mgr].total / managerScores[mgr].count;
    if (avg > bestAvg) {
      bestAvg = avg;
      topManager = mgr;
    }
  });

  // Score distribution breakdown — only scored attempts
  const distribution = [
    { range: "90 - 100% (Superior)", count: 0 },
    { range: "80 - 89% (Proficient)", count: 0 },
    { range: "70 - 79% (Developing)", count: 0 },
    { range: "Below 70% (At Risk)", count: 0 },
    { range: "Not Trained / No Score", count: 0 },
  ];

  allAttempts.forEach((att) => {
    if (!att.hasScore) {
      distribution[4].count++;
    } else if (att.score >= 90) distribution[0].count++;
    else if (att.score >= 80) distribution[1].count++;
    else if (att.score >= 70) distribution[2].count++;
    else distribution[3].count++;
  });

  // Aggregated question struggle analysis — only from real parsed questions
  const qMap = new Map<
    string,
    {
      text: string;
      cat: string;
      correct: number;
      total: number;
      struggles: string[];
      feedback: string[];
    }
  >();

  allAttempts.forEach((att) => {
    att.questionsAnswered.forEach((q) => {
      if (!qMap.has(q.questionText)) {
        qMap.set(q.questionText, {
          text: q.questionText,
          cat: q.category,
          correct: 0,
          total: 0,
          struggles: [],
          feedback: [],
        });
      }
      const item = qMap.get(q.questionText)!;
      item.total += 1;
      if (q.isCorrect) item.correct += 1;
      else {
        if (q.traineeResponse && !item.struggles.includes(q.traineeResponse)) {
          item.struggles.push(q.traineeResponse);
        }
      }
      if (q.feedback && !item.feedback.includes(q.feedback)) {
        item.feedback.push(q.feedback);
      }
    });
  });

  const questionAnalyses: QuestionAnalysis[] = Array.from(qMap.values()).map(
    (q, idx) => {
      const successRate =
        q.total > 0 ? Math.round((q.correct / q.total) * 100) : 0;
      let difficulty: "Easy" | "Moderate" | "Hard" | "Critical Issue" = "Easy";
      if (successRate < 60) difficulty = "Critical Issue";
      else if (successRate < 75) difficulty = "Hard";
      else if (successRate < 88) difficulty = "Moderate";

      return {
        id: `qa-${idx + 1}`,
        questionText: q.text,
        category: q.cat,
        correctAnswers: q.correct,
        totalAttempts: q.total,
        successRate,
        commonStruggles: q.struggles.slice(0, 3),
        feedbackHighlights: q.feedback.slice(0, 3),
        difficulty,
      };
    },
  );

  const strugglingQuestionsCount = questionAnalyses.filter(
    (q) => q.successRate < 75,
  ).length;

  // Historical trends built from REAL attempt dates — grouped by month.
  // No fabricated "Week 1..4" data.
  const monthMap = new Map<
    string,
    { total: number; count: number; passed: number; completions: number }
  >();

  allAttempts.forEach((att) => {
    if (!att.hasTrainingData) return;
    // att.date is "YYYY-MM-DD"; bucket by YYYY-MM
    const monthKey = (att.date || "").slice(0, 7) || "Unknown";
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        total: 0,
        count: 0,
        passed: 0,
        completions: 0,
      });
    }
    const m = monthMap.get(monthKey)!;
    m.completions += 1;
    if (att.hasScore) {
      m.total += att.score;
      m.count += 1;
      if (att.score >= 80) m.passed += 1;
    }
  });

  const historicalTrends = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, m]) => ({
      date: monthKey,
      avgScore: m.count > 0 ? Math.round(m.total / m.count) : 0,
      completions: m.completions,
      passRate: m.count > 0 ? Math.round((m.passed / m.count) * 100) : 0,
    }));

  return {
    totalAgentsCount,
    totalAttemptsCount,
    averageScore,
    passRate,
    strugglingQuestionsCount,
    topManager,
    scoreDistribution: distribution,
    historicalTrends,
    questionAnalyses,
    agents,
  };
}
