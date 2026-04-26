// service-worker.js - نسخة مُحسَّنة
const CACHE_NAME = 'interpreter-ai-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/db.js',
    '/language-detector.js',
    '/ai-engine.js',
    '/text-engine.js',
    '/speech-engine.js',
    '/ocr-engine.js',
    '/ui.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // استخدام addAll مع Promise.allSettled لتجنب فشل التثبيت إذا تعذر تحميل أصل واحد
                return Promise.allSettled(
                    ASSETS.map(url =>
                        cache.add(url).catch(err => {
                            console.warn('فشل تحميل الأصل للتخزين المؤقت:', url, err);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting()) // تخطي الانتظار بعد التثبيت
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // تجاهل الطلبات غير GET أو التي لا تستخدم HTTP/HTTPS (مثل chrome-extension://)
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then(response => {
                // خزّن النسخة الناجحة فقط
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    }).catch(err => console.warn('تعذر تخزين الاستجابة:', err));
                }
                return response;
            }).catch(() => {
                // رد بديل عند عدم الاتصال (للموارد غير الموجودة في الكاش)
                return new Response('أنت غير متصل بالإنترنت', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            });
        })
    );
});
