"use client";

import { useState, useEffect } from 'react';
import { Search, DollarSign, User, ClipboardList, ShoppingBag, ArrowLeftCircle, Loader2, X, TrendingUp, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import PaymentModal from './PaymentModal';

interface FiadoSale {
    id: string; // Mapeado do virtual 'id' ou '_id'
    _id?: string;
    customer: {
        id?: string;
        _id?: string;
        name: string;
        cpf?: string;
    };
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    total: number;
    date: string;
    payments: Array<{
        method: string;
        amount: number;
    }>;
}

export default function FiadoPanel({ setView }: { setView: (view: any) => void }) {
    const [fiadoSales, setFiadoSales] = useState<FiadoSale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchFiadoSales();
    }, []);

    const fetchFiadoSales = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sales');
            if (res.ok) {
                const allSales = await res.json();
                // Filtramos vendas que têm saldo fiado pendente > 1 centavo
                const fiado = allSales.filter((sale: any) =>
                    sale.payments?.some((p: any) => p.method === 'fiado' && p.amount > 0.01)
                );
                setFiadoSales(fiado);
            }
        } catch (error) {
            console.error('Erro ao buscar vendas fiadas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const groupedByCustomer = fiadoSales.reduce((acc, sale) => {
        // PRIORIDADE: ID do MongoDB. Se não tiver, usa CPF ou Nome.
        const custId = sale.customer?._id || sale.customer?.id || sale.customer?.cpf || sale.customer?.name || 'unidentified';
        if (!acc[custId]) {
            acc[custId] = {
                customer: sale.customer || { name: 'Não identificado' },
                sales: [],
                totalDebt: 0
            };
        }
        acc[custId].sales.push(sale);
        const fiadoAmount = sale.payments.find(p => p.method === 'fiado')?.amount || 0;
        acc[custId].totalDebt += fiadoAmount;
        return acc;
    }, {} as Record<string, { customer: any; sales: FiadoSale[]; totalDebt: number }>);

    const filteredCustomers = Object.values(groupedByCustomer).filter(({ customer }) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.cpf?.includes(searchTerm)
    );

    const handlePaymentComplete = async (payments: any[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number, fiadoTaker?: string, isMerchantCopy?: boolean) => {
        if (!selectedCustomer) return;

        setIsLoading(true);
        setMessage(null);

        const totalPaidNow = payments.reduce((acc, p) => acc + p.amount, 0);
        let remainingToPay = totalPaidNow;

        const sortedSales = [...selectedCustomer.sales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const salesPaidSuccessfully: any[] = [];

        try {
            for (const sale of sortedSales) {
                if (remainingToPay <= 0) break;

                const fiadoRecord = sale.payments.find((p: any) => p.method === 'fiado');
                const fiadoAmount = fiadoRecord ? fiadoRecord.amount : 0;
                if (fiadoAmount <= 0) continue;

                const paymentForThisSale = Math.min(remainingToPay, fiadoAmount);
                remainingToPay -= paymentForThisSale;

                const otherPayments = sale.payments.filter((p: any) => p.method !== 'fiado');
                const newPayments = [...otherPayments];

                if (paymentForThisSale < fiadoAmount - 0.01) {
                    newPayments.push({
                        method: 'fiado',
                        amount: fiadoAmount - paymentForThisSale
                    });
                }

                payments.forEach(p => {
                    const proportion = p.amount / (totalPaidNow || 1);
                    newPayments.push({
                        method: p.method,
                        amount: paymentForThisSale * proportion
                    });
                });

                const saleId = (sale as any)._id || sale.id;
                console.log(`[FIADO DEBUG] Patching sale ${saleId} with amount ${paymentForThisSale}`);

                const res = await fetch(`/api/sales/${saleId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payments: newPayments,
                        isFiscal: false // Fiado não gera nota NFC
                    })
                });

                if (res.ok) {
                    const updatedSale = await res.json();
                    salesPaidSuccessfully.push({
                        sale: updatedSale,
                        amountAbated: paymentForThisSale
                    });

                    if (isFiscal && (updatedSale.nfeStatus === 'issued' || updatedSale.qrcode_url)) {
                        const fiscalPayload = {
                            type: isCustomerCopy ? 'both' : 'fiscal',
                            isMerchantCopy,
                            fiadoTaker,
                            ...updatedSale
                        };
                        fetch('http://localhost:7777/print', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(fiscalPayload)
                        }).catch(err => console.error('Erro na impressão fiscal:', err));
                    }
                } else {
                    const errorData = await res.json();
                    console.error(`[FIADO DEBUG] Failed to patch sale ${saleId}:`, errorData);
                    throw new Error(`Erro ao abater nota ${saleId}`);
                }
            }

            if (salesPaidSuccessfully.length > 0) {
                const receiptPayload = {
                    type: 'receipt',
                    isMerchantCopy,
                    fiadoTaker,
                    title: 'RECIBO DE ABATE DE FIADO',
                    customer: selectedCustomer.customer,
                    date: new Date().toISOString(),
                    total: totalPaidNow,
                    subtotal: totalPaidNow,
                    discount: 0,
                    paidAmount: totalPaidNow,
                    payments: payments,
                    items: salesPaidSuccessfully.flatMap(s => s.sale.items.map((it: any) => ({
                        ...it,
                        name: `[ABATE] ${it.name}`
                    })))
                };

                await fetch('http://localhost:7777/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(receiptPayload)
                }).catch(err => console.error('Erro na impressão não-fiscal:', err));
            }

            const customerId = selectedCustomer.customer._id || selectedCustomer.customer.id;
            if (customerId && customerId.length > 10) {
                await fetch(`/api/customers/${customerId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ debtAbatement: totalPaidNow })
                }).catch(err => console.error('Erro ao abater saldo global:', err));
            }

            setMessage({ type: 'success', text: `Recebimento de R$ ${totalPaidNow.toFixed(2)} processado!` });
            setTimeout(() => setMessage(null), 5000);

        } catch (error: any) {
            console.error('Erro no processamento:', error);
            setMessage({ type: 'error', text: error.message || 'Erro ao processar pagamentos.' });
        } finally {
            await fetchFiadoSales();
            setIsLoading(false);
            setIsPaymentOpen(false);
            setSelectedCustomer(null);
        }
    };

    return (
        <div className="absolute inset-0 bg-white z-[100] flex flex-col font-sans text-sm animate-in fade-in duration-300">
            <header className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setView('pos')}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        <ArrowLeftCircle size={18} />
                    </button>
                    <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <ClipboardList size={14} />
                    </div>
                    <div>
                        <h2 className="text-[13px] font-bold text-gray-800 leading-tight">Fiados</h2>
                        <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Gestão de Crédito</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {message && (
                        <div className={`px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                            {message.text}
                        </div>
                    )}
                    <div className="relative group w-64 md:w-80">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-medium outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                    </div>
                    <button onClick={() => setView('pos')} className="p-1 text-gray-300 hover:text-gray-500 transition-colors bg-transparent border-none cursor-pointer">
                        <X size={18} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-8 bg-white">
                    <div className="max-w-5xl mx-auto space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <StatCard
                                title="Total a Receber"
                                value={`R$ ${Object.values(groupedByCustomer).reduce((sum, c) => sum + (c as any).totalDebt, 0).toFixed(2).replace('.', ',')}`}
                                icon={<TrendingUp size={16} />}
                                trend="Saldo Devedor"
                                color="text-red-600"
                            />
                            <StatCard
                                title="Clientes Devedores"
                                value={Object.keys(groupedByCustomer).length.toString()}
                                icon={<Users size={16} />}
                                trend="Ativos"
                                color="text-blue-600"
                            />
                            <StatCard
                                title="Média por Cliente"
                                value={`R$ ${(Object.values(groupedByCustomer).reduce((sum, c) => sum + (c as any).totalDebt, 0) / (Object.keys(groupedByCustomer).length || 1)).toFixed(2).replace('.', ',')}`}
                                icon={<DollarSign size={16} />}
                                trend="Ticket Médio"
                                color="text-gray-600"
                            />
                        </div>

                        {isLoading && fiadoSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-3">
                                <Loader2 className="animate-spin" size={32} />
                                <p className="font-bold text-[10px] tracking-widest uppercase">Carregando dados financeiros...</p>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale">
                                <ShoppingBag size={48} className="text-gray-400 mb-4" />
                                <p className="text-[11px] font-bold uppercase tracking-widest">Nenhuma pendência encontrada</p>
                            </div>
                        ) : (
                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                                <table className="w-full text-left text-[10px]">
                                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[8px]">
                                        <tr>
                                            <th className="px-6 py-3">Cliente</th>
                                            <th className="px-6 py-3">Pendências</th>
                                            <th className="px-6 py-3">Saldo Devedor</th>
                                            <th className="px-6 py-3 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredCustomers.map(({ customer, sales, totalDebt }: any, i) => (
                                            <tr key={customer._id || customer.id || customer.cpf || `cust-${i}`} className="hover:bg-gray-50/10 transition-colors group">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                            {customer.name?.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800 uppercase tabular-nums">{customer.name}</span>
                                                            <span className="text-[8px] text-gray-400 font-medium">{customer.cpf || 'Sem CPF'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase">{sales.length} Notas</span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-sm font-bold text-gray-900 tabular-nums">R$ {totalDebt.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCustomer({ customer, sales, totalDebt });
                                                            setIsPaymentOpen(true);
                                                        }}
                                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all border-none cursor-pointer flex items-center gap-2 ml-auto shadow-lg shadow-blue-100 active:scale-95"
                                                    >
                                                        <DollarSign size={14} />
                                                        Receber
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {isPaymentOpen && selectedCustomer && (
                <PaymentModal
                    total={selectedCustomer.totalDebt}
                    hasCustomer={true}
                    isPartialAllowed={true}
                    onCancel={() => {
                        setIsPaymentOpen(false);
                        setSelectedCustomer(null);
                    }}
                    onConfirm={handlePaymentComplete}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: any) {
    return (
        <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-center mb-4">
                <div className={`p-2 bg-gray-50 rounded-lg group-hover:bg-current/10 transition-colors ${color}`}>{icon}</div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full bg-gray-50 ${color}`}>{trend}</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 tracking-wider mb-0.5 uppercase">{title}</p>
            <h4 className="text-xl font-bold text-gray-900 tracking-tight tabular-nums">{value}</h4>
        </div>
    );
}
