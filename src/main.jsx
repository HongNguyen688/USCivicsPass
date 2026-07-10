// ============================================================
// FILE: main.jsx
// ============================================================
// This is the STARTING POINT of the entire application.
// React needs exactly ONE entry point, and this is it.
//
// Think of it like the "power switch" — when the browser
// loads index.html, it finds this file and runs it first.
//
// What it does in 3 steps:
//   1. Find the <div id="root"> element in index.html
//   2. Create a React "root" inside that div
//   3. Render our <App /> component inside that root
// ============================================================

// StrictMode is a React helper that warns you about common
// beginner mistakes during development. It does NOT affect
// the final production build — it just helps you write
// better code by showing extra warnings in the console.
import { StrictMode } from 'react'

// createRoot is how React 18+ "mounts" (attaches) itself
// to the HTML page. It replaced the old ReactDOM.render().
import { createRoot } from 'react-dom/client'

// Import the global CSS styles so they apply to every component
import './index.css'

// Import our main App component — this is the entire app!
import App from './App.jsx'

// Find the <div id="root"> in index.html and attach React to it.
// Then render our App component inside it.
// StrictMode wraps App to help catch mistakes during development.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
