import { SearchModal } from '../components/SearchModal';
import { useState } from 'react';
import '../assets/styles/home.css';

export default function Home() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  return (
    <div id="pricipalContainer">
        <div id="navigationBar">
            <button id='logButton' className="navLink borderRadius" onClick={() => setIsSearchModalOpen(true)}>Log +</button>
            <button className="navLink borderRadius">Search</button>

            <div id="logoBox">
              <img id="logo" src="/img-maginalia-logo.png" alt="Rabbit Marginalia Logo"/>
            </div>
            

            <button className="navLink borderRadius">Profile</button>
            <button className="navLink borderRadius">Settings</button>
        </div>

        <main id="contentContainer">
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

