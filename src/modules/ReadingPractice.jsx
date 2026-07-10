// ============================================================
// FILE: modules/ReadingPractice.jsx  —  Reading Test Practice
// ============================================================
// This screen lets the user practice the Reading portion of the
// actual U.S. citizenship test.
//
// On the real test, the officer reads ONE sentence aloud and the
// applicant must read it back correctly. Here, the user can:
//   - Read through all 40 official USCIS reading sentences
//   - Click "Listen" to hear the correct pronunciation
//   - Go in sequential or random order
//
// HOW THE ORDER WORKS:
//   `readingOrder` is an array like [0, 1, 2, ...] (or shuffled).
//   `readingIndex` is which POSITION in that array we're at.
//   So the ACTUAL sentence index is: readingOrder[readingIndex]
//   And the sentence text is: readingSentences[readingOrder[readingIndex]]
//
// PROPS: (all from App.jsx)
//   goToHome          → navigate back to Dashboard
//   readingIndex      → current position in the readingOrder array
//   readingSentences  → array of sentence strings from JSON
//   readingOrder      → array of sentence indexes (shuffled or sequential)
//   isReadingRandom   → boolean: random mode on/off
//   setIsReadingRandom → toggle random mode
//   setReadingIndex   → advance/go back
//   audioSpeed / setAudioSpeed → speech speed
//   speakText         → speak text aloud
// ============================================================

import React from 'react';

const ReadingPractice = ({
  goToHome,
  readingIndex,
  readingSentences,
  readingOrder,
  isReadingRandom,
  setIsReadingRandom,
  setReadingIndex,
  audioSpeed,
  setAudioSpeed,
  speakText
}) => {

  // The current sentence to display (using the order indirection)
  const currentSentence = readingSentences[readingOrder[readingIndex]];

  // Are we on the very first sentence? (used to disable the Previous button)
  const isFirstSentence = readingIndex === 0;

  // Are we on the very last sentence? (used to change the Next button to "Learn Again")
  const isLastSentence = readingIndex === readingSentences.length - 1;

  return (
    <div className="study-module reading-module fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="module-header">
        <button className="back-btn" onClick={goToHome}>← Back</button>
        <h2>Reading Practice</h2>
      </div>

      {/* ── SETTINGS PANEL ──────────────────────────────────── */}
      <div className="study-controls card glass">

        {/* Sequential vs Random toggle */}
        <div className="control-group">
          <label>Question Order:</label>
          <div className="speed-selector">
            <button
              className={`toggle-btn ${!isReadingRandom ? 'active' : ''}`}
              onClick={() => setIsReadingRandom(false)}
            >Sequential</button>
            <button
              className={`toggle-btn ${isReadingRandom ? 'active' : ''}`}
              onClick={() => setIsReadingRandom(true)}
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

      {/* ── MAIN SENTENCE CARD ──────────────────────────────── */}
      <div className="unified-study-card reading-card glass fade-in">

        {/* Card top info: category badge and sentence counter */}
        <div className="card-top-info">
          <span className="card-category-badge">READING TEST</span>
          <span className="question-number">
            Sentence {readingIndex + 1} / {readingSentences.length}
          </span>
        </div>

        {/* The sentence text and Listen button */}
        <div className="reading-content">
          <h3 className="reading-text main-sentence">{currentSentence}</h3>

          <button
            className="audio-btn main-audio"
            onClick={() => speakText(currentSentence)}
          >
            <span className="audio-icon">🔊</span>
            <span>Listen</span>
          </button>
        </div>

        {/* Helpful tip at the bottom of the card */}
        <div className="study-footer">
          <p className="study-tip">💡 Read the sentence aloud, then listen to the correct pronunciation.</p>
        </div>

      </div>

      {/* ── NAVIGATION BUTTONS ──────────────────────────────── */}
      <div className="controls">

        {/* Previous button — disabled when on the first sentence */}
        <button
          className="btn-secondary"
          onClick={() => setReadingIndex(prev => Math.max(0, prev - 1))}
          disabled={isFirstSentence}
        >Previous</button>

        {/* "Learn Again" on the last sentence, "Next Sentence" otherwise */}
        {isLastSentence ? (
          <button
            className="btn-primary"
            onClick={() => setReadingIndex(0)} // Jump back to the start
          >Learn Again</button>
        ) : (
          <button
            className="btn-primary"
            onClick={() => setReadingIndex(prev => Math.min(readingSentences.length - 1, prev + 1))}
          >Next Sentence</button>
        )}

      </div>
    </div>
  );
};

export default ReadingPractice;
