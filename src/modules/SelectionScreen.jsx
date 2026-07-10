// ============================================================
// FILE: modules/SelectionScreen.jsx  —  Version Picker Screen
// ============================================================
// This is the FIRST screen the user sees when they open the app.
//
// Its only job: let the user choose between two versions of the
// U.S. citizenship civics test:
//   - 100 Questions (the 2008 USCIS version, used by most applicants)
//   - 128 Questions (the 2020 USCIS version, expanded edition)
//
// Once the user clicks a card, the `selectVersion` function
// (passed down from App.jsx) is called, which:
//   1. Saves the chosen version ('100' or '128') into App's state
//   2. Switches the view to the Dashboard ('home')
//
// PROPS:
//   selectVersion → function from App.jsx that saves the choice
//                   and navigates to the Dashboard
// ============================================================

import React from 'react';
import SelectionCard from '../components/SelectionCard';

const SelectionScreen = ({ selectVersion }) => {
  return (
    <div className="selection-screen">

      {/* Page heading and subtitle */}
      <h2 className="section-title text-center">Choose Your Test Version</h2>
      <p className="section-subtitle text-center">Select the study guide that matches your requirements.</p>

      {/* Two side-by-side version cards.
          Clicking a card calls selectVersion() with '100' or '128'. */}
      <div className="selection-grid">

        <SelectionCard
          title="100 Questions (2008)"
          desc="The standard version for most applicants. Includes principles of democracy, system of government, and history."
          icon="🏛️"
          badge="Most Common"
          onClick={() => selectVersion('100')}
        />

        <SelectionCard
          title="128 Questions (2020)"
          desc="The expanded version of the civics test. Focused on deeper understanding of American government and history."
          icon="📜"
          onClick={() => selectVersion('128')}
        />

      </div>
    </div>
  );
};

export default SelectionScreen;
