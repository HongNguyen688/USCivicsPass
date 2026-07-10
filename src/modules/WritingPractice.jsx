// ============================================================
// FILE: modules/WritingPractice.jsx  —  Writing / Dictation Practice
// ============================================================
// This screen lets the user practice the Writing portion of the
// actual U.S. citizenship test.
//
// On the real test, the officer says a sentence and the applicant
// must WRITE it down correctly. This module simulates that:
//   1. The user clicks "Listen to Sentence" to hear a sentence
//   2. They type what they heard in the text box
//   3. They click "Check Answer" to see the correct sentence
//   4. They can click "Try Again" to retype it
//
// The correct answer is hidden until "Check Answer" is clicked,
// so the user is genuinely tested on what they heard.
//
// PROPS: (all from App.jsx)
//   goToHome           → navigate back to Dashboard
//   writingIndex       → current position in the writingOrder array
//   writingSentences   → array of sentence strings from JSON
//   writingOrder       → array of sentence indexes (shuffled or sequential)
//   isWritingRandom    → boolean: random mode on/off
//   setIsWritingRandom → toggle random mode
//   setReadingIndex    → (also resets reading module index — shared state)
//   setWritingIndex    → advance/go back
//   writingInput       → the text the user has typed
//   setWritingInput    → update the typed text
//   isWritingChecked   → has the user clicked "Check Answer" yet?
//   setIsWritingChecked → toggle answer visibility
//   audioSpeed / setAudioSpeed → speech speed
//   speakText          → speak text aloud
// ============================================================

import React from 'react';

const WritingPractice = ({
  goToHome,
  writingIndex,
  writingSentences,
  writingOrder,
  isWritingRandom,
  setIsWritingRandom,
  setReadingIndex,
  setWritingIndex,
  writingInput,
  setWritingInput,
  isWritingChecked,
  setIsWritingChecked,
  audioSpeed,
  setAudioSpeed,
  speakText
}) => {

  // The current sentence to practice (using the order indirection)
  const currentSentence = writingSentences[writingOrder[writingIndex]];

  // Is there at least one non-space character typed?
  // .trim() removes leading/trailing spaces before checking length
  const hasTypedSomething = writingInput.trim().length > 0;

  // Are we on the last sentence?
  const isLastSentence = writingIndex === writingSentences.length - 1;

  // Helper: go to the next sentence and reset the input/check state
  const goToNextSentence = () => {
    setWritingIndex(prev => prev + 1);
    setWritingInput('');
    setIsWritingChecked(false);
  };

  // Helper: reset the input so user can try the same sentence again
  const tryAgain = () => {
    setWritingInput('');
    setIsWritingChecked(false);
  };

  return (
    <div className="study-module writing-module fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="module-header">
        <button className="back-btn" onClick={goToHome}>← Back</button>
        <h2>Writing Practice</h2>
      </div>

      {/* ── SETTINGS PANEL ──────────────────────────────────── */}
      <div className="study-controls card glass">

        {/* Sequential vs Random toggle */}
        <div className="control-group">
          <label>Question Order:</label>
          <div className="speed-selector">
            <button
              className={`toggle-btn ${!isWritingRandom ? 'active' : ''}`}
              onClick={() => setIsWritingRandom(false)}
            >Sequential</button>
            <button
              className={`toggle-btn ${isWritingRandom ? 'active' : ''}`}
              onClick={() => setIsWritingRandom(true)}
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

      {/* ── MAIN WRITING CARD ───────────────────────────────── */}
      <div className="unified-study-card writing-card glass fade-in">

        {/* Card top info bar */}
        <div className="card-top-info">
          <span className="card-category-badge">WRITING TEST</span>
          <span className="question-number">
            Sentence {writingIndex + 1} / {writingSentences.length}
          </span>
        </div>

        <div className="writing-content">

          {/* Step 1: Listen to the sentence.
              The sentence text is intentionally NOT shown here,
              so the user must rely on listening.               */}
          <button
            className="audio-btn main-audio"
            onClick={() => speakText(currentSentence)}
          >
            <span className="audio-icon">🔊</span>
            <span>Listen to Sentence</span>
          </button>

          {/* Step 2: Type what you heard in this text box.
              The `disabled` prop makes the textarea read-only
              after the user has already checked the answer.   */}
          <div className="writing-input-area">
            <textarea
              className="writing-textarea"
              placeholder="Type the sentence you hear..."
              value={writingInput}
              onChange={(e) => setWritingInput(e.target.value)}
              disabled={isWritingChecked}
            ></textarea>
          </div>

          {/* Step 3: Show the correct sentence ONLY after "Check Answer" is clicked.
              The 'fade-in' CSS class makes it appear with a smooth animation. */}
          {isWritingChecked && (
            <div className="writing-feedback fade-in">
              <div className="feedback-label">Correct Sentence:</div>
              <p className="correct-sentence">{currentSentence}</p>
            </div>
          )}

        </div>
      </div>

      {/* ── NAVIGATION BUTTONS ──────────────────────────────── */}
      <div className="controls">

        {/* Previous — only show when not on the first sentence */}
        {writingIndex > 0 && (
          <button
            className="btn-secondary"
            onClick={() => {
              setWritingIndex(prev => prev - 1);
              setWritingInput('');
              setIsWritingChecked(false);
            }}
          >Previous</button>
        )}

        {/* Middle button area — changes depending on the state:
            - If not checked yet AND user typed something → "Check Answer"
            - If already checked → "Try Again"
            - (If not checked and nothing typed → no middle button) */}
        {!isWritingChecked ? (
          hasTypedSomething && (
            <button
              className="btn-primary"
              onClick={() => setIsWritingChecked(true)} // Reveal the answer
            >Check Answer</button>
          )
        ) : (
          <button className="btn-secondary" onClick={tryAgain}>Try Again</button>
        )}

        {/* Right side: "Next" or "Start Again" on the last sentence */}
        {isLastSentence ? (
          <button
            className="btn-primary highlight"
            onClick={() => {
              setWritingIndex(0);
              setWritingInput('');
              setIsWritingChecked(false);
            }}
          >Start Again</button>
        ) : (
          <button className="btn-primary" onClick={goToNextSentence}>Next</button>
        )}

      </div>
    </div>
  );
};

export default WritingPractice;
