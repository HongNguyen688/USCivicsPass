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

- `view` — controls which screen is rendered (selection, home, questions, flashcards, quiz, reading, writing, vocabulary, n400)
- `testVersion` — `'100'` (2008 USCIS version) or `'128'` (2020 version); determines which questions JSON is loaded
- `selectedLanguage` — drives subtitle display via `src/data/translations.js`
- `audioSpeed` — controls playback rate for both Web Speech API (browser) and Capacitor TextToSpeech (native)

Navigation is purely state-driven: modules call handlers like `goToHome()` / `goToSelection()` passed from App — there is no router library.

### Components vs Modules

`src/components/` holds shared UI primitives (`Header`, `Footer`, `DashboardCard`, `SelectionCard`) used across views. `src/modules/` holds full-screen view components (`CivicsStudy`, `Flashcards`, `PracticeQuiz`, `ReadingPractice`, `WritingPractice`, `VocabularyModule`, `N400Prep`, `Dashboard`, `SelectionScreen`, `WorkbookViewer`).

`WorkbookViewer` (view `'workbook'`) is `React.lazy`-loaded from `App.jsx` since it pulls in `pdfjs-dist` (~1MB) — only fetched when the user opens it. It renders `public/USCivicsPass-Workbook.pdf` page-by-page onto `<canvas>` elements (not an `<iframe>`, since Android's WebView has no built-in PDF viewer) with lazy per-page rendering via `IntersectionObserver`.

Much of the quiz, vocabulary, reading, and writing state actually lives in `App.jsx` (e.g. `quizState`, `vocabState`, `currentQuestionIndex`, `readingIndex`, `writingIndex`) and is passed down as props alongside callbacks. Purely ephemeral UI state (e.g. card flip animation) lives locally in the module.

### Content Data

All question/sentence content is in `src/data/`:

- `questions.json` / `questions128.json` — civics Q&A for the 100-Q (2008) and 128-Q (2020) test sets
- `readingSentences.json` / `writingSentences.json` — USCIS reading/writing test sentences
- `citizenshipVocabulary.json` — word + meaning pairs for the vocabulary module
- `n400Questions.json` — N-400 form prep questions, categorized (Vocabulary, Character, etc.)
- `mockInterview.json` / `interviewTips.json` — mock interview script and tips used by `N400Prep`
- `translations.js` — flat keyed object of Spanish/other subtitles for civics questions

### Utility Functions (defined in App.jsx, passed as props)

- `speakText(text)` — dispatches to `Capacitor.isNativePlatform()` ? Capacitor's `TextToSpeech` plugin (native iOS/Android neural voice) : browser `window.speechSynthesis`; cancelled automatically on question/view change
- `generateOptions(correctAnswer, dataPool)` — builds 3-option multiple-choice set (1 correct + 2 random distractors)
- `generateDefinitionOptions(correctMeaning, pool)` — same pattern for vocabulary (4 options)
- `formatSmartAnswer(answerStr, question)` — parses answer count hints embedded in question text
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

## Companion Print Workbook

`book/` contains a print-on-demand companion workbook (`USCivicsPass-Workbook.pdf`, served from `public/` and shown in-app by `WorkbookViewer`; `USCivicsPass-Workbook-Manuscript.docx`). Regenerate the manuscript from the live question/vocabulary data with:

```bash
python3 scripts/generate_manuscript.py   # requires: pip3 install python-docx
```

## Deployment

The site deploys to Netlify (`netlify.toml`): build command `npm run build`, publish dir `dist`, with a catch-all SPA redirect to `index.html`.

## Misleading leftovers

Things in the tree that look load-bearing but aren't — don't build on them:

- **`kokoro-js`** (dependency) and **`google-translate-api-x`** (devDependency) have zero references anywhere in `src/`, `scripts/`, or the root `.mjs` scripts. In particular, `kokoro-js` is *not* the TTS engine — speech is Web Speech API on web and the Capacitor `TextToSpeech` plugin on native, both dispatched from `speakText` in `App.jsx`.
- **`src/hooks/`** is an empty directory. There are no custom hooks in this codebase; shared logic lives as functions inside `App.jsx` and is passed down as props.
- **`dist/`, `ios/App/App/public/`, and `android/app/src/main/assets/public/`** all contain built copies of the app. Editing them does nothing — they're regenerated by `npm run build` + `npx cap sync`.

## Related Docs

`AGENTS.md` has copy-paste state/prop patterns, a file map for common changes, and anti-patterns to avoid (e.g. no Context/Redux — state is threaded as props from `App.jsx`).

`README.md` is user-facing (feature list, install steps) and duplicates the dev/test commands above.
