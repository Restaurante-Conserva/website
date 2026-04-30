import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// NOTE: In production, use process.env.MP_ACCESS_TOKEN
// For now, we rely on the user having set this in their environment or filling it here.
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-00000000-0000-0000-0000-000000000000';

const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
const payment = new Payment(client);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, description, payerEmail } = body;

        const result = await payment.create({
            body: {
                transaction_amount: Number(amount),
                description: description || 'Conserva Restaurant',
                payment_method_id: 'pix',
                payer: {
                    email: payerEmail || 'guest@conserva.com'
                },
            }
        });

        return NextResponse.json({
            success: true,
            id: result.id,
            qr_code: result.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
            status: result.status
        });

    } catch (error: any) {
        console.error('MP Error:', error);
        return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        const result = await payment.get({ id });
        return NextResponse.json({
            status: result.status,
            success: result.status === 'approved'
        });
    } catch {
        return NextResponse.json({ status: 'unknown' }, { status: 500 });
    }
}
