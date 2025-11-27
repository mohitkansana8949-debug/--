// This is a basic service worker to make the app installable.
// It doesn't do much for now, but it's required for PWA.

self.addEventListener('fetch', (event) => {
  // We are not caching anything for now, just passing through the network request.
  event.respondWith(fetch(event.request));
});
