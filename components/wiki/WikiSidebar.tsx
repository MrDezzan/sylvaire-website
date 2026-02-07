'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWiki } from '@/lib/wiki-context';
import { WikiPage } from '@/lib/wiki-storage';

interface WikiSidebarProps {
    currentPageId?: string;
}

export default function WikiSidebar({ currentPageId }: WikiSidebarProps) {
    const { pageTree, getChildren, canEdit, setIsSearchOpen } = useWiki();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['home']));
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [currentPageId]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Track all visited IDs at sidebar level to catch any cycles
    const allVisited = new Set<string>();

    const renderPageItem = (page: WikiPage, depth: number = 0) => {
        // Absolute guard against revisiting any page
        if (allVisited.has(page.id)) {
            return null;
        }

        // Depth limit
        if (depth > 5) {
            return null;
        }

        allVisited.add(page.id);

        const children = getChildren(page.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedItems.has(page.id);
        const isActive = currentPageId === page.id;

        return (
            <div key={page.id} className="wiki-sidebar-item-wrapper">
                <div
                    className={`wiki-sidebar-item ${isActive ? 'active' : ''}`}
                    style={{ paddingLeft: `${16 + depth * 16}px` }}
                >
                    {hasChildren && (
                        <button
                            className="wiki-sidebar-expand"
                            onClick={(e) => {
                                e.preventDefault();
                                toggleExpand(page.id);
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="currentColor"
                                style={{
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                }}
                            >
                                <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            </svg>
                        </button>
                    )}
                    <Link href={`/wiki/${page.id}`} className="wiki-sidebar-link">
                        {/* Icon removed as requested */}
                        <span className="wiki-sidebar-title">{page.title}</span>
                    </Link>
                </div>
                {hasChildren && isExpanded && (
                    <div className="wiki-sidebar-children">
                        {children.map(child => renderPageItem(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Find home page
    const homePage = pageTree.find(p => p.id === 'home');

    // Group pages by category (excluding home)
    const groupedPages: Record<string, WikiPage[]> = {};
    const uncategorizedPages: WikiPage[] = [];

    pageTree.forEach(page => {
        if (page.id === 'home') return; // Skip home page in regular lists

        if (page.category) {
            if (!groupedPages[page.category]) {
                groupedPages[page.category] = [];
            }
            groupedPages[page.category].push(page);
        } else {
            uncategorizedPages.push(page);
        }
    });

    const categoryNames = Object.keys(groupedPages).sort();

    return (
        <>
            {/* Mobile Menu Button - unchanged */}
            <button
                className="wiki-mobile-menu-btn"
                onClick={() => setMobileOpen(true)}
                aria-label="Открыть меню"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
            </button>

            {/* Mobile Overlay - unchanged */}
            <div
                className={`wiki-sidebar-overlay ${mobileOpen ? 'open' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            <aside className={`wiki-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
                <button
                    className="wiki-sidebar-close"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Закрыть меню"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="wiki-sidebar-header">
                    <Link href="/wiki" className="wiki-sidebar-logo">
                        <img src="/assets/logo.png" alt="Sylvaire" />
                        <span>Wiki</span>
                    </Link>
                </div>

                <div className="wiki-sidebar-actions">
                    <button
                        className="wiki-search-trigger"
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                        </svg>
                        <span>Поиск...</span>
                        <kbd>Ctrl+K</kbd>
                    </button>
                </div>

                <nav className="wiki-sidebar-nav">
                    {/* Home Page Pinned */}
                    {homePage && (
                        <div className="wiki-sidebar-pinned">
                            <Link
                                href="/wiki/home"
                                className={`wiki-sidebar-link home-link ${currentPageId === 'home' ? 'active' : ''}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                <span className="wiki-sidebar-title">Главная</span>
                            </Link>
                        </div>
                    )}

                    {/* Categorized pages */}
                    {categoryNames.map(category => (
                        <div key={category} className="wiki-sidebar-group">
                            <div className="wiki-sidebar-group-title">{category}</div>
                            {groupedPages[category].map(page => renderPageItem(page))}
                        </div>
                    ))}

                    {/* Uncategorized pages */}
                    {uncategorizedPages.length > 0 && (
                        <div className="wiki-sidebar-group">
                            {categoryNames.length > 0 && <div className="wiki-sidebar-group-title">Разное</div>}
                            {uncategorizedPages.map(page => renderPageItem(page))}
                        </div>
                    )}
                </nav>

                {canEdit && (
                    <div className="wiki-sidebar-footer">
                        <Link href="/wiki/new" className="wiki-sidebar-new-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Новая страница
                        </Link>
                    </div>
                )}
            </aside>
        </>
    );
}

