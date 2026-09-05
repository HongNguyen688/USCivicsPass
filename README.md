# PassUSCivics 🇺🇸

A comprehensive, interactive study app for the U.S. Naturalization Interview and Test — civics,
reading, writing, and N-400 prep in one place. Built with React and Vite, deployed as a web app
at [passuscivics.com](https://passuscivics.com) and wrapped with Capacitor for [iOS](https://apps.apple.com/us/app/uscivicspass/id6789735809)
and Android.

## ✨ Features

- **Multiple Study Guides** — the standard **100 Questions (2008 version)** and the expanded
  **128 Questions (2020 version)**, depending on your filing requirements.
- **Interactive Flashcards** — flippable cards covering every civics question.
- **Practice Quizzes** — randomized quizzes sized to your guide (10 questions / 6 to pass for
  2008, 20 questions / 12 to pass for 2020).
- **Reading & Writing Practice** — sentence dictation and reading exercises drawn from the
  official USCIS test vocabulary.
- **Vocabulary Module** — a glossary and quiz mode over the words the test expects you to know.
- **N-400 Interview Prep** — personal, vocabulary, and character questions from the real
  interview, plus a scripted mock interview with two-voice audio (officer and applicant).
- **Natural-sounding audio** — every question, answer, and interview line is a pre-rendered
  neural-voice recording, not robotic on-device text-to-speech, with adjustable playback speed.
- **Multilingual Subtitles** — Spanish, Vietnamese, Korean, and Chinese translations alongside
  the English question and answer.
- **Print Companion Workbook** — the same content as a page-by-page in-app PDF viewer, or as a
  [printed book on Amazon](https://a.co/d/0iGCC2Gs).
- **iOS & Android Apps** — the same experience wrapped as a native app; [download it on the App
  Store](https://apps.apple.com/us/app/uscivicspass/id6789735809).

## 🚀 Getting Started

### Prerequisites

[Node.js](https://nodejs.org/) (for native audio rendering, macOS is also required — see below).

### Installation

```bash
git clone https://github.com/HongNguyen688/USCivicsPass.git
cd USCivicsPass
npm install
```

### Running locally

```bash
npm run dev
```

Then open `http://localhost:5173`.

### Building

```bash
npm run build     # production build to dist/
npm run preview   # preview that build locally
```

### 🧪 Running tests

Unit tests use **Vitest** and **React Testing Library**.

```bash
npm run test              # watch mode
npm run test -- --run     # run once (CI mode)
```

## 📱 Mobile apps

The app is wrapped with [Capacitor](https://capacitorjs.com/), and the installed iOS/Android
shell loads the live deployed web app rather than a bundled copy — so most changes just need a
web deploy, not a new app release.

```bash
npm run build          # rebuild web assets
npx cap sync            # copy into ios/ and android/, sync plugins
npx cap open ios        # open Xcode
npx cap open android    # open Android Studio
```

See [CLAUDE.md](CLAUDE.md) for the full mobile build and audio-rendering workflow.

## 🛠 Tech stack

- **React 19** + **Vite**
- **Capacitor** — iOS and Android app shells
- **pdfjs-dist** — in-app workbook PDF viewer
- **kokoro-js** — local neural text-to-speech, used at build time to pre-render all spoken audio
- **CSS3** — custom glassmorphism design system, no UI framework
- **Vitest** & **React Testing Library**

## 💬 Feedback & support

- [Buy me a coffee](https://buymeacoffee.com/hongnguyen) if the app helped you study
- [Buy the print workbook](https://a.co/d/0iGCC2Gs) on Amazon
- Email feedback to [hongnguyentt99@gmail.com](mailto:hongnguyentt99@gmail.com?subject=PassUSCivics%20Feedback)

## 📄 License

© 2026 HN - PassUSCivics. All rights reserved.
