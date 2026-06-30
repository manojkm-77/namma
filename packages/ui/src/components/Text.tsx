import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
  className?: string;
}

export const Text = ({ className = '', ...props }: TextProps) => {
  return (
    <RNText
      className={`text-secondary ${className}`}
      {...props}
    />
  );
};
