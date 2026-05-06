import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FocusNFe } from '@/lib/focus';

export async function POST(request: Request) {
    try {
        const { saleId } = await request.json();

        if (!saleId) return NextResponse.json({ error: 'Missing Sale ID' }, { status: 400 });

        // 1. Get Config
        const config = await db.getConfig();
        const fiscalConfig = config?.fiscal;

        if (!fiscalConfig || !fiscalConfig.focusToken || !fiscalConfig.cnpj_emitente) {
            return NextResponse.json({ error: 'Sistema fiscal não configurado. Verifique o CNPJ e Token na Dashboard.' }, { status: 400 });
        }

        // 2. Get Sale Data
        const sales = await db.getSales();
        const sale = sales.find((s: any) => s.id === saleId || s._id?.toString() === saleId);

        if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

        // 3. Prepare Focus NFe Payload
        const focus = new FocusNFe(fiscalConfig.focusToken, fiscalConfig.environment);
        const payload = focus.buildNFCePayload(sale, fiscalConfig);

        // 4. Send to Focus NFe
        const reference = saleId.toString();
        const focusData = await focus.emitirNFCe(reference, payload);

        if (focusData.status === 'processando' || focusData.status === 'autorizado' || focusData.status === 'processando_autorizacao') {
            // Update local status
            await db.updateSale(saleId, {
                nfeStatus: 'pending',
                nfeId: reference,
                nfeUrl: focusData.url_danfe || focusData.caminho_danfe,
                nfeQrCode: focusData.qrcode_url
            });
            return NextResponse.json({ success: true, status: focusData.status, info: focusData });
        } else {
            console.error('FocusNFE Error Status:', focusData);
            await db.updateSale(saleId, { nfeStatus: 'error' });
            return NextResponse.json({ error: 'Fiscal API Error', details: focusData }, { status: 400 });
        }

    } catch (error: any) {
        console.error('NFE Error:', error);
        return NextResponse.json({ error: 'Failed to issue NFe', details: error.message || error.body || error }, { status: 500 });
    }
}
