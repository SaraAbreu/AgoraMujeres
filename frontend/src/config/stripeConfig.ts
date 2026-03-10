import Constants from 'expo-constants';

/**
 * Stripe Configuration for Ágora Mujeres
 * Handles API keys and payment endpoints
 */

// Get keys from expo config
const stripePublicKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_KEY;
const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

if (!stripePublicKey) {
  console.warn('[Stripe Config] Missing EXPO_PUBLIC_STRIPE_KEY in app.json');
}

export const stripeConfig = {
  // Public key for client-side operations
  publicKey: stripePublicKey || 'pk_test_missing_key',
  
  // Backend endpoint for payment operations
  backendUrl: backendUrl,
  
  // API endpoints
  endpoints: {
    createCustomer: `${backendUrl}/api/subscription/create-customer`,
    createPaymentIntent: `${backendUrl}/api/subscription/create-payment-intent`,
    activateSubscription: `${backendUrl}/api/subscription/activate`,
    getSubscriptionStatus: `${backendUrl}/api/subscription`,
  },
  
  // Pricing
  pricing: {
    monthly: {
      amount: 1000, // €10 in cents
      currency: 'eur',
      interval: 'month',
      description: 'Acceso ilimitado a Ágora',
    },
    trial: {
      duration: 7200, // 2 hours in seconds
      freeAttempts: 3,
    },
  },
  
  // UI Configuration
  ui: {
    appearance: {
      theme: 'light',
      variables: {
        colorPrimary: '#7A9B82', // Moss green from Ágora
        colorBackground: '#FDFBF9', // Cream
        colorText: '#3D3D3D',
      },
    },
  },
};

/**
 * Create Stripe customer in backend
 */
export const createStripeCustomer = async (
  deviceId: string,
  email: string,
  name?: string
) => {
  try {
    const response = await fetch(stripeConfig.endpoints.createCustomer, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: deviceId,
        email,
        name: name || 'Ágora User',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create customer: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Stripe] Error creating customer:', error);
    throw error;
  }
};

/**
 * Create payment intent for subscription
 */
export const createPaymentIntent = async (deviceId: string) => {
  try {
    const response = await fetch(
      `${stripeConfig.endpoints.createPaymentIntent}?device_id=${deviceId}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`Failed to create payment intent: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Activate subscription after successful payment
 */
export const activateSubscription = async (
  deviceId: string,
  paymentIntentId: string
) => {
  try {
    const response = await fetch(
      `${stripeConfig.endpoints.activateSubscription}?device_id=${deviceId}&payment_intent_id=${paymentIntentId}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`Failed to activate subscription: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Stripe] Error activating subscription:', error);
    throw error;
  }
};

/**
 * Check subscription status
 */
export const getSubscriptionStatus = async (deviceId: string) => {
  try {
    const response = await fetch(
      `${stripeConfig.endpoints.getSubscriptionStatus}/${deviceId}`
    );

    if (!response.ok) {
      throw new Error(`Failed to get subscription status: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Stripe] Error getting subscription status:', error);
    throw error;
  }
};

export default stripeConfig;
