// ============================================================
// FILE: modules/PracticeQuiz.jsx  —  Timed Practice Test
// ============================================================
// This screen simulates the real citizenship interview test.
//
// HOW IT WORKS:
//   1. App.jsx picks a random pool of questions and stores them
//      in `quizState.questions`.
//   2. This module shows one question at a time with 3 choices.
//   3. When the user taps an answer, we lock it in (no changing!),
//      highlight correct/incorrect, and show a "Next" button.
//   4. After all questions, we show the results screen.
//
// PASSING SCORES:
//   - 100-question version: need 6 out of 10 correct
//   - 128-question version: need 12 out of 20 correct
//
// THE 3 VIEWS IN THIS MODULE:
//   View 1 — Questions: the actual quiz (one question at a time)
//   View 2 — Summary:   pass/fail result with score
//   View 3 — Details:   full breakdown of every question asked
//
// PROPS: (all from App.jsx)
//   testVersion       → '100' or '128'
//   goToHome          → go back to Dashboard
//   quizState         → object with all quiz data:
//                         { questions, currentIndex, score,
//                           complete, userAnswers, showDetails }
//   setQuizState      → update quizState
//   currentOptions    → array of 3 answer strings for the current question
//   selectedOption    → the option the user tapped (or null)
//   isAnswerChecked   → true after user picks an answer
//   handleOptionSelect → called when user taps an answer button
//   nextQuizQuestion  → move to next question (or finish quiz)
//   startQuiz         → restart a brand new quiz
//   speakText         → speak text aloud
// ============================================================

import React from 'react';

const PracticeQuiz = ({
  testVersion,
  goToHome,
  quizState,
  setQuizState,
  currentOptions,
  setCurrentOptions,
  selectedOption,
  setSelectedOption,
  isAnswerChecked,
  setIsAnswerChecked,
  handleOptionSelect,
  nextQuizQuestion,
  startQuiz,
  speakText
}) => {

  // How many questions does this version's quiz have?
  const quizLength = testVersion === '128' ? 20 : 10;

  // How many correct answers needed to pass?
  const passingScore = testVersion === '128' ? 12 : 6;

  // Did the user pass?
  const didPass = quizState.score >= passingScore;

  return (
    <div className="quiz-module fade-in">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="module-header">
        <button className="back-btn" onClick={goToHome}>← Exit</button>
        <h2>Practice Test ({testVersion})</h2>
      </div>

      {/* ── PROGRESS BAR (shown while quiz is active) ───────── */}
      {!quizState.complete && (
        <div className="quiz-progress-container">
          {/* Visual progress bar.
              The width is calculated as a percentage:
              (current question number / total questions) × 100%   */}
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${(quizState.currentIndex / quizLength) * 100}%` }}
            ></div>
          </div>
          <div className="progress-text">
            Question {quizState.currentIndex + 1} of {quizLength}
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 1: ACTIVE QUIZ — show when quiz is not complete yet
          ============================================================ */}
      {!quizState.complete ? (
        <>
          {/* ── QUESTION CARD ─────────────────────────────────── */}
          <div className="quiz-card glass">

            {/* Category badge and question text */}
            <div className="quiz-question-region">
              <span className="card-category-badge">
                {quizState.questions[quizState.currentIndex].category}
              </span>
              <p className="quiz-question-text">
                {quizState.questions[quizState.currentIndex].question}
              </p>
              <button
                className="audio-btn-floating outline"
                onClick={(e) => {
                  e.stopPropagation(); // Don't bubble up to parent
                  speakText(quizState.questions[quizState.currentIndex].question);
                }}
              >🔊 Listen</button>
            </div>

            <div className="quiz-options-divider"></div>

            {/* ── MULTIPLE CHOICE OPTIONS ───────────────────────── */}
            <div className="options-grid enhanced">
              {currentOptions.map((option, idx) => {
                // Build the CSS class and indicator symbol for each option button.
                // The class changes after the user answers to show right/wrong.
                let buttonClass = "option-btn enhanced-option";
                let indicator = ""; // Will be "✓" or "✕" after answering

                if (isAnswerChecked) {
                  // Quiz is answered — show which one was correct
                  if (option === quizState.questions[quizState.currentIndex].answer) {
                    buttonClass += " correct correct-anim"; // Green highlight
                    indicator = "✓"; // Checkmark
                  } else if (option === selectedOption) {
                    buttonClass += " incorrect incorrect-anim"; // Red highlight
                    indicator = "✕"; // X mark
                  }
                } else if (option === selectedOption) {
                  // Quiz is NOT yet answered, just selected (highlighted in blue)
                  buttonClass += " selected";
                }

                // String.fromCharCode(65) = 'A', (66) = 'B', (67) = 'C'
                // So idx=0 → 'A', idx=1 → 'B', idx=2 → 'C'
                const letterLabel = String.fromCharCode(65 + idx);

                return (
                  <button
                    key={idx}
                    className={buttonClass}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswerChecked} // Can't change answer after checking
                  >
                    {/* Shows A/B/C before answering, then ✓/✕ after */}
                    <span className={`option-indicator ${isAnswerChecked && indicator ? 'filled' : ''}`}>
                      {indicator || letterLabel}
                    </span>
                    <span className="option-text">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Show the "Next" button ONLY after the user has picked an answer */}
          {isAnswerChecked && (
            <div className="quiz-controls fade-in">
              <button className="btn-primary next-quiz-btn" onClick={nextQuizQuestion}>
                {/* Change button label on the very last question */}
                {quizState.currentIndex === quizLength - 1 ? 'Show Final Results' : 'Next Question →'}
              </button>
            </div>
          )}
        </>

      ) : quizState.showDetails ? (
        /* ============================================================
           VIEW 3: DETAILED RESULTS — every question with user's answer
           ============================================================ */
        <div className="quiz-details-container glass fade-in">
          <div className="results-hero compact">
            <h3 className="results-title">Detailed Test Results</h3>
            <div className="score-badge">Score: {quizState.score} / {quizLength}</div>
          </div>

          <div className="details-scroll-list">
            {/* Loop through every question that was asked and show the result */}
            {quizState.questions.map((question, idx) => {
              const userAnswer = quizState.userAnswers[idx];
              const wasCorrect = userAnswer === question.answer;

              return (
                <div
                  key={idx}
                  className={`detail-card ${wasCorrect ? 'correct-border' : 'incorrect-border'}`}
                >
                  <div className="detail-q-header">
                    <span className="detail-q-num">Q{idx + 1}</span>
                    <span className="detail-category">{question.category}</span>
                  </div>
                  <p className="detail-question">{question.question}</p>

                  <div className="detail-answer-row">
                    {/* Show the user's answer in green (correct) or red (wrong) */}
                    <div className={`detail-user-answer ${wasCorrect ? 'text-success' : 'text-danger'}`}>
                      {wasCorrect ? '✅' : '❌'} Your Answer: <strong>{userAnswer || 'No answer'}</strong>
                    </div>

                    {/* Only show the correct answer if they got it wrong */}
                    {!wasCorrect && (
                      <div className="detail-correct-answer text-success">
                        🎯 Correct Answer: <strong>{question.answer}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-actions sticky-bottom">
            {/* "Back to Summary" goes back to the pass/fail screen (View 2) */}
            <button
              className="btn-secondary btn-large"
              onClick={() => setQuizState(prev => ({ ...prev, showDetails: false }))}
            >Back to Summary</button>
            <button className="btn-primary btn-large highlight-start-again" onClick={startQuiz}>Try Again</button>
          </div>
        </div>

      ) : (
        /* ============================================================
           VIEW 2: SUMMARY — pass or fail with final score
           ============================================================ */
        <div className="quiz-results-enhanced glass fade-in">
          <div className="results-hero">

            {/* Trophy emoji for pass, book emoji for fail */}
            <div className={`results-icon-big ${didPass ? 'pass' : 'fail'}`}>
              {didPass ? '🏆' : '📚'}
            </div>

            <h3 className="results-title">
              {didPass ? 'Congratulations!' : 'Keep Practicing'}
            </h3>

            {/* Big score display */}
            <div className="score-circle">
              <span className="score-number">{quizState.score}</span>
              <span className="score-total">/ {quizLength}</span>
            </div>

            <p className="results-message">
              {didPass
                ? 'You have successfully passed the practice test.'
                : `You need ${passingScore} correct answers to pass. Don't give up!`
              }
            </p>
          </div>

          <div className="results-actions">
            <button className="btn-primary btn-large highlight-start-again" onClick={startQuiz}>Try Again</button>
            {/* "Test Result" switches to the detailed breakdown (View 3) */}
            <button
              className="btn-secondary btn-large"
              onClick={() => setQuizState(prev => ({ ...prev, showDetails: true }))}
            >Test Result</button>
            <button className="btn-secondary btn-large" onClick={goToHome}>Back to Dashboard</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PracticeQuiz;
