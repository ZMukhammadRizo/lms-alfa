import { createGlobalStyle } from 'styled-components';
import { Theme } from './theme';

export const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    color-scheme: ${({ theme }) => theme.mode};
  }

  html {
    font-size: 16px;
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.typography.fontFamily};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    transition: background-color 0.3s ease, color 0.3s ease;
    min-height: 100vh;
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Global transitions for smooth theme switching */
  a, button, input, select, textarea,
  div, span, p, h1, h2, h3, h4, h5, h6,
  section, article, nav, footer {
    transition: background-color 0.3s ease,
                color 0.3s ease,
                border-color 0.3s ease,
                box-shadow 0.3s ease;
  }

  a {
    color: ${({ theme }) => theme.colors.text.link};
    text-decoration: none;
    transition: color 0.2s ease-in-out;

    &:hover {
      color: ${({ theme }) => theme.colors.primary[600]};
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.border.focus};
      outline-offset: 2px;
      text-decoration: none;
    }
  }

  button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
    outline: none;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.border.focus};
      outline-offset: 2px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    background-color: ${({ theme }) => theme.colors.background.input};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.input};
    border-radius: ${({ theme }) => theme.borders.radius.md};
    padding: 0.5rem 0.75rem;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.border.focus};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[500]}40;
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.text.hint};
    }

    &:disabled {
      background-color: ${({ theme }) => theme.isDark ? '#1e1e1e' : '#f3f4f6'};
      color: ${({ theme }) => theme.colors.text.disabled};
      cursor: not-allowed;
    }
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
    line-height: ${({ theme }) => theme.typography.lineHeight.tight};
    margin-bottom: 0.5em;
  }

  h1 { font-size: ${({ theme }) => theme.typography.fontSize['3xl']}; }
  h2 { font-size: ${({ theme }) => theme.typography.fontSize['2xl']}; }
  h3 { font-size: ${({ theme }) => theme.typography.fontSize.xl}; }
  h4 { font-size: ${({ theme }) => theme.typography.fontSize.lg}; }
  h5 { font-size: ${({ theme }) => theme.typography.fontSize.md}; }
  h6 { font-size: ${({ theme }) => theme.typography.fontSize.sm}; }

  p {
    margin-bottom: 1rem;
    line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    background-color: ${({ theme }) => theme.isDark ? '#2d2d2d' : theme.colors.neutral[100]};
    color: ${({ theme }) => theme.colors.text.code};
    padding: 0.2em 0.4em;
    border-radius: ${({ theme }) => theme.borders.radius.DEFAULT};
    font-size: 0.9em;
  }

  pre {
    background-color: ${({ theme }) => theme.isDark ? '#2d2d2d' : theme.colors.neutral[100]};
    color: ${({ theme }) => theme.colors.text.code};
    padding: 1rem;
    border-radius: ${({ theme }) => theme.borders.radius.md};
    overflow-x: auto;
    margin-bottom: 1rem;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.borders.radius.md};
    overflow: hidden;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  }

  th {
    background-color: ${({ theme }) => theme.isDark ? theme.colors.background.tertiary : theme.colors.neutral[50]};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  tr:hover {
    background-color: ${({ theme }) => theme.colors.action.hover};
  }

  /* Card styling */
  .card {
    background-color: ${({ theme }) => theme.colors.background.card};
    border-radius: ${({ theme }) => theme.borders.radius.lg};
    box-shadow: ${({ theme }) => theme.colors.shadow.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    overflow: hidden;
    transition: box-shadow 0.3s ease, transform 0.3s ease;

    &:hover {
      box-shadow: ${({ theme }) => theme.colors.shadow.md};
    }
  }

  /* Divider styling */
  hr {
    height: 1px;
    background-color: ${({ theme }) => theme.colors.border.divider};
    border: none;
    margin: 1.5rem 0;
  }

  /* Scrollbar Styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.isDark ? '#1a1a1a' : theme.colors.neutral[100]};
    border-radius: ${({ theme }) => theme.borders.radius.sm};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.isDark ? '#444444' : theme.colors.neutral[300]};
    border-radius: ${({ theme }) => theme.borders.radius.sm};

    &:hover {
      background: ${({ theme }) => theme.isDark ? '#555555' : theme.colors.neutral[400]};
    }
  }

  /* Selection Styles */
  ::selection {
    background-color: ${({ theme }) => theme.isDark ? theme.colors.primary[700] + '80' : theme.colors.primary[200]};
    color: ${({ theme }) => theme.isDark ? '#ffffff' : theme.colors.primary[900]};
  }

  /* Focus Styles */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }

  /* Print Styles */
  @media print {
    body {
      background: white;
      color: black;
    }

    @page {
      margin: 2cm;
    }

    a {
      color: black;
      text-decoration: underline;
    }
  }
`;