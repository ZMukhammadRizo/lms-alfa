import { useThemeContext } from '../App';

/**
 * Hook that provides dark mode functionality across all panels
 */
export const useDarkMode = () => {
  const { isDarkMode, toggleTheme } = useThemeContext();
  
  /**
   * Get dark mode tailwind classes for an element
   * 
   * @param baseClasses - Base classes to apply
   * @param darkClasses - Classes to apply in dark mode
   * @returns Combined class string
   */
  const darkModeClass = (baseClasses: string, darkClasses: string): string => {
    return `${baseClasses} ${darkClasses}`;
  };

  /**
   * Apply common dark mode classes to elements
   * 
   * @param baseElement - Element type (card, input, text, etc.)
   * @returns - Tailwind dark mode classes for that element type
   */
  const getDarkClasses = (baseElement: 'card' | 'input' | 'button' | 'text' | 'container' | 'table' | 'select'): string => {
    switch (baseElement) {
      case 'card':
        return 'dark:bg-neutral-800 dark:border-neutral-700 dark:text-white';
      case 'input':
        return 'dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-neutral-400';
      case 'button':
        return 'dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-white dark:border-neutral-600';
      case 'text':
        return 'dark:text-white';
      case 'container':
        return 'dark:bg-neutral-900';
      case 'table':
        return 'dark:bg-neutral-800 dark:text-white dark:border-neutral-700';
      case 'select':
        return 'dark:bg-neutral-700 dark:border-neutral-600 dark:text-white';
      default:
        return '';
    }
  };

  return {
    isDarkMode,
    toggleTheme,
    darkModeClass,
    getDarkClasses
  };
};

export default useDarkMode; 