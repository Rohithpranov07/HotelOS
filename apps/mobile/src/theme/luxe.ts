// Hotel Kodai International design tokens — luxury dark editorial theme.
// Mirrors HotelOS.html design package (claude.ai/design export).

export const Luxe = {
  obsidian: '#08070A',
  graphite: '#110F0C',
  softBlack: '#16140F',
  ink: '#1C1A15',
  surfaceTop: '#15130F',
  surfaceBottom: '#0C0A08',
  hairline: 'rgba(255, 240, 210, 0.06)',
  hairlineStrong: 'rgba(255, 240, 210, 0.11)',

  ivory: '#F4EEDF',
  ivoryDim: '#BFB8A6',
  titanium: '#9A938A',
  muted: '#5C594F',

  gold: '#D4A857',
  goldBright: '#E8B466',
  goldDeep: '#9A7A3F',
  bronze: '#8B6F47',
  amberGlow: '#F4C97E',
} as const;

export const LuxeFonts = {
  serif: 'Newsreader_300Light',
  serifItalic: 'Newsreader_300Light_Italic',
  serifMedium: 'Newsreader_400Regular',
  sans: 'Onest_400Regular',
  sansMedium: 'Onest_500Medium',
  sansSemibold: 'Onest_600SemiBold',
  sansLight: 'Onest_300Light',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const LuxeRadii = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 26,
  xxl: 30,
  pill: 9999,
} as const;
