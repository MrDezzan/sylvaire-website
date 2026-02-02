'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    WikiPage,
    fetchWiki,
    apiCreatePage,
    apiUpdatePage,
    apiDeletePage,
    buildPageTree,
    getChildren as getChildPages,
    getNavigation,
    generateSlug
} from './wiki-storage';
import { useAuth } from './auth-context';

interface WikiContextType {
    // Data
    pages: WikiPage[];
    currentPage: WikiPage | null;
    pageTree: WikiPage[];

    // Navigation
    navigation: { prev: WikiPage | null; next: WikiPage | null };

    // Search
    searchQuery: string;
    searchResults: WikiPage[];
    isSearchOpen: boolean;
    setSearchQuery: (query: string) => void;
    setIsSearchOpen: (open: boolean) => void;

    // Loading states
    loading: boolean;

    // Admin actions
    canEdit: boolean;
    createPage: (title: string, content: string, parentId?: string, icon?: string, category?: string) => Promise<WikiPage | null>;
    updatePageContent: (id: string, content: string) => Promise<boolean>;
    updatePageMeta: (id: string, updates: { title?: string; icon?: string; parentId?: string; category?: string }) => Promise<boolean>;
    removePage: (id: string) => Promise<boolean>;

    // Utils
    loadPage: (id: string) => void;
    getChildren: (parentId: string) => WikiPage[];
    refresh: () => Promise<void>;
}

const WikiContext = createContext<WikiContextType | null>(null);

// Users who can always edit wiki
const WIKI_EDITORS = ['IDezzan'];

export function WikiProvider({ children, initialPageId }: { children: ReactNode; initialPageId?: string }) {
    const { user, isAdmin, canManageTags } = useAuth();

    const [pages, setPages] = useState<WikiPage[]>([]);
    const [pageTree, setPageTree] = useState<WikiPage[]>([]);
    const [currentPage, setCurrentPage] = useState<WikiPage | null>(null);
    const [navigation, setNavigation] = useState<{ prev: WikiPage | null; next: WikiPage | null }>({ prev: null, next: null });
    const [loading, setLoading] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<WikiPage[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Can edit if user is admin, can manage tags, or is in the editors list
    const canEdit = isAdmin || canManageTags || (user ? WIKI_EDITORS.includes(user.username) : false);

    // Load all pages
    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const allPages = await fetchWiki();
            const tree = buildPageTree(allPages);
            setPages(allPages);
            setPageTree(tree);

            // If we have a current page, refresh its data reference from the new list
            if (currentPage) {
                const refreshedPage = allPages.find(p => p.id === currentPage.id);
                if (refreshedPage) {
                    setCurrentPage(refreshedPage);
                    setNavigation(getNavigation(allPages, refreshedPage.id));
                }
            }
        } catch (e) {
            console.error('[Wiki] Failed to load pages:', e);
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    // Load specific page (synchronous lookup from loaded pages)
    const loadPage = useCallback((id: string) => {
        const page = pages.find(p => p.id === id) || null;
        setCurrentPage(page);

        if (page) {
            setNavigation(getNavigation(pages, id));
        } else {
            setNavigation({ prev: null, next: null });
        }
    }, [pages]);

    // Get children of a page
    const getChildren = useCallback((parentId: string) => {
        return getChildPages(pages, parentId);
    }, [pages]);

    // Search effect
    useEffect(() => {
        if (searchQuery.trim() && pages.length > 0) {
            const lowerQuery = searchQuery.toLowerCase();
            const results = pages.filter(page =>
                page.title.toLowerCase().includes(lowerQuery) ||
                page.content.toLowerCase().includes(lowerQuery)
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, pages]);

    // Initial load
    useEffect(() => {
        refresh();
    }, []); // Run once on mount

    // Load initial page if provided and pages are loaded
    useEffect(() => {
        if (initialPageId && !loading && pages.length > 0) {
            loadPage(initialPageId);
        }
    }, [initialPageId, loading, pages.length, loadPage]);

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setSearchQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Admin actions
    const createPage = useCallback(async (title: string, content: string, parentId?: string, icon?: string, category?: string): Promise<WikiPage | null> => {
        if (!canEdit || !user) return null;

        try {
            const slug = generateSlug(title, pages);

            const newPage = await apiCreatePage({
                id: slug,
                title,
                content,
                parentId,
                icon,
                category,
            }, user.token);

            if (newPage) {
                await refresh();
                return newPage;
            }
            return null;
        } catch (e) {
            console.error('[Wiki] Failed to create page:', e);
            return null;
        }
    }, [canEdit, user, pages, refresh]);

    const updatePageContent = useCallback(async (id: string, content: string): Promise<boolean> => {
        if (!canEdit) return false;

        try {
            const updated = await apiUpdatePage(id, { content }, user?.token);
            if (updated) {
                await refresh();
                return true;
            }
            return false;
        } catch (e) {
            console.error('[Wiki] Failed to update page content:', e);
            return false;
        }
    }, [canEdit, refresh]);

    const updatePageMeta = useCallback(async (id: string, updates: { title?: string; icon?: string; parentId?: string; category?: string }): Promise<boolean> => {
        if (!canEdit) return false;

        try {
            const updated = await apiUpdatePage(id, updates, user?.token);
            if (updated) {
                await refresh();
                return true;
            }
            return false;
        } catch (e) {
            console.error('[Wiki] Failed to update page meta:', e);
            return false;
        }
    }, [canEdit, refresh]);

    const removePage = useCallback(async (id: string): Promise<boolean> => {
        if (!canEdit) return false;

        // Don't allow deleting home page
        if (id === 'home') {
            console.warn('[Wiki] Cannot delete home page');
            return false;
        }

        try {
            const success = await apiDeletePage(id, user?.token);
            if (success) {
                await refresh();
                if (currentPage?.id === id) {
                    setCurrentPage(null);
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('[Wiki] Failed to delete page:', e);
            return false;
        }
    }, [canEdit, currentPage, refresh]);

    return (
        <WikiContext.Provider value={{
            pages,
            currentPage,
            pageTree,
            navigation,
            searchQuery,
            searchResults,
            isSearchOpen,
            setSearchQuery,
            setIsSearchOpen,
            loading,
            canEdit,
            createPage,
            updatePageContent,
            updatePageMeta,
            removePage,
            loadPage,
            getChildren,
            refresh,
        }}>
            {children}
        </WikiContext.Provider>
    );
}

export function useWiki() {
    const context = useContext(WikiContext);
    if (!context) {
        throw new Error('useWiki must be used within a WikiProvider');
    }
    return context;
}
