/** Small rendering helpers shared by the views. */

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Seconds to `M:SS`, or `H:MM:SS` past an hour. */
export function clock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** A duration in words, for headings rather than timers. */
export function duration(totalSeconds: number): string {
  const minutes = Math.round((totalSeconds || 0) / 60);
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function when(timestamp: number): string {
  const date = new Date(timestamp);
  const days = Math.floor((Date.now() - timestamp) / 86_400_000);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  if (days < 7) return `${date.toLocaleDateString([], { weekday: 'long' })} ${time}`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function bytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(0)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

/** Renders a list, or a muted placeholder when it is empty. */
export function bullets(items: (string | undefined)[] | undefined, empty = 'Nothing noted.'): string {
  const clean = (items || []).map((item) => String(item || '').trim()).filter(Boolean);
  if (!clean.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
  return `<ul class="bullets">${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export function section(title: string, body: string): string {
  return `<section class="block"><h3>${escapeHtml(title)}</h3>${body}</section>`;
}

/** Paragraph text, preserving the blank-line breaks Gemini writes. */
export function paragraphs(text: string | undefined, empty = 'Not available.'): string {
  const clean = String(text || '').trim();
  if (!clean) return `<p class="muted">${escapeHtml(empty)}</p>`;
  return clean
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function on(
  root: ParentNode,
  selector: string,
  event: string,
  handler: (element: HTMLElement, event: Event) => void
): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.addEventListener(event, (e) => handler(element, e));
  });
}

export function download(filename: string, content: string, type = 'text/plain'): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
