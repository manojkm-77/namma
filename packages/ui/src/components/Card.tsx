import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  className?: string;
}

export const Card = ({ className = '', ...props }: CardProps) => {
  return (
    <View
      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm ${className}`}
      {...props}
    />
  );
};
