// Este archivo existe solo como fallback para expo-router.
// La lógica real de redirección está en _layout.tsx.
// No añadir lógica aquí para evitar conflictos con el flujo de navegación.
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigimos al Home elegante que está dentro de (tabs)
  return <Redirect href="/(tabs)/home" />;
}
