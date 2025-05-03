import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: ${({ theme }) => theme.mode};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    height: 100%;
    width: 100%;
    transition: all 0.3s ease;
  }

  #root {
    height: 100%;
  }

  /* Apply transitions to these elements for smooth dark/light switching */
  button, a, input, textarea, select, div, span, p, h1, h2, h3, h4, h5, h6, 
  header, nav, footer, aside, main, section, article, table, tr, td, th {
    transition: background-color 0.3s ease,
                color 0.3s ease,
                border-color 0.3s ease,
                box-shadow 0.3s ease,
                opacity 0.3s ease;
  }

  /* Ensure text selection is visible with proper contrast in all contexts */
  ::selection {
    background-color: ${({ theme }) => theme.colors.primary[500]};
    color: ${({ theme }) => theme.colors.text.inverse};
  }

  /* Fix for Firefox */
  ::-moz-selection {
    background-color: ${({ theme }) => theme.colors.primary[500]};
    color: ${({ theme }) => theme.colors.text.inverse};
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary[500]}40;
    border-radius: 4px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primary[500]}80;
    }
  }

  /* Input styling */
  input, textarea, select {
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    padding: 0.5rem 0.75rem;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary[500]};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]}20;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.text.tertiary};
    }
  }

  /* Button styling */
  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
    font-size: inherit;
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* Link styling */
  a {
    color: ${({ theme }) => theme.colors.primary[500]};
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary[600]};
    }
  }

  /* Table styling */
  table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    
    th, td {
      border: 1px solid ${({ theme }) => theme.colors.border.light};
      padding: 0.75rem;
      text-align: left;
      
      &:first-child {
        border-left: 1px solid ${({ theme }) => theme.colors.border.light};
      }
      
      &:last-child {
        border-right: 1px solid ${({ theme }) => theme.colors.border.light};
      }
    }
    
    th {
      background-color: ${({ theme }) => theme.colors.background.tertiary};
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: ${({ theme }) => theme.colors.background.secondary};
    }
    
    tr:hover {
      background-color: ${({ theme }) => theme.colors.background.hover};
    }
  }

  /* Card styling */
  .card {
    background-color: ${({ theme }) => theme.colors.background.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    box-shadow: ${({ theme }) => theme.shadows.sm};
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: ${({ theme }) => theme.shadows.md};
      transform: translateY(-2px);
    }
  }
`;

export default GlobalStyle; 