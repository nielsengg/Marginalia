import type { Book } from '../models/modelBook';

export function saveReadBook(props: { bookInfo: Book }) {
    const stored = localStorage.getItem("marginaliaLibrary");

    let books: Book[] = [];

    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                books = parsed;
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    const { 
        key, 
        title, 
        covers, 
        author_name, 
        readedOnDate, 
        readedBefore, 
        readReview, 
        readStarRating, 
        readHeartRating 
    } = props.bookInfo;

    const newBook: Book = {
        key,
        title,
        covers,
        author_name,
        readedOnDate,
        readedBefore,
        readReview,
        readStarRating,
        readHeartRating
    };

    books.push(newBook);

    localStorage.setItem("marginaliaLibrary", JSON.stringify(books));
}