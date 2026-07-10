// ============================================================
// FILE: components/DashboardCard.jsx  —  A Clickable Module Card
// ============================================================
// This component draws ONE card on the Dashboard home screen.
// There are 8 of these cards — one for each study module.
//
// Example cards: "Civics Questions", "Practice Quiz", "Flashcards"
//
// It is a "reusable" component: instead of writing the same
// card HTML 8 times, we write it ONCE here and just pass in
// different text/icons each time it's used.
//
// PROPS received from Dashboard.jsx:
//   title   → The big heading text (e.g. "Practice Quiz")
//   desc    → The smaller description text
//   icon    → An emoji to display (e.g. "📝")
//   onClick → Function to call when the card is clicked
//   variant → Optional CSS class for color styling (e.g. "primary")
// ============================================================

import React from 'react';

const DashboardCard = ({ title, desc, icon, onClick, variant }) => {
  return (
    // The template literal `card dashboard-card glass ${variant}-card`
    // builds a CSS class string. If variant="primary", the class becomes
    // "card dashboard-card glass primary-card".
    // The ternary handles the case where variant is not provided.
    <div
      className={`card dashboard-card glass ${variant ? `${variant}-card` : ''}`}
      onClick={onClick}
    >
      {/* Large emoji icon at the top of the card */}
      <div className="card-icon">{icon}</div>

      {/* Card title and description */}
      <h3>{title}</h3>
      <p>{desc}</p>

      {/* Arrow in the bottom-right corner to show it's a clickable link */}
      <div className="card-arrow">→</div>
    </div>
  );
};

export default DashboardCard;
