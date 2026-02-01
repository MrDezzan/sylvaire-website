/**
 * Wiki Storage - API-based storage for wiki pages
 */

export interface WikiPage {
    id: string;           // Unique slug (e.g., "getting-started")
    title: string;        // Page title
    content: string;      // Markdown content
    parentId?: string;    // Parent page ID for hierarchy
    category?: string;    // Category for grouping
    order: number;        // Order in menu
    icon?: string;        // @deprecated Emoji icon (will be removed from UI)
    createdAt: string;
    updatedAt: string;
    createdBy: string;    // Author username
}

export interface WikiStructure {
    pages: WikiPage[];
    version: number;
}

/**
 * Fetch all pages from API
 */
export async function fetchWiki(): Promise<WikiPage[]> {
    try {
        const res = await fetch('/api/wiki', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch wiki');
        const data = await res.json();
        return data.pages || [];
    } catch (e) {
        console.error('[Wiki] API Fetch Error:', e);
        return [];
    }
}

/**
 * Create a new page via API
 */
export async function apiCreatePage(page: Omit<WikiPage, 'createdAt' | 'updatedAt' | 'order' | 'createdBy'>): Promise<WikiPage | null> {
    try {
        const res = await fetch('/api/wiki', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(page),
        });
        if (!res.ok) throw new Error('Failed to create page');
        return await res.json();
    } catch (e) {
        console.error('[Wiki] API Create Error:', e);
        return null;
    }
}

/**
 * Update a page via API
 */
export async function apiUpdatePage(id: string, updates: Partial<WikiPage>): Promise<WikiPage | null> {
    try {
        const res = await fetch(`/api/wiki/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update page');
        return await res.json();
    } catch (e) {
        console.error('[Wiki] API Update Error:', e);
        return null;
    }
}

/**
 * Delete a page via API
 */
export async function apiDeletePage(id: string): Promise<boolean> {
    try {
        const res = await fetch(`/api/wiki/${id}`, {
            method: 'DELETE',
        });
        return res.ok;
    } catch (e) {
        console.error('[Wiki] API Delete Error:', e);
        return false;
    }
}

// ------------------------------------------------------------------
// Local Helper Functions (Client-side logic for tree/nav generation)
// ------------------------------------------------------------------

/**
 * Get pages organized by hierarchy (requires pages to be passed in)
 */
export function buildPageTree(pages: WikiPage[]): WikiPage[] {
    // Get root pages (no parent or parent is undefined)
    return pages
        .filter(p => !p.parentId)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get child pages for a parent (requires pages to be passed in)
 */
export function getChildren(pages: WikiPage[], parentId: string): WikiPage[] {
    return pages
        .filter(p => p.parentId === parentId)
        .sort((a, b) => a.order - b.order);
}

/**
 * Generate a unique slug from title (Client-side suggestion, server validates)
 */
export function generateSlug(title: string, existingPages: WikiPage[]): string {
    const translitMap: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    };

    let slug = title.toLowerCase();

    // Transliterate Russian characters
    slug = slug.split('').map(char => translitMap[char] || char).join('');

    // Replace spaces and special characters
    slug = slug
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Ensure uniqueness
    let uniqueSlug = slug;
    let counter = 1;

    while (existingPages.some(p => p.id === uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
}

/**
 * Get navigation structure for prev/next
 */
export function getNavigation(pages: WikiPage[], currentId: string): { prev: WikiPage | null; next: WikiPage | null } {
    const sorted = [...pages].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(p => p.id === currentId);

    return {
        prev: currentIndex > 0 ? sorted[currentIndex - 1] : null,
        next: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
    };
}
