/**
 * Upload the private document vault to its S3 bucket.
 *
 * These files are deliberately absent from the repository (see .gitignore), so
 * a deployment has no copy of them until this runs. One-off command:
 *
 *   PRIVATE_DOCS_BUCKET=my-bucket \
 *   PRIVATE_DOCS_ACCESS_KEY_ID=... \
 *   PRIVATE_DOCS_SECRET_ACCESS_KEY=... \
 *   node scripts/upload-private-docs.mjs
 *
 * Pass --dry-run to see what would be uploaded without sending anything.
 *
 * The bucket must block all public access; `/api/documents` reaches the objects
 * with presigned URLs, never with a public ACL.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEY_MAP, LOCAL_DIR, contentTypeFor } from '../api/_lib/privateDocs.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const bucket = process.env.PRIVATE_DOCS_BUCKET;
const region =
  process.env.PRIVATE_DOCS_REGION || process.env.AWS_REGION_ANKI || process.env.AWS_REGION || 'ap-southeast-2';

if (!bucket && !dryRun) {
  console.error('PRIVATE_DOCS_BUCKET is not set. Re-run with the bucket name, or use --dry-run.');
  process.exit(1);
}

const sourceDir = path.isAbsolute(LOCAL_DIR) ? LOCAL_DIR : path.join(root, LOCAL_DIR);
if (!fs.existsSync(sourceDir)) {
  console.error(`Source folder not found: ${sourceDir}`);
  process.exit(1);
}

const planned = [];
const missing = [];

for (const [key, filename] of Object.entries(KEY_MAP)) {
  const file = path.join(sourceDir, filename);
  if (fs.existsSync(file)) planned.push({ key, file, size: fs.statSync(file).size });
  else missing.push({ key, filename });
}

for (const { key, filename } of missing) {
  console.warn(`  skip  ${key}  (no such file: ${filename})`);
}

if (!planned.length) {
  console.error('Nothing to upload.');
  process.exit(1);
}

const total = planned.reduce((n, p) => n + p.size, 0);
console.log(
  `${dryRun ? '[dry run] would upload' : 'Uploading'} ${planned.length} files ` +
    `(${(total / 1024 / 1024).toFixed(1)} MB) to s3://${bucket || '<bucket>'} in ${region}\n`
);

if (dryRun) {
  for (const { key, size } of planned) {
    console.log(`  ${key}  ${(size / 1024).toFixed(0)} KB  ${contentTypeFor(key)}`);
  }
  process.exit(0);
}

const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

const client = new S3Client({
  region,
  ...(process.env.PRIVATE_DOCS_ACCESS_KEY_ID
    ? {
        credentials: {
          accessKeyId: process.env.PRIVATE_DOCS_ACCESS_KEY_ID,
          secretAccessKey: process.env.PRIVATE_DOCS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

let uploaded = 0;
for (const { key, file, size } of planned) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: contentTypeFor(key),
      ServerSideEncryption: 'AES256',
    })
  );
  uploaded += 1;
  console.log(`  ok    ${key}  ${(size / 1024).toFixed(0)} KB`);
}

console.log(`\nDone — ${uploaded} uploaded, ${missing.length} skipped.`);
