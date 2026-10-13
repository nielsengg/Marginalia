// src/models/modelBook.ts
export interface Book {
    key: string;
    title: string;

    authors?: Array<{ author: { key: string } }>;
    author_name?: string[];

    covers?: number[];
    cover_i?: number;
    cover_edition_key?: string | number[];

    first_publish_year?: number;
    publish_date?: number | string;
    first_publish_date?: number | string;
    number_of_pages_median?: number;

    description?: string | { value: string };
    subjects?: string[];

    readedOnDate?: string;
    readedBefore?: boolean;
    readReview?: string;
    readStarRating?: number;
    readHeartRating?: boolean;
}