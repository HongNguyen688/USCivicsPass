// ============================================================
// FILE: App.jsx  —  The "Brain" of the App
// ============================================================
// This is the most important file in the project.
// It acts like a "Traffic Controller" with 3 main jobs:
//
//   JOB 1: Decide which SCREEN (page) to show.
//          The app has no real URL changes — we just swap
//          components in and out based on a variable called `view`.
//
//   JOB 2: Store all GLOBAL STATE (shared memory).
//          Things like "which test version did the user pick?"
//          or "what question are we on?" live here so every
//          other module can read or update them.
//
//   JOB 3: Provide HELPER FUNCTIONS.
//          Things like speaking text out loud or generating
//          quiz options are defined here and passed DOWN to
//          the modules that need them (via "props").
// ============================================================

// React core — we need these three "hooks":
//   useState  → store a value that, when changed, re-renders the UI
//   useEffect → run code automatically when a value changes
//   useRef    → store a value that does NOT cause a re-render when changed
import React, { useState, useEffect, useRef } from 'react';

// Capacitor lets us detect if the app is running as a native
// iOS/Android app vs. running in a regular web browser.
import { Capacitor } from '@capacitor/core';

// Native text-to-speech plugin for iOS/Android.
// On web browsers we use the built-in window.speechSynthesis instead.
import { TextToSpeech } from '@capacitor-community/text-to-speech';

// ── DATA IMPORTS ─────────────────────────────────────────────
// These JSON files are just lists of questions & answers stored
// as plain text. We import them like any other variable.
import questions100 from './data/questions.json';       // 100 questions (2008 version)
import questions128 from './data/questions128.json';    // 128 questions (2020 version)
import n400Questions from './data/n400Questions.json';  // N-400 form prep questions
import mockInterview from './data/mockInterview.json';  // Mock interview script
import interviewTips from './data/interviewTips.json';  // Interview tips
import readingSentences from './data/readingSentences.json';   // Sentences for reading test
import writingSentences from './data/writingSentences.json';   // Sentences for writing test
import citizenshipVocabulary from './data/citizenshipVocabulary.json'; // Vocabulary words
import { translations } from './data/translations';     // Spanish/Vietnamese/etc. subtitles

// ── SHARED COMPONENT IMPORTS ──────────────────────────────────
// These are small reusable UI pieces used across many screens.
import Header from './components/Header';
import Footer from './components/Footer';

// ── MODULE (SCREEN) IMPORTS ───────────────────────────────────
// Each of these is a full "page" of the app.
// We swap between them by changing the `view` state below.
import SelectionScreen from './modules/SelectionScreen';
import Dashboard from './modules/Dashboard';
import CivicsStudy from './modules/CivicsStudy';
import Flashcards from './modules/Flashcards';
import PracticeQuiz from './modules/PracticeQuiz';
import ReadingPractice from './modules/ReadingPractice';
import WritingPractice from './modules/WritingPractice';
import VocabularyModule from './modules/VocabularyModule';
import N400Prep from './modules/N400Prep';

// Lazy-loaded: pulls in pdf.js (~1MB), so it's split into its own chunk
// and only fetched when the user actually opens the Workbook viewer.
const WorkbookViewer = React.lazy(() => import('./modules/WorkbookViewer'));

// Global CSS styles
import './index.css';


// ============================================================
// THE MAIN APP COMPONENT
// ============================================================
// A "component" in React is just a function that returns HTML-like
// code (called JSX). React calls this function to draw the screen.
const App = () => {

  // ==========================================================
  // SECTION 1: GLOBAL STATE  (useState)
  // ==========================================================
  // useState(initialValue) gives us two things:
  //   [currentValue, functionToChangeIt]
  // Whenever we call the change function, React redraws the screen.

  // Which test version is the user studying?
  // null = not chosen yet, '100' = 2008 version, '128' = 2020 version
  const [testVersion, setTestVersion] = useState(null);

  // Which screen is currently visible?
  // Possible values: 'selection', 'home', 'questions', 'flashcards',
  //                  'quiz', 'vocabulary', 'reading', 'writing', 'n400'
  const [view, setView] = useState('selection');

  // ==========================================================
  // SECTION 2: MODULE-SPECIFIC STATE
  // ==========================================================
  // These states are only used by certain modules/screens.

  // Which N-400 tab is active? ('Vocabulary', 'Character Questions', etc.)
  const [n400Category, setN400Category] = useState('Vocabulary');

  // Which question number is the user currently on (0 = first question)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Should the answer be visible? (used in Flashcards & N-400)
  const [showAnswer, setShowAnswer] = useState(false);

  // All the data for the current practice quiz session.
  // null = no quiz started yet.
  const [quizState, setQuizState] = useState(null);

  // All the data for the current vocabulary quiz session.
  const [vocabState, setVocabState] = useState({
    currentIndex: 0,    // Which word are we on?
    score: 0,           // How many correct answers so far?
    complete: false,    // Is the quiz finished?
    questions: [],      // The shuffled list of vocab words for this session
    showFeedback: false,// Should we show if the answer was right/wrong?
    selectedOption: null, // Which answer did the user tap?
    currentOptions: [], // The 4 multiple-choice options for this word
    history: [],        // Array of 'correct'/'incorrect' for each past answer
    mode: 'learn',      // Current tab: 'learn' (glossary) or 'test' (quiz)
    searchQuery: ''     // Text typed in the search box
  });

  // Is the mobile hamburger menu open?
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Which quiz answer option did the user select?
  const [selectedOption, setSelectedOption] = useState(null);

  // Has the user already checked their quiz answer for the current question?
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // The 3 multiple-choice options shown for the current quiz question
  const [currentOptions, setCurrentOptions] = useState([]);

  // ==========================================================
  // SECTION 3: SETTINGS STATE
  // ==========================================================

  // Should questions be shown in random order? (false = sequential 1,2,3...)
  const [isRandom, setIsRandom] = useState(false);

  // How fast should the voice speak? (0.65 = slow, 0.85 = normal, 1.0 = fast)
  const [audioSpeed, setAudioSpeed] = useState(0.85);

  // useRef stores a value WITHOUT causing a re-render.
  // We use it here so the audio callback always reads the latest speed,
  // even if the state hasn't updated yet (a common async timing issue).
  const audioSpeedRef = useRef(0.85);

  // The order to show questions in (array of indexes like [0,1,2,...] or shuffled)
  const [studyOrder, setStudyOrder] = useState([]);

  // Which subtitle language to show ('none', 'es', 'vi', 'ko', 'zh')
  const [selectedLanguage, setSelectedLanguage] = useState('none');

  // A ref to the currently playing speech utterance, so we can cancel it
  const currentUtteranceRef = useRef(null);

  // A ref to the best available browser voice (chosen once on startup)
  const preferredVoiceRef = useRef(null);

  // ==========================================================
  // SECTION 4: READING & WRITING STATE
  // ==========================================================

  // Which reading sentence are we on?
  const [readingIndex, setReadingIndex] = useState(0);

  // Should reading sentences be shown in random order?
  const [isReadingRandom, setIsReadingRandom] = useState(false);

  // The order array for reading sentences (similar to studyOrder above)
  const [readingOrder, setReadingOrder] = useState([]);

  // Which writing sentence are we on?
  const [writingIndex, setWritingIndex] = useState(0);

  // What has the user typed in the writing text box?
  const [writingInput, setWritingInput] = useState('');

  // Has the user clicked "Check Answer" on the current writing sentence?
  const [isWritingChecked, setIsWritingChecked] = useState(false);

  // Should writing sentences be shown in random order?
  const [isWritingRandom, setIsWritingRandom] = useState(false);

  // The order array for writing sentences
  const [writingOrder, setWritingOrder] = useState([]);

  // ==========================================================
  // SECTION 5: DERIVED DATA (calculated from state, not stored)
  // ==========================================================

  // Pick the right question set based on which version the user chose.
  // The ternary (? :) is like a one-line if/else:
  //   if testVersion is '128' → use questions128, otherwise → use questions100
  const questionsData = testVersion === '128' ? questions128 : questions100;

  // How many questions are in the current set? (100 or 128)
  const totalQuestions = questionsData ? questionsData.length : 0;

  // Filter the N-400 question list to only show the currently selected tab's questions.
  // .filter() creates a NEW array with only items that match the condition.
  const n400Data = n400Questions.filter(q => q.category === n400Category);


  // ==========================================================
  // SECTION 6: NAVIGATION FUNCTIONS
  // ==========================================================
  // These functions change the `view` state, which causes React
  // to swap out which screen component is displayed.

  // Go back to the very first screen (version selection)
  const goToSelection = () => {
    setTestVersion(null);   // Clear the chosen version
    setView('selection');
    setIsMenuOpen(false);   // Close mobile menu if open
  };

  // Go to the Dashboard (the main menu of study modules)
  const goToHome = () => {
    setView('home');
    setIsMenuOpen(false);
  };

  // Go to the Civics Study screen (browse all questions one by one)
  const goToQuestions = () => {
    setCurrentQuestionIndex(0); // Start from the first question

    // Array.from creates an array like [0, 1, 2, ..., totalQuestions-1]
    // The underscore (_) means "I don't need this value, just the index (i)"
    const order = Array.from({ length: totalQuestions }, (_, i) => i);

    // If random mode is on, shuffle the order array.
    // Math.random() - 0.5 gives a random positive or negative number,
    // which makes .sort() shuffle randomly.
    if (isRandom) order.sort(() => Math.random() - 0.5);

    setStudyOrder(order);
    setShowAnswer(false);
    setView('questions');
    setIsMenuOpen(false);
  };

  // Go to the Flashcards screen (same setup as questions, different view)
  const goToFlashcards = () => {
    setCurrentQuestionIndex(0);
    const order = Array.from({ length: totalQuestions }, (_, i) => i);
    if (isRandom) order.sort(() => Math.random() - 0.5);
    setStudyOrder(order);
    setShowAnswer(false);
    setView('flashcards');
    setIsMenuOpen(false);
  };

  // Go to the Reading Practice screen
  const goToReading = () => {
    setReadingIndex(0);
    const order = Array.from({ length: readingSentences.length }, (_, i) => i);
    if (isReadingRandom) order.sort(() => Math.random() - 0.5);
    setReadingOrder(order);
    setView('reading');
    setIsMenuOpen(false);
  };

  // Go to the Writing Practice screen
  const goToWriting = () => {
    setWritingIndex(0);
    setWritingInput('');
    setIsWritingChecked(false);
    const order = Array.from({ length: writingSentences.length }, (_, i) => i);
    if (isWritingRandom) order.sort(() => Math.random() - 0.5);
    setWritingOrder(order);
    setView('writing');
    setIsMenuOpen(false);
  };

  // Called when the user taps a version card on the Selection Screen
  const selectVersion = (ver) => {
    setTestVersion(ver);  // Save '100' or '128'
    setView('home');       // Jump to the Dashboard
  };


  // ==========================================================
  // SECTION 7: SIDE EFFECTS  (useEffect)
  // ==========================================================
  // useEffect(() => { ... }, [dependency1, dependency2])
  // The code inside runs AFTER React redraws the screen,
  // but ONLY when one of the listed dependencies has changed.

  // When the user toggles random mode while on the questions screen,
  // regenerate the order array so questions reshuffle immediately.
  useEffect(() => {
    if (view === 'questions') {
      const order = Array.from({ length: totalQuestions }, (_, i) => i);
      if (isRandom) order.sort(() => Math.random() - 0.5);
      setStudyOrder(order);
      setCurrentQuestionIndex(0);
    }
  }, [isRandom, view, totalQuestions]); // Run this whenever isRandom, view, or totalQuestions changes

  // Same idea for Reading Practice: toggling Sequential/Random inside the
  // module only flips the flag, so rebuild the order array here or the
  // sentences keep coming out in the order picked when the screen opened.
  useEffect(() => {
    if (view === 'reading') {
      const order = Array.from({ length: readingSentences.length }, (_, i) => i);
      if (isReadingRandom) order.sort(() => Math.random() - 0.5);
      setReadingOrder(order);
      setReadingIndex(0);
    }
  }, [isReadingRandom, view]);

  // Same for Writing Practice. Reshuffling starts a fresh sentence, so the
  // typed answer and the revealed-answer flag have to be cleared too.
  useEffect(() => {
    if (view === 'writing') {
      const order = Array.from({ length: writingSentences.length }, (_, i) => i);
      if (isWritingRandom) order.sort(() => Math.random() - 0.5);
      setWritingOrder(order);
      setWritingIndex(0);
      setWritingInput('');
      setIsWritingChecked(false);
    }
  }, [isWritingRandom, view]);

  // Scroll back to the top whenever the screen changes. Without this, navigating
  // to a module from a scrolled-down position (e.g. tapping a dashboard card that's
  // below the fold on mobile) leaves the new screen scrolled too, so its header and
  // controls render off-screen above the viewport and its content starts clipped
  // behind the sticky header.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Keep audioSpeedRef always in sync with the audioSpeed state value.
  // We need the ref because the speech synthesis callback (an async function)
  // reads the ref directly — it can't reliably read the state value.
  useEffect(() => {
    audioSpeedRef.current = audioSpeed;
  }, [audioSpeed]);

  // Stop any currently playing audio whenever the user navigates
  // to a different question or a different screen.
  // This prevents old audio from continuing while new content is shown.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Native iOS/Android: use the Capacitor TTS plugin's stop method
      TextToSpeech.stop().catch(() => {}); // .catch(() => {}) silently ignores errors
    } else {
      // Web browser: use the built-in Web Speech API
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
    // Dependencies: run this effect whenever any of these values change.
    // readingOrder/writingOrder are in here because reshuffling changes the
    // sentence without moving the index — toggling Random while sitting on
    // sentence 1 would otherwise leave the old sentence speaking over the new one.
  }, [currentQuestionIndex, readingIndex, writingIndex, readingOrder, writingOrder, view, n400Category, quizState?.currentIndex, vocabState?.currentIndex]);

  // On startup, find the highest-quality browser voice available.
  // Different browsers offer different voice options — we pick the best one.
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return; // Native apps use the TextToSpeech plugin instead

    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return; // Voices not loaded yet, try again when they are

      // Score each voice — higher is better
      const scoreVoice = (voice) => {
        if (!/^en/i.test(voice.lang)) return 0;  // Must be English
        if (/enhanced/i.test(voice.name) && voice.lang === 'en-US') return 10; // Best: Apple Enhanced
        if (/Aria|Jenny|Michelle|Guy/i.test(voice.name) && /natural/i.test(voice.name)) return 9;
        if (voice.name === 'Google US English') return 8;
        if (/natural|neural|enhanced/i.test(voice.name) && /^en/i.test(voice.lang)) return 7;
        if (voice.lang === 'en-US' && voice.localService) return 4; // Local voices are more reliable
        if (voice.lang === 'en-US') return 3;
        return 1; // Any other English voice
      };

      // .reduce() walks through the voices array and keeps the one with the highest score.
      // Think of it like: "start with voices[0], and keep whichever is better as you go"
      preferredVoiceRef.current = voices.reduce((best, current) =>
        scoreVoice(best) >= scoreVoice(current) ? best : current
      );
    };

    selectBestVoice();

    // Some browsers (like Chrome) load voices asynchronously.
    // onvoiceschanged fires when they're ready — we re-run our selection then.
    window.speechSynthesis.onvoiceschanged = selectBestVoice;

    // "Cleanup function": React calls this when the component is removed from the page.
    // We remove the listener to avoid memory leaks.
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []); // Empty array [] means "run this effect only ONCE when the app first loads"


  // ==========================================================
  // SECTION 8: HELPER FUNCTIONS
  // ==========================================================

  // --- AUDIO ---

  // speakBrowser: Uses the browser's built-in Web Speech API to read text aloud.
  const speakBrowser = (text) => {
    window.speechSynthesis.cancel(); // Stop any previous speech first
    window.speechSynthesis.resume(); // Chrome bug fix: sometimes synthesis gets stuck paused

    // SpeechSynthesisUtterance is a browser object that represents "text to be spoken"
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = audioSpeedRef.current; // Use ref (not state) for latest speed value
    utterance.volume = 1;

    // Use our best voice if we found one
    if (preferredVoiceRef.current) utterance.voice = preferredVoiceRef.current;

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance); // Start speaking!
  };

  // speakText: The main "speak this text" function used by all modules.
  // It automatically chooses native TTS (on phone) or browser TTS (on web).
  const speakText = (text) => {
    if (!text) return; // Don't try to speak empty text

    if (Capacitor.isNativePlatform()) {
      // On iPhone/Android: use the device's high-quality neural voice (like Siri)
      TextToSpeech.stop().catch(() => {});
      TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: audioSpeedRef.current,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient', // 'ambient' = plays even when the iOS silent switch is ON
      }).catch(() => {});
    } else {
      // On a web browser: use the browser's built-in speech
      speakBrowser(text);
    }
  };

  // --- QUIZ HELPERS ---

  // generateOptions: Creates the 3 multiple-choice answers for a quiz question.
  // Returns 1 correct answer + 2 random wrong answers, shuffled.
  const generateOptions = (correctAnswer, dataPool) => {
    // Get 2 wrong answers from the data pool (filter out the correct one first)
    const wrongAnswers = dataPool
      .filter(q => q.answer !== correctAnswer) // Remove the correct answer
      .map(q => q.answer)                       // Get just the answer strings
      .sort(() => 0.5 - Math.random())          // Shuffle randomly
      .slice(0, 2);                             // Take only 2 of them

    // Combine correct + 2 wrong, then shuffle again so the correct one
    // isn't always in the same position
    return [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
  };

  // startQuiz: Initializes a brand new quiz session.
  const startQuiz = () => {
    // 128-question version has 20 quiz questions; 100-question has 10
    const quizLength = testVersion === '128' ? 20 : 10;

    // Pick a random subset of questions for this quiz session
    const quizPool = [...questionsData]              // Copy the array (don't mutate original)
      .sort(() => 0.5 - Math.random())               // Shuffle it
      .slice(0, quizLength);                         // Take the first N questions

    // Generate the multiple-choice options for the very first question
    const firstOptions = generateOptions(quizPool[0].answer, questionsData);

    // Save all quiz data into state
    setQuizState({
      questions: quizPool,  // The questions for this session
      currentIndex: 0,      // Start at question 0
      score: 0,             // No points yet
      complete: false,      // Quiz is not done yet
      userAnswers: [],      // No answers submitted yet
      showDetails: false    // Don't show the detailed results breakdown yet
    });

    setCurrentOptions(firstOptions);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setView('quiz');
    setIsMenuOpen(false);
  };

  // nextQuizQuestion: Move to the next question, or end the quiz if we're done.
  const nextQuizQuestion = () => {
    const nextIndex = quizState.currentIndex + 1;

    if (nextIndex < quizState.questions.length) {
      // There are more questions — generate options for the next one and advance
      const nextOptions = generateOptions(quizState.questions[nextIndex].answer, questionsData);
      setQuizState(prev => ({ ...prev, currentIndex: nextIndex }));
      setCurrentOptions(nextOptions);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      // No more questions — mark quiz as complete to show results screen
      setQuizState(prev => ({ ...prev, complete: true }));
    }
  };

  // handleOptionSelect: Called when the user taps a multiple-choice answer.
  const handleOptionSelect = (option) => {
    if (isAnswerChecked) return; // Ignore taps after the answer has already been checked

    setSelectedOption(option);
    setIsAnswerChecked(true); // Lock the answer in (no changing after this)

    // Update the quiz score.
    // We use the "prev =>" pattern to safely read the LATEST state value.
    // (Don't use quizState directly here — it might be stale in async code)
    setQuizState(prev => {
      const isCorrect = option === prev.questions[prev.currentIndex].answer;
      const newUserAnswers = [...(prev.userAnswers || [])]; // Copy the answers array
      newUserAnswers[prev.currentIndex] = option;           // Record this answer
      return {
        ...prev,                                    // Keep all existing quiz data
        score: isCorrect ? prev.score + 1 : prev.score, // Add 1 point if correct
        userAnswers: newUserAnswers
      };
    });
  };

  // --- VOCABULARY HELPERS ---

  // generateDefinitionOptions: Creates the 4 multiple-choice definitions for vocab quiz.
  // Same idea as generateOptions() above, but for vocab words.
  const generateDefinitionOptions = (correctMeaning, pool) => {
    let options = [correctMeaning]; // Start with the correct answer

    // Get all other meanings that aren't the correct one
    const otherMeanings = pool.map(v => v.meaning).filter(m => m !== correctMeaning);

    // Keep adding random wrong options until we have 4 total
    while (options.length < 4 && otherMeanings.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherMeanings.length);
      const randomMeaning = otherMeanings.splice(randomIndex, 1)[0]; // .splice removes & returns 1 item
      if (!options.includes(randomMeaning)) options.push(randomMeaning);
    }

    return options.sort(() => 0.5 - Math.random()); // Shuffle so correct isn't always first
  };

  // goToVocabulary: Initialize and navigate to the vocabulary module.
  const goToVocabulary = () => {
    // Shuffle the vocab list so we see words in a different order each time
    const shuffledVocab = [...citizenshipVocabulary].sort(() => 0.5 - Math.random());

    setVocabState({
      currentIndex: 0,
      score: 0,
      complete: false,
      questions: shuffledVocab,
      showFeedback: false,
      selectedOption: null,
      currentOptions: generateDefinitionOptions(shuffledVocab[0].meaning, shuffledVocab),
      history: [],
      mode: 'learn',
      searchQuery: ''
    });
    setView('vocabulary');
    setIsMenuOpen(false);
  };

  // handleVocabSelect: Called when the user picks a vocab definition.
  const handleVocabSelect = (option) => {
    if (vocabState.showFeedback) return; // Ignore if feedback is already showing

    const isCorrect = option === vocabState.questions[vocabState.currentIndex].meaning;
    setVocabState(prev => ({
      ...prev,                           // Keep all existing vocab state
      selectedOption: option,            // Record which option was tapped
      showFeedback: true,                // Show right/wrong feedback
      score: isCorrect ? prev.score + 1 : prev.score,
      history: [...prev.history, isCorrect ? 'correct' : 'incorrect']
    }));
  };

  // nextVocabQuestion: Advance to the next vocabulary word, or finish the quiz.
  const nextVocabQuestion = () => {
    if (vocabState.currentIndex < vocabState.questions.length - 1) {
      const nextIndex = vocabState.currentIndex + 1;
      const nextOptions = generateDefinitionOptions(
        vocabState.questions[nextIndex].meaning,
        vocabState.questions
      );
      setVocabState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        showFeedback: false,
        selectedOption: null,
        currentOptions: nextOptions
      }));
    } else {
      // No more words — mark vocab quiz as complete
      setVocabState(prev => ({ ...prev, complete: true }));
    }
  };

  // formatSmartAnswer: Intelligently formats the answer for flashcards.
  // Some questions ask "Name THREE branches..." — this function picks
  // the right number of answers from the semicolon-separated list.
  // Example input: "executive; legislative; judicial"
  // If question says "three", returns: "executive, legislative, and judicial"
  const formatSmartAnswer = (answerStr, question) => {
    // Detect how many answers the question requires
    const getCount = (q) => {
      const lowerCaseQ = q.toLowerCase();
      if (lowerCaseQ.includes('three') || lowerCaseQ.includes('3 ') || lowerCaseQ.includes(' 3')) return 3;
      if (lowerCaseQ.includes('two') || lowerCaseQ.includes('2 ') || lowerCaseQ.includes(' 2')) return 2;
      return 1; // Default: just show 1 answer
    };

    const count = getCount(question);

    // Split "answer1; answer2; answer3" into ["answer1", "answer2", "answer3"]
    const parts = answerStr.split(';').map(p => p.trim());

    if (parts.length <= 1) return parts[0]; // Only one answer, return it directly

    // Take only as many answers as the question requires
    const selected = parts.slice(0, count);

    // Format with proper English grammar:
    if (selected.length === 1) return selected[0];
    if (selected.length === 2) return `${selected[0]} and ${selected[1]}`;
    // 3 or more: "a, b, and c"
    return `${selected.slice(0, -1).join(', ')}, and ${selected[selected.length - 1]}`;
  };


  // ==========================================================
  // SECTION 9: WHAT THE APP RENDERS (the visual output)
  // ==========================================================
  // "return" sends JSX (HTML-like code) back to React to display.
  // The curly braces {} let us put JavaScript expressions inside JSX.

  return (
    <div className="app">

      {/* THE HEADER: The top bar with logo and navigation. Always visible. */}
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        goToHome={goToHome}
        goToQuestions={goToQuestions}
        startQuiz={startQuiz}
        goToSelection={goToSelection}
        testVersion={testVersion}
        view={view}
        totalQuestions={totalQuestions}
      />

      {/* Main content area — only ONE of these modules is shown at a time */}
      <main className="container main-content fade-in">

        {/* SELECTION SCREEN: The first screen asking "100 or 128 questions?" */}
        {/* The && operator means: "only render this if view === 'selection'" */}
        {view === 'selection' && (
          <SelectionScreen selectVersion={selectVersion} />
        )}

        {/* DASHBOARD: The home screen with all the study module cards */}
        {view === 'home' && (
          <Dashboard
            testVersion={testVersion}
            totalQuestions={totalQuestions}
            setView={setView}
            goToQuestions={goToQuestions}
            startQuiz={startQuiz}
            goToReading={goToReading}
            goToWriting={goToWriting}
            goToFlashcards={goToFlashcards}
            goToVocabulary={goToVocabulary}
          />
        )}

        {/* CIVICS STUDY: Browse and study all questions with audio */}
        {/* studyOrder.length > 0 makes sure the order array is ready before rendering */}
        {view === 'questions' && studyOrder.length > 0 && (
          <CivicsStudy
            totalQuestions={totalQuestions}
            testVersion={testVersion}
            goToHome={goToHome}
            isRandom={isRandom}
            setIsRandom={setIsRandom}
            audioSpeed={audioSpeed}
            setAudioSpeed={setAudioSpeed}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            studyOrder={studyOrder}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            setShowAnswer={setShowAnswer}
            questionsData={questionsData}
            translations={translations}
            speakText={speakText}
          />
        )}

        {/* FLASHCARDS: Interactive flip-card study mode */}
        {view === 'flashcards' && studyOrder.length > 0 && (
          <Flashcards
            goToHome={goToHome}
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            isRandom={isRandom}
            setIsRandom={setIsRandom}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            audioSpeed={audioSpeed}
            setAudioSpeed={setAudioSpeed}
            showAnswer={showAnswer}
            setShowAnswer={setShowAnswer}
            studyOrder={studyOrder}
            questionsData={questionsData}
            translations={translations}
            speakText={speakText}
            formatSmartAnswer={formatSmartAnswer}
          />
        )}

        {/* PRACTICE QUIZ: Timed multiple-choice test simulation */}
        {view === 'quiz' && (
          <PracticeQuiz
            testVersion={testVersion}
            goToHome={goToHome}
            quizState={quizState}
            setQuizState={setQuizState}
            currentOptions={currentOptions}
            setCurrentOptions={setCurrentOptions}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            isAnswerChecked={isAnswerChecked}
            setIsAnswerChecked={setIsAnswerChecked}
            handleOptionSelect={handleOptionSelect}
            nextQuizQuestion={nextQuizQuestion}
            startQuiz={startQuiz}
            speakText={speakText}
          />
        )}

        {/* VOCABULARY: Learn & quiz on citizenship keywords */}
        {view === 'vocabulary' && vocabState.questions.length > 0 && (
          <VocabularyModule
            goToHome={goToHome}
            vocabState={vocabState}
            setVocabState={setVocabState}
            generateDefinitionOptions={generateDefinitionOptions}
            citizenshipVocabulary={citizenshipVocabulary}
            handleVocabSelect={handleVocabSelect}
            nextVocabQuestion={nextVocabQuestion}
            goToVocabulary={goToVocabulary}
            speakText={speakText}
          />
        )}

        {/* READING PRACTICE: Listen and read sentences from the USCIS reading test */}
        {view === 'reading' && readingOrder.length > 0 && (
          <ReadingPractice
            goToHome={goToHome}
            readingIndex={readingIndex}
            readingSentences={readingSentences}
            readingOrder={readingOrder}
            isReadingRandom={isReadingRandom}
            setIsReadingRandom={setIsReadingRandom}
            setReadingIndex={setReadingIndex}
            audioSpeed={audioSpeed}
            setAudioSpeed={setAudioSpeed}
            speakText={speakText}
          />
        )}

        {/* WRITING PRACTICE: Listen to a sentence and type it out */}
        {view === 'writing' && writingOrder.length > 0 && (
          <WritingPractice
            goToHome={goToHome}
            writingIndex={writingIndex}
            writingSentences={writingSentences}
            writingOrder={writingOrder}
            isWritingRandom={isWritingRandom}
            setIsWritingRandom={setIsWritingRandom}
            setReadingIndex={setReadingIndex}
            setWritingIndex={setWritingIndex}
            writingInput={writingInput}
            setWritingInput={setWritingInput}
            isWritingChecked={isWritingChecked}
            setIsWritingChecked={setIsWritingChecked}
            audioSpeed={audioSpeed}
            setAudioSpeed={setAudioSpeed}
            speakText={speakText}
          />
        )}

        {/* N-400 PREP: Practice for the N-400 application form interview */}
        {view === 'n400' && (
          <N400Prep
            goToHome={goToHome}
            n400Category={n400Category}
            setN400Category={setN400Category}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            setShowAnswer={setShowAnswer}
            mockScript={mockInterview}
            tipsData={interviewTips}
            n400Data={n400Data}
            currentQuestionIndex={currentQuestionIndex}
            showAnswer={showAnswer}
            speakText={speakText}
          />
        )}

        {/* WORKBOOK: In-app PDF viewer for the USCivicsPass Workbook */}
        {view === 'workbook' && (
          <React.Suspense fallback={<p className="workbook-status">Loading workbook…</p>}>
            <WorkbookViewer goToHome={goToHome} />
          </React.Suspense>
        )}

      </main>

      {/* THE FOOTER: The bottom bar with copyright info. Always visible. */}
      <Footer />
    </div>
  );
};

export default App;
