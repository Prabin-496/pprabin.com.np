/**
 * App shell: state, routing and the wiring between storage, the recorder and
 * the pipeline.
 *
 * The whole app is local-first. There is no account and no server database —
 * sessions live in IndexedDB on this device, the Gemini key is stored here too
 * and sent per request, and the server only ever sees a chunk of audio on its
 * way to Gemini. That is what lets the app work the moment a key is pasted in.
 */

import * as db from './db';
import type { SessionRow, Settings } from './db';
import * as api from './api';
import * as pipeline from './pipeline';
import { LiveRecorder, isIos } from './recorder';
import type { RecorderState } from './recorder';
import { glossaryCsv, renderSession, transcriptText } from './session-view';
import type { SessionTab } from './session-view';
import { wavHeader } from './split/wav';
import { bytes, clock, copy, download, duration, escapeHtml, on, when } from './ui';

type Route = 'home' | 'session' | 'settings' | 'record';

interface State {
  route: Route;
  sessionId: string | null;
  tab: SessionTab;
  showOriginal: boolean;
  sessions: SessionRow[];
  settings: Settings;
  health: api.Health | null;
  progress: pipeline.Progress | null;
  error: string;
  notice: string;
  recorderState: RecorderState;
  recorderDetail: string;
  recorderElapsed: number;
  level: number;
}

export function mountApp(root: HTMLElement): void {
  const state: State = {
    route: 'home',
    sessionId: null,
    tab: 'overview',
    showOriginal: true,
    sessions: [],
    settings: db.DEFAULT_SETTINGS,
    health: null,
    progress: null,
    error: '',
    notice: '',
    recorderState: 'idle',
    recorderDetail: '',
    recorderElapsed: 0,
    level: 0,
  };

  let recorder: LiveRecorder | null = null;
  let liveSessionId: string | null = null;
  let recorderTimer: ReturnType<typeof setInterval> | null = null;

  /* ------------------------------------------------------------ rendering */

  const render = () => {
    root.innerHTML = `
      <div class="shell">
        ${renderHeader()}
        ${state.error ? `<div class="banner err">${escapeHtml(state.error)}<button type="button" class="link-btn" data-action="dismiss-error">Dismiss</button></div>` : ''}
        ${state.notice ? `<div class="banner ok">${escapeHtml(state.notice)}</div>` : ''}
        ${state.progress ? renderProgress(state.progress) : ''}
        <main>${renderRoute()}</main>
      </div>
    `;
    bind();
  };

  const renderHeader = () => {
    const keyed = Boolean(state.settings.apiKey || state.health?.geminiConfigured);
    return `
      <header class="app-head">
        <button type="button" class="brand" data-action="home">
          <span class="dot"></span> Voice AI
        </button>
        <div class="head-actions">
          <span class="pill ${keyed ? 'ok' : 'err'}" data-action="settings">
            ${keyed ? 'Ready' : 'Add API key'}
          </span>
          <button type="button" class="icon-btn" data-action="settings" aria-label="Settings">⚙</button>
        </div>
      </header>
    `;
  };

  const renderProgress = (progress: pipeline.Progress) => {
    const pct = progress.chunkTotal
      ? Math.round((progress.chunkDone / progress.chunkTotal) * 100)
      : 0;
    const eta =
      progress.etaSeconds && progress.phase === 'transcribing'
        ? ` · about ${duration(progress.etaSeconds)} left`
        : '';

    return `
      <div class="progress-bar ${progress.phase}">
        <div class="fill" style="width:${pct}%"></div>
        <div class="progress-text">
          ${escapeHtml(progress.message)}${escapeHtml(eta)}
          ${progress.chunkTotal ? ` · ${progress.chunkDone}/${progress.chunkTotal}` : ''}
          ${
            progress.phase === 'transcribing' || progress.phase === 'summarising'
              ? '<button type="button" class="link-btn" data-action="pause-run">Pause</button>'
              : ''
          }
        </div>
      </div>
    `;
  };

  const renderRoute = () => {
    if (state.route === 'settings') return renderSettings();
    if (state.route === 'record') return renderRecord();
    if (state.route === 'session') return renderSessionRoute();
    return renderHome();
  };

  /* ---------------------------------------------------------------- home */

  const renderHome = () => `
    <div class="actions-grid">
      <button type="button" class="big-action primary" data-action="import">
        <span class="big-icon">↑</span>
        <strong>Import a recording</strong>
        <small>Voice Memos, or any audio file. Handles a full 8-hour day.</small>
      </button>
      <button type="button" class="big-action" data-action="go-record">
        <span class="big-icon">●</span>
        <strong>Record now</strong>
        <small>${isIos() ? 'Screen must stay on — see the note inside.' : 'Records while this tab stays open.'}</small>
      </button>
    </div>
    <input type="file" id="fileInput" accept="audio/*,.m4a,.mp3,.wav,.aac,.mp4" hidden />

    ${
      isIos()
        ? `<div class="banner info how-to">
            <strong>For a whole workday:</strong> record with the iPhone's own Voice Memos app —
            it keeps running in your pocket with the screen locked — then come back here and
            import the file. Safari cannot hold the microphone in the background, so that is the
            only way to capture eight hours.
          </div>`
        : ''
    }

    <h2 class="section-title">Recordings</h2>
    ${
      state.sessions.length
        ? `<ul class="sessions">${state.sessions.map(renderSessionCard).join('')}</ul>`
        : `<p class="muted empty">Nothing yet. Import a recording to get started.</p>`
    }
  `;

  const renderSessionCard = (session: SessionRow) => {
    const badge =
      session.status === 'done'
        ? ''
        : `<span class="chip ${session.status === 'error' ? 'err' : 'warn'}">${escapeHtml(session.status)}</span>`;

    return `
      <li class="session-card" data-id="${escapeHtml(session.id)}">
        <div class="card-main" data-action="open-session">
          <strong>${escapeHtml(session.analysis?.title || session.title)}</strong>
          <p class="meta">
            ${escapeHtml(when(session.createdAt))} · ${escapeHtml(duration(session.totalDurationSec))}
            ${session.languages.length ? ` · ${escapeHtml(session.languages.join(', '))}` : ''}
            ${badge}
          </p>
          ${session.analysis?.summary ? `<p class="snippet">${escapeHtml(session.analysis.summary)}</p>` : ''}
        </div>
        <button type="button" class="icon-btn danger" data-action="delete-session" aria-label="Delete">×</button>
      </li>
    `;
  };

  /* ------------------------------------------------------------- session */

  let sessionCache: { chunks: db.ChunkRow[]; segments: db.TranscriptSegment[] } = {
    chunks: [],
    segments: [],
  };

  const renderSessionRoute = () => {
    const session = state.sessions.find((item) => item.id === state.sessionId);
    if (!session) return `<p class="muted">That recording is gone.</p>`;

    return renderSession({
      session,
      chunks: sessionCache.chunks,
      segments: sessionCache.segments,
      tab: state.tab,
      showOriginal: state.showOriginal,
    });
  };

  /* -------------------------------------------------------------- record */

  const renderRecord = () => {
    const active = state.recorderState !== 'idle';

    return `
      <button type="button" class="link-btn" data-action="home">← All recordings</button>

      <div class="recorder ${state.recorderState}">
        <div class="level-ring" style="--level:${state.level.toFixed(3)}">
          <button type="button" class="record-btn" data-action="${active ? 'stop-record' : 'start-record'}">
            ${active ? '■' : '●'}
          </button>
        </div>
        <p class="timer">${escapeHtml(clock(state.recorderElapsed))}</p>
        <p class="recorder-state">${escapeHtml(labelForRecorder(state.recorderState))}</p>
        ${state.recorderDetail ? `<p class="note">${escapeHtml(state.recorderDetail)}</p>` : ''}
        ${
          active
            ? `<div class="btn-row">
                 <button type="button" class="btn" data-action="${
                   state.recorderState === 'paused' ? 'resume-record' : 'pause-record'
                 }">${state.recorderState === 'paused' ? 'Resume' : 'Pause'}</button>
                 <button type="button" class="btn danger" data-action="stop-record">Stop &amp; process</button>
               </div>`
            : ''
        }
      </div>

      <div class="banner warn">
        <strong>Before you rely on this:</strong> your phone shows a recording indicator while the
        microphone is live, and that cannot be turned off — it is enforced by iOS, not by this app.
        Recording colleagues is also governed by your company's policy, so it is worth a look
        before this becomes a daily habit.
      </div>

      ${
        isIos()
          ? `<div class="banner info">
              iOS ends the microphone as soon as Safari is backgrounded or the screen locks, so
              this screen has to stay open and awake. The app holds a wake lock and picks recording
              back up automatically if it gets interrupted, but the time it was away is lost.
              For a full day, use Voice Memos and import instead.
            </div>`
          : ''
      }
    `;
  };

  const labelForRecorder = (recorderState: RecorderState) =>
    ({
      idle: 'Ready',
      recording: 'Recording',
      paused: 'Paused',
      interrupted: 'Interrupted — reopen this screen to continue',
    })[recorderState];

  /* ------------------------------------------------------------ settings */

  const renderSettings = () => {
    const { settings, health } = state;

    return `
      <button type="button" class="link-btn" data-action="home">← All recordings</button>
      <h2 class="section-title">Settings</h2>

      <section class="block">
        <h3>Gemini API key</h3>
        ${
          health?.geminiConfigured
            ? `<p class="muted">A key is configured on the server, so you don't need one here.</p>`
            : `<p class="muted">
                 Free, no card needed: open
                 <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>,
                 create a key, and paste it below. It is stored only on this device and sent with
                 each request — it is never saved on the server.
               </p>`
        }
        <input type="password" class="input" id="apiKey" placeholder="AIza…"
               value="${escapeHtml(settings.apiKey)}" autocomplete="off" spellcheck="false" />
        <div class="btn-row">
          <button type="button" class="btn primary" data-action="save-key">Save key</button>
          <button type="button" class="btn" data-action="test-key">Test it</button>
        </div>
      </section>

      <section class="block">
        <h3>Model</h3>
        <select class="input" id="model">
          ${(health?.models || [settings.model])
            .map(
              (model) =>
                `<option value="${escapeHtml(model)}" ${model === settings.model ? 'selected' : ''}>${escapeHtml(model)}</option>`
            )
            .join('')}
        </select>
        <p class="muted">
          <code>gemini-2.5-flash</code> is the right default. <code>flash-lite</code> stretches the
          free daily quota further on a very long day; <code>pro</code> reads tone more carefully
          but has a much smaller free allowance.
        </p>
      </section>

      <section class="block">
        <h3>About you</h3>
        <p class="muted">Used to judge which parts are aimed at you and what you should do next.</p>
        <input type="text" class="input" id="profileName" placeholder="Your name as colleagues say it"
               value="${escapeHtml(settings.profileName)}" />
        <input type="text" class="input" id="profileRole" placeholder="Your role, e.g. backend engineer"
               value="${escapeHtml(settings.profileRole)}" />
        <label class="check">
          <input type="checkbox" id="assumeNoJapanese" ${settings.assumeNoJapanese ? 'checked' : ''} />
          Explain Japanese as if I barely know any
        </label>
      </section>

      <section class="block">
        <h3>Processing</h3>
        <label class="field">
          <span>Chunk length</span>
          <select class="input" id="chunkSeconds">
            ${[180, 300, 420, 600]
              .map(
                (value) =>
                  `<option value="${value}" ${value === settings.chunkSeconds ? 'selected' : ''}>${value / 60} minutes</option>`
              )
              .join('')}
          </select>
        </label>
        <p class="muted">
          Longer chunks mean fewer requests against the free daily quota; shorter ones give tighter
          timestamps. Five minutes is a good balance for an all-day recording.
        </p>
        <label class="field">
          <span>Keep recordings for</span>
          <select class="input" id="retentionDays">
            ${[3, 7, 14, 30, 0]
              .map(
                (value) =>
                  `<option value="${value}" ${value === settings.retentionDays ? 'selected' : ''}>${
                    value ? `${value} days` : 'Until I delete them'
                  }</option>`
              )
              .join('')}
          </select>
        </label>
        <div class="btn-row">
          <button type="button" class="btn primary" data-action="save-settings">Save settings</button>
        </div>
      </section>

      <section class="block">
        <h3>Storage</h3>
        <p class="muted" id="storageLine">Checking…</p>
        <p class="muted">
          Transcripts and summaries stay on this device. Audio is deleted as soon as a recording
          has been processed, and whole sessions are removed once they pass the retention window.
        </p>
        <div class="btn-row">
          <button type="button" class="btn danger" data-action="delete-all">Delete everything</button>
        </div>
      </section>
    `;
  };

  /* -------------------------------------------------------------- actions */

  const bind = () => {
    on(root, '[data-action="home"], .brand', 'click', () => go('home'));
    on(root, '[data-action="settings"]', 'click', () => go('settings'));
    on(root, '[data-action="go-record"]', 'click', () => go('record'));
    on(root, '[data-action="dismiss-error"]', 'click', () => {
      state.error = '';
      render();
    });
    on(root, '[data-action="back"]', 'click', () => go('home'));

    on(root, '[data-action="import"]', 'click', () => {
      root.querySelector<HTMLInputElement>('#fileInput')?.click();
    });
    const fileInput = root.querySelector<HTMLInputElement>('#fileInput');
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) void startImport(file);
    });

    on(root, '[data-action="open-session"]', 'click', (element) => {
      const id = element.closest<HTMLElement>('[data-id]')?.dataset.id;
      if (id) void openSession(id);
    });
    on(root, '[data-action="delete-session"]', 'click', (element, event) => {
      event.stopPropagation();
      const id = element.closest<HTMLElement>('[data-id]')?.dataset.id;
      if (id) void removeSession(id);
    });

    on(root, '[data-tab]', 'click', (element) => {
      state.tab = element.dataset.tab as SessionTab;
      render();
    });
    on(root, '[data-action="toggle-original"]', 'click', () => {
      state.showOriginal = !state.showOriginal;
      render();
    });

    on(root, '[data-action="resume"]', 'click', () => {
      if (state.sessionId) void run(state.sessionId);
    });
    on(root, '[data-action="pause-run"]', 'click', () => pipeline.cancelRun());

    bindExports();
    bindRecorder();
    bindSettings();
  };

  const bindExports = () => {
    const session = state.sessions.find((item) => item.id === state.sessionId);
    if (!session) return;

    on(root, '[data-action="copy-transcript"]', 'click', async () => {
      const ok = await copy(transcriptText(session, sessionCache.segments));
      flash(ok ? 'Transcript copied.' : 'Could not reach the clipboard.');
    });
    on(root, '[data-action="export-txt"]', 'click', () => {
      download(`${slug(session.title)}-transcript.txt`, transcriptText(session, sessionCache.segments));
    });
    on(root, '[data-action="export-json"]', 'click', () => {
      download(
        `${slug(session.title)}.json`,
        JSON.stringify({ session, segments: sessionCache.segments }, null, 2),
        'application/json'
      );
    });
    on(root, '[data-action="export-glossary"]', 'click', () => {
      download(`${slug(session.title)}-japanese.csv`, glossaryCsv(session.analysis), 'text/csv');
    });
  };

  const bindRecorder = () => {
    on(root, '[data-action="start-record"]', 'click', () => void startRecording());
    on(root, '[data-action="stop-record"]', 'click', () => void stopRecording());
    on(root, '[data-action="pause-record"]', 'click', () => {
      recorder?.pause();
      render();
    });
    on(root, '[data-action="resume-record"]', 'click', () => {
      recorder?.resume();
      render();
    });
  };

  const bindSettings = () => {
    on(root, '[data-action="save-key"]', 'click', async () => {
      const value = root.querySelector<HTMLInputElement>('#apiKey')?.value.trim() || '';
      await saveSettings({ apiKey: value });
      flash(value ? 'Key saved on this device.' : 'Key cleared.');
    });

    on(root, '[data-action="test-key"]', 'click', async () => {
      const value = root.querySelector<HTMLInputElement>('#apiKey')?.value.trim() || '';
      if (!value && !state.health?.geminiConfigured) return fail('Paste a key first.');
      flash('Checking the key…');
      try {
        // A one-second silent WAV is the cheapest possible real request.
        await api.transcribe({
          apiKey: value,
          model: state.settings.model,
          blob: silentWav(),
          mimeType: 'audio/wav',
          offsetSeconds: 0,
        });
        flash('The key works.');
      } catch (err) {
        fail(err instanceof Error ? err.message : 'The key could not be verified.');
      }
    });

    on(root, '[data-action="save-settings"]', 'click', async () => {
      const value = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`);
      await saveSettings({
        model: value<HTMLSelectElement>('model')?.value || state.settings.model,
        profileName: value<HTMLInputElement>('profileName')?.value.trim() || '',
        profileRole: value<HTMLInputElement>('profileRole')?.value.trim() || '',
        assumeNoJapanese: value<HTMLInputElement>('assumeNoJapanese')?.checked ?? true,
        chunkSeconds: Number(value<HTMLSelectElement>('chunkSeconds')?.value) || 300,
        retentionDays: Number(value<HTMLSelectElement>('retentionDays')?.value ?? 7),
      });
      flash('Settings saved.');
    });

    on(root, '[data-action="delete-all"]', 'click', async () => {
      if (!confirm('Delete every recording, transcript and summary on this device?')) return;
      for (const session of state.sessions) await db.deleteSession(session.id);
      await refresh();
      flash('Everything deleted.');
    });

    void showStorage();
  };

  const showStorage = async () => {
    const line = root.querySelector('#storageLine');
    if (!line) return;
    const estimate = await db.storageEstimate();
    line.textContent = estimate
      ? `${bytes(estimate.usage)} used of about ${bytes(estimate.quota)} available.`
      : 'This browser does not report storage usage.';
  };

  /* --------------------------------------------------------------- flows */

  const startImport = async (file: File) => {
    state.error = '';
    try {
      const id = await pipeline.importFile(file, state.settings, onProgress);
      await refresh();
      await openSession(id);
      await run(id);
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    }
  };

  const run = async (sessionId: string) => {
    if (pipeline.activeSessionId()) return fail('Something else is already being processed.');
    if (!state.settings.apiKey && !state.health?.geminiConfigured) {
      go('settings');
      return fail('Add your Gemini API key first.');
    }

    try {
      await pipeline.runSession(sessionId, state.settings, onProgress);
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
    } finally {
      state.progress = null;
      await refresh();
      if (state.sessionId) await loadSessionDetail(state.sessionId);
      render();
    }
  };

  const onProgress = (progress: pipeline.Progress) => {
    state.progress = progress.phase === 'done' ? null : progress;
    // Re-render just the bar while a long run is going, rather than the page.
    const bar = root.querySelector('.progress-bar');
    if (bar && state.progress) {
      bar.outerHTML = renderProgress(state.progress);
      on(root, '[data-action="pause-run"]', 'click', () => pipeline.cancelRun());
      return;
    }
    render();
  };

  const startRecording = async () => {
    try {
      liveSessionId = await pipeline.startLiveSession(state.settings);

      recorder = new LiveRecorder(
        {
          onSegment: async (segment) => {
            if (!liveSessionId) return;
            try {
              await pipeline.appendLiveSegment(liveSessionId, segment);
            } catch (err) {
              // Losing a segment must not stop the recording that is still running.
              console.error('[app] could not store segment', err);
            }
          },
          onLevel: (rms) => {
            state.level = Math.min(1, rms * 6);
            const ring = root.querySelector<HTMLElement>('.level-ring');
            if (ring) ring.style.setProperty('--level', state.level.toFixed(3));
          },
          onStateChange: (recorderState, detail) => {
            state.recorderState = recorderState;
            state.recorderDetail = detail || '';
            render();
          },
        },
        state.settings.chunkSeconds
      );

      await recorder.start();
      recorderTimer = setInterval(() => {
        state.recorderElapsed = recorder?.elapsedSeconds || 0;
        const timer = root.querySelector('.timer');
        if (timer) timer.textContent = clock(state.recorderElapsed);
      }, 1000);
      await refresh();
    } catch (err) {
      fail(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone access was refused. Allow it in your browser settings and try again.'
          : `Could not start recording: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  const stopRecording = async () => {
    if (!recorder || !liveSessionId) return;
    const sessionId = liveSessionId;

    if (recorderTimer) clearInterval(recorderTimer);
    recorderTimer = null;

    await recorder.stop();
    recorder = null;
    liveSessionId = null;
    state.recorderElapsed = 0;

    await refresh();
    await openSession(sessionId);
    await run(sessionId);
  };

  const openSession = async (id: string) => {
    state.sessionId = id;
    state.route = 'session';
    state.tab = 'overview';
    await loadSessionDetail(id);
    render();
  };

  const loadSessionDetail = async (id: string) => {
    const [chunks, segments] = await Promise.all([db.listChunks(id), db.listSegments(id)]);
    sessionCache = { chunks, segments };
  };

  const removeSession = async (id: string) => {
    if (!confirm('Delete this recording and everything derived from it?')) return;
    await db.deleteSession(id);
    if (state.sessionId === id) {
      state.sessionId = null;
      state.route = 'home';
    }
    await refresh();
  };

  /* ---------------------------------------------------------------- utils */

  const go = (route: Route) => {
    state.route = route;
    state.error = '';
    render();
  };

  const fail = (message: string) => {
    state.error = message;
    render();
  };

  const flash = (message: string) => {
    state.notice = message;
    render();
    setTimeout(() => {
      if (state.notice !== message) return;
      state.notice = '';
      render();
    }, 3000);
  };

  const saveSettings = async (patch: Partial<Settings>) => {
    state.settings = { ...state.settings, ...patch };
    await db.saveSettings(state.settings);
    render();
  };

  const refresh = async () => {
    state.sessions = await db.listSessions();
    render();
  };

  /* ----------------------------------------------------------------- init */

  const init = async () => {
    state.settings = await db.loadSettings();
    render();

    // Retention runs before anything else, so old meetings never linger.
    await db.pruneOldSessions(state.settings.retentionDays);
    state.sessions = await db.listSessions();

    try {
      state.health = await api.health();
    } catch {
      state.health = null;
    }
    render();

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/voice-ai/sw.js', { scope: '/voice-ai/' }).catch(() => {});
    }

    // Warn rather than lose work if a run is in flight when the tab closes.
    window.addEventListener('beforeunload', (event) => {
      if (!pipeline.activeSessionId() && !recorder) return;
      event.preventDefault();
      event.returnValue = '';
    });
  };

  void init();
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'recording';

/** One second of digital silence — the smallest valid request for a key test. */
function silentWav(): Blob {
  const sampleRate = 8000;
  const body = new Uint8Array(new ArrayBuffer(sampleRate * 2));
  return new Blob([wavHeader({ channels: 1, sampleRate, bitsPerSample: 16 }, body.length), body], {
    type: 'audio/wav',
  });
}
