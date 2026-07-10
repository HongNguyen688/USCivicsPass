// ============================================================
// FILE: modules/N400Prep.jsx  —  N-400 Application Preparation
// ============================================================
// The N-400 is the official U.S. citizenship application form.
// This module helps the user prepare for the personal interview
// questions the officer will ask based on that form.
//
// The module has FOUR tabs:
//
//   Tab 1 — "Vocabulary"
//     Flashcards for difficult words found on the N-400 form.
//     (e.g., "What does 'habitual' mean?")
//
//   Tab 2 — "Character"
//     Flashcards for "Have you ever...?" background questions
//     (e.g., "Have you ever been arrested?")
//
//   Tab 3 — "Mock Interview"
//     A full script of a sample citizenship interview to read through.
//     Each section of the script has an audio button to hear it.
//
//   Tab 4 — "Tips"
//     A grid of practical tips for the interview day.
//
// The active tab is stored in `n400Category` (from App.jsx state).
// Tabs 1 & 2 both use the same flashcard UI (they differ only in data).
//
// PROPS: (all from App.jsx)
//   goToHome              → navigate back to Dashboard
//   n400Category          → which tab is active ('Vocabulary', 'Character Questions', etc.)
//   setN400Category       → switch tabs
//   setCurrentQuestionIndex → reset to first question when switching tabs
//   setShowAnswer         → reset the flashcard flip when switching tabs
//   mockScript            → array of { id, section, text } for the interview script
//   tipsData              → array of { id, title, description } for tips
//   n400Data              → questions filtered by the current tab
//   currentQuestionIndex  → which flashcard we're on
//   showAnswer            → is the flashcard flipped to the answer side?
//   speakText             → speak text aloud
// ============================================================

import React from 'react';

const N400Prep = ({
  goToHome,
  n400Category,
  setN400Category,
  setCurrentQuestionIndex,
  setShowAnswer,
  mockScript,
  tipsData,
  n400Data,
  currentQuestionIndex,
  showAnswer,
  speakText
}) => {

  // Shortcut to the current N-400 flashcard question
  const currentCard = n400Data[currentQuestionIndex];

  // Helper: switch to a new tab and reset the flashcard state
  const switchTab = (tabName) => {
    setN400Category(tabName);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className="study-module n400-module">

      {/* ── PAGE HEADER + TAB BUTTONS ───────────────────────── */}
      <div className="module-header n400-specific-header">
        <div className="header-top-row">
          <button className="back-btn" onClick={goToHome}>← Back</button>
          <h2>N-400 Application Questions</h2>
        </div>

        {/* Tab switcher buttons.
            The 'active' CSS class highlights the currently selected tab. */}
        <div className="category-switcher">
          <button
            className={`switch-tab ${n400Category === 'Vocabulary' ? 'active' : ''}`}
            onClick={() => switchTab('Vocabulary')}
          >Vocabulary</button>

          <button
            className={`switch-tab ${n400Category === 'Character Questions' ? 'active' : ''}`}
            onClick={() => switchTab('Character Questions')}
          >Character</button>

          <button
            className={`switch-tab ${n400Category === 'Mock Interview' ? 'active' : ''}`}
            onClick={() => switchTab('Mock Interview')}
          >Mock Interview</button>

          <button
            className={`switch-tab ${n400Category === 'Tips' ? 'active' : ''}`}
            onClick={() => switchTab('Tips')}
          >Tips</button>
        </div>
      </div>

      {/* ============================================================
          TAB: MOCK INTERVIEW
          Shows the full interview script section by section.
          ============================================================ */}
      {n400Category === 'Mock Interview' ? (
        <div className="mock-interview-view fade-in">
          <div className="script-container">
            {/* .map() renders one "section card" for each item in the mockScript array */}
            {mockScript.map((item) => (
              <div key={item.id} className="script-section glass">
                <div className="script-header">
                  <h4 className="script-section-title">{item.section}</h4>
                  {/* Audio button to hear this section spoken aloud */}
                  <button className="audio-btn-small" onClick={() => speakText(item.text)}>🔊</button>
                </div>
                <p className="script-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

      ) : n400Category === 'Tips' ? (
        /* ============================================================
           TAB: INTERVIEW TIPS
           Shows a grid of helpful tips for the citizenship interview.
           ============================================================ */
        <div className="tips-view fade-in">
          <div className="tips-grid">
            {tipsData.map((tip) => (
              <div key={tip.id} className="tip-card glass">
                <h3>{tip.title}</h3>
                <p>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

      ) : (
        /* ============================================================
           TABS: VOCABULARY and CHARACTER QUESTIONS
           Both use the same flashcard UI — only the data differs.
           ============================================================ */
        <>
          {/* Progress counter */}
          <div className="progress">
            Question {currentQuestionIndex + 1} of {n400Data.length}
          </div>

          {/* ── FLASHCARD ───────────────────────────────────────── */}
          {/* Clicking the card flips it. The "flipped" class triggers CSS 3D rotation. */}
          <div className="flashcard-container main-flashcard-box">
            <div
              className={`flashcard ${showAnswer ? 'flipped' : ''}`}
              onClick={() => setShowAnswer(!showAnswer)}
            >

              {/* ── CARD FRONT: Question ─────────────────────────── */}
              <div className="card-front glass">
                <div className="flashcard-header">
                  <div className="card-side-label">Front</div>
                  <span className="card-category-badge">{currentCard.category}</span>
                </div>
                <div className="card-main-content">
                  <div className="text-content-wrapper">
                    <p className="flashcard-question-text">{currentCard.question}</p>
                  </div>
                  {/* e.stopPropagation() prevents the Listen click from also flipping the card */}
                  <button
                    className="audio-btn-floating"
                    onClick={(e) => { e.stopPropagation(); speakText(currentCard.question); }}
                  >🔊 Listen</button>
                </div>
                <div className="card-hint">CLICK TO SEE ANSWER</div>
              </div>

              {/* ── CARD BACK: Answer ────────────────────────────── */}
              <div className="card-back glass">
                <div className="flashcard-header">
                  <div className="card-side-label">Back</div>
                  <span className="card-category-badge">{currentCard.category}</span>
                </div>
                <div className="card-main-content">
                  <div className="text-content-wrapper">
                    <p className="flashcard-answer-text">{currentCard.answer}</p>
                  </div>
                  <button
                    className="audio-btn-floating"
                    onClick={(e) => { e.stopPropagation(); speakText(currentCard.answer); }}
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
                  setShowAnswer(false);
                }}
              >Previous</button>
            )}

            {/* Next Question — becomes "Start Over" after the last card.
                The % operator (modulo) wraps the index back to 0 after
                the last question: (lastIndex + 1) % length = 0          */}
            <button
              className="btn-primary"
              onClick={() => {
                setCurrentQuestionIndex(prev => (prev + 1) % n400Data.length);
                setShowAnswer(false);
              }}
            >
              {currentQuestionIndex === n400Data.length - 1 ? 'Start Over' : 'Next Question'}
            </button>

          </div>
        </>
      )}

    </div>
  );
};

export default N400Prep;
