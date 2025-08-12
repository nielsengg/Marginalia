import React, { useState, useRef, useEffect } from 'react';
import { SearchModal } from '../components/SearchModal';
import '../assets/styles/Header.css';
import { useNavigate } from 'react-router-dom';



export default function Header(){
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchBarOff, searchBarOn] = useState(false);

    const [titleSearch, setTitleSearch] = useState("");


    // Put the input in focus //
    const inputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (searchBarOff)
            inputRef.current?.focus();

    }, [searchBarOff]);
    // ---------------------- //


    const navigate = useNavigate();
    const searchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter"){
            navigate(`/search/${titleSearch}`); 
            setIsSearchModalOpen(false);
        }
    }

    const profileClick = () => {
        navigate(`/profile`); 
    }


    return (
        <header id="headerMarginalia">
            <div id="leftNavContainer">
                <button className="navLink borderRadius cursorPointer">Settings</button>
                <button className="navLink borderRadius cursorPointer" onClick={() => profileClick()}>Profile</button>
            </div>
            

            <button id="logoBox" onClick={() => window.location.href = "/"}>
                <img id="logo" className='cursorPointer' src="/img-maginalia-logo.png" alt="Rabbit Marginalia Logo"/>
            </button>
           
           <div id="rightNavContainer">
                <input
                    ref={inputRef}
                    id='searchBar'
                    type="text" 
                    className={ `borderRadius ${searchBarOff ? "showItem" : "hiddenItem"}`}

                    value={titleSearch}
                    onChange={(e) => setTitleSearch(e.target.value)}
                    onKeyDown={searchKeyDown}
                    placeholder="Search a book..."
                    autoComplete="off"
                />

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
                <SearchModal onClose={() => setIsSearchModalOpen(false)} /> // Draw the Search Modal
            )} 
        </header>
    );
}
