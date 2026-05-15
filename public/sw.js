// Simple Service Worker for PWA
const CACHE_NAME = 'boutiquestock-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Requirement for PWA installability: must have a fetch handler
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
