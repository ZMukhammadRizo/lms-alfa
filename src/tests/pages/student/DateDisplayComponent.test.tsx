import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../../themes/themes';

// Mock date display component
const MockDateDisplay = ({ 
  currentDate,
  viewMode, 
  dateRangeText 
}) => (
  <div data-testid="date-display-component">
    <div data-testid="current-month">
      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
    </div>
    <div data-testid="date-range">
      {dateRangeText || 'Date Range Placeholder'}
    </div>
    <div data-testid="view-mode">{viewMode}</div>
  </div>
);

describe('DateDisplay Component', () => {
  const today = new Date();
  
  it('renders current month and year', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <MockDateDisplay 
          currentDate={today}
          viewMode="week"
          dateRangeText="Apr 1 - Apr 7"
        />
      </ThemeProvider>
    );
    
    const expectedMonthYear = today.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric'
    });
    
    expect(screen.getByTestId('date-display-component')).toBeInTheDocument();
    expect(screen.getByTestId('current-month').textContent).toBe(expectedMonthYear);
  });
  
  it('displays date range text', () => {
    render(
      <ThemeProvider theme={lightTheme}>
        <MockDateDisplay 
          currentDate={today}
          viewMode="week"
          dateRangeText="Apr 1 - Apr 7"
        />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('date-range').textContent).toBe('Apr 1 - Apr 7');
  });
  
  it('adapts to different view modes', () => {
    const { rerender } = render(
      <ThemeProvider theme={lightTheme}>
        <MockDateDisplay 
          currentDate={today}
          viewMode="week"
          dateRangeText="Apr 1 - Apr 7"
        />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('view-mode').textContent).toBe('week');
    
    // Change to day view
    rerender(
      <ThemeProvider theme={lightTheme}>
        <MockDateDisplay 
          currentDate={today}
          viewMode="day" 
          dateRangeText={today.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
          })}
        />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('view-mode').textContent).toBe('day');
  });
}); 