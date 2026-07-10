// ============================================================
// FILE: components/Footer.jsx  —  The Bottom Bar
// ============================================================
// This is the simplest component in the app.
// It just shows copyright text at the very bottom of every page.
//
// It receives NO props and has NO state — it never changes.
// This is called a "static" or "presentational" component.
// ============================================================

import React from 'react';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container footer-content">
        {/* &copy; is the HTML code for the © copyright symbol */}
        <p>&copy; 2026 HN - USCivicsPass. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
