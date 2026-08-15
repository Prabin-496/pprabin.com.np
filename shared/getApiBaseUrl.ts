/**
 * Shared API base URL for Voice AI + Flashcards frontends.
 * Priority: env var → localhost uses EC2 → production domain.
 */
const EC2_API = 'http://ec2-3-25-210-9.ap-southeast-2.compute.amazonaws.com';
const PROD_API = 'https://api.pprabin.com.np';

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

export function getApiBaseUrl(explicitEnv?: string): string {
  const fromEnv = explicitEnv?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (isLocalhost()) return EC2_API;
  if (import.meta.env.PROD) return PROD_API;
  return EC2_API;
}

export function getApiBaseUrlLabel(explicitEnv?: string): string {
  return getApiBaseUrl(explicitEnv) || '(same origin)';
}
