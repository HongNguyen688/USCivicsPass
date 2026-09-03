// ============================================================
// FILE: components/Header.jsx  —  The Top Navigation Bar
// ============================================================
// This component draws the header that appears at the TOP of
// every single screen in the app.
//
// It shows:
//   - The PassUSCivics logo (clicking it goes back to version selection)
//   - Navigation buttons — BUT ONLY after the user has picked a
//     test version AND is currently on the Dashboard (home) screen.
//     We don't show the nav on other screens to keep it clean.
//   - A "hamburger" button (☰) for small mobile screens, which
//     shows/hides the navigation links.
//
// WHAT ARE "PROPS"?
//   Props are values passed DOWN from a parent component (App.jsx)
//   to this child component. They work like function arguments.
//   We list all expected props between the { } in the function signature.
// ============================================================

const Header = ({
  isMenuOpen,       // true/false: is the mobile menu currently open?
  setIsMenuOpen,    // function: call this to open or close the mobile menu
  goToHome,         // function: navigate to the Dashboard screen
  goToQuestions,    // function: navigate to the Civics Study screen
  startQuiz,        // function: start a new Practice Quiz
  goToSelection,    // function: go back to the version selection screen
  testVersion,      // '100' or '128' — which version the user picked (null if not chosen yet)
  view,             // which screen is currently shown (e.g. 'home', 'questions', 'quiz')
  totalQuestions    // how many questions are in the selected version (100 or 128)
}) => {
  return (
    <header className="main-header glass">
      <div className="container header-content">

        {/* ── LOGO ──────────────────────────────────────────────
            Clicking anywhere on the logo takes the user all the
            way back to the version selection screen.               */}
        <div className="logo" onClick={goToSelection}>
          <img src="/logo.png" alt="PassUSCivics logo" className="logo-img" />
          <h1>PassUSCivics</h1>
        </div>

        {/* ── NAVIGATION MENU ───────────────────────────────────
            We only show the nav menu if BOTH conditions are true:
              1. The user has already chosen a test version (testVersion is not null)
              2. They are currently on the Dashboard/home screen
            On any other screen (quiz, flashcards, etc.) the nav is hidden
            because those screens have their own Back buttons.
            The && operator: "if X is truthy, render the thing after &&"  */}
        {testVersion && view === 'home' && (
          <>
            {/* ── HAMBURGER BUTTON ────────────────────────────────
                This is the ☰ button for mobile screens.
                It's built from three <span> "bars".
                The 'active' CSS class animates them into an X when open. */}
            <button
              className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)} // Toggle: true→false, false→true
            >
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </button>

            {/* ── NAV LINKS ────────────────────────────────────────
                The 'nav-open' class makes the menu visible on mobile.
                On desktop it's always visible via CSS.                  */}
            <nav className={isMenuOpen ? 'nav-open' : ''}>
              <button className="nav-btn" onClick={goToHome}>Dashboard</button>
              <button className="nav-btn" onClick={goToQuestions}>{totalQuestions} Questions</button>
              <button className="nav-btn" onClick={startQuiz}>Practice Test</button>

              {/* This button uses a different style ('btn-switch') to visually
                  stand out — it's a destructive action (loses your place)    */}
              <button className="nav-btn btn-switch" onClick={goToSelection}>Switch Version</button>
            </nav>
          </>
        )}

      </div>
    </header>
  );
};

export default Header;
