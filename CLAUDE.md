# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

It reports ~815 errors, but **only about 8 come from real source files**. `eslint.config.js` sets `globalIgnores(['dist'])` and nothing else, so ESLint also walks the bundled, minified copies of the app that Capacitor writes into `ios/` and `android/` (`ios/App/App/public/assets/`, `android/app/build/intermediates/`, `ios/build/`, …). Those generated bundles produce the entire rest of the count.

Don't read the raw total as a code-health signal, and don't try to fix errors in `ios/` or `android/`. To see only real findings:

```bash
# Note the repo name in the pattern — plain "src" also matches android/app/src/main/
npm run lint 2>&1 | grep -E "USCivicsPass/(src|vite\.config)" -A 2
```

Adding `ios`, `android`, and `.netlify` to `globalIgnores` would fix this properly.

## Architecture

This is a **React 19 + Vite** single-page application — a U.S. citizenship test prep tool. There is no backend; all content lives in static JSON files under `src/data/`.

### State & Navigation

`App.jsx` is the single source of truth. It owns all global state and passes props + callbacks down to every module:

- `view` — controls which screen is rendered (selection, home, questions, flashcards, quiz, reading, writing, vocabulary, n400, workbook)
- `testVersion` — `'100'` (2008 USCIS version) or `'128'` (2020 version); determines which questions JSON is loaded
- `selectedLanguage` — drives subtitle display via `src/data/translations.js` (Spanish `es`, Vietnamese `vi`, Korean `ko`, Chinese `zh`)
- `audioSpeed` — controls playback rate for both Web Speech API (browser) and Capacitor TextToSpeech (native)

Navigation is purely state-driven: modules call handlers like `goToHome()` / `goToSelection()` passed from App — there is no router library.

### Components vs Modules

`src/components/` holds shared UI primitives (`Header`, `Footer`, `DashboardCard`, `SelectionCard`) used across views. `src/modules/` holds full-screen view components (`CivicsStudy`, `Flashcards`, `PracticeQuiz`, `ReadingPractice`, `WritingPractice`, `VocabularyModule`, `N400Prep`, `Dashboard`, `SelectionScreen`, `WorkbookViewer`).

`WorkbookViewer` (view `'workbook'`) is `React.lazy`-loaded from `App.jsx` since it pulls in `pdfjs-dist` (~1MB) — only fetched when the user opens it. It renders `public/PassUSCivics-Workbook.pdf` page-by-page onto `<canvas>` elements (not an `<iframe>`, since Android's WebView has no built-in PDF viewer) with lazy per-page rendering via `IntersectionObserver`.

Much of the quiz, vocabulary, reading, and writing state actually lives in `App.jsx` (e.g. `quizState`, `vocabState`, `currentQuestionIndex`, `readingIndex`, `writingIndex`) and is passed down as props alongside callbacks. Purely ephemeral UI state (e.g. card flip animation) lives locally in the module.

### Content Data

All question/sentence content is in `src/data/`:

- `questions.json` / `questions128.json` — civics Q&A for the 100-Q (2008) and 128-Q (2020) test sets
- `readingSentences.json` / `writingSentences.json` — USCIS reading/writing test sentences
- `citizenshipVocabulary.json` — word + meaning pairs for the vocabulary module
- `n400Questions.json` — N-400 form prep questions, categorized (Vocabulary, Character, etc.)
- `mockInterview.json` / `interviewTips.json` — mock interview script and tips used by `N400Prep`
- `interviewAudio.json` / `speechAudio.json` — **generated**, do not hand-edit. Map spoken content to its pre-rendered audio files (see "Pre-rendered audio" below)
- `translations.js` — object keyed by the **English question string** (not an id), each holding `{ es, vi, ko, zh }` → `{ q, a }`. A question whose text changes silently loses its subtitles — update both files together.

### Utility Functions (defined in App.jsx, passed as props)

- `speakText(text)` — plays the pre-rendered recording of `text` where one exists (see "Pre-rendered audio"), else falls back to `speakSynthesized`, which dispatches to `Capacitor.isNativePlatform()` ? Capacitor's `TextToSpeech` plugin : browser `window.speechSynthesis`. Cancelled automatically on question/view change — that effect pauses both `<audio>` elements as well as stopping the synthesizer
- `generateOptions(correctAnswer, dataPool)` — builds 3-option multiple-choice set (1 correct + 2 random distractors)
- `generateDefinitionOptions(correctMeaning, pool)` — same pattern for vocabulary (4 options)
- `formatSmartAnswer(answerStr, question)` — parses answer count hints embedded in question text; **imported from `src/utils/`**, not defined here, because the audio generator needs it too
- `startQuiz()` — selects a random quiz pool (10 questions for 100-Q version, 20 for 128-Q version)

### Styling

Global CSS custom properties (colors, fonts, glassmorphism tokens) are defined at the top of `src/index.css`. The design uses Inter/Outfit fonts from Google Fonts loaded in `index.html`.

### Testing

Tests use Vitest + React Testing Library with a jsdom environment. There is **no `vitest.config.js`** — the Vitest config lives in the `test:` block inside `vite.config.js`, which is also where `setupFiles` is wired up.

`src/setupTests.js` mocks `window.speechSynthesis` and `SpeechSynthesisUtterance` — any test that renders a component using speech synthesis relies on this mock being in place.

**Coverage is essentially nil**: `src/App.test.jsx` is the only test file and holds 2 smoke tests (app title renders, selection screen renders first). No module in `src/modules/` has any test. A green test run says almost nothing about whether a change works — verify module changes in the browser via `npm run dev`. jsdom also logs `Not implemented: Window's scrollTo()` on every run; that's the `window.scrollTo(0, 0)` view-change effect in `App.jsx` and is harmless noise, not a failure.

## Mobile Builds (iOS & Android)

The app is wrapped with **Capacitor** (`capacitor.config.ts`). The web build (`dist/`) is copied into the native projects on each sync.

### Typical workflow

```bash
npm run build          # rebuild web assets
npx cap sync           # copy dist/ → ios/ and android/, update plugins
npx cap open ios       # open Xcode (requires macOS + Xcode)
npx cap open android   # open Android Studio (requires JDK + Android Studio)
```

### Regenerate app icons / splash screens

Edit `resources/icon.svg` (the source logo), then:

```bash
node scripts/generate-icons.mjs
```

This converts the SVG → `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732), then runs `@capacitor/assets generate` to produce every required size for iOS and Android.

### Live remote URL (how iOS stays in sync with the web app)

`capacitor.config.ts` sets `server.url` to `https://passuscivics.com`, so the native shell loads the **live deployed web app** rather than the bundled copy in `dist/`. Any change deployed to Netlify appears in already-installed apps on next launch — no rebuild, no App Store release. There is by construction no separate "iOS design": both surfaces render the same deployed CSS.

Consequences to keep in mind:

- **The app requires an internet connection.** With no network the WebView has nothing to load. Anything that must work offline has to move to a bundled build.
- **Web deploys are now app releases.** Shipping a broken deploy breaks the installed iOS app immediately, with no review step in between.
- `limitsNavigationsToAppBoundDomains: false` is required for iOS to navigate to a non-bundled origin.

To build a self-contained, offline-capable app instead, set `CAP_LOCAL=1` — this drops the `server` block so Capacitor falls back to the bundled `dist/`:

```bash
CAP_LOCAL=1 npm run build && CAP_LOCAL=1 npx cap sync ios
```

### Key Capacitor files

- `capacitor.config.ts` — appId (`com.uscivicspass.app`), appName, webDir, `server.url` (see above)
- `vite.config.js` — computes `base` from env: `VITE_BASE_PATH` (see `.env.example`) if set, else `'./'` when `CAPACITOR` env is set (so native builds load assets from `file://`), else `'/'` for normal web deploys
- `ios/` — Xcode project (do not manually edit generated files)
- `android/` — Android Studio project (do not manually edit generated files)

### Patched dependencies

`patches/@capacitor-community+text-to-speech+8.0.1.patch` is applied automatically via the `postinstall` script (`patch-package`) after every `npm install`. If that plugin needs further changes, edit the copy under `node_modules/`, then regenerate the patch with `npx patch-package @capacitor-community/text-to-speech`.

## Pre-rendered audio (how the app sounds human)

Everything the app speaks is a **pre-rendered neural-voice recording**, not live
text-to-speech. The device's own synthesizer is only the fallback. This is the
single reason the app does not sound like a machine: on any device without an
Enhanced/Premium voice downloaded, the OS offers nothing but its "compact"
formant-synthesis tier, and no amount of voice-picking in the app can improve
on voices that are not installed.

All spoken content is fixed, so it is rendered once, offline, and shipped:

```bash
npm run audio                      # render only what changed
npm run audio -- --force           # re-render everything
npm run audio -- --plan-only       # count the work, render nothing
npm run audio -- --only=speech     # or --only=interview
```

The generator (`scripts/generate-audio.mjs`) uses **kokoro-js**, an 82M-parameter
neural TTS that runs locally — no API key, no per-play cost — and encodes to AAC
with macOS's `afconvert` (so no ffmpeg dependency). Two sets come out:

| Set | Voice(s) | Files | Manifest |
|---|---|---|---|
| `public/audio/speech/` | `af_heart` (female) | ~1,700, one per unique string | `src/data/speechAudio.json`, keyed by **the exact text spoken** |
| `public/audio/interview/` | `am_michael` officer, `af_heart` applicant | 55, one per turn | `src/data/interviewAudio.json`, keyed by section id → turn index |

Total ~35MB. The first run downloads the model (~330MB at fp32) to the Hugging
Face cache; `KOKORO_DTYPE=q8` pulls ~86MB instead — faster, lower quality.

### Rules that keep audio and text in step

- **Editing any spoken data file means re-running `npm run audio`.** Files are
  named after a hash of the text and voice, so reworded text simply has no
  recording and falls back to live TTS. Stale files are pruned on the next run.
- **Adding a `speakText` call site with new text?** Add that text to
  `collectAppSpeech()` in the generator, or it will only ever be synthesized.
- `src/utils/parseDialogue.js` and `src/utils/formatSmartAnswer.js` are imported
  by **both** `App.jsx` and the generator. That is deliberate: the generator has
  to produce a recording of the exact string the app will speak, and interview
  recordings are addressed by turn index. Don't fork either one.
- Manifests are written *before* rendering, so a half-finished run still builds
  and runs — missing files just fall back to speech synthesis.

### How playback works in `App.jsx`

`speakText(text)` looks `text` up in the speech manifest and plays the file
through a reused `<audio>` element, falling back to `speakSynthesized` when there
is no recording, the file 404s, or autoplay is blocked.

The manifest is ~100KB, so it is pulled in with a **module-scope `import()`** at
the top of `App.jsx` rather than a static import (which would put it in the main
bundle) or a `useEffect` (which would work, but a dynamic `import()` inside the
component makes React's compiler-based lint rules bail out on the entire file,
silently switching off every check in it — verified). Until it resolves,
`speechManifest` is null and everything is simply spoken live. `speakDialogue(section, …)`
does the same per turn against `interviewAudio`, and refuses the whole section's
recordings if its file count no longer matches the parsed turn count.

Elements are **reused, not recreated**: iOS unlocks the specific element a user
gesture touched, so a fresh `new Audio()` per line would be blocked. The app's
speed control is a speech-synthesis rate where 0.85 means "Normal", so recorded
playback uses `playbackRate = audioSpeed / 0.85` with `preservesPitch`.

## Companion Print Workbook

`book/` holds the print-on-demand companion workbook. Regenerate the manuscript from the live question/vocabulary data in `src/data/` with:

```bash
python3 scripts/generate_manuscript.py   # requires: pip3 install python-docx
# writes book/PassUSCivics-Workbook-Manuscript.docx (not committed — generated on demand)
```

The PDF is exported from that manuscript by hand and lands in `book/` under whatever name the export used (currently `Final USCivicsPass Workbook 01092026.pdf`). **Nothing in the app reads `book/`** — the only copy the app serves is `public/PassUSCivics-Workbook.pdf`, at that exact filename. Publishing a new workbook means copying the `book/` export over `public/PassUSCivics-Workbook.pdf`; skip that and the in-app viewer keeps showing the old one.

`WorkbookViewer` fetches it at the absolute path `/PassUSCivics-Workbook.pdf` ([WorkbookViewer.jsx:36](src/modules/WorkbookViewer.jsx#L36)), which is correct for the web deploy and for the live-URL native shell, but would not resolve under a `file://` `CAP_LOCAL=1` bundle.

## Deployment

The site deploys to Netlify (`netlify.toml`): build command `npm run build`, publish dir `dist`, with a catch-all SPA redirect to `index.html`.

## Misleading leftovers

Things in the tree that look load-bearing but aren't — don't build on them:

- **`google-translate-api-x`** (devDependency) has zero references anywhere in `src/`, `scripts/`, or the root `.mjs` scripts.
- **`kokoro-js`** is a *build-time* dependency only. It renders the Mock Interview audio in `scripts/generate-interview-audio.mjs` and is never imported by `src/` — nothing ships it to the browser. Live speech everywhere else is still Web Speech API on web and the Capacitor `TextToSpeech` plugin on native, both dispatched from `speakText` in `App.jsx`.
- **`src/hooks/`** is an empty directory. There are no custom hooks in this codebase; shared logic lives as functions inside `App.jsx` and is passed down as props. The exception is `src/utils/`, which holds the two pure functions the audio generator also needs (`parseDialogue`, `formatSmartAnswer`) — they live there so app and generator cannot drift apart, not as the start of a utils layer.
- **`dist/`, `ios/App/App/public/`, and `android/app/src/main/assets/public/`** all contain built copies of the app. Editing them does nothing — they're regenerated by `npm run build` + `npx cap sync`.

## Related Docs

`AGENTS.md` has copy-paste state/prop patterns, a file map for common changes, and anti-patterns to avoid (e.g. no Context/Redux — state is threaded as props from `App.jsx`).

`README.md` is user-facing (feature list, install steps) and duplicates the dev/test commands above.
