// service-worker.js ---
// Service worker for Mount Olympus Treasury
// Focused on performance enhancements rather than offline functionality

const CACHE_NAME = 'olympus-treasury-v2';

// Assets to cache for performance
const ASSETS_TO_CACHE = [
  '/css/tailwind.css',
  '/css/parent.css',
  '/css/child.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/data.js',
  '/js/transactions.js',
  '/js/chores.js',
  '/js/goals.js',
  '/js/settings.js',
  '/js/utils.js',
  '/js/dashboard-components.js',
  '/js/dashboard-adapter.js',
  '/js/firebase-config.js',
  '/js/firebase-auth.js',
  '/js/browser-check.js',
  '/js/perf-monitor.js',
  '/js/a11y-enhancements.js',
  '/index.html',
  '/login.html'
];

// Install event - cache critical assets for performance
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app assets for performance...');
        return cache.addAll(ASSETS_TO_CACHE.map(url => {
          // If URLs start with /, remove the leading slash when running locally
          // or if being served from GitHub Pages
          if (url.startsWith('/')) {
            // Check if we're on GitHub Pages
            if (self.location.hostname.includes('github.io')) {
              return url.replace('/', '/Solo-Olympus/');
            }
            // For local development, just remove the leading slash
            return url.substring(1);
          }
          return url;
        }));
      })
      .then(() => {
        console.log('[Service Worker] Successfully cached app assets');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error during cache initialization:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker...');
  const cacheAllowlist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheAllowlist.indexOf(cacheName) === -1) {
              console.log('[Service Worker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - use cache for static assets to improve performance
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // For static assets, use cache-first strategy for performance
  if (event.request.url.match(/\.(css|js|svg|png|jpg|jpeg|gif|ico)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response
            return cachedResponse;
          }

          // If not in cache, fetch from network and cache for next time
          return fetch(event.request)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the resource for future use
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(error => {
              console.error('[Service Worker] Fetch error:', error, 'for URL:', event.request.url);
              // Return a fallback response or let the browser handle the error
              return new Response('Network error occurred', { status: 503, statusText: 'Service Unavailable' });
            });
        })
    );
    return;
  }

  // For HTML files, network-first strategy to ensure up-to-date content
  if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the HTML for offline fallback
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests, always go to network
  // This ensures users always get fresh content for non-cached resources
  return;
});

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 