/**
 * Ágora Mujeres - Service Worker
 * 
 * Handles:
 * 1. Static asset caching for faster load
 * 2. API response caching for offline resilience
 * 3. Network-first for fresh API data, fallback to cache
 * 4. Push notifications (when configured)
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `agora-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `agora-api-${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `agora-static-${CACHE_VERSION}`;

// Static assets that should be cached on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('Failed to cache static assets:', err);
        });
      }),
      caches.open(API_CACHE_NAME).then((cache) => Promise.resolve(cache)),
      caches.open(CACHE_NAME).then((cache) => Promise.resolve(cache)),
    ])
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

/**
 * Fetch event handling with network-first strategy for API, cache-first for static assets
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and non-HTTP requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API calls: Network-first (fresh data), fallback to cache, then offline response
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Serving API from cache:', url.pathname);
              return cachedResponse;
            }
            // No cache available, return offline response
            return createOfflineResponse(url.pathname);
          });
        })
    );
    return;
  }

  // Static assets: Cache-first, fallback to network
  else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && request.method === 'GET') {
            const responseToCache = response.clone();
            const cacheName = url.pathname.includes('/js/') || url.pathname.includes('/css/') 
              ? STATIC_CACHE_NAME 
              : CACHE_NAME;
            caches.open(cacheName).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Network failed, try to serve from cache
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || createOfflineResponse(url.pathname);
          });
        });
      })
    );
  }
});

/**
 * Create a minimal offline response for common endpoints
 */
function createOfflineResponse(pathname) {
  // For diary entries and other data endpoints
  if (pathname.includes('/diary')) {
    return new Response(JSON.stringify({ data: [], offline: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
  
  // For patterns
  if (pathname.includes('/patterns')) {
    return new Response(JSON.stringify({ patterns: [], offline: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
  
  // For chat
  if (pathname.includes('/chat')) {
    return new Response(JSON.stringify({ messages: [], offline: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }
  
  // Default offline page
  return new Response(
    '<html><body><h1>Offline</h1><p>You are offline. Some features are unavailable.</p></body></html>',
    {
      headers: { 'Content-Type': 'text/html' },
      status: 503,
    }
  );
}

/**
 * Push notification handling (when configured)
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New message from Ágora',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id,
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Ágora Mujeres', options)
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app window is already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
