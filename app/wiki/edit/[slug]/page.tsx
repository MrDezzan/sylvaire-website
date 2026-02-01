'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWiki } from '@/lib/wiki-context';
import { useAuth } from '@/lib/auth-context';
import WikiEditor from '@/components/wiki/WikiEditor';

interface EditPageProps {
    params: Promise<{ slug: string }>;
}

export default function WikiEditPage({ params }: EditPageProps) {
    const { slug } = use(params);
    const router = useRouter();
    const { isAdmin } = useAuth();
    const { currentPage, loadPage, updatePageContent, updatePageMeta, removePage, canEdit, loading } = useWiki();
    const [saving, setSaving] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadPage(slug);
    }, [slug, loadPage]);

    useEffect(() => {
        if (currentPage) {
            setTitle(currentPage.title);
            setIcon(currentPage.icon || '');
        }
    }, [currentPage]);

    // Redirect if not admin
    useEffect(() => {
        if (!loading && !isAdmin) {
            router.replace(`/wiki/${slug}`);
        }
    }, [loading, isAdmin, router, slug]);

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
            updatePageContent(slug, content);

            // Update meta if changed
            if (title !== currentPage.title || icon !== currentPage.icon) {
                updatePageMeta(slug, { title, icon: icon || undefined });
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

    const handleDelete = () => {
        if (removePage(slug)) {
            router.push('/wiki');
        }
    };

    return (
        <div className="wiki-edit-page">
            <header className="wiki-edit-header">
                <div className="wiki-edit-header-left">
                    <Link href={`/wiki/${slug}`} className="wiki-back-btn">
                        ← Назад
                    </Link>
                    <h1>Редактирование: {currentPage.title}</h1>
                </div>
                <div className="wiki-edit-header-right">
                    <button
                        type="button"
                        className="btn secondary"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        ⚙️ Настройки
                    </button>
                </div>
            </header>

            {showSettings && (
                <div className="wiki-edit-settings">
                    <div className="wiki-edit-setting-group">
                        <label htmlFor="page-title">Заголовок</label>
                        <input
                            id="page-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="wiki-edit-input"
                        />
                    </div>
                    <div className="wiki-edit-setting-group">
                        <label htmlFor="page-icon">Иконка (emoji)</label>
                        <input
                            id="page-icon"
                            type="text"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            className="wiki-edit-input"
                            placeholder="📄"
                            maxLength={2}
                        />
                    </div>
                    {slug !== 'home' && (
                        <div className="wiki-edit-setting-group danger">
                            <label>Удаление страницы</label>
                            {showDeleteConfirm ? (
                                <div className="wiki-delete-confirm">
                                    <p>Вы уверены? Это действие нельзя отменить.</p>
                                    <div className="wiki-delete-actions">
                                        <button
                                            type="button"
                                            className="btn secondary"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            type="button"
                                            className="btn danger"
                                            onClick={handleDelete}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn danger"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Удалить страницу
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <WikiEditor
                initialContent={currentPage.content}
                onSave={handleSave}
                onCancel={handleCancel}
                saving={saving}
            />
        </div>
    );
}
