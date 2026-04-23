import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

// Zonas básicas: cabeza, cuello, hombros, brazos, manos, pecho, abdomen, espalda, pelvis, piernas, pies
const ZONAS = [
  { key: 'cabeza', label: 'Cabeza', color: '#F9D3B4' },
  { key: 'cuello', label: 'Cuello', color: '#F7BFA0' },
  { key: 'hombros', label: 'Hombros', color: '#F7BFA0' },
  { key: 'brazos', label: 'Brazos', color: '#F7BFA0' },
  { key: 'manos', label: 'Manos', color: '#F7BFA0' },
  { key: 'pecho', label: 'Pecho', color: '#F9D3B4' },
  { key: 'abdomen', label: 'Abdomen', color: '#F9D3B4' },
  { key: 'espalda', label: 'Espalda', color: '#F7BFA0' },
  { key: 'pelvis', label: 'Pelvis', color: '#F7BFA0' },
  { key: 'piernas', label: 'Piernas', color: '#F7BFA0' },
  { key: 'pies', label: 'Pies', color: '#F7BFA0' },
];

// SVG simplificado, cada Path representa una zona. Puedes mejorar el SVG con una silueta más detallada.
export default function SiluetaMujerDolor({ onSelect }) {
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);

  // Callback al pulsar una zona
  const handleZona = (key) => {
    setZonaSeleccionada(key);
    if (onSelect) onSelect(key);
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={180} height={400} viewBox="0 0 180 400">
        {/* Cabeza */}
        <Path d="M80,20 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0" fill={zonaSeleccionada === 'cabeza' ? '#C5A059' : '#F9D3B4'} onPress={() => handleZona('cabeza')} />
        {/* Cuello */}
        <Path d="M95,40 v20 h10 v-20 z" fill={zonaSeleccionada === 'cuello' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('cuello')} />
        {/* Hombros */}
        <Path d="M75,60 h60 v10 h-60 z" fill={zonaSeleccionada === 'hombros' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('hombros')} />
        {/* Brazos */}
        <Path d="M65,70 v80 h10 v-80 z M145,70 v80 h-10 v-80 z" fill={zonaSeleccionada === 'brazos' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('brazos')} />
        {/* Manos */}
        <Path d="M65,150 v20 h10 v-20 z M145,150 v20 h-10 v-20 z" fill={zonaSeleccionada === 'manos' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('manos')} />
        {/* Pecho */}
        <Path d="M95,60 v40 h10 v-40 z" fill={zonaSeleccionada === 'pecho' ? '#C5A059' : '#F9D3B4'} onPress={() => handleZona('pecho')} />
        {/* Abdomen */}
        <Path d="M95,100 v40 h10 v-40 z" fill={zonaSeleccionada === 'abdomen' ? '#C5A059' : '#F9D3B4'} onPress={() => handleZona('abdomen')} />
        {/* Espalda */}
        <Path d="M105,60 v80 h10 v-80 z" fill={zonaSeleccionada === 'espalda' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('espalda')} />
        {/* Pelvis */}
        <Path d="M95,140 v20 h20 v-20 z" fill={zonaSeleccionada === 'pelvis' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('pelvis')} />
        {/* Piernas */}
        <Path d="M95,160 v100 h10 v-100 z M115,160 v100 h-10 v-100 z" fill={zonaSeleccionada === 'piernas' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('piernas')} />
        {/* Pies */}
        <Path d="M95,260 v20 h10 v-20 z M115,260 v20 h-10 v-20 z" fill={zonaSeleccionada === 'pies' ? '#C5A059' : '#F7BFA0'} onPress={() => handleZona('pies')} />
      </Svg>
    </View>
  );
}
