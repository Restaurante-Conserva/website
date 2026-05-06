import { Buffer } from 'node:buffer';

const FOCUS_URL = process.env.FOCUS_URL || 'https://homologacao.focusnfe.com.br';
const FOCUS_API_KEY = process.env.FOCUS_API_KEY || '';

if (!FOCUS_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ FOCUS_API_KEY not set. Invoice operations will fail.');
    }
}

export interface FocusResponse {
    status: string;
    protocolo?: string;
    mensagem_sefaz?: string;
    status_sefaz?: string;
    caminho_xml_nota_fiscal?: string;
    caminho_danfe?: string;
    url_danfe?: string;
    qrcode_url?: string;
    erros?: Array<{ codigo: string, mensagem: string }>;
    [key: string]: any;
}

export class FocusNFe {
    private token: string;
    private baseUrl: string;

    constructor(token?: string, environment?: string) {
        this.token = token || process.env.FOCUS_API_KEY || '';
        const isProd = environment === 'producao';
        this.baseUrl = isProd ? 'https://api.focusnfe.com.br' : (process.env.FOCUS_URL || 'https://homologacao.focusnfe.com.br');
    }

    public isConfigured(): boolean {
        return !!this.token;
    }

    private getAuthHeader(): string {
        const auth = Buffer.from(`${this.token}:`).toString('base64');
        return `Basic ${auth}`;
    }

    private async request<T = any>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseUrl}${path}`;

        const headers: Record<string, string> = {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
        };

        // DEBUG LOGS
        console.log(`[FocusNFe DEBUG] ${new Date().toISOString()} - ${method} ${url}`);
        if (data) {
            console.log(`[FocusNFe DEBUG] Payload:`, JSON.stringify(data, null, 2));
        }

        const config: RequestInit = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined,
        };

        try {
            const start = Date.now();
            const res = await fetch(url, config);
            const duration = Date.now() - start;

            let responseBody;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseBody = await res.json();
            } else {
                responseBody = await res.text();
            }

            console.log(`[FocusNFe DEBUG] Response (${res.status}) in ${duration}ms:`,
                typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : responseBody
            );

            if (!res.ok) {
                throw {
                    status: res.status,
                    message: res.statusText,
                    body: responseBody
                };
            }

            return responseBody as T;
        } catch (error: any) {
            console.error('[FocusNFe ERROR]:', error);
            throw error;
        }
    }

    /**
     * Mapeia uma venda do sistema para o formato NFCe da Focus
     */
    buildNFCePayload(sale: any, fiscalConfig: any) {
        if (!fiscalConfig) throw new Error("Fiscal configuration missing");

        const items = sale.items.map((item: any, index: number) => ({
            numero_item: (index + 1).toString(),
            codigo_produto: item.id || item.productId,
            descricao: item.name,
            cfop: item.cfop || '5102',
            codigo_ncm: item.ncm || '21069090',
            unidade_comercial: "UN",
            quantidade_comercial: item.quantity.toFixed(4), // Use 4 decimal places for quantity
            valor_unitario_comercial: item.price.toFixed(2),
            unidade_tributavel: "UN",
            quantidade_tributavel: item.quantity.toFixed(4),
            valor_unitario_tributavel: item.price.toFixed(2),
            valor_bruto: (item.price * item.quantity).toFixed(2),
            icms_origem: item.icms_origem || "0",
            icms_situacao_tributaria: item.icms_situacao_tributaria || "102",
            icms_aliquota: "0.00",
            icms_base_calculo: "0.00",
            icms_valor: "0.00",
            icms_modalidade_base_calculo: "3",
            pis_situacao_tributaria: "07",
            cofins_situacao_tributaria: "07"
        }));

        const formas_pagamento = sale.payments.map((p: any) => {
            let fp = "99"; // Outros
            if (p.method === 'money' || p.method === 'cash') fp = "01";
            else if (p.method === 'credit') fp = "03";
            else if (p.method === 'debit') fp = "04";
            else if (p.method === 'pix') fp = "17";

            return {
                forma_pagamento: fp,
                valor_pagamento: p.amount.toFixed(2)
            };
        });

        // Totals
        const valor_produtos = sale.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0).toFixed(2);

        const payload: any = {
            data_emissao: new Date().toISOString(),
            natureza_operacao: "VENDA AO CONSUMIDOR",
            tipo_documento: "1",
            presenca_comprador: "1",
            consumidor_final: "1",
            finalidade_emissao: "1",
            modalidade_frete: "9",
            informacoes_adicionais_contribuinte: "Venda realizada via sistema Conserva POS. Agradecemos a preferencia!",
            items,
            formas_pagamento,
            valor_produtos,
            valor_desconto: "0.00",
            valor_total: sale.total.toFixed(2),
            icms_valor_total: "0.00",
            // Dados do Emitente
            cnpj_emitente: fiscalConfig.cnpj_emitente?.replace(/\D/g, ''),
            nome_emitente: fiscalConfig.nome_emitente,
            nome_fantasia_emitente: fiscalConfig.nome_fantasia_emitente,
            logradouro_emitente: fiscalConfig.logradouro_emitente,
            numero_emitente: fiscalConfig.numero_emitente,
            bairro_emitente: fiscalConfig.bairro_emitente,
            municipio_emitente: fiscalConfig.municipio_emitente,
            uf_emitente: fiscalConfig.uf_emitente,
            cep_emitente: fiscalConfig.cep_emitente?.replace(/\D/g, ''),
            inscricao_estadual_emitente: fiscalConfig.inscricao_estadual_emitente,
            regime_tributario: fiscalConfig.regime_tributario || "1"
        };

        if (sale.customer?.cpf) {
            payload.cpf_destinatario = sale.customer.cpf.replace(/\D/g, '');
            payload.nome_destinatario = sale.customer.name;
            payload.indicador_ie_destinatario = "9"; // Nao contribuinte
        } else {
            payload.indicador_ie_destinatario = "9";
        }

        return payload;
    }

    // ==========================================
    // NFe / NFCe operations
    // ==========================================

    async emitirNFCe(reference: string, data: any): Promise<FocusResponse> {
        return this.request(`/v2/nfce?ref=${reference}`, 'POST', data);
    }

    async consultarNFCe(reference: string, completa: boolean = false): Promise<FocusResponse> {
        return this.request(`/v2/nfce/${reference}${completa ? '?completa=1' : ''}`, 'GET');
    }

    async cancelarNFCe(reference: string, justificativa: string): Promise<FocusResponse> {
        return this.request(`/v2/nfce/${reference}`, 'DELETE', { justificativa });
    }

    async checkStatus(): Promise<boolean> {
        try {
            await this.request('/v2/ncms?codigo=10000000', 'GET');
            return true;
        } catch (e) {
            return false;
        }
    }
}

export const focusNFe = new FocusNFe();
