import React, { useRef, useEffect } from 'react';
import { ScrollView, Text, StyleSheet, View, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const colorText = '#8B5A2B';
const colorAccent = '#C5A059';

const FECHA_ACTUALIZACION = 'Actualizado: 20 de abril de 2026';
const PRIVACIDAD = [
  {
    titulo: '',
    texto: 'En Agora Mujeres, tu privacidad es nuestra prioridad.'
  },
  {
    titulo: 'Recogida y uso de datos',
    texto: 'Solo recopilamos los datos imprescindibles para el funcionamiento de la app. Nunca compartimos tu información con terceros sin tu consentimiento.'
  },
  {
    titulo: 'Protección y seguridad',
    texto: 'Tus datos están protegidos mediante cifrado y buenas prácticas de seguridad. Solo tú tienes acceso a tu información personal.'
  },
  {
    titulo: 'Derecho al olvido',
    texto: 'Puedes solicitar la eliminación total de tu cuenta y todos tus datos en cualquier momento desde Ajustes. Una vez confirmada la solicitud, eliminaremos de forma segura todos tus registros (diario, chat, ciclo, crisis, etc.) y te informaremos cuando el proceso haya finalizado.'
  },
  {
    titulo: 'Transparencia',
    texto: 'Te notificaremos siempre que tus datos sean eliminados. No conservamos ninguna información tras la eliminación.'
  },
  {
    titulo: 'Cumplimiento legal',
    texto: 'Cumplimos con la normativa vigente (GDPR/LOPD) para proteger tus derechos y tu privacidad.'
  },
  {
    titulo: '',
    texto: 'Si tienes dudas, contacta con nuestro equipo de soporte desde la app.'
  }
];

export default function PoliticaPrivacidadScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Ajuste de altura máxima del scroll según pantalla
  const maxScrollHeight = Math.max(260, Math.min(480, width * 1.1));

  // Feedback visual en el botón volver
  const [pressed, setPressed] = React.useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.card, { opacity: fadeAnim }]} testID="privacy-card">
        <Ionicons name="shield-checkmark-outline" size={48} color={colorAccent} style={{ marginBottom: 10 }} accessibilityLabel="Escudo privacidad" />
        <Text style={styles.title}>Política de Privacidad</Text>
        <Text style={styles.fecha}>{FECHA_ACTUALIZACION}</Text>
        <ScrollView style={{ maxHeight: maxScrollHeight }} showsVerticalScrollIndicator={false} testID="privacy-scroll">
          {PRIVACIDAD.map((sec, idx) => (
            <React.Fragment key={idx}>
              {idx !== 0 && <View style={styles.separator} />}
              {sec.titulo ? <Text style={styles.sectionTitle}>{sec.titulo}</Text> : null}
              <Text style={styles.text}>{sec.texto}</Text>
            </React.Fragment>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={[styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.replace('/ajustes')}
          accessibilityLabel="Volver a ajustes"
          accessibilityRole="button"
          testID="privacy-back-btn"
          activeOpacity={0.7}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Ionicons name="arrow-back" size={22} color={colorText} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: width * 0.92,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    shadowColor: colorAccent,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colorText,
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  fecha: {
    fontSize: 12,
    color: '#BBAA8A',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colorAccent,
    marginTop: 10,
    marginBottom: 2,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  text: {
    fontSize: 15,
    color: colorText,
    fontWeight: '300',
    textAlign: 'left',
    marginBottom: 10,
    lineHeight: 22,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#E6D5B8',
    marginVertical: 12,
    opacity: 0.4,
    borderRadius: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(197,160,89,0.13)',
    shadowColor: colorAccent,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  backBtnPressed: {
    backgroundColor: '#F5F0E8',
    borderColor: colorAccent,
    shadowOpacity: 0.18,
  },
  backText: { color: colorText, fontSize: 15, fontWeight: 'bold', marginLeft: 2 },
});
