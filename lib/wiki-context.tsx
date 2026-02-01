'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    WikiPage,
    getAllPages,
    getPage,
    getPageTree,
    getChildPages,
    createPage as storageCreatePage,
    updatePage as storageUpdatePage,
    deletePage as storageDeletePage,
    searchPages as storageSearchPages,
    generateSlug,
    getNavigation,
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
    createPage: (title: string, content: string, parentId?: string, icon?: string, category?: string) => WikiPage | null;
    updatePageContent: (id: string, content: string) => boolean;
    updatePageMeta: (id: string, updates: { title?: string; icon?: string; parentId?: string; category?: string }) => boolean;
    removePage: (id: string) => boolean;

    // Utils
    loadPage: (id: string) => void;
    getChildren: (parentId: string) => WikiPage[];
    refresh: () => void;
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
    const refresh = useCallback(() => {
        setLoading(true);
        try {
            const allPages = getAllPages();
            const tree = getPageTree();
            setPages(allPages);
            setPageTree(tree);
        } catch (e) {
            console.error('[Wiki] Failed to load pages:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load specific page
    const loadPage = useCallback((id: string) => {
        const page = getPage(id);
        setCurrentPage(page);

        if (page) {
            setNavigation(getNavigation(id));
        } else {
            setNavigation({ prev: null, next: null });
        }
    }, []);

    // Get children of a page
    const getChildren = useCallback((parentId: string) => {
        return getChildPages(parentId);
    }, []);

    // Search effect
    useEffect(() => {
        if (searchQuery.trim()) {
            const results = storageSearchPages(searchQuery);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    // Initial load
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Load initial page if provided
    useEffect(() => {
        if (initialPageId && !loading) {
            loadPage(initialPageId);
        }
    }, [initialPageId, loading, loadPage]);

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
    const createPage = useCallback((title: string, content: string, parentId?: string, icon?: string, category?: string): WikiPage | null => {
        if (!canEdit || !user) return null;

        try {
            const slug = generateSlug(title);
            const maxOrder = Math.max(...pages.map(p => p.order), -1);

            const newPage = storageCreatePage({
                id: slug,
                title,
                content,
                parentId,
                icon,
                category,
                order: maxOrder + 1,
                createdBy: user.username,
            });

            refresh();
            return newPage;
        } catch (e) {
            console.error('[Wiki] Failed to create page:', e);
            return null;
        }
    }, [canEdit, user, pages, refresh]);

    const updatePageContent = useCallback((id: string, content: string): boolean => {
        if (!canEdit) return false;

        try {
            const updated = storageUpdatePage(id, { content });
            if (updated) {
                refresh();
                if (currentPage?.id === id) {
                    setCurrentPage(updated);
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('[Wiki] Failed to update page content:', e);
            return false;
        }
    }, [canEdit, currentPage, refresh]);

    const updatePageMeta = useCallback((id: string, updates: { title?: string; icon?: string; parentId?: string; category?: string }): boolean => {
        if (!canEdit) return false;

        try {
            const updated = storageUpdatePage(id, updates);
            if (updated) {
                refresh();
                if (currentPage?.id === id) {
                    setCurrentPage(updated);
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('[Wiki] Failed to update page meta:', e);
            return false;
        }
    }, [canEdit, currentPage, refresh]);

    const removePage = useCallback((id: string): boolean => {
        if (!canEdit) return false;

        // Don't allow deleting home page
        if (id === 'home') {
            console.warn('[Wiki] Cannot delete home page');
            return false;
        }

        try {
            const deleted = storageDeletePage(id);
            if (deleted) {
                refresh();
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
