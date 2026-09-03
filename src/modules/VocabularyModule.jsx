// ============================================================
// FILE: modules/VocabularyModule.jsx  —  Vocabulary Study & Quiz
// ============================================================
// This module teaches citizenship vocabulary words.
// It has TWO modes the user can switch between:
//
//   MODE 1 — "Learn" (Glossary):
//     Shows all vocabulary words in a searchable grid.
//     Each card shows the word, its meaning, and Listen buttons.
//
//   MODE 2 — "Self-Test" (Quiz):
//     Shows one word at a time and asks "What does X mean?"
//     with 4 multiple-choice definitions.
//     Keeps score and shows results when all words are done.
//
// The active mode is stored in vocabState.mode ('learn' or 'test').
//
// PROPS: (all from App.jsx)
//   goToHome                  → navigate back to Dashboard
//   vocabState                → big object holding all vocab session data
//                               (see App.jsx for full description)
//   setVocabState             → update any part of vocabState
//   generateDefinitionOptions → creates 4 multiple-choice options
//   citizenshipVocabulary     → the full unshuffled vocab list (for Learn mode)
//   handleVocabSelect         → called when user picks an answer in test mode
//   nextVocabQuestion         → advance to the next word in test mode
//   goToVocabulary            → restart a fresh vocabulary session
//   speakText                 → speak text aloud
// ============================================================

import React from 'react';

const VocabularyModule = ({
  goToHome,
  vocabState,
  setVocabState,
  generateDefinitionOptions,
  citizenshipVocabulary,
  handleVocabSelect,
  nextVocabQuestion,
  goToVocabulary,
  speakText
}) => {

  // Shortcut to the current vocab word in test mode
  const currentWord = vocabState.questions[vocabState.currentIndex];

  return (
    <div className="study-module vocabulary-module fade-in">

      {/* ── PAGE HEADER + MODE TABS ──────────────────────────── */}
      <div className="module-header">
        <button className="back-btn" onClick={goToHome}>← Back</button>
        <h2>Citizenship Vocabulary</h2>

        {/* Mode switcher: "Learn" or "Self-Test" */}
        <div className="mode-selector">

          {/* Learn (Glossary) mode button */}
          <button
            className={`mode-btn ${vocabState.mode === 'learn' ? 'active' : ''}`}
            onClick={() => setVocabState(prev => ({ ...prev, mode: 'learn' }))}
          >Learn</button>

          {/* Self-Test mode button — also resets the quiz when clicked */}
          <button
            className={`mode-btn ${vocabState.mode === 'test' ? 'active' : ''}`}
            onClick={() => setVocabState(prev => ({
              ...prev,              // Keep existing state
              mode: 'test',
              currentIndex: 0,     // Start from word 1
              score: 0,            // Reset score
              complete: false,     // Mark quiz as not done
              showFeedback: false,
              selectedOption: null,
              // Generate fresh answer choices for the first word
              currentOptions: generateDefinitionOptions(prev.questions[0].meaning, prev.questions),
              history: []          // Clear answer history
            }))}
          >Self-Test</button>

        </div>
      </div>

      {/* ============================================================
          LEARN MODE: Searchable glossary of all vocabulary words
          ============================================================ */}
      {vocabState.mode === 'learn' ? (
        <div className="glossary-view fade-in">

          {/* Search bar to filter words by keyword */}
          <div className="search-bar card glass">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search keywords or phrases..."
              value={vocabState.searchQuery}
              onChange={(e) => setVocabState(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
            {/* Show a clear (✕) button only when there is text in the search box */}
            {vocabState.searchQuery && (
              <button
                className="clear-search"
                onClick={() => setVocabState(prev => ({ ...prev, searchQuery: '' }))}
              >✕</button>
            )}
          </div>

          {/* The glossary follows the workbook's Part 5 exactly: sections A-D in
              book order, then the app's own extra words as section E. Sections
              come out of the data in that order already, so we group rather than
              sort — the JSON is the running order.

              Section D is the official reading and writing word bank: words to
              recognise and spell, with no definitions in the book. Those render
              as compact chips grouped by their list, not as definition cards. */}
          {(() => {
            const query = vocabState.searchQuery.toLowerCase();
            const matches = citizenshipVocabulary.filter(item =>
              item.word.toLowerCase().includes(query) ||
              item.meaning.toLowerCase().includes(query)
            );

            if (!matches.length) {
              return <p className="glossary-empty">No words match “{vocabState.searchQuery}”.</p>;
            }

            // Group into sections, keeping the order they appear in the data.
            const sections = [];
            matches.forEach(item => {
              const name = item.section || 'Vocabulary';
              let section = sections.find(s => s.name === name);
              if (!section) sections.push((section = { name, items: [] }));
              section.items.push(item);
            });

            return sections.map(section => (
              <section key={section.name} className="glossary-section">
                <h3 className="glossary-section-title">
                  {section.name}
                  <span className="glossary-count">{section.items.length}</span>
                </h3>

                {section.items[0].meaning ? (
                  <div className="glossary-grid">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="glossary-card glass fade-in">
                        <div className="glossary-word-container">
                          <h3 className="glossary-word">{item.word}</h3>
                          <button className="audio-btn-small" onClick={() => speakText(item.word)}>🔊</button>
                        </div>
                        <p className="glossary-meaning">{item.meaning}</p>
                        <button
                          className="listen-meaning-btn"
                          onClick={() => speakText(item.meaning)}
                        >
                          <span className="icon">🔊</span> Listen to meaning
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Word bank: chips grouped by the book's own list headings
                     ("Reading test words — Holidays", and so on). */
                  Object.entries(
                    section.items.reduce((groups, item) => {
                      const key = item.group || 'Words';
                      (groups[key] = groups[key] || []).push(item);
                      return groups;
                    }, {})
                  ).map(([groupName, words]) => (
                    <div key={groupName} className="wordbank-group">
                      <h4 className="wordbank-group-title">{groupName}</h4>
                      <div className="wordbank-chips">
                        {words.map((item, idx) => (
                          <button
                            key={idx}
                            className="wordbank-chip"
                            onClick={() => speakText(item.word)}
                            title="Listen"
                          >{item.word}</button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </section>
            ));
          })()}

        </div>

      ) : (
        /* ============================================================
           SELF-TEST MODE: multiple-choice vocabulary quiz
           ============================================================ */
        !vocabState.complete ? (
          <>
            {/* ── QUESTION CARD ─────────────────────────────────── */}
            <div className="unified-study-card vocab-card glass fade-in">
              <div className="card-top-info">
                <span className="card-category-badge">INTERVIEW KEYWORDS</span>
                <span className="question-number">
                  Question {vocabState.currentIndex + 1} / {vocabState.questions.length}
                </span>
              </div>

              <div className="vocab-content">
                {/* The question text */}
                <h3 className="vocab-question-text">
                  What does "<span className="highlight-word">{currentWord.word}</span>" mean?
                </h3>
                <button
                  className="audio-btn"
                  onClick={() => speakText(`What does ${currentWord.word} mean?`)}
                >
                  🔊 Listen to Question
                </button>

                {/* 4 multiple-choice answer buttons */}
                <div className="vocab-options-grid">
                  {vocabState.currentOptions.map((option, idx) => {
                    const isSelected = vocabState.selectedOption === option;
                    const isCorrectAnswer = option === currentWord.meaning;

                    // Determine the CSS class for this option based on state:
                    let optionClass = "";
                    if (vocabState.showFeedback) {
                      if (isCorrectAnswer) optionClass = "correct";         // Always highlight right answer green
                      else if (isSelected) optionClass = "incorrect";       // Highlight selected wrong answer red
                    }

                    // What symbol to show inside the indicator circle?
                    const indicatorSymbol = vocabState.showFeedback && isCorrectAnswer ? '✓' :
                      vocabState.showFeedback && isSelected && !isCorrectAnswer ? '✗' : '';

                    return (
                      <button
                        key={idx}
                        className={`vocab-option-btn ${optionClass} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleVocabSelect(option)}
                        disabled={vocabState.showFeedback} // Lock buttons after answering
                      >
                        <span className="option-indicator">{indicatorSymbol}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback message shown after the user picks an answer */}
                {vocabState.showFeedback && (
                  <div className={`vocab-feedback-msg fade-in ${vocabState.selectedOption === currentWord.meaning ? 'msg-correct' : 'msg-incorrect'}`}>
                    {vocabState.selectedOption === currentWord.meaning ? (
                      <>
                        <span className="feedback-icon">✅</span>
                        <p>Yes, that is correct.</p>
                      </>
                    ) : (
                      <>
                        <span className="feedback-icon">❌</span>
                        <p>No, that is not correct.</p>
                      </>
                    )}
                    <button className="btn-primary next-btn" onClick={nextVocabQuestion}>
                      Next Keyword →
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Progress dots: one dot per word (up to 50 shown).
                Colors: default = not yet answered, 'correct' = green, 'incorrect' = red
                The `history` array in vocabState stores the result of each past answer. */}
            <div className="vocab-progress-tracker glass">
              <div className="dots-container">
                {vocabState.questions.slice(0, 50).map((_, idx) => (
                  <div
                    key={idx}
                    className={`vocab-dot ${idx === vocabState.currentIndex ? 'current' : ''} ${vocabState.history[idx] || ''}`}
                  ></div>
                ))}
                {/* If there are more than 50 words, show "..." to indicate more exist */}
                {vocabState.questions.length > 50 && <span className="dots-more">...</span>}
              </div>
            </div>
          </>

        ) : (
          /* ============================================================
             QUIZ COMPLETE — show final score and options to restart
             ============================================================ */
          <div className="results-view glass fade-in">
            <div className="results-content">
              <div className="results-icon">🎓</div>
              <h3>Interview Vocabulary Complete!</h3>
              <div className="final-score">
                <span className="score-num">{vocabState.score}</span>
                <span className="score-total">/ {vocabState.questions.length}</span>
              </div>
              <p>Excellent progress on your citizenship keywords!</p>
              {/* goToVocabulary reshuffles the vocab list and starts a fresh session */}
              <button className="btn-primary" onClick={goToVocabulary}>Start New Session</button>
              <button className="btn-secondary" onClick={goToHome}>Back to Dashboard</button>
            </div>
          </div>
        )
      )}

    </div>
  );
};

export default VocabularyModule;
