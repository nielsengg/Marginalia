import '../assets/styles/BookSearchPage.css'
import Header from '../components/Header';
import { fetchBooks } from '../utils/fetchBooks'
import type { Book } from '../models/modelBook'

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Funtion to draw the book search results
export function BookSearchPage() {
  const { title } = useParams<{ title: string }>(); // Catch input search from URL
  const [items, setItems] = useState<Book[]>([]); // Items from teh search data
  
  const navigate = useNavigate();
  const handleBookClick = (bookKey: string) => {
    const id = bookKey.replace('/works/', ''); 
    navigate(`/book/${id}`); 
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 


  useEffect(() => {
    setLoading(true);
      const loadData = async () => {
        try {
          const fetchedItems = await fetchBooks(title || "");
          setItems(fetchedItems);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknow error');
        } finally {
          setLoading(false);
        }
      };

    loadData();
  }, [title]);

  return (
    <div id="bookPageContainer">
      <Header />

      <main id="bodyBookSearch">
          {loading ? (
            <div id='bookPageLoading'>
              <div id="loadingMessage">
                Loading...
              </div>
            </div>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (items.length != 0) ? ( // Verify if the items array has any book
            <ul id='bookSearchList'>
              {items.map((book) => (
                <li className='bookSearchItem' key={book.key}>
                  {book.cover_edition_key?.[0] && (
                    <img
                    src={`https://covers.openlibrary.org/b/olid/${book.cover_edition_key}.jpg`}
                    alt={`Cover ${book.title}`}
                    className='borderRadius bookCover'
                    /> 
                  )}
                  {!book.cover_edition_key?.[0] &&(
                    <img 
                      src={`/img-book-template.png`}
                      alt={`No book cover`}
                      className='borderRadius bookCover'
                      />
                  )}
                  <div className='bookInfo'>
                    <h2 className='bookTitle goToPageDetails' onClick={() => handleBookClick(book.key)}>{book.title}</h2>

                    <p className='bookDescription'>Writed by {book.author_name}.</p>
                    <p className='bookDescription'>Published in {book.first_publish_year}.</p>


                    </div>
                </li>
              ))}
            </ul>
          ) : (
            <div id='bookPageLoading'>
              <div id="loadingMessage">
                There were no matches for your search term.
              </div>
            </div>
          )}
      </main>
    </div>  
  );
}