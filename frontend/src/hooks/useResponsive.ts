import { Dimensions, Platform } from 'react-native';

export const useResponsive = () => {
  const isWeb = Platform.OS === 'web';
  const { width, height } = Dimensions.get('window');
  
  // Breakpoints comunes
  const isMobile = width < 480;          // < 480px: Teléfono
  const isTablet = width >= 480 && width < 1024; // 480-1023px: Tablet
  const isDesktop = width >= 1024;       // >= 1024px: Desktop/Web
  
  // Responsive values
  const spacing = {
    xs: isMobile ? 4 : 6,
    sm: isMobile ? 8 : 12,
    md: isMobile ? 12 : 16,
    lg: isMobile ? 16 : 24,
    xl: isMobile ? 24 : 32,
  };
  
  const fontSize = {
    xs: isMobile ? 11 : 12,
    sm: isMobile ? 12 : 13,
    base: isMobile ? 14 : 16,
    lg: isMobile ? 16 : 18,
    xl: isMobile ? 18 : 20,
    '2xl': isMobile ? 20 : 24,
    '3xl': isMobile ? 24 : 32,
  };

  const maxContentWidth = isDesktop ? 1200 : isTablet ? 900 : width;
  const gridColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  
  return {
    isWeb,
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    spacing,
    fontSize,
    maxContentWidth,
    gridColumns,
  };
};
