import { TrainingAttempt } from "../types/agentTraining";
import { parseScoreFromText } from "./scoreParser";

// Parse explicit numbered Q&A blocks out of the report text using a fast,
// line-based scan (no backtracking regex). A "question" is only recognized when
// a line STARTS with an explicit marker — "Q1:", "Question 1:", or "1." — so
// narrative summary reports (which have no such markers) correctly yield [].
// Returns [] when none are found (no fabrication). Bounded to avoid hangs.
export function extractQuestionsFromReport(
  traineeReport: string,
  cleanReport: string,
) {
  const fullText = (traineeReport + "\n" + cleanReport).trim();
  if (!fullText) return [];

  const questions: TrainingAttempt["questionsAnswered"] = [];

  // A line is a question header only if it begins with an explicit marker.
  const isHeader = (line: string): boolean =>
    /^\s*(?:Q\d+\s*[:.\-)]|Question\s*#?\s*\d+\s*[:.\-)]|\d+\s*[.)])\s+/i.test(
      line,
    );

  const lines = fullText.split(/\r?\n/);
  const MAX_QUESTIONS = 100; // hard cap to guarantee responsiveness
  let current: { q: string; a: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const questionText = current.q.trim();
    const answerBlock = current.a.join("\n").trim();
    if (questionText) {
      const lower = answerBlock.toLowerCase();
      const isStruggling =
        lower.includes("failed") ||
        lower.includes("struggle") ||
        lower.includes("hesitat") ||
        lower.includes("incorrect") ||
        lower.includes("needs work") ||
        lower.includes("missed");
      const isCorrect =
        !isStruggling &&
        (lower.includes("correct") ||
          lower.includes("passed") ||
          lower.includes("good") ||
          lower.includes("strong") ||
          lower.includes("accurate"));
      const qScore = parseScoreFromText(answerBlock);
      const score = qScore ?? (isCorrect ? 100 : isStruggling ? 40 : 0);
      questions.push({
        questionText,
        category: "Training Question",
        isCorrect,
        score,
        traineeResponse: answerBlock || "",
        feedback: answerBlock || "",
        struggled: isStruggling,
      });
    }
    current = null;
  };

  for (let i = 0; i < lines.length && questions.length < MAX_QUESTIONS; i++) {
    const line = lines[i];
    if (isHeader(line)) {
      flush();
      const qText = line.replace(
        /^\s*(?:Q\d+\s*[:.\-)]|Question\s*#?\s*\d+\s*[:.\-)]|\d+\s*[.)])\s*/i,
        "",
      );
      current = { q: qText, a: [] };
    } else if (current) {
      current.a.push(line);
    }
  }
  flush();

  return questions;
}
