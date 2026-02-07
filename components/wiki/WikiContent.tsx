'use client';

import Link from 'next/link';
import { useWiki } from '@/lib/wiki-context';
import WikiPageCards from './WikiPageCards';

interface WikiContentProps {
    pageId: string;
}

// Simple markdown renderer with GitBook-style blocks support
function renderMarkdown(content: string): string {
    if (!content) return '';
    let html = content;

    // Process GitBook-style blocks BEFORE escaping HTML

    // Hint blocks
    html = html.replace(/{%\s*hint\s+style="(\w+)"\s*%}([\s\S]*?){%\s*endhint\s*%}/g, (_, style, text) => {
        const icons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅', danger: '🚫' };
        return `<div class="wiki-hint-block ${style}"><span class="wiki-hint-icon">${icons[style] || 'ℹ️'}</span><div>${text.trim()}</div></div>`;
    });

    // Content refs (page link cards)
    html = html.replace(/{% content-ref url="([^"]+)" %}([\s\S]*?){% endcontent-ref %}/g, (_, url, text) => {
        return `<a href="${url}" class="wiki-page-link-card">${text.trim()}</a>`;
    });

    // Tabs (basic rendering)
    html = html.replace(/{% tabs %}([\s\S]*?){% endtabs %}/g, (_, tabsContent) => {
        const tabs: { title: string; content: string }[] = [];
        const tabRegex = /{% tab title="([^"]+)" %}([\s\S]*?){% endtab %}/g;
        let tabMatch;
        while ((tabMatch = tabRegex.exec(tabsContent)) !== null) {
            tabs.push({ title: tabMatch[1], content: tabMatch[2].trim() });
        }
        if (tabs.length === 0) return tabsContent;

        const tabsHtml = tabs.map((tab, i) =>
            `<button class="wiki-tab-btn${i === 0 ? ' active' : ''}" data-tab="${i}">${tab.title}</button>`
        ).join('');
        const contentHtml = tabs.map((tab, i) =>
            `<div class="wiki-tab-content${i === 0 ? ' active' : ''}" data-tab="${i}">${tab.content}</div>`
        ).join('');

        return `<div class="wiki-tabs"><div class="wiki-tabs-header">${tabsHtml}</div><div class="wiki-tabs-body">${contentHtml}</div></div>`;
    });

    // Expandable/details blocks  
    html = html.replace(/<details>([\s\S]*?)<\/details>/g, (_, content) => {
        const summaryMatch = content.match(/<summary>([\s\S]*?)<\/summary>/);
        const summary = summaryMatch ? summaryMatch[1].trim() : 'Подробнее';
        const body = content.replace(/<summary>[\s\S]*?<\/summary>/, '').trim();
        return `<details class="wiki-expandable"><summary class="wiki-expandable-summary">${summary}</summary><div class="wiki-expandable-content">${body}</div></details>`;
    });

    // Escape HTML
    html = html.replace(/&(?!amp;|lt;|gt;)/g, '&amp;');

    // But don't double escape existing blocks
    const preservedBlocks: string[] = [];
    html = html.replace(/<(div|a|details|button|span)[^>]*>[\s\S]*?<\/\1>/g, (match) => {
        preservedBlocks.push(match);
        return `__PRESERVED_${preservedBlocks.length - 1}__`;
    });

    // Now escape remaining HTML
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Restore preserved blocks
    preservedBlocks.forEach((block, i) => {
        html = html.replace(`__PRESERVED_${i}__`, block);
    });

    // Code blocks (must be before inline code)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre class="wiki-code-block" data-lang="${lang}"><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="wiki-inline-code">$1</code>');

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="wiki-h3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="wiki-h2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="wiki-h1">$1</h1>');

    // Bold, italic, strikethrough
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr class="wiki-hr">');

    // Checkboxes
    html = html.replace(/^- \[ \] (.+)$/gm, '<div class="wiki-checkbox"><input type="checkbox" disabled><span>$1</span></div>');
    html = html.replace(/^- \[x\] (.+)$/gm, '<div class="wiki-checkbox checked"><input type="checkbox" checked disabled><span>$1</span></div>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="wiki-figure"><img src="$2" alt="$1" class="wiki-img"><figcaption>$1</figcaption></figure>');

    // Links - internal wiki links
    html = html.replace(/\[([^\]]+)\]\(\/wiki\/([^)]+)\)/g, '<a href="/wiki/$2" class="wiki-link">$1</a>');
    // Links - external
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="wiki-link external">$1</a>');

    // Blockquotes
    html = html.replace(/^&gt; \*\*(.+?)\*\* (.+)$/gm, '<blockquote class="wiki-blockquote"><strong>$1</strong> $2</blockquote>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="wiki-blockquote">$1</blockquote>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        if (cells.every((cell: string) => /^-+$/.test(cell))) {
            return '<!-- table separator -->';
        }
        const isHeader = content.includes('---');
        const cellTag = isHeader ? 'th' : 'td';
        const cellsHtml = cells.map((cell: string) => `<${cellTag}>${cell}</${cellTag}>`).join('');
        return `<tr>${cellsHtml}</tr>`;
    });
    html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table class="wiki-table"><tbody>$1</tbody></table>');
    html = html.replace(/<!-- table separator -->\n?/g, '');

    // Lists - unordered
    html = html.replace(/^- (.+)$/gm, '<li class="wiki-li">$1</li>');
    html = html.replace(/((?:<li class="wiki-li">.*<\/li>\n?)+)/g, '<ul class="wiki-ul">$1</ul>');

    // Lists - ordered
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="wiki-li-ordered">$1</li>');
    html = html.replace(/((?:<li class="wiki-li-ordered">.*<\/li>\n?)+)/g, '<ol class="wiki-ol">$1</ol>');

    // Paragraphs
    html = html.split('\n\n').map(block => {
        if (block.startsWith('<') || block.trim() === '') return block;
        return `<p class="wiki-p">${block}</p>`;
    }).join('\n');

    // Line breaks
    html = html.replace(/\n(?!<)/g, '<br>');

    return html;
}


export default function WikiContent({ pageId }: WikiContentProps) {
    const { currentPage, navigation, canEdit, loading, getChildren } = useWiki();

    if (loading) {
        return (
            <div className="wiki-content-loading">
                <div className="wiki-loading-spinner" />
                <p>Загрузка...</p>
            </div>
        );
    }

    if (!currentPage) {
        return (
            <div className="wiki-content-empty">
                <div className="wiki-empty-icon">📄</div>
                <h2>Страница не найдена</h2>
                <p>Запрашиваемая страница не существует.</p>
                <Link href="/wiki" className="btn primary">
                    На главную Wiki
                </Link>
            </div>
        );
    }

    const renderedContent = renderMarkdown(currentPage.content);
    const childPages = getChildren(currentPage.id);

    return (
        <article className="wiki-content">
            <header className="wiki-content-header">
                <div className="wiki-content-meta">
                    <h1 className="wiki-content-title">{currentPage.title}</h1>
                </div>
                {canEdit && (
                    <Link href={`/wiki/edit/${currentPage.id}`} className="wiki-edit-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Редактировать
                    </Link>
                )}
            </header>

            <div
                className="wiki-content-body"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
            />

            {/* Child pages displayed as cards like GitBook */}
            {childPages.length > 0 && (
                <WikiPageCards pages={childPages} />
            )}

            <footer className="wiki-content-footer">
                <div className="wiki-content-updated">
                    Обновлено: {new Date(currentPage.updatedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </div>

                <nav className="wiki-navigation">
                    {navigation.prev && (
                        <Link href={`/wiki/${navigation.prev.id}`} className="wiki-nav-link prev">
                            <span className="wiki-nav-direction">← Назад</span>
                            <span className="wiki-nav-title">{navigation.prev.title}</span>
                        </Link>
                    )}
                    {navigation.next && (
                        <Link href={`/wiki/${navigation.next.id}`} className="wiki-nav-link next">
                            <span className="wiki-nav-direction">Далее →</span>
                            <span className="wiki-nav-title">{navigation.next.title}</span>
                        </Link>
                    )}
                </nav>
            </footer>
        </article>
    );
}
