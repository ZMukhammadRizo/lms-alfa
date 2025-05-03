import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import LoadingScreen from './LoadingScreen';
import { createTheme } from '../styles/theme';

// Mock theme for testing
const theme = createTheme('light', '#0ea5e9');

describe('LoadingScreen', () => {
  it('renders the loading spinner and text', () => {
    render(
      <ThemeProvider theme={theme}>
        <LoadingScreen />
      </ThemeProvider>
    );
    
    // Check if spinner is rendered
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    
    // Check if loading text is rendered
    const loadingText = screen.getByText(/loading/i);
    expect(loadingText).toBeInTheDocument();
  });
}); 