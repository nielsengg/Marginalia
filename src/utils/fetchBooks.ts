// Funtion to request book results from a search by title
export async function fetchBooks(searchParameter: string, searchType: string) {
  try {
    // Search books by Title
    if (searchType === "title"){
      const bookResponse = await fetch( 
        `https://openlibrary.org/search.json?${searchType}=${encodeURIComponent(searchParameter)}`
      );
      
      if (!bookResponse.ok) { // Message if error
        throw new Error(`Error HTTP: ${bookResponse.status}`);
      }

      const bookData = await bookResponse.json(); // Receive data file
      return bookData.docs || [];

    // Search books by Key
    } else if (searchType === "key"){
        const bookResponse = await fetch( 
          `https://openlibrary.org${searchParameter}.json`
        );
        
        if (!bookResponse.ok) { // Message if error
          throw new Error(`Error HTTP: ${bookResponse.status}`);
        }

        const bookData = await bookResponse.json(); // Receive data file
        return bookData;

    } else {
      return console.error();
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
}