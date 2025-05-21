import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    mode: string;
    isDark: boolean;
    colors: {
      primary: Record<number, string>;
      neutral: Record<number, string>;
      success: Record<number, string>;
      warning: Record<number, string>;
      danger: Record<number, string>;
      info: Record<number, string>;
      purple: Record<number, string>;
      accent: Record<string, string>;
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
        lighter: string;
        light: string;
        hover: string;
        paper: string;
        card: string;
        dialog: string;
        input: string;
      };
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        inverse: string;
        disabled: string;
        hint: string;
        link: string;
        code: string;
        onDark: string;
        onLight: string;
      };
      border: {
        light: string;
        lighter: string;
        dark: string;
        input: string;
        focus: string;
        divider: string;
      };
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
    };
    spacing: Record<string | number, string>;
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
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
    zIndices: {
      hide: number;
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
  }
}