/**
 * Offline Storage Service
 * Handles Translation Memory (TM) and history using IndexedDB
 */

export type HistoryItem = {
  id: string;
  original: string;
  translated: string;
  from: string;
  to: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice';
};

class OfflineStorage {
  private dbName = 'ai_translation_db';
  private version = 1;

  async initDB() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return resolve(null);
      
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('translation_memory')) {
          db.createObjectStore('translation_memory', { keyPath: 'original' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveHistory(item: HistoryItem) {
    const db: any = await this.initDB();
    if (!db) return;
    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').put(item);
    return tx.complete;
  }

  async getHistory(): Promise<HistoryItem[]> {
    const db: any = await this.initDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a: any, b: any) => b.timestamp - a.timestamp));
    });
  }

  async clearHistory() {
    const db: any = await this.initDB();
    if (!db) return;
    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').clear();
  }
}

export const offlineStorage = new OfflineStorage();
