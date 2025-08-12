import { SearchModal } from '../components/SearchModal';
import Header from '../components/Header';

import { useState } from 'react';
import '../assets/styles/Home.css';

export default function Home() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  return (
    <div className='contentBody'>
        <Header />

        <main id="contentBody">
            <div id="readingBooksContainer">

            </div>

            {/* Verify if searchModal is open to close it */}
            {isSearchModalOpen && ( 
              <SearchModal onClose={() => setIsSearchModalOpen(false)} /> 
            )}
        </main>
      </div>
  );
}

