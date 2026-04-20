"use client";

import { useState, useEffect } from 'react';
import { Search, DollarSign, ClipboardList, ShoppingBag, ArrowLeftCircle, Loader2, X, TrendingUp, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import PaymentModal from './PaymentModal';
import { useToast } from '../context/ToastContext';

interface FiadoSale {
    id: string;
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
    const { showToast } = useToast();
    const [fiadoSales, setFiadoSales] = useState<FiadoSale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchFiadoSales();
    }, []);

    const fetchFiadoSales = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sales');
            if (res.ok) {
                const allSales = await res.json();
                const fiado = allSales.filter((sale: any) =>
                    sale.payments?.some((p: any) => p.method === 'fiado' && p.amount > 0.01)
                );
                setFiadoSales(fiado);
            }
        } catch (error) {
            console.error('Erro ao buscar vendas fiadas:', error);
            showToast('Erro ao carregar dados financeiros.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const groupedByCustomer = fiadoSales.reduce((acc, sale) => {
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

                const res = await fetch(`/api/sales/${saleId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        payments: newPayments,
                        isFiscal: false
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

            showToast(`Recebimento de R$ ${totalPaidNow.toFixed(2)} processado!`, 'success');

        } catch (error: any) {
            console.error('Erro no processamento:', error);
            showToast(error.message || 'Erro ao processar pagamentos.', 'error');
        } finally {
            await fetchFiadoSales();
            setIsLoading(false);
            setIsPaymentOpen(false);
            setSelectedCustomer(null);
        }
    };

    return (
        <div className="flex h-full flex-col font-sans text-sm bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white overflow-hidden transition-colors">
            <header className="px-6 py-4 border-b border-gray-200 dark:border-white/[0.05] flex flex-wrap md:flex-nowrap items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#0c0c0c] shadow-sm dark:shadow-none">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('pos')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-xl text-gray-500 dark:text-[#555] hover:text-orange-600 dark:hover:text-orange-500 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        <ArrowLeftCircle size={22} />
                    </button>
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-600/10 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-sm border border-orange-200 dark:border-orange-500/20">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black leading-tight text-gray-900 dark:text-white uppercase tracking-tight">Fiados</h2>
                        <p className="text-[10px] text-gray-500 dark:text-[#555] font-bold uppercase tracking-wider mt-0.5">Gestão de Crédito em Loja</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#444]" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/[0.06] rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#333] outline-none focus:border-orange-500/50 focus:bg-white dark:focus:bg-[#151515] transition-all shadow-inner dark:shadow-none"
                        />
                    </div>
                    <button onClick={() => setView('pos')} className="p-2 text-gray-400 dark:text-[#555] hover:text-gray-800 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                        <X size={22} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 md:p-8" style={{ scrollbarWidth: 'thin' }}>
                    <div className="max-w-6xl mx-auto space-y-8">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <StatCard
                                title="Total a Receber"
                                value={`R$ ${Object.values(groupedByCustomer).reduce((sum, c) => sum + (c as any).totalDebt, 0).toFixed(2).replace('.', ',')}`}
                                icon={<TrendingUp size={20} />}
                                trend="Saldo Devedor"
                                color="text-red-600 dark:text-red-500"
                                bg="bg-red-50 dark:bg-red-500/10"
                                borderColor="border-red-100 dark:border-red-500/20"
                            />
                            <StatCard
                                title="Clientes Devedores"
                                value={Object.keys(groupedByCustomer).length.toString()}
                                icon={<Users size={20} />}
                                trend="Ativos"
                                color="text-orange-600 dark:text-orange-500"
                                bg="bg-orange-50 dark:bg-orange-500/10"
                                borderColor="border-orange-100 dark:border-orange-500/20"
                            />
                            <StatCard
                                title="Média por Cliente"
                                value={`R$ ${(Object.values(groupedByCustomer).reduce((sum, c) => sum + (c as any).totalDebt, 0) / (Object.keys(groupedByCustomer).length || 1)).toFixed(2).replace('.', ',')}`}
                                icon={<DollarSign size={20} />}
                                trend="Ticket Médio"
                                color="text-blue-600 dark:text-[#aaa]"
                                bg="bg-blue-50 dark:bg-white/5"
                                borderColor="border-blue-100 dark:border-white/10"
                            />
                        </div>

                        {isLoading && fiadoSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500 dark:text-[#444] gap-4">
                                <Loader2 className="animate-spin text-orange-500" size={40} />
                                <p className="font-bold text-xs tracking-widest uppercase">Carregando dados financeiros...</p>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 opacity-60 dark:opacity-40">
                                <ShoppingBag size={56} className="text-gray-400 dark:text-[#333] mb-5" />
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#555]">Nenhuma pendência encontrada</p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 dark:border-white/[0.05] rounded-[24px] overflow-hidden shadow-sm dark:shadow-none bg-white dark:bg-[#111]">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/[0.05] text-gray-500 dark:text-[#555] font-bold uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th className="px-8 py-5">Cliente</th>
                                            <th className="px-8 py-5">Pendências</th>
                                            <th className="px-8 py-5">Saldo Devedor</th>
                                            <th className="px-8 py-5 text-right w-40">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                                        {filteredCustomers.map(({ customer, sales, totalDebt }: any, i) => (
                                            <tr key={customer._id || customer.id || customer.cpf || `cust-${i}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-600/10 text-orange-600 dark:text-orange-500 flex items-center justify-center font-black text-sm uppercase border border-orange-200 dark:border-orange-500/20 shadow-sm dark:shadow-none">
                                                            {customer.name?.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900 dark:text-white uppercase tabular-nums tracking-tight">{customer.name}</span>
                                                            <span className="text-[10px] text-gray-500 dark:text-[#555] font-bold mt-0.5 tracking-wider uppercase">{customer.cpf || 'Sem CPF'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-[#888] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border border-gray-200 dark:border-white/[0.05]">{sales.length} Notas</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-base font-black text-red-600 dark:text-red-400 tabular-nums">R$ {totalDebt.toFixed(2)}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCustomer({ customer, sales, totalDebt });
                                                            setIsPaymentOpen(true);
                                                        }}
                                                        className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-orange-500 hover:scale-[1.02] transition-all border-none cursor-pointer flex items-center justify-center gap-2.5 ml-auto shadow-md shadow-orange-600/20 dark:shadow-orange-900/20 active:scale-95 w-full md:w-auto"
                                                    >
                                                        <DollarSign size={16} />
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

function StatCard({ title, value, icon, trend, color, bg, borderColor }: any) {
    return (
        <div className={`bg-white dark:bg-[#111] border ${borderColor ? borderColor : 'border-gray-200 dark:border-white/[0.05]'} p-6 rounded-[24px] shadow-sm hover:shadow-md transition-all group`}>
            <div className="flex justify-between items-center mb-5">
                <div className={`p-3 rounded-xl border ${borderColor} ${bg} ${color} shadow-sm dark:shadow-none`}>{icon}</div>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${bg} ${color} border ${borderColor} uppercase tracking-widest`}>{trend}</span>
            </div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-[#555] tracking-widest mb-1.5 uppercase">{title}</p>
            <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight tabular-nums">{value}</h4>
        </div>
    );
}
