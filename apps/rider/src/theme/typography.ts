import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: undefined,
  medium: undefined,
  semiBold: undefined,
  bold: undefined,
  black: undefined,
} as const;

export const typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '900',
    letterSpacing: -0.25,
  } as TextStyle,
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '900',
  } as TextStyle,
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
  } as TextStyle,
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
  } as TextStyle,
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  } as TextStyle,
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  } as TextStyle,
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  } as TextStyle,
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0.1,
  } as TextStyle,
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  } as TextStyle,
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  } as TextStyle,
  caption: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  } as TextStyle,
  overline: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  } as TextStyle,
  priceLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -0.5,
  } as TextStyle,
  priceMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
  } as TextStyle,
  priceSmall: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  } as TextStyle,
} as const;

export type TypographyName = keyof typeof typography;
