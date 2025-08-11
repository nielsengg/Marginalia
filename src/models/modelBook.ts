  export interface Book {
    key: string;
    title: string;

    authors?: Array<{ author: { key: string } }>; 
    author_name?: string[]; 

    covers?: number[];
    cover_edition_key?: number[];
    
    first_publish_year?: number;
    publish_date?: number;
    first_publish_date?: number;

    description?: string | { value: string };
    subjects?: string[];

    readedOnDate?: string;
    readedBefore?: boolean;
    readReview?: string;
    readStarRating?: number;
    readHeartRating?: boolean;
  }
