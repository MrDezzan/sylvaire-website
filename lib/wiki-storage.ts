/**
 * Wiki Storage - API-based storage for wiki pages
 * With robust cycle detection to prevent infinite recursion
 */
import { api } from './api';

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
export async function fetchWiki(token?: string): Promise<WikiPage[]> {
    try {
        const data = await api<{ pages: WikiPage[] }>('/api/wiki', {
            cache: 'no-store',
            token
        });
        return data.pages || [];
    } catch (e) {
        console.error('[Wiki] API Fetch Error:', e);
        return [];
    }
}

/**
 * Create a new page via API
 */
export async function apiCreatePage(page: Omit<WikiPage, 'createdAt' | 'updatedAt' | 'order' | 'createdBy'>, token?: string): Promise<WikiPage | null> {
    try {
        console.log('[Wiki] Creating page with token:', token ? (token.substring(0, 5) + '...') : 'null');
        return await api<WikiPage>('/api/wiki', {
            method: 'POST',
            body: JSON.stringify(page),
            token,
        });
    } catch (e) {
        console.error('[Wiki] API Create Error:', e);
        return null;
    }
}

/**
 * Update a page via API
 */
export async function apiUpdatePage(id: string, updates: Partial<WikiPage>, token?: string): Promise<WikiPage | null> {
    try {
        console.log('[Wiki] Updating page with token:', token ? (token.substring(0, 5) + '...') : 'null');
        return await api<WikiPage>(`/api/wiki/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
            token,
        });
    } catch (e) {
        console.error('[Wiki] API Update Error:', e);
        return null;
    }
}

/**
 * Delete a page via API
 */
export async function apiDeletePage(id: string, token?: string): Promise<boolean> {
    try {
        await api(`/api/wiki/${id}`, {
            method: 'DELETE',
            token,
        });
        return true;
    } catch (e) {
        console.error('[Wiki] API Delete Error:', e);
        return false;
    }
}

// ------------------------------------------------------------------
// Local Helper Functions (Client-side logic for tree/nav generation)
// WITH CYCLE DETECTION
// ------------------------------------------------------------------

/**
 * Sanitize pages to remove circular references
 * This detects and breaks cycles in the parent-child relationships
 */
export function sanitizePages(pages: WikiPage[]): WikiPage[] {
    const idSet = new Set(pages.map(p => p.id));
    const sanitized: WikiPage[] = [];

    for (const page of pages) {
        // If parentId points to non-existent page, clear it
        if (page.parentId && !idSet.has(page.parentId)) {
            console.warn(`[Wiki] Page "${page.id}" has invalid parentId "${page.parentId}", clearing`);
            sanitized.push({ ...page, parentId: undefined });
            continue;
        }

        // If parentId points to itself, clear it
        if (page.parentId === page.id) {
            console.warn(`[Wiki] Page "${page.id}" has self-referential parentId, clearing`);
            sanitized.push({ ...page, parentId: undefined });
            continue;
        }

        sanitized.push(page);
    }

    // Now detect cycles using ancestor check
    const pageMap = new Map(sanitized.map(p => [p.id, p]));
    const result: WikiPage[] = [];

    for (const page of sanitized) {
        if (hasCycle(page.id, pageMap)) {
            console.warn(`[Wiki] Cycle detected involving page "${page.id}", clearing parentId`);
            result.push({ ...page, parentId: undefined });
        } else {
            result.push(page);
        }
    }

    return result;
}

/**
 * Check if a page is involved in a cycle
 */
function hasCycle(pageId: string, pageMap: Map<string, WikiPage>): boolean {
    const visited = new Set<string>();
    let current = pageId;

    while (current) {
        if (visited.has(current)) {
            return true; // Cycle detected
        }
        visited.add(current);

        const page = pageMap.get(current);
        if (!page) break;

        current = page.parentId || '';
    }

    return false;
}

/**
 * Get pages organized by hierarchy (requires pages to be passed in)
 * Returns only root-level pages (pages without parents)
 */
export function buildPageTree(pages: WikiPage[]): WikiPage[] {
    // First sanitize to remove any cycles
    const safe = sanitizePages(pages);

    // Get root pages (no parent or parent is undefined)
    return safe
        .filter(p => !p.parentId)
        .sort((a, b) => a.order - b.order);
}

/**
 * Get child pages for a parent (requires pages to be passed in)
 * With safety limit to prevent deep recursion
 */
export function getChildren(pages: WikiPage[], parentId: string, depth: number = 0): WikiPage[] {
    // Safety limit - prevent too deep nesting
    if (depth > 10) {
        console.warn(`[Wiki] Max depth reached when getting children for "${parentId}"`);
        return [];
    }

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
    let uniqueSlug = slug || 'page';
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
