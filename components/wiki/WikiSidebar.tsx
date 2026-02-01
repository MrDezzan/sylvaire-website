'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useWiki } from '@/lib/wiki-context';
import { WikiPage } from '@/lib/wiki-storage';

interface WikiSidebarProps {
    currentPageId?: string;
}

export default function WikiSidebar({ currentPageId }: WikiSidebarProps) {
    const { pageTree, getChildren, canEdit, setIsSearchOpen } = useWiki();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['home']));

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

    const renderPageItem = (page: WikiPage, depth: number = 0) => {
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
                        {page.icon && <span className="wiki-sidebar-icon">{page.icon}</span>}
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

    return (
        <aside className="wiki-sidebar">
            <div className="wiki-sidebar-header">
                <Link href="/wiki" className="wiki-sidebar-logo">
                    <img src="/assets/logo.png" alt="Sylvaire" />
                    <span>Wiki</span>
                </Link>
            </div>

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

            <nav className="wiki-sidebar-nav">
                {pageTree.map(page => renderPageItem(page))}
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
    );
}
