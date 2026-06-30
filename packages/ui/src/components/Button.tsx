import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary';
  textClassName?: string;
  className?: string;
}

export const Button = ({
  label,
  variant = 'primary',
  className = '',
  textClassName = '',
  ...props
}: ButtonProps) => {
  const baseButtonClass = 'py-3.5 px-6 rounded-xl items-center justify-center flex-row';
  const variantButtonClass =
    variant === 'primary'
      ? 'bg-primary active:opacity-90'
      : 'bg-secondary active:opacity-90';

  const baseTextClass = 'text-base font-semibold tracking-wide';
  const variantTextClass =
    variant === 'primary' ? 'text-secondary' : 'text-primary';

  return (
    <TouchableOpacity
      className={`${baseButtonClass} ${variantButtonClass} ${className}`}
      activeOpacity={0.8}
      {...props}
    >
      <Text className={`${baseTextClass} ${variantTextClass} ${textClassName}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};
