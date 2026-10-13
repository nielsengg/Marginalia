// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { SearchModal } from '../components/SearchModal';
import '../assets/styles/Header.css';
import { useNavigate } from 'react-router-dom';
import { marginaliaStorage } from '../utils/storage';
import { FaDownload, FaUpload, FaTimes } from 'react-icons/fa';

export default function Header() {
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchBarOff, searchBarOn] = useState(false);
    const [titleSearch, setTitleSearch] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const backupFileRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (searchBarOff) {
            inputRef.current?.focus();
        }
    }, [searchBarOff]);

    const searchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && titleSearch.trim()) {
            navigate(`/search/${encodeURIComponent(titleSearch.trim())}`);
            setIsSearchModalOpen(false);
            searchBarOn(false);
            setTitleSearch('');
        }
    };

    const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ok = await marginaliaStorage.importBackup(file);
        if (ok) {
            alert('Backup imported successfully!');
            setIsSettingsOpen(false);
        } else {
            alert('Invalid backup file.');
        }
        e.target.value = '';
    };

    return (
        <>
            <header id="headerMarginalia">
                <div id="leftNavContainer">
                    <button
                        className="navLink borderRadius cursorPointer"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        Settings
                    </button>
                    <button
                        className="navLink borderRadius cursorPointer"
                        onClick={() => navigate('/profile')}
                    >
                        Profile
                    </button>
                </div>

                <button id="logoBox" onClick={() => navigate('/')}>
                    <img
                        id="logo"
                        className="cursorPointer"
                        src="/img-maginalia-logo.png"
                        alt="Rabbit Marginalia Logo"
                    />
                </button>

                <div id="rightNavContainer">
                    <input
                        ref={inputRef}
                        id="searchBar"
                        type="text"
                        className={`borderRadius ${searchBarOff ? 'showItem' : 'hiddenItem'}`}
                        value={titleSearch}
                        onChange={(e) => setTitleSearch(e.target.value)}
                        onKeyDown={searchKeyDown}
                        placeholder="Search a book..."
                        autoComplete="off"
                    />

                    <button
                        className={`navLink borderRadius cursorPointer ${searchBarOff ? 'showItem' : 'hiddenItem'}`}
                        onClick={() => searchBarOn((prev) => !prev)}
                    >
                        X
                    </button>

                    <button
                        className={`navLink borderRadius cursorPointer ${searchBarOff ? 'hiddenItem' : ''}`}
                        onClick={() => searchBarOn((prev) => !prev)}
                    >
                        Search
                    </button>
                    <button
                        id="logButton"
                        className={`navLink borderRadius cursorPointer ${searchBarOff ? 'hiddenItem' : ''}`}
                        onClick={() => setIsSearchModalOpen(true)}
                    >
                        Log +
                    </button>
                </div>
            </header>

            {/* Modais fora da tag <header> para centralizarem na tela inteira */}
            {isSearchModalOpen && (
                <SearchModal onClose={() => setIsSearchModalOpen(false)} />
            )}

            {isSettingsOpen && (
                <div className="settingsModalBackdrop" onClick={() => setIsSettingsOpen(false)}>
                    <div
                        className="settingsModalContent borderRadius"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="settingsModalHeader">
                            <h3>Marginalia Data & Backup</h3>
                            <button
                                className="navLink borderRadius cursorPointer"
                                onClick={() => setIsSettingsOpen(false)}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <p className="settingsModalText">
                            Your personal library is stored locally in IndexedDB. Export a JSON
                            backup anytime to keep a safe copy of your books, ratings, and lists.
                        </p>
                        <div className="settingsActionsRow">
                            <button
                                className="settingsActionBtn borderRadius cursorPointer shinyBox"
                                onClick={() => marginaliaStorage.exportBackup()}
                            >
                                <FaDownload /> Export Backup (.json)
                            </button>
                            <button
                                className="settingsActionBtn borderRadius cursorPointer shinyBox"
                                onClick={() => backupFileRef.current?.click()}
                            >
                                <FaUpload /> Import Backup (.json)
                            </button>
                            <input
                                ref={backupFileRef}
                                type="file"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={handleImportBackup}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}