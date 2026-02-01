
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'wiki.json');

// Helper to read data
async function getWikiData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return default structure (should be initialized manually though)
        return { version: 1, pages: [] };
    }
}

// Helper to save data
async function saveWikiData(data: any) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
    try {
        const data = await getWikiData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load wiki data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('[API POST] Received body:', body);
        const { id, title, content, parentId, category, icon } = body;

        if (!id || !title || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const data = await getWikiData();

        // Check for duplicates
        if (data.pages.some((p: any) => p.id === id)) {
            return NextResponse.json({ error: 'Page ID already exists' }, { status: 409 });
        }

        const newPage = {
            id,
            title,
            content,
            parentId,
            category,
            icon,
            order: data.pages.length, // Append to end
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'System', // Could be updated with actual user if auth is passed
        };

        data.pages.push(newPage);
        console.log('[API POST] Saving data...');
        await saveWikiData(data);
        console.log('[API POST] Saved successfully');

        return NextResponse.json(newPage);
    } catch (error) {
        console.error('[API POST] Error:', error);
        return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }
}
