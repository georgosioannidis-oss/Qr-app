/**
 * Gated new-restaurant signup (same form + access password for both).
 * Prefer `/signup` for sharing; the long path remains valid.
 * Restaurant slugs cannot be `signup` (reserved) so `/{slug}/dashboard` never clashes with this route.
 */
export const RESTAURANT_ONBOARDING_SHORT_PATH = "/signup";
export const RESTAURANT_ONBOARDING_LONG_PATH = "/provision/k7-nexus-merchant";
