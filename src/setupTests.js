import '@testing-library/jest-dom';
import { vi } from 'vitest';

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    cancel: vi.fn(),
    speak: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
  },
  writable: true
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  value: class SpeechSynthesisUtterance {
    constructor() {}
  },
  writable: true
});
