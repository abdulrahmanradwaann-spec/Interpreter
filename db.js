// db.js - إدارة IndexedDB (نسخة مُحسَّنة)
const DB = (() => {
    const DB_NAME = 'InterpreterAI_DB';
    const STORE = 'translations';
    let db = null;
    let openPromise = null; // لتجنب فتح القاعدة أكثر من مرة في نفس الوقت

    async function open() {
        // إذا كان الاتصال موجوداً ومفتوحاً، أرجع فوراً
        if (db) return db;
        // إذا كانت عملية فتح قيد التنفيذ، انتظر حتى تنتهي
        if (openPromise) return openPromise;

        openPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);

            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(STORE)) {
                    const store = d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp');
                }
            };

            req.onsuccess = (e) => {
                db = e.target.result;
                // إعادة التعيين عند إغلاق القاعدة تلقائياً
                db.onclose = () => {
                    db = null;
                    openPromise = null;
                };
                resolve(db);
            };

            req.onerror = (e) => {
                openPromise = null; // اسمح بإعادة المحاولة لاحقاً
                reject(e.target.error);
            };
        });

        return openPromise;
    }

    async function add(entry) {
        if (!db) await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const req = store.add({ ...entry, timestamp: Date.now() });
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function getAll(limit = 50) {
        if (!db) await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            // التأكد من وجود الفهرس (تم إنشاؤه عند الترقية)
            const index = store.index('timestamp');
            const req = index.openCursor(null, 'prev');
            const result = [];
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor && result.length < limit) {
                    result.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(result);
                }
            };
            req.onerror = () => reject(req.error);
        });
    }

    async function clear() {
        if (!db) await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            const req = tx.objectStore(STORE).clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    return { open, add, getAll, clear };
})();
