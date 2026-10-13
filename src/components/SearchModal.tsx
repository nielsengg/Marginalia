// src/components/SearchModal.tsx
import styles from '../assets/styles/searchModal.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

import StarRate from '../components/StarRate';
import HeartRate from '../components/HeartRate';

import { saveReadBook } from '../utils/saveReadBook';
import { marginaliaStorage } from '../utils/storage';
import type { Book } from '../models/modelBook';
import { fetchBooks } from '../utils/fetchBooks';

type LogMode = 'read' | 'reading' | 'watchlist';

type Props = {
    onClose: () => void;
    initialBook?: Book | null;
    initialMode?: LogMode;
};

export function SearchModal({ onClose, initialBook = null, initialMode = 'read' }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!initialBook) {
            inputRef.current?.focus();
        }
    }, [initialBook]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Book[]>([]);
    const [searchingList, setSearchingList] = useState(false);

    // Guarda o item clicado na lista (que já tem author_name, cover_i e number_of_pages_median)
    const [selectedPreview, setSelectedPreview] = useState<Book | null>(initialBook);
    const [bookKeySelected, setBookKeySelected] = useState(initialBook?.key || '');
    const [bookDetails, setBookDetails] = useState<Book | null>(initialBook);

    const [loadingDetails, setLoadingDetails] = useState(false);
    const [errorByKey, setErrorByKey] = useState<string | null>(null);

    // Modo de salvamento: 'read' | 'reading' | 'watchlist'
    const [logMode, setLogMode] = useState<LogMode>(initialMode);

    // Campos de "I read..."
    const todayDate = new Date().toISOString().split('T')[0];
    const [readedOnDate, setReadedOnDate] = useState(todayDate);
    const [readedBefore, setReadedBefore] = useState(false);
    const [readReview, setReadReview] = useState('');
    const [readStarRating, setReadStarRating] = useState<number>(0);
    const [readHeartRating, setReadHeartRating] = useState(false);

    // Campos de "Currently Reading"
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(300);

    const handleBookClick = (bookKey: string) => {
        const id = bookKey.replace('/works/', '');
        window.open(`/book/${id}`, '_blank', 'noopener,noreferrer');
    };

    // 1. Busca por título com Debounce (350ms) e AbortController
    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSearchingList(false);
            return;
        }

        const controller = new AbortController();
        setSearchingList(true);

        const timer = setTimeout(async () => {
            try {
                const fetchedItems = await fetchBooks(trimmed, 'title', controller.signal);
                setSearchResults(fetchedItems);
            } catch (err) {
                console.info(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setSearchingList(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    // 2. Busca detalhes do livro selecionado e mescla com os metadados da busca
    useEffect(() => {
        if (!bookKeySelected) return;

        const controller = new AbortController();
        setLoadingDetails(true);
        setErrorByKey(null);

        const loadData = async () => {
            try {
                const fetchedItem = await fetchBooks(bookKeySelected, 'key', controller.signal);
                if (fetchedItem) {
                    const merged: Book = {
                        ...selectedPreview,
                        ...fetchedItem,
                        author_name: fetchedItem.author_name || selectedPreview?.author_name,
                        covers:
                            fetchedItem.covers?.length
                                ? fetchedItem.covers
                                : selectedPreview?.covers || [],
                        first_publish_year:
                            fetchedItem.first_publish_year ||
                            selectedPreview?.first_publish_year,
                    };
                    setBookDetails(merged);
                    if (selectedPreview?.number_of_pages_median) {
                        setTotalPages(selectedPreview.number_of_pages_median);
                    }
                }
            } catch (err) {
                setErrorByKey(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoadingDetails(false);
            }
        };

        loadData();
        return () => controller.abort();
    }, [bookKeySelected]);

    const handleRegisterBook = async () => {
        if (!bookDetails) return;

        if (logMode === 'read') {
            const bookToSave: Book = {
                ...bookDetails,
                readedOnDate,
                readedBefore,
                readReview,
                readStarRating,
                readHeartRating,
            };
            await saveReadBook({ bookInfo: bookToSave });

            // Se o livro estava em "Currently Reading" ou "Want to Read", remove de lá automaticamente
            const currentReadingList = await marginaliaStorage.get<any[]>(
                'marginaliaCurrentlyReading',
                []
            );
            const filteredReading = currentReadingList.filter(
                (item) => item.key !== bookDetails.key
            );
            if (filteredReading.length !== currentReadingList.length) {
                await marginaliaStorage.set('marginaliaCurrentlyReading', filteredReading);
            }

            const watchlist = await marginaliaStorage.get<Book[]>('marginaliaWantToRead', []);
            const filteredWatchlist = watchlist.filter((item) => item.key !== bookDetails.key);
            if (filteredWatchlist.length !== watchlist.length) {
                await marginaliaStorage.set('marginaliaWantToRead', filteredWatchlist);
            }
        } else if (logMode === 'reading') {
            const currentList = await marginaliaStorage.get<any[]>(
                'marginaliaCurrentlyReading',
                []
            );
            const newEntry = {
                key: bookDetails.key,
                title: bookDetails.title,
                author_name: bookDetails.author_name,
                coverId: bookDetails.covers?.[0],
                currentPage: Math.max(0, Number(currentPage) || 0),
                totalPages: Math.max(1, Number(totalPages) || 300),
                startedAt: todayDate,
            };
            const withoutDuplicate = currentList.filter((item) => item.key !== bookDetails.key);
            await marginaliaStorage.set('marginaliaCurrentlyReading', [
                newEntry,
                ...withoutDuplicate,
            ]);
        } else if (logMode === 'watchlist') {
            const currentWatchlist = await marginaliaStorage.get<Book[]>(
                'marginaliaWantToRead',
                []
            );
            const withoutDuplicate = currentWatchlist.filter(
                (item) => item.key !== bookDetails.key
            );
            await marginaliaStorage.set('marginaliaWantToRead', [
                bookDetails,
                ...withoutDuplicate,
            ]);
        }

        onClose();
    };

    const displayPublishYear =
        bookDetails?.publish_date ||
        bookDetails?.first_publish_year ||
        bookDetails?.first_publish_date ||
        '????';

    return (
        <div className={styles.modalSearchContainer}>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`${styles.modalSearchContent} borderRadius`}
                >
                    {!bookKeySelected ? (
                        <>
                            <div className={styles.headerModalSearch}>
                                <h2 className={styles.messageModalSearch}>Add to your books...</h2>
                                <button
                                    className={`${styles.exitModalSearch} borderRadius cursorPointer`}
                                    onClick={onClose}
                                >
                                    X
                                </button>
                            </div>

                            <div className={styles.bodyModalSearch}>
                                <input
                                    ref={inputRef}
                                    className={`${styles.searchInput} borderRadius`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Search by book title or author..."
                                />

                                <div className={`${styles.searchResultsContainer} borderRadius`}>
                                    {searchingList && (
                                        <div className={styles.searchingHint}>Searching...</div>
                                    )}
                                    {!searchingList &&
                                        searchTerm.trim() &&
                                        searchResults.map((book) => (
                                            <div
                                                className={`${styles.bookItemSearch} cursorPointer`}
                                                key={book.key}
                                                onClick={() => {
                                                    setSelectedPreview(book);
                                                    setBookKeySelected(book.key);
                                                }}
                                            >
                                                <div className={styles.searchItemTitle}>
                                                    {book.title}
                                                    {book.first_publish_year && (
                                                        <span className={styles.searchItemYear}>
                                                            {' '}
                                                            ({book.first_publish_year})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.authorName}>
                                                    {book.author_name?.[0] || 'Unknown author'}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </>
                    ) : loadingDetails ? (
                        <div className="bookPageLoading" style={{ padding: '3rem' }}>
                            <div className="loadingMessage">Loading...</div>
                        </div>
                    ) : !bookDetails ? (
                        <>
                            <div className={styles.headerModalSearch}>
                                <h2 className={styles.messageModalSearch}>Error</h2>
                                <button
                                    className={`${styles.exitModalSearch} borderRadius cursorPointer`}
                                    onClick={onClose}
                                >
                                    X
                                </button>
                            </div>
                            <p style={{ color: 'red' }}>{errorByKey}</p>
                        </>
                    ) : (
                        <>
                            <div className={styles.headerModalSearch}>
                                <div className={styles.headerLeftActions}>
                                    {!initialBook && (
                                        <button
                                            className={`${styles.backButton} borderRadius cursorPointer`}
                                            onClick={() => {
                                                setBookKeySelected('');
                                                setBookDetails(null);
                                            }}
                                        >
                                            ← Back
                                        </button>
                                    )}
                                    <div className={styles.modeSelectorTabs}>
                                        <button
                                            type="button"
                                            className={`${styles.modeTab} ${logMode === 'read' ? styles.activeModeTab : ''} cursorPointer`}
                                            onClick={() => setLogMode('read')}
                                        >
                                            I read...
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.modeTab} ${logMode === 'reading' ? styles.activeModeTab : ''} cursorPointer`}
                                            onClick={() => setLogMode('reading')}
                                        >
                                            Currently Reading
                                        </button>
                                        <button
                                            type="button"
                                            className={`${styles.modeTab} ${logMode === 'watchlist' ? styles.activeModeTab : ''} cursorPointer`}
                                            onClick={() => setLogMode('watchlist')}
                                        >
                                            Want to Read
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className={`${styles.exitModalSearch} borderRadius cursorPointer`}
                                    onClick={onClose}
                                >
                                    X
                                </button>
                            </div>

                            <div className={styles.bodyModalLog}>
                                <div className={styles.bookLogContainer} key={bookDetails.key}>
                                    <div
                                        className={`${styles.bookCoverContainer} cursorPointer`}
                                        onClick={() => handleBookClick(bookDetails.key)}
                                    >
                                        <img
                                            className={`${styles.bookCoverLog} borderRadius shinyBox`}
                                            src={
                                                bookDetails.covers?.[0]
                                                    ? `https://covers.openlibrary.org/b/id/${bookDetails.covers[0]}-L.jpg`
                                                    : '/img-book-template.png'
                                            }
                                            alt={`Cover ${bookDetails.title}`}
                                        />
                                    </div>

                                    <div className={styles.bookReadInfoContainer}>
                                        <div className={styles.bookLogHeader}>
                                            <div className={styles.bookLogTitle}>
                                                {bookDetails.title}
                                            </div>
                                            <div className={styles.bookLogPublishDate}>
                                                ({displayPublishYear})
                                            </div>
                                        </div>

                                        {/* MODO 1: LIVRO LIDO */}
                                        {logMode === 'read' && (
                                            <>
                                                <div className={styles.bookDatesContainer}>
                                                    <div className={styles.bookReadOnContainer}>
                                                        <label className={styles.bookReadOnLabel}>
                                                            <p className={styles.bookDatesText}>
                                                                Read on
                                                            </p>
                                                            <input
                                                                className={`${styles.bookDatesInput} cursorPointer`}
                                                                type="date"
                                                                value={readedOnDate}
                                                                onChange={(e) =>
                                                                    setReadedOnDate(e.target.value)
                                                                }
                                                            />
                                                        </label>
                                                    </div>

                                                    <div className={styles.bookReadedBefore}>
                                                        <label className={styles.bookReadOnLabel}>
                                                            <input
                                                                className={`${styles.bookReadedBeforeCheckBox} cursorPointer`}
                                                                type="checkbox"
                                                                checked={readedBefore}
                                                                onChange={() =>
                                                                    setReadedBefore((prev) => !prev)
                                                                }
                                                            />
                                                            <p className={styles.bookDatesText}>
                                                                I’ve read this before
                                                            </p>
                                                        </label>
                                                    </div>
                                                </div>

                                                <textarea
                                                    className={styles.bookReviewInput}
                                                    placeholder="Add your marginalia / review..."
                                                    value={readReview}
                                                    onChange={(e) => setReadReview(e.target.value)}
                                                />

                                                <div className={styles.bookLogFooter}>
                                                    <div className={styles.bookRating}>
                                                        <StarRate
                                                            setStateChange={setReadStarRating}
                                                        />
                                                        <HeartRate
                                                            setStateChange={setReadHeartRating}
                                                        />
                                                    </div>

                                                    <button
                                                        className={`${styles.bookSaveButton} cursorPointer shinyBox borderRadius`}
                                                        onClick={handleRegisterBook}
                                                    >
                                                        Register
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {/* MODO 2: LENDO AGORA */}
                                        {logMode === 'reading' && (
                                            <div className={styles.alternateModeBox}>
                                                <p className={styles.modeHelperText}>
                                                    Track your reading progress on your Home
                                                    nightstand and Profile.
                                                </p>
                                                <div className={styles.pagesInputsRow}>
                                                    <label className={styles.pageFieldLabel}>
                                                        Current Page
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={currentPage}
                                                            onChange={(e) =>
                                                                setCurrentPage(
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                            className={styles.pageInputModal}
                                                        />
                                                    </label>
                                                    <label className={styles.pageFieldLabel}>
                                                        Total Pages
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={totalPages}
                                                            onChange={(e) =>
                                                                setTotalPages(
                                                                    Number(e.target.value)
                                                                )
                                                            }
                                                            className={styles.pageInputModal}
                                                        />
                                                    </label>
                                                </div>
                                                <div className={styles.bookLogFooter}>
                                                    <span />
                                                    <button
                                                        className={`${styles.bookSaveButton} cursorPointer shinyBox borderRadius`}
                                                        onClick={handleRegisterBook}
                                                    >
                                                        Start Reading
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* MODO 3: QUERO LER (WATCHLIST) */}
                                        {logMode === 'watchlist' && (
                                            <div className={styles.alternateModeBox}>
                                                <p className={styles.modeHelperText}>
                                                    Save "{bookDetails.title}" to your Want to Read
                                                    queue to pick it up later.
                                                </p>
                                                <div className={styles.bookLogFooter}>
                                                    <span />
                                                    <button
                                                        className={`${styles.bookSaveButton} cursorPointer shinyBox borderRadius`}
                                                        onClick={handleRegisterBook}
                                                    >
                                                        + Save to Queue
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}