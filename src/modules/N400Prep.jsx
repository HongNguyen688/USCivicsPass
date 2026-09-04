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

import React, { useState, useEffect } from 'react';

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
  speakText,
  speakDialogue,
  stopDialogue,
  parseDialogue
}) => {

  // Which Mock Interview section is playing, and where it has got to.
  // Ephemeral playback state, so it lives here rather than in App.
  //   turn  — index of the line being spoken
  //   phase — 'speaking' while a line plays, 'waiting' during the silence
  //           left for the learner to answer
  const [playing, setPlaying] = useState({ sectionId: null, turn: null, phase: null });

  // Leaving the Mock Interview tab stops the audio. App also cancels speech on
  // tab change; this clears the button back to ▶ so the UI matches the silence.
  useEffect(() => {
    return () => {
      stopDialogue?.();
      setPlaying({ sectionId: null, turn: null, phase: null });
    };
  }, [n400Category, stopDialogue]);

  // Play a section, or stop it if it is the one already playing.
  const toggleSection = (item) => {
    if (playing.sectionId === item.id) {
      stopDialogue();
      setPlaying({ sectionId: null, turn: null, phase: null });
      return;
    }
    setPlaying({ sectionId: item.id, turn: 0, phase: 'speaking' });
    speakDialogue(item, (turn, phase) => {
      setPlaying(turn === null
        ? { sectionId: null, turn: null, phase: null }
        : { sectionId: item.id, turn, phase });
    });
  };

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
            {mockScript.map((item) => {
              const turns = parseDialogue(item.text);
              const isPlaying = playing.sectionId === item.id;

              return (
                <div key={item.id} className="script-section glass">
                  <div className="script-header">
                    <h4 className="script-section-title">{item.section}</h4>
                    {/* Plays the section as a conversation — pre-rendered
                        neural-voice audio, a man for the officer and a woman
                        for the applicant, with a pause after each question so
                        you can answer out loud. */}
                    <button
                      className={`audio-btn-small ${isPlaying ? 'is-playing' : ''}`}
                      onClick={() => toggleSection(item)}
                      aria-label={isPlaying ? 'Stop the interview' : 'Play the interview'}
                    >{isPlaying ? '⏹' : '▶'}</button>
                  </div>

                  <div className="script-text">
                    {turns.map((turn, i) => {
                      const active = isPlaying && playing.turn === i;
                      return (
                        <p
                          key={i}
                          className={`script-line script-line--${turn.speaker}` +
                            (active ? ` is-active is-${playing.phase}` : '')}
                        >
                          <span className="script-speaker">
                            {turn.speaker === 'officer' ? 'Officer' : 'Applicant'}
                            {turn.direction && ` ${turn.direction}`}:
                          </span>{' '}
                          {turn.text}
                        </p>
                      );
                    })}
                  </div>

                  {/* Shown during the silence after a question. */}
                  {isPlaying && playing.phase === 'waiting' && (
                    <p className="script-waiting">🎤 Your turn — answer out loud…</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      ) : n400Category === 'Tips' ? (
        /* ============================================================
           TAB: INTERVIEW TIPS
           Shows a grid of helpful tips for the citizenship interview.
           ============================================================ */
        <div className="tips-view fade-in">
          <p className="tips-intro">
            These tips come from how the real interview works. Read them before you start
            studying. Then read them again the week before your interview.
          </p>

          {/* The tips mirror the workbook, which groups them into four sections
              (interview, studying, interview day, mistakes). tipsData is a flat
              array in book order, so we render each section in the order its
              category first appears rather than hard-coding the section names. */}
          {tipsData
            .map((tip) => tip.category)
            .filter((category, i, all) => all.indexOf(category) === i)
            .map((category) => (
              <section key={category} className="tips-section">
                <h3 className="tips-section-title">{category}</h3>
                <div className="tips-grid">
                  {tipsData
                    .filter((tip) => tip.category === category)
                    .map((tip) => (
                      <div key={tip.id} className="tip-card glass">
                        <h3>{tip.title}</h3>
                        <p>{tip.description}</p>
                        {/* Only the "Bring these documents" tip carries a checklist */}
                        {tip.items && (
                          <ul className="tip-checklist">
                            {tip.items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            ))}
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
