import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { DiaryEntry, Patterns, SubscriptionStatus, Resource, CycleEntry, MonthlyPainRecord } from '../services/api';
import * as api from '../services/api';

/**
 * Query client configuration for Ágora Mujeres
 * Optimizes data fetching, caching, and synchronization
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// ============ DIARY QUERIES ============

export const useDiaryEntries = (deviceId: string, limit = 30) => {
  return useQuery<DiaryEntry[]>({
    queryKey: ['diaryEntries', deviceId],
    queryFn: () => api.getDiaryEntries(deviceId, limit),
    enabled: !!deviceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateDiaryEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createDiaryEntry,
    onSuccess: (_, variables) => {
      // Invalidate diary entries cache
      queryClient.invalidateQueries({
        queryKey: ['diaryEntries', variables.device_id],
      });
      // Invalidate patterns cache
      queryClient.invalidateQueries({
        queryKey: ['patterns', variables.device_id],
      });
    },
  });
};

export const useDiaryPatterns = (deviceId: string, days = 7) => {
  return useQuery<Patterns>({
    queryKey: ['patterns', deviceId, days],
    queryFn: () => api.getPatterns(deviceId, days),
    enabled: !!deviceId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// ============ CHAT QUERIES ============

export const useChatConversations = (deviceId: string) => {
  return useQuery({
    queryKey: ['conversations', deviceId],
    queryFn: () => api.getConversations(deviceId),
    enabled: !!deviceId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      message,
      conversationId,
      deviceId,
    }: {
      message: string;
      conversationId?: string;
      deviceId: string;
    }) => api.sendChatMessage(message, conversationId, deviceId),
    onSuccess: (_, { deviceId }) => {
      // Invalidate conversations
      queryClient.invalidateQueries({
        queryKey: ['conversations', deviceId],
      });
    },
  });
};

// ============ SUBSCRIPTION QUERIES ============

export const useSubscriptionStatus = (deviceId: string) => {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription', deviceId],
    queryFn: () => api.getSubscriptionStatus(deviceId),
    enabled: !!deviceId,
    staleTime: 60 * 1000, // 1 minute (check often)
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ deviceId, email, name }: { deviceId: string; email: string; name?: string }) =>
      api.createCustomer(deviceId, email, name),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: ['subscription', deviceId],
      });
    },
  });
};

export const useCreatePaymentIntent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (deviceId: string) => api.createPaymentIntent(deviceId),
    onSuccess: (_, deviceId) => {
      queryClient.invalidateQueries({
        queryKey: ['subscription', deviceId],
      });
    },
  });
};

export const useActivateSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ deviceId, paymentIntentId }: { deviceId: string; paymentIntentId: string }) =>
      api.activateSubscription(deviceId, paymentIntentId),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: ['subscription', deviceId],
      });
    },
  });
};

// ============ CYCLE QUERIES ============

export const useCycleEntries = (deviceId: string) => {
  return useQuery<CycleEntry[]>({
    queryKey: ['cycleEntries', deviceId],
    queryFn: () => api.getCycleEntries(deviceId),
    enabled: !!deviceId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useCreateCycleEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createCycleEntry,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cycleEntries', variables.device_id],
      });
    },
  });
};

// ============ MONTHLY RECORD QUERIES ============

export const useMonthlyRecord = (deviceId: string) => {
  return useQuery<MonthlyPainRecord | null>({
    queryKey: ['monthlyRecord', deviceId],
    queryFn: () => api.getMonthlyRecord(deviceId),
    enabled: !!deviceId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useSaveMonthlyRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      deviceId,
      data,
    }: {
      deviceId: string;
      data: { records: Array<{ date: string; intensity: number; notes?: string }>; cycle_start_date: string };
    }) => api.saveMonthlyRecord(deviceId, data),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({
        queryKey: ['monthlyRecord', deviceId],
      });
    },
  });
};

// ============ RESOURCES QUERIES ============

export const useResources = (category?: string, language = 'es') => {
  return useQuery<Resource[]>({
    queryKey: ['resources', category, language],
    queryFn: () => api.getResources(category, language),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useResourceCategories = (language = 'es') => {
  return useQuery({
    queryKey: ['resourceCategories', language],
    queryFn: () => api.getResourceCategories(language),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// ============ UTILITY ============

/**
 * Prefetch common queries when app starts
 */
export const prefetchAppData = async (deviceId: string, language = 'es') => {
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['subscription', deviceId],
        queryFn: () => api.getSubscriptionStatus(deviceId),
      }),
      queryClient.prefetchQuery({
        queryKey: ['diaryEntries', deviceId],
        queryFn: () => api.getDiaryEntries(deviceId),
      }),
      queryClient.prefetchQuery({
        queryKey: ['resourceCategories', language],
        queryFn: () => api.getResourceCategories(language),
      }),
    ]);
  } catch (error) {
    console.error('Error prefetching app data:', error);
  }
};

/**
 * Clear all app data from cache
 */
export const clearAppCache = () => {
  queryClient.clear();
};

/**
 * Invalidate user-specific data on logout/switch user
 */
export const invalidateUserData = (deviceId: string) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return Array.isArray(queryKey) && queryKey.some((key) => key === deviceId);
    },
  });
};
