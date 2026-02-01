
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'wiki.json');

async function getWikiData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { version: 1, pages: [] };
    }
}

async function saveWikiData(data: any) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ slug: string }> } // Treat params as a promise
) {
    try {
        const p = await params;
        const slug = p.slug;
        const body = await request.json();
        const data = await getWikiData();
        const pageIndex = data.pages.findIndex((p: any) => p.id === slug);

        if (pageIndex === -1) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        const updatedPage = {
            ...data.pages[pageIndex],
            ...body,
            updatedAt: new Date().toISOString()
        };

        // If ID is being changed, check for conflict
        if (body.id && body.id !== slug && data.pages.some((p: any) => p.id === body.id)) {
            return NextResponse.json({ error: 'New ID already exists' }, { status: 409 });
        }

        data.pages[pageIndex] = updatedPage;
        await saveWikiData(data);

        return NextResponse.json(updatedPage);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string }> } // Treat params as a promise
) {
    try {
        const p = await params;
        const slug = p.slug;
        const data = await getWikiData();
        const pageIndex = data.pages.findIndex((p: any) => p.id === slug);

        if (pageIndex === -1) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // Remove page
        data.pages.splice(pageIndex, 1);

        // Update children pointers
        data.pages.forEach((p: any) => {
            if (p.parentId === slug) {
                p.parentId = undefined;
            }
        });

        await saveWikiData(data);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }
}
