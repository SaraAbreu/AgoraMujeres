import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getSubscriptionStatus } from '../services/api';

interface TrialCheckResult {
  isTrialExpired: boolean;
  isTrialActive: boolean;
  isSubscribed: boolean;
  remainingTime: string;
  remainingSeconds: number;
  checkTrial: () => Promise<void>;
}

export const useTrialCheck = (): TrialCheckResult => {
  const { deviceId, subscriptionStatus, setSubscriptionStatus } = useStore();
  const [remainingSeconds, setRemainingSeconds] = useState(7200);

  const checkTrial = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      const status = await getSubscriptionStatus(deviceId);
      setSubscriptionStatus(status);
      setRemainingSeconds(status.trial_remaining_seconds || 0);
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  }, [deviceId, setSubscriptionStatus]);

  useEffect(() => {
    checkTrial();
  }, [checkTrial]);

  // Sincronizar remainingSeconds cuando subscriptionStatus cambia
  useEffect(() => {
    if (subscriptionStatus?.trial_remaining_seconds !== undefined) {
      setRemainingSeconds(subscriptionStatus.trial_remaining_seconds);
    }
  }, [subscriptionStatus?.trial_remaining_seconds]);

  // Update remaining time every minute
  useEffect(() => {
    if (subscriptionStatus?.status !== 'trial') return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newValue = Math.max(0, prev - 60);
        return newValue;
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [subscriptionStatus?.status]);

  const formatRemainingTime = (): string => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return {
    isTrialExpired: subscriptionStatus?.status === 'expired' || remainingSeconds <= 0,
    isTrialActive: subscriptionStatus?.status === 'trial' && remainingSeconds > 0,
    isSubscribed: subscriptionStatus?.status === 'active',
    remainingTime: formatRemainingTime(),
    remainingSeconds,
    checkTrial,
  };
};
