# Guía de Integración del Paywall en Chat

## Estado Actual

✅ **Completado:**
- Frontend app.json: STRIPE_PUBLIC_KEY configurada
- stripeConfig.ts: Módulo de configuración creado
- PaywallModal.tsx: Componente actualizado con flujo de pago 2 pasos
- Dependencias: @stripe/react-stripe-js y stripe instaladas

⏳ **Pendiente:**
- Integrar PaywallModal en chat.tsx
- Implementar verificación de subscripción en app init
- Wiring: Mostrar paywall cuando trial expire

---

## Integración en Chat Screen

### Paso 1: Importar el componente

```typescript
// En frontend/app/(tabs)/chat.tsx
import { PaywallModal } from '../../src/components/PaywallModal';
import { getSubscriptionStatus } from '../../src/config/stripeConfig';
```

### Paso 2: Agregar estado para el paywall

```typescript
const [showPaywall, setShowPaywall] = useState(false);
const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'expired' | 'active' | null>(null);
```

### Paso 3: Verificar subscripción al iniciar

```typescript
useEffect(() => {
  const checkSubscription = async () => {
    try {
      const status = await getSubscriptionStatus(deviceId);
      setSubscriptionStatus(status.status); // 'trial', 'expired', o 'active'
      
      if (status.status === 'expired') {
        setShowPaywall(true);
      }
    } catch (error) {
      console.log('Error checking subscription:', error);
      // Si hay error, permitir acceso (no bloquear)
    }
  };
  
  checkSubscription();
}, [deviceId]);
```

### Paso 4: Bloquear envío de mensajes si trial expirado

```typescript
const sendMessage = async () => {
  if (!input.trim()) return;
  
  // ← AGREGAR AQUÍ
  if (subscriptionStatus === 'expired' && !showPaywall) {
    setShowPaywall(true);
    return; // No enviar mensaje
  }
  // ← FIN DEL BLOQUE A AGREGAR
  
  setMessages(prev => [...prev, { 
    id: Date.now().toString(), 
    role: 'user', 
    content: input 
  }]);
  // ... resto del código
};
```

### Paso 5: Agregar el componente PaywallModal al JSX

```typescript
// En el retorno del componente (antes del cierre de SafeAreaView)
<PaywallModal
  visible={showPaywall}
  onClose={() => setShowPaywall(false)}
  deviceId={deviceId}
/>
```

---

## Ejemplo Completo de Integración

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, /* ... otros imports ... */ } from 'react-native';
import { PaywallModal } from '../../src/components/PaywallModal';
import { getSubscriptionStatus } from '../../src/config/stripeConfig';

export default function ChatScreen() {
  // ... estado existente ...
  const [deviceId] = useState(() => `device-${Date.now()}`);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'expired' | 'active' | null>(null);
  
  // Verificar subscripción al iniciar
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const status = await getSubscriptionStatus(deviceId);
        setSubscriptionStatus(status.status);
        
        if (status.status === 'expired') {
          setShowPaywall(true);
        }
      } catch (error) {
        console.log('Subscription check error:', error);
      }
    };
    
    checkSubscription();
  }, [deviceId]);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Bloquear si trial expirado
    if (subscriptionStatus === 'expired') {
      setShowPaywall(true);
      return;
    }
    
    // ... resto del código existente ...
  };
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* JSX existente del chat */}
      
      {/* Agregar el PaywallModal al final */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        deviceId={deviceId}
      />
    </SafeAreaView>
  );
}
```

---

## Flujo de Usuario

### Cuando trial está activo
1. Usuario puede chatear sin restricciones
2. `subscriptionStatus` = 'trial'
3. PaywallModal nunca se muestra

### Cuando trial expira
1. Usuario intenta enviar mensaje
2. App detecta que `subscriptionStatus` = 'expired'
3. Se muestra **PaywallModal intro**
4. Usuario elige "Activar Suscripción"
5. Pasa a **PaywallModal payment step**
6. Usuario ingresa email y nombre
7. Sistema crea customer en Stripe
8. Sistema crea payment intent
9. (Próxima fase: Integrar Stripe Checkout aquí)
10. Usuario "aprueba" pago (simulado)
11. Sistema activa subscripción
12. PaywallModal se cierra
13. `subscriptionStatus` cambia a 'active'
14. Usuario puede chatear nuevamente

### Cuando subscripción está activa
1. Usuario puede chatear sin restricciones
2. `subscriptionStatus` = 'active'
3. PaywallModal nunca se muestra

---

## Próximas fases

### Fase 2: Stripe Checkout Real
Reemplazar el `Alert.alert()` en PaywallModal por Stripe Checkout:

**Opción A: Stripe Checkout (Recomendado - Easier)**
```typescript
// En PaywallModal.tsx
import { confirmPaymentWithStripe } from '@stripe/stripe-react-native';

const handlePayment = async () => {
  // ... validates email ...
  
  const paymentResponse = await confirmPaymentWithStripe({
    paymentIntentClientSecret: paymentRes.client_secret,
    paymentMethodData: {
      // Datos recopilados del formulario
    }
  });
  
  if (paymentResponse.success) {
    // Activar subscripción
  }
};
```

**Opción B: Stripe Elements (More Customizable)**
```typescript
// Usar @stripe/react-stripe-js con Elements
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
```

### Fase 3: Testing
- Test con card: `4242 4242 4242 4242`
- Expiry: Cualquier fecha futura (ej: 12/34)
- CVC: Cualquier 3 dígitos (ej: 123)

### Fase 4: Security Review
```
⚠️ PROBLEMAS ACTUALES:
- STRIPE_PUBLIC_KEY visible en app.json en el repo
- .env con STRIPE_SECRET_KEY y OPENAI_API_KEY visibles

RECOMENDADO:
1. Revocar y regenerar las claves actuales
2. Usar claves de TEST para desarrollo
3. Guardar claves en Secrets Manager de CI/CD
4. Usar .env local (gitignore) para desarrollo
```

---

## Endpoints del Backend que se Utilizan

Todos estos ya están implementados:

| Endpoint | Método | Propósito |
|----------|--------|----------|
| `/api/payments/create-customer` | POST | Crear customer en Stripe |
| `/api/payments/create-payment-intent` | POST | Obtener client secret para pago |
| `/api/payments/activate` | POST | Activar subscripción post-pago |
| `/api/payments/status` | GET | Verificar estado trial/suscripción |

---

## Validación

Al completar la integración, verifica:

- [ ] PaywallModal aparece cuando trial expira
- [ ] Usuario puede ingresar email y nombre
- [ ] Simulación de pago funciona
- [ ] Después del pago, `subscriptionStatus` = 'active'
- [ ] Chat se desbloquea después del pago
- [ ] Puedes volver a chat después de cerrar paywall
- [ ] Bilingüismo funciona (ES/EN)
- [ ] Dark mode no rompe estilos

---

## Debugging

### Ver logs de subscripción
```typescript
useEffect(() => {
  console.log('🔐 Subscription Status:', subscriptionStatus);
  console.log('💬 Show Paywall:', showPaywall);
}, [subscriptionStatus, showPaywall]);
```

### Testear sin backend real
```typescript
// En chat.tsx, reemplaza getSubscriptionStatus con:
const getSubscriptionStatus = async (deviceId: string) => {
  // Simular trial expirado para testing
  return { status: 'expired' };
};
```

### Ver estructura de respuesta de backend
```typescript
const status = await getSubscriptionStatus(deviceId);
console.log('Full response:', JSON.stringify(status, null, 2));
```

---

## Checklist Final

**Antes de ir a Producción:**
- [ ] Stripe Checkout integrado (no simulación)
- [ ] Edge cases cubiertos (network errors, etc.)
- [ ] Test de pago exitoso
- [ ] Test de pago fallido (decline simulado)
- [ ] Test de experiencia con trial válido
- [ ] Test de experiencia con trial expirado
- [ ] Documentación del setup en README
- [ ] Claves de producción las más seguras posible
- [ ] Error handling robusto
- [ ] Monitor de logs de pagos

---

Created: 2024
Status: Implementation Guide
