'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWiki } from '@/lib/wiki-context';
import WikiEditor from '@/components/wiki/WikiEditor';
// import EmojiPicker from '@/components/wiki/EmojiPicker'; // Removed

export default function WikiNewPage() {
    const router = useRouter();
    const { createPage, pages, canEdit, loading } = useWiki();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [step, setStep] = useState<'meta' | 'content'>('meta');
    const [content, setContent] = useState('');

    // Redirect if cannot edit
    useEffect(() => {
        if (!loading && !canEdit) {
            router.replace('/wiki');
        }
    }, [loading, canEdit, router]);

    if (loading || !canEdit) {
        return (
            <div className="wiki-content-loading">
                <div className="wiki-loading-spinner" />
                <p>Загрузка...</p>
            </div>
        );
    }

    const handleContinue = () => {
        if (!title.trim()) {
            return;
        }
        setStep('content');
    };

    const handleSave = async (finalContent: string) => {
        setSaving(true);
        try {
            const newPage = createPage(
                title,
                finalContent,
                parentId || undefined,
                undefined, // Icon deprecated
                category || undefined
            );

            if (newPage) {
                router.push(`/wiki/${newPage.id}`);
            }
        } catch (e) {
            console.error('Failed to create page:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (step === 'content') {
            setStep('meta');
        } else {
            router.push('/wiki');
        }
    };

    // Parent page options (exclude pages that are too deep)
    const parentOptions = pages.filter(p => p.id !== 'home');

    // Existing categories for suggestions
    const existingCategories = Array.from(new Set(pages.map(p => p.category).filter(Boolean))) as string[];

    return (
        <div className="wiki-new-page-gitbook">
            {step === 'meta' ? (
                <>
                    {/* GitBook-style header */}
                    <header className="wiki-gitbook-header">
                        <div className="wiki-gitbook-header-top">
                            <Link href="/wiki" className="wiki-back-link">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Назад в Wiki
                            </Link>
                        </div>

                        {/* Editable title */}
                        <div className="wiki-gitbook-title-editor">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="wiki-gitbook-title-input"
                                placeholder="Название новой страницы..."
                                autoFocus
                            />
                        </div>

                        {/* Page description (optional) */}
                        <p className="wiki-gitbook-description">
                            Введите название и выберите категорию для новой страницы
                        </p>
                    </header>

                    {/* Settings: Category and Parent */}
                    <div className="wiki-new-settings">
                        <div className="wiki-setting-card">
                            <label htmlFor="category-input">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                Категория
                            </label>
                            <input
                                id="category-input"
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="wiki-input-gitbook"
                                placeholder="Например: Гайды"
                                list="categories-list"
                            />
                            <datalist id="categories-list">
                                {existingCategories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                            <span className="wiki-setting-hint">
                                Создайте новую категорию или выберите существующую
                            </span>
                        </div>

                        <div className="wiki-setting-card">
                            <label htmlFor="parent-select">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                </svg>
                                Родительская страница
                            </label>
                            <select
                                id="parent-select"
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="wiki-select-gitbook"
                            >
                                <option value="">— Корневая страница —</option>
                                {parentOptions.map(page => (
                                    <option key={page.id} value={page.id}>
                                        {page.title}
                                    </option>
                                ))}
                            </select>
                            <span className="wiki-setting-hint">
                                Выберите, к какой странице будет относиться новая
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="wiki-new-actions-gitbook">
                        <button
                            type="button"
                            className="btn secondary"
                            onClick={handleCancel}
                        >
                            Отмена
                        </button>
                        <button
                            type="button"
                            className="btn primary"
                            onClick={handleContinue}
                            disabled={!title.trim()}
                        >
                            Продолжить
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Header in content step */}
                    <header className="wiki-gitbook-header compact">
                        <div className="wiki-gitbook-header-top">
                            <button type="button" className="wiki-back-link" onClick={() => setStep('meta')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Изменить название
                            </button>
                        </div>
                        <div className="wiki-gitbook-title-display">
                            <h1>{title}</h1>
                        </div>
                    </header>

                    <WikiEditor
                        initialContent={content}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        saving={saving}
                    />
                </>
            )}
        </div>
    );
}
