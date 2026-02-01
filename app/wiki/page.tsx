'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWiki } from '@/lib/wiki-context';
import WikiContent from '@/components/wiki/WikiContent';

export default function WikiHomePage() {
    const router = useRouter();
    const { loading, loadPage, pages } = useWiki();

    useEffect(() => {
        if (!loading) {
            // Load home page or redirect to first page
            const homePage = pages.find(p => p.id === 'home');
            if (homePage) {
                loadPage('home');
            } else if (pages.length > 0) {
                router.replace(`/wiki/${pages[0].id}`);
            }
        }
    }, [loading, pages, loadPage, router]);

    if (loading) {
        return (
            <div className="wiki-content-loading">
                <div className="wiki-loading-spinner" />
                <p>Загрузка Wiki...</p>
            </div>
        );
    }

    return <WikiContent pageId="home" />;
}
