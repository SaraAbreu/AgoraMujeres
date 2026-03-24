export interface NotificationPreference {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const registerNotificationService = async () => {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration);
      startNotificationCheck();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const getNotificationPreference = (): NotificationPreference => {
  try {
    const enabled = localStorage?.getItem('notificationsEnabled') === 'true';
    const hour = parseInt(localStorage?.getItem('notificationHour') || '8');
    const minute = parseInt(localStorage?.getItem('notificationMinute') || '0');
    return { enabled, hour, minute };
  } catch {
    return { enabled: false, hour: 8, minute: 0 };
  }
};

let notificationCheckInterval: NodeJS.Timeout | null = null;
let lastNotificationTime: string | null = null;

export const startNotificationCheck = () => {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }

  notificationCheckInterval = setInterval(() => {
    checkAndSendNotification();
  }, 60000); // Check every minute

  // Also check immediately
  checkAndSendNotification();
};

export const stopNotificationCheck = () => {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
    notificationCheckInterval = null;
  }
};

const checkAndSendNotification = () => {
  const preference = getNotificationPreference();
  if (!preference.enabled) return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayKey = now.toDateString();

  // Check if time matches and notification hasn't been sent today
  if (currentHour === preference.hour && currentMinute === preference.minute) {
    if (lastNotificationTime !== todayKey) {
      sendDailyNotification();
      lastNotificationTime = todayKey;
    }
  }
};

export const sendDailyNotification = async () => {
  const permission = await requestNotificationPermission();
  if (!permission) return;

  const language = localStorage?.getItem('language') || 'es';
  const titles: { [key: string]: string } = {
    es: '¿Cómo amaneció tu cuerpo?',
    en: 'How did you wake up?',
  };
  const bodies: { [key: string]: string } = {
    es: 'Cuéntame cómo te sientes hoy. Tu bienestar importa.',
    en: 'Tell me how you feel today. Your wellbeing matters.',
  };

  const title = titles[language] || titles['es'];
  const body = bodies[language] || bodies['es'];

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/agora-icon.png',
        badge: '/agora-badge.png',
        tag: 'daily-notification',
        requireInteraction: false,
      } as NotificationOptions & { actions?: Array<{action: string, title: string}> });
    });
  } else {
    // Fallback for browsers without service worker support
    new Notification(title, {
      body,
      icon: '/agora-icon.png',
    });
  }
};

export const testNotification = async (language: string = 'es') => {
  const permission = await requestNotificationPermission();
  if (!permission) {
    alert(language === 'es' ? 'Permiso de notificaciones denegado' : 'Notification permission denied');
    return;
  }

  const titles: { [key: string]: string } = {
    es: '¡Notificación de prueba!',
    en: 'Test notification!',
  };
  const bodies: { [key: string]: string } = {
    es: 'Si recibiste esto, las notificaciones funcionan correctamente.',
    en: 'If you received this, notifications are working correctly.',
  };

  const title = titles[language] || titles['es'];
  const body = bodies[language] || bodies['es'];

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/agora-icon.png',
        badge: '/agora-badge.png',
      });
    });
  } else {
    new Notification(title, {
      body,
      icon: '/agora-icon.png',
    });
  }
};
