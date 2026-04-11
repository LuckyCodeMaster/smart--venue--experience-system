import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navigation tabs', () => {
  render(<App />);
  // Header should show venue name
  expect(screen.getByText(/Smart Venue/i)).toBeInTheDocument();
});

test('renders attendee view by default', () => {
  render(<App />);
  // Attendee view shows Grand Arena
  expect(screen.getByText(/Grand Arena/i)).toBeInTheDocument();
});
