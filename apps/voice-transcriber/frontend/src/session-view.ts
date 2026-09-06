/**
 * Renders one finished (or in-progress) session.
 *
 * Pure rendering: it takes rows out of IndexedDB and returns HTML. Everything
 * interactive is wired by the caller, so this file never touches storage or the
 * network.
 */

import type { ChunkRow, SessionAnalysis, SessionRow, TranscriptSegment } from './db';
import { bullets, clock, duration, escapeHtml, paragraphs, section, when } from './ui';

export type SessionTab = 'overview' | 'transcript' | 'summary' | 'reading' | 'japanese' | 'actions';

export const SESSION_TABS: { id: SessionTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'transcript', label: 'Transcript' },
  { id: 'summary', label: 'Summary' },
  { id: 'reading', label: 'Reading' },
  { id: 'japanese', label: '日本語' },
  { id: 'actions', label: 'Actions' },
];

export interface SessionViewData {
  session: SessionRow;
  chunks: ChunkRow[];
  segments: TranscriptSegment[];
  tab: SessionTab;
  showOriginal: boolean;
}

export function renderSession(data: SessionViewData): string {
  const { session, tab } = data;

  return `
    <header class="session-head">
      <button type="button" class="link-btn" data-action="back">← All recordings</button>
      <h2>${escapeHtml(session.analysis?.title || session.title)}</h2>
      <p class="meta">
        ${escapeHtml(when(session.createdAt))}
        · ${escapeHtml(duration(session.totalDurationSec))}
        · ${escapeHtml(session.languages.join(', ') || 'language not detected yet')}
      </p>
      ${renderStatus(session)}
    </header>

    <nav class="tabs">
      ${SESSION_TABS.map(
        (item) =>
          `<button type="button" class="tab ${item.id === tab ? 'active' : ''}" data-tab="${item.id}">${escapeHtml(item.label)}</button>`
      ).join('')}
    </nav>

    <div class="tab-body">${renderTab(data)}</div>
  `;
}

function renderStatus(session: SessionRow): string {
  if (session.status === 'done' && !session.error) return '';

  if (session.status === 'error') {
    return `<div class="banner err">
      <strong>Stopped:</strong> ${escapeHtml(session.error || 'Something went wrong.')}
      <button type="button" class="btn small" data-action="resume">Try again</button>
    </div>`;
  }

  if (session.status === 'paused') {
    const remaining = session.chunkTotal - session.chunkDone;
    return `<div class="banner warn">
      Paused with ${remaining} chunk${remaining === 1 ? '' : 's'} left.
      <button type="button" class="btn small" data-action="resume">Continue</button>
    </div>`;
  }

  if (session.status === 'done' && session.error) {
    return `<div class="banner warn">${escapeHtml(session.error)}</div>`;
  }

  return `<div class="banner info">
    Working — ${session.chunkDone} of ${session.chunkTotal} chunks done.
    <button type="button" class="btn small" data-action="resume">Resume</button>
  </div>`;
}

function renderTab(data: SessionViewData): string {
  const analysis = data.session.analysis;

  switch (data.tab) {
    case 'transcript':
      return renderTranscript(data);
    case 'summary':
      return renderSummary(analysis);
    case 'reading':
      return renderReading(analysis);
    case 'japanese':
      return renderJapanese(analysis);
    case 'actions':
      return renderActions(analysis);
    default:
      return renderOverview(data);
  }
}

/* ----------------------------------------------------------------- overview */

function renderOverview(data: SessionViewData): string {
  const { session, chunks } = data;
  const analysis = session.analysis;
  const failed = chunks.filter((chunk) => chunk.status === 'error');
  const skipped = chunks.filter((chunk) => chunk.status === 'skipped');

  return `
    ${section('What this was', paragraphs(analysis?.summary, 'The summary appears once processing finishes.'))}
    ${section('Where the project stands', paragraphs(analysis?.project_status, 'Not available yet.'))}
    ${section('Key points', bullets(analysis?.key_points))}
    ${section('Decisions', bullets(analysis?.decisions, 'Nothing was settled.'))}
    ${
      analysis?.timeline?.length
        ? section(
            'How it unfolded',
            `<ol class="timeline">${analysis.timeline
              .map(
                (item) =>
                  `<li><span class="at">${escapeHtml(item.at || '')}</span> ${escapeHtml(item.what || '')}</li>`
              )
              .join('')}</ol>`
          )
        : ''
    }
    ${
      skipped.length || failed.length
        ? section(
            'Coverage',
            `<p class="muted">
              ${skipped.length} quiet stretch${skipped.length === 1 ? '' : 'es'} skipped without being sent.
              ${failed.length ? `${failed.length} chunk${failed.length === 1 ? '' : 's'} could not be transcribed.` : ''}
            </p>`
          )
        : ''
    }
    ${analysis?.caveats ? section('Where to be careful', paragraphs(analysis.caveats)) : ''}
  `;
}

/* ---------------------------------------------------------------- transcript */

function renderTranscript(data: SessionViewData): string {
  const { segments, showOriginal } = data;

  if (!segments.length) {
    return `<p class="muted">No transcript yet. It fills in chunk by chunk as processing runs.</p>`;
  }

  return `
    <div class="toolbar">
      <button type="button" class="btn small ${showOriginal ? 'active' : ''}" data-action="toggle-original">
        ${showOriginal ? 'Hide original' : 'Show original'}
      </button>
      <button type="button" class="btn small" data-action="copy-transcript">Copy</button>
      <button type="button" class="btn small" data-action="export-txt">Export .txt</button>
    </div>
    <div class="transcript">
      ${segments
        .map(
          (segment) => `
        <div class="line">
          <div class="line-head">
            <span class="at">${escapeHtml(clock(segment.atSec))}</span>
            <span class="who">${escapeHtml(segment.speaker)}${
              segment.speakerRole ? ` · ${escapeHtml(segment.speakerRole)}` : ''
            }</span>
          </div>
          ${showOriginal && segment.original ? `<p class="original">${escapeHtml(segment.original)}</p>` : ''}
          <p class="english">${escapeHtml(segment.english || segment.original)}</p>
        </div>`
        )
        .join('')}
    </div>
  `;
}

/* ------------------------------------------------------------------ summary */

function renderSummary(analysis: SessionAnalysis | null): string {
  if (!analysis) return notReady();

  return `
    ${section('Summary', paragraphs(analysis.summary))}
    ${section('In detail', paragraphs(analysis.detailed_summary))}
    ${section('Open questions', bullets(analysis.open_questions, 'Nothing left hanging.'))}
    ${section('Risks worth knowing about', bullets(analysis.risks, 'None flagged.'))}
    <div class="toolbar">
      <button type="button" class="btn small" data-action="export-json">Export everything as JSON</button>
    </div>
  `;
}

/* ------------------------------------------------------------------ reading */

/**
 * The psychological read. Each observation carries the quote it came from and a
 * confidence, so it can be judged rather than taken on faith — this is
 * inference about what people meant, not a record of what they said.
 */
function renderReading(analysis: SessionAnalysis | null): string {
  if (!analysis) return notReady();
  if (!analysis.speakers?.length) {
    return `<p class="muted">No per-speaker read was produced for this recording.</p>`;
  }

  return `
    <p class="note">
      This is interpretation, not transcript. Every point below shows what it was inferred from,
      so you can weigh it yourself.
    </p>
    ${analysis.speakers
      .map(
        (speaker) => `
      <section class="speaker">
        <h3>${escapeHtml(speaker.speaker || 'Speaker')}${
          speaker.likely_role ? ` <span class="role">${escapeHtml(speaker.likely_role)}</span>` : ''
        }</h3>
        <dl class="facets">
          ${facet('Tone', speaker.tone)}
          ${facet('What they wanted', speaker.intent)}
          ${facet('What they did not say outright', speaker.subtext)}
        </dl>
        ${
          speaker.psychology?.length
            ? `<div class="patterns">${speaker.psychology
                .map(
                  (item) => `
              <article class="pattern conf-${escapeHtml(item.confidence || 'medium')}">
                <h4>${escapeHtml(item.pattern || 'Pattern')}
                  <span class="conf">${escapeHtml(item.confidence || 'medium')} confidence</span>
                </h4>
                ${item.evidence ? `<blockquote>${escapeHtml(item.evidence)}</blockquote>` : ''}
                <p>${escapeHtml(item.reading || '')}</p>
              </article>`
                )
                .join('')}</div>`
            : ''
        }
      </section>`
      )
      .join('')}
  `;
}

function facet(label: string, value?: string): string {
  if (!value) return '';
  return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
}

/* ----------------------------------------------------------------- japanese */

function renderJapanese(analysis: SessionAnalysis | null): string {
  if (!analysis) return notReady();

  const glossary = analysis.japanese_glossary || [];
  if (!glossary.length) {
    return `<p class="muted">No Japanese terms were picked out of this recording.</p>`;
  }

  return `
    <p class="note">Terms that carried weight in this conversation, with what they signalled.</p>
    <div class="glossary">
      ${glossary
        .map(
          (entry) => `
        <article class="term">
          <h3 lang="ja">${escapeHtml(entry.term || '')}</h3>
          ${entry.reading ? `<p class="reading" lang="ja">${escapeHtml(entry.reading)}</p>` : ''}
          <p class="meaning">${escapeHtml(entry.meaning || '')}</p>
          ${entry.politeness ? `<span class="chip">${escapeHtml(entry.politeness)}</span>` : ''}
          ${entry.why_it_mattered ? `<p class="why">${escapeHtml(entry.why_it_mattered)}</p>` : ''}
        </article>`
        )
        .join('')}
    </div>
    <div class="toolbar">
      <button type="button" class="btn small" data-action="export-glossary">Export for flashcards (CSV)</button>
    </div>
  `;
}

/* ------------------------------------------------------------------ actions */

function renderActions(analysis: SessionAnalysis | null): string {
  if (!analysis) return notReady();

  const mine = analysis.action_items_for_me || [];
  const others = analysis.action_items_for_others || [];
  const advice = analysis.what_you_should_do || [];

  return `
    ${section(
      'What you should do',
      advice.length
        ? `<ul class="advice">${advice
            .map(
              (item) => `
          <li class="urgency-${escapeHtml((item.urgency || '').split(' ')[0] || 'later')}">
            <strong>${escapeHtml(item.do || '')}</strong>
            ${item.urgency ? `<span class="chip">${escapeHtml(item.urgency)}</span>` : ''}
            ${item.why ? `<p class="why">${escapeHtml(item.why)}</p>` : ''}
          </li>`
            )
            .join('')}</ul>`
        : `<p class="muted">No next steps were identified.</p>`
    )}
    ${section(
      'On you',
      mine.length
        ? `<ul class="tasks">${mine
            .map(
              (item) => `
          <li>
            <strong>${escapeHtml(item.what || '')}</strong>
            ${item.by_when ? `<span class="chip">${escapeHtml(item.by_when)}</span>` : ''}
            ${item.why ? `<p class="why">${escapeHtml(item.why)}</p>` : ''}
          </li>`
            )
            .join('')}</ul>`
        : `<p class="muted">Nothing was assigned to you.</p>`
    )}
    ${section(
      'On other people',
      others.length
        ? `<ul class="tasks">${others
            .map(
              (item) => `
          <li>
            <strong>${escapeHtml(item.who || 'Someone')}</strong> — ${escapeHtml(item.what || '')}
            ${item.by_when ? `<span class="chip">${escapeHtml(item.by_when)}</span>` : ''}
          </li>`
            )
            .join('')}</ul>`
        : `<p class="muted">Nothing tracked for others.</p>`
    )}
    ${section('Worth asking next time', bullets(analysis.questions_to_ask, 'No follow-up questions suggested.'))}
  `;
}

function notReady(): string {
  return `<p class="muted">This appears once the recording has been processed.</p>`;
}

/* ------------------------------------------------------------------- export */

export function transcriptText(session: SessionRow, segments: TranscriptSegment[]): string {
  const header = [
    session.analysis?.title || session.title,
    new Date(session.createdAt).toLocaleString(),
    `${duration(session.totalDurationSec)} · ${session.languages.join(', ')}`,
    '',
  ].join('\n');

  const body = segments
    .map((segment) => {
      const who = `${segment.speaker}${segment.speakerRole ? ` (${segment.speakerRole})` : ''}`;
      const original = segment.original ? `\n    ${segment.original}` : '';
      return `[${clock(segment.atSec)}] ${who}:${original}\n    EN: ${segment.english || segment.original}`;
    })
    .join('\n\n');

  return `${header}\n${body}\n`;
}

/** Term,Reading,Meaning — the column order the flashcards app imports. */
export function glossaryCsv(analysis: SessionAnalysis | null): string {
  const rows = (analysis?.japanese_glossary || []).map((entry) =>
    [entry.term, entry.reading, entry.meaning, entry.why_it_mattered]
      .map((value) => `"${String(value || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return ['Term,Reading,Meaning,Context', ...rows].join('\n');
}
