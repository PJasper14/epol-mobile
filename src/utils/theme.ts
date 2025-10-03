import { MD3LightTheme as DefaultTheme, MD3Theme } from 'react-native-paper';

export const COLORS = {
  primary: '#D32F2F',    // Red - representing authority and emphasis
  secondary: '#E53935',  // Slightly different Red - for secondary actions
  accent: '#FFCDD2',     // Light Red - for subtle accents
  background: '#FFFFFF', // White
  surface: '#FFFFFF',    // White
  text: {
    primary: '#212121',   // Near Black
    secondary: '#757575', // Gray
    disabled: '#BDBDBD',  // Light Gray
  },
  error: '#B71C1C',      // Dark Red for errors
  warning: '#FFC107',    // Amber for warnings
  success: '#4CAF50',    // Green for success
  info: '#2196F3',       // Blue for information
  divider: '#EEEEEE',    // Light gray for dividers
};

export const FONTS = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',
};

export const FONT_SIZES = {
  h1: 24,
  h2: 20,
  body: 16,
  caption: 14,
  small: 12,
};

export const SPACING = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  s: 4,
  m: 8,
  l: 16,
  round: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Create a theme using React Native Paper's DefaultTheme as a base
// Using MD3 Theme format for compatibility with React Native Paper v5
export const theme: MD3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: COLORS.accent,
    onPrimaryContainer: COLORS.primary,
    secondary: COLORS.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: COLORS.accent,
    onSecondaryContainer: COLORS.secondary,
    tertiary: COLORS.info,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#D1E4FF',
    onTertiaryContainer: '#001E36',
    error: COLORS.error,
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: COLORS.background,
    onBackground: COLORS.text.primary,
    surface: COLORS.surface,
    onSurface: COLORS.text.primary,
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: COLORS.text.secondary,
    outline: COLORS.divider,
    outlineVariant: '#E0E0E0',
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: COLORS.accent,
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#EEEEEE',
      level3: '#E6E6E6',
      level4: '#DDDDDD',
      level5: '#D5D5D5',
    },
    surfaceDisabled: 'rgba(33, 33, 33, 0.12)',
    onSurfaceDisabled: 'rgba(33, 33, 33, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

export default theme; 