import Header from '../components/Header'
import styles from '../assets/styles/Profile.module.css'
import { FaPen } from 'react-icons/fa';
import { FaPlus } from "react-icons/fa";
import { useState, useEffect } from 'react';

import { FavoriteSearchModal } from '../components/FavoriteSearchModal.tsx'


export default function Profile() {

    // Count items in the saved books array
    const itemsCount = (JSON.parse(localStorage.getItem('marginaliaLibrary') ?? '[]')).length;

    // It is on if the user clicks to edit the Favorite Books
    const [editModeOn, setEditMode] = useState(false);

    // This preserves the word that will be showed in the Edit button (Edit/Cancel)
    const [editFavoriteMessage, setEditFavoriteMessage] = useState("Edit");

    // This variable controls when the Search Modal will appear
    const [changeFavoriteBook, setChangeFavoriteBook] = useState(false);

    // This preserves what of the four Favorite Books will be changed 
    const [favoriteItemID, setFavoriteItemID] = useState("");

    // State to store the loaded favorite books
    const [favoriteBooks, setFavoriteBooks] = useState<Record<string, any>>({});

    // Function to load favorites from localStorage 
    const loadFavoriteBooks = () => {
        const savedFavorites = JSON.parse(localStorage.getItem('marginaliaFavorites') ?? '[]');
        
        // Convert array to an object mapped by favoriteID for easy lookup
        const favoritesMap: Record<string, any> = {};
        savedFavorites.forEach((fav: any) => {
            favoritesMap[fav.favoriteID] = fav;
        });
        
        setFavoriteBooks(favoritesMap);
    };

    // Load favorite books when the profile page opens
    useEffect(() => {
        loadFavoriteBooks();
    }, []);

    // Change the edit message
    useEffect(() => {
        setEditFavoriteMessage(editModeOn ? "Cancel" : "Edit");
    }, [editModeOn]);

    const favoriteSlots = ["firstFavorite", "secondFavorite", "thirdFavorite", "fourthFavorite"];

    return(
        <>

        {/* all page */}
        <div className={`contentBody`}>
            {/* call header */}
            <Header />
            
            {/* Profile Header */}
            <header className={`${styles.profileHeader}`}>
                <div className={`${styles.userInfo}`}>
                    {/* User's photo section */}
                    <div className={`${styles.userPhotoContainer}`}>
                        <img className={`${styles.userPhoto} shinyBox`} src="img-book-template.png" alt="User's photo" />
                    </div>

                    {/* Username section */}
                    <h2 className={`${styles.userName}`}>
                        Gustavo Nielsen
                    </h2>

                    <button className={`${styles.editProfileButton} cursorPointer`}>
                        <FaPen style={{height:12}}/>
                    </button>
                </div>
                
                {/* Book counter */}
                <figure className={`${styles.bookReadCountContainer}`}>
                    
                    <h3 className={`${styles.bookReadCountNumber}`}>{itemsCount}</h3>
                    <figcaption className={`${styles.bookReadCountText}`}>Books</figcaption>
                </figure>
            </header>

            <main className={`${styles.profileBody}`}>
                <div className={`${styles.profileListContainer}`}>
                    {/* Favorite Books Section */}
                    <div className={`${styles.bookListHeader}`}>
                        {/* Favorite Books Label */}
                        <h3 className={`${styles.listTitle}`}>Favorite Books</h3>

                        <button className={`${styles.listEditButton} cursorPointer`} onClick={() => setEditMode(prev => !prev)}>{editFavoriteMessage}</button>
                    </div>

                    {/* Favorite Books Banners */}
                    <ol className={`${styles.bookListBody}`}>
                        {favoriteSlots.map((slotId) => {
                            const savedBook = favoriteBooks[slotId];
                            
                            // If the book has a saved coverId, fetch it. Otherwise use template.
                            const coverUrl = savedBook?.coverId 
                                ? `https://covers.openlibrary.org/b/id/${savedBook.coverId}-L.jpg`
                                : "img-book-template.png";

                            return (
                                <li key={slotId} className={`${styles.bookItem} borderRadius`}>
                                    <img className={`${styles.bookItemCover}`} src={coverUrl} alt="Favorite book cover" />
                                    { editModeOn && (
                                        <div className={`${styles.bookItemEditBanner} shinyBox borderRadius`} 
                                             onClick={() => {
                                                 setChangeFavoriteBook(true); 
                                                 setFavoriteItemID(slotId); 
                                                 setEditMode(false)
                                             }}>
                                            <FaPlus className={`${styles.bookItemEditBannerPlus} cursorPointer`} />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </main>
            
            {changeFavoriteBook && (
                <FavoriteSearchModal 
                    onClose={() => {
                        setChangeFavoriteBook(false);
                        loadFavoriteBooks(); // <--- NEW: Reload the covers immediately when the modal closes!
                    }} 
                    favoriteID={favoriteItemID} 
                /> 
            )}
        </div>

        
        </>
    )
}