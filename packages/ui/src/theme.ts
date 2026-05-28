export const Colors = {
  navy: '#1B2A4A',
  teal: '#0F6E56',
  amber: '#BA7517',
  coral: '#993C1D',
  primary: '#0F6E56',
  primaryLight: '#E1F5EE',
  danger: '#A32D2D',
  warning: '#854F0B',
  success: '#27500A',
  background: '#FFFFFF',
  surface: '#F4F6FA',
  border: '#DDE3EE',
  text: '#1B2A4A',
  textSecondary: '#5A6170',
  textTertiary: '#9BA3AE',
  bronze: '#CD7F32',
  silver: '#A8A8A8',
  gold: '#BA7517',
  platinum: '#534AB7',
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.navy },
  h2: { fontSize: 22, fontWeight: '600' as const, color: Colors.navy },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.navy },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.text },
  small: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  tiny: { fontSize: 11, fontWeight: '400' as const, color: Colors.textTertiary },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 } as const;

// Tailwind-compatible token map for NativeWind config
export const tailwindTheme = {
  colors: {
    navy: { DEFAULT: Colors.navy, light: '#2A3F6A' },
    teal: { DEFAULT: Colors.teal, light: Colors.primaryLight, border: '#5DCAA5' },
    amber: { DEFAULT: '#854F0B', light: '#FAEEDA' },
    surface: Colors.surface,
    border: Colors.border,
    tier: {
      bronze: Colors.bronze,
      silver: Colors.silver,
      gold: Colors.gold,
      platinum: Colors.platinum,
    },
  },
};
