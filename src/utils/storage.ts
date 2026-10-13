// src/utils/storage.ts
import type { Book } from '../models/modelBook';

const DB_NAME = 'MarginaliaDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

export type StorageKey =
    | 'marginaliaLibrary'
    | 'marginaliaFavorites'
    | 'marginaliaUser'
    | 'marginaliaCurrentlyReading'
    | 'marginaliaWantToRead'
    | 'marginaliaLists';

const ALL_KEYS: StorageKey[] = [
    'marginaliaLibrary',
    'marginaliaFavorites',
    'marginaliaUser',
    'marginaliaCurrentlyReading',
    'marginaliaWantToRead',
    'marginaliaLists',
];

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function idbGet<T>(key: StorageKey): Promise<T | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

async function idbSet<T>(key: StorageKey, value: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/**
 * Helper global para buscar capas mais rápidas (-M para grades/listas, -L apenas para página de detalhe)
 */
export function getOpenLibraryCover(book: any, size: 'M' | 'L' = 'M'): string {
    if (!book) return '/img-book-template.png';

    const coverId = book.coverId ?? book.covers?.[0] ?? book.cover_i;
    if (coverId) {
        return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
    }

    if (typeof book.cover_edition_key === 'string' && book.cover_edition_key) {
        return `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-${size}.jpg`;
    }

    return '/img-book-template.png';
}

export const marginaliaStorage = {
    async get<T>(key: StorageKey, fallback: T): Promise<T> {
        try {
            const dbValue = await idbGet<T>(key);
            if (dbValue !== null && dbValue !== undefined) {
                return dbValue;
            }

            const legacyRaw = localStorage.getItem(key);
            if (legacyRaw) {
                const parsed = JSON.parse(legacyRaw) as T;
                await idbSet(key, parsed);
                return parsed;
            }
        } catch (error) {
            console.error(`Erro ao ler ${key}:`, error);
            const legacyRaw = localStorage.getItem(key);
            if (legacyRaw) return JSON.parse(legacyRaw) as T;
        }
        return fallback;
    },

    async set<T>(key: StorageKey, value: T): Promise<void> {
        try {
            await idbSet(key, value);
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Erro ao salvar ${key}:`, error);
            localStorage.setItem(key, JSON.stringify(value));
        }
        window.dispatchEvent(new Event('marginalia-storage-update'));
    },

    /**
     * Remove um livro do histórico de leitura (marginaliaLibrary)
     * Se houver mais de um registro do mesmo livro, remove a ocorrência específica
     */
    async removeLibraryBook(bookKey: string, readedOnDate?: string): Promise<Book[]> {
        const books = await this.get<Book[]>('marginaliaLibrary', []);
        let removed = false;

        const updated = books.filter((b) => {
            if (!removed && b.key === bookKey && (!readedOnDate || b.readedOnDate === readedOnDate)) {
                removed = true;
                return false;
            }
            return true;
        });

        await this.set('marginaliaLibrary', updated);
        return updated;
    },

    /**
     * Remove um livro de um slot de Favoritos (ex: 'firstFavorite')
     */
    async removeFavoriteSlot(slotId: string): Promise<void> {
        const favs = await this.get<any[]>('marginaliaFavorites', []);
        const updated = favs.filter((f) => f.favoriteID !== slotId);
        await this.set('marginaliaFavorites', updated);
    },

    /**
     * Remove um livro de "Currently Reading"
     */
    async removeCurrentlyReading(bookKey: string): Promise<void> {
        const reading = await this.get<any[]>('marginaliaCurrentlyReading', []);
        const updated = reading.filter((item) => item.key !== bookKey);
        await this.set('marginaliaCurrentlyReading', updated);
    },

    /**
     * Remove um livro de "Want to Read"
     */
    async removeWantToRead(bookKey: string): Promise<void> {
        const watchlist = await this.get<Book[]>('marginaliaWantToRead', []);
        const updated = watchlist.filter((item) => item.key !== bookKey);
        await this.set('marginaliaWantToRead', updated);
    },

    async exportBackup(): Promise<void> {
        const backupData: Record<string, any> = {
            _meta: {
                app: 'Marginalia',
                exportedAt: new Date().toISOString(),
                version: 2,
            },
        };

        for (const key of ALL_KEYS) {
            backupData[key] = await this.get(key, null);
        }

        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        const dateStr = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `marginalia-backup-${dateStr}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    async importBackup(file: File): Promise<boolean> {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            for (const key of ALL_KEYS) {
                if (parsed[key] !== undefined && parsed[key] !== null) {
                    await this.set(key, parsed[key]);
                }
            }
            return true;
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            return false;
        }
    },
};