"use client";

import { useMemo, useState, useEffect } from 'react';
import { History, DollarSign, Users, TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';
import StatCard from './StatCard';

interface Payment {
    method: string;
    amount: number;
}

interface SaleItem {
    id?: string;
    name?: string;
    quantity?: number;
    price?: number;
}

interface Sale {
    _id?: string;
    date?: string;
    total?: number;
    customerName?: string;
    items?: SaleItem[];
    payments?: Payment[];
}

interface Customer {
    id?: string;
    _id?: string;
    name: string;
}

interface StatsViewProps {
    sales: Sale[];
    customers: Customer[];
}

export default function StatsView({ sales, customers }: StatsViewProps) {
    const [localSales, setLocalSales] = useState<Sale[]>(sales);
    const today = new Date().toDateString();

    useEffect(() => {
        setLocalSales(sales);
    }, [sales]);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                // Fetch last 5000 sales for accurate dashboard stats
                const res = await fetch('/api/sales?limit=5000');
                if (res.ok) {
                    const data = await res.json();
                    setLocalSales(data);
                }
            } catch (e) {
                console.error("Erro ao carregar estatísticas:", e);
            }
        };
        fetchRecent();
    }, []);

    const todaySales = useMemo(() =>
        localSales.filter((s) => s.date && new Date(s.date).toDateString() === today),
        [localSales, today]);

    const todayRevenue = useMemo(() => todaySales.reduce((acc: number, sale) => acc + (sale.total || 0), 0), [todaySales]);
    const totalRevenue = useMemo(() => localSales.reduce((acc: number, sale) => acc + (sale.total || 0), 0), [localSales]);

    const avgTicket = useMemo(() =>
        localSales.length > 0 ? totalRevenue / localSales.length : 0,
        [totalRevenue, localSales]);

    const weeklyData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toDateString();
        });

        return last7Days.map(dateStr => {
            const dayRevenue = localSales
                .filter((s) => s.date && new Date(s.date).toDateString() === dateStr)
                .reduce((sum: number, s) => sum + (s.total || 0), 0);
            return { date: dateStr, amount: dayRevenue };
        });
    }, [localSales]);

    const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1);

    const recentSales = useMemo(() =>
        [...localSales].sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime()).slice(0, 5),
        [localSales]);

    const paymentMethodTotals = useMemo(() => {
        const map: Record<string, number> = { money: 0, pix: 0, credit: 0, debit: 0, fiado: 0 };
        localSales.forEach((s) => {
            (s.payments || []).forEach((p) => {
                if (map[p.method] !== undefined) map[p.method] += p.amount || 0;
            });
        });
        return Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    }, [localSales]);

    const methodLabel: Record<string, string> = {
        money: 'Dinheiro', pix: 'Pix', credit: 'Crédito', debit: 'Débito', fiado: 'Fiado'
    };
    const methodColor: Record<string, string> = {
        money: 'bg-emerald-500', pix: 'bg-teal-500', credit: 'bg-blue-500', debit: 'bg-indigo-500', fiado: 'bg-orange-500'
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    title="Vendas Hoje"
                    value={todaySales.length.toString()}
                    icon={<History size={20} />}
                    trend="+12%"
                />
                <StatCard
                    title="Receita Hoje"
                    value={`R$ ${todayRevenue.toFixed(2)}`}
                    icon={<DollarSign size={20} />}
                    trend="+8%"
                />
                <StatCard
                    title="Clientes"
                    value={customers.length.toString()}
                    icon={<Users size={20} />}
                    trend="+5%"
                />
                <StatCard
                    title="Ticket Médio"
                    value={`R$ ${avgTicket.toFixed(2)}`}
                    icon={<TrendingUp size={20} />}
                    trend="+3%"
                />
            </div>

            {/* Chart + Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Weekly Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-100 dark:border-[#1a1a1a] p-5 shadow-sm dark:shadow-none">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Desempenho Semanal</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Volume de vendas — últimos 7 dias</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-black rounded-md border border-gray-100 dark:border-[#1a1a1a]">
                            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                            <span className="text-[10px] font-medium text-gray-500 dark:text-[#555]">Receita Bruta</span>
                        </div>
                    </div>
                    <div className="h-32 flex items-end gap-2 px-1">
                        {weeklyData.map((d, i) => (
                            <div key={`chart-bar-${i}`} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-gray-50 dark:bg-black rounded-t group-hover:bg-gray-100 dark:group-hover:bg-[#111] cursor-help relative h-full flex items-end border border-gray-100 dark:border-[#1a1a1a] shadow-inner dark:shadow-none overflow-hidden">
                                    <div
                                        className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm transition-all duration-700 ease-out"
                                        style={{ height: `${d.amount > 0 ? Math.max((d.amount / maxAmount) * 100, 4) : 0}%` }}
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 font-medium border border-gray-800 dark:border-[#222] shadow-xl pointer-events-none transition-opacity">
                                        R$ {d.amount.toFixed(2)}
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 dark:text-[#555] capitalize">{new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-100 dark:border-[#1a1a1a] p-5 shadow-sm dark:shadow-none">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Formas de Pagamento</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Distribuição do total</p>
                    </div>
                    {paymentMethodTotals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-[#333]">
                            <ShoppingBag size={32} className="mb-3 opacity-30" />
                            <p className="text-sm font-medium text-center">Sem dados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paymentMethodTotals.map(([method, amount]) => {
                                const total = paymentMethodTotals.reduce((s, [,v]) => s + v, 0);
                                const pct = total > 0 ? (amount / total) * 100 : 0;
                                return (
                                    <div key={method} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${methodColor[method] || 'bg-gray-400'}`} />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-400">{methodLabel[method] || method}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">R$ {amount.toFixed(0)}</span>
                                        </div>
                                        <div className="h-1 bg-gray-100 dark:bg-black rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${methodColor[method] || 'bg-gray-400'} rounded-full transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-gray-100 dark:border-[#1a1a1a] overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Últimas Vendas</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">5 transações mais recentes</p>
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-[#666] flex items-center gap-1.5">
                        <span>Total geral</span>
                        <span className="text-gray-900 dark:text-gray-100 font-semibold">R$ {totalRevenue.toFixed(2)}</span>
                    </div>
                </div>
                {recentSales.length === 0 ? (
                    <div className="py-12 flex flex-col items-center text-gray-400 dark:text-[#333]">
                        <History size={32} className="mb-3 opacity-30" />
                        <p className="text-xs font-medium">Nenhuma venda registrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                        {recentSales.map((s, i) => (
                            <div key={s._id || i} className="px-5 py-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-black transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-md bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500 font-semibold text-xs">
                                        #{(sales.length - sales.indexOf(s)).toString().padStart(2, '0')}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{s.customerName || 'Cliente não identificado'}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-[#555] mt-0.5">
                                            {s.date ? new Date(s.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            {' · '}{(s.items || []).length} {(s.items || []).length === 1 ? 'item' : 'itens'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">R$ {(s.total || 0).toFixed(2)}</span>
                                    <ArrowUpRight size={14} className="text-gray-300 dark:text-[#333] group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
