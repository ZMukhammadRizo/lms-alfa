import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import Schedule from '../../../pages/student/Schedule';
import { lightTheme } from '../../../themes/themes';

// Mock modules
jest.mock('framer-motion', () => ({
  motion: {
    div: jest.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
  AnimatePresence: jest.fn(({ children }) => <>{children}</>),
}));

jest.mock('use-draggable-scroll', () => ({
  __esModule: true,
  default: () => ({ onMouseDown: jest.fn() }),
}));

describe('Student Schedule Component', () => {
  const renderWithTheme = (component) => {
    return render(
      <ThemeProvider theme={lightTheme}>
        {component}
      </ThemeProvider>
    );
  };

  test('renders the schedule component', async () => {
    renderWithTheme(<Schedule />);
    
    // Check for main schedule elements
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText(/View and manage your class schedule/i)).toBeInTheDocument();
  });

  test('changes view mode between week and list', async () => {
    renderWithTheme(<Schedule />);
    
    // Check initial week view
    expect(screen.getByText('Week')).toBeInTheDocument();
    
    // Switch to list view
    const listViewButton = screen.getByText('List');
    fireEvent.click(listViewButton);
    
    // Verify list view is active
    await waitFor(() => {
      const listViewButton = screen.getByText('List');
      expect(listViewButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('toggles course filter', async () => {
    renderWithTheme(<Schedule />);
    
    // Open filter dropdown
    const filterButton = screen.getByText(/All Courses/i);
    fireEvent.click(filterButton);
    
    // Wait for dropdown to appear and select a course
    await waitFor(() => {
      // Try to select the first course that appears in dropdown
      const courseOptions = screen.getAllByRole('button', { name: /^(?!All Courses).+/ });
      if (courseOptions.length > 0) {
        fireEvent.click(courseOptions[0]);
      }
    });
  });

  test('navigates to next and previous week', () => {
    renderWithTheme(<Schedule />);
    
    // Store current dates
    const initialDateRange = screen.getByText(/^\w+ \d+ - \w+ \d+$/);
    const initialText = initialDateRange.textContent;
    
    // Navigate to next week
    const nextButton = screen.getByLabelText(/next/i);
    fireEvent.click(nextButton);
    
    // Verify date range changes
    const updatedDateRange = screen.getByText(/^\w+ \d+ - \w+ \d+$/);
    expect(updatedDateRange.textContent).not.toEqual(initialText);
    
    // Navigate back
    const prevButton = screen.getByLabelText(/previous/i);
    fireEvent.click(prevButton);
    
    // Verify we're back to initial week
    const finalDateRange = screen.getByText(/^\w+ \d+ - \w+ \d+$/);
    expect(finalDateRange.textContent).toEqual(initialText);
  });

  test('can select different date', async () => {
    renderWithTheme(<Schedule />);
    
    // Find date cells and click on one that isn't today
    const dateCells = screen.getAllByRole('button', { 
      name: /^\d+$/ 
    });
    
    if (dateCells.length > 1) {
      fireEvent.click(dateCells[1]);
      
      // Verify the date is selected
      await waitFor(() => {
        expect(dateCells[1]).toHaveClass('selected');
      });
    }
  });
}); 