import React from 'react';
import styled from 'styled-components';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface ScheduleNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  dateRangeText: string;
  viewMode: 'day' | 'week' | 'list';
}

/**
 * Navigation component for schedule that allows moving between days/weeks
 */
const ScheduleNavigation: React.FC<ScheduleNavigationProps> = ({
  onPrevious,
  onNext,
  dateRangeText,
  viewMode
}) => {
  return (
    <DateNavigation>
      <NavButton 
        onClick={onPrevious}
        aria-label="previous"
      >
        <FiChevronLeft size={16} />
        <span>{viewMode === 'week' ? 'Previous Week' : 'Previous Day'}</span>
      </NavButton>
      
      <DateDisplay>
        <CurrentDate>{dateRangeText}</CurrentDate>
      </DateDisplay>
      
      <NavButton 
        onClick={onNext}
        aria-label="next"
      >
        <span>{viewMode === 'week' ? 'Next Week' : 'Next Day'}</span>
        <FiChevronRight size={16} />
      </NavButton>
    </DateNavigation>
  );
};

// Styled components
const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
`;

const NavButton = styled.button`
  background: linear-gradient(to bottom, #ffffff, #f9f9ff);
  color: #4338ca;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: linear-gradient(to bottom, #f9f9ff, #f5f5ff);
    border-color: rgba(79, 70, 229, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
  }
  
  &:active {
    transform: translateY(0);
    background: linear-gradient(to bottom, #f5f5ff, #f0f0ff);
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.08);
  }

  svg {
    color: #4338ca;
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: scale(1.1);
  }
  
  span {
    /* Hide text but keep it for accessibility */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background-color: rgba(79, 70, 229, 0.1);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.4s ease;
  }
  
  &:active::after {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
    transition: transform 0.4s ease, opacity 0.4s ease;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(to bottom, #ffffff, #f9f9ff);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
`;

const CurrentDate = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

export default ScheduleNavigation; 