import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import ScheduleNavigation from '../../components/student/ScheduleNavigation';
import { 
  FiClock, 
  FiMapPin, 
  FiSearch, 
  FiBook, 
  FiCalendar, 
  FiDownload, 
  FiPrinter, 
  FiFilter, 
  FiArrowUp,
  FiRefreshCw,
  FiCheckCircle,
  FiGrid,
  FiList,
  FiUser
} from 'react-icons/fi';
import useDraggableScroll from 'use-draggable-scroll';

// Sample code showing how to use the extracted ScheduleNavigation component
// This would replace sections where DateNavigationWeek was previously used

const ScheduleFixed: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('week');
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const weekScheduleRef = useRef<HTMLDivElement>(null);
  const { onMouseDown } = useDraggableScroll(weekScheduleRef);
  
  // Generate dates for the current week
  const getDatesForCurrentWeek = () => {
    const dates = [];
    const currentDate = new Date(selectedDate);
    
    // Find the first day of the week (Sunday)
    const firstDayOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    firstDayOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    
    // Generate 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  // Get the week dates
  const weekDates = getDatesForCurrentWeek();
  
  // Format the date range text
  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];
    return `${firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };
  
  // Go to previous week/day
  const goToPrevious = () => {
    setDirection('prev');
    if (viewMode === 'week') {
      const prevWeek = new Date(selectedDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setSelectedDate(prevWeek);
    } else {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setSelectedDate(prevDay);
    }
  };

  // Go to next week/day
  const goToNext = () => {
    setDirection('next');
    if (viewMode === 'week') {
      const nextWeek = new Date(selectedDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setSelectedDate(nextWeek);
    } else {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
    }
  };
  
  return (
    <ScheduleContainer>
      <Header>
        <Title>Schedule</Title>
        <Subtitle>View and manage your class schedule</Subtitle>
      </Header>

      {/* Use the extracted ScheduleNavigation component instead of DateNavigationWeek */}
      <ScheduleNavigation
        onPrevious={goToPrevious}
        onNext={goToNext}
        viewMode={viewMode}
        dateRangeText={getDateRangeText()}
      />
      
      {/* Rest of the component would go here... */}
      <div>
        <h2>This is a stub implementation to show the usage of ScheduleNavigation</h2>
        <p>Current view mode: {viewMode}</p>
        <p>Current date range: {getDateRangeText()}</p>
      </div>
    </ScheduleContainer>
  );
};

// Styled components
const ScheduleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px;
  background: linear-gradient(to bottom right, #ffffff, #f9f9ff);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  padding: 0;
`;

const Subtitle = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 4px 0 0 0;
  padding: 0;
`;

export default ScheduleFixed; 