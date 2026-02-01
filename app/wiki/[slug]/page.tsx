'use client';

import { useEffect, use } from 'react';
import { useWiki } from '@/lib/wiki-context';
import WikiContent from '@/components/wiki/WikiContent';

interface WikiPageProps {
    params: Promise<{ slug: string }>;
}

export default function WikiPage({ params }: WikiPageProps) {
    const { slug } = use(params);
    const { loadPage } = useWiki();

    useEffect(() => {
        loadPage(slug);
    }, [slug, loadPage]);

    return <WikiContent pageId={slug} />;
}
