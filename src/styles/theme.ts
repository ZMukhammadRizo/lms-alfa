import { DefaultTheme } from 'styled-components'

// Function to create a primary color palette based on a base color
export const createColorPalette = (primaryColor: string = '#0ea5e9') => {
	// Convert hex to RGB
	const hexToRgb = (hex: string): [number, number, number] => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
		return result
			? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
			: [0, 0, 0]
	}

	// Convert RGB to hex
	const rgbToHex = (r: number, g: number, b: number): string => {
		return (
			'#' +
			[r, g, b]
				.map(x => {
					const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
					return hex.length === 1 ? '0' + hex : hex
				})
				.join('')
		)
	}

	// Lighten color by mixing with white
	const lighten = (color: string, amount: number): string => {
		const rgb = hexToRgb(color)
		return rgbToHex(
			rgb[0] + (255 - rgb[0]) * amount,
			rgb[1] + (255 - rgb[1]) * amount,
			rgb[2] + (255 - rgb[2]) * amount
		)
	}

	// Darken color by mixing with black
	const darken = (color: string, amount: number): string => {
		const rgb = hexToRgb(color)
		return rgbToHex(rgb[0] * (1 - amount), rgb[1] * (1 - amount), rgb[2] * (1 - amount))
	}

	return {
		50: lighten(primaryColor, 0.85),
		100: lighten(primaryColor, 0.75),
		200: lighten(primaryColor, 0.65),
		300: lighten(primaryColor, 0.5),
		400: lighten(primaryColor, 0.25),
		500: primaryColor,
		600: darken(primaryColor, 0.1),
		700: darken(primaryColor, 0.2),
		800: darken(primaryColor, 0.3),
		900: darken(primaryColor, 0.4),
	}
}

// Base theme definition
export const baseTheme = {
	shadows: {
		sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
		md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
		lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
		xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
		'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
		inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
		none: 'none',
		DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
	},
	borderRadius: {
		sm: '0.125rem',
		md: '0.375rem',
		lg: '0.5rem',
		xl: '0.75rem',
		'2xl': '1rem',
		full: '9999px',
	},
	transition: {
		fast: '150ms',
		normal: '250ms',
		slow: '350ms',
	},
	breakpoints: {
		xs: '480px',
		sm: '640px',
		md: '768px',
		lg: '1024px',
		xl: '1280px',
		'2xl': '1536px',
	},
	spacing: {
		px: '1px',
		0: '0',
		0.5: '0.125rem',
		1: '0.25rem',
		1.5: '0.375rem',
		2: '0.5rem',
		2.5: '0.625rem',
		3: '0.75rem',
		3.5: '0.875rem',
		4: '1rem',
		5: '1.25rem',
		6: '1.5rem',
		7: '1.75rem',
		8: '2rem',
		9: '2.25rem',
		10: '2.5rem',
		12: '3rem',
		14: '3.5rem',
		16: '4rem',
		20: '5rem',
		24: '6rem',
		28: '7rem',
		32: '8rem',
		36: '9rem',
		40: '10rem',
		44: '11rem',
		48: '12rem',
		52: '13rem',
		56: '14rem',
		60: '15rem',
		64: '16rem',
		72: '18rem',
		80: '20rem',
		96: '24rem',
	},
	zIndices: {
		hide: -1,
		auto: 'auto',
		base: 0,
		docked: 10,
		dropdown: 1000,
		sticky: 1100,
		banner: 1200,
		overlay: 1300,
		modal: 1400,
		popover: 1500,
		skipLink: 1600,
		toast: 1700,
		tooltip: 1800,
	},
}

// Default primary color palette - sky blue
const defaultPrimaryPalette = {
	50: '#f0f9ff',
	100: '#e0f2fe',
	200: '#bae6fd',
	300: '#7dd3fc',
	400: '#38bdf8',
	500: '#0ea5e9',
	600: '#0284c7',
	700: '#0369a1',
	800: '#075985',
	900: '#0c4a6e',
}

// Creates a theme with the specified primary color
export const createTheme = (mode: 'light' | 'dark', primaryColor?: string) => {
	const primaryPalette = primaryColor ? createColorPalette(primaryColor) : defaultPrimaryPalette

	const theme = {
		...baseTheme,
		colors: {
			primary: primaryPalette,
			neutral: {
				50: '#f8fafc',
				100: '#f1f5f9',
				200: '#e2e8f0',
				300: '#cbd5e1',
				400: '#94a3b8',
				500: '#64748b',
				600: '#475569',
				700: '#334155',
				800: '#1e293b',
				900: '#0f172a',
			},
			success: {
				50: '#f0fdf4',
				100: '#dcfce7',
				200: '#bbf7d0',
				300: '#86efac',
				400: '#4ade80',
				500: '#22c55e',
				600: '#16a34a',
				700: '#15803d',
				800: '#166534',
				900: '#14532d',
			},
			warning: {
				50: '#fffbeb',
				100: '#fef3c7',
				200: '#fde68a',
				300: '#fcd34d',
				400: '#fbbf24',
				500: '#f59e0b',
				600: '#d97706',
				700: '#b45309',
				800: '#92400e',
				900: '#78350f',
			},
			danger: {
				50: '#fef2f2',
				100: '#fee2e2',
				200: '#fecaca',
				300: '#fca5a5',
				400: '#f87171',
				500: '#ef4444',
				600: '#dc2626',
				700: '#b91c1c',
				800: '#991b1b',
				900: '#7f1d1d',
			},
			info: {
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
			purple: {
				50: '#f5f3ff',
				100: '#ede9fe',
				200: '#ddd6fe',
				300: '#c4b5fd',
				400: '#a78bfa',
				500: '#8b5cf6',
				600: '#7c3aed',
				700: '#6d28d9',
				800: '#5b21b6',
				900: '#4c1d95',
			},
			accent: {
				green: '#10b981',
				red: '#ef4444',
				yellow: '#f59e0b',
				purple: '#8b5cf6',
			},
			white: '#ffffff',
			background: {
				primary: '#f1f5f9',
				secondary: '#ffffff',
				tertiary: '#e2e8f0',
				lighter: '#f8fafc',
				light: '#f5f5f5',
				hover: '#f1f5f9',
			},
			text: {
				primary: '#0f172a',
				secondary: '#475569',
				tertiary: '#64748b',
				inverse: '#ffffff',
			},
			border: {
				light: '#e2e8f0',
				lighter: '#f1f5f9',
				dark: '#cbd5e1',
			},
			shadow:
				mode === 'light'
					? {
							sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
							DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
							md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
							lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
							xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
							'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
							inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
							none: 'none',
					  }
					: {
							sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
							DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
							md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
							lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
							xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
							'2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
							inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
							none: 'none',
					  },
			sidebar: {
				background: mode === 'light' ? '#ffffff' : '#1e293b',
				text: mode === 'light' ? '#334155' : '#e2e8f0',
				border: mode === 'light' ? '#e2e8f0' : '#334155',
				logoText: mode === 'light' ? primaryPalette[600] : primaryPalette[400],
				sectionLabel: mode === 'light' ? '#94a3b8' : '#64748b',
				menuItem: mode === 'light' ? '#475569' : '#cbd5e1',
				activeMenuItem: mode === 'light' ? primaryPalette[600] : primaryPalette[400],
				activeMenuItemBg: mode === 'light' ? '#f1f5f9' : '#334155',
				menuItemHover: mode === 'light' ? '#f8fafc' : '#334155',
				toggleButton: mode === 'light' ? '#64748b' : '#94a3b8',
				toggleButtonHover: mode === 'light' ? '#e2e8f0' : '#475569',
				subtleText: mode === 'light' ? '#64748b' : '#94a3b8',
			},
		},
		shadows:
			mode === 'light'
				? {
						...baseTheme.shadows,
				  }
				: {
						sm: '0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
						md: '0 8px 12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
						lg: '0 12px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
						xl: '0 20px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
						'2xl': '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
						inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
						none: 'none',
						DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
				  },
		zIndices: {
			hide: -1,
			auto: 'auto',
			base: 0,
			docked: 10,
			dropdown: 1000,
			sticky: 1100,
			banner: 1200,
			overlay: 1300,
			modal: 1400,
			popover: 1500,
			skipLink: 1600,
			toast: 1700,
			tooltip: 1800,
			sidebar: 1000,
			navButton: 1100,
		},
	}

	return theme
}

// Extend DefaultTheme
declare module 'styled-components' {
	export interface DefaultTheme {
		colors: {
			primary: typeof defaultPrimaryPalette
			neutral: typeof colors.neutral
			success: typeof colors.success
			warning: typeof colors.warning
			danger: typeof colors.danger
			info: typeof colors.info
			purple: typeof colors.purple
			accent: typeof colors.accent
			white: string
			background: {
				primary: string
				secondary: string
				tertiary: string
				lighter: string
				light: string
				hover: string
			}
			text: {
				primary: string
				secondary: string
				tertiary: string
				inverse: string
			}
			border: {
				light: string
				lighter: string
				dark: string
			}
		}
		shadows: {
			sm: string
			md: string
			lg: string
			xl: string
			'2xl': string
			inner: string
			none: string
			DEFAULT: string
		}
		borderRadius: typeof baseTheme.borderRadius
		transition: typeof baseTheme.transition
		breakpoints: typeof baseTheme.breakpoints
		spacing: typeof baseTheme.spacing
		zIndices: typeof baseTheme.zIndices
	}
}

export const lightTheme = createTheme('light')
export const darkTheme = createTheme('dark')

export type Theme = typeof lightTheme
