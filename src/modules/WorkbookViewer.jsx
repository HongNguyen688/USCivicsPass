// ============================================================
// FILE: modules/WorkbookViewer.jsx  —  In-App Workbook PDF Viewer
// ============================================================
// Shows the USCivicsPass Workbook PDF full-screen with a top bar
// offering three actions: back to the Dashboard, support the
// project via Buy Me a Coffee, and download the PDF.
//
// The top bar is STICKY. The PDF lives in its own scroll container
// that is ~130,000px tall, so on a touch device a swipe almost
// always lands inside it: the inner container eats the gesture and
// the outer page never scrolls back up. Without a pinned top bar
// the "Back to Menu" button scrolls away and the reader is stuck
// in the workbook with no way back to the Dashboard.
//
// Pages are rendered with pdf.js onto <canvas> elements instead of
// an <iframe>. Plain iframes rely on the browser having a built-in
// PDF viewer — Android's WebView (used by the Capacitor native app)
// has none, so the page would render blank there. Canvas rendering
// works identically on web, iOS, and Android, and each canvas is
// drawn at a fixed pixel size then scaled fluidly via CSS so the
// page fits any screen width.
//
// Pages render lazily (via IntersectionObserver) as the user
// scrolls, so a long workbook doesn't render 100+ canvases upfront.
//
// PROPS received from App.jsx:
//   goToHome  → navigate back to the Dashboard
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const WORKBOOK_URL = '/USCivicsPass-Workbook.pdf';

// The CSS width (in px) pages are drawn at before being scaled down
// to fit narrower screens. Capped against devicePixelRatio so retina
// screens stay crisp without rendering excessively large canvases.
const RENDER_WIDTH = 900;

const WorkbookViewer = ({ goToHome }) => {
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const canvasRefs = useRef({});   // pageNum -> <canvas> element
  const renderedPages = useRef({}); // pageNum -> true once drawn

  const [pages, setPages] = useState([]); // [{ num, aspectRatio }]
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  // The app's own <Header> is `position: sticky; top: 0`, and its height
  // changes with the breakpoint and the iOS safe-area inset. Measure it
  // instead of hardcoding a number, so our sticky bar pins directly below
  // it rather than underneath or floating away from it.
  const [stickyTop, setStickyTop] = useState(0);

  useEffect(() => {
    const appHeader = document.querySelector('.main-header');
    if (!appHeader) return;

    const measure = () => setStickyTop(appHeader.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(appHeader);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const downloadWorkbook = () => {
    const link = document.createElement('a');
    link.href = WORKBOOK_URL;
    link.download = 'USCivicsPass-Workbook.pdf';
    link.click();
  };

  const renderPage = async (pageNum) => {
    if (renderedPages.current[pageNum]) return;
    const canvas = canvasRefs.current[pageNum];
    if (!canvas) return;
    renderedPages.current[pageNum] = true;

    const page = await pdfDocRef.current.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const cssWidth = Math.min(RENDER_WIDTH, canvas.parentElement.clientWidth || RENDER_WIDTH);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = page.getViewport({ scale: (cssWidth * pixelRatio) / unscaledViewport.width });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  };

  // Load the PDF once and collect each page's aspect ratio so the
  // scroll container has correct layout height before pages are drawn.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(WORKBOOK_URL);
        const data = await res.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        pdfDocRef.current = pdfDoc;

        const list = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          list.push({ num: i, aspectRatio: viewport.width / viewport.height });
        }
        if (cancelled) return;
        setPages(list);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Draw each page's canvas once it scrolls near the visible area.
  useEffect(() => {
    if (status !== 'ready') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            renderPage(Number(entry.target.dataset.page));
          }
        });
      },
      { root: containerRef.current, rootMargin: '800px 0px' }
    );

    Object.values(canvasRefs.current).forEach((canvas) => canvas && observer.observe(canvas));

    return () => observer.disconnect();
  }, [status, pages]);

  return (
    <div
      className="study-module workbook-module fade-in"
      style={{ '--workbook-sticky-top': `${stickyTop}px` }}
    >

      {/* Top bar: Back to Menu / Buy Me a Coffee / Download.
          Sticky, so it stays reachable no matter how far the reader has
          scrolled inside the PDF container below. */}
      <div className="module-header workbook-topbar">
        <button className="back-btn workbook-back-btn" onClick={goToHome}>
          ← Back to Menu
        </button>
        <h2>USCivicsPass Workbook</h2>
        <div className="workbook-actions">
          <a
            href="https://buymeacoffee.com/hongnguyen"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-coffee"
          >
            ☕ Buy Me a Coffee
          </a>
          <button className="btn-primary" onClick={downloadWorkbook}>
            ⬇️ Download
          </button>
        </div>
      </div>

      {/* PDF pages, rendered responsively */}
      <div className="workbook-pdf-frame" ref={containerRef}>
        {status === 'loading' && <p className="workbook-status">Loading workbook…</p>}
        {status === 'error' && (
          <p className="workbook-status">
            Couldn't load the preview.{' '}
            <a href={WORKBOOK_URL} target="_blank" rel="noopener noreferrer">Open the PDF directly</a>.
          </p>
        )}
        {pages.map(({ num, aspectRatio }) => (
          <canvas
            key={num}
            data-page={num}
            ref={(el) => { canvasRefs.current[num] = el; }}
            className="workbook-page"
            style={{ aspectRatio }}
          />
        ))}
      </div>

      {/* Explicit exit at the end of the reader — the expected next step
          after finishing the workbook is to go practice the civics test. */}
      <div className="workbook-footer-actions">
        <button className="btn-primary" onClick={goToHome}>
          ← Back to Menu
        </button>
      </div>
    </div>
  );
};

export default WorkbookViewer;
