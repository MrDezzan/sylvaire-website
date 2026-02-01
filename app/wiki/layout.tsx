'use client';

import { ReactNode } from 'react';
import { WikiProvider } from '@/lib/wiki-context';
import WikiSidebar from '@/components/wiki/WikiSidebar';
import WikiSearch from '@/components/wiki/WikiSearch';

export default function WikiLayout({ children }: { children: ReactNode }) {
    return (
        <WikiProvider>
            <div className="wiki-layout">
                <WikiSidebar />
                <main className="wiki-main">
                    {children}
                </main>
                <WikiSearch />
            </div>
        </WikiProvider>
    );
}
