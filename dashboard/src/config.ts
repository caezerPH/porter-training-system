// Per-client configuration. A new client = new .env + (if their GHL custom-field
// IDs differ) a new fieldMap below. Everything client-specific lives here.

const env = import.meta.env;

export const config = {
  clientName: (env.VITE_CLIENT_NAME as string) || "Training Analyst",
  clientShort: (env.VITE_CLIENT_SHORT as string) || "EZAI",
  supabaseUrl: env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY as string,
  // Optional: link reps to the training AI roleplay (shown as "Start Training Call").
  trainingAiUrl: (env.VITE_TRAINING_AI_URL as string) || "",

  // GHL custom-field IDs for this subaccount. The field-definitions endpoint is
  // 401 for the PIT, so we map opaque IDs by hand (reverse-engineered from content).
  // Porter location 0JT2eeg5LKJwd7ygqkW0:
  fieldMap: {
    managerReport: "tyg7C8QbReMAkoLycw6Z", // detailed manager report (HTML)
    traineeReport: "ZJ865A40NkyQXZnvcuiW", // trainee-facing coaching (HTML)
    name: "lcYRfXlgXXx6WmiXmE6k", // trainee/coach name
    email: "KY2tDDyYm53UN4xMEdR1",
    scenario: "XINLL55qfHdxs1uHGdLI",
    difficulty: "iSHAIn2yeGYSXESv1Xx0",
    version: "FkmbuUc2KDI20ERgdK8j",
    persona: "8HHEnBnnXONvhi9ij5IK",
  } as Record<string, string>,

  // Grading bands (from the report footer: "Pass is 85+. Needs Improvement 75–84.
  // Below 75 Retraining Required.").
  bands: {
    pass: 85,
    needsImprovement: 75,
  },
};

export function assertConfig(): string | null {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.";
  }
  return null;
}
