const CACHE_NAME = 'chronoworld-spa-v3';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './data.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Cairo:wght@400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .catch(err => console.log('SW Cache error', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;
    
    // Ignore API requests in SW, because app.js handles IndexedDB caching for them
    if (event.request.url.includes('restcountries.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;
            
            return fetch(event.request).then(netRes => {
                if (!netRes || netRes.status !== 200 || netRes.type !== 'basic') {
                    return netRes;
                }
                
                // Clone and cache successful requests dynamically (like flag images)
                const resClone = netRes.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                return netRes;
            }).catch(() => {
                // Return nothing or an offline placeholder if available
            });
        })
    );
});
