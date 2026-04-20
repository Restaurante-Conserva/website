import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const tables = await db.getTables();
    return NextResponse.json(tables);
}

export async function PUT(request: Request) {
    const body = await request.json();
    const { id, action, payload } = body;

    const tables = await db.getTables();
    const currentTable = tables.find((t: any) => t.id === id || t._id?.toString() === id);

    if (!currentTable) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    if (action === 'open') {
        await db.updateTable(id, {
            status: 'occupied',
            customerName: payload?.customerName || 'Cliente'
        });
        return NextResponse.json({ success: true });
    }

    if (action === 'close') {
        const products = await db.getProducts();

        // Enrich items for history
        const enrichedItems = currentTable.orders.map((order: any) => {
            const product = products.find((p: any) => p.id === order.productId.toString());
            return {
                productId: order.productId.toString(),
                name: product?.name || 'Item desconhecido',
                price: product?.price || 0,
                quantity: order.quantity
            };
        });

        const total = enrichedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

        let savedSale = null;
        if (enrichedItems.length > 0) {
            savedSale = await db.addSale({
                tableId: id,
                tableNumber: currentTable.number,
                total,
                date: new Date(),
                items: enrichedItems,
                payments: payload?.payments || [{ method: 'cash', amount: total }],
                isFiscal: payload?.isFiscal || false,
                paidAmount: payload?.paidAmount || total,
                customer: payload?.customer || { name: currentTable.customerName || 'Cliente' }
            });
        }

        await db.updateTable(id, {
            status: 'free',
            orders: [],
            customerName: null
        });

        // Convert to plain object and return with fiscal data
        const saleObject = savedSale?.toObject ? savedSale.toObject({
            virtuals: true,
            getters: true,
            versionKey: false
        }) : savedSale;

        // Ensure fiscal fields are present
        const completeSale = saleObject ? {
            ...saleObject,
            _id: saleObject._id?.toString() || saleObject._id,
            qrcode_url: (savedSale as any)?.qrcode_url || saleObject.qrcode_url,
            nfeQRCode: (savedSale as any)?.nfeQRCode || saleObject.nfeQRCode,
            nfeNumber: (savedSale as any)?.nfeNumber || saleObject.nfeNumber,
            nfeSeries: (savedSale as any)?.nfeSeries || saleObject.nfeSeries,
            fiscalReference: (savedSale as any)?.fiscalReference || saleObject.fiscalReference,
            nfeId: (savedSale as any)?.nfeId || saleObject.nfeId,
            nfeExternalUrl: (savedSale as any)?.nfeExternalUrl || saleObject.nfeExternalUrl,
            nfeMessage: (savedSale as any)?.nfeMessage || saleObject.nfeMessage,
            nfeStatus: (savedSale as any)?.nfeStatus || saleObject.nfeStatus,
            fiscalData: (savedSale as any)?.fiscalData || saleObject.fiscalData
        } : null;

        if (completeSale) {
            console.log('[TABLES API DEBUG] Returning sale with fiscal data:', {
                qrcode_url: completeSale.qrcode_url,
                nfeQRCode: completeSale.nfeQRCode,
                nfeNumber: completeSale.nfeNumber,
                nfeSeries: completeSale.nfeSeries,
                fiscalReference: completeSale.fiscalReference,
                hasFiscalData: !!completeSale.fiscalData
            });
        }

        return NextResponse.json(completeSale || { success: true });
    }

    if (action === 'update_order') {
        const { productId, quantity } = payload;
        const products = await db.getProducts();
        const product = products.find((p: any) => p._id?.toString() === productId);

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        // Stock check
        if (quantity > 0 && product.stock !== null) {
            if (product.stock < quantity) {
                return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
            }
        }

        const newOrders = [...currentTable.orders.map((o: any) => ({ ...o.toObject() }))];
        const existingIdx = newOrders.findIndex(o => o.productId.toString() === productId);

        if (existingIdx >= 0) {
            newOrders[existingIdx].quantity += quantity;
            if (newOrders[existingIdx].quantity <= 0) newOrders.splice(existingIdx, 1);
        } else if (quantity > 0) {
            newOrders.push({ productId, quantity });
        }

        // Update Product Stock
        if (product.stock !== null) {
            await db.updateProduct(productId, { stock: product.stock - quantity });
        }

        await db.updateTable(id, {
            orders: newOrders,
            status: newOrders.length > 0 ? 'occupied' : 'free'
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
