import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../theme/colors';
import { useStore } from '../store/useStore';
import {
  createCustomer,
  createPaymentIntent,
  activateSubscription,
} from '../services/api';

interface PaywallModalProps {
  visible: boolean;
  onClose?: () => void;
  deviceId: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ 
  visible, 
  onClose,
  deviceId 
}) => {
  const router = useRouter();
  const { language } = useStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'intro' | 'payment'>('intro');

  const handlePayment = async () => {
    if (!email.trim()) {
      Alert.alert(
        language === 'es' ? 'Email requerido' : 'Email required',
        language === 'es' 
          ? 'Por favor ingresa tu correo electrónico' 
          : 'Please enter your email'
      );
      return;
    }

    setLoading(true);
    try {
      // Create customer
      const customerRes = await createCustomer(
        deviceId,
        email.trim(),
        name.trim() || (language === 'es' ? 'Usuario Ágora' : 'Ágora User')
      );

      // Create payment intent
      const paymentRes = await createPaymentIntent(deviceId);

      // Simulate payment success (in production, use Stripe.js)
      Alert.alert(
        language === 'es' ? '💳 Simulación de Pago' : '💳 Payment Simulation',
        language === 'es'
          ? 'En producción se abrirá Stripe Checkout aquí.\n\n¿Simular pago exitoso?'
          : 'Stripe Checkout would open here in production.\n\nSimulate successful payment?',
        [
          {
            text: language === 'es' ? 'Simular Pago' : 'Simulate Payment',
            onPress: async () => {
              // Activate subscription
              await activateSubscription(
                deviceId,
                paymentRes.payment_intent_id
              );

              Alert.alert(
                language === 'es' ? '¡Éxito!' : 'Success!',
                language === 'es'
                  ? 'Tu suscripción ha sido activada. ¡Bienvenida!'
                  : 'Your subscription is active. Welcome!',
                [{ text: 'OK', onPress: () => {
                  onClose?.();
                  setStep('intro');
                  setEmail('');
                  setName('');
                }}]
              );
            },
          },
          { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        `${error}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {step === 'intro' ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={colors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.title}>
                  {language === 'es' ? '✨ Desbloquea Premium' : '✨ Unlock Premium'}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.subtitle}>
                  {language === 'es'
                    ? 'Acceso ilimitado a todas las funciones'
                    : 'Unlimited access to all features'}
                </Text>

                <View style={styles.featuresList}>
                  {[
                    {
                      icon: '💬',
                      title: language === 'es' ? 'Chat sin límites' : 'Unlimited chat',
                      desc: language === 'es'
                        ? 'Habla con Ágora todo lo que necesites'
                        : 'Chat with Ágora as much as you need',
                    },
                    {
                      icon: '🧠',
                      title: language === 'es' ? 'Análisis avanzado' : 'Advanced analysis',
                      desc: language === 'es'
                        ? 'Patrones personalizados de tu salud'
                        : 'Personalized health patterns',
                    },
                    {
                      icon: '📊',
                      title: language === 'es' ? 'Reportes completos' : 'Full reports',
                      desc: language === 'es'
                        ? 'Datos detallados de tu progreso'
                        : 'Detailed progress tracking',
                    },
                    {
                      icon: '🌙',
                      title: language === 'es' ? 'Tema oscuro' : 'Dark mode',
                      desc: language === 'es'
                        ? 'Mejor experiencia nocturna'
                        : 'Better night experience',
                    },
                  ].map((feature, idx) => (
                    <View key={idx} style={styles.feature}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDesc}>{feature.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Pricing */}
                <View style={styles.pricingBox}>
                  <Text style={styles.price}>€10/mes</Text>
                  <Text style={styles.pricingNote}>
                    {language === 'es'
                      ? 'Cancela cuando quieras'
                      : 'Cancel anytime'}
                  </Text>
                </View>
              </View>

              {/* CTA Button */}
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setStep('payment')}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {language === 'es'
                    ? '🔓 Activar Suscripción'
                    : '🔓 Activate Subscription'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                <Text style={styles.skipText}>
                  {language === 'es' ? 'Quizá después' : 'Maybe later'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Payment Step */}
              <View style={styles.header}>
                <TouchableOpacity 
                  onPress={() => setStep('intro')}
                  style={styles.closeButton}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color={colors.text}
                  />
                </TouchableOpacity>
                <Text style={styles.title}>
                  {language === 'es' ? '💳 Información de Pago' : '💳 Payment Info'}
                </Text>
              </View>

              <View style={styles.content}>
                <Text style={styles.paymentSubtitle}>
                  {language === 'es'
                    ? 'Ingresa tus datos para completar la suscripción'
                    : 'Enter your details to complete'}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!loading}
                />

                <View style={styles.securityNote}>
                  <Ionicons 
                    name="lock-closed" 
                    size={16} 
                    color={colors.primary}
                  />
                  <Text style={styles.securityText}>
                    {language === 'es'
                      ? 'Tu información está protegida por Stripe'
                      : 'Your information is secured by Stripe'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.buttonText}>
                    {language === 'es'
                      ? '💳 Pagar y Activar'
                      : '💳 Pay & Activate'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    fontFamily: typography.fonts.heading,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  paymentSubtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  featuresList: {
    marginBottom: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular as any,
    color: colors.textSecondary,
  },
  pricingBox: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  pricingNote: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular as any,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.background + '5',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  securityText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular as any,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular as any,
    color: colors.textSecondary,
  },
});
