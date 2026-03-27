import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getSubscriptionStatus } from '../services/api';

export function useTrialCheck() {
  const { deviceId, subscriptionStatus, setSubscriptionStatus } = useStore();
  const [remainingSeconds, setRemainingSeconds] = useState(7200);

  const checkTrial = useCallback(async () => {
    if (!deviceId) return;
    try {
      const status = await getSubscriptionStatus(deviceId);
      setSubscriptionStatus(status);
      setRemainingSeconds(status.trial_remaining_seconds || 0);
    } catch { /* noop */ }
  }, [deviceId, setSubscriptionStatus]);

  useEffect(() => { checkTrial(); }, [checkTrial]);

  useEffect(() => {
    if (subscriptionStatus?.trial_remaining_seconds !== undefined)
      setRemainingSeconds(subscriptionStatus.trial_remaining_seconds);
  }, [subscriptionStatus?.trial_remaining_seconds]);

  useEffect(() => {
    if (subscriptionStatus?.status !== 'trial') return;
    const interval = setInterval(() => setRemainingSeconds((p) => Math.max(0, p - 60)), 60_000);
    return () => clearInterval(interval);
  }, [subscriptionStatus?.status]);

  const formatTime = (): string => {
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return {
    isTrialExpired: subscriptionStatus?.status === 'expired' || remainingSeconds <= 0,
    isTrialActive:  subscriptionStatus?.status === 'trial' && remainingSeconds > 0,
    isSubscribed:   subscriptionStatus?.status === 'active',
    remainingTime:  formatTime(),
    remainingSeconds,
    checkTrial,
  };
}
