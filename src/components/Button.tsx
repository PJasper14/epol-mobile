import React from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator, Text, TouchableOpacityProps, useWindowDimensions } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../utils/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  size = 'medium',
  style,
  ...rest
}) => {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? COLORS.text.disabled : COLORS.primary,
          borderColor: COLORS.primary,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? COLORS.text.disabled : COLORS.secondary,
          borderColor: COLORS.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? COLORS.text.disabled : COLORS.primary,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? COLORS.text.disabled : COLORS.error,
          borderColor: COLORS.error,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: disabled ? COLORS.text.disabled : COLORS.primary,
          borderColor: COLORS.primary,
        };
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          color: disabled ? COLORS.text.disabled : COLORS.primary,
        };
      case 'text':
        return {
          color: disabled ? COLORS.text.disabled : COLORS.primary,
        };
      default:
        return {
          color: COLORS.background,
        };
    }
  };

  const getSizeStyles = () => {
    // Adjust sizes for smaller screens
    const smallAdjustment = isSmallScreen ? 0.85 : 1;
    
    switch (size) {
      case 'small':
        return {
          paddingVertical: SPACING.xs * smallAdjustment,
          paddingHorizontal: SPACING.m * smallAdjustment,
          fontSize: FONT_SIZES.small,
        };
      case 'large':
        return {
          paddingVertical: SPACING.m * smallAdjustment,
          paddingHorizontal: SPACING.xl * smallAdjustment,
          fontSize: FONT_SIZES.h2,
        };
      default:
        return {
          paddingVertical: SPACING.s * smallAdjustment,
          paddingHorizontal: SPACING.l * smallAdjustment,
          fontSize: FONT_SIZES.body,
        };
    }
  };

  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: buttonStyles.backgroundColor,
          borderColor: buttonStyles.borderColor,
          width: fullWidth ? '100%' : 'auto',
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textStyles.color} size={isSmallScreen ? "small" : "small"} />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[
            styles.text, 
            { 
              color: textStyles.color, 
              fontSize: sizeStyles.fontSize 
            }
          ]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
});

export default Button; 