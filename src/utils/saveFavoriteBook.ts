import type { favoriteBook } from '../models/modelFavoriteBook.ts'

export function saveFavoriteBook(props: { bookInfo: favoriteBook, favoriteID: string }) {

    const stored = localStorage.getItem("marginaliaFavorites");

    let books: favoriteBook[] = [];

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                books = parsed;
            }
        } catch (error) {
            console.error("Error parsing localStorage data:", error);
        }
    }

    const { bookInfo } = props;
    const idToSearch = props.favoriteID;

    const index = books.findIndex((item: favoriteBook) => item.favoriteID === idToSearch);

    if (index !== -1) 
        books[index] = bookInfo;
     else 
        books.push(bookInfo);
    

    localStorage.setItem('marginaliaFavorites', JSON.stringify(books));
}