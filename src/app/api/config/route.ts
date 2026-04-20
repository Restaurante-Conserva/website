import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const config = await db.getConfig();
    return NextResponse.json(config);
}

export async function POST(request: Request) {
    const body = await request.json();
    const { tableCount, fiscal } = body;

    const updates: any = {};
    if (tableCount !== undefined) updates.tableCount = tableCount;
    if (fiscal !== undefined) updates.fiscal = fiscal;

    await db.updateConfig(updates);
    return NextResponse.json({ success: true });
}
