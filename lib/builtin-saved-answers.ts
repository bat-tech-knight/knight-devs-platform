import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBuiltinQuestionKeyBrowser as buildBuiltinQuestionKey } from "@/lib/question-key-browser";

export type ProfileRowForBuiltinSync = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  location?: string | null;
};

const BUILTIN_FIELDS: { builtinKey: string; label: string; column: keyof ProfileRowForBuiltinSync }[] = [
  { builtinKey: "first_name", label: "First name", column: "first_name" },
  { builtinKey: "last_name", label: "Last name", column: "last_name" },
  { builtinKey: "email", label: "Email", column: "email" },
  { builtinKey: "phone", label: "Phone", column: "phone_number" },
  { builtinKey: "linkedin", label: "LinkedIn", column: "linkedin_url" },
  { builtinKey: "github", label: "GitHub", column: "github_url" },
  { builtinKey: "twitter", label: "Twitter / X", column: "twitter_url" },
  { builtinKey: "location", label: "Location", column: "location" },
];

/**
 * Upsert/delete `saved_application_answers` rows keyed as `knightdevs:builtin:*`
 * so the extension can fill standard application fields from profile data.
 */
export async function syncBuiltinSavedAnswersFromProfile(
  supabase: SupabaseClient,
  profileId: string,
  profile: ProfileRowForBuiltinSync
): Promise<void> {
  for (const f of BUILTIN_FIELDS) {
    const raw = profile[f.column];
    const value = raw != null ? String(raw).trim() : "";
    const qk = buildBuiltinQuestionKey(f.builtinKey);

    if (!value) {
      await supabase
        .from("saved_application_answers")
        .delete()
        .eq("profile_id", profileId)
        .eq("question_key", qk);
      continue;
    }

    await supabase.from("saved_application_answers").upsert(
      {
        profile_id: profileId,
        question_key: qk,
        label_snapshot: f.label,
        answer_text: value,
        source: "knightdevs",
        hostname: "builtin",
        external_field_id: f.builtinKey,
      },
      { onConflict: "profile_id,question_key" }
    );
  }
}
