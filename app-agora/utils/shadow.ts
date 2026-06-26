import { Platform } from 'react-native';

/**
 * Devuelve estilos de sombra compatibles con web y nativo.
 * En web usa boxShadow (CSS), en nativo usa shadow* props.
 */
export function shadow(
  color: string = '#000',
  offsetX: number = 0,
  offsetY: number = 4,
  blur: number = 12,
  opacity: number = 0.12,
  elevation: number = 6,
) {
  if (Platform.OS === 'web') {
    // Convierte color hex + opacity a rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px rgba(${r},${g},${b},${opacity})`,
    } as any;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur / 2,
    elevation,
  };
}
