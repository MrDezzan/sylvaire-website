'use client';

import Link from 'next/link';
import { WikiPage } from '@/lib/wiki-storage';

interface WikiPageCardsProps {
    pages: WikiPage[];
    title?: string;
}

export default function WikiPageCards({ pages, title }: WikiPageCardsProps) {
    if (pages.length === 0) return null;

    return (
        <div className="wiki-page-cards">
            {title && <h3 className="wiki-page-cards-title">{title}</h3>}
            <div className="wiki-page-cards-list">
                {pages.map(page => (
                    <Link
                        key={page.id}
                        href={`/wiki/${page.id}`}
                        className="wiki-page-card"
                    >
                        <span className="wiki-page-card-icon">{page.icon || '📄'}</span>
                        <span className="wiki-page-card-title">{page.title}</span>
                        <span className="wiki-page-card-action">View</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
