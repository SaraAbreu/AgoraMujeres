/**
 * Ágora Mujeres - Offline Support Utility
 * 
 * Provides:
 * 1. Online/offline status detection
 * 2. Retry logic for failed API calls
 * 3. Queue for offline mutations
 * 4. Sync when connection restored
 */

export class OfflineManager {
  private offlineQueue: Array<{
    id: string;
    action: () => Promise<any>;
    timestamp: number;
  }> = [];

  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Array<(isOnline: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnlineStatus(true));
      window.addEventListener('offline', () => this.setOnlineStatus(false));
    }
  }

  /**
   * Subscribe to online/offline changes
   */
  onStatusChange(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.isOnline);
    
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Set online status and notify listeners
   */
  private setOnlineStatus(status: boolean) {
    if (this.isOnline === status) return;
    
    this.isOnline = status;
    console.log(`App is now ${status ? 'online' : 'offline'}`);
    
    this.listeners.forEach((listener) => listener(status));
    
    if (status) {
      // Try to sync when coming back online
      this.syncOfflineQueue();
    }
  }

  /**
   * Get current online status
   */
  getStatus() {
    return this.isOnline;
  }

  /**
   * Queue an action to be executed offline (or now if online)
   */
  async queueAction<T>(
    id: string,
    action: () => Promise<T>,
    executeImmediately = false
  ): Promise<T | null> {
    // If online and instructed, execute immediately
    if (this.isOnline && executeImmediately) {
      try {
        return await action();
      } catch (error) {
        console.warn(`Action ${id} failed:`, error);
        // If it fails, queue it for retry
        this.addToQueue(id, action);
        return null;
      }
    }

    // If offline, add to queue
    if (!this.isOnline) {
      this.addToQueue(id, action);
      return null;
    }

    // Try to execute, but queue on failure
    try {
      return await action();
    } catch (error) {
      console.warn(`Action ${id} failed, queuing for retry:`, error);
      this.addToQueue(id, action);
      return null;
    }
  }

  /**
   * Add action to offline queue (max 50 items)
   */
  private addToQueue(id: string, action: () => Promise<any>) {
    // Remove if already in queue
    this.offlineQueue = this.offlineQueue.filter((item) => item.id !== id);

    // Add to queue
    this.offlineQueue.push({
      id,
      action,
      timestamp: Date.now(),
    });

    // Keep only last 50 items
    if (this.offlineQueue.length > 50) {
      this.offlineQueue = this.offlineQueue.slice(-50);
    }

    console.log(`Queued action ${id}, queue size: ${this.offlineQueue.length}`);
  }

  /**
   * Sync all queued actions
   */
  async syncOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Syncing ${this.offlineQueue.length} queued actions...`);

    const queue = [...this.offlineQueue];
    const results = {
      succeeded: 0,
      failed: 0,
    };

    for (const item of queue) {
      try {
        await item.action();
        this.offlineQueue = this.offlineQueue.filter((i) => i.id !== item.id);
        results.succeeded++;
        console.log(`✓ Synced action: ${item.id}`);
      } catch (error) {
        results.failed++;
        console.warn(`✗ Sync failed for action ${item.id}:`, error);
      }
    }

    console.log(`Sync complete: ${results.succeeded} succeeded, ${results.failed} failed`);

    // Fire event for UI to react to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('offlineSyncComplete', {
          detail: results,
        })
      );
    }
  }

  /**
   * Get queue size
   */
  getQueueSize() {
    return this.offlineQueue.length;
  }

  /**
   * Clear offline queue
   */
  clearQueue() {
    const size = this.offlineQueue.length;
    this.offlineQueue = [];
    console.log(`Cleared ${size} queued actions`);
  }

  /**
   * Get queued action IDs
   */
  getQueuedActionIds() {
    return this.offlineQueue.map((item) => item.id);
  }
}

export const offlineManager = new OfflineManager();

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delayMs = baseDelayMs * Math.pow(2, i);
      console.warn(
        `Attempt ${i + 1} failed, retrying in ${delayMs}ms:`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Sync specific offline action
 */
export async function syncOfflineAction(id: string, action: () => Promise<any>) {
  try {
    await action();
    console.log(`Synced offline action: ${id}`);
  } catch (error) {
    console.error(`Failed to sync offline action ${id}:`, error);
    throw error;
  }
}
