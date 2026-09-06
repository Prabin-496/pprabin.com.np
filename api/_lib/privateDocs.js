/**
 * Private document vault — company registration and identity papers.
 *
 * These files are NOT in the repository and NOT in `public/`. The repo is
 * public, and `public/` is served by CDN with no auth, so either location would
 * publish a National ID and a signature to anyone who guessed the URL. A
 * four-digit passcode in front of a public URL protects nothing.
 *
 * Instead the bytes live in a private S3 bucket. `/api/documents` checks the
 * passcode and then hands back a presigned URL that expires in minutes, so the
 * link is useless once shared or logged. During local development the same
 * route reads the original download folder from disk, so the UI can be built
 * and tested without touching AWS.
 */

import fs from 'node:fs';
import path from 'node:path';

export const BUCKET = process.env.PRIVATE_DOCS_BUCKET || '';
export const REGION =
  process.env.PRIVATE_DOCS_REGION || process.env.AWS_REGION_ANKI || process.env.AWS_REGION || 'ap-southeast-2';

/** Presigned links are short-lived: long enough to open, too short to pass on. */
export const URL_TTL_SECONDS = Number(process.env.PRIVATE_DOCS_URL_TTL || 300);

/**
 * Vault key -> filename in the local download folder.
 *
 * The keys are the stable public-facing identifiers used by the frontend and by
 * S3; the values are the original, inconsistent filenames as downloaded. Keep
 * this in step with `privateDocumentGroups` in `src/content/certificates.ts`.
 */
export const KEY_MAP = {
  'mmnt/company-registration.png': 'Company Registration.png',
  'mmnt/moa.pdf': 'moa.pdf',
  'mmnt/aoa.pdf': 'aoa.pdf',
  'mmnt/company-pan.jpg': 'Company PAN.jpg',
  'mmnt/mantra-mountain-pan.png': 'Mantra Mountain PAN.png',
  'mmnt/share.jpg': 'Share.jpg',
  'mmnt/letter-sharelagat.pdf': 'letter sharelagat.pdf',
  'mmnt/sharelagat-proved.pdf': 'sharelagat proved.pdf',
  'mmnt/update-letter.pdf': 'update letter.pdf',
  'mmnt/nid.pdf': 'NID.pdf',
  'mmnt/personal-pan.jpeg': 'personal Pan.jpeg',
  'mmnt/sim-verification.jpg': 'SIm Verification.jpg',
  'mmnt/signature.png': 'signature.png',
};

/** Local source folder, used only outside production. */
export const LOCAL_DIR =
  process.env.PRIVATE_DOCS_DIR ||
  path.join(process.cwd(), 'portfolio/certificates/MMNT docs IMP need passport');

export function isKnownKey(key) {
  return Object.prototype.hasOwnProperty.call(KEY_MAP, key);
}

export function contentTypeFor(key) {
  const ext = path.extname(key).toLowerCase();
  return (
    {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    }[ext] || 'application/octet-stream'
  );
}

/** Absolute path of a vault key in the local download folder, or null. */
export function localPathFor(key) {
  if (!isKnownKey(key)) return null;
  const file = path.join(LOCAL_DIR, KEY_MAP[key]);
  return fs.existsSync(file) ? file : null;
}

/** True when S3 is wired up; otherwise the vault falls back to local disk. */
export function s3Configured() {
  return Boolean(BUCKET);
}

/**
 * Presign a GET for one vault key.
 *
 * The S3 SDK is imported lazily so deployments that never configure a bucket
 * do not pay for loading it — and so a missing optional dependency surfaces as
 * a clear vault error rather than a cold-start crash that takes out every
 * other route in the deployment.
 */
export async function presign(key) {
  const [{ S3Client, GetObjectCommand }, { getSignedUrl }] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@aws-sdk/s3-request-presigner'),
  ]);

  const client = new S3Client({
    region: REGION,
    ...(process.env.PRIVATE_DOCS_ACCESS_KEY_ID
      ? {
          credentials: {
            accessKeyId: process.env.PRIVATE_DOCS_ACCESS_KEY_ID,
            secretAccessKey: process.env.PRIVATE_DOCS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentType: contentTypeFor(key),
    // Render in the browser rather than forcing a download.
    ResponseContentDisposition: `inline; filename="${path.basename(key)}"`,
  });

  return getSignedUrl(client, command, { expiresIn: URL_TTL_SECONDS });
}
