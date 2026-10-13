// src/pages/Profile.tsx
import Header from '../components/Header';
import styles from '../assets/styles/Profile.module.css';
import {
    FaPen,
    FaPlus,
    FaHeart,
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaBookOpen,
    FaCheck,
    FaTrash,
    FaTimes,
    FaRedo,
    FaAlignLeft,
    FaDownload,
    FaUpload,
} from 'react-icons/fa';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoriteSearchModal } from '../components/FavoriteSearchModal.tsx';
import type { Book } from '../models/modelBook';
import { saveReadBook } from '../utils/saveReadBook';
import { marginaliaStorage, getOpenLibraryCover } from '../utils/storage';

interface UserProfile {
    name: string;
    bio: string;
    avatarUrl: string;
    yearlyGoal: number;
}

interface CurrentlyReadingBook {
    key: string;
    title: string;
    author_name?: string[];
    coverId?: number | string;
    currentPage: number;
    totalPages: number;
    startedAt: string;
}

interface CustomList {
    id: string;
    title: string;
    description: string;
    books: Book[];
}

type ProfileTab = 'profile' | 'library' | 'diary' | 'lists' | 'watchlist';

const DEFAULT_USER: UserProfile = {
    name: 'Gustavo Nielsen',
    bio: 'Catalogando leituras, anotações de margem e favoritos.',
    avatarUrl: '/img-book-template.png',
    yearlyGoal: 20,
};

export default function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

    const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [profileForm, setProfileForm] = useState<UserProfile>(DEFAULT_USER);

    const [editModeOn, setEditMode] = useState(false);
    const [changeFavoriteBook, setChangeFavoriteBook] = useState(false);
    const [favoriteItemID, setFavoriteItemID] = useState('');
    const [favoriteBooks, setFavoriteBooks] = useState<Record<string, any>>({});

    const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
    const [currentlyReading, setCurrentlyReading] = useState<CurrentlyReadingBook[]>([]);
    const [wantToRead, setWantToRead] = useState<Book[]>([]);
    const [customLists, setCustomLists] = useState<CustomList[]>([]);

    const [isAddReadingOpen, setIsAddReadingOpen] = useState(false);
    const [newReadingForm, setNewReadingForm] = useState({
        title: '',
        author: '',
        totalPages: 300,
        coverId: '',
    });

    const [isCreateListOpen, setIsCreateListOpen] = useState(false);
    const [newListForm, setNewListForm] = useState({
        title: '',
        description: '',
        selectedKeys: [] as string[],
    });

    const favoriteSlots = ['firstFavorite', 'secondFavorite', 'thirdFavorite', 'fourthFavorite'];

    const loadProfileData = async () => {
        const [
            savedFavorites,
            savedLibrary,
            savedUser,
            savedReading,
            savedWatchlist,
            savedLists,
        ] = await Promise.all([
            marginaliaStorage.get<any[]>('marginaliaFavorites', []),
            marginaliaStorage.get<Book[]>('marginaliaLibrary', []),
            marginaliaStorage.get<UserProfile>('marginaliaUser', DEFAULT_USER),
            marginaliaStorage.get<CurrentlyReadingBook[]>('marginaliaCurrentlyReading', []),
            marginaliaStorage.get<Book[]>('marginaliaWantToRead', []),
            marginaliaStorage.get<CustomList[]>('marginaliaLists', []),
        ]);

        const favoritesMap: Record<string, any> = {};
        if (Array.isArray(savedFavorites)) {
            savedFavorites.forEach((fav: any) => {
                favoritesMap[fav.favoriteID] = fav;
            });
        }

        setFavoriteBooks(favoritesMap);
        setLibraryBooks(Array.isArray(savedLibrary) ? savedLibrary : []);
        setUser(savedUser);
        setProfileForm(savedUser);
        setCurrentlyReading(Array.isArray(savedReading) ? savedReading : []);
        setWantToRead(Array.isArray(savedWatchlist) ? savedWatchlist : []);
        setCustomLists(Array.isArray(savedLists) ? savedLists : []);
    };

    useEffect(() => {
        loadProfileData();
        const onUpdate = () => loadProfileData();
        window.addEventListener('marginalia-storage-update', onUpdate);
        return () => window.removeEventListener('marginalia-storage-update', onUpdate);
    }, []);

    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        const itemsCount = libraryBooks.length;

        const readThisYear = libraryBooks.filter((book) => {
            if (!book.readedOnDate) return false;
            const parsedDate = new Date(book.readedOnDate);
            return !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() === currentYear;
        }).length;

        const reReadsCount = libraryBooks.filter((b) => b.readedBefore).length;
        const reviewsCount = libraryBooks.filter(
            (b) => b.readReview && b.readReview.trim() !== ''
        ).length;

        const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        libraryBooks.forEach((book) => {
            if (book.readStarRating && book.readStarRating > 0) {
                const bucket = Math.min(5, Math.max(1, Math.ceil(book.readStarRating)));
                ratingCounts[bucket] += 1;
            }
        });
        const maxRatingCount = Math.max(...Object.values(ratingCounts), 1);

        return {
            itemsCount,
            readThisYear,
            reReadsCount,
            reviewsCount,
            ratingCounts,
            maxRatingCount,
        };
    }, [libraryBooks, currentYear]);

    const recentBooks = useMemo(() => {
        return [...libraryBooks].reverse().slice(0, 4);
    }, [libraryBooks]);

    const diaryGroups = useMemo(() => {
        const groups: Record<string, Array<Book & { _dateObj: Date | null }>> = {};

        const sorted = [...libraryBooks].sort((a, b) => {
            const dateA = a.readedOnDate ? new Date(a.readedOnDate).getTime() : 0;
            const dateB = b.readedOnDate ? new Date(b.readedOnDate).getTime() : 0;
            return dateB - dateA;
        });

        sorted.forEach((book) => {
            const parsed = book.readedOnDate ? new Date(book.readedOnDate) : null;
            const isValidDate = parsed && !isNaN(parsed.getTime());

            const groupKey = isValidDate
                ? parsed
                      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      .toUpperCase()
                : 'UNDATED';

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push({ ...book, _dateObj: isValidDate ? parsed : null });
        });

        return groups;
    }, [libraryBooks]);

    const navigateToBook = (book: any) => {
        const rawKey = book?.key || book?.bookId || '';
        if (!rawKey) return;
        const cleanId = String(rawKey).replace('/works/', '');
        if (cleanId) navigate(`/book/${cleanId}`);
    };

    // ==========================================
    // HANDLERS DE EXCLUSÃO
    // ==========================================
    const handleDeleteFavorite = async (e: React.MouseEvent, slotId: string) => {
        e.stopPropagation();
        await marginaliaStorage.removeFavoriteSlot(slotId);
    };

    const handleDeleteLibraryBook = async (e: React.MouseEvent, book: Book) => {
        e.stopPropagation();
        if (window.confirm(`Remove "${book.title}" from your reading history?`)) {
            await marginaliaStorage.removeLibraryBook(book.key, book.readedOnDate);
        }
    };

    const handleDeleteWantToRead = async (e: React.MouseEvent, book: Book) => {
        e.stopPropagation();
        await marginaliaStorage.removeWantToRead(book.key);
    };

    const handleDeleteCurrentlyReading = async (key: string) => {
        await marginaliaStorage.removeCurrentlyReading(key);
    };

    const renderBookRatingRow = (book: Book) => {
        const rating = book.readStarRating ?? 0;
        const heart = book.readHeartRating ?? false;
        const hasReview = Boolean(book.readReview && book.readReview.trim() !== '');

        return (
            <div className={styles.bookMetaRow}>
                <div className={styles.starsContainer}>
                    {[...Array(5)].map((_, index) => {
                        if (rating >= index + 1) {
                            return <FaStar key={index} size={12} color="var(--accent-gold)" />;
                        } else if (rating >= index + 0.5) {
                            return (
                                <FaStarHalfAlt key={index} size={12} color="var(--accent-gold)" />
                            );
                        } else {
                            return <FaRegStar key={index} size={12} color="#456" />;
                        }
                    })}
                </div>

                <div className={styles.metaBadges}>
                    {heart && <FaHeart size={11} color="var(--accent-crimson)" title="Liked" />}
                    {book.readedBefore && (
                        <FaRedo size={10} color="var(--text-secondary)" title="Re-read" />
                    )}
                    {hasReview && (
                        <FaAlignLeft
                            size={10}
                            color="var(--text-secondary)"
                            title={book.readReview}
                        />
                    )}
                </div>
            </div>
        );
    };

    // ==========================================
    // HANDLERS DE CRIAÇÃO / EDIÇÃO
    // ==========================================
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUser(profileForm);
        await marginaliaStorage.set('marginaliaUser', profileForm);
        setIsEditProfileOpen(false);
    };

    const handleAddCurrentlyReading = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReadingForm.title.trim()) return;

        const newItem: CurrentlyReadingBook = {
            key: `reading-${Date.now()}`,
            title: newReadingForm.title.trim(),
            author_name: newReadingForm.author ? [newReadingForm.author.trim()] : undefined,
            coverId: newReadingForm.coverId ? Number(newReadingForm.coverId) : undefined,
            currentPage: 0,
            totalPages: Math.max(1, Number(newReadingForm.totalPages) || 300),
            startedAt: new Date().toISOString().split('T')[0],
        };

        const updated = [newItem, ...currentlyReading];
        await marginaliaStorage.set('marginaliaCurrentlyReading', updated);
        setNewReadingForm({ title: '', author: '', totalPages: 300, coverId: '' });
        setIsAddReadingOpen(false);
    };

    const handleUpdatePageProgress = async (key: string, page: number) => {
        const updated = currentlyReading.map((item) => {
            if (item.key === key) {
                const validPage = Math.max(0, Math.min(page, item.totalPages));
                return { ...item, currentPage: validPage };
            }
            return item;
        });
        await marginaliaStorage.set('marginaliaCurrentlyReading', updated);
    };

    const handleFinishReadingBook = async (item: CurrentlyReadingBook) => {
        const finishedBook: Book = {
            key: item.key,
            title: item.title,
            author_name: item.author_name,
            covers: item.coverId ? [Number(item.coverId)] : undefined,
            readedOnDate: new Date().toISOString().split('T')[0],
            readedBefore: false,
            readReview: '',
            readStarRating: 0,
            readHeartRating: false,
        };

        await saveReadBook({ bookInfo: finishedBook });
        await marginaliaStorage.removeCurrentlyReading(item.key);
    };

    const toggleBookInNewList = (bookKey: string) => {
        setNewListForm((prev) => {
            const exists = prev.selectedKeys.includes(bookKey);
            return {
                ...prev,
                selectedKeys: exists
                    ? prev.selectedKeys.filter((k) => k !== bookKey)
                    : [...prev.selectedKeys, bookKey],
            };
        });
    };

    const handleCreateCustomList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListForm.title.trim()) return;

        const selectedBooks = libraryBooks.filter((b) =>
            newListForm.selectedKeys.includes(b.key)
        );

        const newList: CustomList = {
            id: `list-${Date.now()}`,
            title: newListForm.title.trim(),
            description: newListForm.description.trim(),
            books: selectedBooks,
        };

        const updated = [newList, ...customLists];
        await marginaliaStorage.set('marginaliaLists', updated);
        setNewListForm({ title: '', description: '', selectedKeys: [] });
        setIsCreateListOpen(false);
    };

    const handleDeleteCustomList = async (id: string) => {
        const updated = customLists.filter((list) => list.id !== id);
        await marginaliaStorage.set('marginaliaLists', updated);
    };

    const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const success = await marginaliaStorage.importBackup(file);
        if (success) {
            await loadProfileData();
            alert('Backup restored!');
        } else {
            alert('Could not read backup file.');
        }
        e.target.value = '';
    };

    const goalPercentage = Math.min(
        100,
        Math.round((stats.readThisYear / Math.max(1, user.yearlyGoal)) * 100)
    );

    return (
        <div className="contentBody">
            <Header />

            {/* CABEÇALHO DO PERFIL */}
            <header className={styles.profileHeader}>
                <div className={styles.userInfo}>
                    <div className={styles.userPhotoContainer}>
                        <img
                            className={styles.userPhoto}
                            src={user.avatarUrl || '/img-book-template.png'}
                            alt={user.name}
                        />
                    </div>

                    <div className={styles.userDetailsBlock}>
                        <div className={styles.userNameWrapper}>
                            <h1 className={styles.userName}>{user.name}</h1>
                            <button
                                className={styles.iconActionBtn}
                                onClick={() => {
                                    setProfileForm(user);
                                    setIsEditProfileOpen(true);
                                }}
                                title="Edit Profile"
                            >
                                <FaPen size={12} />
                            </button>
                            <button
                                className={styles.iconActionBtn}
                                onClick={() => marginaliaStorage.exportBackup()}
                                title="Export Backup (.json)"
                            >
                                <FaDownload size={12} />
                            </button>
                            <button
                                className={styles.iconActionBtn}
                                onClick={() => fileInputRef.current?.click()}
                                title="Import Backup (.json)"
                            >
                                <FaUpload size={12} />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={handleImportFileChange}
                            />
                        </div>
                        {user.bio && <p className={styles.userBio}>{user.bio}</p>}
                    </div>
                </div>

                <div className={styles.countersGroup}>
                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>{stats.itemsCount}</span>
                        <span className={styles.statLabel}>Books</span>
                    </div>

                    <div className={styles.statDivider} />

                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>{stats.readThisYear}</span>
                        <span className={styles.statLabel}>This Year</span>
                    </div>

                    <div className={styles.statDivider} />

                    <div className={styles.statBox}>
                        <span className={styles.statNumber}>
                            {stats.readThisYear}/{user.yearlyGoal}
                        </span>
                        <span className={styles.statLabel}>{currentYear} Goal</span>
                        <div className={styles.goalBarTrack}>
                            <div
                                className={styles.goalBarFill}
                                style={{ width: `${goalPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* NAVEGAÇÃO DE ABAS */}
            <nav className={styles.profileTabsNav}>
                {(
                    [
                        ['profile', 'Profile'],
                        ['library', `Library (${libraryBooks.length})`],
                        ['diary', 'Diary'],
                        ['lists', `Lists (${customLists.length})`],
                        ['watchlist', `Want to Read (${wantToRead.length})`],
                    ] as [ProfileTab, string][]
                ).map(([tabKey, label]) => (
                    <button
                        key={tabKey}
                        className={`${styles.tabBtn} ${activeTab === tabKey ? styles.activeTabBtn : ''}`}
                        onClick={() => setActiveTab(tabKey)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            <main className={styles.profileBody}>
                {/* ABA 1: VISÃO GERAL */}
                {activeTab === 'profile' && (
                    <>
                        {/* FAVORITE BOOKS */}
                        <section className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Favorite Books</h2>
                                <button
                                    className={styles.sectionActionBtn}
                                    onClick={() => setEditMode((prev) => !prev)}
                                >
                                    {editModeOn ? 'Done' : 'Edit'}
                                </button>
                            </div>

                            <ol className={styles.fourPostersGrid}>
                                {favoriteSlots.map((slotId) => {
                                    const savedBook = favoriteBooks[slotId];
                                    const coverUrl = getOpenLibraryCover(savedBook, 'M');

                                    return (
                                        <li
                                            key={slotId}
                                            className={`coverFrame ${!editModeOn && savedBook ? 'cursorPointer' : ''}`}
                                            onClick={() => {
                                                if (!editModeOn && savedBook)
                                                    navigateToBook(savedBook);
                                            }}
                                        >
                                            <img
                                                src={coverUrl}
                                                alt={savedBook?.title || 'Favorite slot'}
                                                loading="lazy"
                                                decoding="async"
                                            />

                                            {editModeOn && (
                                                <div
                                                    className={styles.favoriteEditOverlay}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setChangeFavoriteBook(true);
                                                        setFavoriteItemID(slotId);
                                                        setEditMode(false);
                                                    }}
                                                >
                                                    <div className={styles.plusCircle}>
                                                        <FaPlus size={18} />
                                                    </div>
                                                    {savedBook && (
                                                        <button
                                                            type="button"
                                                            className={styles.removeFavoriteBtn}
                                                            onClick={(e) =>
                                                                handleDeleteFavorite(e, slotId)
                                                            }
                                                            title="Remove from Favorites"
                                                        >
                                                            <FaTrash size={12} /> Remove
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>

                        {/* RECENT ACTIVITY */}
                        <section className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Recent Activity</h2>
                                <button
                                    className={styles.sectionActionBtn}
                                    onClick={() => setActiveTab('diary')}
                                >
                                    All Logs →
                                </button>
                            </div>

                            {recentBooks.length === 0 ? (
                                <div className={styles.emptyCard}>
                                    No books logged yet. Click "Log +" in the top bar to record your
                                    first book!
                                </div>
                            ) : (
                                <ol className={styles.fourPostersGrid}>
                                    {recentBooks.map((book, idx) => (
                                        <li
                                            key={`${book.key}-${idx}`}
                                            className={styles.posterCard}
                                            onClick={() => navigateToBook(book)}
                                        >
                                            <div className="coverFrame cursorPointer">
                                                <img
                                                    src={getOpenLibraryCover(book, 'M')}
                                                    alt={book.title}
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                                <button
                                                    type="button"
                                                    className="coverDeleteBtn"
                                                    onClick={(e) =>
                                                        handleDeleteLibraryBook(e, book)
                                                    }
                                                    title="Delete from History"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                            {renderBookRatingRow(book)}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>

                        {/* CURRENTLY READING + RATINGS HISTOGRAM */}
                        <div className={styles.twoColumnsLayout}>
                            <section className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>
                                        <FaBookOpen style={{ marginRight: 8 }} />
                                        Currently Reading
                                    </h2>
                                    <button
                                        className={styles.sectionActionBtn}
                                        onClick={() => setIsAddReadingOpen(true)}
                                    >
                                        + Add
                                    </button>
                                </div>

                                {currentlyReading.length === 0 ? (
                                    <div className={styles.emptyCard}>
                                        No active reading right now.
                                    </div>
                                ) : (
                                    <div className={styles.readingCardsList}>
                                        {currentlyReading.map((item) => {
                                            const pct = Math.round(
                                                (item.currentPage / item.totalPages) * 100
                                            );
                                            return (
                                                <div key={item.key} className={styles.readingCard}>
                                                    <div
                                                        className={`coverFrame ${styles.readingThumbFrame}`}
                                                    >
                                                        <img
                                                            src={getOpenLibraryCover(item, 'M')}
                                                            alt={item.title}
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    </div>
                                                    <div className={styles.readingDetails}>
                                                        <h4 className={styles.readingTitle}>
                                                            {item.title}
                                                        </h4>
                                                        {item.author_name && (
                                                            <span className={styles.readingAuthor}>
                                                                {item.author_name[0]}
                                                            </span>
                                                        )}
                                                        <div className={styles.pageTrackerRow}>
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={item.totalPages}
                                                                value={item.currentPage}
                                                                onChange={(e) =>
                                                                    handleUpdatePageProgress(
                                                                        item.key,
                                                                        Number(e.target.value)
                                                                    )
                                                                }
                                                                className={styles.pageNumberInput}
                                                            />
                                                            <span>
                                                                / {item.totalPages} p. ({pct}%)
                                                            </span>
                                                        </div>
                                                        <div className={styles.goalBarTrack}>
                                                            <div
                                                                className={styles.goalBarFill}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.readingRowActions}>
                                                        <button
                                                            className={styles.finishBookButton}
                                                            onClick={() =>
                                                                handleFinishReadingBook(item)
                                                            }
                                                            title="Finish & Move to Library"
                                                        >
                                                            <FaCheck size={12} />
                                                        </button>
                                                        <button
                                                            className={styles.deleteIconBtn}
                                                            onClick={() =>
                                                                handleDeleteCurrentlyReading(
                                                                    item.key
                                                                )
                                                            }
                                                            title="Remove"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section className={styles.sectionBlock}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Ratings</h2>
                                    <span className={styles.sectionSubtleMeta}>
                                        {stats.reviewsCount} reviews · {stats.reReadsCount} re-reads
                                    </span>
                                </div>

                                <div className={styles.histogramCard}>
                                    {[1, 2, 3, 4, 5].map((star) => {
                                        const count = stats.ratingCounts[star];
                                        const heightPct = Math.max(
                                            6,
                                            Math.round((count / stats.maxRatingCount) * 100)
                                        );
                                        return (
                                            <div key={star} className={styles.histogramCol}>
                                                <span className={styles.histogramValue}>
                                                    {count}
                                                </span>
                                                <div className={styles.histogramBarBg}>
                                                    <div
                                                        className={styles.histogramBarFill}
                                                        style={{ height: `${heightPct}%` }}
                                                    />
                                                </div>
                                                <span className={styles.histogramStarsLabel}>
                                                    {star}★
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    </>
                )}

                {/* ABA 2: LIBRARY COMPLETA */}
                {activeTab === 'library' && (
                    <section className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                Complete Library ({libraryBooks.length})
                            </h2>
                        </div>

                        {libraryBooks.length === 0 ? (
                            <div className={styles.emptyCard}>Your library is empty.</div>
                        ) : (
                            <ol className={styles.fivePostersGrid}>
                                {[...libraryBooks].reverse().map((book, idx) => (
                                    <li
                                        key={`${book.key}-${idx}`}
                                        className={styles.posterCard}
                                        onClick={() => navigateToBook(book)}
                                    >
                                        <div className="coverFrame cursorPointer">
                                            <img
                                                src={getOpenLibraryCover(book, 'M')}
                                                alt={book.title}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <button
                                                type="button"
                                                className="coverDeleteBtn"
                                                onClick={(e) => handleDeleteLibraryBook(e, book)}
                                                title="Delete from Library"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                        <span className={styles.posterTitle} title={book.title}>
                                            {book.title}
                                        </span>
                                        {renderBookRatingRow(book)}
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                )}

                {/* ABA 3: DIARY */}
                {activeTab === 'diary' && (
                    <section className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Reading Diary</h2>
                        </div>

                        {Object.keys(diaryGroups).length === 0 ? (
                            <div className={styles.emptyCard}>No reading logs found.</div>
                        ) : (
                            <div className={styles.diaryWrapper}>
                                {Object.entries(diaryGroups).map(([monthYear, entries]) => (
                                    <div key={monthYear} className={styles.diaryMonthSection}>
                                        <div className={styles.diaryMonthBadge}>{monthYear}</div>
                                        <div className={styles.diaryEntriesList}>
                                            {entries.map((book, idx) => (
                                                <div
                                                    key={`${book.key}-${idx}`}
                                                    className={styles.diaryEntryRow}
                                                    onClick={() => navigateToBook(book)}
                                                >
                                                    <span className={styles.diaryDayNum}>
                                                        {book._dateObj
                                                            ? String(
                                                                  book._dateObj.getDate()
                                                              ).padStart(2, '0')
                                                            : '--'}
                                                    </span>
                                                    <div
                                                        className={`coverFrame ${styles.diaryMiniFrame}`}
                                                    >
                                                        <img
                                                            src={getOpenLibraryCover(book, 'M')}
                                                            alt={book.title}
                                                            loading="lazy"
                                                            decoding="async"
                                                        />
                                                    </div>
                                                    <div className={styles.diaryTitleColumn}>
                                                        <strong>{book.title}</strong>
                                                        {book.readReview && (
                                                            <p
                                                                className={
                                                                    styles.diaryReviewSnippet
                                                                }
                                                            >
                                                                "{book.readReview}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={styles.diaryRatingCol}>
                                                        {renderBookRatingRow(book)}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.deleteIconBtn}
                                                        onClick={(e) =>
                                                            handleDeleteLibraryBook(e, book)
                                                        }
                                                        title="Delete Log"
                                                    >
                                                        <FaTrash size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ABA 4: LISTS */}
                {activeTab === 'lists' && (
                    <section className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Personalized Lists</h2>
                            <button
                                className={styles.sectionActionBtn}
                                onClick={() => setIsCreateListOpen(true)}
                            >
                                + New List
                            </button>
                        </div>

                        {customLists.length === 0 ? (
                            <div className={styles.emptyCard}>
                                You haven't curated any custom lists yet.
                            </div>
                        ) : (
                            <div className={styles.customListsGrid}>
                                {customLists.map((list) => (
                                    <div key={list.id} className={styles.customListCard}>
                                        <div className={styles.stackedCoversPreview}>
                                            {(list.books.length > 0
                                                ? list.books.slice(0, 4)
                                                : [null, null, null]
                                            ).map((b, index) => (
                                                <div
                                                    key={index}
                                                    className={`coverFrame ${styles.stackedCoverFrame}`}
                                                    style={{
                                                        left: `${index * 22}px`,
                                                        zIndex: 10 - index,
                                                    }}
                                                >
                                                    <img
                                                        src={getOpenLibraryCover(b, 'M')}
                                                        alt="List preview"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.customListMeta}>
                                            <div className={styles.customListTitleRow}>
                                                <h4>{list.title}</h4>
                                                <button
                                                    className={styles.deleteIconBtn}
                                                    onClick={() => handleDeleteCustomList(list.id)}
                                                    title="Delete List"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                            {list.description && <p>{list.description}</p>}
                                            <span>{list.books.length} books</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* ABA 5: WANT TO READ */}
                {activeTab === 'watchlist' && (
                    <section className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                Want to Read ({wantToRead.length})
                            </h2>
                        </div>

                        {wantToRead.length === 0 ? (
                            <div className={styles.emptyCard}>
                                No books in your Want to Read queue yet.
                            </div>
                        ) : (
                            <ol className={styles.fivePostersGrid}>
                                {wantToRead.map((book, idx) => (
                                    <li
                                        key={`${book.key}-${idx}`}
                                        className={styles.posterCard}
                                        onClick={() => navigateToBook(book)}
                                    >
                                        <div className="coverFrame cursorPointer">
                                            <img
                                                src={getOpenLibraryCover(book, 'M')}
                                                alt={book.title}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <button
                                                type="button"
                                                className="coverDeleteBtn"
                                                onClick={(e) => handleDeleteWantToRead(e, book)}
                                                title="Remove from Queue"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                        <span className={styles.posterTitle}>{book.title}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                )}
            </main>

            {/* MODAIS */}
            {changeFavoriteBook && (
                <FavoriteSearchModal
                    onClose={async () => {
                        setChangeFavoriteBook(false);
                        const legacyFavs = JSON.parse(
                            localStorage.getItem('marginaliaFavorites') ?? '[]'
                        );
                        await marginaliaStorage.set('marginaliaFavorites', legacyFavs);
                        await loadProfileData();
                    }}
                    favoriteID={favoriteItemID}
                />
            )}

            {isEditProfileOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContainer}>
                        <div className={styles.modalTopRow}>
                            <h3>Edit Profile</h3>
                            <button
                                className={styles.deleteIconBtn}
                                onClick={() => setIsEditProfileOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfile} className={styles.modalForm}>
                            <label>
                                Name
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) =>
                                        setProfileForm({ ...profileForm, name: e.target.value })
                                    }
                                    required
                                />
                            </label>
                            <label>
                                Bio
                                <textarea
                                    rows={2}
                                    value={profileForm.bio}
                                    onChange={(e) =>
                                        setProfileForm({ ...profileForm, bio: e.target.value })
                                    }
                                />
                            </label>
                            <label>
                                Avatar URL
                                <input
                                    type="text"
                                    value={profileForm.avatarUrl}
                                    onChange={(e) =>
                                        setProfileForm({
                                            ...profileForm,
                                            avatarUrl: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label>
                                {currentYear} Reading Goal
                                <input
                                    type="number"
                                    min={1}
                                    value={profileForm.yearlyGoal}
                                    onChange={(e) =>
                                        setProfileForm({
                                            ...profileForm,
                                            yearlyGoal: Number(e.target.value),
                                        })
                                    }
                                />
                            </label>
                            <button type="submit" className={styles.modalSubmitBtn}>
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isAddReadingOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContainer}>
                        <div className={styles.modalTopRow}>
                            <h3>Currently Reading</h3>
                            <button
                                className={styles.deleteIconBtn}
                                onClick={() => setIsAddReadingOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleAddCurrentlyReading} className={styles.modalForm}>
                            <label>
                                Title
                                <input
                                    type="text"
                                    value={newReadingForm.title}
                                    onChange={(e) =>
                                        setNewReadingForm({
                                            ...newReadingForm,
                                            title: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </label>
                            <label>
                                Author
                                <input
                                    type="text"
                                    value={newReadingForm.author}
                                    onChange={(e) =>
                                        setNewReadingForm({
                                            ...newReadingForm,
                                            author: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label>
                                Total Pages
                                <input
                                    type="number"
                                    min={1}
                                    value={newReadingForm.totalPages}
                                    onChange={(e) =>
                                        setNewReadingForm({
                                            ...newReadingForm,
                                            totalPages: Number(e.target.value),
                                        })
                                    }
                                />
                            </label>
                            <label>
                                OpenLibrary Cover ID (optional)
                                <input
                                    type="text"
                                    placeholder="Ex: 8259447"
                                    value={newReadingForm.coverId}
                                    onChange={(e) =>
                                        setNewReadingForm({
                                            ...newReadingForm,
                                            coverId: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <button type="submit" className={styles.modalSubmitBtn}>
                                Add Book
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isCreateListOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContainer}>
                        <div className={styles.modalTopRow}>
                            <h3>Create New List</h3>
                            <button
                                className={styles.deleteIconBtn}
                                onClick={() => setIsCreateListOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCustomList} className={styles.modalForm}>
                            <label>
                                List Name
                                <input
                                    type="text"
                                    value={newListForm.title}
                                    onChange={(e) =>
                                        setNewListForm({ ...newListForm, title: e.target.value })
                                    }
                                    required
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    rows={2}
                                    value={newListForm.description}
                                    onChange={(e) =>
                                        setNewListForm({
                                            ...newListForm,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </label>

                            {libraryBooks.length > 0 && (
                                <div className={styles.bookSelectorBox}>
                                    <span>Select books from your library:</span>
                                    <div className={styles.bookSelectorList}>
                                        {libraryBooks.map((b, i) => {
                                            const isSelected = newListForm.selectedKeys.includes(
                                                b.key
                                            );
                                            return (
                                                <div
                                                    key={`${b.key}-${i}`}
                                                    className={`${styles.selectableBookRow} ${isSelected ? styles.selectedBookRow : ''}`}
                                                    onClick={() => toggleBookInNewList(b.key)}
                                                >
                                                    <span>{b.title}</span>
                                                    {isSelected && (
                                                        <FaCheck
                                                            size={12}
                                                            color="var(--accent-gold)"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className={styles.modalSubmitBtn}>
                                Create List
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}