import styles from '../assets/styles/FavoriteSearchModal.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

import { saveFavoriteBook } from "../utils/saveFavoriteBook"

import type { Book } from "../models/modelBook";
import type { favoriteBook } from "../models/modelFavoriteBook.ts"

import { fetchBooks } from '../utils/fetchBooks'


type Props = {
  onClose: () => void;
  favoriteID: string
};

export function FavoriteSearchModal({ onClose, favoriteID }: Props) {
  
    // --------------- Put the input in focus --------------- // 
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    // <-------------- Put the input in focus --------------> //


    const [searchTerm, setSearchTerm] = useState(""); // Catch the user's input
    const [searchResults, setSearchResults] = useState<Book[]>([]); // Catch the books results 

    const [bookKeySelected, setBookKeySelected] = useState(""); // Verify if the user selected a book to change the modal

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    const [bookDetails, setBookDetails] = useState<Book | null>(null); //


    const handleFavoriteBook = () => {
        const favoriteBookToSave: favoriteBook = {
            favoriteID: favoriteID,
            key: bookKeySelected,
            favoritedDay: todayDate
        };

        if (bookKeySelected){
            saveFavoriteBook({ bookInfo: favoriteBookToSave, favoriteID: favoriteID});
            onClose();
        }else
            console.info("error to save book");


    }

    // ------------------- Fetch books ------------------- //

    // Fetch books from Book's title
    useEffect(() => {
        const loadData = async () => {
        try {
            const fetchedItems = await fetchBooks(searchTerm || "", "title");
            setSearchResults(fetchedItems);
        } catch (err) {
            console.info(err instanceof Error ? err.message : 'Unknow error');
        }
        };
    
        loadData();
        }, [searchTerm]);
        
        // ------------------- //

        useEffect(() => {
            const loadData = async () => {
                try {
                
                const fetchedItem = await fetchBooks(bookKeySelected, "key");
                setBookDetails(fetchedItem);
                } catch (err) {
                    console.info("error");
                }
            };

            loadData();
        }, [bookKeySelected]);

        // Define authors name //
        const displayPublishYear = 
            (bookDetails && bookDetails.publish_date) ||
            (bookDetails && bookDetails.first_publish_year) ||
            (bookDetails && bookDetails.first_publish_date) ||
            ["????"];
        
        // ------------------- //

    // <------------------ Fetch books ------------------> //


    return (
        <div className={`${styles.modalSearchContainer}`}> 
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1  }}
                transition={{ duration: 0.2 }}
                className={`${styles.modalSearchContent} borderRadius`}
            >
                {!bookKeySelected ? (
                    <>
                    <div className={`${styles.headerModalSearch}`}>
                        <h2 className={`${styles.messageModalSearch}`}>Add to your favorite books...</h2>
                        <button className={`${styles.exitModalSearch} borderRadius cursorPointer`} onClick={onClose}>X</button>
                    </div>
                    
                    <div className={`${styles.bodyModalSearch}`}>
                        <input 
                        ref={inputRef}
                        className={`${styles.searchInput} borderRadius`} 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text" 
                        autoComplete="off" 
                        placeholder="Search for book..."/>

                        
                        <div className={`${styles.searchResultsContainer} borderRadius`} >
                        {searchTerm.trim() && ( // Do not show the results when the input is empty
                            <>
                            {searchResults.map((book) => (
                                <div className={`${styles.bookItemSearch} cursorPointer`} key={book.key} onClick={() => setBookKeySelected(book.key)}>

                                <div key={book.key}>{book.title}</div>
                                <div className={`${styles.authorName}`}> {book.author_name}</div>

                                </div>
                                
                            ))}
                            </>
                        )}
                        </div>
                    </div>
                    </>
                ) : bookDetails ? (
                    <>
                    <div className={`${styles.headerModalSearch}`}>
                        <h2 className={`${styles.messageModalSearch}`}>Is this one of your favorite books?</h2>
                        <button className={`${styles.exitModalSearch} borderRadius cursorPointer`} onClick={onClose}>X</button>
                    </div>
                    
                    <div className={`${styles.bodyModalSearch}`}>
                        <div className={`${styles.bookCoverContainer} cursorPointer`}>
                          {bookDetails.covers?.[0] && (
                            <img
                                className={`${styles.bookCoverLog} ${styles.borderRadius} shinyBox`}
                                src={`https://covers.openlibrary.org/b/id/${bookDetails.covers[0]}-L.jpg`}
                                alt={`Cover ${bookDetails.title}`}
                            />
                            )}
                            {!bookDetails.covers?.[0] &&(
                            <img
                                id='bookCover'
                                src={`/img-book-template.png`}
                                alt={`No book cover`}
                                className={`${styles.bookCoverLog} ${styles.borderRadius} shinyBox`}
                                />
                            )}
                        </div>

                        <div className={`${styles.bookReadInfoContainer}`}>
                          
                            <div className={`${styles.bookLogTitle}`}>{bookDetails.title}</div>
                            <div className={`${styles.bookLogPublishDate}`}>({displayPublishYear})</div>

                            <div className={`${styles.bookDescription}`}>
                                {typeof bookDetails.description === 'string'
                                ? bookDetails.description
                                : bookDetails.description?.value || "Just a book without description."}
                            </div>
                          
                        </div>     
                    </div>
                    <div className={`${styles.bookLogFooter}`}>
                        <button className={`${styles.bookSaveButton} cursorPointer shinyBox borderRadius`}
                        onClick={() => handleFavoriteBook()}>
                            Favorite
                        </button>
                    </div>
                    </>
                ) : (
                    <>error</>
                )}
                
                
                    
                
            </motion.div>
        </AnimatePresence>
    </div>
        
        
      
  );
}