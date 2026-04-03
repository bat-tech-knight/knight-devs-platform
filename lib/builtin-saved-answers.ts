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
  address_line1?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_country?: string | null;
  address_postal_code?: string | null;
};

const BUILTIN_FIELDS: { builtinKey: string; label: string; column: keyof ProfileRowForBuiltinSync }[] = [
  { builtinKey: "first_name", label: "First name", column: "first_name" },
  { builtinKey: "last_name", label: "Last name", column: "last_name" },
  { builtinKey: "email", label: "Email", column: "email" },
  { builtinKey: "phone", label: "Phone", column: "phone_number" },
  { builtinKey: "linkedin", label: "LinkedIn", column: "linkedin_url" },
  { builtinKey: "github", label: "GitHub", column: "github_url" },
  { builtinKey: "twitter", label: "Twitter / X", column: "twitter_url" },
  { builtinKey: "address_line1", label: "Address line 1", column: "address_line1" },
  { builtinKey: "address_city", label: "City", column: "address_city" },
  { builtinKey: "address_state", label: "State / province", column: "address_state" },
  { builtinKey: "address_country", label: "Country", column: "address_country" },
  { builtinKey: "address_postal_code", label: "ZIP / postal code", column: "address_postal_code" },
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

const VISA_BUILTIN: { builtinKey: string; label: string }[] = [
  {
    builtinKey: "us_work_authorized",
    label: "Legally authorized to work in the United States?",
  },
  {
    builtinKey: "requires_visa_sponsorship",
    label: "Require employment visa sponsorship?",
  },
];

/**
 * Sync Yes/No answers for US work authorization and visa sponsorship to builtin saved answers
 * (extension field-assist + saved-answers merge).
 */
export async function syncVisaBuiltinSavedAnswers(
  supabase: SupabaseClient,
  profileId: string,
  usWorkAuthorized: boolean | null | undefined,
  requiresVisaSponsorship: boolean | null | undefined
): Promise<void> {
  const byKey: Record<string, boolean | null | undefined> = {
    us_work_authorized: usWorkAuthorized,
    requires_visa_sponsorship: requiresVisaSponsorship,
  };

  for (const row of VISA_BUILTIN) {
    const qk = buildBuiltinQuestionKey(row.builtinKey);
    const ans = byKey[row.builtinKey];
    if (ans !== true && ans !== false) {
      await supabase
        .from("saved_application_answers")
        .delete()
        .eq("profile_id", profileId)
        .eq("question_key", qk);
      continue;
    }

    const answer_text = ans ? "Yes" : "No";
    await supabase.from("saved_application_answers").upsert(
      {
        profile_id: profileId,
        question_key: qk,
        label_snapshot: row.label,
        answer_text,
        source: "knightdevs",
        hostname: "builtin",
        external_field_id: row.builtinKey,
      },
      { onConflict: "profile_id,question_key" }
    );
  }
}
