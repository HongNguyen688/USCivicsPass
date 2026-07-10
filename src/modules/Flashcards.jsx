// ============================================================
// FILE: modules/Flashcards.jsx  —  Interactive Flip Cards
// ============================================================
// This screen shows civics questions as virtual flashcards.
// Click a card to flip it from QUESTION → ANSWER (and back).
//
// HOW THE FLIP ANIMATION WORKS:
//   The card has two "faces": .card-front and .card-back.
//   CSS handles the 3D flip animation using transform: rotateY().
//   When `showAnswer` is true, we add the CSS class "flipped" to
//   the card, which triggers the animation via CSS rules in index.css.
//
// Same navigation logic as CivicsStudy.jsx — see that file for
// an explanation of how studyOrder + currentQuestionIndex works.
//
// PROPS: (all from App.jsx)
//   goToHome              → back to Dashboard
//   currentQuestionIndex  → which position in studyOrder we're at
//   totalQuestions        → total number of questions (100 or 128)
//   selectedLanguage      → subtitle language code
//   setSelectedLanguage   → change subtitle language
//   isRandom              → boolean random mode
//   setIsRandom           → toggle random mode
//   setCurrentQuestionIndex → advance/go back
//   audioSpeed / setAudioSpeed → speech speed control
//   showAnswer            → is the card flipped to show the answer?
//   setShowAnswer         → flip/unflip the card
//   studyOrder            → array of question indexes in display order
//   questionsData         → full array of question objects
//   translations          → subtitle translations object
//   speakText             → speak text aloud
//   formatSmartAnswer     → format multi-answer strings intelligently
// ============================================================

import React from 'react';

const Flashcards = ({
  goToHome,
  currentQuestionIndex,
  totalQuestions,
  selectedLanguage,
  setSelectedLanguage,
  isRandom,
  setIsRandom,
  setCurrentQuestionIndex,
  audioSpeed,
  setAudioSpeed,
  showAnswer,
  setShowAnswer,
  studyOrder,
  questionsData,
  translations,
  speakText,
  formatSmartAnswer
}) => {

  // Shortcut to the current question object (same pattern as CivicsStudy.jsx)
  const currentQuestion = questionsData[studyOrder[currentQuestionIndex]];

  // The formatted answer — handles "Name THREE..." questions
  // by joining the right number of semicolon-separated answers
  const formattedAnswer = formatSmartAnswer(currentQuestion.answer, currentQuestion.question);

  // The translation for this question, or null if none selected / available
  const currentTranslation = selectedLanguage !== 'none'
    ? translations[currentQuestion.question]?.[selectedLanguage]
    : null;

  return (
    <div className="study-module flashcard-module fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="module-header">
        <button className="back-btn" onClick={goToHome}>← Back</button>
        <h2>Civics Flash Cards</h2>
        <div className="progress">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
      </div>

      {/* ── SETTINGS PANEL ──────────────────────────────────── */}
      <div className="study-controls card glass">

        {/* Language subtitle selector */}
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

        {/* Sequential vs Random toggle */}
        <div className="control-group">
          <label>Order:</label>
          <div className="speed-selector">
            <button
              className={!isRandom ? 'active' : ''}
              onClick={() => { setIsRandom(false); setCurrentQuestionIndex(0); }}
            >Sequential</button>
            <button
              className={isRandom ? 'active' : ''}
              onClick={() => { setIsRandom(true); setCurrentQuestionIndex(0); }}
            >Random</button>
          </div>
        </div>

        <div className="control-divider"></div>

        {/* Audio speed selector */}
        <div className="control-group">
          <label>Speed:</label>
          <div className="speed-selector">
            <button className={audioSpeed === 0.65 ? 'active' : ''} onClick={() => setAudioSpeed(0.65)}>Slower</button>
            <button className={audioSpeed === 0.85 ? 'active' : ''} onClick={() => setAudioSpeed(0.85)}>Normal</button>
            <button className={audioSpeed === 1.0  ? 'active' : ''} onClick={() => setAudioSpeed(1.0)}>Faster</button>
          </div>
        </div>

      </div>

      {/* ── FLASHCARD ───────────────────────────────────────── */}
      {/* Clicking anywhere on the card container flips it.
          The "flipped" CSS class triggers the 3D rotation animation. */}
      <div className="flashcard-container main-flashcard-box" onClick={() => setShowAnswer(!showAnswer)}>
        <div className={`flashcard ${showAnswer ? 'flipped' : ''}`}>

          {/* ── CARD FRONT: Shows the Question ─────────────── */}
          <div className="card-front glass">
            <div className="flashcard-header">
              <div className="card-side-label">Front</div>
              <span className="card-category-badge">{currentQuestion.category}</span>
            </div>

            <div className="card-main-content">
              <div className="text-content-wrapper">
                <p className="flashcard-question-text">{currentQuestion.question}</p>

                {/* Show subtitle translation if available */}
                {currentTranslation && (
                  <p className="translated-subtitle-text">{currentTranslation.q}</p>
                )}
              </div>

              {/* e.stopPropagation() prevents this click from also triggering
                  the card-flip click handler on the parent div. Without it,
                  pressing Listen would both speak AND flip the card.           */}
              <button
                className="audio-btn-floating"
                onClick={(e) => { e.stopPropagation(); speakText(currentQuestion.question); }}
              >🔊 Listen</button>
            </div>

            <div className="card-hint">CLICK TO SEE ANSWER</div>
          </div>

          {/* ── CARD BACK: Shows the Answer ────────────────── */}
          <div className="card-back glass">
            <div className="flashcard-header">
              <div className="card-side-label">Back</div>
              <span className="card-category-badge">{currentQuestion.category}</span>
            </div>

            <div className="card-main-content">
              <div className="text-content-wrapper">
                <p className="flashcard-answer-text">{formattedAnswer}</p>

                {/* Show only the FIRST translated answer (index [0]) on the back */}
                {currentTranslation && (
                  <p className="translated-subtitle-text answer-sub">
                    {currentTranslation.a.split(/;|；/)[0]}
                  </p>
                )}
              </div>

              <button
                className="audio-btn-floating"
                onClick={(e) => { e.stopPropagation(); speakText(formattedAnswer); }}
              >🔊 Listen</button>
            </div>

            <div className="card-hint">CLICK TO SEE QUESTION</div>
          </div>

        </div>
      </div>

      {/* ── NAVIGATION BUTTONS ──────────────────────────────── */}
      <div className="controls">

        {/* Previous — only visible when not on the first card */}
        {currentQuestionIndex > 0 && (
          <button
            className="btn-secondary"
            onClick={() => {
              setCurrentQuestionIndex(prev => prev - 1);
              setShowAnswer(false); // Always show the question side on a new card
            }}
          >Previous</button>
        )}

        {/* Next Card — becomes "Start Again" on the last card */}
        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            className="btn-primary"
            onClick={() => {
              setCurrentQuestionIndex(prev => prev + 1);
              setShowAnswer(false);
            }}
          >Next Card</button>
        ) : (
          <button
            className="btn-primary highlight-start-again"
            onClick={() => {
              setCurrentQuestionIndex(0);
              setShowAnswer(false);
            }}
          >Start Again</button>
        )}

      </div>
    </div>
  );
};

export default Flashcards;
