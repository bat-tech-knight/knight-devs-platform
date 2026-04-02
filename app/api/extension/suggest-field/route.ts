import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  candidatePayloadToSuggestProfile,
  loadExtensionCandidatePayload,
} from "@/lib/extension-candidate-data";
import { getExtensionAuth } from "@/lib/extension-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_EXCERPT = 12_000;
const MAX_OUTPUT_DEFAULT = 1_800;

export type SuggestFieldIntent = "open_question" | "cover_letter" | "why_role";

interface SuggestFieldBody {
  profileId: string;
  intent?: SuggestFieldIntent | string;
  pageTitle?: string;
  pageUrl?: string;
  pageExcerpt: string;
  /** Narrow context around the focused field (merged into excerpt for the model). */
  fieldExcerpt?: string;
  fieldHint?: string;
  maxChars?: number;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max);
}

function stringList(v: unknown, cap: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, cap);
}

function inferMaxCharsFromQuestionLabel(hint: string): number | null {
  const range = hint.match(/\(?\s*(\d+)\s*-\s*(\d+)\s*sentences?\s*\)?/i);
  if (range) {
    const hi = parseInt(range[2], 10);
    if (!Number.isNaN(hi) && hi > 0) {
      return Math.min(8000, Math.max(500, hi * 135 + 400));
    }
  }
  const single = hint.match(/\b(\d+)\s*sentences?\b/i);
  if (single) {
    const n = parseInt(single[1], 10);
    if (!Number.isNaN(n) && n > 0) {
      return Math.min(8000, Math.max(400, n * 135 + 250));
    }
  }
  return null;
}

function sentenceCountDirective(hint: string): string | null {
  const range = hint.match(/\(?\s*(\d+)\s*-\s*(\d+)\s*sentences?\s*\)?/i);
  if (range) {
    return `Length: write about ${range[1]}–${range[2]} sentences (not one huge paragraph unless the form expects it).`;
  }
  const single = hint.match(/\b(\d+)\s*sentences?\b/i);
  if (single) {
    return `Length: write about ${single[1]} sentence(s).`;
  }
  return null;
}

function buildUserPrompt(
  intent: string,
  profile: {
    first_name: string | null;
    last_name: string | null;
    summary: string | null;
    core_skills: unknown;
    other_skills: unknown;
    experience: unknown;
    education: unknown;
  },
  pageTitle: string,
  pageUrl: string,
  pageExcerpt: string,
  fieldHint?: string
): string {
  const skills = [...stringList(profile.core_skills, 30), ...stringList(profile.other_skills, 30)]
    .slice(0, 40)
    .join(", ");

  const expLines = stringList(profile.experience, 12);
  const eduLines = stringList(profile.education, 6);

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || "Candidate";

  const fh = fieldHint?.trim();
  const lengthLine = fh ? sentenceCountDirective(fh) : null;
  const questionBlock = fh
    ? [
        "=== APPLICATION FORM QUESTION — your reply must answer ONLY this (every part). ===",
        fh,
        "=== END QUESTION ===",
        "",
        lengthLine ?? "",
        "Output rules: Write only the answer body (no 'Dear hiring manager', no unrelated overview).",
        "If the question asks for technologies, challenges, ownership, or sentence count, satisfy those explicitly using the profile.",
        "Use first person. Do not paste the question back as a heading unless the employer requires it.",
        "",
      ]
        .filter((line) => line !== "")
        .join("\n")
    : "";

  return [
    questionBlock,
    `Intent: ${intent}`,
    `Applicant name (use only if appropriate): ${name}`,
    profile.summary ? `Profile summary:\n${profile.summary}` : "",
    skills ? `Skills: ${skills}` : "",
    expLines.length ? `Experience bullets:\n- ${expLines.join("\n- ")}` : "",
    eduLines.length ? `Education:\n- ${eduLines.join("\n- ")}` : "",
    "",
    `Page title: ${pageTitle}`,
    `Page URL: ${pageUrl}`,
    "",
    "Context (job page / form; may repeat the question):",
    pageExcerpt,
  ]
    .filter((x) => x !== undefined && x !== "")
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI is not configured (OPENAI_API_KEY missing on server)" },
      { status: 503 }
    );
  }

  const auth = await getExtensionAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }
  const { supabase, user } = auth;

  let body: SuggestFieldBody;
  try {
    body = (await request.json()) as SuggestFieldBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profileId = body.profileId?.trim();
  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  const pagePart = truncate(body.pageExcerpt || "", MAX_EXCERPT);
  const fieldPart = truncate(body.fieldExcerpt || "", 3000);
  const excerpt =
    fieldPart.length > 0
      ? truncate(`${fieldPart}\n\n--- Page ---\n${pagePart}`, MAX_EXCERPT)
      : pagePart;
  if (excerpt.length < 80) {
    return NextResponse.json(
      { error: "pageExcerpt is too short — open a job or application page and try again" },
      { status: 400 }
    );
  }

  const intent = typeof body.intent === "string" && body.intent.trim() ? body.intent.trim() : "open_question";
  const hintedMax = body.fieldHint?.trim() ? inferMaxCharsFromQuestionLabel(body.fieldHint) : null;
  let maxChars = Math.min(
    Math.max(200, Number(body.maxChars) || MAX_OUTPUT_DEFAULT),
    8000
  );
  if (hintedMax != null) {
    maxChars = Math.min(8000, Math.max(maxChars, hintedMax));
  }

  const loaded = await loadExtensionCandidatePayload(supabase, profileId, user.id);
  if (!loaded.ok) {
    const status = loaded.error === "Profile not found" ? 404 : 500;
    return NextResponse.json({ error: loaded.error }, { status });
  }

  const profile = candidatePayloadToSuggestProfile(loaded.data);

  const userPrompt = buildUserPrompt(
    intent,
    profile,
    truncate(body.pageTitle || "", 500),
    truncate(body.pageUrl || "", 2000),
    excerpt,
    body.fieldHint ? truncate(body.fieldHint, 2000) : undefined
  );

  const fieldHintTrim = body.fieldHint?.trim();
  const systemParts = [
    "You help job applicants draft text for ONE application form field.",
    "Use only information implied by the candidate profile and the page excerpt.",
    "Do not invent employers, degrees, certifications, or metrics not supported by the profile.",
    "Do not include Markdown code fences unless the field clearly expects markdown.",
    "Write in first person where natural. Be concise and professional.",
    `Stay under ${maxChars} characters.`,
  ];
  if (intent === "cover_letter") {
    systemParts.push(
      "This request is a COVER LETTER: write plain text suitable for pasting into an application (optional greeting; no subject line). Tailor to the role and employer using the job page context. Typically three to five short paragraphs unless the form specifies otherwise."
    );
  }
  if (fieldHintTrim) {
    systemParts.push(
      "The user message contains an APPLICATION FORM QUESTION marked between === lines.",
      "Your entire response must directly answer that question—address each clause (e.g. stack, challenge, scope)—not a generic bio or cover letter."
    );
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    max_tokens: Math.min(2048, Math.ceil(maxChars / 2.5) + 200),
    messages: [
      {
        role: "system",
        content: systemParts.join(" "),
      },
      { role: "user", content: userPrompt },
    ],
  });

  let text = completion.choices[0]?.message?.content?.trim() ?? "";
  if (text.length > maxChars) {
    text = text.slice(0, maxChars).trim();
  }

  if (!text) {
    return NextResponse.json({ error: "Model returned empty text" }, { status: 502 });
  }

  return NextResponse.json({ success: true, text });
}
