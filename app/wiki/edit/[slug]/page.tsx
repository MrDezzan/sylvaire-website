'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWiki } from '@/lib/wiki-context';
import WikiEditor from '@/components/wiki/WikiEditor';
// import EmojiPicker from '@/components/wiki/EmojiPicker'; // Removed

interface EditPageProps {
    params: Promise<{ slug: string }>;
}

export default function WikiEditPage({ params }: EditPageProps) {
    const { slug } = use(params);
    const router = useRouter();
    const { currentPage, loadPage, updatePageContent, updatePageMeta, removePage, canEdit, loading } = useWiki();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadPage(slug);
    }, [slug, loadPage]);

    useEffect(() => {
        if (currentPage) {
            setTitle(currentPage.title);
            setCategory(currentPage.category || '');
        }
    }, [currentPage]);

    // Redirect if cannot edit
    useEffect(() => {
        if (!loading && !canEdit) {
            router.replace(`/wiki/${slug}`);
        }
    }, [loading, canEdit, router, slug]);

    if (loading || !canEdit) {
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
                <h2>Страница не найдена</h2>
                <Link href="/wiki" className="btn primary">
                    Вернуться в Wiki
                </Link>
            </div>
        );
    }

    const handleSave = async (content: string) => {
        setSaving(true);
        try {
            // Update content
            await updatePageContent(slug, content);

            // Update meta if changed
            if (title !== currentPage.title || category !== (currentPage.category || '')) {
                await updatePageMeta(slug, {
                    title,
                    category: category || undefined
                });
            }

            router.push(`/wiki/${slug}`);
        } catch (e) {
            console.error('Failed to save:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        router.push(`/wiki/${slug}`);
    };

    const handleDelete = async () => {
        if (await removePage(slug)) {
            router.push('/wiki');
        }
    };

    return (
        <div className="wiki-edit-page-gitbook">
            {/* GitBook-style header with inline editing */}
            <header className="wiki-gitbook-header">
                <div className="wiki-gitbook-header-top">
                    <Link href={`/wiki/${slug}`} className="wiki-back-link">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Назад к странице
                    </Link>

                    {slug !== 'home' && (
                        <div className="wiki-delete-zone">
                            {showDeleteConfirm ? (
                                <div className="wiki-delete-confirm-inline">
                                    <span>Удалить страницу?</span>
                                    <button type="button" className="btn-text" onClick={() => setShowDeleteConfirm(false)}>
                                        Отмена
                                    </button>
                                    <button type="button" className="btn-text danger" onClick={handleDelete}>
                                        Удалить
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="wiki-delete-btn"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Editable title and category */}
                <div className="wiki-gitbook-title-editor-wrapper">
                    <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="wiki-gitbook-title-input"
                            placeholder="Название страницы..."
                            style={{ flex: 1 }}
                        />
                        {slug !== 'home' && (
                            <button
                                type="button"
                                className="btn secondary small"
                                onClick={() => {
                                    if (confirm('Сделать эту страницу главной? Она будет открываться первой при входе в Wiki.')) {
                                        // Update slug to 'home'
                                        updatePageMeta(slug, {
                                            title,
                                            id: 'home'
                                        }).then(success => {
                                            if (success) {
                                                // If success, Backend has created 'home' with this content.
                                                // We should try to delete the old page to avoid duplication,
                                                // UNLESS the backend renamed it (which it doesn't).
                                                // But wait, if we delete 'slug', we lose it? 
                                                // Correct, because we moved it to 'home'.
                                                removePage(slug).then(() => {
                                                    window.location.href = '/wiki/home';
                                                });
                                            } else {
                                                alert('Не удалось установить главную страницу. Возможно, страница "home" уже существует.');
                                            }
                                        });
                                    }
                                }}
                                title="Сделать главной страницей wiki"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                Главная
                            </button>
                        )}
                    </div>

                    <div className="wiki-category-input-wrapper">
                        <label className="wiki-category-label">Категория:</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="wiki-category-input"
                            placeholder="Без категории"
                            list="categories-list-edit"
                        />
                        <datalist id="categories-list-edit">
                            {/* Getting categories from useWiki would be better but we don't have it in props, so just manual input for now or fetch global pages if needed */}
                        </datalist>
                    </div>
                </div>
            </header>

            {/* Editor */}
            <WikiEditor
                initialContent={currentPage.content}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving}
            />
        </div>
    );
}
