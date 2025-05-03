import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../../themes/themes';
import ScheduleNavigation from '../../../components/student/ScheduleNavigation';

describe('ScheduleNavigation Component', () => {
  it('renders navigation controls correctly', () => {
    const handlePrevious = jest.fn();
    const handleNext = jest.fn();
    
    render(
      <ThemeProvider theme={lightTheme}>
        <ScheduleNavigation 
          onPrevious={handlePrevious} 
          onNext={handleNext} 
          viewMode="week"
          dateRangeText="Apr 1 - Apr 7"
        />
      </ThemeProvider>
    );
    
    // Check for navigation buttons
    expect(screen.getByLabelText('previous')).toBeInTheDocument();
    expect(screen.getByLabelText('next')).toBeInTheDocument();
    expect(screen.getByText('Apr 1 - Apr 7')).toBeInTheDocument();
  });
  
  it('calls navigation handlers when buttons are clicked', () => {
    const handlePrevious = jest.fn();
    const handleNext = jest.fn();
    
    render(
      <ThemeProvider theme={lightTheme}>
        <ScheduleNavigation 
          onPrevious={handlePrevious} 
          onNext={handleNext} 
          viewMode="week"
          dateRangeText="Apr 1 - Apr 7"
        />
      </ThemeProvider>
    );
    
    // Click navigation buttons
    fireEvent.click(screen.getByLabelText('previous'));
    fireEvent.click(screen.getByLabelText('next'));
    
    // Verify handlers were called
    expect(handlePrevious).toHaveBeenCalledTimes(1);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });
  
  it('displays different text based on viewMode', () => {
    const handlePrevious = jest.fn();
    const handleNext = jest.fn();
    
    const { rerender } = render(
      <ThemeProvider theme={lightTheme}>
        <ScheduleNavigation 
          onPrevious={handlePrevious} 
          onNext={handleNext} 
          viewMode="day"
          dateRangeText="April 1, 2023"
        />
      </ThemeProvider>
    );
    
    // Check text (will be hidden visually but present for screen readers)
    expect(screen.getByText('Previous Day')).toBeInTheDocument();
    expect(screen.getByText('Next Day')).toBeInTheDocument();
    
    // Change to week view
    rerender(
      <ThemeProvider theme={lightTheme}>
        <ScheduleNavigation 
          onPrevious={handlePrevious} 
          onNext={handleNext} 
          viewMode="week"
          dateRangeText="Apr 1 - Apr 7"
        />
      </ThemeProvider>
    );
    
    // Check week view text
    expect(screen.getByText('Previous Week')).toBeInTheDocument();
    expect(screen.getByText('Next Week')).toBeInTheDocument();
  });
}); 