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
    FaAlignLeft
} from 'react-icons/fa';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoriteSearchModal } from '../components/FavoriteSearchModal.tsx';
import type { Book } from '../models/modelBook';
import { saveReadBook } from '../utils/saveReadBook';

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

export default function Profile() {
    const navigate = useNavigate();

    // Aba ativa no perfil
    const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

    // Estado do Perfil do Usuário
    const [user, setUser] = useState<UserProfile>({
        name: 'Gustavo Nielsen',
        bio: 'Catalogando leituras, anotações de margem e favoritos.',
        avatarUrl: 'img-book-template.png',
        yearlyGoal: 20,
    });
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [profileForm, setProfileForm] = useState<UserProfile>(user);

    // Estados originais dos Favoritos
    const [editModeOn, setEditMode] = useState(false);
    const [editFavoriteMessage, setEditFavoriteMessage] = useState('Edit');
    const [changeFavoriteBook, setChangeFavoriteBook] = useState(false);
    const [favoriteItemID, setFavoriteItemID] = useState('');
    const [favoriteBooks, setFavoriteBooks] = useState<Record<string, any>>({});

    // Estados da Biblioteca e Coleções
    const [libraryBooks, setLibraryBooks] = useState<Book[]>([]);
    const [currentlyReading, setCurrentlyReading] = useState<CurrentlyReadingBook[]>([]);
    const [wantToRead, setWantToRead] = useState<Book[]>([]);
    const [customLists, setCustomLists] = useState<CustomList[]>([]);

    // Estados dos Modais ("Currently Reading" e "Custom Lists")
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

    // Função que carrega todos os dados salvos no localStorage
    const loadProfileData = () => {
        // 1. Favoritos (marginaliaFavorites)
        const savedFavorites = JSON.parse(localStorage.getItem('marginaliaFavorites') ?? '[]');
        const favoritesMap: Record<string, any> = {};
        savedFavorites.forEach((fav: any) => {
            favoritesMap[fav.favoriteID] = fav;
        });
        setFavoriteBooks(favoritesMap);

        // 2. Biblioteca de lidos (marginaliaLibrary)
        const savedLibrary = JSON.parse(localStorage.getItem('marginaliaLibrary') ?? '[]');
        setLibraryBooks(Array.isArray(savedLibrary) ? savedLibrary : []);

        // 3. Dados do Usuário (marginaliaUser)
        const savedUser = localStorage.getItem('marginaliaUser');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setProfileForm(parsedUser);
        }

        // 4. Lendo Agora (marginaliaCurrentlyReading)
        const savedReading = JSON.parse(localStorage.getItem('marginaliaCurrentlyReading') ?? '[]');
        setCurrentlyReading(Array.isArray(savedReading) ? savedReading : []);

        // 5. Want to Read / Watchlist (marginaliaWantToRead)
        const savedWatchlist = JSON.parse(localStorage.getItem('marginaliaWantToRead') ?? '[]');
        setWantToRead(Array.isArray(savedWatchlist) ? savedWatchlist : []);

        // 6. Listas Personalizadas (marginaliaLists)
        const savedLists = JSON.parse(localStorage.getItem('marginaliaLists') ?? '[]');
        setCustomLists(Array.isArray(savedLists) ? savedLists : []);
    };

    useEffect(() => {
        loadProfileData();
    }, []);

    useEffect(() => {
        setEditFavoriteMessage(editModeOn ? 'Cancel' : 'Edit');
    }, [editModeOn]);

    // ==========================================
    // ESTATÍSTICAS E AGRUPAMENTOS (baseados em modelBook.ts)
    // ==========================================
    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        const itemsCount = libraryBooks.length;

        // Livros lidos no ano atual usando readedOnDate
        const readThisYear = libraryBooks.filter((book) => {
            if (!book.readedOnDate) return false;
            const parsedDate = new Date(book.readedOnDate);
            return !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() === currentYear;
        }).length;

        // Quantidade de releituras (readedBefore) e resenhas (readReview)
        const reReadsCount = libraryBooks.filter((b) => b.readedBefore).length;
        const reviewsCount = libraryBooks.filter((b) => b.readReview && b.readReview.trim() !== '').length;

        // Histograma de notas (1 a 5 estrelas, arredondando meias-estrelas para a barra correspondente)
        const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        libraryBooks.forEach((book) => {
            if (book.readStarRating && book.readStarRating > 0) {
                const bucket = Math.min(5, Math.max(1, Math.ceil(book.readStarRating)));
                ratingCounts[bucket] += 1;
            }
        });
        const maxRatingCount = Math.max(...Object.values(ratingCounts), 1);

        return { itemsCount, readThisYear, reReadsCount, reviewsCount, ratingCounts, maxRatingCount };
    }, [libraryBooks, currentYear]);

    // Últimos 4 livros adicionados
    const recentBooks = useMemo(() => {
        return [...libraryBooks].reverse().slice(0, 4);
    }, [libraryBooks]);

    // Diário agrupado por Mês/Ano a partir de readedOnDate
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
                ? parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
                : 'UNDATED';

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push({ ...book, _dateObj: isValidDate ? parsed : null });
        });

        return groups;
    }, [libraryBooks]);

    // ==========================================
    // HELPERS DE CAPA, NAVEGAÇÃO E ÍCONES
    // ==========================================
    const getBookCoverUrl = (book: any): string => {
        if (!book) return 'img-book-template.png';

        // Formato salvo no marginaliaFavorites (coverId) ou no modelBook.ts (covers[0])
        const coverId = book.coverId ?? book.covers?.[0] ?? book.cover_i;
        if (coverId) {
            return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        }
        return 'img-book-template.png';
    };

    const navigateToBook = (book: any) => {
        const rawKey = book?.key || book?.bookId || '';
        if (!rawKey) return;
        // Limpa "/works/" para bater com a rota /book/:id do App.tsx
        const cleanId = String(rawKey).replace('/works/', '');
        if (cleanId) {
            navigate(`/book/${cleanId}`);
        }
    };

    // Renderiza as estrelas (incluindo meia-estrela) e coração exatamente como StarRate.tsx e HeartRate.tsx
    const renderBookRatingRow = (book: Book) => {
        const rating = book.readStarRating ?? 0;
        const heart = book.readHeartRating ?? false;
        const hasReview = Boolean(book.readReview && book.readReview.trim() !== '');

        return (
            <div className={styles.bookMetaRow}>
                <div className={styles.starsContainer}>
                    {[...Array(5)].map((_, index) => {
                        if (rating >= index + 1) {
                            return <FaStar key={index} size={13} color="rgb(205, 177, 50)" />;
                        } else if (rating >= index + 0.5) {
                            return <FaStarHalfAlt key={index} size={13} color="rgb(205, 177, 50)" />;
                        } else {
                            return <FaRegStar key={index} size={13} color="gray" />;
                        }
                    })}
                </div>

                <div className={styles.metaBadges}>
                    {heart && <FaHeart size={12} color="rgba(205, 50, 50, 1)" title="Liked" />}
                    {book.readedBefore && <FaRedo size={11} color="rgb(188, 188, 188)" title="Re-read" />}
                    {hasReview && <FaAlignLeft size={11} color="rgb(188, 188, 188)" title={book.readReview} />}
                </div>
            </div>
        );
    };

    // ==========================================
    // HANDLERS DOS MODAIS E AÇÕES
    // ==========================================
    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setUser(profileForm);
        localStorage.setItem('marginaliaUser', JSON.stringify(profileForm));
        setIsEditProfileOpen(false);
    };

    const handleAddCurrentlyReading = (e: React.FormEvent) => {
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
        setCurrentlyReading(updated);
        localStorage.setItem('marginaliaCurrentlyReading', JSON.stringify(updated));
        setNewReadingForm({ title: '', author: '', totalPages: 300, coverId: '' });
        setIsAddReadingOpen(false);
    };

    const handleUpdatePageProgress = (key: string, page: number) => {
        const updated = currentlyReading.map((item) => {
            if (item.key === key) {
                const validPage = Math.max(0, Math.min(page, item.totalPages));
                return { ...item, currentPage: validPage };
            }
            return item;
        });
        setCurrentlyReading(updated);
        localStorage.setItem('marginaliaCurrentlyReading', JSON.stringify(updated));
    };

    const handleFinishReadingBook = (item: CurrentlyReadingBook) => {
        // Usa o seu utilitário saveReadBook para salvar no marginaliaLibrary
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

        saveReadBook({ bookInfo: finishedBook });

        // Remove da lista "Currently Reading"
        const remaining = currentlyReading.filter((b) => b.key !== item.key);
        setCurrentlyReading(remaining);
        localStorage.setItem('marginaliaCurrentlyReading', JSON.stringify(remaining));

        loadProfileData();
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

    const handleCreateCustomList = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListForm.title.trim()) return;

        const selectedBooks = libraryBooks.filter((b) => newListForm.selectedKeys.includes(b.key));

        const newList: CustomList = {
            id: `list-${Date.now()}`,
            title: newListForm.title.trim(),
            description: newListForm.description.trim(),
            books: selectedBooks,
        };

        const updated = [newList, ...customLists];
        setCustomLists(updated);
        localStorage.setItem('marginaliaLists', JSON.stringify(updated));
        setNewListForm({ title: '', description: '', selectedKeys: [] });
        setIsCreateListOpen(false);
    };

    const handleDeleteCustomList = (id: string) => {
        const updated = customLists.filter((list) => list.id !== id);
        setCustomLists(updated);
        localStorage.setItem('marginaliaLists', JSON.stringify(updated));
    };

    const goalPercentage = Math.min(
        100,
        Math.round((stats.readThisYear / Math.max(1, user.yearlyGoal)) * 100)
    );

    return (
        <>
            <div className="contentBody">
                <Header />

                {/* ==========================================
                    PROFILE HEADER (Grid Row span 2, Col 4 / span 10)
                ========================================== */}
                <header className={styles.profileHeader}>
                    <div className={styles.userInfo}>
                        <div className={styles.userPhotoContainer}>
                            <img
                                className={`${styles.userPhoto} shinyBox`}
                                src={user.avatarUrl || 'img-book-template.png'}
                                alt="User's photo"
                            />
                        </div>

                        <div className={styles.userDetailsBlock}>
                            <div className={styles.userNameWrapper}>
                                <h2 className={styles.userName}>{user.name}</h2>
                                <button
                                    className={`${styles.editProfileButton} cursorPointer`}
                                    onClick={() => {
                                        setProfileForm(user);
                                        setIsEditProfileOpen(true);
                                    }}
                                    title="Edit Profile"
                                >
                                    <FaPen style={{ height: 12 }} />
                                </button>
                            </div>
                            {user.bio && <p className={styles.userBio}>{user.bio}</p>}
                        </div>
                    </div>

                    {/* Contadores do Topo */}
                    <div className={styles.countersGroup}>
                        <figure className={styles.bookReadCountContainer}>
                            <h3 className={styles.bookReadCountNumber}>{stats.itemsCount}</h3>
                            <figcaption className={styles.bookReadCountText}>Books</figcaption>
                        </figure>

                        <figure className={styles.bookReadCountContainer}>
                            <h3 className={styles.bookReadCountNumber}>{stats.readThisYear}</h3>
                            <figcaption className={styles.bookReadCountText}>This Year</figcaption>
                        </figure>

                        <figure className={styles.bookReadCountContainer}>
                            <h3 className={styles.bookReadCountNumber}>
                                {stats.readThisYear}/{user.yearlyGoal}
                            </h3>
                            <figcaption className={styles.bookReadCountText}>{currentYear} Goal</figcaption>
                            <div className={styles.goalBarTrack}>
                                <div
                                    className={styles.goalBarFill}
                                    style={{ width: `${goalPercentage}%` }}
                                />
                            </div>
                        </figure>
                    </div>
                </header>

                {/* ==========================================
                    PROFILE BODY (Grid Row 4 / span 8, Col 4 / span 10)
                ========================================== */}
                <main className={styles.profileBody}>
                    {/* Barra de Abas interna ao profileBody para preservar o CSS Grid */}
                    <nav className={styles.profileTabsNav}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTabBtn : ''} cursorPointer`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Profile
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'library' ? styles.activeTabBtn : ''} cursorPointer`}
                            onClick={() => setActiveTab('library')}
                        >
                            Library ({libraryBooks.length})
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'diary' ? styles.activeTabBtn : ''} cursorPointer`}
                            onClick={() => setActiveTab('diary')}
                        >
                            Diary
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'lists' ? styles.activeTabBtn : ''} cursorPointer`}
                            onClick={() => setActiveTab('lists')}
                        >
                            Lists ({customLists.length})
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'watchlist' ? styles.activeTabBtn : ''} cursorPointer`}
                            onClick={() => setActiveTab('watchlist')}
                        >
                            Want to Read ({wantToRead.length})
                        </button>
                    </nav>

                    {/* ==========================================
                        ABA 1: PROFILE (Favoritos + Recentes + Lendo Agora + Notas)
                    ========================================== */}
                    {activeTab === 'profile' && (
                        <>
                            {/* Seção Original: Favorite Books */}
                            <div className={styles.profileListContainer}>
                                <div className={styles.bookListHeader}>
                                    <h3 className={styles.listTitle}>Favorite Books</h3>
                                    <button
                                        className={`${styles.listEditButton} cursorPointer`}
                                        onClick={() => setEditMode((prev) => !prev)}
                                    >
                                        {editFavoriteMessage}
                                    </button>
                                </div>

                                <ol className={styles.bookListBody}>
                                    {favoriteSlots.map((slotId) => {
                                        const savedBook = favoriteBooks[slotId];
                                        const coverUrl = getBookCoverUrl(savedBook);

                                        return (
                                            <li
                                                key={slotId}
                                                className={`${styles.bookItem} borderRadius ${!editModeOn && savedBook ? 'cursorPointer' : ''}`}
                                                onClick={() => {
                                                    if (!editModeOn && savedBook) navigateToBook(savedBook);
                                                }}
                                            >
                                                <img
                                                    className={styles.bookItemCover}
                                                    src={coverUrl}
                                                    alt="Favorite book cover"
                                                />
                                                {editModeOn && (
                                                    <div
                                                        className={`${styles.bookItemEditBanner} shinyBox borderRadius`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setChangeFavoriteBook(true);
                                                            setFavoriteItemID(slotId);
                                                            setEditMode(false);
                                                        }}
                                                    >
                                                        <FaPlus className={`${styles.bookItemEditBannerPlus} cursorPointer`} />
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>

                            {/* Seção: Recent Activity (Últimos 4 do marginaliaLibrary) */}
                            <div className={styles.profileListContainer}>
                                <div className={styles.bookListHeader}>
                                    <h3 className={styles.listTitle}>Recent Activity</h3>
                                    <button
                                        className={`${styles.listEditButton} cursorPointer`}
                                        onClick={() => setActiveTab('diary')}
                                    >
                                        More
                                    </button>
                                </div>

                                {recentBooks.length === 0 ? (
                                    <p className={styles.emptyNotice}>
                                        No books logged yet. Search for a book to log your first reading!
                                    </p>
                                ) : (
                                    <ol className={styles.bookListBody}>
                                        {recentBooks.map((book, idx) => (
                                            <li
                                                key={`${book.key}-${idx}`}
                                                className={`${styles.bookSlotWithRating} cursorPointer`}
                                                onClick={() => navigateToBook(book)}
                                            >
                                                <div className={`${styles.bookItem} borderRadius`}>
                                                    <img
                                                        className={styles.bookItemCover}
                                                        src={getBookCoverUrl(book)}
                                                        alt={book.title}
                                                    />
                                                </div>
                                                {renderBookRatingRow(book)}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>

                            {/* Seção Dupla: Currently Reading + Ratings Histogram */}
                            <div className={styles.splitSection}>
                                {/* Lendo Agora */}
                                <div className={styles.profileListContainer}>
                                    <div className={styles.bookListHeader}>
                                        <h3 className={styles.listTitle}>
                                            <FaBookOpen style={{ marginRight: 8 }} />
                                            Currently Reading
                                        </h3>
                                        <button
                                            className={`${styles.listEditButton} cursorPointer`}
                                            onClick={() => setIsAddReadingOpen(true)}
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    {currentlyReading.length === 0 ? (
                                        <p className={styles.emptyNotice}>
                                            No active reading right now.
                                        </p>
                                    ) : (
                                        <div className={styles.readingCardsList}>
                                            {currentlyReading.map((item) => {
                                                const pct = Math.round(
                                                    (item.currentPage / item.totalPages) * 100
                                                );
                                                return (
                                                    <div key={item.key} className={styles.readingCard}>
                                                        <img
                                                            src={getBookCoverUrl(item)}
                                                            alt={item.title}
                                                            className={styles.readingCoverSmall}
                                                        />
                                                        <div className={styles.readingDetails}>
                                                            <h4 className={styles.readingTitle}>{item.title}</h4>
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
                                                        <button
                                                            className={`${styles.finishBookButton} cursorPointer`}
                                                            onClick={() => handleFinishReadingBook(item)}
                                                            title="Finish & Move to Library"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Distribuição de Notas (Ratings Histogram) */}
                                <div className={styles.profileListContainer}>
                                    <div className={styles.bookListHeader}>
                                        <h3 className={styles.listTitle}>Ratings</h3>
                                        <span className={styles.listEditButton}>
                                            {stats.reviewsCount} reviews · {stats.reReadsCount} re-reads
                                        </span>
                                    </div>

                                    <div className={styles.histogramBox}>
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const count = stats.ratingCounts[star];
                                            const heightPct = Math.max(
                                                6,
                                                Math.round((count / stats.maxRatingCount) * 100)
                                            );
                                            return (
                                                <div key={star} className={styles.histogramCol}>
                                                    <span className={styles.histogramValue}>{count}</span>
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
                                </div>
                            </div>
                        </>
                    )}

                    {/* ==========================================
                        ABA 2: LIBRARY (Todos os livros lidos)
                    ========================================== */}
                    {activeTab === 'library' && (
                        <div className={styles.profileListContainer}>
                            <div className={styles.bookListHeader}>
                                <h3 className={styles.listTitle}>All Logged Books</h3>
                            </div>

                            {libraryBooks.length === 0 ? (
                                <p className={styles.emptyNotice}>Your library is empty.</p>
                            ) : (
                                <ol className={styles.fullLibraryGrid}>
                                    {[...libraryBooks].reverse().map((book, idx) => (
                                        <li
                                            key={`${book.key}-${idx}`}
                                            className={`${styles.bookSlotWithRating} cursorPointer`}
                                            onClick={() => navigateToBook(book)}
                                        >
                                            <div className={`${styles.gridBookItem} borderRadius`}>
                                                <img
                                                    className={styles.bookItemCover}
                                                    src={getBookCoverUrl(book)}
                                                    alt={book.title}
                                                />
                                            </div>
                                            <span className={styles.gridBookTitle} title={book.title}>
                                                {book.title}
                                            </span>
                                            {renderBookRatingRow(book)}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    )}

                    {/* ==========================================
                        ABA 3: DIARY (Ordem cronológica por readedOnDate)
                    ========================================== */}
                    {activeTab === 'diary' && (
                        <div className={styles.profileListContainer}>
                            <div className={styles.bookListHeader}>
                                <h3 className={styles.listTitle}>Reading Diary</h3>
                            </div>

                            {Object.keys(diaryGroups).length === 0 ? (
                                <p className={styles.emptyNotice}>No reading logs found.</p>
                            ) : (
                                <div className={styles.diaryWrapper}>
                                    {Object.entries(diaryGroups).map(([monthYear, entries]) => (
                                        <div key={monthYear} className={styles.diaryMonthSection}>
                                            <div className={styles.diaryMonthLabel}>{monthYear}</div>
                                            <div className={styles.diaryEntriesList}>
                                                {entries.map((book, idx) => (
                                                    <div
                                                        key={`${book.key}-${idx}`}
                                                        className={`${styles.diaryEntryRow} cursorPointer`}
                                                        onClick={() => navigateToBook(book)}
                                                    >
                                                        <span className={styles.diaryDayNum}>
                                                            {book._dateObj
                                                                ? String(book._dateObj.getDate()).padStart(2, '0')
                                                                : '--'}
                                                        </span>
                                                        <img
                                                            src={getBookCoverUrl(book)}
                                                            alt={book.title}
                                                            className={styles.diaryThumb}
                                                        />
                                                        <div className={styles.diaryTitleColumn}>
                                                            <strong>{book.title}</strong>
                                                            {book.readReview && (
                                                                <p className={styles.diaryReviewSnippet}>
                                                                    "{book.readReview}"
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className={styles.diaryRatingCol}>
                                                            {renderBookRatingRow(book)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ==========================================
                        ABA 4: LISTS (Listas personalizadas)
                    ========================================== */}
                    {activeTab === 'lists' && (
                        <div className={styles.profileListContainer}>
                            <div className={styles.bookListHeader}>
                                <h3 className={styles.listTitle}>Personalized Lists</h3>
                                <button
                                    className={`${styles.listEditButton} cursorPointer`}
                                    onClick={() => setIsCreateListOpen(true)}
                                >
                                    + New List
                                </button>
                            </div>

                            {customLists.length === 0 ? (
                                <p className={styles.emptyNotice}>
                                    You haven't created any custom lists yet.
                                </p>
                            ) : (
                                <div className={styles.customListsGrid}>
                                    {customLists.map((list) => (
                                        <div key={list.id} className={styles.customListCard}>
                                            <div className={styles.stackedCoversPreview}>
                                                {(list.books.length > 0
                                                    ? list.books.slice(0, 4)
                                                    : [null, null, null]
                                                ).map((b, index) => (
                                                    <img
                                                        key={index}
                                                        src={getBookCoverUrl(b)}
                                                        alt="List preview"
                                                        className={styles.stackedCoverImg}
                                                        style={{
                                                            left: `${index * 20}px`,
                                                            zIndex: 10 - index,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <div className={styles.customListMeta}>
                                                <div className={styles.customListTitleRow}>
                                                    <h4>{list.title}</h4>
                                                    <button
                                                        className={`${styles.listEditButton} cursorPointer`}
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
                        </div>
                    )}

                    {/* ==========================================
                        ABA 5: WANT TO READ (Watchlist / TBR)
                    ========================================== */}
                    {activeTab === 'watchlist' && (
                        <div className={styles.profileListContainer}>
                            <div className={styles.bookListHeader}>
                                <h3 className={styles.listTitle}>Want to Read</h3>
                            </div>

                            {wantToRead.length === 0 ? (
                                <p className={styles.emptyNotice}>
                                    No books in your Want to Read list yet.
                                </p>
                            ) : (
                                <ol className={styles.fullLibraryGrid}>
                                    {wantToRead.map((book, idx) => (
                                        <li
                                            key={`${book.key}-${idx}`}
                                            className={`${styles.bookSlotWithRating} cursorPointer`}
                                            onClick={() => navigateToBook(book)}
                                        >
                                            <div className={`${styles.gridBookItem} borderRadius`}>
                                                <img
                                                    className={styles.bookItemCover}
                                                    src={getBookCoverUrl(book)}
                                                    alt={book.title}
                                                />
                                            </div>
                                            <span className={styles.gridBookTitle}>{book.title}</span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    )}
                </main>

                {/* ==========================================
                    MODAIS
                ========================================== */}
                {changeFavoriteBook && (
                    <FavoriteSearchModal
                        onClose={() => {
                            setChangeFavoriteBook(false);
                            loadProfileData();
                        }}
                        favoriteID={favoriteItemID}
                    />
                )}

                {/* Modal: Editar Perfil */}
                {isEditProfileOpen && (
                    <div className={styles.modalBackdrop}>
                        <div className={`${styles.modalContainer} borderRadius`}>
                            <div className={styles.modalTopRow}>
                                <h3>Edit Profile</h3>
                                <button
                                    className={`${styles.listEditButton} cursorPointer`}
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
                                <button type="submit" className={`${styles.modalSubmitBtn} cursorPointer`}>
                                    Save Profile
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Adicionar Lendo Agora */}
                {isAddReadingOpen && (
                    <div className={styles.modalBackdrop}>
                        <div className={`${styles.modalContainer} borderRadius`}>
                            <div className={styles.modalTopRow}>
                                <h3>Currently Reading</h3>
                                <button
                                    className={`${styles.listEditButton} cursorPointer`}
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
                                            setNewReadingForm({ ...newReadingForm, title: e.target.value })
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
                                            setNewReadingForm({ ...newReadingForm, author: e.target.value })
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
                                <button type="submit" className={`${styles.modalSubmitBtn} cursorPointer`}>
                                    Add Book
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Criar Lista Personalizada */}
                {isCreateListOpen && (
                    <div className={styles.modalBackdrop}>
                        <div className={`${styles.modalContainer} borderRadius`}>
                            <div className={styles.modalTopRow}>
                                <h3>Create New List</h3>
                                <button
                                    className={`${styles.listEditButton} cursorPointer`}
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
                                                const isSelected = newListForm.selectedKeys.includes(b.key);
                                                return (
                                                    <div
                                                        key={`${b.key}-${i}`}
                                                        className={`${styles.selectableBookRow} ${isSelected ? styles.selectedBookRow : ''} cursorPointer`}
                                                        onClick={() => toggleBookInNewList(b.key)}
                                                    >
                                                        <span>{b.title}</span>
                                                        {isSelected && <FaCheck size={12} color="rgb(205, 177, 50)" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className={`${styles.modalSubmitBtn} cursorPointer`}>
                                    Create List
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}