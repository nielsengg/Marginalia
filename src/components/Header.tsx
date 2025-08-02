import { useState } from 'react';
import { SearchModal } from '../components/SearchModal';

import '../assets/styles/Header.css';

export default function Header() {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchBarOff, searchBarOn] = useState(false);

    return (
        <header id="headerMarginalia">
            <div id="leftNavContainer">
                <button className="navLink borderRadius cursorPointer">Settings</button>
                <button className="navLink borderRadius cursorPointer">Profile</button>
            </div>
            

            <button id="logoBox" onClick={() => window.location.href = "/"}>
                <img id="logo" className='cursorPointer' src="/img-maginalia-logo.png" alt="Rabbit Marginalia Logo"/>
            </button>
           
           <div id="rightNavContainer">
                <input id='searchBar' type="text" className={`${searchBarOff ? "showItem" : "hiddenItem"}`}/>

                <button
                    className={`navLink borderRadius cursorPointer ${searchBarOff ? "showItem" : "hiddenItem"}`}
                    onClick={() => searchBarOn((prev) => !prev)}
                    >X
                </button>
                

                <button
                    className={`navLink borderRadius cursorPointer ${searchBarOff ? "hiddenItem" : ""}`}
                    onClick={() => searchBarOn((prev) => !prev)}
                    >Search
                </button>
                <button
                    id='logButton' 
                    className={`navLink borderRadius cursorPointer ${searchBarOff ? "hiddenItem" : ""}`}
                    onClick={() => setIsSearchModalOpen(true)}
                    >Log +
                </button>
           </div>
            
            

            {/* Verify if searchModal is open to close it */}
            {isSearchModalOpen && ( 
            <SearchModal onClose={() => setIsSearchModalOpen(false)} /> 
            )} 
        </header>
    );
}



