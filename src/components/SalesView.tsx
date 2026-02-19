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
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <div className="bg-white border-b p-6">
                <h1 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Vendas</h1>

                {/* Filtros */}
                <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente ou valor..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterMethod('all')}
                            className={`px-4 py-2 rounded-lg font-medium ${filterMethod === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterMethod('pix')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${filterMethod === 'pix'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <QrCode size={16} /> PIX
                        </button>
                        <button
                            onClick={() => setFilterMethod('card')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${filterMethod === 'card'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <CreditCard size={16} /> Cartão
                        </button>
                        <button
                            onClick={() => setFilterMethod('money')}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${filterMethod === 'money'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Banknote size={16} /> Dinheiro
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de vendas */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-400">Carregando...</div>
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-400">Nenhuma venda encontrada</div>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredSales.map(sale => (
                            <div key={sale._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                            <Calendar size={14} />
                                            <span>{new Date(sale.date).toLocaleString('pt-BR')}</span>
                                        </div>

                                        {sale.customer && (
                                            <div className="text-sm text-gray-600 mb-2">
                                                {sale.customer.name}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {sale.payments.map((payment, idx) => (
                                                <span
                                                    key={`${sale._id}-payment-${idx}`}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-sm text-gray-700"
                                                >
                                                    {getPaymentIcon(payment.method)}
                                                    {formatMethod(payment.method)}
                                                    <span className="font-medium">
                                                        R$ {payment.amount.toFixed(2)}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Total</div>
                                            <div className="text-xl font-semibold text-gray-800">
                                                R$ {sale.total.toFixed(2)}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleReprint(sale)}
                                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            title="Reimprimir"
                                        >
                                            <Printer size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Itens */}
                                {sale.items && sale.items.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex flex-wrap gap-2">
                                            {sale.items.map((item, idx) => (
                                                <span key={`${sale._id}-item-${idx}`} className="text-xs text-gray-500">
                                                    {item.quantity}x {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
