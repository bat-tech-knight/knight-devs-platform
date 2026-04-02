/** Browser-safe question key (Web Crypto). Keep in sync with `lib/question-key.ts`. */

export function normalizeLabelForKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function sha256HexBrowser(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildQuestionKeyBrowser(params: {
  source: string;
  hostname: string;
  externalFieldId?: string | null;
  labelText: string;
}): Promise<string> {
  const host = (params.hostname || "").trim().toLowerCase() || "unknown";
  const src = (params.source || "generic").trim().toLowerCase() || "generic";
  const ext = (params.externalFieldId || "").trim();
  if (ext) {
    return `${src}:${host}:${ext}`;
  }
  const norm = normalizeLabelForKey(params.labelText || "untitled");
  return `${src}:${host}:label:${await sha256HexBrowser(norm)}`;
}

export function buildBuiltinQuestionKeyBrowser(fieldKey: string): string {
  const k = fieldKey.trim().toLowerCase();
  return `knightdevs:builtin:${k}`;
}
