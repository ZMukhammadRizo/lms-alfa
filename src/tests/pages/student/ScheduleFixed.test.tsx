import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../../themes/themes';
import ScheduleFixed from '../../../pages/student/ScheduleFixed';

// Mock the framer-motion to avoid DOM warning about "layoutId"
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
  AnimatePresence: jest.fn(({ children }) => <>{children}</>),
}));

// Mock the draggable scroll hook
jest.mock('use-draggable-scroll', () => ({
  __esModule: true,
  default: () => ({ onMouseDown: jest.fn() }),
}));

describe('ScheduleFixed Component', () => {
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={lightTheme}>
        {component}
      </ThemeProvider>
    );
  };

  test('renders the schedule component', () => {
    renderWithTheme(<ScheduleFixed />);
    
    // Check for main elements
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('View and manage your class schedule')).toBeInTheDocument();
    
    // Check if the ScheduleNavigation component is being used
    expect(screen.getByLabelText('previous')).toBeInTheDocument();
    expect(screen.getByLabelText('next')).toBeInTheDocument();
  });
  
  test('date navigation works correctly', () => {
    renderWithTheme(<ScheduleFixed />);
    
    // Get the initial date range
    const initialDateRange = screen.getByText(/^\w+ \d+ - \w+ \d+$/);
    const initialText = initialDateRange.textContent;
    
    // Click next button and check if date range changes
    fireEvent.click(screen.getByLabelText('next'));
    
    const updatedDateRange = screen.getByText(/^\w+ \d+ - \w+ \d+$/);
    expect(updatedDateRange.textContent).not.toEqual(initialText);
    
    // Click previous button and check if date range goes back to initial
    fireEvent.click(screen.getByLabelText('previous'));
    
    const finalDateRange = screen.getByText(/^\w+ \d+ - \w+ \d+$/);
    expect(finalDateRange.textContent).toEqual(initialText);
  });
}); 