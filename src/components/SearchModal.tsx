import '../assets/styles/searchModal.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

// Set search delay
const debounce = (func: (query: string) => void, delay: number) => {
  let timeoutId: number;
  return (query: string) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(query), delay);
  };
};

const fetchAuthorName = async (authorKey: string): Promise<string> => {
  try {
      const response = await fetch(`https://openlibrary.org${authorKey}.json`);
      const data = await response.json();
      return data.name || "Unknow author";
  } catch (error) {
      console.error("Errr to search author:", error);
      return "Unknow author";
  }
};

type Props = {
  onClose: () => void;
};

interface Book {
  key: string;
  title: string;

  author?: { key: string };
  author_name?: string[];

  covers?: number;
  first_publish_year: number;

  description?: string | { value: string };
  subjects?: string[];
}

export function SearchModal({ onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState(""); // Catch the user's input
  const [searchResults, setSearchResults] = useState<Book[]>([]); // Catch the books results

  const navigate = useNavigate();

  const handleBookClick = (bookKey: string) => {
    const id = bookKey.replace('/works/', ''); // Remove a parte fixa da chave
    navigate(`/book/${id}`); // Navega para a rota dinâmica
    onClose(); // Fecha o modal após navegar (opcional)
  };

  const searchBooks = async (query: string) => {
    // Search validation
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // API request
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&fields=key,title,author_name,covers,first_publish_year`
      );
      
      // Verify if the answer is valid
      if (!response.ok) throw new Error("Error to search");
      
      // Extracts and types data
      const data = await response.json() as { docs: Book[] };
      setSearchResults(data.docs || []); // Update results

      const booksWithAuthors = await Promise.all(
      data.docs.map(async (book: any) => {
        let authorName = "Autor desconhecido";
        
        if (book.author?.key) {
          authorName = await fetchAuthorName(book.author.key);
        } else if (book.author_name) {
          authorName = book.author_name.join(", ");
        }
        
        return {
          ...book,
          authorName
        };
      })
    );
    
    setSearchResults(booksWithAuthors)


      } catch (error) {
        console.error("Error:", error);
        setSearchResults([]); // If there is any error, clean setSearchResults
      } 
    };

  const debouncedSearch = debounce(searchBooks, 500); // 500ms de delay

  return (
    <div id="modalSearchContainer">
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1  }}
                transition={{ duration: 0.2 }}
                id="modalSearchContent" 
                className='borderRadius'
            >
                <div id="headerModalSearch">
                    <h2 id='messageModalSearch'>Add to your books...</h2>
                    <button id='exitModalSearch' className='borderRadius cursorPointer' onClick={onClose}>X</button>
                </div>
                
                <div id="bodyModalSearch">
                    <input id='searchInput' className='borderRadius' value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); debouncedSearch(e.target.value);}} type="text" autoComplete="off" placeholder="Search for book..."/>
                    
                    <div id="searchResultsContainer" className='borderRadius'>
                    {searchTerm.trim() && ( // Do not show the results when the input is empty
                        <>
                        {searchResults.map((book) => (
                          <div className="bookItemSearch cursorPointer" key={book.key} onClick={() => handleBookClick(book.key)}>

                            <div key={book.key}>{book.title} ({book.first_publish_year})</div>
                            <div className='authorName'> {book.author_name}</div>

                          </div>
                          
                        ))}
                        </>
                    )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    </div>
        
        
      
  );
}