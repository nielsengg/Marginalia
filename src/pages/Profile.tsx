import Header from '../components/Header'
import styles from '../assets/styles/Profile.module.css'
import { FaPen } from 'react-icons/fa';
import { FaPlus } from "react-icons/fa";
import { useState, useEffect } from 'react';

import { FavoriteSearchModal } from '../components/FavoriteSearchModal.tsx'


export default function Profile() {

    // Count items in the saved books array
    const itemsCount = (JSON.parse(localStorage.getItem('marginaliaLibrary') ?? '[]')).length;

    const [editModeOn, setEditMode] = useState(false);
    const [editFavoriteMessage, setEditFavoriteMessage] = useState("Edit");

    const [changeFavoriteBook, setChangeFavoriteBook] = useState(false);
    const [favoriteItemID, setFavoriteItemID] = useState("");

    useEffect(() => {
          if (editModeOn) 
            setEditFavoriteMessage("Cancel");
          else
            setEditFavoriteMessage("Edit");
        }, [editModeOn]);

    return(
        <>
        <div className={`contentBody`}>
            <Header />
            
            <header className={`${styles.profileHeader}`}>
                <div className={`${styles.userInfo}`}>
                    <div className={`${styles.userPhotoContainer}`}>
                        <img className={`${styles.userPhoto} shinyBox`} src="img-book-template.png" alt="User's photo" />
                    </div>

                    <h2 className={`${styles.userName}`}>
                        Gustavo Nielsen
                    </h2>

                    <button className={`${styles.editProfileButton} cursorPointer`}>
                        <FaPen style={{height:12}}/>
                    </button>
                </div>
                

                <figure className={`${styles.bookReadCountContainer}`}>
                    <h3 className={`${styles.bookReadCountNumber}`}>{itemsCount}</h3>
                    <figcaption className={`${styles.bookReadCountText}`}>Books</figcaption>
                </figure>
            </header>

            <main className={`${styles.profileBody}`}>
                <div className={`${styles.profileListContainer}`}>
                    <div className={`${styles.bookListHeader}`}>
                        <h3 className={`${styles.listTitle}`}>Favorite Books</h3>

                        <button className={`${styles.listEditButton} cursorPointer`} onClick={() => setEditMode(prev => !prev)}>{editFavoriteMessage}</button>
                    </div>
                    
                    <ol className={`${styles.bookListBody}`}>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                            { editModeOn ? (
                                <div className={`${styles.bookItemEditBanner} shinyBox borderRadius`} onClick={() => {setChangeFavoriteBook(true); setFavoriteItemID("firstFavorite"); setEditMode(false)}}>
                                    <FaPlus className={`${styles.bookItemEditBannerPlus} cursorPointer`} />
                                </div>
                            ) : (<></>)}
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                            { editModeOn ? (
                                <div className={`${styles.bookItemEditBanner} shinyBox borderRadius`} onClick={() => {setChangeFavoriteBook(true); setFavoriteItemID("secondFavorite"); setEditMode(false)}}>
                                    <FaPlus className={`${styles.bookItemEditBannerPlus} cursorPointer`} />
                                </div>
                            ) : (<></>)}                                          
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                            { editModeOn ? (
                                <div className={`${styles.bookItemEditBanner} shinyBox borderRadius`} onClick={() => {setChangeFavoriteBook(true); setFavoriteItemID("thirdFavorite"); setEditMode(false)}}>
                                    <FaPlus className={`${styles.bookItemEditBannerPlus} cursorPointer`} />
                                </div>
                            ) : (<></>)}
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                            { editModeOn ? (
                                <div className={`${styles.bookItemEditBanner} shinyBox borderRadius`} onClick={() => {setChangeFavoriteBook(true); setFavoriteItemID("fourthFavorite"); setEditMode(false)}}>
                                    <FaPlus className={`${styles.bookItemEditBannerPlus} cursorPointer`} />
                                </div>
                            ) : (<></>)}
                        </li>
                    </ol>
                </div>
            </main>
            {changeFavoriteBook && ( 
                <FavoriteSearchModal onClose={() => setChangeFavoriteBook(false)} favoriteID={favoriteItemID} /> // Draw the Search Modal
            )}
        </div>

        
        </>
    )
}