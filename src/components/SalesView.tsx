"use client";

import { useState, useEffect } from 'react';
import { Search, Printer, Calendar, DollarSign, CreditCard, QrCode, Banknote } from 'lucide-react';

interface Sale {
    _id: string;
    date: string;
    total: number;
    payments: { method: string; amount: number }[];
    items: any[];
    customer?: { name: string };
}

export default function SalesView() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    useEffect(() => {
        filterSales();
    }, [sales, searchTerm, filterMethod]);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sales');
            const data = await res.json();
            setSales(data);
        } catch (e) {
            console.error('Erro ao carregar vendas:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const filterSales = () => {
        let filtered = sales;

        if (filterMethod !== 'all') {
            filtered = filtered.filter(sale =>
                sale.payments.some(p => p.method === filterMethod)
            );
        }

        if (searchTerm) {
            filtered = filtered.filter(sale =>
                sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.total.toString().includes(searchTerm)
            );
        }

        setFilteredSales(filtered);
    };

    const handleReprint = async (sale: Sale) => {
        try {
            const printerPayload = {
                type: 'nonfiscal',
                items: sale.items,
                total: sale.total,
                subtotal: sale.total,
                discount: 0,
                payments: sale.payments,
                customer: sale.customer,
                paidAmount: sale.total,
                date: sale.date
            };

            const res = await fetch('http://localhost:7777/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(printerPayload)
            });

            if (res.ok) {
                alert('Cupom reenviado para impressão');
            } else {
                alert('Erro: Impressora offline');
            }
        } catch (e) {
            alert('Erro: Impressora offline');
        }
    };

    const formatMethod = (method: string) => {
        const map: Record<string, string> = {
            'money': 'Dinheiro',
            'cash': 'Dinheiro',
            'pix': 'PIX',
            'credit': 'Crédito',
            'debit': 'Débito',
            'card': 'Cartão',
            'fiado': 'Fiado'
        };
        return map[method.toLowerCase()] || method;
    };

    const getPaymentIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'pix': return <QrCode size={16} />;
            case 'credit':
            case 'debit':
            case 'card': return <CreditCard size={16} />;
            case 'money':
            case 'cash': return <Banknote size={16} />;
            default: return <DollarSign size={16} />;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0c0c0c] text-white">
            {/* Header */}
            <div className="border-b border-white/[0.05] px-5 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-sm font-semibold text-white">Histórico</h1>
                        <p className="text-[9px] text-[#444] font-medium uppercase tracking-widest mt-0.5">{filteredSales.length} vendas</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={13} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#111] border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#333] outline-none focus:border-orange-500/50 transition-all w-48"
                        />
                    </div>
                    <div className="flex gap-1.5">
                        {(['all', 'pix', 'card', 'money'] as const).map(method => (
                            <button
                                key={method}
                                onClick={() => setFilterMethod(method)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all flex items-center gap-1 ${
                                    filterMethod === method
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-white/5 text-[#555] hover:text-[#999] hover:bg-white/[0.07]'
                                }`}
                            >
                                {method === 'all' && 'Todos'}
                                {method === 'pix' && <><QrCode size={11} /> PIX</>}
                                {method === 'card' && <><CreditCard size={11} /> Cartão</>}
                                {method === 'money' && <><Banknote size={11} /> Dinheiro</>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lista de vendas */}
            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-[#444] gap-2 text-xs">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        Carregando...
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-[#333] text-xs">Nenhuma venda encontrada</div>
                ) : (
                    <div className="space-y-1.5">
                        {filteredSales.map(sale => (
                            <div key={sale._id} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3 hover:border-orange-500/20 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-[9px] text-[#444] mb-1.5">
                                            <Calendar size={11} />
                                            <span>{new Date(sale.date).toLocaleString('pt-BR')}</span>
                                            {sale.customer && <span className="text-[#777] font-medium">{sale.customer.name}</span>}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {sale.payments.map((payment, idx) => (
                                                <span
                                                    key={`${sale._id}-payment-${idx}`}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-[9px] text-[#777]"
                                                >
                                                    {getPaymentIcon(payment.method)}
                                                    {formatMethod(payment.method)}
                                                    <span className="font-semibold text-[#aaa]">R$ {payment.amount.toFixed(2)}</span>
                                                </span>
                                            ))}
                                        </div>
                                        {sale.items && sale.items.length > 0 && (
                                            <div className="flex flex-wrap gap-x-2 mt-1.5">
                                                {sale.items.map((item, idx) => (
                                                    <span key={`${sale._id}-item-${idx}`} className="text-[9px] text-[#333]">
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 ml-4 shrink-0">
                                        <div className="text-right">
                                            <div className="text-[9px] text-[#444]">Total</div>
                                            <div className="text-base font-black text-orange-400">R$ {sale.total.toFixed(2)}</div>
                                        </div>
                                        <button
                                            onClick={() => handleReprint(sale)}
                                            className="p-2 bg-white/[0.04] border border-white/[0.06] text-[#555] rounded-lg hover:text-white hover:bg-orange-600 hover:border-orange-600 transition-all"
                                            title="Reimprimir"
                                        >
                                            <Printer size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
