import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Text, 
  TextInputProps, 
  TouchableOpacity 
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../utils/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  touched?: boolean;
  onPressRightIcon?: () => void;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  touched,
  value,
  onPressRightIcon,
  style,
  placeholder,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = !!error && touched;

  const getBorderColor = () => {
    if (hasError) return COLORS.error;
    if (isFocused) return COLORS.primary;
    return COLORS.divider;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: rest.editable === false ? COLORS.divider : COLORS.background,
          },
          style,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.disabled}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={COLORS.primary}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIcon}
            onPress={onPressRightIcon}
            disabled={!onPressRightIcon}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
    paddingVertical: SPACING.s,
  },
  leftIcon: {
    marginRight: SPACING.s,
  },
  rightIcon: {
    marginLeft: SPACING.s,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.small,
    marginTop: SPACING.xs,
  },
});

export default Input; 