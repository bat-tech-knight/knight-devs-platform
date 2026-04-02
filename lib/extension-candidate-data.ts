import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns that exist on `public.profiles` (multi-profile schema). */
const PROFILE_COLUMNS =
  "id, user_id, first_name, last_name, email, phone_number, linkedin_url, github_url, twitter_url, location, timezone, avatar_url, role";

function experiencesToStringLines(experiences: unknown): string[] {
  if (!Array.isArray(experiences)) return [];
  const out: string[] = [];
  for (const item of experiences) {
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim());
      continue;
    }
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const title = typeof o.title === "string" ? o.title.trim() : "";
      const company = typeof o.company === "string" ? o.company.trim() : "";
      const desc =
        typeof o.description === "string"
          ? o.description.trim()
          : typeof o.summary === "string"
            ? o.summary.trim()
            : "";
      const line = [title, company].filter(Boolean).join(" @ ");
      const full = [line, desc].filter(Boolean).join(desc && line ? " — " : "");
      if (full) out.push(full);
    }
  }
  return out;
}

function educationFromAiParsed(ai: unknown): string[] {
  if (!ai || typeof ai !== "object") return [];
  const edu = (ai as Record<string, unknown>).education;
  if (!Array.isArray(edu)) return [];
  const out: string[] = [];
  for (const item of edu) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
    else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const school = typeof o.school === "string" ? o.school : typeof o.institution === "string" ? o.institution : "";
      const degree = typeof o.degree === "string" ? o.degree : "";
      const field = typeof o.field === "string" ? o.field : "";
      const line = [degree, field, school].filter(Boolean).join(", ");
      if (line.trim()) out.push(line.trim());
    }
  }
  return out;
}

/**
 * Load the signed-in user's profile row plus optional `experts` row, shaped for
 * the extension's `normalizeCandidate` and suggest-field prompts.
 */
export async function loadExtensionCandidatePayload(
  supabase: SupabaseClient,
  profileId: string,
  userId: string
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string; supabaseError?: string }
> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", profileId)
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      error: "Profile not found",
      supabaseError: profileError?.message,
    };
  }

  const { data: expert, error: expertError } = await supabase
    .from("experts")
    .select(
      "resume_text, resume_url, core_skills, other_skills, experiences, headline, work_eligibility, ai_parsed_data"
    )
    .eq("profile_id", profileId)
    .maybeSingle();

  if (expertError) {
    return {
      ok: false,
      error: "Expert profile could not be loaded",
      supabaseError: expertError.message,
    };
  }

  const experienceLines = experiencesToStringLines(expert?.experiences);
  const educationLines = educationFromAiParsed(expert?.ai_parsed_data);

  const data: Record<string, unknown> = {
    id: profile.id,
    user_id: profile.user_id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone_number: profile.phone_number,
    location: profile.location,
    linkedin_url: profile.linkedin_url,
    github_url: profile.github_url,
    website_url: null,
    summary: expert?.headline ?? null,
    resume_text: expert?.resume_text ?? null,
    resume_url: expert?.resume_url ?? null,
    work_authorization: expert?.work_eligibility ?? null,
    requires_sponsorship: null,
    core_skills: expert?.core_skills ?? null,
    other_skills: expert?.other_skills ?? null,
    experience: experienceLines.length ? experienceLines : null,
    education: educationLines.length ? educationLines : null,
  };

  return { ok: true, data };
}

/** Shape used by `buildUserPrompt` in suggest-field. */
export type SuggestFieldProfile = {
  first_name: string | null;
  last_name: string | null;
  summary: string | null;
  core_skills: unknown;
  other_skills: unknown;
  experience: unknown;
  education: unknown;
};

export function candidatePayloadToSuggestProfile(data: Record<string, unknown>): SuggestFieldProfile {
  return {
    first_name: (data.first_name as string | null) ?? null,
    last_name: (data.last_name as string | null) ?? null,
    summary:
      (typeof data.summary === "string" && data.summary.trim()
        ? data.summary
        : typeof data.resume_text === "string" && data.resume_text.trim()
          ? data.resume_text.slice(0, 1200)
          : null) ?? null,
    core_skills: data.core_skills ?? null,
    other_skills: data.other_skills ?? null,
    experience: data.experience ?? null,
    education: data.education ?? null,
  };
}
