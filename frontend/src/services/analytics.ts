/**
 * Simple analytics tracking for Ágora Mujeres
 * Tracks user behavior, feature usage, and monetization events
 * 
 * Privacy-first approach: No personal data collected beyond anonymized device ID
 * All events sent to backend for processing
 */

export interface AnalyticsEvent {
  event_type: string;
  device_id: string;
  timestamp: string;
  properties?: Record<string, any>;
  user_cohort?: 'trial' | 'paid' | 'free';
}

export interface AnalyticsService {
  trackEvent: (eventType: string, properties?: Record<string, any>) => void;
  trackPageView: (screenName: string) => void;
  trackError: (error: Error, context?: string) => void;
  setUserCohort: (cohort: 'trial' | 'paid' | 'free') => void;
  setDeviceId: (deviceId: string) => void;
  flush: () => Promise<void>;
}

let deviceId = '';
let userCohort: 'trial' | 'paid' | 'free' = 'free';
let bufferedEvents: AnalyticsEvent[] = [];

/**
 * Send events to backend analytics endpoint
 */
const sendEvent = async (event: AnalyticsEvent) => {
  try {
    await fetch('http://localhost:8000/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    // If backend unavailable, buffer the event
    bufferedEvents.push(event);
    if (bufferedEvents.length > 100) {
      bufferedEvents = bufferedEvents.slice(-100); // Keep last 100
    }
    console.warn('Analytics event buffered:', event.event_type);
  }
};

/**
 * Send batch of buffered events
 */
const flushBufferedEvents = async () => {
  if (bufferedEvents.length === 0) return;

  const events = [...bufferedEvents];
  bufferedEvents = [];

  for (const event of events) {
    await sendEvent(event);
  }
};

/**
 * Core analytics service
 */
const createAnalyticsService = (): AnalyticsService => ({
  /**
   * Track a custom event with optional properties
   */
  trackEvent: (eventType: string, properties?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      event_type: eventType,
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
      user_cohort: userCohort,
    };

    sendEvent(event);
  },

  /**
   * Track screen/page views
   */
  trackPageView: (screenName: string) => {
    const event: AnalyticsEvent = {
      event_type: 'page_view',
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      properties: {
        screen_name: screenName,
        url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
      user_cohort: userCohort,
    };

    sendEvent(event);
  },

  /**
   * Track errors for debugging
   */
  trackError: (error: Error, context?: string) => {
    const event: AnalyticsEvent = {
      event_type: 'error',
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      properties: {
        error_message: error.message,
        error_stack: error.stack?.split('\n').slice(0, 3).join(' | '),
        context: context,
      },
      user_cohort: userCohort,
    };

    sendEvent(event);
  },

  /**
   * Set user cohort (trial, paid, free)
   */
  setUserCohort: (cohort: 'trial' | 'paid' | 'free') => {
    userCohort = cohort;
  },

  /**
   * Set device ID
   */
  setDeviceId: (id: string) => {
    deviceId = id;
  },

  /**
   * Flush all buffered events
   */
  flush: flushBufferedEvents,
});

export const analytics = createAnalyticsService();

// ============ PRE-DEFINED EVENT TRACKERS ============

/**
 * User engagement events
 */
export const trackUserEvents = {
  openedApp: () => analytics.trackEvent('app_opened'),
  closedApp: () => analytics.trackEvent('app_closed'),
  navigatedTo: (screenName: string) => analytics.trackPageView(screenName),
  completedOnboarding: () => analytics.trackEvent('onboarding_completed'),
  triggeredCrisisSupport: () => analytics.trackEvent('crisis_support_accessed'),
};

/**
 * Chat feature events
 */
export const trackChatEvents = {
  sentMessage: (messageLength: number) =>
    analytics.trackEvent('chat_message_sent', { message_length: messageLength }),
  startedConversation: () => analytics.trackEvent('chat_conversation_started'),
  endedConversation: () => analytics.trackEvent('chat_conversation_ended'),
  sharedChatMessage: () => analytics.trackEvent('chat_message_shared'),
};

/**
 * Diary feature events
 */
export const trackDiaryEvents = {
  createdEntry: (entryLength: number) =>
    analytics.trackEvent('diary_entry_created', { entry_length: entryLength }),
  viewedPatterns: () => analytics.trackEvent('diary_patterns_viewed'),
  sharedEntry: () => analytics.trackEvent('diary_entry_shared'),
};

/**
 * Cycle tracking events
 */
export const trackCycleEvents = {
  loggedDay: (phase: string) =>
    analytics.trackEvent('cycle_day_logged', { phase }),
  viewedCalendar: () => analytics.trackEvent('cycle_calendar_viewed'),
};

/**
 * Monthly pain tracking events
 */
export const trackMonthlyEvents = {
  loggedPain: (intensity: number) =>
    analytics.trackEvent('pain_logged', { intensity }),
  savedMonthlyRecord: (daysLogged: number) =>
    analytics.trackEvent('monthly_record_saved', { days_logged: daysLogged }),
};

/**
 * Payment/Subscription events
 */
export const trackPaymentEvents = {
  viewedPaywall: () => analytics.trackEvent('paywall_viewed'),
  initiatedCheckout: () => analytics.trackEvent('checkout_initiated'),
  completedPayment: (amount: number, currency: string) =>
    analytics.trackEvent('payment_completed', {
      amount,
      currency,
      timestamp: new Date().toISOString(),
    }),
  canceledPayment: (reason?: string) =>
    analytics.trackEvent('payment_canceled', { reason }),
  activatedSubscription: (planType: string) =>
    analytics.trackEvent('subscription_activated', { plan_type: planType }),
  subscriberMenuAccessed: () => analytics.trackEvent('subscriber_menu_accessed'),
};

/**
 * Resource access events
 */
export const trackResourceEvents = {
  viewedResources: (category?: string) =>
    analytics.trackEvent('resources_viewed', { category }),
  searchedResources: (query: string) =>
    analytics.trackEvent('resources_searched', { query }),
  sharedResource: (resourceId: string) =>
    analytics.trackEvent('resource_shared', { resource_id: resourceId }),
};

/**
 * Settings/Preferences events
 */
export const trackSettingsEvents = {
  changedLanguage: (language: string) =>
    analytics.trackEvent('language_changed', { language }),
  toggledDarkMode: (enabled: boolean) =>
    analytics.trackEvent('dark_mode_toggled', { enabled }),
  grantedPermission: (permissionType: string) =>
    analytics.trackEvent('permission_granted', { permission_type: permissionType }),
  revokedPermission: (permissionType: string) =>
    analytics.trackEvent('permission_revoked', { permission_type: permissionType }),
};

/**
 * Technical events
 */
export const trackTechnicalEvents = {
  appCrashed: (error: Error) =>
    analytics.trackError(error, 'app_crash'),
  apiCallFailed: (endpoint: string, statusCode: number) =>
    analytics.trackEvent('api_call_failed', { endpoint, status_code: statusCode }),
  performanceIssue: (metric: string, duration: number) =>
    analytics.trackEvent('performance_issue', { metric, duration_ms: duration }),
};
