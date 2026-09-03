// ============================================================
// FILE: components/Footer.jsx  —  The Bottom Bar
// ============================================================
// This is the simplest component in the app.
// It just shows copyright text at the very bottom of every page.
//
// PROPS:
//   isNativeApp → true when running inside the iOS/Android shell, which hides
//                 the App Store link (you are already in the app).
// ============================================================

import React, { useState } from 'react';

const Footer = ({ isNativeApp }) => {
  // Ephemeral UI state: shows a brief "Link copied!" confirmation on the
  // Share button when the Web Share API isn't available (desktop browsers).
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'PassUSCivics',
      text: 'Prep for the U.S. citizenship test with PassUSCivics!',
      url: window.location.origin,
    };

    if (navigator.share) {
      // Native share sheet — available on most mobile browsers and the app.
      navigator.share(shareData).catch(() => {});
    } else {
      // Desktop fallback: copy the link and show a brief confirmation.
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <footer className="main-footer">
      <div className="container footer-content">
        <div className="footer-actions">
          {/* Support link — opens the creator's Buy Me a Coffee page in a new tab */}
          <a
            href="https://buymeacoffee.com/hongnguyen"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-coffee"
          >
            ☕ Buy Me a Coffee
          </a>

          {/* Print edition — the same workbook shown in-app, on Amazon */}
          <a
            href="https://a.co/d/0iGCC2Gs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book"
          >
            📕 Buy Paper Book
          </a>

          {/* iOS app — hidden inside the native shell, which already loads this
              same site, so an installed app would otherwise advertise itself. */}
          {!isNativeApp && (
            <a
              href="https://apps.apple.com/us/app/uscivicspass/id6789735809"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-appstore"
            >
              📱 Get the iOS App
            </a>
          )}

          {/* Feedback link — opens the user's email client with a pre-filled subject */}
          <a
            href="mailto:hongnguyentt99@gmail.com?subject=PassUSCivics%20Feedback"
            className="btn-secondary"
          >
            💬 Feedback
          </a>

          {/* Share button — native share sheet on mobile, clipboard copy on desktop */}
          <button onClick={handleShare} className="btn-secondary">
            {copied ? '✅ Link Copied!' : '🔗 Share'}
          </button>
        </div>

        {/* &copy; is the HTML code for the © copyright symbol */}
        <p>&copy; 2026 HN - PassUSCivics. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
