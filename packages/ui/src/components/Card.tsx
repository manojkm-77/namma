import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const Card = ({ children, className, style }: CardProps) => {
  return React.createElement(
    View,
    {
      style: [styles.card, style],
      ...(className ? { className } : {}),
    },
    children
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
