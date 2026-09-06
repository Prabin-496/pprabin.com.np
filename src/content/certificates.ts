/**
 * Certificate catalogue.
 *
 * The public list is not maintained by hand. `scripts/generate-certificates.mjs`
 * scans `public/certificates/` and derives a title, issuer and category from
 * each filename into `certificates.generated.ts`, which the build regenerates
 * every time. So adding a certificate is one step: commit the file.
 *
 * Where a filename cannot express the real name, `certificate-overrides.ts`
 * supplies corrections that are merged in below.
 */

import { generatedCertificates } from './certificates.generated';
import { certificateOverrides } from './certificate-overrides';

export type CertificateCategory =
  | 'Cloud & Infrastructure'
  | 'Networking & Linux'
  | 'Programming Foundations'
  | 'Java'
  | 'Web Development'
  | 'AI & Prompt Engineering'
  | 'Design & Accessibility'
  | 'Tooling & Practices'
  | 'Career & Business'
  | 'Hardware & Systems'
  | 'Other';

export type Certificate = {
  title: string;
  issuer: string;
  file: string;
  category: CertificateCategory;
  /** Set for the credentials worth surfacing above the fold. */
  featured?: boolean;
};

/**
 * Display order for the category sections — cloud and infrastructure first,
 * because that is the work the role search is about. "Other" sits last and
 * only appears if a filename matched no rule, which is a prompt to add one.
 */
export const certificateCategories: CertificateCategory[] = [
  'Cloud & Infrastructure',
  'Networking & Linux',
  'Programming Foundations',
  'Java',
  'Web Development',
  'AI & Prompt Engineering',
  'Tooling & Practices',
  'Design & Accessibility',
  'Career & Business',
  'Hardware & Systems',
  'Other',
];

/** Derived metadata, with any hand-written correction layered on top. */
export const certificates: Certificate[] = generatedCertificates.map((certificate) => ({
  ...certificate,
  ...certificateOverrides[certificate.file],
}));

/**
 * Private company/identity documents, unlocked with a passcode.
 *
 * The files themselves are deliberately NOT in this repo — see
 * `docs/private-documents.md`. This list only describes what the vault holds so
 * the locked state can show something meaningful; `/api/documents` is what
 * actually checks the passcode and hands back a time-limited link.
 */
export type PrivateDocument = {
  title: string;
  /** Key within the private store, e.g. `mmnt/company-registration.png`. */
  key: string;
  kind: 'pdf' | 'image';
};

export const privateDocumentGroups: { group: string; documents: PrivateDocument[] }[] = [
  {
    group: 'Company registration',
    documents: [
      { title: 'Company Registration', key: 'mmnt/company-registration.png', kind: 'image' },
      { title: 'Memorandum of Association (MOA)', key: 'mmnt/moa.pdf', kind: 'pdf' },
      { title: 'Articles of Association (AOA)', key: 'mmnt/aoa.pdf', kind: 'pdf' },
      { title: 'Company PAN', key: 'mmnt/company-pan.jpg', kind: 'image' },
      { title: 'Mantra Mountain PAN', key: 'mmnt/mantra-mountain-pan.png', kind: 'image' },
    ],
  },
  {
    group: 'Shareholding',
    documents: [
      { title: 'Share Certificate', key: 'mmnt/share.jpg', kind: 'image' },
      { title: 'Share Lagat — Letter', key: 'mmnt/letter-sharelagat.pdf', kind: 'pdf' },
      { title: 'Share Lagat — Proof', key: 'mmnt/sharelagat-proved.pdf', kind: 'pdf' },
      { title: 'Update Letter', key: 'mmnt/update-letter.pdf', kind: 'pdf' },
    ],
  },
  {
    group: 'Personal identity',
    documents: [
      { title: 'National ID', key: 'mmnt/nid.pdf', kind: 'pdf' },
      { title: 'Personal PAN', key: 'mmnt/personal-pan.jpeg', kind: 'image' },
      { title: 'SIM Verification', key: 'mmnt/sim-verification.jpg', kind: 'image' },
      { title: 'Signature', key: 'mmnt/signature.png', kind: 'image' },
    ],
  },
];
