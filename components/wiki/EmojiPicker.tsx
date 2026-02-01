'use client';

import { useState, useRef, useEffect } from 'react';

// Popular emoji categories for wiki pages
const EMOJI_CATEGORIES = {
    'Популярные': ['📄', '📝', '📚', '📖', '🏠', '⭐', '💡', '🎯', '🔥', '✨', '💎', '🎮'],
    'Файлы': ['📄', '📝', '📑', '📋', '📓', '📔', '📕', '📗', '📘', '📙', '📚', '📖'],
    'Объекты': ['🔧', '⚙️', '🔨', '🛠️', '⚡', '💻', '🖥️', '📱', '🎨', '🎭', '🎬', '📷'],
    'Символы': ['✅', '❌', '⚠️', '❓', '❗', '💬', '🔔', '🔒', '🔓', '🔑', '🎵', '🔗'],
    'Природа': ['🌍', '🌳', '🌲', '🍀', '🌸', '🌺', '🌻', '🌙', '⭐', '☀️', '🌈', '💧'],
    'Игры': ['🎮', '🎲', '🎯', '🏆', '🥇', '🎪', '🎭', '🎨', '♟️', '🃏', '🎰', '🎳'],
    'Еда': ['🍎', '🍕', '🍔', '🍟', '🍦', '🎂', '🍪', '🍩', '☕', '🍵', '🥤', '🍺'],
    'Лица': ['😀', '😊', '🤔', '😎', '🥳', '😴', '🤯', '🤩', '😇', '🤓', '😈', '👻'],
};

interface EmojiPickerProps {
    value: string;
    onChange: (emoji: string) => void;
    className?: string;
}

export default function EmojiPicker({ value, onChange, className = '' }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Популярные');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (emoji: string) => {
        onChange(emoji);
        setIsOpen(false);
    };

    return (
        <div className={`emoji-picker-container ${className}`} ref={containerRef}>
            <button
                type="button"
                className="emoji-picker-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Выбрать иконку"
            >
                <span className="emoji-picker-current">{value || '📄'}</span>
                <span className="emoji-picker-arrow">▼</span>
            </button>

            {isOpen && (
                <div className="emoji-picker-dropdown">
                    <div className="emoji-picker-categories">
                        {Object.keys(EMOJI_CATEGORIES).map(cat => (
                            <button
                                key={cat}
                                type="button"
                                className={`emoji-category-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="emoji-picker-grid">
                        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`emoji-picker-item ${value === emoji ? 'selected' : ''}`}
                                onClick={() => handleSelect(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
