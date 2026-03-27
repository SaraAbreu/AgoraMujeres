export const typography = {
  regular: "Quicksand_400Regular",
  medium: "Quicksand_500Medium",
  bold: "Quicksand_600SemiBold",
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
};

export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 28,
  xl: 32,
  "2xl": 38,
  "3xl": 44,
  "4xl": 52,
};

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
};

export const fonts = {
  sansMedium: typography.medium,
  sansBold: typography.bold,
};

export const textStyles = {
  body: {
    fontFamily: typography.regular,
    fontSize: fontSize.md,
    lineHeight: lineHeight.base,
  },
  bodySm: {
    fontFamily: typography.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  h1: {
    fontFamily: typography.bold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight["2xl"],
  },
  subtitle: {
    fontFamily: typography.medium,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
  },
  labelCaps: {
    fontFamily: typography.medium,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as 'uppercase',
  },
};
