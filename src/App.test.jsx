import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the main application title', () => {
    render(<App />);
    const titleElement = screen.getByRole('heading', { level: 1, name: /PassUSCivics/i });
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the test version selection screen initially', () => {
    render(<App />);
    const selectionTitle = screen.getByText(/Choose Your Test Version/i);
    expect(selectionTitle).toBeInTheDocument();
  });
});
