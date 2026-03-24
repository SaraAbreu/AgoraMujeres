// Ágora Mujeres - Color Palette
// Premium feminine aesthetic: warm browns, soft beige, elegant typography

export const BRAND_COLORS = {
  // Primary Background - Warm Brown/Gold
  bg: '#80704f',
  bgLight: '#9B8F6D',
  bgDark: '#6B5D42',
  
  // Card Backgrounds - Soft Beige
  card: '#EDE8E0',
  cardAlt: '#DDD5C8',
  
  // Text & Foreground
  white: '#F5F0E8',
  textDark: '#3D2B1A',
  textMedium: '#6B5340',
  textLight: '#A0907F',
  
  // Accent Colors
  crisisBtn: '#5C3D20',
  crisisBtnLight: '#8B5A2B',
  
  // Icon Colors
  iconWrite: '#8B5A2B',
  iconChat: '#B87333',
  iconPatterns: '#C4956A',
  iconRecord: '#8A8C6C',
  iconResources: '#9E7B5D',
  iconCycle: '#A67C5B',
  
  // Trial & Status
  trialBg: '#C8BAA8',
  trialText: '#5C4A32',
  expiredBg: '#F5E8E8',
  expiredText: '#cc0000',
  
  // UI Elements
  border: '#C8BAA8',
  borderLight: '#E8E1D6',
  tabBar: '#FDFBF9',
  
  // Status Colors
  success: '#7A9B82',
  warning: '#D4A574',
  error: '#C9596F',
};

// ─────────────────────────────────────────────────────────────
// LEGACY COLOR COMPATIBILITY LAYER
// Maps old color names to new BRAND_COLORS
// ─────────────────────────────────────────────────────────────
export const colors = {
  // Primary colors (maps to BRAND_COLORS)
  mossGreen: '#8A8C6C',
  mossGreenLight: '#A5A78A',
  mossGreenDark: '#6B6D52',
  warmBrown: '#B87333',
  warmBrownLight: '#D4956A',
  warmBrownDark: '#8B5A2B',
  
  // Surfaces
  cream: '#EDE8E0',
  creamLight: '#F5F0E8',
  creamDark: '#DDD5C8',
  
  // Backgrounds
  background: '#8A8C6C',
  backgroundAlt: '#7D7F61',
  surface: '#EDE8E0',
  surfaceAlt: '#D4C8BE',
  
  // Text colors
  text: '#3D2B1A',
  textSecondary: '#6B5340',
  textLight: '#A0907F',
  textOnDark: '#F5F0E8',
  textOnPrimary: '#F5F0E8',
  softWhite: '#F5F0E8',
  
  // Accents and utilities
  accentWarm: '#D4956A',
  accentSoft: '#E8D5C4',
  accentDark: '#A8857A',
  border: '#C8BAA8',
  borderLight: '#E8E1D6',
  shadow: 'rgba(61, 54, 40, 0.12)',
  shadowDark: 'rgba(61, 54, 40, 0.2)',
  overlay: 'rgba(61, 54, 40, 0.5)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
  
  // Status
  success: '#7A9B82',
  warning: '#D4A574',
  error: '#C9596F',
};

// ─────────────────────────────────────────────────────────────
// SPACING SCALE (8pt baseline grid)
// ─────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ─────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────
export const borderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 9999,
};

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────
export const typography = {
  fonts: {
    headingBold: 'Cormorant_700Bold',
    heading: 'Cormorant_600SemiBold',
    bodySemibold: 'Nunito_600SemiBold',
    bodyMedium: 'Nunito_500Medium',
    body: 'Nunito_400Regular',
  },
  sizes: {
    xs: 11,
    sm: 12,
    md: 13,
    lg: 14,
    xl: 15,
    title: 18,
    heading: 24,
    heroHeading: 28,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

// ─────────────────────────────────────────────────────────────
// SHADOWS  
// ─────────────────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default { BRAND_COLORS, colors, spacing, borderRadius, typography, shadows };
