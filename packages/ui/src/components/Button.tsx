import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  textClassName?: string;
  className?: string;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  style?: ViewStyle;
}

export const Button = ({
  label,
  variant = 'primary',
  className = '',
  textClassName = '',
  onPress,
  disabled,
  activeOpacity = 0.8,
  style,
}: ButtonProps) => {
  const button = React.createElement(
    TouchableOpacity,
    {
      onPress,
      disabled,
      activeOpacity,
      style: [
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        style,
      ],
    },
    React.createElement(
      Text,
      {
        style: [
          styles.label,
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
        ],
      },
      label
    )
  );

  return button as any;
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#FFFFFF',
  },
});
