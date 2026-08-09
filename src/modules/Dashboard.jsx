// ============================================================
// FILE: modules/Dashboard.jsx  —  The Home / Main Menu Screen
// ============================================================
// This is the main menu that appears after the user picks a
// test version. It shows a grid of 8 cards, one for each
// study module in the app.
//
// Clicking a card calls the navigation function passed in from
// App.jsx (e.g. goToQuestions, startQuiz, goToReading, etc.)
//
// PROPS received from App.jsx:
//   testVersion     → '100' or '128' (shown in the heading)
//   totalQuestions  → 100 or 128 (shown in card text)
//   setView         → function to directly set the current screen
//   goToQuestions   → go to Civics Study screen
//   startQuiz       → start a Practice Quiz
//   goToReading     → go to Reading Practice
//   goToWriting     → go to Writing Practice
//   goToFlashcards  → go to Flashcards
//   goToVocabulary  → go to Vocabulary module
// ============================================================

import React from 'react';
import DashboardCard from '../components/DashboardCard';

const Dashboard = ({
  testVersion,
  totalQuestions,
  setView,
  goToQuestions,
  startQuiz,
  goToReading,
  goToWriting,
  goToFlashcards,
  goToVocabulary,
}) => {
  return (
    <div className="dashboard">

      {/* Page heading showing which version is active */}
      <div className="dashboard-header">
        <h2 className="section-title">
          Preparation Modules ({testVersion === '128' ? '2020 Version' : '2008 Version'})
        </h2>
        <p className="version-badge">{totalQuestions} Questions Study Guide</p>
      </div>

      {/* Grid of 8 module cards */}
      <div className="grid">

        {/* Card 1: Browse all civics questions */}
        <DashboardCard
          title={`${totalQuestions} Civics Questions`}
          desc={`Learn all ${totalQuestions} questions and answers with audio support.`}
          icon="📚"
          onClick={goToQuestions}
          variant="primary"
        />

        {/* Card 2: Take a practice test */}
        <DashboardCard
          title="Civics Practice Test"
          desc={`Simulate the actual interview. ${testVersion === '128' ? '20 questions, 12 to pass.' : '10 questions, 6 to pass.'}`}
          icon="📝"
          onClick={startQuiz}
          variant="primary"
        />

        {/* Card 3: Reading practice sentences */}
        <DashboardCard
          title="Reading Practice"
          desc="Practice reading sentences required for the test."
          icon="📖"
          onClick={goToReading}
          variant="primary"
        />

        {/* Card 4: Writing / dictation practice */}
        <DashboardCard
          title="Writing Practice"
          desc="Listen and write sentences to practice dictation."
          icon="✍️"
          onClick={goToWriting}
          variant="primary"
        />

        {/* Card 5: N-400 application prep */}
        <DashboardCard
          title="N-400 Questions"
          desc="Preparation for common N-400 application questions."
          icon="🛂"
          onClick={() => setView('n400')}  // This one uses setView directly instead of a named function
          variant="primary"
        />

        {/* Card 6: Interactive flashcards */}
        <DashboardCard
          title="Flash Card"
          desc={`Study all ${totalQuestions} questions with an interactive flashcard experience.`}
          icon="🎴"
          onClick={goToFlashcards}
          variant="primary"
        />

        {/* Card 7: Vocabulary quiz */}
        <DashboardCard
          title="Vocabulary"
          desc="Master the key vocabulary words for Reading and Writing tests."
          icon="🔤"
          onClick={goToVocabulary}
          variant="primary"
        />

        {/* Card 8: Opens the in-app workbook PDF viewer. */}
        <DashboardCard
          title="Workbook"
          desc="View the full USCivicsPass Workbook to study and print offline."
          icon={<img src="/CitizenshipCover-small.png" alt="USCivicsPass Workbook cover" className="card-icon-img" />}
          onClick={() => setView('workbook')}
          variant="primary"
        />

      </div>
    </div>
  );
};

export default Dashboard;
