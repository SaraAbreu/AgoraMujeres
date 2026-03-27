/** Escala de espaciado base-4 con alias semánticos */
export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/** Alias semánticos — uso: sp.md, sp.screenX */
export const sp = {
  xxs:      2,            //  2  — minimal
  xs:       spacing[1],   //  4
  sm:       spacing[2],   //  8
  md:       spacing[4],   // 16
  lg:       spacing[6],   // 24
  xl:       spacing[8],   // 32
  xxl:      spacing[12],  // 48
  screenX:  spacing[5],   // 20  — margen lateral de pantallas
  screenY:  spacing[4],   // 16
  cardX:    spacing[5],   // 20
  cardY:    spacing[4],   // 16
  sectionGap: spacing[8], // 32  — entre secciones
} as const;
