import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: Record<number, string>;
      neutral: Record<number, string>;
      success: Record<number, string>;
      warning: Record<number, string>;
      danger: Record<number, string>;
      purple: Record<number, string>;
      accent: Record<string, string>;
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        inverse: string;
      };
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
        lighter: string;
        light: string;
        hover: string;
      };
      border: {
        light: string;
        lighter: string;
        dark: string;
      };
    };
    spacing: Record<string | number, string> & number[];
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    zIndices: {
      hide: number | string;
      auto: string;
      base: number;
      docked: number;
      dropdown: number;
      sticky: number;
      banner: number;
      overlay: number;
      modal: number;
      popover: number;
      skipLink: number;
      toast: number;
      tooltip: number;
    };
    transition: {
      fast: string;
      normal: string;
      slow: string;
    };
    breakpoints: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  }
}