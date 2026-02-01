/**
 * Wiki Storage - LocalStorage-based storage for wiki pages
 * Can be migrated to backend API later
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
    version: number;      // For future migrations
}

const STORAGE_KEY = 'sylvaire_wiki';
const CURRENT_VERSION = 1;

// Default wiki content
const DEFAULT_WIKI: WikiStructure = {
    version: CURRENT_VERSION,
    pages: [
        {
            id: 'home',
            title: 'Добро пожаловать',
            content: `# Добро пожаловать в Wiki Sylvaire!

Это официальная документация сервера Sylvaire. Здесь вы найдёте всю необходимую информацию для комфортной игры.

## 🚀 Начало работы

- Ознакомьтесь с [правилами сервера](/wiki/rules)
- Изучите [гайд для новичков](/wiki/getting-started)
- Присоединяйтесь к нашему [Discord](https://dsc.gg/sylvaire)

## 📚 Разделы

Используйте боковое меню для навигации по разделам документации.

> **Совет:** Нажмите \`Ctrl+K\` для быстрого поиска по wiki.
`,
            order: 0,
            category: 'Главная',
            icon: '🏠',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'System',
        },
        {
            id: 'getting-started',
            title: 'Начало игры',
            content: `# Начало игры

## Как подключиться

1. Откройте Minecraft версии **1.21.8**
2. Добавьте сервер: \`play.sylvaire.ru\`
3. Подключитесь и начните приключение!

## Первые шаги

После входа на сервер вы окажетесь в спавне. Отсюда вы можете:

- Изучить основные команды
- Найти место для постройки
- Познакомиться с другими игроками

## Полезные команды

| Команда | Описание |
|---------|----------|
| \`/spawn\` | Телепорт на спавн |
| \`/sethome\` | Установить точку дома |
| \`/home\` | Телепорт домой |
| \`/tpa <ник>\` | Запрос на телепорт к игроку |
`,
            parentId: 'home',
            order: 1,
            category: 'Гайды',
            icon: '🎮',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'System',
        },
        {
            id: 'rules',
            title: 'Правила сервера',
            content: `# Правила сервера

## Общие правила

1. **Уважайте других игроков** — оскорбления, токсичность и троллинг запрещены
2. **Не используйте читы** — любые модификации, дающие преимущество, запрещены
3. **Не гриферьте** — разрушение чужих построек карается баном
4. **Играйте честно** — дюпы, эксплойты и баги использовать нельзя

## Правила чата

- Не спамьте
- Не рекламируйте другие сервера
- Используйте русский или английский язык
- Не просите привилегии у администрации

## Наказания

| Нарушение | Наказание |
|-----------|-----------|
| Первое предупреждение | Мут 30 минут |
| Повторное нарушение | Мут 24 часа |
| Грифинг | Бан от 7 дней |
| Читы | Перманентный бан |

> Администрация оставляет за собой право изменять наказания в зависимости от тяжести нарушения.
`,
            parentId: 'home',
            order: 2,
            category: 'Информация',
            icon: '📜',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'System',
        },
    ],
};

/**
 * Get wiki structure from storage
 */
export function getWikiStructure(): WikiStructure {
    if (typeof window === 'undefined') {
        return DEFAULT_WIKI;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored) as WikiStructure;
            // Migration logic can be added here based on version
            return data;
        }
    } catch (e) {
        console.error('[Wiki] Failed to load wiki structure:', e);
    }

    // Initialize with default content
    saveWikiStructure(DEFAULT_WIKI);
    return DEFAULT_WIKI;
}

/**
 * Save wiki structure to storage
 */
export function saveWikiStructure(structure: WikiStructure): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(structure));
    } catch (e) {
        console.error('[Wiki] Failed to save wiki structure:', e);
    }
}

/**
 * Get all pages
 */
export function getAllPages(): WikiPage[] {
    return getWikiStructure().pages;
}

/**
 * Get a single page by ID (slug)
 */
export function getPage(id: string): WikiPage | null {
    const pages = getAllPages();
    return pages.find(p => p.id === id) || null;
}

/**
 * Get pages organized by hierarchy
 */
export function getPageTree(): WikiPage[] {
    const pages = getAllPages();

    // Get root pages (no parent or parent is undefined)
    const rootPages = pages
        .filter(p => !p.parentId)
        .sort((a, b) => a.order - b.order);

    return rootPages;
}

/**
 * Get child pages for a parent
 */
export function getChildPages(parentId: string): WikiPage[] {
    const pages = getAllPages();
    return pages
        .filter(p => p.parentId === parentId)
        .sort((a, b) => a.order - b.order);
}

/**
 * Create a new page
 */
export function createPage(page: Omit<WikiPage, 'createdAt' | 'updatedAt'>): WikiPage {
    const structure = getWikiStructure();

    // Check if ID already exists
    if (structure.pages.some(p => p.id === page.id)) {
        throw new Error(`Page with ID "${page.id}" already exists`);
    }

    const now = new Date().toISOString();
    const newPage: WikiPage = {
        ...page,
        createdAt: now,
        updatedAt: now,
    };

    structure.pages.push(newPage);
    saveWikiStructure(structure);

    return newPage;
}

/**
 * Update an existing page
 */
export function updatePage(id: string, updates: Partial<Omit<WikiPage, 'id' | 'createdAt'>>): WikiPage | null {
    const structure = getWikiStructure();
    const pageIndex = structure.pages.findIndex(p => p.id === id);

    if (pageIndex === -1) {
        return null;
    }

    const updatedPage: WikiPage = {
        ...structure.pages[pageIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
    };

    structure.pages[pageIndex] = updatedPage;
    saveWikiStructure(structure);

    return updatedPage;
}

/**
 * Delete a page
 */
export function deletePage(id: string): boolean {
    const structure = getWikiStructure();
    const pageIndex = structure.pages.findIndex(p => p.id === id);

    if (pageIndex === -1) {
        return false;
    }

    // Also update children to remove parent reference
    structure.pages.forEach(p => {
        if (p.parentId === id) {
            p.parentId = undefined;
        }
    });

    structure.pages.splice(pageIndex, 1);
    saveWikiStructure(structure);

    return true;
}

/**
 * Reorder pages
 */
export function reorderPages(pageIds: string[]): void {
    const structure = getWikiStructure();

    pageIds.forEach((id, index) => {
        const page = structure.pages.find(p => p.id === id);
        if (page) {
            page.order = index;
        }
    });

    saveWikiStructure(structure);
}

/**
 * Search pages by title and content
 */
export function searchPages(query: string): WikiPage[] {
    if (!query.trim()) return [];

    const pages = getAllPages();
    const lowerQuery = query.toLowerCase();

    return pages.filter(page =>
        page.title.toLowerCase().includes(lowerQuery) ||
        page.content.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Generate a unique slug from title
 */
export function generateSlug(title: string): string {
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
    const pages = getAllPages();
    let uniqueSlug = slug;
    let counter = 1;

    while (pages.some(p => p.id === uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
}

/**
 * Get navigation structure for prev/next
 */
export function getNavigation(currentId: string): { prev: WikiPage | null; next: WikiPage | null } {
    const pages = getAllPages().sort((a, b) => a.order - b.order);
    const currentIndex = pages.findIndex(p => p.id === currentId);

    return {
        prev: currentIndex > 0 ? pages[currentIndex - 1] : null,
        next: currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null,
    };
}
