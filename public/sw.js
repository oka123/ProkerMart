// DEVELOPMENT MODE SERVICE WORKER
// To avoid caching issues during development, caching is disabled by default.
// The fetch event listener is kept active (performing direct network pass-through)
// to satisfy PWA installation criteria in the browser.

// const CACHE_NAME = "prokermart-cache-v1";
// const ASSETS_TO_CACHE = [
//   "/",
//   "/site.webmanifest",
//   "/favicon/web-app-manifest-192x192.png",
//   "/favicon/web-app-manifest-512x512.png",
// ];

self.addEventListener("install", () => {
  /* PRODUCTION ONLY:
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  */
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  /* PRODUCTION ONLY:
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  */
  self.clients.claim();
});

self.addEventListener("fetch", () => {
  /* DEVELOPMENT ONLY: (Comment out or remove the return statement below in production to enable caching) */
  // Pass-through all requests directly to the network in development mode.
  // This satisfies PWA install requirements while ensuring hot-reloads and new code are served instantly.
  return;

  /* PRODUCTION ONLY (Stale-While-Revalidate Caching):
  // Only handle local GET requests, skip API calls, Supabase endpoints, and dev server hot-reloads
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("/_next/") ||
    event.request.url.includes("supabase.co") ||
    event.request.url.includes("chrome-extension")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return caches.match("/");
        });
    })
  );
  */
});

self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/favicon/web-app-manifest-192x192.png',
        badge: '/favicon/web-app-manifest-192x192.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' },
      };
      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
