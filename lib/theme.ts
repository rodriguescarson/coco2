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

const palette: { light: Theme; dark: Theme } = {
  light: {
    bg: '#F4F0EA',
    bgElevated: '#FBF8F2',
    surface: '#FFFFFF',
    surfaceMuted: '#EDE7DC',
    border: '#DCD4C4',
    text: '#1A1F1B',
    textDim: '#5A615C',
    textFaint: '#8A8F88',
    primary: '#2F6B4F',
    primaryFg: '#FFFFFF',
    primarySoft: '#D5E5DC',
    accent: '#E8927C',
    accentSoft: '#F8DED3',
    danger: '#C4453A',
    dangerSoft: '#F4D7D3',
    warning: '#D4943A',
    info: '#3A7AA0',
    overlay: 'rgba(15, 24, 20, 0.45)',
    moodColors: ['#C4453A', '#E8927C', '#D4B872', '#7AAE7E', '#2F6B4F'],
  },
  dark: {
    bg: '#0F1814',
    bgElevated: '#152019',
    surface: '#1A2620',
    surfaceMuted: '#22302A',
    border: '#2D3D35',
    text: '#E8EDE9',
    textDim: '#A0A89F',
    textFaint: '#6B7470',
    primary: '#6FB89A',
    primaryFg: '#0F1814',
    primarySoft: '#1F3A2D',
    accent: '#F0A98F',
    accentSoft: '#3A2A22',
    danger: '#E26B5F',
    dangerSoft: '#3D211E',
    warning: '#E8B868',
    info: '#7FB5D9',
    overlay: 'rgba(0, 0, 0, 0.55)',
    moodColors: ['#E26B5F', '#F0A98F', '#E0C683', '#9FCCA0', '#6FB89A'],
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
