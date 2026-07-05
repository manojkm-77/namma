import React from 'react';
import { Text as RNText, StyleSheet, TextStyle } from 'react-native';

export interface TextProps {
  children?: React.ReactNode;
  className?: string;
  style?: TextStyle;
}

export const Text = ({ children, className, style }: TextProps) => {
  return React.createElement(
    RNText,
    {
      style: [styles.text, style],
      ...(className ? { className } : {}),
    },
    children
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#374151',
  },
});
