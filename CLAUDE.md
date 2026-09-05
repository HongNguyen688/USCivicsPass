# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## The four things that will bite you

Read these before touching anything; the rest of this file is detail.

1. **Spoken text is pre-rendered to audio files.** Change a question's wording and its
   recording silently stops matching — the app falls back to robot TTS with no error.
   Re-run `npm run audio`. See [Pre-rendered audio](#pre-rendered-audio-how-the-app-sounds-human).
2. **A web deploy is an iOS release.** The native shell loads `https://passuscivics.com`
   live, so a bad Netlify deploy breaks installed apps immediately, with no review step.
   See [Live remote URL](#live-remote-url-how-native-stays-in-sync-with-the-web-app).
3. **Translations are keyed by the English question string**, not an id. Reword a question
   and its subtitles vanish silently. Update `translations.js` in the same commit.
4. **`npm run lint` and `npm run test` are both near-useless as signals.** Lint reports ~815
   errors of which 6 are real; the test suite is 2 smoke tests. Verify in the browser.

## Commands

```bash
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # Run ESLint (see caveat below — mostly false positives)
npm run test       # Run Vitest in watch mode
npm run test -- --run  # Run tests once (CI mode)

# Run a single test file, or a single test by name:
npm run test -- --run src/App.test.jsx
npm run test -- --run -t "renders the main application title"

# Capture the screenshots/ set with Playwright (needs `npm run dev` already running)
node take-screenshots.mjs
```

### `npm run lint` is noisy by construction

It reports ~815 errors, but **only 6 come from real source files**. As of this writing they are:
one `react-hooks` set-state-in-effect error in `App.jsx`, four unused-setter `no-unused-vars`
in `PracticeQuiz.jsx` / `WritingPractice.jsx`, and `'process' is not defined` in `vite.config.js`
— that last one a false positive, since Vite evaluates that file in Node.

The rest is generated code. `eslint.config.js` sets `globalIgnores(['dist'])` and nothing else,
so ESLint also walks the bundled, minified copies Capacitor writes into `ios/` and `android/`
(`ios/App/App/public/assets/`, `android/app/build/intermediates/`, `ios/build/`, …).

Don't read the raw total as a code-health signal, and don't try to fix errors in `ios/` or
`android/`. To see only real findings:

```bash
# Note the repo name in the pattern — plain "src" also matches android/app/src/main/
npm run lint 2>&1 | grep -E "USCivicsPass/(src|vite\.config)" -A 2
```

Adding `ios`, `android`, and `.netlify` to `globalIgnores` would fix this properly.

## Architecture

A **React 19 + Vite** single-page app for U.S. citizenship test prep. No backend, no router,
no state library — all content is static JSON under `src/data/`, and all state lives in one
component.

### `App.jsx` is the whole application

`src/App.jsx` is ~1,264 lines and owns every piece of global state. Modules are near-stateless
consumers that receive state plus callbacks as explicit props. It is organized into numbered
sections — use these to navigate rather than scrolling:

| Section | Line | Holds |
|---|---|---|
| Data imports | 36 | All `src/data/*.json`, plus `translations.js` |
| Module imports | 57 | The 10 screens; `WorkbookViewer` is `React.lazy` at line 72 |
| Voice selection | 78 | Synthesizer voice preference (fallback path only) |
| 1 — Global state | 217 | `view`, `testVersion`, `currentQuestionIndex`, `showAnswer` |
| 2 — Module state | 233 | `quizState`, `vocabState`, `n400Category` |
| 3 — Settings state | 277 | `audioSpeed`, `isRandom`, `selectedLanguage`, `studyOrder` |
| 4 — Reading & writing | 338 | `readingIndex`, `writingIndex`, their order arrays |
| 5 — Derived data | 366 | `questionsData`, `totalQuestions`, `n400Data` |
| 6 — Navigation | 383 | `goToHome()`, `goToQuestions()`, `goToFlashcards()`, … |
| 7 — Side effects | 461 | 8 `useEffect`s: shuffling, speech cancel, voice loading |
| 8 — Helper functions | 627 | `speakText`, `speakDialogue`, `generateOptions`, `startQuiz` |
| 9 — Render | 1063 | The screen conditionals |

Key state:

- `view` — which screen renders: `selection`, `home`, `questions`, `flashcards`, `quiz`,
  `reading`, `writing`, `vocabulary`, `n400`, `workbook`
- `testVersion` — `'100'` (2008 USCIS) or `'128'` (2020). Section 5 derives `questionsData`
  from it with a ternary; `startQuiz()` reads it again to pick a 10- or 20-question pool
- `selectedLanguage` — `'none'`, `es`, `vi`, `ko`, or `zh`; drives subtitles
- `audioSpeed` — defaults to `0.85`, which the UI labels "Normal" (this matters for playback,
  see the audio section)

### Rendering is JSX conditionals, not a switch

There is no `switch (view)` and no router. Section 9 is a flat run of guarded blocks:

```jsx
{view === 'questions' && studyOrder.length > 0 && (
  <CivicsStudy totalQuestions={…} goToHome={…} speakText={…} … />
)}
```

Adding a screen means adding another such block, a `goToX` handler in section 6, and threading
its props by hand. Props are listed explicitly and individually — `CivicsStudy` takes 16. That
is the convention; **do not introduce Context or Redux** to shorten it without being asked.

`WorkbookViewer` is the one lazy-loaded module (`React.lazy` + `React.Suspense`), because it
pulls in `pdfjs-dist` (~1MB). It renders the PDF page-by-page onto `<canvas>` elements rather
than an `<iframe>` — Android's WebView has no built-in PDF viewer — with per-page rendering
driven by `IntersectionObserver`.

### Components vs modules

`src/components/` holds shared UI primitives (`Header`, `Footer`, `DashboardCard`,
`SelectionCard`). `src/modules/` holds the 10 full-screen views (`CivicsStudy`, `Dashboard`,
`Flashcards`, `N400Prep`, `PracticeQuiz`, `ReadingPractice`, `SelectionScreen`,
`VocabularyModule`, `WorkbookViewer`, `WritingPractice`).

Quiz, vocabulary, reading and writing state lives in `App.jsx`, not in the modules. Only purely
ephemeral UI state (card flip animation, say) belongs local to a module.

### Common patterns

**Module state object** — when a module needs several related fields, `App.jsx` uses one
`useState` object rather than several, e.g. `vocabState` ([App.jsx:251](src/App.jsx#L251)):

```js
const [vocabState, setVocabState] = useState({
  currentIndex: 0, score: 0, complete: false, questions: [],
  showFeedback: false, selectedOption: null, currentOptions: [],
  history: [], mode: 'learn',
});
// updating one field from a module:
setVocabState((prev) => ({ ...prev, showFeedback: true }));
```

**Order arrays for shuffling** — `studyOrder` etc. hold an index permutation rather than a
reordered copy of the data, so toggling random/sequential doesn't touch the underlying JSON
(`goToQuestions()`, [App.jsx:402](src/App.jsx#L402)):

```js
const order = Array.from({ length: totalQuestions }, (_, i) => i);
if (isRandom) order.sort(() => Math.random() - 0.5);
setStudyOrder(order);
```

This shuffle is a biased approximation (not Fisher-Yates), reused as-is across every module —
fine at the scale here (≤128 items), not something to fix in one call site without doing all of
them.

**Refs for values read inside async callbacks** — `speakText`/`speakSynthesized` fire after a
`TextToSpeech`/`speechSynthesis` promise resolves, by which point a `useState` closure could be
stale. `audioSpeed` is mirrored into a ref for exactly this reason ([App.jsx:289](src/App.jsx#L289),
kept in sync at [516](src/App.jsx#L516), read at [640](src/App.jsx#L640) and elsewhere):

```js
const audioSpeedRef = useRef(0.85);
useEffect(() => { audioSpeedRef.current = audioSpeed; }, [audioSpeed]);
// later, inside an async speech callback:
utterance.rate = audioSpeedRef.current;
```

**Adding a screen**: add a `view === 'x' && (<MyModule ... />)` block in section 9, a `goToX()`
handler in section 6, and thread any new state through by explicit props (see "Rendering is JSX
conditionals" above) — there's no switch and no registry to update.

**Adding data** (questions, sentences, vocabulary): drop the JSON in `src/data/`, import it at
the top of `App.jsx`, pass it down as a prop. If it's ever spoken, also add it to
`collectAppSpeech()` — see [Pre-rendered audio](#pre-rendered-audio-how-the-app-sounds-human).

### Content data

- `questions.json` / `questions128.json` — civics Q&A for the 100-Q (2008) and 128-Q (2020) sets
- `readingSentences.json` / `writingSentences.json` — USCIS reading/writing sentences
- `citizenshipVocabulary.json` — word + meaning pairs
- `n400Questions.json` — N-400 prep questions, categorized (Vocabulary, Character, …); section 5
  filters these by `n400Category`
- `mockInterview.json` / `interviewTips.json` — script and tips for `N400Prep`
- `interviewAudio.json` / `speechAudio.json` — **generated, do not hand-edit**
- `translations.js` — keyed by the **English question string**, each holding `{ es, vi, ko, zh }`
  → `{ q, a }`

### Helper functions (section 8, passed down as props)

- `speakText(text)` — plays the pre-rendered recording where one exists, else falls back to
  `speakSynthesized`, which dispatches on `Capacitor.isNativePlatform()` to either the
  `TextToSpeech` plugin or `window.speechSynthesis`. Cancelled automatically on question/view
  change; that effect pauses the `<audio>` elements as well as stopping the synthesizer
- `speakDialogue(section, …)` — the same, per turn, for the mock interview
- `generateOptions(correctAnswer, dataPool)` — 3 options (1 correct + 2 distractors)
- `generateDefinitionOptions(correctMeaning, pool)` — same idea, 4 options, for vocabulary
- `formatSmartAnswer(answerStr, question)` — parses answer-count hints out of question text;
  **imported from `src/utils/`**, not defined here, because the audio generator needs it too
- `startQuiz()` — builds a random pool: 10 questions for the 100-Q version, 20 for the 128-Q

### Styling

All styling is `src/index.css` (~2,870 lines). CSS custom properties are at the top: `--primary`,
`--accent`, `--bg`, `--card-bg`, `--radius`, `--font-main` / `--font-heading`. Glassmorphism is a
`.glass` utility class (`backdrop-filter: blur(10px)`), not a token. Inter and Outfit load from
Google Fonts via an `@import` at line 1.

Note `index.css` is imported twice, from both `main.jsx` and `App.jsx`. Harmless, but don't take
it as a pattern. **`src/App.css` is dead** — see Misleading leftovers.

### Testing

Vitest + React Testing Library on jsdom. There is **no `vitest.config.js`** — the config is the
`test:` block inside `vite.config.js`, which also wires `setupFiles`.

`src/setupTests.js` mocks `window.speechSynthesis` and `SpeechSynthesisUtterance`; any test
rendering a speech-using component depends on that mock.

**Coverage is essentially nil.** `src/App.test.jsx` is the only test file, with 2 smoke tests
(title renders, selection screen renders first). No module has any test. A green run says almost
nothing — verify changes in the browser. jsdom also logs `Not implemented: Window's scrollTo()`
every run, from the view-change effect in `App.jsx`; that is noise, not a failure.

## Pre-rendered audio (how the app sounds human)

Everything the app speaks is a **pre-rendered neural-voice recording**. The device synthesizer is
only the fallback. This is the single reason the app doesn't sound like a machine: on a device
with no Enhanced/Premium voice downloaded, the OS offers only its "compact" formant-synthesis
tier, and no amount of voice-picking in the app improves on voices that aren't installed.

All spoken content is fixed, so it is rendered once, offline, and shipped:

```bash
npm run audio                      # render only what changed
npm run audio -- --force           # re-render everything
npm run audio -- --plan-only       # count the work, render nothing
npm run audio -- --only=speech     # or --only=interview
```

`scripts/generate-audio.mjs` uses **kokoro-js**, an 82M-parameter neural TTS that runs locally —
no API key, no per-play cost — and encodes to AAC with macOS's `afconvert` (so no ffmpeg
dependency). Two sets come out:

| Set | Voice(s) | Files | Manifest |
|---|---|---|---|
| `public/audio/speech/` | `af_heart` (female) | ~1,700, one per unique string | `src/data/speechAudio.json`, keyed by **the exact text spoken** |
| `public/audio/interview/` | `am_michael` officer, `af_heart` applicant | 55, one per turn | `src/data/interviewAudio.json`, keyed by section id → turn index |

Total ~39MB. The first run downloads the model (~330MB at fp32) to the Hugging Face cache;
`KOKORO_DTYPE=q8` pulls ~86MB instead — faster, lower quality.

### Rules that keep audio and text in step

- **Editing any spoken data file means re-running `npm run audio`.** Files are named after a hash
  of the text and voice, so reworded text simply has no recording and falls back to live TTS.
  Stale files are pruned on the next run.
- **Adding a `speakText` call site with new text?** Add that text to `collectAppSpeech()` in the
  generator, or it will only ever be synthesized. That function walks `questions.json`,
  `questions128.json`, `n400Questions.json`, `citizenshipVocabulary.json` (word, meaning, and the
  `What does X mean?` prompt), and the reading/writing sentences — including the
  `formatSmartAnswer` variant that Flashcards actually reads aloud.
- `src/utils/parseDialogue.js` and `src/utils/formatSmartAnswer.js` are imported by **both**
  `App.jsx` and the generator, deliberately: the generator must produce a recording of the exact
  string the app will speak, and interview recordings are addressed by turn index. Don't fork them.
- Manifests are written *before* rendering, so a half-finished run still builds and runs — missing
  files just fall back to synthesis.

### How playback works in `App.jsx`

`speakText(text)` looks the text up in the speech manifest and plays the file through a reused
`<audio>` element, falling back to `speakSynthesized` when there is no recording, the file 404s,
or autoplay is blocked.

The manifest is ~100KB, so it is pulled in with a **module-scope `import()`** at the top of
`App.jsx` — not a static import (which would put it in the main bundle) and not a `useEffect`
(which would work, but a dynamic `import()` inside the component makes React's compiler-based
lint rules bail out on the entire file, silently switching off every check in it — verified).
Until it resolves, `speechManifest` is null and everything is spoken live. `speakDialogue` does
the same per turn against `interviewAudio`, and refuses a whole section's recordings if its file
count no longer matches the parsed turn count.

Elements are **reused, not recreated**: iOS unlocks the specific element a user gesture touched,
so a fresh `new Audio()` per line would be blocked. Because the speed control is a
speech-synthesis rate where `0.85` means "Normal", recorded playback uses
`playbackRate = audioSpeed / 0.85` with `preservesPitch`.

## Mobile builds (iOS & Android)

Wrapped with **Capacitor**. The web build (`dist/`) is copied into the native projects on sync.

```bash
npm run build          # rebuild web assets
npx cap sync           # copy dist/ → ios/ and android/, update plugins
npx cap open ios       # open Xcode (requires macOS + Xcode)
npx cap open android   # open Android Studio (requires JDK + Android Studio)
```

### Live remote URL (how native stays in sync with the web app)

`capacitor.config.ts` sets `server.url` to `https://passuscivics.com`, so the native shell loads
the **live deployed web app** rather than the bundled copy in `dist/`. Anything deployed to
Netlify appears in already-installed apps on next launch — no rebuild, no App Store release.
There is by construction no separate "iOS design": both surfaces render the same deployed CSS.

- **The app requires an internet connection.** With no network the WebView has nothing to load.
  Anything that must work offline has to move to a bundled build.
- **Web deploys are app releases.** A broken deploy breaks the installed app immediately.
- `limitsNavigationsToAppBoundDomains: false` is required for iOS to navigate to a non-bundled
  origin.

To build a self-contained, offline-capable app instead, `CAP_LOCAL=1` drops the `server` block so
Capacitor falls back to the bundled `dist/`:

```bash
CAP_LOCAL=1 npm run build && CAP_LOCAL=1 npx cap sync ios
```

### Icons and splash screens

Edit `resources/icon.svg`, then `node scripts/generate-icons.mjs`. That converts the SVG to
`resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732), then runs
`@capacitor/assets generate` for every required iOS and Android size.

### Key files and patches

- `capacitor.config.ts` — appId (`com.uscivicspass.app`), appName, webDir, `server.url`
- `vite.config.js` — computes `base` from env: `VITE_BASE_PATH` if set, else `'./'` when
  `CAPACITOR` is set (so native builds load assets from `file://`), else `'/'` for web
- `ios/`, `android/` — generated projects; don't hand-edit
- `patches/@capacitor-community+text-to-speech+8.0.1.patch` applies automatically via the
  `postinstall` script (`patch-package`). To change it further, edit the copy in `node_modules/`,
  then `npx patch-package @capacitor-community/text-to-speech`

## Companion print workbook

`book/` holds the print-on-demand workbook. Regenerate the manuscript from the live data with:

```bash
python3 scripts/generate_manuscript.py   # requires: pip3 install python-docx
# writes book/PassUSCivics-Workbook-Manuscript.docx (not committed — generated on demand)
```

The PDF is exported from that manuscript by hand and lands in `book/` under whatever name the
export used (currently `Final USCivicsPass Workbook 01092026.pdf`). **Nothing in the app reads
`book/`** — the only copy the app serves is `public/PassUSCivics-Workbook.pdf`, at that exact
filename. Publishing a new workbook means copying the `book/` export over it; skip that and the
in-app viewer keeps showing the old one.

`WorkbookViewer` fetches the absolute path `/PassUSCivics-Workbook.pdf`
([WorkbookViewer.jsx:36](src/modules/WorkbookViewer.jsx#L36)) — correct for the web deploy and for
the live-URL native shell, but it would not resolve under a `file://` `CAP_LOCAL=1` bundle.

## Deployment

Netlify (`netlify.toml`): build `npm run build`, publish `dist`, with a catch-all SPA redirect to
`index.html`.

## Misleading leftovers

Things that look load-bearing but aren't — don't build on them:

- **`src/App.css`** (184 lines) is imported by nothing. `main.jsx` and `App.jsx` both import
  `index.css` instead. Editing `App.css` has no effect.
- **`google-translate-api-x`** (devDependency) has zero references in `src/`, `scripts/`, or the
  root `.mjs` scripts.
- **`kokoro-js`** sits in `dependencies`, but it is *build-time only*: it renders both audio sets
  in `scripts/generate-audio.mjs` and is never imported by `src/`, so nothing ships it to the
  browser.
- **There is no `src/hooks/`** and no custom hooks anywhere. Shared logic lives as functions in
  `App.jsx`, threaded down as props. `src/utils/` is the one exception and is not the start of a
  utils layer — it exists solely so the app and the audio generator share `parseDialogue` and
  `formatSmartAnswer` and cannot drift apart.
- **`dist/`, `ios/App/App/public/`, and `android/app/src/main/assets/public/`** are built copies.
  Editing them does nothing; they're regenerated by `npm run build` + `npx cap sync`.

## Related docs

`README.md` is user-facing (feature list, install steps) and duplicates the dev/test commands.
