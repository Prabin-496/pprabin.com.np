# Voice AI — Personal Transcriber & Summariser

Turns a long workplace recording into a transcript, an English translation, a
summary, a read on what people actually meant, and a Japanese glossary.

Built for one specific problem: following meetings held in Japanese, mixed with
English technical terms and the occasional Nepali, over a full workday.

Live at [`/voice-ai/`](https://pprabin.com.np/voice-ai/) — linked from **Tools →
Voice AI Transcriber** in the site footer.

---

## Setup — one step

Open the app, go to **Settings**, and paste a Gemini API key from
[aistudio.google.com/apikey](https://aistudio.google.com/apikey). Free, no card.

The key is stored in IndexedDB on your own device and sent with each request. It
is never written to the server. Setting `GEMINI_API_KEY` in Vercel also works and
takes precedence, but then anyone who can reach the deployment can spend your
quota, so the in-app key is the better default for a personal tool.

Nothing else needs configuring. There is no database to provision.

---

## Recording eight hours

**iOS cannot record in the background.** The moment Safari is backgrounded or the
screen locks, iOS ends the microphone track and suspends the AudioContext. This
applies to installed PWAs too. It is a platform privacy restriction, not
something this app can work around.

So for a full day:

1. Record with the iPhone's own **Voice Memos** app. It runs in your pocket with
   the screen locked, for as long as you like, free.
2. Open this app → **Import a recording** → pick the memo.
3. Leave the tab open while it processes. Closing it is safe — progress is on
   disk, and reopening the session continues from the chunk it reached.

Keep Voice Memos on **Compressed** (Settings → Voice Memos → Audio Quality).
Lossless produces ALAC, which has to be decoded in full and will not fit in
memory for a long recording.

**Record now** is for a meeting where the phone can stay awake and open. It holds
a screen wake lock and resumes automatically after an interruption, marking the
gap — but it will not survive a screen lock.

Your phone shows a recording indicator whenever the microphone is live, and that
cannot be turned off from a web page. Recording colleagues is also governed by
your employer's policy — worth checking before this becomes a daily habit.

---

## How it works

```
Voice Memos .m4a  ─┐
                   ├─► split (browser, no decoding) ─► IndexedDB queue
Live recording   ─┘         │
                            ▼
              /api/voice?path=transcribe   one call per ~5 min chunk
                            ▼
              /api/voice?path=digest       one call per ~40 min
                            ▼
              /api/voice?path=analyze      one call per session
                            ▼
              IndexedDB: transcript, summary, speaker read, glossary
```

**Splitting without decoding.** Eight hours of mono 16 kHz float32 is ~1.8 GB;
iOS would kill the tab long before that. A `.m4a` is AAC frames inside an MP4
container, so `src/split/` reads the sample table, lifts the frames out by byte
range, and re-frames them as ADTS — a format Gemini accepts. Memory stays flat
regardless of length, and planning a 2-hour file takes ~100 ms.

**Skipping silence.** Before transcribing, a few seconds are decoded out of each
chunk to measure its level in dBFS. The cutoff is derived from the recording's
own loudest parts rather than a fixed number. On a workday this is what keeps
the job inside the free tier — most of an eight-hour recording is an empty room.

**Three passes, not one.** An eight-hour transcript is far too much for a single
summarisation call, and Vercel functions stop at 60 seconds. Transcribing per
chunk, digesting every eight chunks, then analysing the digests keeps every
request small and every failure cheap.

**Local-first.** Sessions, transcripts and analyses live in IndexedDB on the
device. The server is a stateless proxy that never stores audio or text. Source
audio is deleted as soon as a session finishes; whole sessions are pruned after
the retention window (7 days by default).

---

## Rate limits

The Gemini free tier allows roughly 10 requests per minute and a few hundred per
day. The pipeline paces itself at one request every 7 seconds and backs off on
429s, so it stays under the limit rather than recovering from it.

A typical workday: 96 chunks planned, most skipped as silence, ~30 transcribed,
4 digests, 1 analysis — comfortably inside the daily allowance. If you do hit it,
switch the model to `gemini-2.5-flash-lite` in Settings, or raise the chunk
length to 10 minutes.

---

## Development

```bash
npm run dev:voice-ai        # UI on http://localhost:5175
vercel dev                  # API on http://localhost:3000
```

Point the UI at a deployed API instead by setting `VITE_VOICE_AI_API_URL` in
`frontend/.env.local`. Left empty it uses the same origin, which is what
production wants.

### Checks

```bash
npm run check:voice-ai                                    # types only
node scripts/check-split.mjs recording.m4a               # the splitter, for real
```

`check-split.mjs` is the one that matters. The splitter re-frames AAC by byte
offset, so a mistake there shows up as silently empty transcripts rather than a
crash. It runs real files through `planSplit()` and uses ffmpeg to prove every
chunk decodes, the durations line up, and no audio was lost. It shims
`AudioContext` with ffmpeg so the silence detection is exercised too.

Generate a fixture that alternates speech and silence:

```bash
ffmpeg -f lavfi -i "anoisesrc=d=7200:c=pink:a=0.35:r=44100,\
volume='if(lt(mod(t,600),300),1,0.0004)':eval=frame" \
  -ac 1 -c:a aac -q:a 0.4 workday.m4a
```

Expect 24 chunks with 12 skipped as silence.

---

## Layout

| Path | What it is |
|---|---|
| `frontend/src/split/` | MP4 reader, ADTS writer, WAV slicing, level measurement |
| `frontend/src/pipeline.ts` | Transcribe → digest → analyse, resumable |
| `frontend/src/db.ts` | IndexedDB stores and retention |
| `frontend/src/recorder.ts` | Live recording, audio-clock segment rotation |
| `frontend/src/session-view.ts` | Rendering for a finished session |
| `frontend/public/segment-clock.js` | AudioWorklet: sample clock + level meter |
| `../../api/voice.js` | The stateless API (a Vercel function) |
| `../../api/_lib/gemini.js` | Gemini calls and prompts |
