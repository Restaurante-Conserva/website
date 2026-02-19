import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { focusNFe } from '@/lib/focus';
import dbConnect from '@/lib/mongoose';

// GET /api/sales/[id] -> Retorna dados detalhados da venda, incluindo consulta completa na SEFAZ se solicitado
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const complete = searchParams.get('completa') === '1';

        const sale = await db.getSales().then(sales => sales.find(s => s._id.toString() === id || s.id === id));

        if (!sale) {
            return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
        }

        if (complete && sale.isFiscal && sale.nfeStatus === 'issued') {
            try {
                const consultResponse = await focusNFe.consultarNFCe(id);
                return NextResponse.json({ ...sale.toObject(), fiscalFull: consultResponse });
            } catch (e) {
                console.error('[API] Error consulting full NFCe:', e);
            }
        }

        return NextResponse.json(sale);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/sales/[id] -> Cancela a venda e a nota fiscal na SEFAZ (se houver)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const { justificativa } = body;

        // 1. Buscar a venda
        const sales = await db.getSales();
        const sale = sales.find(s => (s as any)._id?.toString() === id || s.id === id);

        if (!sale) {
            return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
        }

        if (sale.status === 'refunded') {
            return NextResponse.json({ error: 'Venda já está cancelada' }, { status: 400 });
        }

        // 2. Se for fiscal e estiver autorizada, tenta cancelar na SEFAZ
        if (sale.isFiscal && sale.nfeStatus === 'issued') {
            if (!justificativa || justificativa.length < 15) {
                return NextResponse.json({ error: 'Justificativa de cancelamento fiscal obrigatória (mín. 15 caracteres)' }, { status: 400 });
            }

            try {
                const cancelResponse = await focusNFe.cancelarNFCe(id, justificativa);

                if (cancelResponse.status === 'cancelado') {
                    await db.updateSale(id, {
                        nfeStatus: 'cancelled',
                        fiscalData: { ...(sale as any).fiscalData, ...cancelResponse }
                    });
                } else {
                    return NextResponse.json({ error: cancelResponse.mensagem || 'Erro ao cancelar na SEFAZ' }, { status: 400 });
                }
            } catch (focusError: any) {
                console.error('[API] Focus Cancellation Error:', focusError);
                return NextResponse.json({ error: focusError.body?.mensagem || focusError.message || 'Erro na comunicação com Focus' }, { status: 500 });
            }
        }

        // 3. Cancela a venda no sistema (Estoque, Financeiro, Pontos)
        await db.cancelSale(id);

        return NextResponse.json({ success: true, message: 'Venda cancelada com sucesso!' });
    } catch (error: any) {
        console.error('[API] Sale Cancellation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const updates = await request.json();

        // Se a atualização incluir isFiscal: true, processar NFCe
        if (updates.isFiscal) {
            const { Sale } = await import('@/models/Schemas');
            const currentSale = await Sale.findById(id);

            if (currentSale) {
                if (currentSale.nfeStatus === 'issued' && currentSale.fiscalReference && currentSale.qrcode_url) {
                    console.log(`[API DEBUG] Sale ${id} already has a complete authorized NFCe.`);
                } else {
                    const config = await db.getConfig();

                    if (focusNFe.isConfigured() && config.fiscal?.cnpj_emitente) {
                        try {
                            const saleForFocus = {
                                ...currentSale.toObject(),
                                payments: updates.payments || currentSale.payments,
                                customer: currentSale.customer
                            };

                            const payload = focusNFe.buildNFCePayload(saleForFocus, config.fiscal);
                            let focusResponse = await focusNFe.emitirNFCe(id, payload);

                            if (focusResponse.status === 'autorizado' || focusResponse.status === 'processando') {
                                updates.nfeStatus = 'issued';
                                updates.nfeId = focusResponse.protocolo;
                                updates.nfeUrl = focusResponse.caminho_xml_nota_fiscal;
                                updates.nfeDanfeUrl = focusResponse.caminho_danfe || focusResponse.url_danfe;
                                updates.fiscalReference = focusResponse.chave_nfe;
                                updates.nfeNumber = focusResponse.numero;
                                updates.nfeSeries = focusResponse.serie;
                                updates.nfeQRCode = focusResponse.qrcode_url;
                                updates.qrcode_url = focusResponse.qrcode_url;
                                updates.fiscalData = focusResponse;
                                updates.nfeExternalUrl = focusResponse.url_consulta_nf;
                                updates.nfeMessage = focusResponse.mensagem_sefaz;
                            } else {
                                updates.nfeStatus = 'error';
                                updates.nfeError = focusResponse.mensagem_sefaz || 'Erro na SEFAZ';
                            }
                        } catch (focusError: any) {
                            if (focusError.body?.codigo === 'already_processed') {
                                try {
                                    const consultResponse = await focusNFe.consultarNFCe(id);
                                    updates.nfeStatus = 'issued';
                                    updates.nfeId = consultResponse.protocolo || consultResponse.protocolo_autorizacao;
                                    updates.nfeUrl = consultResponse.caminho_xml_nota_fiscal;
                                    updates.nfeDanfeUrl = consultResponse.caminho_danfe || consultResponse.url_danfe;
                                    updates.fiscalReference = consultResponse.chave_nfe;
                                    updates.nfeNumber = consultResponse.numero;
                                    updates.nfeSeries = consultResponse.serie;
                                    updates.nfeQRCode = consultResponse.qrcode_url;
                                    updates.qrcode_url = consultResponse.qrcode_url;
                                    updates.fiscalData = consultResponse;
                                    updates.nfeExternalUrl = consultResponse.url_consulta_nf;
                                    updates.nfeMessage = consultResponse.mensagem_sefaz;
                                } catch (consultError) {
                                    console.error('[API DEBUG] Error consulting NFCe:', consultError);
                                }
                            } else {
                                updates.nfeStatus = 'error';
                                updates.nfeError = focusError.body?.mensagem || focusError.message || 'Erro na comunicação com Focus';
                            }
                        }
                    }
                }
            }
        }

        const updatedSale = await db.updateSale(id, updates);

        if (!updatedSale) {
            return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
        }

        const rawSale = updatedSale.toObject({ virtuals: true, getters: true });

        const finalResponse = {
            ...rawSale,
            _id: rawSale._id?.toString() || rawSale._id,
            qrcode_url: rawSale.qrcode_url || (rawSale.fiscalData && rawSale.fiscalData.qrcode_url),
            nfeQRCode: rawSale.nfeQRCode || rawSale.qrcode_url,
            nfeNumber: rawSale.nfeNumber || (rawSale.fiscalData && rawSale.fiscalData.numero),
            nfeSeries: rawSale.nfeSeries || (rawSale.fiscalData && rawSale.fiscalData.serie),
            fiscalReference: rawSale.fiscalReference || (rawSale.fiscalData && rawSale.fiscalData.chave_nfe),
            nfeId: rawSale.nfeId || (rawSale.fiscalData && (rawSale.fiscalData.protocolo || rawSale.fiscalData.protocolo_autorizacao)),
            nfeStatus: rawSale.nfeStatus || 'issued'
        };

        return NextResponse.json(finalResponse);
    } catch (error: any) {
        console.error('[API DEBUG] Error in sales PATCH:', error);
        return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
    }
}
