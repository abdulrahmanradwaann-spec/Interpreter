import Dexie, { type Table } from 'dexie';
import { TranslationHistory } from '../types';

export class AuraDatabase extends Dexie {
  translations!: Table<TranslationHistory>;

  constructor() {
    super('AuraTranslateDB');
    this.version(1).stores({
      translations: '++id, timestamp, type, sourceLang, targetLang'
    });
  }
}

export const db = new AuraDatabase();
