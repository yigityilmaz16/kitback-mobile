import { useSyncExternalStore } from 'react';
import { openDatabaseSync } from 'expo-sqlite';
import { tr } from './translations';

type Language = 'tr' | 'en';
let language: Language = 'tr';
const listeners = new Set<() => void>();
let settings: ReturnType<typeof openDatabaseSync> | undefined;
export function initializeLanguage() {
  settings = openDatabaseSync('kitback-settings.db');
  settings.execSync(
    'CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  );
  const saved = settings.getFirstSync<{ value: string }>(
    'SELECT value FROM preferences WHERE key=?',
    'language',
  );
  language = saved?.value === 'en' ? 'en' : 'tr';
  listeners.forEach((listener) => listener());
}
export function setLanguage(next: Language) {
  if (!settings) throw new Error('Language settings are unavailable.');
  settings.runSync('INSERT OR REPLACE INTO preferences(key,value) VALUES(?,?)', 'language', next);
  language = next;
  listeners.forEach((listener) => listener());
}
export function useLanguage() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => language,
  );
}
export function t(text: string): string {
  return language === 'tr' ? (tr[text] ?? text) : text;
}
export function formatDate(value: string): string {
  return new Date(value).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
