// ============================================================
// FILE: modules/CivicsStudy.jsx  —  Browse All Questions
// ============================================================
// This screen lets the user study the official civics questions
// one by one, with full audio support and optional translations.
//
// HOW NAVIGATION WORKS HERE:
//   The questions are NOT shown in their original 1, 2, 3... order.
//   Instead, App.jsx creates a `studyOrder` array like [0,1,2,3...]
//   (or shuffled like [42,7,13,...] in random mode).
//   We use `studyOrder[currentQuestionIndex]` to find which actual
//   question to look up in `questionsData`.
//
//   Example:
//     studyOrder = [3, 0, 7, 1]   ← the order to show questions
//     currentQuestionIndex = 1    ← we're on the 2nd position
//     studyOrder[1] = 0           ← so show questionsData[0]
//
// PROPS: (all passed down from App.jsx)
//   totalQuestions        → how many questions total (100 or 128)
//   testVersion           → '100' or '128'
//   goToHome              → go back to Dashboard
//   isRandom              → boolean: are we in random mode?
//   setIsRandom           → toggle random mode
//   audioSpeed            → current playback speed (0.65/0.85/1.0)
//   setAudioSpeed         → change the playback speed
//   selectedLanguage      → which subtitle language ('none','es','vi','ko','zh')
//   setSelectedLanguage   → change the subtitle language
//   studyOrder            → array of question indexes in display order
//   currentQuestionIndex  → which position in studyOrder we're at
//   setCurrentQuestionIndex → advance/go back
//   setShowAnswer         → used to reset flashcard flip state
//   questionsData         → the full array of question objects
//   translations          → object with Spanish/Vietnamese/etc. subtitles
//   speakText             → function to speak a string out loud
// ============================================================

import React from 'react';

const CivicsStudy = ({
  totalQuestions,
  testVersion,
  goToHome,
  isRandom,
  setIsRandom,
  audioSpeed,
  setAudioSpeed,
  selectedLanguage,
  setSelectedLanguage,
  studyOrder,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  setShowAnswer,
  questionsData,
  translations,
  speakText
}) => {

  // Shortcut: the actual question object for the current card.
  // Instead of writing questionsData[studyOrder[currentQuestionIndex]] every time,
  // we compute it once and store it in a variable.
  const currentQuestion = questionsData[studyOrder[currentQuestionIndex]];

  // Does a translation exist for the currently shown question?
  // The ?. is "optional chaining" — it safely checks if the property exists
  // before trying to access it. Without it, we'd get an error if translations
  // doesn't have an entry for this question.
  const currentTranslation = selectedLanguage !== 'none'
    ? translations[currentQuestion.question]?.[selectedLanguage]
    : null;

  return (
    <div className="study-module fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="module-header">
        <button className="back-btn" onClick={goToHome}>← Back</button>
        <h2>{totalQuestions} Questions Guide ({testVersion === '128' ? '2020' : '2008'})</h2>
      </div>

      {/* ── SETTINGS PANEL ──────────────────────────────────── */}
      <div className="study-controls card glass">

        {/* Language Selector dropdown */}
        <div className="control-group">
          <label>Language:</label>
          <select
            className="language-dropdown"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="none">English Only</option>
            <option value="es">Spanish</option>
            <option value="vi">Vietnamese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div className="control-divider"></div>

        {/* Sequential vs. Random question order toggle */}
        <div className="control-group">
          <label>Question Order:</label>
          <div className="speed-selector">
            <button
              className={`toggle-btn ${!isRandom ? 'active' : ''}`}
              onClick={() => setIsRandom(false)}
            >Sequential</button>
            <button
              className={`toggle-btn ${isRandom ? 'active' : ''}`}
              onClick={() => setIsRandom(true)}
            >Random</button>
          </div>
        </div>

        <div className="control-divider"></div>

        {/* Audio speed selector */}
        <div className="control-group">
          <label>Speed:</label>
          <div className="speed-selector">
            <button onClick={() => setAudioSpeed(0.65)} className={audioSpeed === 0.65 ? 'active' : ''}>Slower</button>
            <button onClick={() => setAudioSpeed(0.85)} className={audioSpeed === 0.85 ? 'active' : ''}>Normal</button>
            <button onClick={() => setAudioSpeed(1.0)}  className={audioSpeed === 1.0  ? 'active' : ''}>Faster</button>
          </div>
        </div>

      </div>

      {/* ── MAIN QUESTION CARD ──────────────────────────────── */}
      <div className="civics-study-card glass fade-in">

        {/* Top info bar: category badge and question number */}
        <div className="card-top-info">
          <span className="card-category-badge">{currentQuestion.category}</span>
          <span className="card-q-number">Question {currentQuestionIndex + 1} / {totalQuestions}</span>
        </div>

        <div className="study-content-layout">

          {/* ── QUESTION SECTION ──────────────────────────────── */}
          <div className="study-section question-section">
            <div className="section-header">
              <h3>Official Question</h3>
              {/* Clicking 🔊 speaks the question text out loud */}
              <button className="audio-btn-small" onClick={() => speakText(currentQuestion.question)}>🔊</button>
            </div>

            {/* The question text */}
            <p className="study-question-text">{currentQuestion.question}</p>

            {/* Show the translated subtitle if:
                1. A language is selected (not 'none')
                2. A translation actually exists for this question  */}
            {currentTranslation && (
              <p className="translated-subtitle-text">{currentTranslation.q}</p>
            )}
          </div>

          <div className="section-divider"></div>

          {/* ── ANSWERS SECTION ───────────────────────────────── */}
          <div className="study-section answer-section">
            <div className="section-header">
              <h3>All Acceptable Answers</h3>
              <button className="audio-btn-small" onClick={() => speakText(currentQuestion.answer)}>🔊</button>
            </div>

            <div className="answer-scrollview">
              <ul className="full-answer-list">
                {/* The answers are stored as a single string separated by semicolons.
                    We split them into an array and use .map() to render each one.
                    .map() transforms each item in an array into a JSX element.
                    The `key` prop helps React track list items efficiently. */}
                {currentQuestion.answer.split(';').map((answer, idx) => (
                  <li key={idx} className="answer-list-item">
                    <span>{answer.trim()}</span>

                    {/* Show the translated answer line for this specific answer,
                        if a translation exists. The .split() breaks the translated
                        answer string by semicolons, then [idx] picks the matching line. */}
                    {currentTranslation && (
                      <div className="translated-subtitle-text">
                        {currentTranslation.a.split(/;|；/)[idx]?.trim()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* ── NAVIGATION BUTTONS ──────────────────────────────── */}
      <div className="controls">

        {/* Previous button — only show if we're not on the very first question */}
        {currentQuestionIndex > 0 && (
          <button
            className="btn-secondary"
            onClick={() => {
              setCurrentQuestionIndex(prev => prev - 1);
              setShowAnswer(false); // Reset flashcard flip state
            }}
          >Previous</button>
        )}

        {/* Next button — changes to "Start Again" on the last question */}
        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            className="btn-primary"
            onClick={() => {
              setCurrentQuestionIndex(prev => prev + 1);
              setShowAnswer(false);
            }}
          >Next Question</button>
        ) : (
          <button
            className="btn-primary highlight-start-again"
            onClick={() => {
              setCurrentQuestionIndex(0); // Jump back to the beginning
              setShowAnswer(false);
            }}
          >Start Again</button>
        )}

      </div>
    </div>
  );
};

export default CivicsStudy;
