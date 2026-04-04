import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../store/useStore';
import { getSubscriptionStatus } from '../services/api';

export function useTrialCheck() {
  const deviceId = useUserStore(state => state.deviceId);
  const [status, setStatus] = useState<any>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const checkTrial = useCallback(async () => {
    if (!deviceId) return;
    try {
      const s = await getSubscriptionStatus(deviceId);
      setStatus(s);
      setRemainingSeconds(s.trial_remaining_seconds || 0);
    } catch { /* noop */ }
  }, [deviceId]);

  useEffect(() => { checkTrial(); }, [checkTrial]);

  useEffect(() => {
    if (status?.status !== 'trial') return;
    const interval = setInterval(() => setRemainingSeconds(p => Math.max(0, p - 60)), 60_000);
    return () => clearInterval(interval);
  }, [status?.status]);

  const formatTime = (): string => {
    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    return `${h}h ${m > 0 ? m + 'm' : ''}`;
  };

  return {
    isTrialExpired: status?.status === 'expired' || remainingSeconds <= 0,
    isTrialActive:  status?.status === 'trial' && remainingSeconds > 0,
    isSubscribed:   status?.status === 'active',
    remainingTime:  formatTime(),
    remainingSeconds,
    checkTrial,
  };
}
