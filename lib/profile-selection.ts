export interface UserProfileOption {
  id: string;
  user_id: string;
  role?: string | null;
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
  timezone?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const ACTIVE_PROFILE_STORAGE_KEY = "active_profile_id";

export function getStoredActiveProfileId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
}

export function setStoredActiveProfileId(profileId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
}

export function getProfileDisplayName(profile: Partial<UserProfileOption> | null | undefined): string {
  if (!profile) {
    return "Unnamed Profile";
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }

  return profile.email || "Unnamed Profile";
}

