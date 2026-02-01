'use client';

import { ReactNode } from 'react';
import { WikiProvider } from '@/lib/wiki-context';
import Navbar from '@/components/Navbar';
import WikiSidebar from '@/components/wiki/WikiSidebar';
import WikiSearch from '@/components/wiki/WikiSearch';

export default function WikiLayout({ children }: { children: ReactNode }) {
    return (
        <WikiProvider>
            <Navbar />
            <div className="wiki-layout">
                <WikiSidebar />
                <main className="wiki-main">
                    <div className="wiki-main-inner">
                        {children}
                    </div>
                </main>
                <WikiSearch />
            </div>
        </WikiProvider>
    );
}

