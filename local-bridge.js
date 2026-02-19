const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
const escposUsb = require('escpos-usb');
const iconv = require('iconv-lite');

escpos.USB = escposUsb;
const app = express();
app.use(cors());
app.use(express.json());

const WIDTH = 48; // 80mm (aprox 48 caracteres em fonte normal)
const PORT = 7777;

function printTxt(p, text) {
    p.buffer.write(iconv.encode((text || '') + '\n', 'CP850'));
}

function formatMethod(method) {
    const map = {
        'money': 'DINHEIRO',
        'cash': 'DINHEIRO',
        'pix': 'PIX',
        'credit': 'CARTAO CREDITO',
        'debit': 'CARTAO DEBITO',
        'fiado': 'CONTA FIADO'
    };
    return map[method] || String(method || '').toUpperCase();
}

function truncateName(name, maxLength) {
    if (!name) return '';
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
}

async function calculateTaxes(items, total) {
    // Cálculo simplificado de impostos (aprox 35% carga brasileira média)
    return total * 0.35;
}

function buildFiscalReceiptHeader(printer, data) {
    const fiscal = data.fiscalData || {};

    // Unificação de campos (evita problemas se vierem no root ou no fiscalData)
    const numNf = data.nfeNumber || fiscal.numero || data.numero;
    const serieNf = data.nfeSeries || fiscal.serie || data.serie;
    const accessKey = data.fiscalReference || fiscal.chave_nfe || data.chave_nfe;
    const protocolCode = data.nfeId || fiscal.protocolo || fiscal.protocolo_autorizacao || data.protocolo_autorizacao || 'AUTORIZADO';
    const dateValue = data.date || fiscal.data_emissao || new Date().toISOString();
    const dateStr = !isNaN(new Date(dateValue).getTime()) ? new Date(dateValue).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    const externalUrl = data.nfeExternalUrl || fiscal.url_consulta_nf || 'https://www.sefaz.mg.gov.br/nfce';
    const sefazMessage = data.nfeMessage || fiscal.mensagem_sefaz || 'Autorizado o uso da NFC-e';
    const cus = data.customer || {};

    // CABEÇALHO DA EMPRESA
    printer.font('a').align('ct').style('b');
    printTxt(printer, 'RESTAURANTE E PIZZARIA CONSERVA');
    printer.style('n');
    printTxt(printer, 'RESTAURANTE E PIZZARIA CONSERVA LTDA');
    printTxt(printer, 'CNPJ: 61.516.347/0001-86 IE: 005236678.00-44');
    printTxt(printer, 'AVENIDA PADRE JOAO FACUNDO, 34 - CENTRO');
    printTxt(printer, 'CAPUTIRA - MG - CEP: 36.925-000');
    printTxt(printer, '-'.repeat(WIDTH));

    printer.style('b');
    printTxt(printer, 'DANFE NFC-e - Documento Auxiliar');
    printTxt(printer, 'da Nota Fiscal de Consumidor Eletronica');
    printer.style('n');
    printTxt(printer, '-'.repeat(WIDTH));

    // LISTA DE PRODUTOS
    printer.align('lt').font('b');
    printTxt(printer, 'COD DESCRICAO       QTD UN  VL.UN   TOTAL');
    printTxt(printer, '-'.repeat(WIDTH));

    (data.items || []).forEach((item, i) => {
        const code = (i + 1).toString().padStart(3, '0');
        const name = truncateName((item.name || 'PRODUTO').toUpperCase(), 17).padEnd(17, ' ');
        const qty = parseFloat(item.quantity || 0);
        const qtyStr = (qty % 1 === 0 ? qty.toString() : qty.toFixed(3)).padStart(5, ' ');
        const price = parseFloat(item.price || 0).toFixed(2).padStart(7, ' ');
        const itemTotal = parseFloat(item.total || (qty * (item.price || 0))).toFixed(2).padStart(8, ' ');
        printTxt(printer, `${code} ${name} ${qtyStr} UN ${price} ${itemTotal}`);
    });
    printTxt(printer, '-'.repeat(WIDTH));
    printer.font('a');

    // TOTAIS
    const totalVenda = parseFloat(data.total || 0);
    const subtotalVenda = parseFloat(data.subtotal || totalVenda);
    const descontoVenda = parseFloat(data.discount || 0);

    printer.align('lt');
    printTxt(printer, 'QTD. TOTAL DE ITENS'.padEnd(35, ' ') + (data.items || []).length.toString().padStart(13, ' '));
    printTxt(printer, 'VALOR TOTAL PRODUTOS R$'.padEnd(35, ' ') + subtotalVenda.toFixed(2).replace('.', ',').padStart(13, ' '));
    if (descontoVenda > 0) {
        printTxt(printer, 'DESCONTO R$'.padEnd(35, ' ') + descontoVenda.toFixed(2).replace('.', ',').padStart(13, ' '));
    }

    printer.style('b');
    printTxt(printer, 'VALOR TOTAL R$'.padEnd(35, ' ') + totalVenda.toFixed(2).replace('.', ',').padStart(13, ' '));
    printer.style('n');

    // PAGAMENTOS
    printTxt(printer, '-'.repeat(WIDTH));
    printTxt(printer, 'FORMA DE PAGAMENTO'.padEnd(35, ' ') + 'VALOR PAGO'.padStart(13, ' '));
    if (data.payments && data.payments.length > 0) {
        data.payments.forEach(p => {
            printTxt(printer, formatMethod(p.method).padEnd(35, ' ') + parseFloat(p.amount || 0).toFixed(2).replace('.', ',').padStart(13, ' '));
        });
    } else {
        printTxt(printer, 'DINHEIRO'.padEnd(35, ' ') + totalVenda.toFixed(2).replace('.', ',').padStart(13, ' '));
    }

    const pago = parseFloat(data.paidAmount || totalVenda);
    if (pago > totalVenda + 0.01) {
        printTxt(printer, 'TROCO R$'.padEnd(35, ' ') + (pago - totalVenda).toFixed(2).replace('.', ',').padStart(13, ' '));
    }
    printTxt(printer, '-'.repeat(WIDTH));

    // INFO FISCAL
    printer.align('ct');
    printTxt(printer, 'Consulte pela chave de acesso em:');
    printTxt(printer, externalUrl);
    printer.style('b');
    if (accessKey) {
        const cleanKey = accessKey.replace(/\D/g, '');
        const k1 = cleanKey.substring(0, 11).match(/.{1,4}/g)?.join(' ') || '';
        const k2 = cleanKey.substring(11, 22).match(/.{1,4}/g)?.join(' ') || '';
        const k3 = cleanKey.substring(22, 33).match(/.{1,4}/g)?.join(' ') || '';
        const k4 = cleanKey.substring(33, 44).match(/.{1,4}/g)?.join(' ') || '';
        printTxt(printer, `${k1} ${k2}`);
        printTxt(printer, `${k3} ${k4}`);
    }
    printer.style('n');
    printTxt(printer, '-'.repeat(WIDTH));

    // CONSUMIDOR
    printer.align('ct');
    if (cus.cpf) {
        printTxt(printer, `CONSUMIDOR: ${cus.name?.toUpperCase() || 'IDENTIFICADO'}`);
        printTxt(printer, `CPF/CNPJ: ${cus.cpf}`);
    } else {
        printTxt(printer, 'CONSUMIDOR NAO IDENTIFICADO');
    }
    printTxt(printer, '-'.repeat(WIDTH));

    printer.align('ct');
    printTxt(printer, `NFC-e Numero: ${numNf} Serie: ${serieNf}`);
    printTxt(printer, `Emissao: ${dateStr}`);
    printTxt(printer, `Protocolo de Autorizacao: ${protocolCode}`);
    printTxt(printer, sefazMessage);
    printTxt(printer, '-'.repeat(WIDTH));
}

async function buildFiscalReceiptFooter(printer, data) {
    const total = parseFloat(data.total || 0);
    const taxes = await calculateTaxes(data.items, total);

    printer.align('ct');
    printTxt(printer, 'Valor aprox. dos tributos desta nota:');
    printTxt(printer, `R$ ${taxes.toFixed(2).replace('.', ',')} (18,00%) fonte: IBPT`);
    printer.feed(1);
    printer.style('b');
    printTxt(printer, 'OBRIGADO PELA PREFERENCIA!');
    printer.feed(1);
}

function buildNonFiscalReceipt(printer, data) {
    printer.font('a').align('ct').style('b');
    printTxt(printer, 'RESTAURANTE E PIZZARIA CONSERVA');
    printer.style('n');
    printTxt(printer, 'RECIBO DE PAGAMENTO (NAO FISCAL)');
    printTxt(printer, '-'.repeat(WIDTH));

    printer.font('b').align('lt');
    (data.items || []).forEach((item, i) => {
        const name = truncateName((item.name || '').toUpperCase(), 30).padEnd(30, ' ');
        const total = parseFloat(item.total || ((item.price || 0) * (item.quantity || 0))).toFixed(2).padStart(10, ' ');
        printTxt(printer, `${name} ${total}`);
        if (item.quantity > 1 || item.price) {
            printTxt(printer, `   ${item.quantity} UN x ${parseFloat(item.price || 0).toFixed(2)}`);
        }
    });
    printTxt(printer, '-'.repeat(WIDTH));
    printer.font('a');

    printer.align('rt').style('b');
    printTxt(printer, `TOTAL R$: ${parseFloat(data.total || 0).toFixed(2).replace('.', ',')}`);
    printer.style('n');
    printTxt(printer, '-'.repeat(WIDTH));

    printer.align('ct');
    if (data.customer && data.customer.name) {
        printTxt(printer, `CLIENTE: ${data.customer.name.toUpperCase()}`);
    }
    printTxt(printer, 'Este documento nao e nota fiscal');
    printTxt(printer, new Date().toLocaleString('pt-BR'));
}

function buildMerchantReceipt(printer, data) {
    printer.font('a').align('ct').style('b');
    printTxt(printer, 'RESTAURANTE E PIZZARIA CONSERVA');
    printer.style('n');
    printTxt(printer, 'VIA DO ESTABELECIMENTO');
    printTxt(printer, '-'.repeat(WIDTH));

    printer.font('b').align('lt');
    (data.items || []).forEach((item, i) => {
        const name = truncateName((item.name || '').toUpperCase(), 30).padEnd(30, ' ');
        const total = parseFloat(item.total || ((item.price || 0) * (item.quantity || 0))).toFixed(2).padStart(10, ' ');
        printTxt(printer, `${name} ${total}`);
    });
    printTxt(printer, '-'.repeat(WIDTH));
    printer.font('a');

    printer.align('rt').style('b');
    printTxt(printer, `TOTAL R$: ${parseFloat(data.total || 0).toFixed(2).replace('.', ',')}`);
    printer.style('n');
    printTxt(printer, '-'.repeat(WIDTH));

    printer.align('ct');
    if (data.customer && data.customer.name) {
        printTxt(printer, `CLIENTE: ${data.customer.name.toUpperCase()}`);
    }
    if (data.fiadoTaker) {
        printTxt(printer, `QUEM RETIROU: ${data.fiadoTaker.toUpperCase()}`);
    }

    printer.feed(2);
    printTxt(printer, '_'.repeat(30));
    printTxt(printer, 'Assinatura do Cliente');

    printer.feed(1);
    printTxt(printer, new Date().toLocaleString('pt-BR'));
}

app.post('/print', async (req, res) => {
    const data = req.body;
    const { type, isMerchantCopy } = data;

    console.log(`[BRIDGE] Print Request: ${type} ${isMerchantCopy ? '(+ Merchant Copy)' : ''}`);
    console.log(`[BRIDGE] Taker: ${data.fiadoTaker || 'None'}`);

    let device;
    try {
        device = new escpos.USB(0x04B8, 0x0E27);
    } catch (e) {
        return res.status(500).json({ error: "Impressora offline" });
    }

    const printer = new escpos.Printer(device);

    device.open(async (err) => {
        if (err) return res.status(500).json({ error: "Erro USB" });

        try {
            printer.buffer.write(Buffer.from([0x1b, 0x74, 0x02])); // CP850

            if (type === 'fiscal' || type === 'both') {
                buildFiscalReceiptHeader(printer, data);
                if (!qrUrl) return res.status(400).json({ error: "URL do QR Code não encontrada" });

                printer.align('ct').qrimage(qrUrl, { type: 'png', size: 6 }, async function (err) {
                    if (err) {
                        console.error(err);
                        if (device) device.close();
                        return res.status(500).json({ error: "Erro na geração do QR Code" });
                    }

                    await buildFiscalReceiptFooter(printer, data);

                    if (type === 'both') {
                        printer.feed(2).cut();
                        buildNonFiscalReceipt(printer, data);
                    }

                    if (isMerchantCopy) {
                        printer.feed(2).cut();
                        buildMerchantReceipt(printer, data);
                    }

                    printer.feed(3).cut().close();
                    res.json({ success: true });
                });
            } else {
                buildNonFiscalReceipt(printer, data);
                if (isMerchantCopy) {
                    printer.feed(2).cut();
                    buildMerchantReceipt(printer, data);
                }
                printer.feed(3).cut().close();
                res.json({ success: true });
            }
        } catch (e) {
            console.error(e);
            if (device) device.close();
            res.status(500).json({ error: "Erro de processamento" });
        }
    });
});

app.post('/print-pix', async (req, res) => {
    const { qrCode, amount } = req.body;
    if (!qrCode || !amount) {
        return res.status(400).json({ error: 'QR Code e valor são obrigatórios' });
    }
    let device;
    try {
        device = new escpos.USB(0x04B8, 0x0E27);
    } catch (e) {
        return res.status(500).json({ error: 'Impressora não conectada' });
    }
    const printer = new escpos.Printer(device);
    device.open((err) => {
        if (err) return res.status(500).json({ error: 'Erro USB' });
        try {
            printer.buffer.write(Buffer.from([0x1b, 0x74, 0x02])); // CP850

            // Header
            printer.font('a').align('ct').style('b');
            printTxt(printer, 'RESTAURANTE E PIZZARIA CONSERVA');
            printer.style('n');
            printTxt(printer, 'PAGAMENTO VIA PIX');
            printTxt(printer, '-'.repeat(WIDTH));

            printer.align('ct');
            printer.feed(1);
            printer.style('b');
            printTxt(printer, `VALOR R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}`);
            printer.style('n');
            printer.feed(1);

            printer.qrimage(qrCode, { type: 'png', size: 6 }, function (err) {
                if (err) {
                    console.error(err);
                    if (device) device.close();
                    return res.status(500).json({ error: "Erro na geração do QR Code PIX" });
                }

                printer.feed(1);
                printer.align('ct');
                printTxt(printer, 'Obrigado pela preferência');
                printer.feed(4).cut().close();
                res.json({ success: true });
            });
        } catch (e) {
            console.error(e);
            if (device) device.close();
            res.status(500).json({ error: "Erro de processamento" });
        }
    });
});

app.get('/status', (req, res) => {
    res.json({ status: 'online' });
});

app.listen(PORT, () => console.log(`🚀 Conserva Bridge Ativa na porta ${PORT}`));
