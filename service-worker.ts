

// service-worker.js
self.addEventListener('install', (event) => {
    console.log('Service worker installed');
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
  });
  

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.open('my-cache').then((cache) => {
      return cache.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});

  