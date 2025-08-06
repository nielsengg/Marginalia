export interface Book {
  key: string;
  title: string;

  authors?: Array<{ author: { key: string } }>; 
  author_name?: string[]; 

  covers?: number[];
  cover_edition_key?: number[];
  
  first_publish_year?: number;
  description?: string | { value: string };
  subjects?: string[];
}
