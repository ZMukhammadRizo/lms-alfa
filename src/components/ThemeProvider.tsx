import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import GlobalStyle from '../styles/globalStyles';

// Define theme colors and properties
const lightTheme = {
  isDark: false,
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    background: {
      main: '#f9fafb',
      card: '#ffffff',
      input: '#ffffff',
      sidebar: '#ffffff',
      modal: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      muted: '#9ca3af',
      inverted: '#f9fafb',
    },
    border: {
      light: '#e5e7eb',
      main: '#d1d5db',
      dark: '#9ca3af',
    },
    error: {
      light: '#fecaca',
      main: '#ef4444',
      dark: '#b91c1c',
    },
    success: {
      light: '#d1fae5',
      main: '#10b981',
      dark: '#047857',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#b45309',
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#1d4ed8',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  borders: {
    radius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
    },
  },
};

const darkTheme = {
  isDark: true,
  colors: {
    primary: {
      50: '#1e3a8a',
      100: '#1e40af',
      200: '#1d4ed8',
      300: '#2563eb',
      400: '#3b82f6',
      500: '#60a5fa',
      600: '#93c5fd',
      700: '#bfdbfe',
      800: '#dbeafe',
      900: '#eff6ff',
    },
    background: {
      main: '#111827',
      card: '#1f2937',
      input: '#374151',
      sidebar: '#1f2937',
      modal: '#1f2937',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#e5e7eb',
      muted: '#9ca3af',
      inverted: '#111827',
    },
    border: {
      light: '#374151',
      main: '#4b5563',
      dark: '#6b7280',
    },
    error: {
      light: '#7f1d1d',
      main: '#ef4444',
      dark: '#fecaca',
    },
    success: {
      light: '#064e3b',
      main: '#10b981',
      dark: '#d1fae5',
    },
    warning: {
      light: '#78350f',
      main: '#f59e0b',
      dark: '#fef3c7',
    },
    info: {
      light: '#1e3a8a',
      main: '#3b82f6',
      dark: '#dbeafe',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.26)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.24)',
  },
  borders: {
    radius: {
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
    },
  },
};

// Create new primary color variants
const createPrimaryColorVariants = (baseColor: string) => {
  return {
    50: adjustColorBrightness(baseColor, 0.9),
    100: adjustColorBrightness(baseColor, 0.8),
    200: adjustColorBrightness(baseColor, 0.6),
    300: adjustColorBrightness(baseColor, 0.4),
    400: adjustColorBrightness(baseColor, 0.2),
    500: baseColor,
    600: adjustColorBrightness(baseColor, -0.2),
    700: adjustColorBrightness(baseColor, -0.4),
    800: adjustColorBrightness(baseColor, -0.6),
    900: adjustColorBrightness(baseColor, -0.8),
  };
};

// Helper function to adjust color brightness
function adjustColorBrightness(hex: string, percent: number) {
  // Convert hex to RGB
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  // Adjust brightness
  r = Math.min(255, Math.max(0, Math.round(r + (percent * 255))));
  g = Math.min(255, Math.max(0, Math.round(g + (percent * 255))));
  b = Math.min(255, Math.max(0, Math.round(b + (percent * 255))));

  // Convert back to hex
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// Context type
interface ThemeContextProps {
  theme: typeof lightTheme;
  toggleTheme: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get saved preferences from localStorage
  const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
  const savedColor = typeof window !== 'undefined' ? localStorage.getItem('primaryColor') : null;
  const defaultColor = '#3b82f6'; // Default blue

  const [isDarkMode, setIsDarkMode] = useState(savedTheme === 'dark');
  const [primaryColor, setPrimaryColor] = useState(savedColor || defaultColor);
  
  // Build theme with primary color
  const buildTheme = (isDark: boolean, color: string) => {
    const baseTheme = isDark ? darkTheme : lightTheme;
    const colorVariants = createPrimaryColorVariants(color);
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: isDark 
          ? { ...colorVariants, 500: colorVariants[500] } 
          : colorVariants,
      },
    };
  };
  
  const [theme, setTheme] = useState(buildTheme(isDarkMode, primaryColor));
  
  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // Update theme when isDarkMode changes
  useEffect(() => {
    const newTheme = buildTheme(isDarkMode, primaryColor);
    setTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update HTML attribute for CSS selectors
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode, primaryColor]);
  
  // Update primary color
  const handleSetPrimaryColor = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
  };
  
  // Check system preference on mount
  useEffect(() => {
    if (savedTheme) return; // If user has set preference, respect it
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [savedTheme]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      primaryColor,
      setPrimaryColor: handleSetPrimaryColor
    }}>
      <StyledThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider; 