import React from 'react';
import styled from 'styled-components';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useThemeContext } from '../../App';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { isDarkMode, toggleTheme } = useThemeContext();

  return (
    <ToggleContainer 
      className={className} 
      onClick={toggleTheme} 
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <IconWrapper>
        {isDarkMode ? (
          <SunIcon 
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 45, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        ) : (
          <MoonIcon 
            initial={{ rotate: 45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -45, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </IconWrapper>
      <VisuallyHidden>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</VisuallyHidden>
    </ToggleContainer>
  );
};

const ToggleContainer = styled(motion.button)`
  position: relative;
  background: ${props => props.theme.isDark 
    ? 'linear-gradient(to bottom right, #3f5cdb, #314ac9)' 
    : 'linear-gradient(to bottom right, #fbbf24, #f59e0b)'};
  border: none;
  padding: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.isDark ? '#ffffff' : '#ffffff'};
  transition: all 0.3s ease;
  box-shadow: ${props => props.theme.isDark 
    ? '0 2px 8px rgba(33, 57, 183, 0.3)' 
    : '0 2px 8px rgba(245, 158, 11, 0.3)'};
  
  &:hover {
    box-shadow: ${props => props.theme.isDark 
      ? '0 4px 12px rgba(33, 57, 183, 0.5)' 
      : '0 4px 12px rgba(245, 158, 11, 0.5)'};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.colors.border.focus};
    outline-offset: 2px;
  }
`;

const IconWrapper = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SunIcon = styled(motion(FiSun))`
  width: 20px;
  height: 20px;
  position: absolute;
`;

const MoonIcon = styled(motion(FiMoon))`
  width: 20px;
  height: 20px;
  position: absolute;
`;

const VisuallyHidden = styled.span`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`;

export default ThemeToggle; 