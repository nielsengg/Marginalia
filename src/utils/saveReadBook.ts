import type { Book } from '../models/modelBook';
import { marginaliaStorage } from './storage';

export async function saveReadBook(props: { bookInfo: Book }) {
    const books = await marginaliaStorage.get<Book[]>('marginaliaLibrary', []);

    const {
        key,
        title,
        covers,
        author_name,
        readedOnDate,
        readedBefore,
        readReview,
        readStarRating,
        readHeartRating,
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
        readHeartRating,
    };

    books.push(newBook);

    await marginaliaStorage.set('marginaliaLibrary', books);
}