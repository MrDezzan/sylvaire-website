'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWiki } from '@/lib/wiki-context';

export default function WikiSearch() {
    const router = useRouter();
    const { searchQuery, setSearchQuery, searchResults, isSearchOpen, setIsSearchOpen } = useWiki();
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isSearchOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSearchOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
                setSearchQuery('');
            }
        };

        if (isSearchOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSearchOpen, setIsSearchOpen, setSearchQuery]);

    const handleSelect = (pageId: string) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        router.push(`/wiki/${pageId}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchResults.length > 0) {
            handleSelect(searchResults[0].id);
        }
    };

    if (!isSearchOpen) return null;

    return (
        <div className="wiki-search-overlay">
            <div className="wiki-search-modal" ref={modalRef}>
                <div className="wiki-search-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="wiki-search-input"
                        placeholder="Поиск по Wiki..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        className="wiki-search-close"
                        onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery('');
                        }}
                    >
                        <kbd>Esc</kbd>
                    </button>
                </div>

                {searchQuery && (
                    <div className="wiki-search-results">
                        {searchResults.length > 0 ? (
                            searchResults.map(page => (
                                <button
                                    key={page.id}
                                    className="wiki-search-result"
                                    onClick={() => handleSelect(page.id)}
                                >
                                    <span className="wiki-search-result-icon">
                                        {page.icon || '📄'}
                                    </span>
                                    <div className="wiki-search-result-content">
                                        <span className="wiki-search-result-title">{page.title}</span>
                                        <span className="wiki-search-result-preview">
                                            {page.content.substring(0, 100).replace(/[#*`]/g, '')}...
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="wiki-search-empty">
                                <p>Ничего не найдено по запросу &quot;{searchQuery}&quot;</p>
                            </div>
                        )}
                    </div>
                )}

                {!searchQuery && (
                    <div className="wiki-search-hint">
                        <p>Начните вводить для поиска по страницам Wiki</p>
                    </div>
                )}
            </div>
        </div>
    );
}
