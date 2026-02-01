'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useWiki } from '@/lib/wiki-context';

interface WikiEditorProps {
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
    saving?: boolean;
}

// Toolbar items
const FORMATTING_TOOLS = [
    { id: 'h1', label: 'Заголовок 1', icon: 'H₁', markdown: '# ', type: 'line' },
    { id: 'h2', label: 'Заголовок 2', icon: 'H₂', markdown: '## ', type: 'line' },
    { id: 'h3', label: 'Заголовок 3', icon: 'H₃', markdown: '### ', type: 'line' },
];

const TEXT_TOOLS = [
    { id: 'bold', label: 'Жирный', icon: 'B', markdown: '**', wrap: true },
    { id: 'italic', label: 'Курсив', icon: 'I', markdown: '*', wrap: true },
    { id: 'strikethrough', label: 'Зачёркнутый', icon: 'S̶', markdown: '~~', wrap: true },
    { id: 'code', label: 'Код', icon: '< >', markdown: '`', wrap: true },
];

const LIST_TOOLS = [
    { id: 'ul', label: 'Список', icon: '•', markdown: '- ', type: 'line' },
    { id: 'ol', label: 'Нумерованный', icon: '1.', markdown: '1. ', type: 'line' },
    { id: 'checklist', label: 'Чеклист', icon: '☑', markdown: '- [ ] ', type: 'line' },
    { id: 'quote', label: 'Цитата', icon: '"', markdown: '> ', type: 'line' },
];

// Block types for insert menu
const BLOCK_TYPES = [
    { id: 'pagelink', label: 'Ссылка на страницу', icon: '📄', description: 'Карточка-ссылка на страницу wiki' },
    { id: 'hint-info', label: 'Подсказка', icon: 'ℹ️', description: 'Информационный блок' },
    { id: 'hint-warning', label: 'Предупреждение', icon: '⚠️', description: 'Блок предупреждения' },
    { id: 'hint-success', label: 'Успех', icon: '✅', description: 'Блок успешного результата' },
    { id: 'hint-danger', label: 'Опасность', icon: '🚫', description: 'Блок важного предупреждения' },
    { id: 'codeblock', label: 'Блок кода', icon: '{ }', description: 'Многострочный код' },
    { id: 'table', label: 'Таблица', icon: '▦', description: 'Таблица с колонками' },
    { id: 'image', label: 'Изображение', icon: '🖼️', description: 'Вставить изображение по URL' },
    { id: 'gif', label: 'GIF', icon: '🎞️', description: 'Вставить GIF-анимацию по URL' },
    { id: 'divider', label: 'Разделитель', icon: '—', description: 'Горизонтальная линия' },
    { id: 'tabs', label: 'Вкладки', icon: '📑', description: 'Контент с вкладками' },
    { id: 'expandable', label: 'Раскрывающийся', icon: '▼', description: 'Скрытый контент' },
];

// Text color presets
const TEXT_COLORS = [
    { id: 'red', label: 'Красный', color: '#ef4444' },
    { id: 'orange', label: 'Оранжевый', color: '#f97316' },
    { id: 'yellow', label: 'Жёлтый', color: '#eab308' },
    { id: 'green', label: 'Зелёный', color: '#22c55e' },
    { id: 'blue', label: 'Синий', color: '#3b82f6' },
    { id: 'purple', label: 'Фиолетовый', color: '#a855f7' },
    { id: 'pink', label: 'Розовый', color: '#ec4899' },
];

export default function WikiEditor({ initialContent, onSave, onCancel, saving = false }: WikiEditorProps) {
    const { pages } = useWiki();
    const [content, setContent] = useState(initialContent);
    const [showPreview, setShowPreview] = useState(false);
    const [showInsertMenu, setShowInsertMenu] = useState(false);
    const [showPageSelector, setShowPageSelector] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [insertMenuPosition, setInsertMenuPosition] = useState({ top: 0, left: 0 });
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const insertMenuRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(500, textarea.scrollHeight) + 'px';
        }
    }, [content]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                onSave(content);
            }
            // Escape closes menus
            if (e.key === 'Escape') {
                setShowInsertMenu(false);
                setShowPageSelector(false);
                setShowColorPicker(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, onSave]);

    // Close menus on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as Node)) {
                setShowInsertMenu(false);
                setShowPageSelector(false);
                setShowColorPicker(false);
            }
        };
        if (showInsertMenu || showPageSelector) {
            document.addEventListener('mousedown', handleClick);
        }
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showInsertMenu, showPageSelector]);

    const insertAtCursor = useCallback((before: string, after: string = '', selectMiddle: boolean = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newText = before + selectedText + after;

        const newContent = content.substring(0, start) + newText + content.substring(end);
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            if (selectMiddle && !selectedText) {
                textarea.setSelectionRange(start + before.length, start + before.length);
            } else {
                textarea.setSelectionRange(start + newText.length, start + newText.length);
            }
        }, 0);
    }, [content]);

    const insertLinePrefix = useCallback((prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;

        const newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart);
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }, 0);
    }, [content]);

    const handleToolClick = useCallback((tool: { markdown?: string; wrap?: boolean; type?: string }) => {
        if (tool.type === 'line' && tool.markdown) {
            insertLinePrefix(tool.markdown);
        } else if (tool.wrap && tool.markdown) {
            insertAtCursor(tool.markdown, tool.markdown, true);
        }
    }, [insertAtCursor, insertLinePrefix]);

    const handleBlockInsert = useCallback((blockId: string) => {
        setShowInsertMenu(false);

        const blocks: Record<string, string> = {
            'hint-info': '\n{% hint style="info" %}\nВаша информация здесь\n{% endhint %}\n',
            'hint-warning': '\n{% hint style="warning" %}\nПредупреждение здесь\n{% endhint %}\n',
            'hint-success': '\n{% hint style="success" %}\nУспешное сообщение\n{% endhint %}\n',
            'hint-danger': '\n{% hint style="danger" %}\nВажное предупреждение\n{% endhint %}\n',
            'codeblock': '\n```javascript\n// Ваш код здесь\n```\n',
            'table': '\n| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n|-------------|-------------|-------------|\n| Ячейка 1    | Ячейка 2    | Ячейка 3    |\n| Ячейка 4    | Ячейка 5    | Ячейка 6    |\n',
            'image': '\n![Описание изображения](URL_ИЗОБРАЖЕНИЯ)\n',
            'gif': '\n![GIF анимация](URL_GIF_ИЗОБРАЖЕНИЯ)\n',
            'divider': '\n---\n',
            'tabs': '\n{% tabs %}\n{% tab title="Вкладка 1" %}\nКонтент первой вкладки\n{% endtab %}\n{% tab title="Вкладка 2" %}\nКонтент второй вкладки\n{% endtab %}\n{% endtabs %}\n',
            'expandable': '\n<details>\n<summary>Нажмите, чтобы раскрыть</summary>\n\nСкрытый контент здесь\n\n</details>\n',
        };

        if (blockId === 'pagelink') {
            setShowPageSelector(true);
        } else if (blocks[blockId]) {
            insertAtCursor(blocks[blockId]);
        }
    }, [insertAtCursor]);

    const handlePageLinkInsert = useCallback((pageId: string, pageTitle: string, pageIcon: string) => {
        setShowPageSelector(false);
        setShowInsertMenu(false);
        const pageLink = `\n{% content-ref url="/wiki/${pageId}" %}\n${pageIcon} ${pageTitle}\n{% endcontent-ref %}\n`;
        insertAtCursor(pageLink);
    }, [insertAtCursor]);

    const handleTabKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            insertAtCursor('  ');
        }
    }, [insertAtCursor]);

    const openInsertMenu = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            const rect = textarea.getBoundingClientRect();
            setInsertMenuPosition({ top: rect.top + 50, left: rect.left + 20 });
        }
        setShowInsertMenu(true);
    };

    // Simple markdown preview renderer
    const renderPreview = (text: string) => {
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Hints
        html = html.replace(/{%\s*hint\s+style="(\w+)"\s*%}([\s\S]*?){%\s*endhint\s*%}/g, (_, style, content) => {
            const icons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅', danger: '🚫' };
            return `<div class="wiki-hint-block ${style}"><span class="wiki-hint-icon">${icons[style] || 'ℹ️'}</span><div>${content.trim()}</div></div>`;
        });

        // Content refs (page links)
        html = html.replace(/{% content-ref url="([^"]+)" %}([\s\S]*?){% endcontent-ref %}/g, (_, url, content) => {
            return `<a href="${url}" class="wiki-page-link-card">${content.trim()}</a>`;
        });

        // Standard markdown
        html = html
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/~~([^~]+)~~/g, '<del>$1</del>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^- \[ \] (.+)$/gm, '<div class="wiki-checkbox"><input type="checkbox" disabled> $1</div>')
            .replace(/^- \[x\] (.+)$/gm, '<div class="wiki-checkbox"><input type="checkbox" checked disabled> $1</div>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\n/g, '<br>');

        return html;
    };

    return (
        <div className="wiki-editor-gitbook">
            {/* Toolbar */}
            <div className="wiki-editor-floating-toolbar">
                {/* Formatting */}
                <div className="wiki-toolbar-group">
                    {FORMATTING_TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            type="button"
                            className="wiki-toolbar-btn"
                            onClick={() => handleToolClick(tool)}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </div>

                <div className="wiki-toolbar-divider" />

                {/* Text styling */}
                <div className="wiki-toolbar-group">
                    {TEXT_TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            type="button"
                            className="wiki-toolbar-btn"
                            onClick={() => handleToolClick(tool)}
                            title={tool.label}
                            style={tool.id === 'bold' ? { fontWeight: 'bold' } : tool.id === 'italic' ? { fontStyle: 'italic' } : undefined}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </div>

                {/* Text Color Picker */}
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className="wiki-toolbar-btn"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        title="Цвет текста"
                    >
                        <span style={{ color: '#ef4444' }}>A</span>
                    </button>

                    {showColorPicker && (
                        <div className="wiki-color-picker-dropdown" ref={insertMenuRef}>
                            <div className="wiki-color-picker-header">Цвет текста</div>
                            <div className="wiki-color-picker-grid">
                                {TEXT_COLORS.map(colorItem => (
                                    <button
                                        key={colorItem.id}
                                        type="button"
                                        className="wiki-color-picker-item"
                                        title={colorItem.label}
                                        style={{ backgroundColor: colorItem.color }}
                                        onClick={() => {
                                            insertAtCursor(`<span style="color: ${colorItem.color}">`, '</span>', true);
                                            setShowColorPicker(false);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="wiki-toolbar-divider" />

                {/* Lists */}
                <div className="wiki-toolbar-group">
                    {LIST_TOOLS.map(tool => (
                        <button
                            key={tool.id}
                            type="button"
                            className="wiki-toolbar-btn"
                            onClick={() => handleToolClick(tool)}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    ))}
                </div>

                <div className="wiki-toolbar-divider" />

                {/* Insert block button */}
                <button
                    type="button"
                    className="wiki-toolbar-btn insert-btn"
                    onClick={openInsertMenu}
                    title="Вставить блок"
                >
                    <span className="plus-icon">+</span> Вставить
                </button>

                <div className="wiki-toolbar-spacer" />

                {/* Preview toggle */}
                <button
                    type="button"
                    className={`wiki-toolbar-btn preview-btn ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(!showPreview)}
                >
                    {showPreview ? '✏️ Редактор' : '👁 Превью'}
                </button>
            </div>

            {/* Insert Menu Dropdown */}
            {showInsertMenu && (
                <div className="wiki-insert-menu" ref={insertMenuRef}>
                    <div className="wiki-insert-menu-header">
                        <span>Вставить блок</span>
                        <button type="button" className="wiki-insert-close" onClick={() => setShowInsertMenu(false)}>×</button>
                    </div>
                    <div className="wiki-insert-menu-grid">
                        {BLOCK_TYPES.map(block => (
                            <button
                                key={block.id}
                                type="button"
                                className="wiki-insert-item"
                                onClick={() => handleBlockInsert(block.id)}
                            >
                                <span className="wiki-insert-icon">{block.icon}</span>
                                <div className="wiki-insert-text">
                                    <span className="wiki-insert-label">{block.label}</span>
                                    <span className="wiki-insert-desc">{block.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Page Selector */}
            {showPageSelector && (
                <div className="wiki-page-selector" ref={insertMenuRef}>
                    <div className="wiki-insert-menu-header">
                        <span>Выберите страницу</span>
                        <button type="button" className="wiki-insert-close" onClick={() => setShowPageSelector(false)}>×</button>
                    </div>
                    <div className="wiki-page-selector-list">
                        {pages.map(page => (
                            <button
                                key={page.id}
                                type="button"
                                className="wiki-page-selector-item"
                                onClick={() => handlePageLinkInsert(page.id, page.title, page.icon || '📄')}
                            >
                                <span className="wiki-page-icon">{page.icon || '📄'}</span>
                                <span className="wiki-page-title">{page.title}</span>
                            </button>
                        ))}
                        {pages.length === 0 && (
                            <div className="wiki-page-selector-empty">Нет доступных страниц</div>
                        )}
                    </div>
                </div>
            )}

            {/* Editor Content */}
            <div className="wiki-editor-content-area">
                {showPreview ? (
                    <div
                        className="wiki-editor-preview wiki-content-body"
                        dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                    />
                ) : (
                    <textarea
                        ref={textareaRef}
                        className="wiki-editor-textarea-gitbook"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleTabKey}
                        placeholder="Начните писать здесь...

Используйте кнопку «+ Вставить» для добавления:
• Ссылок на другие страницы
• Подсказок и предупреждений
• Блоков кода
• Таблиц
• И многого другого"
                        autoFocus
                    />
                )}
            </div>

            {/* Bottom Actions */}
            <div className="wiki-editor-bottom-bar">
                <div className="wiki-editor-hints">
                    <span className="wiki-hint">
                        <kbd>Ctrl</kbd> + <kbd>S</kbd> сохранить
                    </span>
                    <span className="wiki-hint">
                        <kbd>Tab</kbd> отступ
                    </span>
                    <span className="wiki-hint">
                        <kbd>Esc</kbd> закрыть меню
                    </span>
                </div>
                <div className="wiki-editor-actions">
                    <button
                        type="button"
                        className="btn secondary"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className="btn primary"
                        onClick={() => onSave(content)}
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}
