import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    mode: 'light' | 'dark';
    colors: {
      primary: Record<number, string>;
      neutral: Record<number, string>;
      success: Record<number, string>;
      warning: Record<number, string>;
      danger: Record<number, string>;
      purple: Record<number, string>;
      accent: {
        green: string;
        red: string;
        yellow: string;
        purple: string;
      };
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
        lighter: string;
        light: string;
        hover: string;
      };
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        inverse: string;
      };
      border: {
        light: string;
        lighter: string;
        dark: string;
      };
      sidebar: {
        background: string;
        text: string;
        border: string;
        logoText: string;
        sectionLabel: string;
        menuItem: string;
        activeMenuItem: string;
        activeMenuItemBg: string;
        menuItemHover: string;
        toggleButton: string;
        toggleButtonHover: string;
        subtleText: string;
      };
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      small?: string;
      medium?: string;
    };
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
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
    spacing: {
      px: string;
      0: string;
      0.5: string;
      1: string;
      1.5: string;
      2: string;
      2.5: string;
      3: string;
      3.5: string;
      4: string;
      5: string;
      6: string;
      7: string;
      8: string;
      9: string;
      10: string;
      12: string;
      14: string;
      16: string;
      20: string;
      24: string;
      28: string;
      32: string;
      36: string;
      40: string;
      44: string;
      48: string;
      52: string;
      56: string;
      60: string;
      64: string;
      72: string;
      80: string;
      96: string;
      [key: string]: string;
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
      sidebar?: number;
      navButton?: number;
    };
  }
}