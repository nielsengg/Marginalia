// src/pages/BookDetailPage.tsx
import styles from '../assets/styles/BookDetailPage.module.css';
import Header from '../components/Header';
import { SearchModal } from '../components/SearchModal';
import type { Book } from '../models/modelBook';
import { marginaliaStorage, getOpenLibraryCover } from '../utils/storage';

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaHeart,
    FaBookOpen,
    FaPlus,
    FaCheck,
    FaTrash,
} from 'react-icons/fa';

export function BookDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [authorNames, setAuthorNames] = useState<string[]>([]);

    const [loggedEntry, setLoggedEntry] = useState<Book | null>(null);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [inReading, setInReading] = useState(false);

    const [modalMode, setModalMode] = useState<'read' | 'reading' | 'watchlist' | null>(null);

    const checkPersonalStatus = async (workKey: string) => {
        const [library, watchlist, reading] = await Promise.all([
            marginaliaStorage.get<Book[]>('marginaliaLibrary', []),
            marginaliaStorage.get<Book[]>('marginaliaWantToRead', []),
            marginaliaStorage.get<any[]>('marginaliaCurrentlyReading', []),
        ]);

        const foundLogs = library.filter((item) => item.key === workKey);
        setLoggedEntry(foundLogs.length > 0 ? foundLogs[foundLogs.length - 1] : null);
        setInWatchlist(watchlist.some((item) => item.key === workKey));
        setInReading(reading.some((item) => item.key === workKey));
    };

    useEffect(() => {
        setBook(null);
        const fetchBookDetails = async () => {
            try {
                const bookResponse = await fetch(`https://openlibrary.org/works/${id}.json`);
                const bookData = await bookResponse.json();
                setBook(bookData);

                if (bookData.key) {
                    checkPersonalStatus(bookData.key);
                }

                if (bookData.authors) {
                    const names = await Promise.all(
                        bookData.authors.map(async (author: any) => {
                            const authorResponse = await fetch(
                                `https://openlibrary.org${author.author.key}.json`
                            );
                            const authorData = await authorResponse.json();
                            return authorData.name || 'Unknown author';
                        })
                    );
                    setAuthorNames(names);
                }
            } catch (error) {
                console.error('Error fetching book details:', error);
            }
        };

        fetchBookDetails();
    }, [id]);

    const handleDeleteLogFromDetail = async () => {
        if (!loggedEntry || !book?.key) return;
        if (window.confirm(`Delete your reading log for "${book.title}"?`)) {
            await marginaliaStorage.removeLibraryBook(book.key, loggedEntry.readedOnDate);
            await checkPersonalStatus(book.key);
        }
    };

    if (!book) {
        return (
            <div className="contentBody">
                <Header />
                <div className="bookPageLoading">
                    <div className="loadingMessage">Loading book details...</div>
                </div>
            </div>
        );
    }

    const displayAuthors = book.author_name || authorNames || ['Unknown author'];
    const bookWithAuthors: Book = { ...book, author_name: displayAuthors };

    return (
        <div className="contentBody">
            <Header />

            <main className={styles.bodyBookDetail}>
                <aside className={styles.leftColumn}>
                    <div className={`coverFrame ${styles.detailCoverFrame}`}>
                        <img
                            src={getOpenLibraryCover(book, 'L')}
                            alt={`Cover ${book.title}`}
                            decoding="async"
                        />
                    </div>

                    <div className={styles.actionButtonsStack}>
                        <button
                            className={styles.primaryActionBtn}
                            onClick={() => setModalMode('read')}
                        >
                            {loggedEntry ? 'Log Again / Edit Review' : 'Log or Review Book'}
                        </button>

                        <button
                            className={styles.secondaryActionBtn}
                            onClick={() => setModalMode('reading')}
                        >
                            <FaBookOpen size={12} />
                            {inReading ? 'Update Reading Progress' : 'Currently Reading'}
                        </button>

                        <button
                            className={styles.secondaryActionBtn}
                            onClick={() => setModalMode('watchlist')}
                        >
                            {inWatchlist ? <FaCheck size={12} /> : <FaPlus size={12} />}
                            {inWatchlist ? 'In Want to Read Queue' : 'Want to Read'}
                        </button>
                    </div>
                </aside>

                <section className={styles.bookInfo}>
                    <h1 className={styles.bookTitle}>{book.title}</h1>
                    <p className={styles.bookAuthor}>Written by {displayAuthors.join(', ')}</p>

                    {book.first_publish_year && (
                        <span className={styles.publishBadge}>
                            First published in {book.first_publish_year}
                        </span>
                    )}

                    {loggedEntry && (
                        <div className={styles.personalLogBox}>
                            <div className={styles.personalLogHeader}>
                                <div className={styles.personalLogMeta}>
                                    <strong>Your Marginalia Log</strong>
                                    {loggedEntry.readedOnDate && (
                                        <span>Read on {loggedEntry.readedOnDate}</span>
                                    )}
                                    <div className={styles.starsRow}>
                                        {[...Array(5)].map((_, i) => {
                                            const r = loggedEntry.readStarRating || 0;
                                            if (r >= i + 1)
                                                return (
                                                    <FaStar key={i} color="var(--accent-gold)" />
                                                );
                                            if (r >= i + 0.5)
                                                return (
                                                    <FaStarHalfAlt
                                                        key={i}
                                                        color="var(--accent-gold)"
                                                    />
                                                );
                                            return <FaRegStar key={i} color="#456" />;
                                        })}
                                    </div>
                                    {loggedEntry.readHeartRating && (
                                        <FaHeart color="var(--accent-crimson)" />
                                    )}
                                </div>

                                <button
                                    className={styles.deleteLogBtn}
                                    onClick={handleDeleteLogFromDetail}
                                    title="Delete this log from history"
                                >
                                    <FaTrash size={12} /> Delete Log
                                </button>
                            </div>

                            {loggedEntry.readReview && (
                                <p className={styles.personalReviewText}>
                                    "{loggedEntry.readReview}"
                                </p>
                            )}
                        </div>
                    )}

                    <div className={styles.bookDescription}>
                        {typeof book.description === 'string'
                            ? book.description
                            : book.description?.value || 'No description available for this edition.'}
                    </div>
                </section>
            </main>

            {modalMode && (
                <SearchModal
                    initialBook={bookWithAuthors}
                    initialMode={modalMode}
                    onClose={() => {
                        setModalMode(null);
                        if (book.key) checkPersonalStatus(book.key);
                    }}
                />
            )}
        </div>
    );
}