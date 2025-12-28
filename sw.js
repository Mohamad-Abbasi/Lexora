/**
 * LEXORA Service Worker v1.0.0
 * طراح: محمد عباسی
 */

const CACHE_NAME = 'lexora-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Caching files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// استراتژی Cache-First برای دارایی‌های استاتیک
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // فقط درخواست‌های HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // اگر در کش بود، برگردان
          return cachedResponse;
        }

        // اگر نبود، از شبکه بگیر
        return fetch(request)
          .then((response) => {
            // اگر پاسخ معتبر نبود، برگردان
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // کپی از پاسخ برای ذخیره در کش
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // اگر آفلاین بود و HTML درخواست شده، صفحه اصلی را برگردان
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// پیام‌های دریافتی از صفحه
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});