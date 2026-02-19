import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const FOCUS_NFE_TOKEN = process.env.FOCUS_NFE_TOKEN || 'sBhhpIX7HU8WesHCqqcc1gvNXa5tyvQ6';
const IS_SANDBOX = process.env.NODE_ENV !== 'production';
const FOCUS_URL = IS_SANDBOX
    ? 'https://homologacao.focusnfe.com.br/v2/nfe'
    : 'https://api.focusnfe.com.br/v2/nfe';

export async function POST(request: Request) {
    try {
        const { saleId } = await request.json();

        if (!saleId) return NextResponse.json({ error: 'Missing Sale ID' }, { status: 400 });

        // 1. Get Sale Data
        const sales = await db.getSales();
        const sale = sales.find((s: any) => s.id === saleId || s._id.toString() === saleId);

        if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

        // 2. Prepare Focus NFe Payload
        // Note: This is a placeholder structure. A real NF-e requires CNPJ, NCM, CFOP, etc.
        const payload = {
            natureza_operacao: 'Venda de Mercadoria',
            data_emissao: new Date().toISOString(),
            tipo_documento: 1, // Saída
            finalidade_emissao: 1, // Normal
            presenca_comprador: 1, // Operação presencial
            cliente: {
                nome_completo: sale.customerName || 'Consumidor Final',
                // For real NFe, we need CPF/CNPJ and address
            },
            items: sale.items.map((item: any, index: number) => ({
                numero_item: index + 1,
                codigo_produto: item.productId,
                descricao: item.name,
                quantidade: item.quantity,
                unidade_comercial: 'UN',
                valor_unitario_comercial: item.price,
                valor_unitario_tributavel: item.price,
                origem: 0,
                cst_icms: '00',
                codigo_ncm: '21069090', // Default generic fallback NCM
                cfop: '5102', // Venda dentro do estado
            })),
            valor_total_bruto: sale.total,
            valor_total_nota: sale.total,
        };

        // 3. Send to Focus NFe
        const res = await fetch(`${FOCUS_URL}?ref=${saleId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(FOCUS_NFE_TOKEN + ':').toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const focusData = await res.json();

        if (res.status === 202 || res.status === 201 || res.status === 200) {
            // Update local status
            await db.updateSale(saleId, {
                nfeStatus: 'pending',
                nfeId: focusData.reference || saleId
            });
            return NextResponse.json({ success: true, status: 'pending', info: focusData });
        } else {
            console.error('FocusNFE Error:', focusData);
            await db.updateSale(saleId, { nfeStatus: 'error' });
            return NextResponse.json({ error: 'Fiscal API Error', details: focusData }, { status: res.status });
        }

    } catch (error: any) {
        console.error('NFE Error:', error);
        return NextResponse.json({ error: 'Failed to issue NFe', details: error.message }, { status: 500 });
    }
}
