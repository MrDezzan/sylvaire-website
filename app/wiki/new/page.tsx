'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWiki } from '@/lib/wiki-context';
import WikiEditor from '@/components/wiki/WikiEditor';

export default function WikiNewPage() {
    const router = useRouter();
    const { createPage, pages, canEdit, loading } = useWiki();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [icon, setIcon] = useState('📄');
    const [parentId, setParentId] = useState<string>('');
    const [step, setStep] = useState<'meta' | 'content'>('meta');
    const [content, setContent] = useState('# Новая страница\n\nНачните писать здесь...');

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
            alert('Введите заголовок страницы');
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
                icon || undefined
            );

            if (newPage) {
                router.push(`/wiki/${newPage.id}`);
            }
        } catch (e) {
            console.error('Failed to create page:', e);
            alert('Не удалось создать страницу');
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

    return (
        <div className="wiki-new-page">
            <header className="wiki-edit-header">
                <div className="wiki-edit-header-left">
                    <Link href="/wiki" className="wiki-back-btn">
                        ← Назад
                    </Link>
                    <h1>Новая страница</h1>
                </div>
            </header>

            {step === 'meta' && (
                <div className="wiki-new-meta">
                    <div className="wiki-new-form">
                        <div className="wiki-edit-setting-group">
                            <label htmlFor="new-title">Заголовок страницы *</label>
                            <input
                                id="new-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="wiki-edit-input"
                                placeholder="Введите заголовок..."
                                autoFocus
                            />
                        </div>

                        <div className="wiki-edit-setting-group">
                            <label htmlFor="new-icon">Иконка (emoji)</label>
                            <input
                                id="new-icon"
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                className="wiki-edit-input"
                                placeholder="📄"
                                maxLength={2}
                            />
                        </div>

                        <div className="wiki-edit-setting-group">
                            <label htmlFor="new-parent">Родительская страница</label>
                            <select
                                id="new-parent"
                                value={parentId}
                                onChange={(e) => setParentId(e.target.value)}
                                className="wiki-edit-select"
                            >
                                <option value="">— Нет (корневая страница) —</option>
                                {pages.map(page => (
                                    <option key={page.id} value={page.id}>
                                        {page.icon} {page.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="wiki-new-actions">
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
                            >
                                Продолжить →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'content' && (
                <WikiEditor
                    initialContent={content}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    saving={saving}
                />
            )}
        </div>
    );
}
