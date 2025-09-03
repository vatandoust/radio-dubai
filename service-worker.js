const CACHE_NAME = 'radio-universo-cache-v1.3.0';
const OFFLINE_URL = '/index.html';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',

  // Iconos recomendados para PWA
  '/assets/icono-pwa/icon_72.png',   // Android ldpi
  '/assets/icono-pwa/icon_96.png',   // Android mdpi
  '/assets/icono-pwa/icon_128.png',  // Chrome / favicon
  '/assets/icono-pwa/icon_144.png',  // Android hdpi
  '/assets/icono-pwa/icon_192.png',  // Android xhdpi (obligatorio)
  '/assets/icono-pwa/icon_384.png',  // Android xxhdpi
  '/assets/icono-pwa/icon_512.png'   // Android xxxhdpi (obligatorio para instalación PWA)
];


// iOS specific cache handling
const IOS_ASSETS = [
  // Splash screens existentes
  '/assets/pwa-ios/apple-splash-2048-2732.png',  // iPad Pro 12.9"
  '/assets/pwa-ios/apple-splash-1668-2388.png',  // iPad Pro 11"
  '/assets/pwa-ios/apple-splash-1536-2048.png',  // iPad Retina
  '/assets/pwa-ios/apple-splash-1125-2436.png',  // iPhone X, Xs
  '/assets/pwa-ios/apple-splash-1242-2688.png',  // iPhone Xs Max
  '/assets/pwa-ios/apple-splash-828-1792.png',   // iPhone XR
  '/assets/pwa-ios/apple-splash-750-1334.png',   // iPhone 6,7,8
  '/assets/pwa-ios/apple-splash-640-1136.png',   // iPhone 5, SE 1ra Gen

  // Splash screens nuevos para iPhones modernos
  '/assets/pwa-ios/apple-splash-1170-2532.png',  // iPhone 12/13/14/15 1170x2532px
  '/assets/pwa-ios/apple-splash-1284-2778.png',  // iPhone 12-15 Pro Max 1284x2778px
  '/assets/pwa-ios/apple-splash-1179-2556.png',  // iPhone 15 Pro 1179x2556px
  '/assets/pwa-ios/apple-splash-1290-2796.png',  // iPhone 15 Pro Max 1290x2796px

  // Apple icons
  '/assets/pwa-ios/apple-icon-180.png',
  '/assets/pwa-ios/apple-icon-152.png',
  '/assets/pwa-ios/apple-icon-167.png',
  '/assets/pwa-ios/apple-icon-120.png'
];


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching critical assets');
        // Add iOS specific assets to critical assets
        return cache.addAll([...CRITICAL_ASSETS, ...IOS_ASSETS]);
      })
      .then(() => self.skipWaiting()) // Activate service worker immediately
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Cache purged successfully');
      return self.clients.claim(); // Take control of all uncontrolled clients
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream and can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        return caches.match(OFFLINE_URL);
      })
  );
});

self.addEventListener('push', event => {
  const title = 'Radio Universal';
  const options = {
    body: 'Nueva música en transmisión!',
    icon: '/assets/icono-pwa/icon_192.png',   // Tamaño óptimo para icon
    badge: '/assets/icono-pwa/icon_96.png'    // Tamaño óptimo para badge
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
