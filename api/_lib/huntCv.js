/**
 * Tailor a CV and cover letter to one job posting.
 *
 * The hard rule here is that tailoring means *selection and emphasis*, never
 * invention. The model is given only the facts in `huntProfile.json` and is
 * told, repeatedly and structurally, that it may not add anything else — no
 * invented years, employers, certifications or metrics. A CV that overstates
 * gets found out at interview, and it goes out under Prabin's name, not mine.
 *
 * The output also names the genuine gaps against the posting, because knowing
 * you are missing Kubernetes before a recruiter asks is worth more than a
 * document that pretends otherwise.
 */

import { profile } from './huntMatch.js';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export function cvConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

const SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: '2-3 sentence professional summary aimed at this specific role.',
    },
    highlights: {
      type: 'array',
      items: { type: 'string' },
      description: '4-6 CV bullet points, reordered and reworded for this job, drawn only from the supplied evidence.',
    },
    matchedRequirements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          requirement: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['requirement', 'evidence'],
      },
      description: 'Posting requirements the candidate genuinely meets, each tied to specific evidence.',
    },
    gaps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Requirements the candidate does NOT currently meet. Be honest; do not soften.',
    },
    coverLetter: {
      type: 'string',
      description: 'A short cover letter, under 200 words, specific to this company and role.',
    },
    verdict: {
      type: 'string',
      enum: ['strong', 'worth-applying', 'stretch', 'skip'],
      description: 'Honest recommendation on whether this application is worth the effort.',
    },
    verdictReason: { type: 'string' },
  },
  required: ['summary', 'highlights', 'matchedRequirements', 'gaps', 'coverLetter', 'verdict', 'verdictReason'],
};

export async function tailorApplication(job, { model = process.env.GEMINI_MODEL || 'gemini-2.5-flash' } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not set — CV tailoring is unavailable.');
    error.statusCode = 503;
    throw error;
  }

  const c = profile.candidate;
  const prompt = `You are helping a real person apply for a real job. Everything you write goes out under his name.

ABSOLUTE RULE: use ONLY the facts listed below. Do not invent employers, job titles,
dates, years of experience, team sizes, certifications, technologies or metrics. If the
posting wants something he does not have, put it in "gaps" — never imply he has it.
Rewording and reordering real experience to match the posting's language is encouraged.
Fabricating is not.

CANDIDATE
Name: ${c.name}
Location: ${c.location}
Nationality: ${c.nationality}
Current role: ${c.currentRole} at ${c.currentEmployer}
Work authorisation: ${c.workAuthorization}
Education: ${c.education}
Languages: ${c.languages.join('; ')}
Portfolio: ${c.portfolio}

VERIFIED EVIDENCE (the complete set of things he has actually done):
${profile.evidence.map((e) => `- ${e}`).join('\n')}

SKILLS HE ACTUALLY HAS:
${profile.coreSkills.join(', ')}

THE JOB
Company: ${job.company}
Title: ${job.title}
Location: ${job.location}
Description:
${(job.description || '(No description was available from the job board — work from the title and company alone, and say so in verdictReason.)').slice(0, 5000)}

Write the tailored application. Be truthful about the gaps — an honest "stretch" or
"skip" verdict is more useful to him than an encouraging one.`;

  const res = await fetch(`${ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const error = new Error(`Gemini responded ${res.status}: ${detail.slice(0, 200)}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const error = new Error('Gemini returned no content.');
    error.statusCode = 502;
    throw error;
  }

  return { ...JSON.parse(text), generatedAt: new Date().toISOString(), model };
}
