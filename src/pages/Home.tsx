// src/pages/Home.tsx
import { SearchModal } from '../components/SearchModal';
import Header from '../components/Header';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Home.css';
import { marginaliaStorage, getOpenLibraryCover } from '../utils/storage';
import type { Book } from '../models/modelBook';
import {
    FaBookOpen,
    FaPlus,
    FaCheck,
    FaRandom,
    FaQuoteLeft,
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaHeart,
    FaTrash,
} from 'react-icons/fa';

export default function Home() {
    const navigate = useNavigate();

    const [modalConfig, setModalConfig] = useState<{
        open: boolean;
        book: Book | null;
        mode: 'read' | 'reading' | 'watchlist';
    }>({
        open: false,
        book: null,
        mode: 'read',
    });

    const [library, setLibrary] = useState<Book[]>([]);
    const [currentlyReading, setCurrentlyReading] = useState<any[]>([]);
    const [wantToRead, setWantToRead] = useState<Book[]>([]);
    const [userProfile, setUserProfile] = useState({ name: 'Reader', yearlyGoal: 20 });

    const [pickedRandomBook, setPickedRandomBook] = useState<Book | null>(null);
    const [highlightIndex, setHighlightIndex] = useState(0);

    const loadDashboardData = async () => {
        const [savedLib, savedReading, savedWatchlist, savedUser] = await Promise.all([
            marginaliaStorage.get<Book[]>('marginaliaLibrary', []),
            marginaliaStorage.get<any[]>('marginaliaCurrentlyReading', []),
            marginaliaStorage.get<Book[]>('marginaliaWantToRead', []),
            marginaliaStorage.get<any>('marginaliaUser', {
                name: 'Gustavo Nielsen',
                yearlyGoal: 20,
            }),
        ]);

        setLibrary(Array.isArray(savedLib) ? savedLib : []);
        setCurrentlyReading(Array.isArray(savedReading) ? savedReading : []);
        setWantToRead(Array.isArray(savedWatchlist) ? savedWatchlist : []);
        if (savedUser) setUserProfile(savedUser);
    };

    useEffect(() => {
        loadDashboardData();
        const handleStorageUpdate = () => loadDashboardData();
        window.addEventListener('marginalia-storage-update', handleStorageUpdate);
        return () => window.removeEventListener('marginalia-storage-update', handleStorageUpdate);
    }, []);

    const currentYear = new Date().getFullYear();

    const booksThisYear = useMemo(() => {
        return library.filter((b) => {
            if (!b.readedOnDate) return false;
            return new Date(b.readedOnDate).getFullYear() === currentYear;
        }).length;
    }, [library, currentYear]);

    const booksWithReviews = useMemo(() => {
        return library.filter((b) => b.readReview && b.readReview.trim().length > 0);
    }, [library]);

    const recentLogs = useMemo(() => {
        return [...library].reverse().slice(0, 4);
    }, [library]);

    const navigateToBook = (book: any) => {
        const rawKey = book?.key || '';
        const cleanId = String(rawKey).replace('/works/', '');
        if (cleanId) navigate(`/book/${cleanId}`);
    };

    const updateReadingPage = async (key: string, nextValue: number) => {
        const updated = currentlyReading.map((item) => {
            if (item.key === key) {
                const clamped = Math.max(0, Math.min(nextValue, item.totalPages || 300));
                return { ...item, currentPage: clamped };
            }
            return item;
        });
        await marginaliaStorage.set('marginaliaCurrentlyReading', updated);
    };

    const handleDeleteReading = async (key: string) => {
        await marginaliaStorage.removeCurrentlyReading(key);
    };

    const handleDeleteLog = async (e: React.MouseEvent, book: Book) => {
        e.stopPropagation();
        if (window.confirm(`Remove "${book.title}" from your reading history?`)) {
            await marginaliaStorage.removeLibraryBook(book.key, book.readedOnDate);
        }
    };

    const handleDeleteFromQueue = async (e: React.MouseEvent, book: Book) => {
        e.stopPropagation();
        await marginaliaStorage.removeWantToRead(book.key);
    };

    const openFinishBookModal = (readingItem: any) => {
        const bookObj: Book = {
            key: readingItem.key,
            title: readingItem.title,
            author_name: readingItem.author_name,
            covers: readingItem.coverId ? [Number(readingItem.coverId)] : [],
        };
        setModalConfig({ open: true, book: bookObj, mode: 'read' });
    };

    const startReadingFromQueue = async (book: Book) => {
        const newEntry = {
            key: book.key,
            title: book.title,
            author_name: book.author_name,
            coverId: book.covers?.[0] ?? book.cover_i,
            currentPage: 0,
            totalPages: book.number_of_pages_median || 300,
            startedAt: new Date().toISOString().split('T')[0],
        };

        const updatedReading = [
            newEntry,
            ...currentlyReading.filter((i) => i.key !== book.key),
        ];
        const updatedWatchlist = wantToRead.filter((i) => i.key !== book.key);

        await marginaliaStorage.set('marginaliaCurrentlyReading', updatedReading);
        await marginaliaStorage.set('marginaliaWantToRead', updatedWatchlist);
        setPickedRandomBook(null);
    };

    const pickRandomNextBook = () => {
        if (wantToRead.length === 0) return;
        const randomIdx = Math.floor(Math.random() * wantToRead.length);
        setPickedRandomBook(wantToRead[randomIdx]);
    };

    const renderStars = (rating = 0, heart = false) => (
        <div className="homeBookStarsRow">
            <div className="homeStars">
                {[...Array(5)].map((_, idx) => {
                    if (rating >= idx + 1)
                        return <FaStar key={idx} size={12} color="var(--accent-gold)" />;
                    if (rating >= idx + 0.5)
                        return <FaStarHalfAlt key={idx} size={12} color="var(--accent-gold)" />;
                    return <FaRegStar key={idx} size={12} color="#456" />;
                })}
            </div>
            {heart && <FaHeart size={11} color="var(--accent-crimson)" />}
        </div>
    );

    const goalPct = Math.min(
        100,
        Math.round((booksThisYear / Math.max(1, userProfile.yearlyGoal)) * 100)
    );
    const currentHighlight =
        booksWithReviews.length > 0
            ? booksWithReviews[highlightIndex % booksWithReviews.length]
            : null;

    return (
        <div className="contentBody">
            <Header />

            <main id="homeMainContent">
                {/* SAUDAÇÃO + PROGRESSO ANUAL */}
                <section className="homeWelcomeBar">
                    <div>
                        <h1 className="homeWelcomeTitle">
                            Welcome back, {userProfile.name.split(' ')[0]}.
                        </h1>
                        <p className="homeWelcomeSub">
                            You have logged <strong>{library.length}</strong> books in total and{' '}
                            <strong>{booksThisYear}</strong> in {currentYear}.
                        </p>
                    </div>

                    <div className="homeGoalSummary">
                        <div className="homeGoalLabels">
                            <span>{currentYear} Reading Goal</span>
                            <strong>
                                {booksThisYear} / {userProfile.yearlyGoal} ({goalPct}%)
                            </strong>
                        </div>
                        <div className="homeProgressTrack">
                            <div
                                className="homeProgressFill"
                                style={{ width: `${goalPct}%` }}
                            />
                        </div>
                    </div>
                </section>

                {/* SEÇÃO 1: CURRENTLY READING */}
                <section id="readingBooksContainer" className="homeSectionBlock">
                    <div className="homeSectionHeader">
                        <h2 className="homeSectionTitle">
                            <FaBookOpen style={{ marginRight: '0.5rem' }} />
                            Currently Reading
                        </h2>
                        <button
                            className="homeActionLink cursorPointer"
                            onClick={() =>
                                setModalConfig({ open: true, book: null, mode: 'reading' })
                            }
                        >
                            <FaPlus size={11} /> Add Book
                        </button>
                    </div>

                    {currentlyReading.length === 0 ? (
                        <div className="homeEmptyBox">
                            <p>Your nightstand is empty right now.</p>
                            <button
                                className="homeGoldBtn cursorPointer"
                                onClick={() =>
                                    setModalConfig({ open: true, book: null, mode: 'reading' })
                                }
                            >
                                Start Reading a Book
                            </button>
                        </div>
                    ) : (
                        <div className="readingGridHome">
                            {currentlyReading.map((item) => {
                                const pct = Math.round(
                                    (item.currentPage / Math.max(1, item.totalPages)) * 100
                                );
                                return (
                                    <div key={item.key} className="readingNightstandCard">
                                        <div
                                            className="coverFrame nightstandCoverFrame cursorPointer"
                                            onClick={() => navigateToBook(item)}
                                        >
                                            <img
                                                src={getOpenLibraryCover(item, 'M')}
                                                alt={item.title}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                        <div className="nightstandInfo">
                                            <div className="nightstandTopRow">
                                                <div>
                                                    <h3
                                                        className="nightstandBookTitle cursorPointer"
                                                        onClick={() => navigateToBook(item)}
                                                    >
                                                        {item.title}
                                                    </h3>
                                                    <p className="nightstandBookAuthor">
                                                        {item.author_name?.[0] || 'Unknown author'}
                                                    </p>
                                                </div>
                                                <button
                                                    className="nightstandDeleteBtn cursorPointer"
                                                    onClick={() => handleDeleteReading(item.key)}
                                                    title="Remove from Currently Reading"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>

                                            <div className="nightstandProgressRow">
                                                <span>
                                                    Page <strong>{item.currentPage}</strong> of{' '}
                                                    {item.totalPages} ({pct}%)
                                                </span>
                                                <div className="quickPageButtons">
                                                    <button
                                                        className="quickPageBtn cursorPointer"
                                                        onClick={() =>
                                                            updateReadingPage(
                                                                item.key,
                                                                item.currentPage + 1
                                                            )
                                                        }
                                                    >
                                                        +1p
                                                    </button>
                                                    <button
                                                        className="quickPageBtn cursorPointer"
                                                        onClick={() =>
                                                            updateReadingPage(
                                                                item.key,
                                                                item.currentPage + 10
                                                            )
                                                        }
                                                    >
                                                        +10p
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="homeProgressTrack">
                                                <div
                                                    className="homeProgressFill"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>

                                            <div className="nightstandCardFooter">
                                                <button
                                                    className="homeFinishBtn cursorPointer"
                                                    onClick={() => openFinishBookModal(item)}
                                                >
                                                    <FaCheck size={11} /> Finish & Review
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* SEÇÃO 2: ATIVIDADE RECENTE + MARGINALIA HIGHLIGHTS */}
                <div className="homeTwoColumns">
                    <section className="homeSectionBlock">
                        <div className="homeSectionHeader">
                            <h2 className="homeSectionTitle">Recently Logged</h2>
                            <button
                                className="homeActionLink cursorPointer"
                                onClick={() => navigate('/profile')}
                            >
                                View Library →
                            </button>
                        </div>

                        {recentLogs.length === 0 ? (
                            <div className="homeEmptyBox">No books logged yet.</div>
                        ) : (
                            <div className="homeRecentCoversRow">
                                {recentLogs.map((book, i) => (
                                    <div
                                        key={`${book.key}-${i}`}
                                        className="homeCoverSlot cursorPointer"
                                        onClick={() => navigateToBook(book)}
                                    >
                                        <div className="coverFrame">
                                            <img
                                                src={getOpenLibraryCover(book, 'M')}
                                                alt={book.title}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <button
                                                type="button"
                                                className="coverDeleteBtn"
                                                onClick={(e) => handleDeleteLog(e, book)}
                                                title="Delete from History"
                                            >
                                                <FaTrash size={11} />
                                            </button>
                                        </div>
                                        {renderStars(book.readStarRating, book.readHeartRating)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="homeSectionBlock">
                        <div className="homeSectionHeader">
                            <h2 className="homeSectionTitle">
                                <FaQuoteLeft size={12} style={{ marginRight: '0.5rem' }} />
                                From Your Marginalia
                            </h2>
                            {booksWithReviews.length > 1 && (
                                <button
                                    className="homeActionLink cursorPointer"
                                    onClick={() => setHighlightIndex((prev) => prev + 1)}
                                >
                                    Next Note ↻
                                </button>
                            )}
                        </div>

                        {!currentHighlight ? (
                            <div className="homeEmptyBox">
                                Write a review when logging a book to see your personal notes
                                highlighted here.
                            </div>
                        ) : (
                            <div
                                className="marginaliaQuoteCard cursorPointer"
                                onClick={() => navigateToBook(currentHighlight)}
                            >
                                <div className="coverFrame quoteMiniCoverFrame">
                                    <img
                                        src={getOpenLibraryCover(currentHighlight, 'M')}
                                        alt={currentHighlight.title}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="quoteTextColumn">
                                    <p className="quoteReviewText">
                                        "{currentHighlight.readReview}"
                                    </p>
                                    <div className="quoteBookMeta">
                                        <strong>{currentHighlight.title}</strong>
                                        {currentHighlight.readedOnDate && (
                                            <span> · {currentHighlight.readedOnDate}</span>
                                        )}
                                    </div>
                                    {renderStars(
                                        currentHighlight.readStarRating,
                                        currentHighlight.readHeartRating
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* SEÇÃO 3: UP NEXT (Want to Read) */}
                <section className="homeSectionBlock">
                    <div className="homeSectionHeader">
                        <h2 className="homeSectionTitle">
                            Up Next · Want to Read ({wantToRead.length})
                        </h2>
                        <div className="homeHeaderBtnGroup">
                            {wantToRead.length > 1 && (
                                <button
                                    className="homeGoldOutlineBtn cursorPointer"
                                    onClick={pickRandomNextBook}
                                >
                                    <FaRandom size={11} /> Pick a Random Book
                                </button>
                            )}
                            <button
                                className="homeActionLink cursorPointer"
                                onClick={() =>
                                    setModalConfig({ open: true, book: null, mode: 'watchlist' })
                                }
                            >
                                + Add to Queue
                            </button>
                        </div>
                    </div>

                    {pickedRandomBook && (
                        <div className="randomPickBanner">
                            <div>
                                <span>🎲 Tonight's Random Pick: </span>
                                <strong>{pickedRandomBook.title}</strong>
                            </div>
                            <div className="randomPickActions">
                                <button
                                    className="homeGoldBtn cursorPointer"
                                    onClick={() => startReadingFromQueue(pickedRandomBook)}
                                >
                                    Start Reading Now
                                </button>
                                <button
                                    className="homeActionLink cursorPointer"
                                    onClick={() => setPickedRandomBook(null)}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {wantToRead.length === 0 ? (
                        <div className="homeEmptyBox">
                            Your reading queue is empty. Add books you want to read next!
                        </div>
                    ) : (
                        <div className="upNextQueueRow">
                            {wantToRead.slice(0, 6).map((book, idx) => (
                                <div key={`${book.key}-${idx}`} className="upNextCard">
                                    <div
                                        className="coverFrame cursorPointer"
                                        onClick={() => navigateToBook(book)}
                                    >
                                        <img
                                            src={getOpenLibraryCover(book, 'M')}
                                            alt={book.title}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <button
                                            type="button"
                                            className="coverDeleteBtn"
                                            onClick={(e) => handleDeleteFromQueue(e, book)}
                                            title="Remove from Queue"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    </div>
                                    <button
                                        className="upNextStartBtn cursorPointer"
                                        onClick={() => startReadingFromQueue(book)}
                                    >
                                        Start Reading
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {modalConfig.open && (
                    <SearchModal
                        initialBook={modalConfig.book}
                        initialMode={modalConfig.mode}
                        onClose={() =>
                            setModalConfig({ open: false, book: null, mode: 'read' })
                        }
                    />
                )}
            </main>
        </div>
    );
}