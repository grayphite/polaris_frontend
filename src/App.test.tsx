import { render, screen } from '@testing-library/react';

import App from './App';
import React from 'react';

test('renders app without crashing', () => {
  render(<App />);
  // This test just checks if the app renders without crashing
});