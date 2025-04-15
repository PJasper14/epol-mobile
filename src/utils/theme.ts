import { DefaultTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#1F4E79',    // Deep Blue - representing authority and trust
  secondary: '#2E7D32',  // Green - representing environment
  accent: '#FF8F00',     // Amber - for alerts and important actions
  background: '#FFFFFF', // White
  surface: '#FFFFFF',    // White
  text: {
    primary: '#212121',   // Near Black
    secondary: '#757575', // Gray
    disabled: '#BDBDBD',  // Light Gray
  },
  error: '#D32F2F',      // Red for errors
  warning: '#FFC107',    // Amber for warnings
  success: '#4CAF50',    // Green for success
  info: '#2196F3',       // Blue for information
  divider: '#E0E0E0',    // Light gray for dividers
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
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text.primary,
    disabled: COLORS.text.disabled,
    placeholder: COLORS.text.secondary,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: COLORS.accent,
    error: COLORS.error,
  },
  fonts: {
    regular: {
      fontFamily: FONTS.regular,
    },
    medium: {
      fontFamily: FONTS.medium,
    },
    light: {
      fontFamily: FONTS.light,
    },
    thin: {
      fontFamily: FONTS.light,
    },
  },
  roundness: BORDER_RADIUS.m,
};

export default theme; 