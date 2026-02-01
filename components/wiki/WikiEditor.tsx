'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface WikiEditorProps {
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
    saving?: boolean;
}

// Toolbar actions
const TOOLBAR_ITEMS = [
    { id: 'h1', label: 'H1', icon: 'H₁', markdown: '# ', type: 'line' },
    { id: 'h2', label: 'H2', icon: 'H₂', markdown: '## ', type: 'line' },
    { id: 'h3', label: 'H3', icon: 'H₃', markdown: '### ', type: 'line' },
    { id: 'divider1', type: 'divider' },
    { id: 'bold', label: 'Bold', icon: 'B', markdown: '**', wrap: true, style: 'font-weight: bold' },
    { id: 'italic', label: 'Italic', icon: 'I', markdown: '*', wrap: true, style: 'font-style: italic' },
    { id: 'code', label: 'Code', icon: '< >', markdown: '`', wrap: true },
    { id: 'divider2', type: 'divider' },
    { id: 'ul', label: 'List', icon: '•', markdown: '- ', type: 'line' },
    { id: 'ol', label: 'Numbered', icon: '1.', markdown: '1. ', type: 'line' },
    { id: 'quote', label: 'Quote', icon: '"', markdown: '> ', type: 'line' },
    { id: 'divider3', type: 'divider' },
    { id: 'link', label: 'Link', icon: '🔗', special: 'link' },
    { id: 'codeblock', label: 'Code Block', icon: '{ }', special: 'codeblock' },
    { id: 'table', label: 'Table', icon: '▦', special: 'table' },
];

export default function WikiEditor({ initialContent, onSave, onCancel, saving = false }: WikiEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [showPreview, setShowPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content, onSave]);

    const insertAtCursor = useCallback((before: string, after: string = '', selectMiddle: boolean = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newText = before + selectedText + after;

        const newContent = content.substring(0, start) + newText + content.substring(end);
        setContent(newContent);

        // Restore focus and selection
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

    const handleToolbarClick = useCallback((item: typeof TOOLBAR_ITEMS[0]) => {
        if (item.type === 'divider') return;

        if (item.type === 'line' && item.markdown) {
            insertLinePrefix(item.markdown);
        } else if (item.wrap && item.markdown) {
            insertAtCursor(item.markdown, item.markdown, true);
        } else if (item.special === 'link') {
            insertAtCursor('[', '](url)', true);
        } else if (item.special === 'codeblock') {
            insertAtCursor('```\n', '\n```', true);
        } else if (item.special === 'table') {
            insertAtCursor('\n| Колонка 1 | Колонка 2 | Колонка 3 |\n|-----------|-----------|------------|\n| Ячейка 1  | Ячейка 2  | Ячейка 3  |\n', '');
        }
    }, [insertAtCursor, insertLinePrefix]);

    const handleTabKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            insertAtCursor('  ');
        }
    }, [insertAtCursor]);

    // Simple markdown preview renderer
    const renderPreview = (text: string) => {
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/\n/g, '<br>');
        return html;
    };

    return (
        <div className="wiki-editor-gitbook">
            {/* Floating Toolbar */}
            <div className="wiki-editor-floating-toolbar">
                {TOOLBAR_ITEMS.map((item) =>
                    item.type === 'divider' ? (
                        <div key={item.id} className="wiki-toolbar-divider" />
                    ) : (
                        <button
                            key={item.id}
                            type="button"
                            className="wiki-toolbar-btn"
                            onClick={() => handleToolbarClick(item)}
                            title={item.label}
                            style={item.style ? { [item.style.split(':')[0].trim()]: item.style.split(':')[1].trim() } : undefined}
                        >
                            {item.icon}
                        </button>
                    )
                )}

                <div className="wiki-toolbar-spacer" />

                <button
                    type="button"
                    className={`wiki-toolbar-btn preview-btn ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(!showPreview)}
                >
                    {showPreview ? '✏️ Редактор' : '👁 Превью'}
                </button>
            </div>

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

# Заголовок первого уровня
## Заголовок второго уровня

**Жирный текст** и *курсив*

- Пункт списка
- Еще один пункт

> Цитата

`inline code`

```
блок кода
```"
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
