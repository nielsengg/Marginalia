// src/pages/BookSearchPage.tsx
import styles from '../assets/styles/BookSearchPage.module.css';
import '../assets/styles/global.css';
import Header from '../components/Header';
import { fetchBooks } from '../utils/fetchBooks';
import { getOpenLibraryCover } from '../utils/storage';
import type { Book } from '../models/modelBook';

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function BookSearchPage() {
    const { title } = useParams<{ title: string }>();
    const [items, setItems] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const handleBookClick = (bookKey: string) => {
        const id = bookKey.replace('/works/', '');
        navigate(`/book/${id}`);
    };

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        const loadData = async () => {
            try {
                const fetchedItems = await fetchBooks(title || '', 'title', controller.signal);
                setItems(fetchedItems);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
        return () => controller.abort();
    }, [title]);

    return (
        <div className="contentBody">
            <Header />

            <main className={styles.bodyBookSearch}>
                {loading ? (
                    <div className="bookPageLoading">
                        <div className="loadingMessage">Searching Open Library...</div>
                    </div>
                ) : error ? (
                    <p style={{ color: 'var(--accent-crimson)' }}>{error}</p>
                ) : items.length !== 0 ? (
                    <ul className={styles.bookSearchList}>
                        {items.map((book) => (
                            <li
                                className={styles.bookSearchItem}
                                key={book.key}
                                onClick={() => handleBookClick(book.key)}
                            >
                                <div className={`coverFrame ${styles.searchCoverFrame}`}>
                                    <img
                                        src={getOpenLibraryCover(book, 'M')}
                                        alt={`Cover ${book.title}`}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className={styles.bookInfo}>
                                    <h2 className={styles.bookTitle}>{book.title}</h2>
                                    <p className={styles.bookDescription}>
                                        Written by {book.author_name?.join(', ') || 'Unknown author'}
                                    </p>
                                    {book.first_publish_year && (
                                        <span className={styles.publishYearTag}>
                                            Published in {book.first_publish_year}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="bookPageLoading">
                        <div className="loadingMessage">
                            There were no matches for "{title}".
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}