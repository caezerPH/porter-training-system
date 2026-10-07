// Convert an HTML report blob to readable text. Block-level tags become newlines
// so downstream label-anchored parsing keeps line structure; entities are decoded.
export function stripHtml(html: string): string {
  if (!html) return "";
  if (!html.includes("<")) return html; // already plain text
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|tr|li|h[1-6]|table|thead|tbody)\s*>/gi, "\n")
    .replace(/<\/\s*td\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
