import type { Book } from '../models/modelBook';

// Funtion to request book results from a search by title
export async function fetchBooks(searchTitle: string): Promise<Book[]> {
  try {
    const bookResponse = await fetch( // Search books by title
      `https://openlibrary.org/search.json?title=${encodeURIComponent(searchTitle)}`
    );
    
    if (!bookResponse.ok) { // Message if error
      throw new Error(`Error HTTP: ${bookResponse.status}`);
    }

    const bookData = await bookResponse.json(); // Receive data file
    return bookData.docs || []; 
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
}