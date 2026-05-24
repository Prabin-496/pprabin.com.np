import { api, type Recording } from './api';
import { ChunkedRecorder } from './recorder';
import { cacheRecording, listCached } from './idb';

type Tab = 'record' | 'history' | 'transcript' | 'summary' | 'settings';

export function mountApp(root: HTMLElement): void {
  let activeTab: Tab = 'record';
  let recordings: Recording[] = [];
  let current: Recording | null = null;
  let apiOk = false;
  let geminiOk = false;
  let recordingId: string | null = null;
  let chunksUploaded = 0;
  let processing = false;
  let recorder: ChunkedRecorder | null = null;
  let levelBars: HTMLDivElement[] = [];

  root.innerHTML = `
    <div class="shell">
      <header class="header">
        <div>
          <h1>Voice AI</h1>
          <p class="subtitle">Personal transcriber — Japanese, English, Nepali (auto-detect). Powered by Gemini on your backend. Tap record, flip through results, export anytime.</p>
        </div>
        <div id="apiPill" class="pill">Connecting…</div>
      </header>

      <div class="banner warn">
        <strong>iPhone note:</strong> Safari cannot record indefinitely in the background. Keep the screen on while recording; chunks save every ~45s so you won't lose progress if you pause or stop.
      </div>

      <nav class="tabs" id="tabs"></nav>
      <div id="error" class="banner err hidden"></div>
      <main id="main"></main>
      <p class="footer-note">Isolated module · API key stays on server · Data in <code>voice-ai-data/</code> on your backend host</p>
    </div>
  `;

  const tabsEl = root.querySelector('#tabs') as HTMLElement;
  const mainEl = root.querySelector('#main') as HTMLElement;
  const errorEl = root.querySelector('#error') as HTMLElement;
  const apiPill = root.querySelector('#apiPill') as HTMLElement;

  const tabLabels: { id: Tab; label: string }[] = [
    { id: 'record', label: 'Record' },
    { id: 'history', label: 'History' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'summary', label: 'Summary' },
    { id: 'settings', label: 'Settings' },
  ];

  const showError = (msg: string) => {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  };
  const clearError = () => errorEl.classList.add('hidden');

  const renderTabs = () => {
    tabsEl.innerHTML = tabLabels
      .map(
        (t) =>
          `<button type="button" class="tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`
      )
      .join('');
    tabsEl.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = (btn as HTMLElement).dataset.tab as Tab;
        renderTabs();
        renderMain();
      });
    });
  };

  const copyText = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  const exportTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportJson = (filename: string, data: unknown) => {
    exportTxt(filename, JSON.stringify(data, null, 2));
  };

  const loadRecordings = async () => {
    try {
      const { recordings: list } = await api.list();
      recordings = list;
      for (const r of list) await cacheRecording(r);
    } catch {
      recordings = (await listCached()) as Recording[];
    }
  };

  const selectRecording = async (id: string) => {
    try {
      const { recording } = await api.get(id);
      current = recording;
      await cacheRecording(recording);
    } catch (e) {
      showError((e as Error).message);
    }
    renderMain();
  };

  const renderRecord = () => {
    const isRec = recorder?.state === 'recording';
    const isPaused = recorder?.state === 'paused';

    mainEl.innerHTML = `
      <section class="panel">
        <div class="record-row">
          <button type="button" class="record-btn ${isRec ? 'recording' : ''}" id="micBtn" aria-label="Record">🎙</button>
          <div class="waveform" id="waveform"></div>
        </div>
        <div class="btn-row">
          <button type="button" class="btn primary" id="startBtn" ${processing ? 'disabled' : ''}>Record</button>
          <button type="button" class="btn" id="pauseBtn" ${!isRec ? 'disabled' : ''}>Pause</button>
          <button type="button" class="btn" id="resumeBtn" ${!isPaused ? 'disabled' : ''}>Resume</button>
          <button type="button" class="btn danger" id="stopBtn" ${recorder?.state === 'idle' ? 'disabled' : ''}>Stop & Process</button>
        </div>
        <p class="progress" id="progress">Chunks uploaded: ${chunksUploaded}</p>
      </section>
    `;

    const wf = mainEl.querySelector('#waveform') as HTMLElement;
    wf.innerHTML = Array.from({ length: 32 }, () => '<div class="bar"></div>').join('');
    levelBars = Array.from(wf.querySelectorAll('.bar')) as HTMLDivElement[];

    const startSession = async () => {
      clearError();
      processing = true;
      renderRecord();
      try {
        const { recording } = await api.create(`Session ${new Date().toLocaleString()}`);
        recordingId = recording.id;
        current = recording;
        chunksUploaded = 0;
        recorder = new ChunkedRecorder(
          async (blob, index) => {
            if (!recordingId) return;
            try {
              await api.uploadChunk(recordingId, index, blob, recorder?.mimeType || 'audio/webm');
              chunksUploaded++;
              const prog = mainEl.querySelector('#progress');
              if (prog) prog.textContent = `Chunks uploaded: ${chunksUploaded}`;
            } catch (e) {
              showError(`Chunk ${index} failed: ${(e as Error).message}`);
            }
          },
          (levels) => {
            levelBars.forEach((bar, i) => {
              const v = levels[i] ?? 0;
              bar.style.height = `${Math.max(6, v * 80)}px`;
              bar.style.opacity = String(0.3 + v * 0.7);
            });
          }
        );
        await recorder.start();
      } catch (e) {
        showError((e as Error).message);
        recordingId = null;
        recorder = null;
      }
      processing = false;
      renderRecord();
    };

    const stopSession = async () => {
      if (!recorder || !recordingId) return;
      processing = true;
      renderRecord();
      try {
        await recorder.stop();
        recorder = null;
        const { recording } = await api.finalize(recordingId);
        current = recording;
        recordingId = null;
        await loadRecordings();
        activeTab = 'transcript';
        renderTabs();
      } catch (e) {
        showError((e as Error).message);
      }
      processing = false;
      renderTabs();
      renderMain();
    };

    mainEl.querySelector('#startBtn')?.addEventListener('click', startSession);
    mainEl.querySelector('#micBtn')?.addEventListener('click', () => {
      if (recorder?.state === 'idle' || !recorder) startSession();
      else if (recorder.state === 'recording') recorder.pause();
      else if (recorder.state === 'paused') recorder.resume();
      renderRecord();
    });
    mainEl.querySelector('#pauseBtn')?.addEventListener('click', () => {
      recorder?.pause();
      renderRecord();
    });
    mainEl.querySelector('#resumeBtn')?.addEventListener('click', () => {
      recorder?.resume();
      renderRecord();
    });
    mainEl.querySelector('#stopBtn')?.addEventListener('click', stopSession);
  };

  const renderHistory = () => {
    mainEl.innerHTML = `
      <section class="panel">
        <input type="search" class="search" id="searchInput" placeholder="Search transcripts…" />
        <ul class="list" id="histList"></ul>
        <div class="btn-row">
          <button type="button" class="btn danger" id="delBtn" ${current ? '' : 'disabled'}>Delete selected</button>
        </div>
      </section>
    `;
    const list = mainEl.querySelector('#histList') as HTMLElement;
    if (!recordings.length) {
      list.innerHTML = '<li class="muted">No recordings yet</li>';
    } else {
      list.innerHTML = recordings
        .map(
          (r) => `
        <li class="${current?.id === r.id ? 'active' : ''}" data-id="${r.id}">
          <strong>${escapeHtml(r.title)}</strong><br/>
          <small>${r.status} · ${r.detected_language || '—'} · ${new Date(r.created_at).toLocaleString()}</small>
        </li>`
        )
        .join('');
      list.querySelectorAll('li[data-id]').forEach((li) => {
        li.addEventListener('click', () => selectRecording((li as HTMLElement).dataset.id!));
      });
    }
    mainEl.querySelector('#searchInput')?.addEventListener('input', async (e) => {
      const q = (e.target as HTMLInputElement).value.trim();
      if (!q) {
        await loadRecordings();
      } else {
        try {
          const { recordings: found } = await api.search(q);
          recordings = found;
        } catch {
          /* keep local */
        }
      }
      renderHistory();
    });
    mainEl.querySelector('#delBtn')?.addEventListener('click', async () => {
      if (!current) return;
      if (!confirm('Delete this recording permanently?')) return;
      await api.remove(current.id);
      current = null;
      await loadRecordings();
      renderHistory();
    });
  };

  const renderTranscript = () => {
    const r = current;
    mainEl.innerHTML = `
      <div class="cards">
        ${card('Full transcript (original)', r?.raw_transcript, 'raw')}
        ${card('English translation', r?.translated_english, 'en')}
        ${card('Cleaned English', r?.cleaned_english, 'clean')}
      </div>
      <div class="btn-row">
        <button type="button" class="btn" id="copyRaw">Copy original</button>
        <button type="button" class="btn" id="copyEn">Copy English</button>
        <button type="button" class="btn" id="expTxt">Export TXT</button>
        <button type="button" class="btn" id="expJson">Export JSON</button>
      </div>
    `;
    if (!r) {
      mainEl.querySelector('.cards')!.innerHTML =
        '<p class="muted">Select a recording from History or create a new one.</p>';
      return;
    }
    mainEl.querySelector('#copyRaw')?.addEventListener('click', () => copyText(r.raw_transcript || ''));
    mainEl.querySelector('#copyEn')?.addEventListener('click', () => copyText(r.cleaned_english || r.translated_english || ''));
    mainEl.querySelector('#expTxt')?.addEventListener('click', () => {
      exportTxt(`transcript-${r.id}.txt`, [r.raw_transcript, r.translated_english, r.cleaned_english].filter(Boolean).join('\n\n---\n\n'));
    });
    mainEl.querySelector('#expJson')?.addEventListener('click', () => exportJson(`transcript-${r.id}.json`, r));
  };

  const renderSummary = () => {
    const r = current;
    const s = r?.summary;
    mainEl.innerHTML = `
      <div class="cards">
        ${card('Quick summary', s?.summary, 'sum')}
        ${card('Detailed summary', s?.detailed_summary, 'det')}
        ${card('Key points', s?.key_points?.map((p) => `• ${p}`).join('\n'), 'kp')}
        ${card('Action items', s?.action_items?.map((p) => `• ${p}`).join('\n'), 'ai')}
        ${card('Important terms', s?.important_terms?.join(', '), 'terms')}
        ${card('Follow-up questions', s?.follow_up_questions?.map((p) => `• ${p}`).join('\n'), 'fq')}
        ${card('Meeting notes', s?.meeting_notes, 'notes')}
      </div>
      <div class="btn-row">
        <button type="button" class="btn" id="expSum">Export summary JSON</button>
      </div>
    `;
    if (!s) {
      mainEl.querySelector('.cards')!.insertAdjacentHTML(
        'afterbegin',
        '<p class="muted">Process a recording first to generate summaries.</p>'
      );
    }
    mainEl.querySelector('#expSum')?.addEventListener('click', () => {
      if (s) exportJson(`summary-${r?.id}.json`, s);
    });
  };

  const renderSettings = () => {
    mainEl.innerHTML = `
      <section class="panel">
        <h3 style="margin-top:0">Settings</h3>
        <p class="muted">API: <code id="apiUrl"></code></p>
        <p class="muted">Gemini configured: <strong id="geminiStatus"></strong></p>
        <p class="muted">Chunk interval: ~45 seconds (auto-save)</p>
        <p class="muted">Languages: Japanese, English, Nepali — automatic detection</p>
        <h4>Install as app (PWA)</h4>
        <p class="muted">On iPhone: Share → Add to Home Screen. On desktop: install icon in address bar.</p>
        <button type="button" class="btn" id="regSw">Enable offline shell</button>
      </section>
    `;
    const apiUrl = import.meta.env.VITE_VOICE_AI_API_URL || '(same origin / dev proxy)';
    (mainEl.querySelector('#apiUrl') as HTMLElement).textContent = apiUrl;
    (mainEl.querySelector('#geminiStatus') as HTMLElement).textContent = geminiOk ? 'Yes' : 'No — set GEMINI_API_KEY';
    mainEl.querySelector('#regSw')?.addEventListener('click', async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/voice-ai/sw.js', { scope: '/voice-ai/' });
        alert('Service worker registered for /voice-ai/');
      }
    });
  };

  const renderMain = () => {
    if (activeTab === 'record') renderRecord();
    else if (activeTab === 'history') renderHistory();
    else if (activeTab === 'transcript') renderTranscript();
    else if (activeTab === 'summary') renderSummary();
    else renderSettings();
  };

  const init = async () => {
    renderTabs();
    try {
      const h = await api.health();
      apiOk = h.ok;
      geminiOk = h.geminiConfigured;
      apiPill.textContent = apiOk ? (geminiOk ? 'API ready' : 'API up · no Gemini key') : 'API offline';
      apiPill.className = `pill ${apiOk && geminiOk ? 'ok' : 'err'}`;
    } catch {
      apiPill.textContent = 'API offline';
      apiPill.className = 'pill err';
    }
    await loadRecordings();
    renderMain();
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/voice-ai/sw.js', { scope: '/voice-ai/' }).catch(() => {});
    }
  };

  init();
}

function card(title: string, body?: string | null, id?: string): string {
  const content = body?.trim() || '—';
  return `
    <article class="card">
      <div class="card-head">
        <h3 class="card-title">${escapeHtml(title)}</h3>
      </div>
      <div class="card-body ${content === '—' ? 'muted' : ''}" id="${id || ''}">${escapeHtml(content)}</div>
    </article>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
