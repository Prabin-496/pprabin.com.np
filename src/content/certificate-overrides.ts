/**
 * Corrections to the metadata derived from certificate filenames.
 *
 * `scripts/certificate-meta.mjs` works out a title, issuer and category for
 * every file in `public/certificates/`. It is right most of the time, which is
 * what lets a new certificate be categorised just by being committed. This file
 * is for the rest — where the real name carries something the filename cannot,
 * like "Guinness World Record Attempt" or a "(Scott Simpson)" disambiguator.
 *
 * Keyed by filename. Any field left out keeps its derived value, so an entry
 * that only pins `featured` still gets an auto title and category.
 *
 * Deleting an entry is safe: the certificate falls back to its derived
 * metadata and stays on the page.
 */

import type { CertificateCategory } from './certificates';

export type CertificateOverride = {
  title?: string;
  issuer?: string;
  category?: CertificateCategory;
  /** Tints the card accent — reserved for the credentials worth noticing. */
  featured?: boolean;
};

export const certificateOverrides: Record<string, CertificateOverride> = {
  'aws-academy-cloud-foundations-certificate.pdf': { title: 'AWS Academy Graduate — Cloud Foundations', featured: true },
  'aws-academy-cloud-foundations-badge.png': { title: 'AWS Academy Cloud Foundations — Digital Badge', issuer: 'AWS Academy / Credly', featured: true },
  'practical-linux-for-network-engineers-part-1.pdf': { title: 'Practical Linux for Network Engineers, Part 1', featured: true },
  'programming-foundations-databases-by-scott-simpson.pdf': { title: 'Programming Foundations: Databases (Scott Simpson)' },
  'java-objectoriented-programming.pdf': { title: 'Java: Object-Oriented Programming' },
  'javascript-essential-training.pdf': { featured: true },
  'react-essential-training.pdf': { featured: true },
  'node-js-essential-training.pdf': { featured: true },
  'learning-npm-a-package-manager.pdf': { title: 'Learning npm: A Package Manager' },
  'introduction-to-prompt-engineering-for-generative-ai.pdf': { featured: true },
  'nano-tips-technical-prompts-with-chatgpt.pdf': { title: 'Nano Tips for Leveraging Technical Prompts Using ChatGPT' },
  'microsoft-365-copilot-first-look.pdf': { title: 'Microsoft 365 Copilot: First Look', issuer: 'LinkedIn Learning' },
  'microsoft-ai-skills-fest-badge.png': { title: 'Microsoft AI Skills Fest — Guinness World Record Attempt' },
  'git-essential-training.pdf': { featured: true },
  'figma-essential-training-the-basics.pdf': { title: 'Figma Essential Training: The Basics' },
  'graphic-design-careers-first-steps.pdf': { title: 'Graphic Design Careers: First Steps' },
  'career-essentials-in-software-development-by-microsoft-and-linkedin.pdf': { title: 'Career Essentials in Software Development', featured: true },
  'business-analysis-foundations-business-process-modeling-2.pdf': { title: 'Business Analysis Foundations: Business Process Modeling (II)' },
  'handson-pc-build-from-the-bench.pdf': { title: 'Hands-On PC Build: From the Bench' },};
