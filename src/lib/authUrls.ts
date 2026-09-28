/**
 * URL Helper for Supabase Auth Redirects
 * Supports production AI Studio domain and local/container dev previews.
 */

export const PRODUCTION_STUDIO_URL = 'https://serkan-hoca-e-i-ti-m-ko-lu-u.ai.studio';

export function getAuthRedirectUrl(path: '/auth/callback' | '/update-password' | '/verify-email'): string {
  // If window is defined and we are on an active preview/domain, use current origin so user stays on same environment
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    // Both preview origin and production origin work seamlessly
    return `${origin}${path}`;
  }
  return `${PRODUCTION_STUDIO_URL}${path}`;
}
