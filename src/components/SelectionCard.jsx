// ============================================================
// FILE: components/SelectionCard.jsx  —  A Version Choice Card
// ============================================================
// This component draws ONE of the two cards on the very first
// screen ("Choose Your Test Version").
//
// It's used TWICE:
//   - Once for "100 Questions (2008)"
//   - Once for "128 Questions (2020)"
//
// PROPS received from SelectionScreen.jsx:
//   title   → The version name (e.g. "100 Questions (2008)")
//   desc    → A short description of this version
//   icon    → An emoji (e.g. "🏛️")
//   onClick → What happens when this card is clicked
//   badge   → Optional label shown in the corner (e.g. "Most Common")
//             If no badge is provided, it's simply not shown.
// ============================================================

import React from 'react';

const SelectionCard = ({ title, desc, icon, onClick, badge }) => {
  return (
    <div className="selection-card glass" onClick={onClick}>

      {/* Only show the badge if one was provided.
          The && operator: "if badge exists, render the <span>" */}
      {badge && <span className="card-badge">{badge}</span>}

      {/* Big emoji icon */}
      <div className="card-icon">{icon}</div>

      {/* Version title (e.g. "100 Questions (2008)") */}
      <h3>{title}</h3>

      {/* Short description of the version */}
      <p>{desc}</p>

      {/* A button to make it obvious this card is clickable.
          Note: the onClick is on the parent <div>, so clicking
          anywhere on the card (including this button) works.   */}
      <button className="btn-select">Select Version</button>
    </div>
  );
};

export default SelectionCard;
