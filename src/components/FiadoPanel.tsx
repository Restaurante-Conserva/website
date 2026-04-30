"use client";

import React, { useState, useEffect } from 'react';
import { Search, DollarSign, ClipboardList, ShoppingBag, ArrowLeftCircle, Loader2, X, TrendingUp, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import PaymentModal from './PaymentModal';
import StatCard from './admin/StatCard';
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

    const totalToReceive = Object.values(groupedByCustomer).reduce((sum, c) => sum + (c as any).totalDebt, 0);

    return (
        <div className="flex h-full flex-col font-sans text-sm bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white overflow-hidden transition-colors">
            <header className="px-10 py-6 border-b border-gray-200 dark:border-[#1a1a1a] flex flex-wrap md:flex-nowrap items-center justify-between gap-8 shrink-0 bg-white dark:bg-[#0c0c0c] shadow-sm dark:shadow-none">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setView('pos')}
                        className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-xl text-gray-400 dark:text-[#333] hover:text-orange-600 dark:hover:text-orange-500 transition-all bg-transparent border-none cursor-pointer"
                    >
                        <ArrowLeftCircle size={24} />
                    </button>
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-sm border border-orange-200 dark:border-orange-500/20">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black leading-tight text-gray-900 dark:text-white uppercase tracking-tight">Gestão de Fiados</h2>
                        <p className="text-[10px] text-gray-500 dark:text-[#444] font-black uppercase tracking-[0.2em] mt-1">Monitoramento de Crédito & Abatimentos</p>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#333] group-focus-within:text-orange-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#1a1a1a] rounded-xl pl-12 pr-4 py-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#222] outline-none focus:border-orange-500/50 transition-all shadow-inner dark:shadow-none"
                        />
                    </div>
                    <button onClick={() => setView('pos')} className="p-2 text-gray-400 dark:text-[#222] hover:text-gray-800 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                        <X size={24} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 md:p-10" style={{ scrollbarWidth: 'thin' }}>
                    <div className="max-w-7xl mx-auto space-y-10">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Total Pendente"
                                value={`R$ ${totalToReceive.toFixed(2).replace('.', ',')}`}
                                icon={<TrendingUp size={20} />}
                                trend="Saldo Devedor"
                                color="text-red-600 dark:text-red-500"
                            />
                            <StatCard
                                title="Clientes com Débito"
                                value={Object.keys(groupedByCustomer).length.toString()}
                                icon={<Users size={20} />}
                                color="text-orange-600 dark:text-orange-500"
                            />
                            <StatCard
                                title="Média por Cliente"
                                value={`R$ ${(totalToReceive / (Object.keys(groupedByCustomer).length || 1)).toFixed(2).replace('.', ',')}`}
                                icon={<DollarSign size={20} />}
                                color="text-blue-600 dark:text-blue-500"
                            />
                        </div>

                        {isLoading && fiadoSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-gray-400 dark:text-[#222] gap-6">
                                <Loader2 className="animate-spin text-orange-500" size={48} />
                                <p className="font-black text-[10px] tracking-[0.3em] uppercase">Sincronizando registros...</p>
                            </div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-20 grayscale">
                                <ShoppingBag size={80} className="mb-6" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sem pendências ativas</p>
                            </div>
                        ) : (
                            <div className="border border-gray-100 dark:border-[#1a1a1a] rounded-2xl overflow-hidden shadow-sm dark:shadow-none bg-white dark:bg-[#0a0a0a]">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-black border-b border-gray-100 dark:border-[#1a1a1a] text-gray-400 dark:text-[#444] font-black uppercase tracking-[0.15em] text-[10px]">
                                        <tr>
                                            <th className="px-10 py-6">Cliente devedor</th>
                                            <th className="px-10 py-6 text-center">Títulos</th>
                                            <th className="px-10 py-6">Valor Total</th>
                                            <th className="px-10 py-6 text-right w-48">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-[#111]">
                                        {filteredCustomers.map(({ customer, sales, totalDebt }: any, i) => (
                                            <tr key={customer._id || customer.id || customer.cpf || `cust-${i}`} className="hover:bg-gray-50 dark:hover:bg-black transition-all group border-none">
                                                <td className="px-10 py-7">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-600/10 text-orange-600 dark:text-orange-500 flex items-center justify-center font-black text-lg uppercase border border-orange-200 dark:border-orange-500/20 shadow-sm transition-transform group-hover:scale-110">
                                                            {customer.name?.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight text-sm">{customer.name}</span>
                                                            <span className="text-[10px] text-gray-400 dark:text-[#333] font-black mt-1 tracking-widest uppercase">{customer.cpf || 'Documento não informado'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <span className="bg-gray-100 dark:bg-[#151515] text-gray-500 dark:text-[#555] px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-gray-200 dark:border-[#222]">
                                                        {sales.length} {sales.length === 1 ? 'Título' : 'Títulos'}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-7">
                                                    <span className="text-xl font-black text-red-600 dark:text-red-500 tabular-nums tracking-tight">R$ {totalDebt.toFixed(2)}</span>
                                                </td>
                                                <td className="px-10 py-7 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedCustomer({ customer, sales, totalDebt });
                                                            setIsPaymentOpen(true);
                                                        }}
                                                        className="px-8 py-3.5 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-500 hover:scale-[1.02] transition-all border-none cursor-pointer flex items-center justify-center gap-3 ml-auto shadow-xl shadow-orange-600/10 active:scale-95"
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
