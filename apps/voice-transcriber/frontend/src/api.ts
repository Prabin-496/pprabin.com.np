import { getApiBaseUrl } from '@shared/getApiBaseUrl';

const API_BASE = getApiBaseUrl(import.meta.env.VITE_VOICE_AI_API_URL);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface Recording {
  id: string;
  title: string;
  status: string;
  detected_language?: string;
  raw_transcript?: string;
  translated_english?: string;
  cleaned_english?: string;
  confidence?: number;
  timestamps?: { start?: string; end?: string; text?: string }[];
  summary?: SummaryPayload | null;
  chunk_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SummaryPayload {
  summary: string;
  detailed_summary: string;
  key_points: string[];
  action_items: string[];
  important_terms: string[];
  detected_topics: string[];
  language: string;
  sentiment: string;
  follow_up_questions: string[];
  meeting_notes?: string;
  vocabulary?: string[];
}

/** FileReader gives a data: URL; the API wants the payload without the prefix. */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read audio chunk'));
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export const api = {
  health: () => request<{ ok: boolean; geminiConfigured: boolean }>('/api/voice/health'),
  list: () => request<{ recordings: Recording[] }>('/api/recordings'),
  search: (q: string) =>
    request<{ recordings: Recording[] }>(`/api/recordings/search?q=${encodeURIComponent(q)}`),
  get: (id: string) =>
    request<{ recording: Recording; chunks: unknown[] }>(`/api/recordings/${id}`),
  create: (title?: string) =>
    request<{ recording: Recording }>('/api/recordings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
  uploadChunk: async (recordingId: string, chunkIndex: number, blob: Blob, mimeType: string) => {
    // Sent as base64 JSON rather than multipart: the serverless handler has no
    // disk to spool an upload to, and a 45s Opus chunk stays well under the
    // 4.5 MB request-body limit even after base64 expansion.
    const audio = await blobToBase64(blob);
    return request<{ chunk: unknown }>(`/api/recordings/${recordingId}/chunks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunkIndex, mimeType, audio }),
    });
  },
  finalize: (id: string) =>
    request<{ recording: Recording }>(`/api/recordings/${id}/finalize`, { method: 'POST' }),
  remove: (id: string) => request<void>(`/api/recordings/${id}`, { method: 'DELETE' }),
};
