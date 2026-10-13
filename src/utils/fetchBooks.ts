// src/utils/fetchBooks.ts
import type { Book } from '../models/modelBook';

const SEARCH_FIELDS = [
    'key',
    'title',
    'author_name',
    'cover_i',
    'cover_edition_key',
    'first_publish_year',
    'number_of_pages_median',
].join(',');

export async function fetchBooks(
    searchParameter: string,
    searchType: 'title' | 'key',
    signal?: AbortSignal
): Promise<any> {
    const trimmed = searchParameter.trim();
    if (!trimmed) return searchType === 'title' ? [] : null;

    try {
        if (searchType === 'title') {
            // Usa ?q= com fields específicos: encontra edições em PT/EN e responde muito mais rápido
            const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&fields=${SEARCH_FIELDS}&limit=20`;
            const bookResponse = await fetch(url, { signal });

            if (!bookResponse.ok) {
                throw new Error(`Error HTTP: ${bookResponse.status}`);
            }

            const bookData = await bookResponse.json();
            const docs = Array.isArray(bookData.docs) ? bookData.docs : [];

            // Normaliza covers para que book.covers[0] funcione em qualquer componente
            return docs.map((doc: any): Book => ({
                ...doc,
                covers: doc.cover_i ? [doc.cover_i] : doc.covers || [],
            }));
        } else if (searchType === 'key') {
            const formattedKey = trimmed.startsWith('/') ? trimmed : `/works/${trimmed}`;
            const bookResponse = await fetch(`https://openlibrary.org${formattedKey}.json`, {
                signal,
            });

            if (!bookResponse.ok) {
                throw new Error(`Error HTTP: ${bookResponse.status}`);
            }

            const bookData = await bookResponse.json();
            return bookData;
        }
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            return searchType === 'title' ? [] : null;
        }
        console.error('Error fetching books:', error);
        throw error;
    }
}