/**
 * Shared API base URL for the Voice AI + Flashcards frontends.
 *
 * Both APIs now run as Vercel functions alongside the site, so the default is
 * the same origin: no CORS preflight, no mixed content, and nothing to
 * reconfigure when the deployment URL changes. The env var stays as an escape
 * hatch for pointing a local UI at a deployed API.
 */
export function getApiBaseUrl(explicitEnv?: string): string {
  return explicitEnv?.trim().replace(/\/$/, '') || '';
}

export function getApiBaseUrlLabel(explicitEnv?: string): string {
  return getApiBaseUrl(explicitEnv) || '(same origin)';
}
