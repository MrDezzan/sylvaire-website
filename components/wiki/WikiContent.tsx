'use client';

import Link from 'next/link';
import { useWiki } from '@/lib/wiki-context';

interface WikiContentProps {
    pageId: string;
}

// Simple markdown renderer
function renderMarkdown(content: string): string {
    let html = content;

    // Escape HTML first
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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

    // Bold and italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links - internal wiki links
    html = html.replace(/\[([^\]]+)\]\(\/wiki\/([^)]+)\)/g, '<a href="/wiki/$2" class="wiki-link">$1</a>');
    // Links - external
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="wiki-link external">$1</a>');

    // Blockquotes
    html = html.replace(/^> \*\*(.+?)\*\* (.+)$/gm, '<blockquote class="wiki-blockquote"><strong>$1</strong> $2</blockquote>');
    html = html.replace(/^> (.+)$/gm, '<blockquote class="wiki-blockquote">$1</blockquote>');

    // Tables
    html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        // Check if it's a separator row
        if (cells.every((cell: string) => /^-+$/.test(cell))) {
            return '<!-- table separator -->';
        }
        const isHeader = content.includes('---');
        const cellTag = isHeader ? 'th' : 'td';
        const cellsHtml = cells.map((cell: string) => `<${cellTag}>${cell}</${cellTag}>`).join('');
        return `<tr>${cellsHtml}</tr>`;
    });

    // Wrap table rows
    html = html.replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table class="wiki-table"><tbody>$1</tbody></table>');
    // Remove separator comments
    html = html.replace(/<!-- table separator -->\n?/g, '');

    // Lists - unordered
    html = html.replace(/^- (.+)$/gm, '<li class="wiki-li">$1</li>');
    html = html.replace(/((?:<li class="wiki-li">.*<\/li>\n?)+)/g, '<ul class="wiki-ul">$1</ul>');

    // Lists - ordered
    html = html.replace(/^\d+\. (.+)$/gm, '<li class="wiki-li-ordered">$1</li>');
    html = html.replace(/((?:<li class="wiki-li-ordered">.*<\/li>\n?)+)/g, '<ol class="wiki-ol">$1</ol>');

    // Paragraphs (lines not already wrapped)
    html = html.split('\n\n').map(block => {
        if (block.startsWith('<') || block.trim() === '') return block;
        return `<p class="wiki-p">${block}</p>`;
    }).join('\n');

    // Line breaks
    html = html.replace(/\n(?!<)/g, '<br>');

    return html;
}

export default function WikiContent({ pageId }: WikiContentProps) {
    const { currentPage, navigation, canEdit, loading } = useWiki();

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

    return (
        <article className="wiki-content">
            <header className="wiki-content-header">
                <div className="wiki-content-meta">
                    {currentPage.icon && (
                        <span className="wiki-content-icon">{currentPage.icon}</span>
                    )}
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
