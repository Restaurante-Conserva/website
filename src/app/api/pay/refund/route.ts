import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago';
import { db } from '@/lib/db';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000';
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
const refunder = new PaymentRefund(client);

export async function POST(request: Request) {
    try {
        const { saleId, transactionId } = await request.json();

        if (!saleId || !transactionId) {
            return NextResponse.json({ error: 'Missing Sale ID or Transaction ID' }, { status: 400 });
        }

        // 1. Process Refund in Mercado Pago
        // If it's a test token, the SDK might fail or we might want to skip real API call
        if (!ACCESS_TOKEN.startsWith('TEST-')) {
            await refunder.create({
                payment_id: transactionId,
            });
        }

        // 2. Update Sale Status in Database
        await db.updateSale(saleId, { status: 'refunded' });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Refund Error:', error);
        return NextResponse.json({
            error: 'Failed to process refund',
            details: error.message
        }, { status: 500 });
    }
}
