import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const sales = await db.getSales(limit ? parseInt(limit) : undefined);
    return NextResponse.json(sales);
}

export async function POST(request: Request) {
    try {
        const sale = await request.json();
        const savedSale = await db.addSale(sale);

        // Convert Mongoose document to plain object with all fields
        const saleObject = savedSale.toObject ? savedSale.toObject({
            virtuals: true,
            getters: true,
            versionKey: false
        }) : savedSale;

        // Ensure fiscal fields are present (access raw document properties)
        const completeSale = {
            ...saleObject,
            _id: saleObject._id?.toString() || saleObject._id,
            qrcode_url: (savedSale as any).qrcode_url || saleObject.qrcode_url,
            nfeQRCode: (savedSale as any).nfeQRCode || saleObject.nfeQRCode,
            nfeNumber: (savedSale as any).nfeNumber || saleObject.nfeNumber,
            nfeSeries: (savedSale as any).nfeSeries || saleObject.nfeSeries,
            fiscalReference: (savedSale as any).fiscalReference || saleObject.fiscalReference,
            nfeId: (savedSale as any).nfeId || saleObject.nfeId,
            nfeExternalUrl: (savedSale as any).nfeExternalUrl || saleObject.nfeExternalUrl,
            nfeMessage: (savedSale as any).nfeMessage || saleObject.nfeMessage,
            nfeStatus: (savedSale as any).nfeStatus || saleObject.nfeStatus,
            fiscalData: (savedSale as any).fiscalData || saleObject.fiscalData
        };

        console.log('[API DEBUG] Returning sale with fiscal data:', {
            qrcode_url: completeSale.qrcode_url,
            nfeQRCode: completeSale.nfeQRCode,
            nfeNumber: completeSale.nfeNumber,
            nfeSeries: completeSale.nfeSeries,
            fiscalReference: completeSale.fiscalReference,
            hasFiscalData: !!completeSale.fiscalData
        });

        return NextResponse.json(completeSale);
    } catch (error: any) {
        console.error('[API DEBUG] Error in sales POST:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
