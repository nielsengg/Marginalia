import styles from '../assets/styles/searchModal.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

import type { Book } from "../models/modelBook";
import { fetchBooks } from '../utils/fetchBooks'

type Props = {
  onClose: () => void;
};

export function SearchModal({ onClose }: Props) {
  
  // --------------- Put the input in focus --------------- // 
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  // <-------------- Put the input in focus --------------> //


  const [searchTerm, setSearchTerm] = useState(""); // Catch the user's input
  const [searchResults, setSearchResults] = useState<Book[]>([]); // Catch the books results 

  const [bookKeySelected, setBookKeySelected] = useState(""); // Verify if the user selected a book to change the modal
  const [bookDetails, setBookDetails] = useState<Book | null>(null); //

  const [loading, setLoading] = useState(true);
  const [errorByKey, setErrorByKey] = useState<string | null>(null); 

  // ------------------- Fetch books ------------------- //

  // Fetch books from Book's title
  useEffect(() => {
      setLoading(true);
        const loadData = async () => {
          try {
            const fetchedItems = await fetchBooks(searchTerm || "", "title");
            setSearchResults(fetchedItems);
          } catch (err) {
            console.info(err instanceof Error ? err.message : 'Unknow error');
          } finally {
            setLoading(false);
          }
        };
  
      loadData();
    }, [searchTerm]);

  // Fetch books from Book's ID
    useEffect(() => {
      setLoading(true);
      
      const loadData = async () => {
        try {
          if (bookKeySelected) {
            const fetchedItem = await fetchBooks(bookKeySelected, "key");
            setBookDetails(fetchedItem);
          }
        } catch (err) {
          setErrorByKey(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [bookKeySelected]);

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
                  <h2 className={`${styles.messageModalSearch}`}>Add to your books...</h2>
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
              ) : loading ? (
                <div className='bookPageLoading'>
                  <div className='loadingMessage'>  
                    Loading...
                  </div>
                </div>
              ) : (!bookDetails) ? (
                <p style={{ color: 'red' }}>{errorByKey}</p>
              ) : (
                    <>
                    <div className={`${styles.headerModalSearch}`}>
                      <h2 className={`${styles.messageModalSearch}`}>I read...</h2>
                      <button className={`${styles.exitModalSearch} borderRadius cursorPointer`} onClick={onClose}>X</button>
                    </div>
                    
                    <div className={`${styles.bodyModalLog}`}>
                      <div className={`${styles.bookLogContainer}`} key={bookDetails.key}>

                        {bookDetails.covers?.[0] && (
                          <img
                            className={`${styles.bookCover} ${styles.borderRadius}`}
                            src={`https://covers.openlibrary.org/b/id/${bookDetails.covers[0]}-L.jpg`}
                            alt={`Cover ${bookDetails.title}`}
                          />
                        )}
                        {!bookDetails.covers?.[0] &&(
                          <img
                            id='bookCover'
                            src={`/img-book-template.png`}
                            alt={`No book cover`}
                            className={`${styles.bookCover} ${styles.borderRadius}`}
                            />
                        )}

                        <div className={`${styles.bookReadInfoContainer}`}>
                          <div key={bookDetails.key} className={`${styles.bookLogTitle}`}>{bookDetails.title} ({bookDetails.first_publish_year})</div>
                          <div className={`${styles.authorName}`}> {bookDetails.author_name}</div>
                        </div>
                        

                      </div>
                    </div>
                    </>
                  )
                }
              
          </motion.div>
      </AnimatePresence>
  </div>
        
        
      
  );
}