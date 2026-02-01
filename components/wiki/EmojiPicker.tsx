'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface SymbolPickerProps {
    value: string;
    onChange: (symbol: string) => void;
    className?: string;
}

// Unicode symbols organized by category
const SYMBOL_CATEGORIES: Record<string, { name: string; symbols: string[] }> = {
    popular: {
        name: '★ Популярные',
        symbols: ['★', '✦', '◆', '●', '■', '▶', '♦', '✓', '✕', '→', '←', '↑', '↓', '⚡', '♠', '♥', '♣', '♪', '☆', '◇', '○', '□', '△', '▽', '◎', '⊕', '⊗', '※', '†', '‡']
    },
    arrows: {
        name: '→ Стрелки',
        symbols: ['→', '←', '↑', '↓', '↔', '↕', '↖', '↗', '↘', '↙', '⇒', '⇐', '⇑', '⇓', '⇔', '⇕', '➔', '➜', '➝', '➞', '▶', '◀', '▲', '▼', '►', '◄', '⏩', '⏪', '⏫', '⏬']
    },
    shapes: {
        name: '◆ Фигуры',
        symbols: ['●', '○', '◐', '◑', '◒', '◓', '■', '□', '▢', '▣', '▤', '▥', '▦', '▧', '▨', '▩', '◆', '◇', '◈', '◉', '◊', '△', '▲', '▽', '▼', '◁', '▷', '◀', '▶', '⬟']
    },
    stars: {
        name: '★ Звёзды',
        symbols: ['★', '☆', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '⋆', '✡', '✢', '✣', '✤', '✥', '❂', '❃', '❄', '❅', '❆', '❇', '❈', '✱', '✲', '✳', '✴', '✵']
    },
    checkmarks: {
        name: '✓ Галочки',
        symbols: ['✓', '✔', '✕', '✖', '✗', '✘', '☐', '☑', '☒', '✅', '❌', '⊕', '⊖', '⊗', '⊘', '⊙', '⊚', '⊛', '⊜', '⊝', '◉', '◎', '●', '○', '◌', '◍', '◐', '◑', '◒', '◓']
    },
    math: {
        name: '∑ Математика',
        symbols: ['∑', '∏', '∫', '∬', '∭', '∮', '∯', '∰', '∂', '∇', '∞', '∝', '∀', '∃', '∄', '∈', '∉', '∋', '∌', '∅', '±', '×', '÷', '≠', '≈', '≡', '≤', '≥', '⊂', '⊃']
    },
    currency: {
        name: '$ Валюты',
        symbols: ['$', '€', '£', '¥', '₽', '₴', '₿', '¢', '₡', '₢', '₣', '₤', '₥', '₦', '₧', '₨', '₩', '₪', '₫', '₭', '₮', '₯', '₰', '₱', '₲', '₳', '₵', '₶', '₷', '₸']
    },
    punctuation: {
        name: '§ Пунктуация',
        symbols: ['§', '¶', '†', '‡', '※', '•', '◦', '‣', '⁃', '⁕', '⁎', '⁑', '⁂', '※', '⁜', '⁋', '⁌', '⁍', '℗', '©', '®', '™', '℠', '№', '℃', '℉', '‰', '‱', '′', '″']
    },
    music: {
        name: '♪ Музыка',
        symbols: ['♩', '♪', '♫', '♬', '♭', '♮', '♯', '𝄞', '𝄢', '𝄫', '𝄬', '𝄭', '𝄰', '𝄱', '𝄲', '𝄳', '𝄴', '𝄵', '𝄶', '𝄷', '𝄸', '𝄹', '𝄺', '𝄻', '𝄼', '𝄽', '𝄾', '𝄿', '𝅀', '𝅁']
    },
    cards: {
        name: '♠ Карты',
        symbols: ['♠', '♡', '♢', '♣', '♤', '♥', '♦', '♧', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅', '♔', '♕', '♖', '♗', '♘', '♙', '♚', '♛', '♜', '♝', '♞', '♟', '⚐', '⚑', '⛳', '♺']
    },
    weather: {
        name: '☀ Погода',
        symbols: ['☀', '☁', '☂', '☃', '☄', '★', '☆', '☇', '☈', '☉', '☊', '☋', '☌', '☍', '☽', '☾', '☿', '♀', '♁', '♂', '♃', '♄', '♅', '♆', '♇', '⛅', '⛆', '⛈', '❄', '❅']
    },
    tech: {
        name: '⚙ Техника',
        symbols: ['⚙', '⚡', '⌘', '⌥', '⇧', '⌃', '⏎', '⌫', '⌦', '⎋', '⇥', '⇤', '⌨', '🖱', '⏏', '⏯', '⏮', '⏭', '⏸', '⏹', '⏺', '⏻', '⏼', '⭘', '⎈', '⌧', '⏚', '⏛', '⚐', '⚑']
    },
    misc: {
        name: '◈ Разное',
        symbols: ['☮', '☯', '☸', '☹', '☺', '☻', '☼', '☽', '☾', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⚓', '⚔', '⚕', '⚖', '⚗', '⚘', '⚙', '⚚', '⚛']
    }
};

// Flatten all symbols for search
const ALL_SYMBOLS = Object.values(SYMBOL_CATEGORIES).flatMap(cat => cat.symbols);

export default function SymbolPicker({ value, onChange, className = '' }: SymbolPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('popular');
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search when opening
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Filter symbols based on search
    const filteredSymbols = useMemo(() => {
        if (!searchQuery.trim()) {
            return SYMBOL_CATEGORIES[activeCategory]?.symbols || [];
        }
        // When searching, search all symbols
        const query = searchQuery.toLowerCase();
        // Search by symbol itself or by category name
        const results: string[] = [];
        Object.entries(SYMBOL_CATEGORIES).forEach(([, cat]) => {
            if (cat.name.toLowerCase().includes(query)) {
                results.push(...cat.symbols);
            } else {
                cat.symbols.forEach(sym => {
                    if (sym.includes(searchQuery)) {
                        results.push(sym);
                    }
                });
            }
        });
        // Return unique symbols
        return [...new Set(results)];
    }, [searchQuery, activeCategory]);

    const handleSelect = (symbol: string) => {
        onChange(symbol);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <div className={`symbol-picker-container ${className}`} ref={containerRef}>
            <button
                type="button"
                className="symbol-picker-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Выбрать символ"
            >
                <span className="symbol-picker-current">{value || '★'}</span>
                <span className="symbol-picker-arrow">▼</span>
            </button>

            {isOpen && (
                <div className="symbol-picker-dropdown" onKeyDown={handleKeyDown}>
                    {/* Search input */}
                    <div className="symbol-picker-search">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск символа..."
                            className="symbol-search-input"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="symbol-search-clear"
                                onClick={() => setSearchQuery('')}
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Categories tabs */}
                    {!searchQuery && (
                        <div className="symbol-picker-categories">
                            {Object.entries(SYMBOL_CATEGORIES).map(([key, cat]) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`symbol-category-btn ${activeCategory === key ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(key)}
                                    title={cat.name}
                                >
                                    {cat.symbols[0]}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Category name */}
                    <div className="symbol-picker-category-name">
                        {searchQuery
                            ? `Найдено: ${filteredSymbols.length}`
                            : SYMBOL_CATEGORIES[activeCategory]?.name
                        }
                    </div>

                    {/* Symbols grid */}
                    <div className="symbol-picker-grid">
                        {filteredSymbols.length > 0 ? (
                            filteredSymbols.map((symbol, i) => (
                                <button
                                    key={`${symbol}-${i}`}
                                    type="button"
                                    className={`symbol-picker-item ${value === symbol ? 'selected' : ''}`}
                                    onClick={() => handleSelect(symbol)}
                                    title={`U+${symbol.codePointAt(0)?.toString(16).toUpperCase()}`}
                                >
                                    {symbol}
                                </button>
                            ))
                        ) : (
                            <div className="symbol-picker-empty">
                                Ничего не найдено
                            </div>
                        )}
                    </div>

                    {/* Quick access recent */}
                    <div className="symbol-picker-footer">
                        <span className="symbol-picker-hint">Нажмите на символ для выбора</span>
                    </div>
                </div>
            )}
        </div>
    );
}
