import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Platform, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const C = {
  forest: '#4A664D',
  forestDim: '#3A5140',
  forestDeep: '#2C3D2E',
  moss: '#6B8F6E',
  sage: '#A8C5A0',
  mint: '#D4E8D0',
  mintSoft: '#EAF4E8',
  cream: '#F8F7F2',
  parchment: '#F0EDE4',
  warm: '#E8E2D8',
  muted: '#9A958E',
  charcoal: '#3D3A35',
  white: '#FFFFFF',
  gold: '#C9A84C',
  goldSoft: '#F5EDD6',
};

function FadeUp({ delay = 0, children }: any) {
  const a = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(a, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 700, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: a, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function Press({ onPress, children, style }: any) {
  const sc = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[style, { transform: [{ scale: sc }] }]}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: true }).start()}
        onPress={onPress}
        activeOpacity={1}
      >{children}</TouchableOpacity>
    </Animated.View>
  );
}

// ── FAQ Item ───────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const height = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.parallel([
      Animated.timing(height, { toValue: open ? 0 : 1, duration: 300, useNativeDriver: false }),
      Animated.timing(rotate, { toValue: open ? 0 : 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const maxHeight = height.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.9} style={s.faqItem}>
      <View style={s.faqRow}>
        <Text style={s.faqQ}>{q}</Text>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="add" size={20} color={C.forest} />
        </Animated.View>
      </View>
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <Text style={s.faqA}>{a}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Step card ──────────────────────────────────────────────────
function Step({ num, icon, title, desc, delay }: any) {
  return (
    <FadeUp delay={delay}>
      <View style={s.stepCard}>
        <View style={s.stepNumBox}>
          <Text style={s.stepNum}>{num}</Text>
        </View>
        <View style={s.stepIconBox}><Ionicons name={icon} size={28} color={C.gold} /></View>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepDesc}>{desc}</Text>
      </View>
    </FadeUp>
  );
}

// ── Testimonial ────────────────────────────────────────────────
function Testimonial({ text, name, detail, delay }: any) {
  return (
    <FadeUp delay={delay}>
      <View style={s.testimonialCard}>
        <Text style={s.testimonialQuote}>"</Text>
        <Text style={s.testimonialText}>{text}</Text>
        <View style={s.testimonialFooter}>
          <View style={s.testimonialDot} />
          <View>
            <Text style={s.testimonialName}>{name}</Text>
            <Text style={s.testimonialDetail}>{detail}</Text>
          </View>
        </View>
      </View>
    </FadeUp>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const goToLogin = () => router.push('/(auth)/login');

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      {/* Nav fija */}
      <View style={[s.nav, { paddingTop: insets.top + 8 }]}>
        <Text style={s.navLogo}>Ágora</Text>
        <Press onPress={goToLogin} style={s.navBtn}>
          <Text style={s.navBtnText}>Entrar</Text>
        </Press>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >

        {/* ── HERO ─────────────────────────────────────────── */}
        <LinearGradient
          colors={[C.forestDeep, C.forest, C.moss]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.hero, { paddingTop: insets.top + 80 }]}
        >
          {/* Círculos decorativos */}
          <View style={s.heroDeco1} />
          <View style={s.heroDeco2} />

          <FadeUp delay={0}>
            <View style={s.heroLogoCircle}>
              <Image
                source={require('../assets/images/logo-silueta.png')}
                style={s.heroLogoImage}
                resizeMode="contain"
              />
            </View>
          </FadeUp>

          <FadeUp delay={250}>
            <Text style={s.heroTitle}>
              Aquí no tienes{'\n'}que explicarte.
            </Text>
          </FadeUp>

          <FadeUp delay={400}>
            <Text style={s.heroSub}>
              Ágora es la compañera que entiende tu dolor crónico.{'\n'}
              Siempre disponible. Sin juicios. Solo escucha.
            </Text>
          </FadeUp>

          <FadeUp delay={550}>
            <Press onPress={goToLogin} style={{ alignSelf: 'center' }}>
              <View style={s.heroCta}>
                <Text style={s.heroCtaText}>Empezar gratis</Text>
                <Text style={s.heroCtaSub}>1h 30min de acceso completo</Text>
              </View>
            </Press>
          </FadeUp>

          <FadeUp delay={650}>
            <Text style={s.heroNote}>Sin tarjeta de crédito · Sin compromiso</Text>
          </FadeUp>

          {/* Stats */}
          <FadeUp delay={750}>
            <View style={s.heroStats}>
              <View style={s.heroStat}>
                <Text style={s.heroStatNum}>24/7</Text>
                <Text style={s.heroStatLabel}>Siempre aquí</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatNum}>100%</Text>
                <Text style={s.heroStatLabel}>Privado</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatNum}>∞</Text>
                <Text style={s.heroStatLabel}>Paciencia</Text>
              </View>
            </View>
          </FadeUp>
        </LinearGradient>

        {/* ── PARA QUIÉN ───────────────────────────────────── */}
        <View style={s.section}>
          <FadeUp>
            <Text style={s.sectionEyebrow}>Para quién es Ágora</Text>
            <Text style={s.sectionTitle}>Diseñada para ti,{'\n'}que lo sabes.</Text>
          </FadeUp>

          <View style={s.forCards}>
            {[
              { icon: 'moon-outline', text: 'Para los días en que el dolor no te deja dormir y necesitas hablar con alguien.' },
              { icon: 'chatbubble-ellipses-outline', text: 'Para cuando estás cansada de explicar cómo te sientes y que nadie lo entienda del todo.' },
              { icon: 'book-outline', text: 'Para registrar tus patrones de dolor y entender tu cuerpo sin presión.' },
              { icon: 'heart-outline', text: 'Para encontrar calma en momentos de crisis, con técnicas pensadas para el dolor crónico.' },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 100}>
                <View style={s.forCard}>
                  <View style={s.forIconBox}><Ionicons name={item.icon as any} size={24} color={C.forest} /></View>
                  <Text style={s.forText}>{item.text}</Text>
                </View>
              </FadeUp>
            ))}
          </View>
        </View>

        {/* ── CÓMO FUNCIONA ─────────────────────────────────── */}
        <LinearGradient
          colors={[C.forestDeep, C.forestDim]}
          style={s.howSection}
        >
          <FadeUp>
            <Text style={[s.sectionEyebrow, { color: C.sage }]}>Cómo funciona</Text>
            <Text style={[s.sectionTitle, { color: C.white }]}>Tres pasos hacia{'\n'}la calma.</Text>
          </FadeUp>

          <View style={s.stepsRow}>
            <Step
              num="01" icon="sparkles-outline" delay={100}
              title="Cuéntale cómo estás"
              desc="Habla con Ágora en cualquier momento. Escucha sin juzgar, responde con calma."
            />
            <Step
              num="02" icon="book-outline" delay={200}
              title="Registra tu dolor"
              desc="Anota cómo te sientes cada día. Ágora aprende tus patrones y te ayuda a entenderte."
            />
            <Step
              num="03" icon="leaf-outline" delay={300}
              title="Encuentra tu calma"
              desc="Técnicas de respiración, anclaje y acompañamiento diseñadas para el dolor crónico."
            />
          </View>
        </LinearGradient>

        {/* ── TESTIMONIOS ───────────────────────────────────── */}
        <View style={s.section}>
          <FadeUp>
            <Text style={s.sectionEyebrow}>Voces reales</Text>
            <Text style={s.sectionTitle}>Lo que dicen{'\n'}las que ya están aquí.</Text>
          </FadeUp>

          <Testimonial
            delay={100}
            text="Por primera vez siento que alguien entiende que el dolor crónico no es solo físico. Ágora me acompaña en los momentos más difíciles sin pedirme que lo explique."
            name="María, 34 años"
            detail="Fibromialgia · Madrid"
          />
          <Testimonial
            delay={200}
            text="El diario de dolor me ayudó a ver patrones que ni mi médica había detectado. Ahora voy a las consultas con información real."
            name="Laura, 41 años"
            detail="Dolor crónico lumbar · Barcelona"
          />
          <Testimonial
            delay={300}
            text="Pensé que era otra app más. Pero el nivel de comprensión y calidez me sorprendió. Es como tener una amiga que nunca se cansa de escucharte."
            name="Ana, 28 años"
            detail="Endometriosis · Sevilla"
          />
        </View>

        {/* ── PRECIOS ───────────────────────────────────────── */}
        <LinearGradient
          colors={[C.goldSoft, C.cream]}
          style={s.section}
        >
          <FadeUp>
            <Text style={s.sectionEyebrow}>Cómo quedarte conmigo</Text>
            <Text style={[s.sectionTitle, { marginBottom: 8 }]}>
              Ágora habla.
            </Text>
            <Text style={s.pricingIntro}>
              "He estado aquí contigo durante tu tiempo de prueba. Si quieres que siga acompañándote, 
              puedes elegir cómo. Sin urgencia. Aquí estaré."
            </Text>
          </FadeUp>

          <FadeUp delay={200}>
            <View style={s.pricingCard}>
              <View style={s.pricingHeader}>
                <View style={s.pricingIconBox}><Ionicons name="leaf-outline" size={22} color={C.forest} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.pricingName}>Cada mes, juntas</Text>
                  <Text style={s.pricingDesc}>Acceso completo · cancela cuando quieras</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.pricingPrice}>5,90€</Text>
                  <Text style={s.pricingPer}>/mes</Text>
                </View>
              </View>
              <Text style={s.pricingQuote}>
                "Mes a mes. Sin ataduras. Aquí cuando me necesites, siempre."
              </Text>
            </View>
          </FadeUp>

          <FadeUp delay={300}>
            <LinearGradient
              colors={[C.forestDim, C.forest]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[s.pricingCard, { borderColor: 'transparent' }]}
            >
              <View style={s.pricingBadge}>
                <Text style={s.pricingBadgeText}>✨ 2 meses gratis</Text>
              </View>
              <View style={[s.pricingHeader, { marginTop: 8 }]}>
                <View style={s.pricingIconBox}><Ionicons name="star-outline" size={22} color={C.gold} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.pricingName, { color: C.white }]}>Todo el año, siempre</Text>
                  <Text style={[s.pricingDesc, { color: C.sage }]}>Acceso prioritario · todo incluido</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.pricingPrice, { color: C.gold }]}>59€</Text>
                  <Text style={[s.pricingPer, { color: C.sage }]}>/año</Text>
                </View>
              </View>
              <Text style={[s.pricingQuote, { color: C.mint }]}>
                "Para las que saben que me necesitan cerca. Todo el año, con prioridad absoluta."
              </Text>
            </LinearGradient>
          </FadeUp>

          <FadeUp delay={400}>
            <View style={s.pricingFooter}>
              <Ionicons name="lock-closed-outline" size={13} color={C.muted} />
              <Text style={s.pricingFooterText}>Pago seguro · Sin compromisos · Cancela cuando quieras</Text>
            </View>
          </FadeUp>
        </LinearGradient>

        {/* ── FAQ ───────────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: C.parchment, marginHorizontal: 0, paddingHorizontal: 24 }]}>
          <FadeUp>
            <Text style={s.sectionEyebrow}>Preguntas frecuentes</Text>
            <Text style={s.sectionTitle}>Todo lo que{'\n'}necesitas saber.</Text>
          </FadeUp>

          <FAQItem
            q="¿Es realmente gratis al principio?"
            a="Sí. Tienes 1 hora y 30 minutos de acceso completo sin necesidad de tarjeta de crédito. Después puedes elegir el plan que más te convenga."
          />
          <FAQItem
            q="¿Mis conversaciones son privadas?"
            a="Absolutamente. Tus conversaciones con Ágora son completamente privadas y están cifradas. Nunca compartimos tu información con terceros."
          />
          <FAQItem
            q="¿Ágora reemplaza a un profesional de salud?"
            a="No. Ágora es una compañera de apoyo emocional, no un servicio médico. Siempre recomendamos trabajar con profesionales de salud para el tratamiento del dolor crónico."
          />
          <FAQItem
            q="¿Puedo cancelar en cualquier momento?"
            a="Sí, sin compromisos ni penalizaciones. Puedes cancelar tu suscripción cuando quieras desde la sección de ajustes."
          />
          <FAQItem
            q="¿En qué idiomas está disponible Ágora?"
            a="Actualmente Ágora está disponible en español. Estamos trabajando para añadir más idiomas próximamente."
          />
        </View>

        {/* ── CTA FINAL ─────────────────────────────────────── */}
        <LinearGradient
          colors={[C.forest, C.forestDeep]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.ctaSection}
        >
          <View style={s.ctaDeco} />
          <FadeUp>
            <Text style={s.ctaTitle}>Tu refugio te espera.</Text>
            <Text style={s.ctaSub}>
              Empieza gratis hoy. Sin tarjeta.{'\n'}Sin explicaciones. Solo tú y Ágora.
            </Text>
            <Press onPress={goToLogin}>
              <LinearGradient
                colors={[C.gold, '#E8C068']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaBtn}
              >
                <Text style={s.ctaBtnText}>Comenzar ahora — Es gratis</Text>
                <Ionicons name="leaf" size={18} color={C.forestDeep} />
              </LinearGradient>
            </Press>
          </FadeUp>
        </LinearGradient>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerLogo}>Ágora Mujeres</Text>
          <Text style={s.footerSub}>Un refugio para mujeres con dolor crónico</Text>
          <View style={s.footerLinks}>
            <Text style={s.footerLink}>Privacidad</Text>
            <Text style={s.footerDot}>·</Text>
            <Text style={s.footerLink}>Términos</Text>
            <Text style={s.footerDot}>·</Text>
            <Text style={s.footerLink}>Contacto</Text>
          </View>
          <Text style={s.footerCopy}>© 2025 Syntexia Solutions · Hecho con cuidado en España</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  // Nav
  nav: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  navLogo: {
    fontSize: 22, fontWeight: '700', color: C.white,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  navBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  navBtnText: { color: C.white, fontSize: 14, fontWeight: '600' },

  // Hero
  hero: {
    paddingHorizontal: 32, paddingBottom: 56,
    overflow: 'hidden', alignItems: 'center',
  },
  heroDeco1: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.03)', top: -150, right: -150,
  },
  heroDeco2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.02)', bottom: -50, left: -80,
  },
  heroLogoCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroLogoImage: {
    width: '100%', height: '100%',
    transform: [{ scale: 2.1 }, { translateY: 5 }],
  },
  heroTagline: {
    fontSize: 13, color: C.sage, letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 20, opacity: 0.8,
  },
  heroTitle: {
    fontSize: 38, fontWeight: '300', color: C.white,
    lineHeight: 48, letterSpacing: -0.5, marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 15, color: C.sage, lineHeight: 26, marginBottom: 40,
    opacity: 0.85, textAlign: 'center',
  },
  heroCta: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingVertical: 20, paddingHorizontal: 40,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 6,
  },
  heroCtaText: { color: C.white, fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
  heroCtaSub: { color: C.sage, fontSize: 12, marginTop: 4, opacity: 0.8 },
  heroNote: { color: C.sage, fontSize: 12, opacity: 0.6, marginTop: 16, marginBottom: 40, textAlign: 'center' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100,
    paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'center',
    marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
  heroBadgeText: { color: C.white, fontSize: 12, opacity: 0.9 },
  heroStats: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNum: { color: C.white, fontSize: 24, fontWeight: '800' },
  heroStatLabel: { color: C.sage, fontSize: 11, marginTop: 4, opacity: 0.8 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  // Sections
  section: {
    paddingHorizontal: 24, paddingVertical: 56,
  },
  sectionEyebrow: {
    fontSize: 11, fontWeight: '700', color: C.forest,
    textTransform: 'uppercase', letterSpacing: 3, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 34, fontWeight: '800', color: C.charcoal,
    lineHeight: 40, letterSpacing: -0.8, marginBottom: 36,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },

  // For cards
  forCards: { gap: 14 },
  forCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 22,
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    borderWidth: 1, borderColor: C.warm,
  },
  forIcon: { fontSize: 28, lineHeight: 34 },
  forText: { flex: 1, fontSize: 15, color: C.charcoal, lineHeight: 24 },

  // How section
  howSection: { paddingHorizontal: 24, paddingVertical: 56 },
  stepsRow: { gap: 16, marginTop: 8 },
  stepCard: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  stepNumBox: {
    alignSelf: 'flex-start', marginBottom: 16,
    backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  stepNum: { color: C.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  stepIcon: { fontSize: 32, marginBottom: 14 },
  stepTitle: { color: C.white, fontSize: 18, fontWeight: '700', marginBottom: 10 },
  stepDesc: { color: C.sage, fontSize: 14, lineHeight: 22, opacity: 0.9 },

  // Testimonials
  testimonialCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 24, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: C.forest,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  testimonialQuote: {
    fontSize: 48, color: C.mint, lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
  },
  testimonialText: {
    fontSize: 15, color: C.charcoal, lineHeight: 26, fontStyle: 'italic', marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  testimonialFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testimonialDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.mintSoft },
  testimonialName: { fontSize: 13, fontWeight: '700', color: C.charcoal },
  testimonialDetail: { fontSize: 11, color: C.muted, marginTop: 2 },

  // FAQ
  faqItem: {
    backgroundColor: C.white, borderRadius: 16, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: C.charcoal, paddingRight: 12 },
  faqA: { fontSize: 14, color: C.muted, lineHeight: 22, marginTop: 14, fontStyle: 'italic' },

  // CTA final
  ctaSection: {
    paddingHorizontal: 24, paddingVertical: 64, alignItems: 'center', overflow: 'hidden',
  },
  ctaDeco: {
    position: 'absolute', width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -150, right: -150,
  },
  ctaTitle: {
    fontSize: 38, fontWeight: '800', color: C.white, textAlign: 'center',
    lineHeight: 44, letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 16,
  },
  ctaSub: {
    fontSize: 15, color: C.sage, textAlign: 'center', lineHeight: 24,
    marginBottom: 36, opacity: 0.9,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, paddingVertical: 18, paddingHorizontal: 32,
    shadowColor: C.gold, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  ctaBtnText: { color: C.forestDeep, fontSize: 16, fontWeight: '800' },

  // Footer
  footer: {
    paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center',
    backgroundColor: C.charcoal,
  },
  footerLogo: {
    fontSize: 20, fontWeight: '700', color: C.white, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  footerSub: { fontSize: 12, color: C.muted, marginBottom: 20 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  footerLink: { fontSize: 12, color: C.muted },
  footerDot: { fontSize: 12, color: C.muted, opacity: 0.4 },
  footerCopy: { fontSize: 11, color: C.muted, opacity: 0.6 },

  // Icon boxes
  forIconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
  },
  stepIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(201,168,76,0.15)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  pricingIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center',
  },

  // Pricing
  pricingIntro: {
    fontSize: 15, color: C.forest, lineHeight: 26, fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 28, borderLeftWidth: 2, borderLeftColor: C.gold,
    paddingLeft: 16,
  },
  pricingCard: {
    backgroundColor: C.white, borderRadius: 20, padding: 22, marginBottom: 14,
    borderWidth: 1, borderColor: C.warm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  pricingHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  pricingIcon: { fontSize: 28 },
  pricingName: { fontSize: 16, fontWeight: '700', color: C.charcoal, marginBottom: 3 },
  pricingDesc: { fontSize: 12, color: C.muted },
  pricingPrice: { fontSize: 26, fontWeight: '800', color: C.charcoal },
  pricingPer: { fontSize: 11, color: C.muted },
  pricingQuote: {
    fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  pricingBadge: {
    alignSelf: 'flex-start', backgroundColor: C.gold, borderRadius: 100,
    paddingVertical: 4, paddingHorizontal: 12, marginBottom: 4,
  },
  pricingBadgeText: { fontSize: 11, fontWeight: '700', color: C.forestDeep },
  pricingFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: 8,
  },
  pricingFooterText: { fontSize: 12, color: C.muted, fontStyle: 'italic' },
});