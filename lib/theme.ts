import { useColorScheme } from 'react-native';

export type ColorScheme = 'light' | 'dark';

type Theme = {
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  primary: string;
  primaryFg: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  info: string;
  overlay: string;
  moodColors: string[];
};

// More vibrant palette: emerald primary, warm coral accent, indigo/teal supports.
// Body-text contrast checked to clear WCAG AA on each surface.
const palette: { light: Theme; dark: Theme } = {
  light: {
    bg: '#F8F5EE',
    bgElevated: '#FFFCF5',
    surface: '#FFFFFF',
    surfaceMuted: '#EFEAE0',
    border: '#D8D0BE',
    text: '#0E1A14',
    textDim: '#4A554F',
    textFaint: '#7E8780',
    primary: '#0E8A5F',
    primaryFg: '#FFFFFF',
    primarySoft: '#C2EBD9',
    accent: '#FF7A59',
    accentSoft: '#FFD9CD',
    danger: '#D63B33',
    dangerSoft: '#FBD3D0',
    warning: '#E8A422',
    info: '#3F86E0',
    overlay: 'rgba(8, 18, 14, 0.5)',
    moodColors: ['#D63B33', '#FF7A59', '#E8A422', '#56B978', '#0E8A5F'],
  },
  dark: {
    bg: '#08120E',
    bgElevated: '#0F1C16',
    surface: '#162720',
    surfaceMuted: '#1F332B',
    border: '#2C443A',
    text: '#EEF3EE',
    textDim: '#A8B3AC',
    textFaint: '#74807A',
    primary: '#3CD49B',
    primaryFg: '#08120E',
    primarySoft: '#173829',
    accent: '#FF9A7A',
    accentSoft: '#3A2218',
    danger: '#FF5E55',
    dangerSoft: '#3D1A18',
    warning: '#F2C063',
    info: '#7AB1FA',
    overlay: 'rgba(0, 0, 0, 0.6)',
    moodColors: ['#FF5E55', '#FF9A7A', '#F2C063', '#7CDCA8', '#3CD49B'],
  },
};

export type Colors = Theme;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: -0.5, lineHeight: 40 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 30 },
  subtitle: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  micro: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, lineHeight: 14 },
};

export function useTheme() {
  const scheme = (useColorScheme() ?? 'light') as ColorScheme;
  return {
    scheme,
    colors: palette[scheme],
    radius,
    spacing,
    typography,
  };
}

export function getColors(scheme: ColorScheme): Colors {
  return palette[scheme];
}
