import '../assets/styles/BookDetailPage.css'

import Header from '../components/Header';

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface Book {
  key: string;
  title: string;

  authors?: Array<{ author: { key: string } }>; 
  author_name?: string[]; 

  covers?: number[];
  first_publish_year?: number;
  description?: string | { value: string };
  subjects?: string[];
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [authorNames, setAuthorNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        // Search book's princiapal details
        const bookResponse = await fetch(
          `https://openlibrary.org/works/${id}.json`
        );
        const bookData = await bookResponse.json();
        setBook(bookData);

        // Search authors name
        if (bookData.authors) {
          const names = await Promise.all(
            bookData.authors.map(async (author: any) => {
              const authorResponse = await fetch(
                `https://openlibrary.org${author.author.key}.json`
              );
              const authorData = await authorResponse.json();
              return authorData.name || "Unknow author";
            })
          );
          setAuthorNames(names);
        }
      } catch (error) {
        console.error("Error fetching book details:", error);
      }
    };

    fetchBookDetails();
  }, [id]);

  // Show Loading essagen while the book deitails are not processed //
  if (!book) return (
    <div id="bookPageContainer">
      <>
        <Header />

        <main id="bodyBookDetail" style={{ margin: 0 }}>
          <div id='bookPageLoading'>
            <div id="loadingMessage">
              Loading...
            </div>
          </div>
        </main>
      </>
    </div>
  );
  // ------------------------------------------------------------- //
  

  // Define authors name //
  const displayAuthors = 
    book.author_name || 
    authorNames || 
    ["Unknow author"];
// --------------------s //
 

  return (
    <div id="bookPageContainer">
      <Header />

      <main id="bodyBookDetail">
        {book.covers?.[0] && (
          <img
          id='bookCover'
          src={`https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`}
          alt={`Cover ${book.title}`}
          className='borderRadius'
          />
        )}
        {!book.covers?.[0] &&(
          <img
            id='bookCover'
            src={`/img-book-template.png`}
            alt={`No book cover`}
            className='borderRadius'
            />
        )}

        <div id="bookInfo">
            <h1 id='bookTitle'>{book.title}</h1>

            <p id='bookAuthor'>Author: {displayAuthors.join(", ")}</p>
            {book.first_publish_year && (
                <p>Ano de publicação: {book.first_publish_year}</p>
            )}
            <div id="bookDescription">
                {typeof book.description === 'string'
                ? book.description
                : book.description?.value || "Just a book without description."}
          </div>
        </div> 

        
      </main>
    </div>  
  );
}