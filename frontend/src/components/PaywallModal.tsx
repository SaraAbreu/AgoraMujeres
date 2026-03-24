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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPO } from '../theme';
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
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.title}>
                  {language === 'es' ? '✨ Acceso Premium' : '✨ Premium Access'}
                </Text>

                <Text style={styles.subtitle}>
                  {language === 'es'
                    ? 'Desbloquea todo el potencial de Ágora'
                    : 'Unlock Ágora\'s full potential'}
                </Text>

                {/* 3 Benefits Only */}
                <View style={styles.featuresList}>
                  {[
                    {
                      icon: '💬',
                      title: language === 'es' ? 'Chat ilimitado' : 'Unlimited chat',
                    },
                    {
                      icon: '📊',
                      title: language === 'es' ? 'Reportes completos' : 'Full reports',
                    },
                    {
                      icon: '🎯',
                      title: language === 'es' ? 'Recomendaciones personalizadas' : 'Personalized tips',
                    },
                  ].map((feature, idx) => (
                    <View key={idx} style={styles.feature}>
                      <Text style={styles.featureIcon}>{feature.icon}</Text>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
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
                    ? 'Activar Suscripción'
                    : 'Activate Subscription'}
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
                    color={COLORS.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Text style={styles.title}>
                  {language === 'es' ? 'Completar suscripción' : 'Complete subscription'}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
                  placeholderTextColor={COLORS.textSecondary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />

                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!loading}
                />

                <View style={styles.securityNote}>
                  <Ionicons 
                    name="lock-closed" 
                    size={16} 
                    color={COLORS.primary}
                  />
                  <Text style={styles.securityText}>
                    {language === 'es'
                      ? 'Protegido por Stripe'
                      : 'Secured by Stripe'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>
                    {language === 'es'
                      ? 'Pagar'
                      : 'Pay'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  closeButton: {
    position: 'absolute',
    left: SPACING.lg,
    top: SPACING.lg,
    padding: SPACING.sm,
  },
  title: {
    ...TYPO.h2,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  subtitle: {
    ...TYPO.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  featuresList: {
    marginVertical: SPACING.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  featureTitle: {
    ...TYPO.body,
    color: COLORS.textPrimary,
  },
  pricingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  pricingNote: {
    ...TYPO.bodySmall,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
    ...TYPO.body,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  securityText: {
    ...TYPO.caption,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  button: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    ...TYPO.h3,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
  },
  skipText: {
    ...TYPO.body,
    color: COLORS.textSecondary,
  },
});
