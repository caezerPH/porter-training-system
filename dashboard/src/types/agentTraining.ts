export interface QuestionAnalysis {
  id: string;
  questionText: string;
  category: string;
  correctAnswers: number;
  totalAttempts: number;
  successRate: number; // 0 to 100
  commonStruggles: string[];
  feedbackHighlights: string[];
  difficulty: "Easy" | "Moderate" | "Hard" | "Critical Issue";
}

export interface ReportSection {
  label: string;
  value: string;
}

export interface TrainingAttempt {
  id: string;
  contactId: string;
  agentName: string;
  email: string;
  phone?: string;
  npn?: string;
  date: string;
  managerName: string;
  scenario: string;
  score: number; // 0 to 100
  hasScore: boolean; // true only when an explicit score was found in the report
  hasTrainingData: boolean; // true when any report text exists for this attempt
  status: "Passed" | "Needs Review" | "Failed" | "Not Trained";
  originalReport: string;
  cleanReport: string;
  traineeReport: string;
  managerSections: ReportSection[]; // structured sections from the manager report
  traineeSections: ReportSection[]; // structured sections from the trainee report
  tags: string[];
  customFields?: Record<string, string>;
  questionsAnswered: {
    questionText: string;
    category: string;
    isCorrect: boolean;
    score: number;
    traineeResponse: string;
    feedback: string;
    struggled: boolean;
  }[];
  // Linked Voice-AI call (when the attempt is sourced from the `calls` table)
  callId?: string;
  recordingPath?: string | null;
  transcript?: string | null;
  callSummary?: string | null;
  durationSeconds?: number | null;
}

export interface AgentMetric {
  id: string;
  contactId: string;
  agentName: string;
  email: string;
  avatar?: string;
  phone?: string;
  npn?: string;
  attemptsCount: number;
  latestScore: number;
  averageScore: number;
  bestScore: number;
  hasScore: boolean; // true if any attempt had an explicit score
  hasTrainingData: boolean; // true if any attempt has report text
  status: "Certified" | "In Training" | "Requires Coaching" | "Not Trained";
  managerName: string;
  scenario: string;
  lastTrainingDate: string;
  struggleCount: number;
  customFields?: Record<string, string>;
  attempts: TrainingAttempt[];
}

export interface OverallAnalytics {
  totalAgentsCount: number;
  totalAttemptsCount: number;
  averageScore: number;
  passRate: number;
  strugglingQuestionsCount: number;
  topManager: string;
  scoreDistribution: { range: string; count: number }[];
  historicalTrends: {
    date: string;
    avgScore: number;
    completions: number;
    passRate: number;
  }[];
  questionAnalyses: QuestionAnalysis[];
  agents: AgentMetric[];
}

// Custom Field key names user specified
export const FIELD_KEYS = {
  TRAINING_REPORT_ORIGINAL: "training_report_original",
  TRAINING_CLEAN_REPORT: "training_clean_report",
  TRAINING_TRAINEE_REPORT: "training_trainee_report",
  TRAINING_SCENARIO: "training_scenario",
  TRAINING_MANAGER_NAME: "training_manager_name",
  AGENT_NAME: "agent_name",
  NPN: "npn_national_producer_number",
};
