export type ProfileAddressParts = {
  address_line1?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_country?: string | null;
  address_postal_code?: string | null;
};

/** Join non-empty address segments for `profiles.location` (single-line summary). */
export function formatProfileLocation(parts: ProfileAddressParts): string {
  const segments = [
    parts.address_line1,
    parts.address_city,
    parts.address_state,
    parts.address_postal_code,
    parts.address_country,
  ]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  return segments.join(", ");
}
