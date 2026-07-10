# AI Agent Guide: USCivicsPass

This guide helps AI coding agents be immediately productive in this React + Vite civics prep app. For detailed architecture, see [CLAUDE.md](CLAUDE.md).

## Quick Reference

| Task                        | File                                                                                                  | Pattern                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Add a new civics question   | [src/data/questions.json](src/data/questions.json) or [questions128.json](src/data/questions128.json) | `{ "question": "...", "answer": "..." }`                                                   |
| Add a module view           | [src/modules/](src/modules/) + update `view` state in [App.jsx](src/App.jsx#L1-L50)                   | Follow existing module signature (receive 20+ props, call handlers passed down)            |
| Add module-local UI state   | Inside module component (e.g., `Flashcards.jsx`)                                                      | `const [isFlipped, setIsFlipped] = useState(false)`                                        |
| Add global state            | [App.jsx](src/App.jsx) around lines 15–40                                                             | `const [newState, setNewState] = useState(initialValue)`                                   |
| Add a quiz option generator | [App.jsx](src/App.jsx) `generateOptions()` function                                                   | Returns 1 correct answer + 2 random wrong ones from the pool                               |
| Add/update translations     | [src/data/translations.js](src/data/translations.js)                                                  | Keyed by question text: `{ "What is the capital?": { "es": "¿Cuál es...", "vi": "..." } }` |
| Test audio features         | [src/setupTests.js](src/setupTests.js) mocks `window.speechSynthesis`                                 | Run `npm run test`                                                                         |

## Architecture: The Hub-Spoke Model

All state lives in **[App.jsx](src/App.jsx)** (the hub). Every module is a stateless consumer (spoke) receiving props + callbacks:

```
App.jsx (state hub)
├─ view: which screen to show ('home', 'quiz', 'flashcards', etc.)
├─ testVersion: '100' or '128' (2008 vs 2020 USCIS questions)
├─ quizState, vocabState, n400State: module-specific state objects
└─ Navigation handlers: goToHome(), goToQuiz(), etc.
    │
    ├─> CivicsStudy.jsx (receives questions, handlers)
    ├─> PracticeQuiz.jsx (receives quizState, handlers)
    ├─> VocabularyModule.jsx (receives vocabState, handlers)
    └─> ... 5 more modules
```

**Rule**: Never add Context API or Redux without explicit request. Thread state as props from App.jsx → modules.

## State Patterns (Copy & Adapt)

### 1. Module-Specific State Object

When a module needs multiple related properties, use a fat state object:

```javascript
// In App.jsx:
const [quizState, setQuizState] = useState({
  questions: [],
  currentIndex: 0,
  score: 0,
  selected: null,
  isAnswerChecked: false,
  showNextBtn: false,
  isComplete: false,
});

// In module, to update one field:
setQuizState((prev) => ({ ...prev, isAnswerChecked: true }));
```

### 2. Order Arrays for Randomization

To toggle between sequential and random modes without re-querying data:

```javascript
// In App.jsx:
const [studyOrder, setStudyOrder] = useState(
  [...Array(questionsData.length).keys()].sort(() => 0.5 - Math.random()),
);
const currentQuestion = questionsData[studyOrder[currentQuestionIndex]];

// In module, to shuffle again:
startQuiz(); // calls setStudyOrder() with new random order
```

### 3. useRef for Async Audio State

When async operations (Web Speech API, TextToSpeech) need the latest state:

```javascript
// In App.jsx:
const audioSpeedRef = useRef(audioSpeed);
useEffect(() => {
  audioSpeedRef.current = audioSpeed;
}, [audioSpeed]);

// In speakText function:
utterance.rate = audioSpeedRef.current; // always reads latest
```

## Common Tasks & Gotchas

### Adding a New Module (Full-Screen View)

1. Create [src/modules/MyModule.jsx](src/modules/) following existing signature:

   ```javascript
   export default function MyModule({
     // Global state
     view,
     testVersion,
     selectedLanguage,
     // Module-specific state
     myState,
     setMyState,
     // Navigation
     goToHome,
     // Audio
     speakText,
   }) {
     return <div>...</div>;
   }
   ```

2. Add state object in App.jsx: `const [myState, setMyState] = useState({...})`

3. Add view option to the render switch:

   ```javascript
   case 'mymodule':
     return <MyModule {...props} />;
   ```

4. Add navigation handler: `const goToMyModule = () => setView('mymodule');`

5. Pass handler to modules that should link to it.

### Adding Data (Questions, Sentences, Vocabulary)

**Golden Rule**: Import JSON at the top of [App.jsx](src/App.jsx), use it to derive state or pass as props.

Example—new sentence type for reading:

```javascript
// src/data/newSentences.json
[
  { "id": 1, "text": "The quick brown fox..." },
  ...
]

// App.jsx (top of file)
import newSentences from './data/newSentences.json';

// Pass to module:
<ReadingPractice {...props} sentences={newSentences} />
```

⚠️ **Gotcha**: Translations are keyed by **question text**, not ID. If you change a question string, translations break silently:

```javascript
// BAD: Translations won't be found if question text changes
translations[currentQuestion.question]?.[selectedLanguage];

// BETTER (if IDs were used): Would survive text changes
// But this project uses text keys—accept it and document carefully
```

### Adding Translation Support

1. Open [src/data/translations.js](src/data/translations.js)
2. Add key-value pairs under the language section:
   ```javascript
   const translations = {
     "What is the capital?": {
       es: "¿Cuál es la capital?",
       vi: "Thủ đô là gì?",
     },
   };
   ```
3. Use in module: `translations[questionText]?.[selectedLanguage]` (optional chaining prevents crashes)

### Testing Audio/Speech Features

The test environment mocks `window.speechSynthesis` ([src/setupTests.js](src/setupTests.js)):

```javascript
// Example test:
test("speakText calls speechSynthesis.speak", () => {
  render(<App />);
  // Your assertions here—speechSynthesis is already mocked
});
```

Run tests with `npm run test` (watch mode).

## Decision Trees

### "I need to add state—where does it go?"

```
Does the state affect ONLY one module's internal animation (e.g., card flip)?
  → YES: Use useState() inside that module component
  → NO: Continue...

Is the state used by 2+ modules or needed to persist across view changes?
  → YES: Add to App.jsx's state, pass as prop
  → NO: Use module-local useState

Does the state represent a complex domain (quiz progress, vocab test results)?
  → YES: Create a state object { currentIndex, score, ... } in App.jsx
  → NO: Use individual useState hooks
```

### "I need to randomize content—how?"

```
Is the content accessed sequentially by index, and users can toggle random/sequential?
  → YES: Use the "order array" pattern (see State Patterns above)
  → NO: Continue...

Do I shuffle once at app load and never re-shuffle?
  → YES: Use [...array].sort(() => 0.5 - Math.random())
  → NO: Use a proper Fisher-Yates shuffle (current shuffle is slightly biased but acceptable for <500 items)
```

### "I'm adding a feature that uses audio—what should I know?"

```
Is this for web only (browser)?
  → Use window.speechSynthesis (already used in App.jsx)

Is this for mobile (iOS/Android)?
  → Use Capacitor's TextToSpeech plugin (already integrated in App.jsx)

Should audio stop when the user navigates away?
  → YES (recommended): Call cleanup in useEffect return, or pass audio cancellation as prop
  → Already done: speakText() cancels on view change
```

## Key Anti-Patterns (Avoid!)

| Pattern                                                                       | Why It's Bad                                                               | What To Do Instead                                                  |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Passing data via context or Redux                                             | App.jsx hub-spoke is the convention here—context was deliberately not used | Thread state as explicit props through App.jsx                      |
| Creating new `useState` in a module for data that should persist across views | State is lost when the module unmounts                                     | Move state to App.jsx, pass as prop                                 |
| Keying translations by ID (e.g., `q1`) instead of question text               | This project already uses text keys—consistency matters                    | Adapt to text-based keys, or propose refactor with explicit request |
| Forgetting optional chaining (`?.`) when accessing nested data                | Crashes if a key doesn't exist                                             | Always use `translations[key]?.[lang]` or similar                   |
| Using `Math.random() - 0.5` shuffle for large datasets (500+)                 | Biased distribution for Fisher-Yates                                       | OK for <200 items; use a proper shuffle algo for bigger pools       |

## File Map for Common Changes

| I Want To...                                   | Edit This File                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Add a civics question                          | [src/data/questions.json](src/data/questions.json) or [questions128.json](src/data/questions128.json) |
| Change app styling (colors, fonts)             | [src/index.css](src/index.css) (see CSS custom properties at top)                                     |
| Add a shared UI component (button, card, etc.) | [src/components/](src/components/)                                                                    |
| Add a full-screen module                       | [src/modules/](src/modules/) + [App.jsx](src/App.jsx)                                                 |
| Modify app-level navigation logic              | [App.jsx](src/App.jsx) (goToHome, goToQuiz, etc.)                                                     |
| Configure Vite build or dev server             | [vite.config.js](vite.config.js)                                                                      |
| Update ESLint rules                            | [eslint.config.js](eslint.config.js)                                                                  |
| Add a mobile feature (iOS/Android)             | [capacitor.config.ts](capacitor.config.ts) or native code in `ios/` or `android/`                     |
| Regenerate app icons / splash screens          | `node scripts/generate-icons.mjs` after editing [resources/icon.svg](resources/icon.svg)              |

## Build & Test Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run lint         # ESLint check
npm run test         # Vitest watch mode
npm run test -- --run  # Single test run (CI mode)
```

After web build, deploy to device:

```bash
npx cap sync         # Copy dist/ → ios/ & android/
npx cap open ios     # Open Xcode
npx cap open android # Open Android Studio
```

## Debugging Tips

- **State not updating?** Check if you're mutating state directly instead of using the setter function.
- **Audio not playing on native?** Verify TextToSpeech plugin is installed: `npx cap ls` should show `@capacitor-community/text-to-speech`.
- **Translations not showing?** Verify the question text exactly matches the key in [translations.js](src/data/translations.js)—case-sensitive!
- **Module receiving undefined props?** Trace the prop threading from App.jsx → intermediate component → target module. Props must be explicitly listed.

## Reference Links

- [CLAUDE.md](CLAUDE.md) — Detailed architecture, state flow, styling, and mobile setup
- [src/App.jsx](src/App.jsx) — Hub of all state; start here to understand data flow
- [src/modules/](src/modules/) — 8 full-screen views; study one to understand module signature
- [src/data/](src/data/) — All question, sentence, vocabulary, and translation content
- [vite.config.js](vite.config.js) — Build config; note `base: './'` for Capacitor
