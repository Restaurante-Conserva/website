"use client";

import { useState, useEffect } from 'react';
import { Search, DollarSign, User, ClipboardList, ShoppingBag, ArrowLeftCircle, Loader2, X, TrendingUp, Users, CheckCircle2, AlertCircle, Calendar, Receipt, ChevronRight } from 'lucide-react';
import PaymentModal from './PaymentModal';

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
    const [fiadoSales, setFiadoSales] = useState<FiadoSale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
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

    const filteredCustomers = Object.entries(groupedByCustomer).filter(([_, { customer }]) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.cpf?.includes(searchTerm)
    );

    const totalDebt = Object.values(groupedByCustomer).reduce((sum, c) => sum + c.totalDebt, 0);
    const avgDebt = totalDebt / (Object.keys(groupedByCustomer).length || 1);

    const handlePaymentComplete = async (payments: any[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number, fiadoTaker?: string, isMerchantCopy?: boolean) => {
        if (!selectedCustomer) return;

        setIsLoading(true);
        setMessage(null);

        const totalPaidNow = payments.reduce((acc, p) => acc + p.amount, 0);
        let remainingToPay = totalPaidNow;

        const sortedSales = [...selectedCustomer.sales].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
                    console.error(`Failed to patch sale ${saleId}:`, errorData);
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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    return (
        <div className="absolute inset-0 bg-background z-[100] flex flex-col font-sans text-sm animate-in fade-in duration-300">
            {/* Header */}
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('pos')}
                        className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-secondary transition-colors bg-transparent border-none cursor-pointer"
                    >
                        <ArrowLeftCircle size={20} />
                    </button>
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground shadow-lg">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-card-foreground leading-tight">Gerenciar Fiados</h2>
                        <p className="text-xs text-muted-foreground font-medium">Controle de crédito e recebimentos</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {message && (
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {message.text}
                        </div>
                    )}
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-sm font-medium outline-none focus:bg-card focus:border-secondary transition-all text-card-foreground placeholder:text-muted-foreground"
                        />
                    </div>
                    <button onClick={() => setView('pos')} className="p-2 text-muted-foreground hover:text-card-foreground transition-colors bg-transparent border-none cursor-pointer hover:bg-muted rounded-xl">
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive">Pendente</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground tracking-wider mb-1 uppercase">Total a Receber</p>
                            <h4 className="text-2xl font-black text-card-foreground tracking-tight tabular-nums">
                                R$ {totalDebt.toFixed(2).replace('.', ',')}
                            </h4>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary">
                                    <Users size={20} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">Ativos</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground tracking-wider mb-1 uppercase">Clientes Devedores</p>
                            <h4 className="text-2xl font-black text-card-foreground tracking-tight tabular-nums">
                                {Object.keys(groupedByCustomer).length}
                            </h4>
                        </div>

                        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">Média</span>
                            </div>
                            <p className="text-xs font-bold text-muted-foreground tracking-wider mb-1 uppercase">Ticket Médio</p>
                            <h4 className="text-2xl font-black text-card-foreground tracking-tight tabular-nums">
                                R$ {avgDebt.toFixed(2).replace('.', ',')}
                            </h4>
                        </div>
                    </div>

                    {/* Customer List */}
                    {isLoading && fiadoSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                            <Loader2 className="animate-spin" size={40} />
                            <p className="font-bold text-sm tracking-wide">Carregando dados financeiros...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                                <ShoppingBag size={32} />
                            </div>
                            <p className="text-base font-bold">Nenhuma pendência encontrada</p>
                            <p className="text-sm text-muted-foreground/60">Todos os clientes estão em dia</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCustomers.map(([custId, { customer, sales, totalDebt }]) => (
                                <div key={custId} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    {/* Customer Header */}
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => setExpandedCustomer(expandedCustomer === custId ? null : custId)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg uppercase">
                                                {customer.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-card-foreground">{customer.name}</h3>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">{customer.cpf || 'Sem CPF'}</span>
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-md font-medium text-muted-foreground">
                                                        {sales.length} {sales.length === 1 ? 'pendência' : 'pendências'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground font-medium">Saldo devedor</p>
                                                <p className="text-lg font-black text-destructive tabular-nums">R$ {totalDebt.toFixed(2)}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCustomer({ customer, sales, totalDebt });
                                                    setIsPaymentOpen(true);
                                                }}
                                                className="px-5 py-2.5 bg-success text-success-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all border-none cursor-pointer flex items-center gap-2 shadow-lg active:scale-95"
                                            >
                                                <DollarSign size={16} />
                                                Receber
                                            </button>
                                            <ChevronRight 
                                                size={20} 
                                                className={`text-muted-foreground transition-transform ${expandedCustomer === custId ? 'rotate-90' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Expanded Sales List */}
                                    {expandedCustomer === custId && (
                                        <div className="border-t border-border bg-muted/30 p-4 animate-in slide-in-from-top-2 duration-200">
                                            <div className="space-y-2">
                                                {sales.map((sale, idx) => {
                                                    const fiadoAmount = sale.payments.find(p => p.method === 'fiado')?.amount || 0;
                                                    return (
                                                        <div key={sale.id || sale._id || idx} className="bg-card p-3 rounded-xl border border-border flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                                                    <Receipt size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-card-foreground">
                                                                        {sale.items.slice(0, 2).map(i => i.name).join(', ')}
                                                                        {sale.items.length > 2 && ` +${sale.items.length - 2}`}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <Calendar size={12} />
                                                                        <span>{formatDate(sale.date)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-card-foreground tabular-nums">R$ {fiadoAmount.toFixed(2)}</p>
                                                                <p className="text-xs text-muted-foreground">de R$ {sale.total.toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
