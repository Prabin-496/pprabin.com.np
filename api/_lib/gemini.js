/**
 * Gemini calls for the voice transcriber.
 *
 * Ported from the Express backend with one change: audio arrives as a base64
 * string from the request body rather than a path on disk. Serverless
 * filesystems are ephemeral, and the audio is only ever read once — to hand it
 * to Gemini — so there is nothing to gain from writing it down first.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const TRANSCRIBE_PROMPT = `You are an expert multilingual speech transcription system.

Listen to this audio. The speaker may use Japanese, English, Nepali, or a mix.

Return ONLY valid JSON (no markdown fences):
{
  "detected_language": "Japanese | English | Nepali | Mixed",
  "raw_transcript": "verbatim transcript in original language(s)",
  "translated_english": "natural English translation if not already English, else same as raw",
  "confidence": 0.0 to 1.0,
  "timestamps": [{"start":"0:00","end":"0:30","text":"segment"}]
}

Rules:
- Preserve meaning; include filler words in raw_transcript only
- timestamps: approximate segments if possible, else empty array
- confidence: your best estimate`;

const MERGE_PROMPT = (chunks) => `Merge these partial transcripts from one recording session into one coherent result.

Chunks (JSON array):
${JSON.stringify(chunks, null, 2)}

Return ONLY valid JSON:
{
  "detected_language": "primary language",
  "raw_transcript": "merged original-language transcript",
  "translated_english": "merged English",
  "confidence": 0.95,
  "timestamps": []
}`;

const CLEAN_SUMMARY_PROMPT = (payload) => `You are a personal meeting notes assistant.

Input transcript data:
${JSON.stringify(payload, null, 2)}

Tasks:
1. Clean English text: remove filler words (um, uh, like), fix grammar, keep meaning
2. Produce summaries and metadata

Return ONLY valid JSON:
{
  "cleaned_english": "polished English",
  "summary": "2-3 sentence quick summary",
  "detailed_summary": "paragraph detailed summary",
  "key_points": ["point1"],
  "action_items": ["action1"],
  "important_terms": ["name or term"],
  "detected_topics": ["topic1"],
  "language": "detected primary language",
  "sentiment": "positive|neutral|negative|mixed",
  "follow_up_questions": ["question1"],
  "meeting_notes": "structured notes with headers if applicable",
  "vocabulary": ["term: definition"]
}`;

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export const geminiModel = MODEL;

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured on the server');
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL });
}

/** Gemini is asked for bare JSON but sometimes wraps it in a fenced block anyway. */
function parseJsonFromText(text) {
  const cleaned = (text || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function generateText(prompt) {
  const result = await getModel().generateContent(prompt);
  return parseJsonFromText(result.response.text());
}

export async function transcribeAudioChunk(base64Audio, mimeType) {
  const result = await getModel().generateContent([
    { inlineData: { mimeType: mimeType || 'audio/webm', data: base64Audio } },
    { text: TRANSCRIBE_PROMPT },
  ]);
  return parseJsonFromText(result.response.text());
}

export async function mergeChunkTranscripts(chunkTexts) {
  return generateText(MERGE_PROMPT(chunkTexts));
}

export async function cleanAndSummarize(transcriptPayload) {
  return generateText(CLEAN_SUMMARY_PROMPT(transcriptPayload));
}
