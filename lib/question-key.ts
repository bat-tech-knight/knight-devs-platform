import { createHash } from "node:crypto";

export type QuestionKeySource = "greenhouse" | "lever" | "generic";

export function normalizeLabelForKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Stable key shared by extension + server for saved answers.
 * Prefer external_field_id (e.g. Greenhouse question_*) when present.
 */
export function buildQuestionKey(params: {
  source: string;
  hostname: string;
  externalFieldId?: string | null;
  labelText: string;
}): string {
  const host = (params.hostname || "").trim().toLowerCase() || "unknown";
  const src = (params.source || "generic").trim().toLowerCase() || "generic";
  const ext = (params.externalFieldId || "").trim();
  if (ext) {
    return `${src}:${host}:${ext}`;
  }
  const norm = normalizeLabelForKey(params.labelText || "untitled");
  return `${src}:${host}:label:${sha256Hex(norm)}`;
}

/** Synced from `profiles` rows; extension falls back to this when site-specific keys miss. */
export function buildBuiltinQuestionKey(fieldKey: string): string {
  const k = fieldKey.trim().toLowerCase();
  return buildQuestionKey({
    source: "knightdevs",
    hostname: "builtin",
    externalFieldId: k,
    labelText: k,
  });
}
