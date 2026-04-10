import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NavigationButtonProps {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: '#1a237e' },
    text: { color: '#ffffff' },
  },
  secondary: {
    container: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#1a237e' },
    text: { color: '#1a237e' },
  },
  danger: {
    container: { backgroundColor: '#ef4444' },
    text: { color: '#ffffff' },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: '#1a237e' },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 10 },
    text: { fontSize: 15 },
  },
  lg: {
    container: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 12 },
    text: { fontSize: 17 },
  },
};

const NavigationButton: React.FC<NavigationButtonProps> = ({
  label,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sStyle.container,
        vStyle.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#1a237e' : '#ffffff'} size="small" />
      ) : (
        <>
          {icon && <Text style={[styles.icon, sStyle.text]}>{icon}</Text>}
          <Text style={[styles.text, sStyle.text, vStyle.text, textStyle]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: { opacity: 0.5 },
  icon: { fontSize: 18 },
  text: { fontWeight: '600' },
});

export default NavigationButton;
