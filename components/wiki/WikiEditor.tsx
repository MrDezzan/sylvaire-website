'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface WikiEditorProps {
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
    saving?: boolean;
}

export default function WikiEditor({ initialContent, onSave, onCancel, saving }: WikiEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [showPreview, setShowPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.max(400, textarea.scrollHeight)}px`;
        }
    }, [content]);

    const insertText = useCallback((before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const newContent =
            content.substring(0, start) +
            before +
            selectedText +
            after +
            content.substring(end);

        setContent(newContent);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + before.length + selectedText.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    }, [content]);

    const handleToolbarAction = (action: string) => {
        switch (action) {
            case 'h1':
                insertText('# ');
                break;
            case 'h2':
                insertText('## ');
                break;
            case 'h3':
                insertText('### ');
                break;
            case 'bold':
                insertText('**', '**');
                break;
            case 'italic':
                insertText('*', '*');
                break;
            case 'code':
                insertText('`', '`');
                break;
            case 'codeblock':
                insertText('```\n', '\n```');
                break;
            case 'link':
                insertText('[', '](url)');
                break;
            case 'list':
                insertText('- ');
                break;
            case 'quote':
                insertText('> ');
                break;
            case 'table':
                insertText('| Колонка 1 | Колонка 2 |\n|-----------|----------|\n| Данные 1 | Данные 2 |\n');
                break;
        }
    };

    const handleSave = () => {
        onSave(content);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
        // Tab to indent
        if (e.key === 'Tab') {
            e.preventDefault();
            insertText('    ');
        }
    };

    // Simple markdown preview renderer
    const renderPreview = (text: string) => {
        let html = text;

        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="wiki-code-block"><code>$2</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code class="wiki-inline-code">$1</code>');
        html = html.replace(/^### (.+)$/gm, '<h3 class="wiki-h3">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 class="wiki-h2">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 class="wiki-h1">$1</h1>');
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="wiki-link">$1</a>');
        html = html.replace(/^> (.+)$/gm, '<blockquote class="wiki-blockquote">$1</blockquote>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="wiki-ul">$1</ul>');
        html = html.replace(/\n\n/g, '</p><p class="wiki-p">');
        html = `<p class="wiki-p">${html}</p>`;

        return html;
    };

    return (
        <div className="wiki-editor">
            <div className="wiki-editor-toolbar">
                <div className="wiki-editor-toolbar-group">
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('h1')}
                        title="Заголовок 1"
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('h2')}
                        title="Заголовок 2"
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('h3')}
                        title="Заголовок 3"
                    >
                        H3
                    </button>
                </div>

                <div className="wiki-editor-toolbar-divider" />

                <div className="wiki-editor-toolbar-group">
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('bold')}
                        title="Жирный (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('italic')}
                        title="Курсив (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('code')}
                        title="Код"
                    >
                        {'</>'}
                    </button>
                </div>

                <div className="wiki-editor-toolbar-divider" />

                <div className="wiki-editor-toolbar-group">
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('link')}
                        title="Ссылка"
                    >
                        🔗
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('list')}
                        title="Список"
                    >
                        •
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('quote')}
                        title="Цитата"
                    >
                        ❝
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('codeblock')}
                        title="Блок кода"
                    >
                        {'{ }'}
                    </button>
                    <button
                        type="button"
                        className="wiki-editor-btn"
                        onClick={() => handleToolbarAction('table')}
                        title="Таблица"
                    >
                        ⊞
                    </button>
                </div>

                <div className="wiki-editor-toolbar-spacer" />

                <button
                    type="button"
                    className={`wiki-editor-btn preview-toggle ${showPreview ? 'active' : ''}`}
                    onClick={() => setShowPreview(!showPreview)}
                >
                    {showPreview ? '✎ Редактор' : '👁 Превью'}
                </button>
            </div>

            <div className="wiki-editor-content">
                {showPreview ? (
                    <div
                        className="wiki-editor-preview wiki-content-body"
                        dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                    />
                ) : (
                    <textarea
                        ref={textareaRef}
                        className="wiki-editor-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Начните писать в формате Markdown..."
                        spellCheck={false}
                    />
                )}
            </div>

            <div className="wiki-editor-footer">
                <div className="wiki-editor-hint">
                    <kbd>Ctrl</kbd> + <kbd>S</kbd> для сохранения
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
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
}
