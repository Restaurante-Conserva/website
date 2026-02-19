import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'categories') {
        const categories = await db.getCategories();
        // Sort by order field, fallback to natural order
        const sorted = categories.sort((a: any, b: any) => {
            const orderA = a.order !== undefined ? a.order : 999;
            const orderB = b.order !== undefined ? b.order : 999;
            return orderA - orderB;
        });
        return NextResponse.json(sorted);
    }

    if (type === 'products') {
        const products = await db.getProducts();
        return NextResponse.json(products);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function POST(request: Request) {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'category') {
        const category = await db.addCategory(data);
        return NextResponse.json(category);
    }

    if (type === 'product') {
        const product = await db.addProduct(data);
        return NextResponse.json(product);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function PUT(request: Request) {
    const body = await request.json();
    const { type, id, data, action } = body;

    // Handle category reordering
    if (type === 'category' && action === 'reorder') {
        let categories = await db.getCategories();
        // Sort first to ensure successful adjacent swap
        categories.sort((a: any, b: any) => ((a.order ?? 999) - (b.order ?? 999)));

        const fromIndex = categories.findIndex((c: any) => (c.id || c._id) === id);

        if (fromIndex === -1) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        const direction = data.direction; // 'up' or 'down'
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

        if (toIndex < 0 || toIndex >= categories.length) {
            return NextResponse.json({ error: 'Cannot move further' }, { status: 400 });
        }

        // Swap positions
        [categories[fromIndex], categories[toIndex]] = [categories[toIndex], categories[fromIndex]];

        // Update order field for all categories
        for (let i = 0; i < categories.length; i++) {
            const catId = categories[i].id || categories[i]._id;
            await db.updateCategory(catId, { ...categories[i], order: i });
        }

        return NextResponse.json({ success: true });
    }

    if (type === 'product' && id) {
        await db.updateProduct(id, data);
        return NextResponse.json({ success: true });
    }

    if (type === 'category' && id) {
        await db.updateCategory(id, data);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (type === 'category' && id) {
        await db.deleteCategory(id);
        return NextResponse.json({ success: true });
    }

    if (type === 'product' && id) {
        await db.deleteProduct(id);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
}
