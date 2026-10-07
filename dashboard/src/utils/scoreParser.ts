// Helper to extract an explicit numeric score from unstructured report text.
// Returns null when NO explicit score pattern is found — we never fabricate a score.
export function parseScoreFromText(text: string): number | null {
  if (!text || !text.trim()) return null;

  // Look for percentage patterns like 85%, Score: 92/100, 9/10, overall: 88
  const pctMatch = text.match(/(\d{1,3})\s*%/);
  if (pctMatch) {
    const val = parseInt(pctMatch[1], 10);
    if (val >= 0 && val <= 100) return val;
  }

  const fractionMatch =
    text.match(/score\s*[:=]?\s*(\d{1,2})\/(\d{1,2})/i) ||
    text.match(/(\d{1,2})\s*\/\s*10\b/) ||
    text.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2] || "10", 10);
    if (den > 0) return Math.round((num / den) * 100);
  }

  const wordScore = text.match(/(?:score|rating|grade)\s*[:=]?\s*(\d{2,3})/i);
  if (wordScore) {
    const val = parseInt(wordScore[1], 10);
    if (val >= 0 && val <= 100) return val;
  }

  // No explicit score found — do NOT invent one.
  return null;
}
