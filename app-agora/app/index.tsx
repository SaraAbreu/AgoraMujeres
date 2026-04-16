import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Linking, Platform, Dimensions, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const basePadding = isWeb ? 100 : 25;

// --- COMPONENTES AUXILIARES ---

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setIsOpen(!isOpen)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons name={isOpen ? "remove" : "add"} size={20} color="#8B5A2B" />
      </View>
      {isOpen && <Animated.Text entering={FadeIn} style={styles.faqAnswer}>{answer}</Animated.Text>}
    </TouchableOpacity>
  );
};

const Highlight = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <View style={styles.highlightItem}>
    <Text style={styles.highlightTitle}>{title}</Text>
    <Text style={styles.highlightSubtitle}>{subtitle}</Text>
  </View>
);

// --- COMPONENTE PRINCIPAL ---

export default function AgoraFinalLanding() {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Parallax del logo
  const mX = useSharedValue(0);
  const mY = useSharedValue(0);

  const onMove = (e: any) => {
    if (isWeb) {
      mX.value = (e.clientX - width / 2) / 60;
      mY.value = (e.clientY - height / 2) / 60;
    }
  };

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(mX.value) }, { translateY: withSpring(mY.value) }],
  }));

  const handleSendFeedback = () => {
    if (feedback.length > 5) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFeedback('');
      }, 4000);
    }
  };

  return (
    <View style={styles.container} onPointerMove={onMove}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#FDFCFB', '#F5F0E8', '#E6D5B8']} style={StyleSheet.absoluteFill} />
      
      {/* LOGO MARCA DE AGUA */}
      <Animated.Image 
        source={require('../assets/images/logo2.png')} 
        style={[styles.bgLogo, logoStyle]}
        resizeMode="contain"
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* NAV BAR */}
        <View style={styles.navBar}>
          <Text style={styles.brandingTech}>SYNTEXIA Solutions</Text>
          <TouchableOpacity style={styles.navAction} onPress={() => Linking.openURL('https://agoramujeres.syntexia-solutions.es/')}>
            <Text style={styles.navActionText}>INSTALAR APP</Text>
          </TouchableOpacity>
        </View>

        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeIn.delay(300)}>
            <Text style={styles.titleAgora}>ÁGORA</Text>
            <Text style={styles.titleMujeres}>mujeres</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(800)} style={styles.manifestoWrapper}>
            <View style={styles.manifestoLine} />
            <Text style={styles.manifestoText}>
              Donde el tiempo recupera su <Text style={styles.italic}>consciencia</Text>.
            </Text>
          </Animated.View>
        </View>

        {/* SECTION: SHOWCASE */}
        <View style={styles.showcaseSection}>
          <Animated.View entering={FadeInDown.delay(400)} style={styles.mockupContainer}>
             <View style={styles.mockupInner}>
                <Ionicons name="phone-portrait-outline" size={40} color="#C5A059" />
                <Text style={styles.mockupText}>Interfaz de Ágora: El silencio diseñado.</Text>
             </View>
          </Animated.View>
          <View style={styles.highlightsGrid}>
            <Highlight title="01. ENFOQUE" subtitle="Diseño libre de notificaciones intrusivas." />
            <Highlight title="02. INTELIGENCIA" subtitle="IA empática entrenada para la escucha activa." />
            <Highlight title="03. SINCRONÍA" subtitle="Tu santuario disponible en cualquier dispositivo." />
          </View>
        </View>

        {/* SECTION: BENEFICIOS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>EL VALOR DEL SANTUARIO</Text>
          <View style={[styles.featuresGrid, isWeb && { flexDirection: 'row' }]}>
            <View style={styles.featureCard}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#8B5A2B" />
              <Text style={styles.featureTitle}>Privacidad Ética</Text>
              <Text style={styles.featureText}>Tus datos son tu refugio. Cifrado de extremo a extremo en cada sesión.</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="sparkles-outline" size={32} color="#8B5A2B" />
              <Text style={styles.featureTitle}>IA No Comercial</Text>
              <Text style={styles.featureText}>Acompañamiento inteligente que no entrena con tus secretos.</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="leaf-outline" size={32} color="#8B5A2B" />
              <Text style={styles.featureTitle}>Tiempo Orgánico</Text>
              <Text style={styles.featureText}>Diseñada para reducir el ruido digital y reconectar con el presente.</Text>
            </View>
          </View>
        </View>

        {/* SECTION: ACCESO */}
        <View style={styles.actionSection}>
          <View style={[styles.glassCápsula, isWeb && styles.pricingRowWeb]}>
            <TouchableOpacity style={styles.actionDoor} onPress={() => router.push('/login')}>
              <Text style={styles.cardLabel}>UMBRAL WEB</Text>
              <Text style={styles.cardMainTitle}>Esencia</Text>
              <Text style={styles.cardDesc}>90 min de cortesía para tu primera inmersión.</Text>
              <View style={styles.circleDownload}><Ionicons name="chevron-forward" size={18} color="#C5A059" /></View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionDoorPremium} onPress={() => Linking.openURL('https://agoramujeres.syntexia-solutions.es/')}>
              <LinearGradient colors={['rgba(139, 90, 43, 0.08)', 'rgba(197, 160, 89, 0.15)']} style={StyleSheet.absoluteFill} />
              <Text style={styles.cardLabelGold}>APP NATIVA</Text>
              <Text style={styles.cardMainTitleGold}>Áurea</Text>
              <Text style={styles.cardDescGold}>Acceso infinito y modo offline para un refugio constante.</Text>
              <View style={styles.goldActionPill}>
                <Text style={styles.goldPillText}>COMENZAR AHORA</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION: CO-CREACIÓN */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>CO-CREACIÓN</Text>
          <View style={styles.feedbackWrapper}>
            <Text style={styles.feedbackTitle}>Tu voz construye el santuario</Text>
            <Text style={styles.feedbackSubtitle}>Estamos en fase de rediseño activo. Déjanos tu impresión.</Text>
            {!submitted ? (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="¿Qué mejorarías de Ágora?"
                  placeholderTextColor="rgba(139, 90, 43, 0.4)"
                  multiline
                  value={feedback}
                  onChangeText={setFeedback}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, feedback.length <= 5 && { opacity: 0.5 }]} 
                  onPress={handleSendFeedback}
                  disabled={feedback.length <= 5}
                >
                  <Text style={styles.sendButtonText}>ENVIAR RESEÑA</Text>
                  <Ionicons name="paper-plane-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <Animated.View entering={FadeIn} style={styles.thanksContainer}>
                <Ionicons name="checkmark-circle-outline" size={40} color="#8B5A2B" />
                <Text style={styles.thanksText}>Gracias. Integraremos tu feedback en el próximo sprint.</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* SECTION: FAQ (AMPLIADA) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>PREGUNTAS FRECUENTES</Text>
          <View style={styles.faqContainer}>
            <FAQItem 
              question="¿Por qué existen los 90 minutos de cortesía?" 
              answer="Cada sesión de reflexión consume recursos de IA de alto rendimiento (tokens). Ofrecemos este tiempo para que experimentes la calidad del acompañamiento empático de Ágora sin compromiso inicial." 
            />
            <FAQItem 
              question="¿Cómo protege Syntexia mis conversaciones?" 
              answer="La privacidad es nuestro pilar técnico. No almacenamos historiales para entrenamiento comercial ni compartimos datos con terceros. Tus diálogos son cifrados y privados." 
            />
            <FAQItem 
              question="¿El diseño es igual en todos los dispositivos?" 
              answer="Sí. Hemos desarrollado Ágora bajo una arquitectura de código único. Esto garantiza que tengas la misma experiencia de paz y elegancia tanto en tu iPhone/Android como en tu ordenador." 
            />
            <FAQItem 
              question="¿Necesito conexión a internet constante?" 
              answer="Para la versión Web sí. Sin embargo, con nuestra App Nativa (Círculo Áurea) puedes acceder a ciertas funciones del santuario y herramientas de meditación en modo offline." 
            />
            <FAQItem 
              question="¿Puedo cancelar mi suscripción Áurea en cualquier momento?" 
              answer="Por supuesto. No hay permanencias. Queremos que Ágora sea un lugar donde elijas estar, no una obligación." 
            />
          </View>
        </View>
        {/* SECCIÓN FINAL: CIERRE DE IMPACTO */}
        <View style={styles.finalCTA}>
          <LinearGradient 
            colors={['rgba(197, 160, 89, 0.05)', 'rgba(139, 90, 43, 0.1)']} 
            style={styles.finalCTAGradient} 
          />
          <Text style={styles.finalTitle}>¿Lista para el silencio?</Text>
          <Text style={styles.finalSubtitle}>Únete a las mujeres que ya han convertido su tiempo en consciencia.</Text>
          
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.mainButtonText}>ENTRAR AL SANTUARIO</Text>
            <Ionicons name="enter-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>    
        {/* FOOTER ACTUALIZADO */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://syntexia-solutions.es/')}>
                <Text style={styles.fLink}>SYNTEXIA SOLUTIONS</Text>
            </TouchableOpacity>
            <Text style={styles.fDot}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://agoramujeres.syntexia-solutions.es/')}>
                <Text style={styles.fLink}>SANTUARIO</Text>
            </TouchableOpacity>
            <Text style={styles.fDot}>•</Text>
            <Text style={styles.fLink}>PRIVACIDAD</Text>
          </View>
          <Text style={styles.footerBrand}>MMXXVI · SYNTEXIA SOLUTIONS · ÁGORA</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFCFB' },
  bgLogo: { position: 'absolute', width: isWeb ? width * 0.7 : width * 0.9, height: isWeb ? width * 0.7 : width * 0.9, alignSelf: 'center', top: height * 0.1, opacity: 0.1 },
  scroll: { paddingBottom: 100 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: basePadding, paddingVertical: 50 },
  brandingTech: { letterSpacing: 10, fontSize: 11, color: '#8B5A2B', fontWeight: 'bold' },
  navAction: { borderBottomWidth: 1, borderColor: '#8B5A2B', paddingBottom: 5 },
  navActionText: { fontSize: 10, fontWeight: 'bold', color: '#8B5A2B', letterSpacing: 2 },
  
  heroSection: { height: height * 0.6, justifyContent: 'center', alignItems: 'center' },
  titleAgora: { fontSize: isWeb ? 160 : 70, fontWeight: '100', letterSpacing: isWeb ? 50 : 15, color: '#C5A059', textAlign: 'center' },
  titleMujeres: { fontSize: isWeb ? 90 : 45, fontWeight: '100', letterSpacing: 15, color: '#8B5A2B', textAlign: 'center', marginTop: isWeb ? -60 : -20, fontFamily: isWeb ? 'Georgia, serif' : 'System' },
  
  manifestoWrapper: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  manifestoLine: { width: 40, height: 1, backgroundColor: '#C5A059', marginBottom: 20 },
  manifestoText: { textAlign: 'center', fontSize: 24, color: '#8B5A2B', fontWeight: '200' },
  italic: { fontStyle: 'italic' },

  showcaseSection: { marginTop: 40, paddingHorizontal: basePadding, alignItems: 'center' },
  mockupContainer: { 
    width: isWeb ? 800 : '100%', height: 400, backgroundColor: 'white', borderRadius: 40, 
    justifyContent: 'center', alignItems: 'center', elevation: 20, shadowColor: '#8B5A2B', shadowOpacity: 0.1, shadowRadius: 30,
    borderWidth: 1, borderColor: 'rgba(139,90,43,0.1)'
  },
  mockupInner: { alignItems: 'center' },
  mockupText: { marginTop: 20, color: '#8B5A2B', fontWeight: '200', fontSize: 16 },
  highlightsGrid: { flexDirection: isWeb ? 'row' : 'column', marginTop: 60, gap: 40, width: '100%' },
  highlightItem: { flex: 1, alignItems: 'center' },
  highlightTitle: { fontSize: 10, color: '#C5A059', fontWeight: 'bold', letterSpacing: 3, marginBottom: 10 },
  highlightSubtitle: { textAlign: 'center', color: '#8B5A2B', opacity: 0.6, fontSize: 13 },

  sectionContainer: { paddingHorizontal: basePadding, marginTop: 120 },
  sectionLabel: { fontSize: 10, letterSpacing: 5, color: '#C5A059', fontWeight: 'bold', textAlign: 'center', marginBottom: 50 },
  
  featuresGrid: { gap: 30 },
  featureCard: { flex: 1, padding: 40, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 30, alignItems: 'center' },
  featureTitle: { fontSize: 18, fontWeight: 'bold', color: '#8B5A2B', marginVertical: 15 },
  featureText: { textAlign: 'center', color: '#8B5A2B', opacity: 0.7, lineHeight: 22 },

  actionSection: { paddingHorizontal: basePadding, marginTop: 100 },
  glassCápsula: { borderRadius: 60, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.6)', overflow: 'hidden' },
  pricingRowWeb: { flexDirection: 'row' },
  actionDoor: { flex: 1, padding: 60, alignItems: 'center' },
  actionDoorPremium: { flex: 1, padding: 60, alignItems: 'center' },
  divider: { width: isWeb ? 1 : '80%', height: isWeb ? undefined : 1, backgroundColor: 'rgba(139, 90, 43, 0.1)', alignSelf: 'center' },
  cardLabel: { fontSize: 9, letterSpacing: 4, color: '#C5A059', marginBottom: 20 },
  cardLabelGold: { fontSize: 9, letterSpacing: 4, color: '#8B5A2B', marginBottom: 20 },
  cardMainTitle: { fontSize: 32, fontWeight: '200', color: '#8B5A2B' },
  cardMainTitleGold: { fontSize: 32, fontWeight: '200', color: '#8B5A2B' },
  cardDesc: { textAlign: 'center', color: '#8B5A2B', opacity: 0.6, marginTop: 10 },
  cardDescGold: { textAlign: 'center', color: '#8B5A2B', opacity: 0.8, marginTop: 10 },
  goldActionPill: { backgroundColor: '#8B5A2B', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, marginTop: 30 },
  goldPillText: { color: 'white', fontWeight: 'bold', fontSize: 10, letterSpacing: 2 },
  circleDownload: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#C5A059', justifyContent: 'center', alignItems: 'center', marginTop: 30 },

  feedbackWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 40, padding: 40, alignItems: 'center' },
  feedbackTitle: { fontSize: 24, color: '#8B5A2B', fontWeight: '200', marginBottom: 10 },
  feedbackSubtitle: { textAlign: 'center', color: '#8B5A2B', opacity: 0.6, marginBottom: 30 },
  inputContainer: { width: '100%', maxWidth: 600 },
  textInput: { backgroundColor: 'white', borderRadius: 20, padding: 20, height: 100, textAlignVertical: 'top', color: '#8B5A2B' },
  sendButton: { backgroundColor: '#8B5A2B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 30, marginTop: 20, gap: 10 },
  sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 },
  thanksContainer: { alignItems: 'center', padding: 20 },
  thanksText: { color: '#8B5A2B', fontWeight: '500', marginTop: 10, textAlign: 'center' },

  faqContainer: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  faqItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(139, 90, 43, 0.1)', paddingVertical: 25 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 16, color: '#8B5A2B', fontWeight: '500' },
  faqAnswer: { marginTop: 15, color: '#8B5A2B', opacity: 0.7, lineHeight: 24 },

  footer: { marginTop: 150, paddingBottom: 60, alignItems: 'center' },
  footerLinks: { flexDirection: 'row', gap: 20, marginBottom: 20, alignItems: 'center' },
  fLink: { fontSize: 9, letterSpacing: 2, color: '#8B5A2B', fontWeight: 'bold' },
  fDot: { color: '#C5A059' },
  footerBrand: { letterSpacing: 8, fontSize: 10, color: '#8B5A2B', opacity: 0.4 },
  finalCTA: {
    marginTop: 100,
    marginHorizontal: basePadding,
    paddingVertical: 100,
    borderRadius: 50,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  finalCTAGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  finalTitle: {
    fontSize: isWeb ? 48 : 32,
    fontWeight: '100',
    color: '#8B5A2B',
    marginBottom: 20,
    letterSpacing: 2,
  },
  finalSubtitle: {
    fontSize: 16,
    color: '#8B5A2B',
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 500,
  },
  mainButton: {
    backgroundColor: '#8B5A2B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 40,
    gap: 15,
    elevation: 10,
    shadowColor: '#8B5A2B',
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  mainButtonText: {
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
  },
});