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

// Abre (ou cria) o banco IndexedDB no navegador
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

// Lê um valor do IndexedDB
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

// Salva um valor no IndexedDB
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

export const marginaliaStorage = {
    /**
     * Busca um dado no IndexedDB.
     * Se ainda não existir no IndexedDB mas existir no localStorage antigo,
     * faz a migração automática sem perder seus dados!
     */
    async get<T>(key: StorageKey, fallback: T): Promise<T> {
        try {
            const dbValue = await idbGet<T>(key);
            if (dbValue !== null && dbValue !== undefined) {
                return dbValue;
            }

            // Migração automática do localStorage legado
            const legacyRaw = localStorage.getItem(key);
            if (legacyRaw) {
                const parsed = JSON.parse(legacyRaw) as T;
                await idbSet(key, parsed);
                return parsed;
            }
        } catch (error) {
            console.error(`Erro ao ler ${key} do IndexedDB:`, error);
            const legacyRaw = localStorage.getItem(key);
            if (legacyRaw) return JSON.parse(legacyRaw) as T;
        }
        return fallback;
    },

    /**
     * Salva no IndexedDB (capacidade de centenas de MBs) e mantém
     * cópia sincronizada no localStorage para compatibilidade com outros componentes.
     */
    async set<T>(key: StorageKey, value: T): Promise<void> {
        try {
            await idbSet(key, value);
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Erro ao salvar ${key} no IndexedDB:`, error);
            localStorage.setItem(key, JSON.stringify(value));
        }
    },

    /**
     * Exporta toda a sua biblioteca, favoritos, listas e perfil em um arquivo .JSON
     */
    async exportBackup(): Promise<void> {
        const backupData: Record<string, any> = {
            _meta: {
                app: 'Marginalia',
                exportedAt: new Date().toISOString(),
                version: 1,
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

    /**
     * Importa um arquivo .JSON de backup e restaura todos os dados no IndexedDB e localStorage
     */
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
            console.error('Erro ao importar arquivo de backup:', error);
            return false;
        }
    },
};

// Helper dedicado para adicionar um livro lido à biblioteca
export async function addBookToLibraryDB(bookInfo: Book): Promise<Book[]> {
    const books = await marginaliaStorage.get<Book[]>('marginaliaLibrary', []);
    books.push(bookInfo);
    await marginaliaStorage.set('marginaliaLibrary', books);
    return books;
}